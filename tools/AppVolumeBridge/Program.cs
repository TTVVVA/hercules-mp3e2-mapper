using System.Diagnostics;
using System.Globalization;
using System.IO.Pipes;
using System.Runtime.InteropServices;
using System.Text;
using System.Text.Json;
using NAudio.CoreAudioApi;
using NAudio.Wave;

internal sealed class Result
{
    public bool Ok { get; set; }
    public string? Error { get; set; }
    public int SessionsMatched { get; set; }
    public string? Process { get; set; }
    public float? Volume { get; set; }
    public List<AudioDeviceInfo>? Devices { get; set; }
    public List<AudioSessionInfo>? Sessions { get; set; }
    public string? DefaultDeviceId { get; set; }
    public bool? Running { get; set; }
    public string? SourceId { get; set; }
    public string? SourceName { get; set; }
    public string? TargetId { get; set; }
    public string? TargetName { get; set; }
    public bool? Listening { get; set; }
    public bool? Muted { get; set; }
}

internal sealed class AudioDeviceInfo
{
    public string Id { get; set; } = "";
    public string Name { get; set; } = "";
    public bool IsDefault { get; set; }
    public int SampleRate { get; set; }
    public int Channels { get; set; }
    public int BitsPerSample { get; set; }
    public string Encoding { get; set; } = "";
}

internal sealed class AudioSessionInfo
{
    public uint ProcessId { get; set; }
    public string? ProcessName { get; set; }
    public string? DisplayName { get; set; }
    public string? SessionIdentifier { get; set; }
    public string? State { get; set; }
    public bool IsSystemSounds { get; set; }
    public float Volume { get; set; }
    public bool Muted { get; set; }
}

internal sealed class RouterCommand
{
    public string? Action { get; set; }
    public float? Volume { get; set; }
}

internal static class Program
{
    private const string RouterPipeName = "HerculesIndependentAudioRouterV1";
    private const string HotkeyPipeName = "HerculesMapperHotkeyV1";
    private const byte VkMediaNextTrack = 0xB0;
    private const byte VkMediaPrevTrack = 0xB1;
    private const byte VkMediaPlayPause = 0xB3;
    private const byte VkControl = 0x11;
    private const byte VkShift = 0x10;
    private const byte VkAlt = 0x12;
    private const byte VkLWin = 0x5B;
    private const uint KeyeventfKeyup = 0x0002;
    private static readonly JsonSerializerOptions JsonOptions = new() { PropertyNameCaseInsensitive = true };
    private static readonly PropertyKey ListenTargetPropertyKey = new(new Guid("24DBB0FC-9311-4B3D-9CF0-18FF155639D4"), 0);
    private static readonly PropertyKey ListenEnabledPropertyKey = new(new Guid("24DBB0FC-9311-4B3D-9CF0-18FF155639D4"), 1);

    private static async Task<int> Main(string[] args)
    {
        try
        {
            if (args.Length == 0)
            {
                return WriteJson(new Result { Ok = false, Error = "Missing command." }, 1);
            }

            var command = args[0].Trim().ToLowerInvariant();
            return command switch
            {
                "set" => HandleSet(args.Skip(1).ToArray()),
                "get-process-volume" => HandleGetProcessVolume(args.Skip(1).ToArray()),
                "list-render-devices" => HandleListRenderDevices(),
                "set-default-render-device" => HandleSetDefaultRenderDevice(args.Skip(1).ToArray()),
                "set-render-device-volume" => HandleSetRenderDeviceVolume(args.Skip(1).ToArray()),
                "set-cable-monitor-volume" => HandleSetCableMonitorVolume(args.Skip(1).ToArray()),
                "set-cable-listen-session-volume" => HandleSetCableListenSessionVolume(args.Skip(1).ToArray()),
                "list-render-sessions" => HandleListRenderSessions(args.Skip(1).ToArray()),
                "toggle-process-mute" => HandleToggleProcessMute(args.Skip(1).ToArray()),
                "set-cable-listen" => HandleSetCableListen(args.Skip(1).ToArray()),
                "get-cable-listen-status" => HandleGetCableListenStatus(),
                "route-process-to-render-device" => HandleRouteProcessToRenderDevice(args.Skip(1).ToArray()),
                "monitor" => await RunMonitorAsync(args.Skip(1).ToArray()),
                "monitor-control" => await HandleMonitorControlAsync(args.Skip(1).ToArray()),
                "hotkey-server" => await RunHotkeyServerAsync(),
                "ping" => WriteJson(new Result { Ok = true }, 0),
                "media-play-pause" => HandleMediaKey(VkMediaPlayPause),
                "media-prev" => HandleMediaKey(VkMediaPrevTrack),
                "media-next" => HandleMediaKey(VkMediaNextTrack),
                "send-hotkey" => HandleSendHotkey(args.Skip(1).ToArray()),
                _ => WriteJson(new Result { Ok = false, Error = $"Unknown command: {command}" }, 1)
            };
        }
        catch (Exception ex)
        {
            return WriteJson(new Result { Ok = false, Error = ex.Message }, 1);
        }
    }

    private static int HandleMediaKey(byte virtualKey)
    {
        SendMediaKey(virtualKey);
        return WriteJson(new Result { Ok = true }, 0);
    }

    private static int HandleSet(string[] args)
    {
        string? processName = null;
        float? volume = null;

        for (var i = 0; i < args.Length; i++)
        {
            var token = args[i];
            if (token == "--process" && i + 1 < args.Length)
            {
                processName = args[++i];
                continue;
            }
            if (token == "--volume" && i + 1 < args.Length)
            {
                volume = ParseVolume(args[++i]);
            }
        }

        if (string.IsNullOrWhiteSpace(processName))
        {
            return WriteJson(new Result { Ok = false, Error = "Missing --process." }, 1);
        }
        if (volume is null)
        {
            return WriteJson(new Result { Ok = false, Error = "Missing --volume." }, 1);
        }

        var normalized = NormalizeProcessName(processName);
        var snappedVolume = SnapVolume(volume.Value);
        var matched = SetVolumeForProcessSessions(normalized, snappedVolume);

        if (matched == 0)
        {
            return WriteJson(new Result
            {
                Ok = false,
                Error = $"No active audio session found for process '{normalized}'.",
                SessionsMatched = 0,
                Process = normalized,
                Volume = snappedVolume
            }, 2);
        }

        return WriteJson(new Result
        {
            Ok = true,
            SessionsMatched = matched,
            Process = normalized,
            Volume = snappedVolume
        }, 0);
    }

    private static int HandleGetProcessVolume(string[] args)
    {
        var processName = GetOption(args, "--process");
        if (string.IsNullOrWhiteSpace(processName))
        {
            return WriteJson(new Result { Ok = false, Error = "Missing --process." }, 1);
        }

        var normalized = NormalizeProcessName(processName);
        var matches = GetVolumeForProcessSessions(normalized, out var volume, out var muted);
        if (matches == 0)
        {
            return WriteJson(new Result
            {
                Ok = false,
                Error = $"No active audio session found for process '{normalized}'.",
                SessionsMatched = 0,
                Process = normalized
            }, 2);
        }

        return WriteJson(new Result
        {
            Ok = true,
            SessionsMatched = matches,
            Process = normalized,
            Volume = volume,
            Muted = muted
        }, 0);
    }

    private static int HandleListRenderDevices()
    {
        using var enumerator = new MMDeviceEnumerator();
        string? defaultId = null;
        try
        {
            using var defaultDevice = enumerator.GetDefaultAudioEndpoint(DataFlow.Render, Role.Multimedia);
            defaultId = defaultDevice.ID;
        }
        catch
        {
            // A default playback device is not guaranteed while audio drivers are restarting.
        }

        var devices = new List<AudioDeviceInfo>();
        var collection = enumerator.EnumerateAudioEndPoints(DataFlow.Render, DeviceState.Active);
        foreach (var device in collection)
        {
            using (device)
            {
                devices.Add(new AudioDeviceInfo
                {
                    Id = device.ID,
                    Name = device.FriendlyName,
                    IsDefault = string.Equals(device.ID, defaultId, StringComparison.OrdinalIgnoreCase),
                    SampleRate = device.AudioClient.MixFormat.SampleRate,
                    Channels = device.AudioClient.MixFormat.Channels,
                    BitsPerSample = device.AudioClient.MixFormat.BitsPerSample,
                    Encoding = device.AudioClient.MixFormat.Encoding.ToString()
                });
            }
        }

        return WriteJson(new Result
        {
            Ok = true,
            Devices = devices.OrderBy(d => d.Name, StringComparer.CurrentCultureIgnoreCase).ToList(),
            DefaultDeviceId = defaultId
        }, 0);
    }

    private static int HandleSetDefaultRenderDevice(string[] args)
    {
        var deviceId = GetOption(args, "--device-id");
        if (string.IsNullOrWhiteSpace(deviceId))
        {
            return WriteJson(new Result { Ok = false, Error = "Missing --device-id." }, 1);
        }

        using var enumerator = new MMDeviceEnumerator();
        MMDevice? device = null;
        try
        {
            device = enumerator.GetDevice(deviceId);
            if (device.State != DeviceState.Active)
            {
                return WriteJson(new Result { Ok = false, Error = $"Playback device '{device.FriendlyName}' is not active." }, 1);
            }

            var policy = (IPolicyConfig)new PolicyConfigClient();
            foreach (var role in Enum.GetValues<PolicyConfigRole>())
            {
                Marshal.ThrowExceptionForHR(policy.SetDefaultEndpoint(device.ID, role));
            }

            return WriteJson(new Result
            {
                Ok = true,
                DefaultDeviceId = device.ID,
                SourceId = device.ID,
                SourceName = device.FriendlyName
            }, 0);
        }
        finally
        {
            device?.Dispose();
        }
    }

    private static int HandleSetRenderDeviceVolume(string[] args)
    {
        var deviceId = GetOption(args, "--device-id");
        var volume = ParseVolume(GetOption(args, "--volume"));
        if (string.IsNullOrWhiteSpace(deviceId))
        {
            return WriteJson(new Result { Ok = false, Error = "Missing --device-id." }, 1);
        }
        if (volume is null)
        {
            return WriteJson(new Result { Ok = false, Error = "Missing --volume." }, 1);
        }

        using var enumerator = new MMDeviceEnumerator();
        MMDevice? device = null;
        try
        {
            device = enumerator.GetDevice(deviceId);
            if (device.State != DeviceState.Active)
            {
                return WriteJson(new Result { Ok = false, Error = $"Playback device '{device.FriendlyName}' is not active." }, 1);
            }

            var level = Math.Clamp(volume.Value, 0f, 1f);
            device.AudioEndpointVolume.Mute = level <= 0.0001f;
            if (level > 0.0001f)
            {
                device.AudioEndpointVolume.MasterVolumeLevelScalar = level;
            }

            return WriteJson(new Result
            {
                Ok = true,
                Volume = level,
                TargetId = device.ID,
                TargetName = device.FriendlyName
            }, 0);
        }
        finally
        {
            device?.Dispose();
        }
    }

    private static int HandleListRenderSessions(string[] args)
    {
        var deviceId = GetOption(args, "--device-id");
        using var enumerator = new MMDeviceEnumerator();
        using var device = string.IsNullOrWhiteSpace(deviceId)
            ? enumerator.GetDefaultAudioEndpoint(DataFlow.Render, Role.Multimedia)
            : enumerator.GetDevice(deviceId);
        var sessions = new List<AudioSessionInfo>();
        var audioSessions = device.AudioSessionManager.Sessions;

        for (var i = 0; i < audioSessions.Count; i++)
        {
            using var session = audioSessions[i];
            if (session is null) continue;

            var processId = session.GetProcessID;
            string? processName = null;
            if (processId > 0)
            {
                try { processName = Process.GetProcessById((int)processId).ProcessName; }
                catch { /* A session may outlive the process which created it. */ }
            }

            sessions.Add(new AudioSessionInfo
            {
                ProcessId = processId,
                ProcessName = processName,
                DisplayName = session.DisplayName,
                SessionIdentifier = session.GetSessionIdentifier,
                State = session.State.ToString(),
                IsSystemSounds = session.IsSystemSoundsSession,
                Volume = session.SimpleAudioVolume.Volume,
                Muted = session.SimpleAudioVolume.Mute
            });
        }

        return WriteJson(new Result
        {
            Ok = true,
            TargetId = device.ID,
            TargetName = device.FriendlyName,
            Sessions = sessions
        }, 0);
    }

    private static int HandleSetCableListenSessionVolume(string[] args)
    {
        var volume = ParseVolume(GetOption(args, "--volume"));
        var targetId = GetOption(args, "--target-id");
        if (volume is null)
        {
            return WriteJson(new Result { Ok = false, Error = "Missing --volume." }, 1);
        }
        if (string.IsNullOrWhiteSpace(targetId))
        {
            return WriteJson(new Result { Ok = false, Error = "Missing --target-id." }, 1);
        }

        using var enumerator = new MMDeviceEnumerator();
        using var device = enumerator.GetDevice(targetId);
        var sessions = device.AudioSessionManager.Sessions;
        var level = Math.Clamp(volume.Value, 0f, 1f);

        for (var i = 0; i < sessions.Count; i++)
        {
            using var session = sessions[i];
            if (session is null) continue;

            var isCableListenSession =
                session.DisplayName.Contains("CABLE Output", StringComparison.OrdinalIgnoreCase) ||
                session.GetSessionIdentifier.Contains("%b{35B782D1-09FD-4C86-BDCA-6B71B4F89DD8}", StringComparison.OrdinalIgnoreCase);
            if (!isCableListenSession) continue;

            session.SimpleAudioVolume.Mute = level <= 0.0001f;
            if (level > 0.0001f)
            {
                session.SimpleAudioVolume.Volume = level;
            }

            return WriteJson(new Result
            {
                Ok = true,
                Volume = level,
                TargetId = device.ID,
                TargetName = device.FriendlyName,
                SourceName = "CABLE Output"
            }, 0);
        }

        return WriteJson(new Result
        {
            Ok = false,
            Error = "A sessão de monitorização CABLE Output não está disponível. Ative 'Escutar CABLE nos phones' e reproduza áudio."
        }, 2);
    }

    private static int HandleToggleProcessMute(string[] args)
    {
        var processName = GetOption(args, "--process");
        if (string.IsNullOrWhiteSpace(processName))
        {
            return WriteJson(new Result { Ok = false, Error = "Missing --process." }, 1);
        }

        var hasMatchingSession = false;
        var shouldMute = false;
        using var enumerator = new MMDeviceEnumerator();
        var devices = enumerator.EnumerateAudioEndPoints(DataFlow.Render, DeviceState.Active);

        // A aplicação pode estar encaminhada para um dispositivo que não é o
        // predefinido (o Discord está nos Corsair). Procura em todos eles.
        foreach (var device in devices)
        {
            using (device)
            {
                var sessions = device.AudioSessionManager.Sessions;
                for (var i = 0; i < sessions.Count; i++)
                {
                    using var session = sessions[i];
                    if (session is null || session.GetProcessID <= 0) continue;
                    string? sessionProcessName;
                    try { sessionProcessName = Process.GetProcessById((int)session.GetProcessID).ProcessName; }
                    catch { continue; }
                    if (!string.Equals(sessionProcessName, processName, StringComparison.OrdinalIgnoreCase)) continue;

                    hasMatchingSession = true;
                    if (!session.SimpleAudioVolume.Mute) shouldMute = true;
                }
            }
        }

        if (!hasMatchingSession)
        {
            return WriteJson(new Result { Ok = false, Error = $"Nenhuma sessão de áudio ativa para {processName}." }, 2);
        }

        var sessionsChanged = 0;
        foreach (var device in enumerator.EnumerateAudioEndPoints(DataFlow.Render, DeviceState.Active))
        {
            using (device)
            {
                var sessions = device.AudioSessionManager.Sessions;
                for (var i = 0; i < sessions.Count; i++)
                {
                    using var session = sessions[i];
                    if (session is null || session.GetProcessID <= 0) continue;
                    string? sessionProcessName;
                    try { sessionProcessName = Process.GetProcessById((int)session.GetProcessID).ProcessName; }
                    catch { continue; }
                    if (!string.Equals(sessionProcessName, processName, StringComparison.OrdinalIgnoreCase)) continue;

                    session.SimpleAudioVolume.Mute = shouldMute;
                    sessionsChanged++;
                }
            }
        }

        return WriteJson(new Result
        {
            Ok = sessionsChanged > 0,
            Process = processName,
            SessionsMatched = sessionsChanged,
            Muted = shouldMute
        }, sessionsChanged > 0 ? 0 : 2);
    }

    private static int HandleSetCableMonitorVolume(string[] args)
    {
        var volume = ParseVolume(GetOption(args, "--volume"));
        if (volume is null)
        {
            return WriteJson(new Result { Ok = false, Error = "Missing --volume." }, 1);
        }

        using var enumerator = new MMDeviceEnumerator();
        MMDevice? cableOutput = null;
        try
        {
            var captureDevices = enumerator.EnumerateAudioEndPoints(DataFlow.Capture, DeviceState.Active);
            foreach (var candidate in captureDevices)
            {
                if (candidate.FriendlyName.Contains("CABLE Output", StringComparison.OrdinalIgnoreCase))
                {
                    cableOutput = candidate;
                    break;
                }
                candidate.Dispose();
            }
            if (cableOutput is null)
            {
                return WriteJson(new Result { Ok = false, Error = "CABLE Output (VB-Audio Virtual Cable) não foi encontrado." }, 1);
            }

            var level = Math.Clamp(volume.Value, 0f, 1f);
            cableOutput.AudioEndpointVolume.Mute = level <= 0.0001f;
            if (level > 0.0001f)
            {
                cableOutput.AudioEndpointVolume.MasterVolumeLevelScalar = level;
            }

            return WriteJson(new Result
            {
                Ok = true,
                Volume = level,
                SourceId = cableOutput.ID,
                SourceName = cableOutput.FriendlyName
            }, 0);
        }
        finally
        {
            cableOutput?.Dispose();
        }
    }

    private static int HandleSetCableListen(string[] args)
    {
        var enableValue = GetOption(args, "--enabled");
        var targetId = GetOption(args, "--target-id");
        if (!bool.TryParse(enableValue, out var enabled))
        {
            return WriteJson(new Result { Ok = false, Error = "Missing or invalid --enabled." }, 1);
        }
        if (enabled && string.IsNullOrWhiteSpace(targetId))
        {
            return WriteJson(new Result { Ok = false, Error = "Missing --target-id for enabled listening." }, 1);
        }

        using var enumerator = new MMDeviceEnumerator();
        MMDevice? captureDevice = null;
        MMDevice? targetDevice = null;
        try
        {
            var captureDevices = enumerator.EnumerateAudioEndPoints(DataFlow.Capture, DeviceState.Active);
            foreach (var candidate in captureDevices)
            {
                if (candidate.FriendlyName.Contains("CABLE Output", StringComparison.OrdinalIgnoreCase))
                {
                    captureDevice = candidate;
                    break;
                }
                candidate.Dispose();
            }
            if (captureDevice is null)
            {
                return WriteJson(new Result { Ok = false, Error = "CABLE Output (VB-Audio Virtual Cable) não foi encontrado." }, 1);
            }

            if (enabled)
            {
                targetDevice = enumerator.GetDevice(targetId!);
                if (targetDevice.State != DeviceState.Active)
                {
                    return WriteJson(new Result { Ok = false, Error = $"Playback device '{targetDevice.FriendlyName}' is not active." }, 1);
                }
            }

            SetListenToDevice(captureDevice.ID, enabled ? targetDevice!.ID : null, enabled);
            return WriteJson(new Result
            {
                Ok = true,
                Listening = enabled,
                SourceId = captureDevice.ID,
                SourceName = captureDevice.FriendlyName,
                TargetId = targetDevice?.ID,
                TargetName = targetDevice?.FriendlyName
            }, 0);
        }
        finally
        {
            targetDevice?.Dispose();
            captureDevice?.Dispose();
        }
    }

    private static int HandleGetCableListenStatus()
    {
        using var enumerator = new MMDeviceEnumerator();
        MMDevice? captureDevice = null;
        MMDevice? targetDevice = null;
        try
        {
            var captureDevices = enumerator.EnumerateAudioEndPoints(DataFlow.Capture, DeviceState.Active);
            foreach (var candidate in captureDevices)
            {
                if (candidate.FriendlyName.Contains("CABLE Output", StringComparison.OrdinalIgnoreCase))
                {
                    captureDevice = candidate;
                    break;
                }
                candidate.Dispose();
            }
            if (captureDevice is null)
            {
                return WriteJson(new Result { Ok = false, Error = "CABLE Output (VB-Audio Virtual Cable) não foi encontrado." }, 1);
            }

            var settings = GetListenToDeviceSettings(captureDevice.ID);
            if (!string.IsNullOrWhiteSpace(settings.TargetId))
            {
                try { targetDevice = enumerator.GetDevice(settings.TargetId); }
                catch { /* The saved device can be disconnected. */ }
            }

            return WriteJson(new Result
            {
                Ok = true,
                Listening = settings.Enabled,
                SourceId = captureDevice.ID,
                SourceName = captureDevice.FriendlyName,
                TargetId = settings.TargetId,
                TargetName = targetDevice?.FriendlyName
            }, 0);
        }
        finally
        {
            targetDevice?.Dispose();
            captureDevice?.Dispose();
        }
    }

    private static IMMDeviceEnumeratorNative CreateNativeDeviceEnumerator()
    {
        var nativeType = Type.GetTypeFromCLSID(new Guid("BCDE0395-E52F-467C-8E3D-C4579291692E"))
            ?? throw new InvalidOperationException("Windows audio device enumerator is unavailable.");
        var nativeObject = Activator.CreateInstance(nativeType)
            ?? throw new InvalidOperationException("Windows audio device enumerator could not be created.");
        return (IMMDeviceEnumeratorNative)nativeObject;
    }

    private static void SetListenToDevice(string captureDeviceId, string? targetDeviceId, bool enabled)
    {
        IMMDeviceEnumeratorNative? enumerator = null;
        IMMDeviceNative? captureDevice = null;
        IPropertyStoreNative? propertyStore = null;
        try
        {
            enumerator = CreateNativeDeviceEnumerator();
            Marshal.ThrowExceptionForHR(enumerator.GetDevice(captureDeviceId, out captureDevice));
            Marshal.ThrowExceptionForHR(captureDevice.OpenPropertyStore(StorageAccessMode.ReadWrite, out propertyStore));

            if (enabled)
            {
                var targetKey = ListenTargetPropertyKey;
                var targetValue = PropVariant.FromString(targetDeviceId!);
                try
                {
                    Marshal.ThrowExceptionForHR(propertyStore.SetValue(ref targetKey, ref targetValue));
                }
                finally
                {
                    targetValue.Dispose();
                }
            }

            var checkboxKey = ListenEnabledPropertyKey;
            var checkboxValue = PropVariant.FromBool(enabled);
            try
            {
                Marshal.ThrowExceptionForHR(propertyStore.SetValue(ref checkboxKey, ref checkboxValue));
                Marshal.ThrowExceptionForHR(propertyStore.Commit());
            }
            finally
            {
                checkboxValue.Dispose();
            }
        }
        finally
        {
            if (propertyStore is not null) Marshal.ReleaseComObject(propertyStore);
            if (captureDevice is not null) Marshal.ReleaseComObject(captureDevice);
            if (enumerator is not null) Marshal.ReleaseComObject(enumerator);
        }
    }

    private static (bool Enabled, string? TargetId) GetListenToDeviceSettings(string captureDeviceId)
    {
        IMMDeviceEnumeratorNative? enumerator = null;
        IMMDeviceNative? captureDevice = null;
        IPropertyStoreNative? propertyStore = null;
        try
        {
            enumerator = CreateNativeDeviceEnumerator();
            Marshal.ThrowExceptionForHR(enumerator.GetDevice(captureDeviceId, out captureDevice));
            Marshal.ThrowExceptionForHR(captureDevice.OpenPropertyStore(StorageAccessMode.Read, out propertyStore));

            var targetKey = ListenTargetPropertyKey;
            Marshal.ThrowExceptionForHR(propertyStore.GetValue(ref targetKey, out var targetValue));
            var checkboxKey = ListenEnabledPropertyKey;
            Marshal.ThrowExceptionForHR(propertyStore.GetValue(ref checkboxKey, out var checkboxValue));
            try
            {
                return (checkboxValue.BoolValue, targetValue.StringValue);
            }
            finally
            {
                checkboxValue.Dispose();
                targetValue.Dispose();
            }
        }
        finally
        {
            if (propertyStore is not null) Marshal.ReleaseComObject(propertyStore);
            if (captureDevice is not null) Marshal.ReleaseComObject(captureDevice);
            if (enumerator is not null) Marshal.ReleaseComObject(enumerator);
        }
    }

    private static int HandleRouteProcessToRenderDevice(string[] args)
    {
        var processName = GetOption(args, "--process");
        var deviceId = GetOption(args, "--device-id");
        var clearRoute = args.Any(token => string.Equals(token, "--clear", StringComparison.OrdinalIgnoreCase));
        if (string.IsNullOrWhiteSpace(processName))
        {
            return WriteJson(new Result { Ok = false, Error = "Missing --process." }, 1);
        }
        if (!clearRoute && string.IsNullOrWhiteSpace(deviceId))
        {
            return WriteJson(new Result { Ok = false, Error = "Missing --device-id." }, 1);
        }

        var normalizedProcess = NormalizeProcessName(processName);
        string? deviceName = null;
        if (!clearRoute)
        {
            using var enumerator = new MMDeviceEnumerator();
            MMDevice? device = null;
            try
            {
                device = enumerator.GetDevice(deviceId!);
                if (device.State != DeviceState.Active)
                {
                    return WriteJson(new Result { Ok = false, Error = $"Playback device '{device.FriendlyName}' is not active." }, 1);
                }
                deviceName = device.FriendlyName;
            }
            catch (Exception ex)
            {
                return WriteJson(new Result { Ok = false, Error = $"Playback device not found: {ex.Message}" }, 1);
            }
            finally
            {
                device?.Dispose();
            }
        }

        var pids = new HashSet<int>();
        foreach (var process in Process.GetProcessesByName(normalizedProcess))
        {
            try
            {
                pids.Add(process.Id);
            }
            finally
            {
                process.Dispose();
            }
        }

        if (pids.Count == 0)
        {
            return WriteJson(new Result
            {
                Ok = false,
                Error = $"The process '{normalizedProcess}' is not running.",
                Process = normalizedProcess
            }, 2);
        }

        var failures = new List<string>();
        var applied = 0;
        foreach (var pid in pids)
        {
            try
            {
                SetPersistedRenderEndpoint((uint)pid, clearRoute ? null : deviceId);
                applied++;
            }
            catch (Exception ex)
            {
                failures.Add($"PID {pid}: {DescribeException(ex)}");
            }
        }

        return WriteJson(new Result
        {
            Ok = applied > 0,
            Error = applied > 0 ? null : string.Join(" | ", failures),
            SessionsMatched = applied,
            Process = normalizedProcess,
            SourceId = clearRoute ? null : deviceId,
            SourceName = clearRoute ? "Default Windows output" : deviceName
        }, applied > 0 ? 0 : 2);
    }

    private static async Task<int> RunMonitorAsync(string[] args)
    {
        // Fase 1: router WASAPI antigo bloqueado por defeito. A rota estavel e feita
        // pelo Windows ("Ouvir este dispositivo"). Reativar so com HERCULES_ALLOW_LEGACY_ROUTER=1.
        if (Environment.GetEnvironmentVariable("HERCULES_ALLOW_LEGACY_ROUTER") != "1")
        {
            return WriteJson(new Result
            {
                Ok = false,
                Error = "O router WASAPI antigo esta desativado. A rota estavel e feita pelo Windows (Ouvir este dispositivo)."
            }, 3);
        }

        var sourceId = GetOption(args, "--source-id");
        var targetId = GetOption(args, "--target-id");
        var requestedVolume = ParseVolume(GetOption(args, "--volume")) ?? 0.75f;

        if (string.IsNullOrWhiteSpace(sourceId) || string.IsNullOrWhiteSpace(targetId))
        {
            return WriteJson(new Result { Ok = false, Error = "Missing --source-id or --target-id." }, 1);
        }
        if (string.Equals(sourceId, targetId, StringComparison.OrdinalIgnoreCase))
        {
            return WriteJson(new Result { Ok = false, Error = "A fonte da transmissao e os auscultadores nao podem ser o mesmo dispositivo." }, 1);
        }
        if (IsRouterAlreadyRunning())
        {
            return WriteJson(new Result { Ok = false, Error = "O router de audio ja esta em execucao." }, 2);
        }

        using var router = new IndependentAudioRouter(sourceId, targetId, requestedVolume);
        using var shutdown = new CancellationTokenSource();
        ConsoleCancelEventHandler? cancelHandler = (_, eventArgs) =>
        {
            eventArgs.Cancel = true;
            shutdown.Cancel();
        };
        Console.CancelKeyPress += cancelHandler;

        try
        {
            router.Start();
            WriteJson(new Result
            {
                Ok = true,
                Running = true,
                Volume = router.PersonalVolume,
                SourceId = router.SourceId,
                SourceName = router.SourceName,
                TargetId = router.TargetId,
                TargetName = router.TargetName
            }, 0);

            while (!shutdown.IsCancellationRequested)
            {
                using var server = new NamedPipeServerStream(
                    RouterPipeName,
                    PipeDirection.InOut,
                    1,
                    PipeTransmissionMode.Byte,
                    PipeOptions.Asynchronous);

                try
                {
                    await server.WaitForConnectionAsync(shutdown.Token);
                    using var reader = new StreamReader(server, Encoding.UTF8, false, 1024, leaveOpen: true);
                    using var writer = new StreamWriter(server, new UTF8Encoding(false), 1024, leaveOpen: true) { AutoFlush = true };
                    var line = await reader.ReadLineAsync(shutdown.Token);
                    var request = string.IsNullOrWhiteSpace(line)
                        ? null
                        : JsonSerializer.Deserialize<RouterCommand>(line, JsonOptions);
                    var response = HandleRouterCommand(router, request, shutdown);
                    await writer.WriteLineAsync(JsonSerializer.Serialize(response));
                }
                catch (OperationCanceledException) when (shutdown.IsCancellationRequested)
                {
                    break;
                }
                catch (Exception ex)
                {
                    // A failed client connection should not stop the active audio path.
                    Debug.WriteLine(ex);
                }
            }
        }
        finally
        {
            Console.CancelKeyPress -= cancelHandler;
        }

        return 0;
    }

    private static Result HandleRouterCommand(IndependentAudioRouter router, RouterCommand? request, CancellationTokenSource shutdown)
    {
        var action = request?.Action?.Trim().ToLowerInvariant();
        if (action == "status")
        {
            return router.ToResult();
        }
        if (action == "set-volume")
        {
            if (request?.Volume is null)
            {
                return new Result { Ok = false, Error = "Missing volume." };
            }
            router.SetPersonalVolume(request.Volume.Value);
            return router.ToResult();
        }
        if (action == "stop")
        {
            shutdown.Cancel();
            var result = router.ToResult();
            result.Running = false;
            return result;
        }

        return new Result { Ok = false, Error = "Unknown router action." };
    }

    private static async Task<int> HandleMonitorControlAsync(string[] args)
    {
        var action = GetOption(args, "--action")?.Trim().ToLowerInvariant();
        var volume = ParseVolume(GetOption(args, "--volume"));
        if (string.IsNullOrWhiteSpace(action))
        {
            return WriteJson(new Result { Ok = false, Error = "Missing --action." }, 1);
        }

        try
        {
            using var client = new NamedPipeClientStream(".", RouterPipeName, PipeDirection.InOut, PipeOptions.Asynchronous);
            await client.ConnectAsync(900);
            using var writer = new StreamWriter(client, new UTF8Encoding(false), 1024, leaveOpen: true) { AutoFlush = true };
            using var reader = new StreamReader(client, Encoding.UTF8, false, 1024, leaveOpen: true);
            await writer.WriteLineAsync(JsonSerializer.Serialize(new RouterCommand { Action = action, Volume = volume }));
            var responseTask = reader.ReadLineAsync();
            if (await Task.WhenAny(responseTask, Task.Delay(1200)) != responseTask)
            {
                return WriteJson(new Result { Ok = false, Error = "O router de audio nao esta em execucao.", Running = false }, 2);
            }
            var responseLine = await responseTask;
            if (string.IsNullOrWhiteSpace(responseLine))
            {
                return WriteJson(new Result { Ok = false, Error = "O router nao devolveu resposta." }, 2);
            }

            Console.OutputEncoding = Encoding.UTF8;
            Console.WriteLine(responseLine);
            using var response = JsonDocument.Parse(responseLine);
            var ok = response.RootElement.TryGetProperty("Ok", out var okProperty) && okProperty.GetBoolean();
            return ok ? 0 : 2;
        }
        catch
        {
            return WriteJson(new Result { Ok = false, Error = "O router de audio nao esta em execucao.", Running = false }, 2);
        }
    }

    private static bool IsRouterAlreadyRunning()
    {
        try
        {
            using var client = new NamedPipeClientStream(".", RouterPipeName, PipeDirection.InOut, PipeOptions.Asynchronous);
            client.Connect(100);
            return client.IsConnected;
        }
        catch
        {
            return false;
        }
    }

    private static async Task<int> RunHotkeyServerAsync()
    {
        while (true)
        {
            using var server = new NamedPipeServerStream(
                HotkeyPipeName,
                PipeDirection.InOut,
                1,
                PipeTransmissionMode.Byte,
                PipeOptions.Asynchronous);

            try
            {
                await server.WaitForConnectionAsync();
                using var reader = new StreamReader(server, Encoding.UTF8, false, 256, leaveOpen: true);
                using var writer = new StreamWriter(server, new UTF8Encoding(false), 256, leaveOpen: true) { AutoFlush = true };
                var combo = (await reader.ReadLineAsync())?.Trim();
                if (string.IsNullOrWhiteSpace(combo))
                {
                    await writer.WriteLineAsync(JsonSerializer.Serialize(new Result { Ok = false, Error = "Atalho vazio." }));
                    continue;
                }

                SendHotkeyCombo(ParseHotkeyCombo(combo));
                await writer.WriteLineAsync(JsonSerializer.Serialize(new Result { Ok = true }));
            }
            catch (Exception ex)
            {
                try
                {
                    if (server.IsConnected)
                    {
                        using var writer = new StreamWriter(server, new UTF8Encoding(false), 256, leaveOpen: true) { AutoFlush = true };
                        await writer.WriteLineAsync(JsonSerializer.Serialize(new Result { Ok = false, Error = ex.Message }));
                    }
                }
                catch
                {
                    // The client may have closed after an invalid hotkey.
                }
            }
        }
    }

    private static int HandleSendHotkey(string[] args)
    {
        var combo = GetOption(args, "--keys");
        if (string.IsNullOrWhiteSpace(combo))
        {
            return WriteJson(new Result { Ok = false, Error = "Missing --keys." }, 1);
        }

        SendHotkeyCombo(ParseHotkeyCombo(combo));
        return WriteJson(new Result { Ok = true }, 0);
    }

    private static string? GetOption(string[] args, string option)
    {
        for (var i = 0; i < args.Length - 1; i++)
        {
            if (string.Equals(args[i], option, StringComparison.OrdinalIgnoreCase))
            {
                return args[i + 1];
            }
        }
        return null;
    }

    private static float? ParseVolume(string? value)
    {
        if (value is null) return null;
        return float.TryParse(value, NumberStyles.Float, CultureInfo.InvariantCulture, out var parsed)
            ? Math.Clamp(parsed, 0f, 1f)
            : null;
    }

    private static string NormalizeProcessName(string processName)
    {
        var value = processName.Trim();
        if (value.EndsWith(".exe", StringComparison.OrdinalIgnoreCase))
        {
            value = value[..^4];
        }
        return value;
    }

    private static float SnapVolume(float volume)
    {
        var value = Math.Clamp(volume, 0f, 1f);
        if (value <= 0.005f) return 0f;
        if (value >= 0.995f) return 1f;
        return value;
    }

    private static string DescribeException(Exception error)
    {
        if (error is AggregateException aggregate)
        {
            return string.Join(" -> ", aggregate.Flatten().InnerExceptions.Select(DescribeException));
        }

        var hresult = $" (0x{error.HResult:X8})";
        return error.InnerException is null
            ? error.Message + hresult
            : error.Message + hresult + " -> " + DescribeException(error.InnerException);
    }

    private static List<byte> ParseHotkeyCombo(string combo)
    {
        var tokens = combo
            .Split('+', StringSplitOptions.TrimEntries | StringSplitOptions.RemoveEmptyEntries)
            .Where(token => !string.IsNullOrWhiteSpace(token))
            .ToArray();

        if (tokens.Length == 0)
        {
            throw new InvalidOperationException("Hotkey vazio.");
        }

        return tokens.Select(ParseVirtualKeyToken).ToList();
    }

    private static byte ParseVirtualKeyToken(string token)
    {
        var upper = token.Trim().ToUpperInvariant();
        return upper switch
        {
            "CTRL" or "CONTROL" => VkControl,
            "SHIFT" => VkShift,
            "ALT" => VkAlt,
            "WIN" or "WINDOWS" or "META" => VkLWin,
            "SPACE" => 0x20,
            "TAB" => 0x09,
            "ENTER" or "RETURN" => 0x0D,
            "ESC" or "ESCAPE" => 0x1B,
            "LEFT" => 0x25,
            "UP" => 0x26,
            "RIGHT" => 0x27,
            "DOWN" => 0x28,
            _ => ParseNonNamedKey(upper)
        };
    }

    private static byte ParseNonNamedKey(string upper)
    {
        if (upper.Length == 1 && ((upper[0] is >= 'A' and <= 'Z') || (upper[0] is >= '0' and <= '9')))
        {
            return (byte)upper[0];
        }

        if (upper.StartsWith("F", StringComparison.OrdinalIgnoreCase) &&
            int.TryParse(upper[1..], NumberStyles.Integer, CultureInfo.InvariantCulture, out var fn) &&
            fn >= 1 && fn <= 24)
        {
            return (byte)(0x70 + (fn - 1));
        }

        throw new InvalidOperationException($"Tecla nao suportada: {upper}");
    }

    private static int SetVolumeForProcessSessions(string processName, float volume)
    {
        var count = 0;
        using var enumerator = new MMDeviceEnumerator();
        var devices = enumerator.EnumerateAudioEndPoints(DataFlow.Render, DeviceState.Active);
        foreach (var device in devices)
        {
            using (device)
            {
                var sessions = device.AudioSessionManager.Sessions;
                for (var i = 0; i < sessions.Count; i++)
                {
                    using var session = sessions[i];
                    if (session is null) continue;

                    var pid = (int)session.GetProcessID;
                    if (pid <= 0) continue;

                    string? sessionProcessName;
                    try
                    {
                        using var process = Process.GetProcessById(pid);
                        sessionProcessName = process.ProcessName;
                    }
                    catch
                    {
                        continue;
                    }

                    if (!string.Equals(sessionProcessName, processName, StringComparison.OrdinalIgnoreCase)) continue;

                    session.SimpleAudioVolume.Volume = volume;
                    session.SimpleAudioVolume.Mute = volume <= 0.0001f;
                    count++;
                }
            }
        }

        return count;
    }

    private static int GetVolumeForProcessSessions(string processName, out float volume, out bool muted)
    {
        var values = new List<float>();
        var allMuted = true;
        using var enumerator = new MMDeviceEnumerator();
        var devices = enumerator.EnumerateAudioEndPoints(DataFlow.Render, DeviceState.Active);
        foreach (var device in devices)
        {
            using (device)
            {
                var sessions = device.AudioSessionManager.Sessions;
                for (var i = 0; i < sessions.Count; i++)
                {
                    using var session = sessions[i];
                    if (session is null) continue;

                    var pid = (int)session.GetProcessID;
                    if (pid <= 0) continue;

                    string? sessionProcessName;
                    try
                    {
                        using var process = Process.GetProcessById(pid);
                        sessionProcessName = process.ProcessName;
                    }
                    catch
                    {
                        continue;
                    }

                    if (!string.Equals(sessionProcessName, processName, StringComparison.OrdinalIgnoreCase)) continue;

                    values.Add(session.SimpleAudioVolume.Volume);
                    if (!session.SimpleAudioVolume.Mute) allMuted = false;
                }
            }
        }

        volume = values.Count == 0 ? 0f : values.Average();
        muted = values.Count > 0 && allMuted;
        return values.Count;
    }

    // This uses the per-application output policy exposed by Windows. The interop
    // shape is adapted from EarTrumpet (MIT; attribution in THIRD_PARTY_NOTICES.md).
    private static void SetPersistedRenderEndpoint(uint processId, string? endpointId)
    {
        IntPtr hstring = IntPtr.Zero;
        try
        {
            if (!string.IsNullOrWhiteSpace(endpointId))
            {
                var packedDeviceId = $"\\\\?\\SWD#MMDEVAPI#{endpointId}#{{e6327cad-dcec-4949-ae8a-991e976a79d2}}";
                NativeAudioPolicy.WindowsCreateString(packedDeviceId, (uint)packedDeviceId.Length, out hstring);
            }

            Exception? latestError = null;
            try
            {
                var iid = typeof(IAudioPolicyConfigFactoryFor21H2).GUID;
                var factoryObject = GetAudioPolicyFactory(ref iid);
                var factory = (IAudioPolicyConfigFactoryFor21H2)factoryObject;
                Marshal.ThrowExceptionForHR(factory.SetPersistedDefaultAudioEndpoint(processId, AudioPolicyDataFlow.Render, AudioPolicyRole.Multimedia, hstring));
                Marshal.ThrowExceptionForHR(factory.SetPersistedDefaultAudioEndpoint(processId, AudioPolicyDataFlow.Render, AudioPolicyRole.Console, hstring));
                return;
            }
            catch (Exception ex)
            {
                latestError = ex;
            }

            try
            {
                var iid = typeof(IAudioPolicyConfigFactoryForDownlevel).GUID;
                var factoryObject = GetAudioPolicyFactory(ref iid);
                var factory = (IAudioPolicyConfigFactoryForDownlevel)factoryObject;
                Marshal.ThrowExceptionForHR(factory.SetPersistedDefaultAudioEndpoint(processId, AudioPolicyDataFlow.Render, AudioPolicyRole.Multimedia, hstring));
                Marshal.ThrowExceptionForHR(factory.SetPersistedDefaultAudioEndpoint(processId, AudioPolicyDataFlow.Render, AudioPolicyRole.Console, hstring));
                return;
            }
            catch (Exception ex)
            {
                throw new InvalidOperationException("Windows did not accept the per-application audio route.", new AggregateException(latestError!, ex));
            }
        }
        finally
        {
            if (hstring != IntPtr.Zero)
            {
                NativeAudioPolicy.WindowsDeleteString(hstring);
            }
        }
    }

    private static object GetAudioPolicyFactory(ref Guid iid)
    {
        const string activationClass = "Windows.Media.Internal.AudioPolicyConfig";
        IntPtr activationClassHstring = IntPtr.Zero;
        try
        {
            NativeAudioPolicy.WindowsCreateString(activationClass, (uint)activationClass.Length, out activationClassHstring);
            NativeAudioPolicy.RoGetActivationFactory(activationClassHstring, ref iid, out var factoryPointer);
            try
            {
                return Marshal.GetObjectForIUnknown(factoryPointer);
            }
            finally
            {
                if (factoryPointer != IntPtr.Zero)
                {
                    Marshal.Release(factoryPointer);
                }
            }
        }
        finally
        {
            if (activationClassHstring != IntPtr.Zero)
            {
                NativeAudioPolicy.WindowsDeleteString(activationClassHstring);
            }
        }
    }

    private static int WriteJson(Result result, int exitCode)
    {
        Console.OutputEncoding = Encoding.UTF8;
        Console.WriteLine(JsonSerializer.Serialize(result));
        return exitCode;
    }

    private static void SendMediaKey(byte virtualKey)
    {
        keybd_event(virtualKey, 0, 0, UIntPtr.Zero);
        Thread.Sleep(12);
        keybd_event(virtualKey, 0, KeyeventfKeyup, UIntPtr.Zero);
    }

    private static void SendHotkeyCombo(IReadOnlyList<byte> virtualKeys)
    {
        foreach (var key in virtualKeys)
        {
            keybd_event(key, 0, 0, UIntPtr.Zero);
            Thread.Sleep(6);
        }

        Thread.Sleep(18);

        for (var index = virtualKeys.Count - 1; index >= 0; index--)
        {
            keybd_event(virtualKeys[index], 0, KeyeventfKeyup, UIntPtr.Zero);
            Thread.Sleep(6);
        }
    }

    [DllImport("user32.dll", SetLastError = true)]
    private static extern void keybd_event(byte bVk, byte bScan, uint dwFlags, UIntPtr dwExtraInfo);
}

[ComImport]
[Guid("A95664D2-9614-4F35-A746-DE8DB63617E6")]
[InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
internal interface IMMDeviceEnumeratorNative
{
    int EnumAudioEndpoints(int dataFlow, uint stateMask, out IntPtr devices);
    int GetDefaultAudioEndpoint(int dataFlow, int role, out IMMDeviceNative device);
    int GetDevice([MarshalAs(UnmanagedType.LPWStr)] string deviceId, out IMMDeviceNative device);
    int RegisterEndpointNotificationCallback(IntPtr notificationClient);
    int UnregisterEndpointNotificationCallback(IntPtr notificationClient);
}

[ComImport]
[Guid("D666063F-1587-4E43-81F1-B948E807363F")]
[InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
internal interface IMMDeviceNative
{
    int Activate(ref Guid interfaceId, uint classContext, IntPtr activationParameters, out IntPtr interfacePointer);
    int OpenPropertyStore(StorageAccessMode accessMode, out IPropertyStoreNative propertyStore);
    int GetId([MarshalAs(UnmanagedType.LPWStr)] out string deviceId);
    int GetState(out uint state);
}

[ComImport]
[Guid("886D8EEB-8CF2-4446-8D02-CDBA1DBDCF99")]
[InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
internal interface IPropertyStoreNative
{
    int GetCount(out uint propertyCount);
    int GetAt(uint index, out PropertyKey key);
    int GetValue(ref PropertyKey key, out PropVariant value);
    int SetValue(ref PropertyKey key, ref PropVariant value);
    int Commit();
}

[ComImport]
[Guid("BCDE0395-E52F-467C-8E3D-C4579291692E")]
internal class MMDeviceEnumeratorNativeComObject
{
}

internal enum StorageAccessMode : uint
{
    Read = 0,
    Write = 1,
    ReadWrite = 2
}

[StructLayout(LayoutKind.Sequential, Pack = 4)]
internal struct PropertyKey
{
    public PropertyKey(Guid formatId, uint propertyId)
    {
        FormatId = formatId;
        PropertyId = propertyId;
    }

    public Guid FormatId;
    public uint PropertyId;
}

[StructLayout(LayoutKind.Explicit)]
internal struct PropVariant : IDisposable
{
    private const ushort VariantEmpty = 0;
    private const ushort VariantBool = 11;
    private const ushort VariantLpWStr = 31;

    [FieldOffset(0)]
    private ushort _variantType;
    [FieldOffset(8)]
    private short _boolValue;
    [FieldOffset(8)]
    private IntPtr _pointerValue;

    public static PropVariant FromBool(bool value)
    {
        return new PropVariant
        {
            _variantType = VariantBool,
            _boolValue = value ? (short)-1 : (short)0
        };
    }

    public static PropVariant FromString(string value)
    {
        return new PropVariant
        {
            _variantType = VariantLpWStr,
            _pointerValue = Marshal.StringToCoTaskMemUni(value)
        };
    }

    public bool BoolValue => _boolValue != 0;
    public string? StringValue => _variantType == VariantLpWStr && _pointerValue != IntPtr.Zero
        ? Marshal.PtrToStringUni(_pointerValue)
        : null;

    public void Dispose()
    {
        if (_variantType == VariantEmpty) return;
        NativePropVariant.PropVariantClear(ref this);
        _variantType = VariantEmpty;
        _pointerValue = IntPtr.Zero;
    }
}

internal static class NativePropVariant
{
    [DllImport("ole32.dll")]
    internal static extern int PropVariantClear(ref PropVariant value);
}

[ComImport]
[Guid("F8679F50-850A-41CF-9C72-430F290290C8")]
[InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
internal interface IPolicyConfig
{
    int GetMixFormat([MarshalAs(UnmanagedType.LPWStr)] string deviceId, IntPtr format);
    int GetDeviceFormat([MarshalAs(UnmanagedType.LPWStr)] string deviceId, [MarshalAs(UnmanagedType.Bool)] bool defaultFormat, IntPtr format);
    int ResetDeviceFormat([MarshalAs(UnmanagedType.LPWStr)] string deviceId);
    int SetDeviceFormat([MarshalAs(UnmanagedType.LPWStr)] string deviceId, IntPtr endpointFormat, IntPtr mixFormat);
    int GetProcessingPeriod([MarshalAs(UnmanagedType.LPWStr)] string deviceId, [MarshalAs(UnmanagedType.Bool)] bool defaultPeriod, IntPtr defaultPeriodValue, IntPtr minimumPeriodValue);
    int SetProcessingPeriod([MarshalAs(UnmanagedType.LPWStr)] string deviceId, IntPtr periodValue);
    int GetShareMode([MarshalAs(UnmanagedType.LPWStr)] string deviceId, IntPtr mode);
    int SetShareMode([MarshalAs(UnmanagedType.LPWStr)] string deviceId, IntPtr mode);
    int GetPropertyValue([MarshalAs(UnmanagedType.LPWStr)] string deviceId, IntPtr key, IntPtr value);
    int SetPropertyValue([MarshalAs(UnmanagedType.LPWStr)] string deviceId, IntPtr key, IntPtr value);
    int SetDefaultEndpoint([MarshalAs(UnmanagedType.LPWStr)] string deviceId, PolicyConfigRole role);
    int SetEndpointVisibility([MarshalAs(UnmanagedType.LPWStr)] string deviceId, [MarshalAs(UnmanagedType.Bool)] bool visible);
}

[ComImport]
[Guid("870AF99C-171D-4F9E-AF0D-E63DF40C2BC9")]
internal class PolicyConfigClient
{
}

internal enum PolicyConfigRole
{
    Console = 0,
    Multimedia = 1,
    Communications = 2
}

internal enum AudioPolicyDataFlow
{
    Render = 0,
    Capture = 1,
    All = 2
}

internal enum AudioPolicyRole
{
    Console = 0,
    Multimedia = 1,
    Communications = 2
}

[ComImport]
[Guid("AB3D4648-E242-459F-B02F-541C70306324")]
[InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
internal interface IAudioPolicyConfigFactoryFor21H2
{
    // IInspectable slots. Declared only to keep the following vtable layout
    // correct on modern .NET, which cannot marshal IInspectable directly.
    int GetIidsPlaceholder();
    int GetRuntimeClassNamePlaceholder();
    int GetTrustLevelPlaceholder();
    int IncompleteAddContextVolumeChange();
    int IncompleteRemoveContextVolumeChange();
    int IncompleteAddRingerVibrateStateChanged();
    int IncompleteRemoveRingerVibrateStateChanged();
    int IncompleteSetVolumeGroupGainForId();
    int IncompleteGetVolumeGroupGainForId();
    int IncompleteGetActiveVolumeGroupForEndpointId();
    int IncompleteGetVolumeGroupsForEndpoint();
    int IncompleteGetCurrentVolumeContext();
    int IncompleteSetVolumeGroupMuteForId();
    int IncompleteGetVolumeGroupMuteForId();
    int IncompleteSetRingerVibrateState();
    int IncompleteGetRingerVibrateState();
    int IncompleteSetPreferredChatApplication();
    int IncompleteResetPreferredChatApplication();
    int IncompleteGetPreferredChatApplication();
    int IncompleteGetCurrentChatApplications();
    int IncompleteAddChatContextChanged();
    int IncompleteRemoveChatContextChanged();
    [PreserveSig]
    int SetPersistedDefaultAudioEndpoint(uint processId, AudioPolicyDataFlow flow, AudioPolicyRole role, IntPtr deviceId);
}

[ComImport]
[Guid("2A59116D-6C4F-45E0-A74F-707E3FEF9258")]
[InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
internal interface IAudioPolicyConfigFactoryForDownlevel
{
    int GetIidsPlaceholder();
    int GetRuntimeClassNamePlaceholder();
    int GetTrustLevelPlaceholder();
    int IncompleteAddContextVolumeChange();
    int IncompleteRemoveContextVolumeChange();
    int IncompleteAddRingerVibrateStateChanged();
    int IncompleteRemoveRingerVibrateStateChanged();
    int IncompleteSetVolumeGroupGainForId();
    int IncompleteGetVolumeGroupGainForId();
    int IncompleteGetActiveVolumeGroupForEndpointId();
    int IncompleteGetVolumeGroupsForEndpoint();
    int IncompleteGetCurrentVolumeContext();
    int IncompleteSetVolumeGroupMuteForId();
    int IncompleteGetVolumeGroupMuteForId();
    int IncompleteSetRingerVibrateState();
    int IncompleteGetRingerVibrateState();
    int IncompleteSetPreferredChatApplication();
    int IncompleteResetPreferredChatApplication();
    int IncompleteGetPreferredChatApplication();
    int IncompleteGetCurrentChatApplications();
    int IncompleteAddChatContextChanged();
    int IncompleteRemoveChatContextChanged();
    [PreserveSig]
    int SetPersistedDefaultAudioEndpoint(uint processId, AudioPolicyDataFlow flow, AudioPolicyRole role, IntPtr deviceId);
}

internal static class NativeAudioPolicy
{
    [DllImport("combase.dll", PreserveSig = false)]
    internal static extern void RoGetActivationFactory(
        IntPtr activatableClassId,
        [In] ref Guid iid,
        out IntPtr factory);

    [DllImport("combase.dll", PreserveSig = false)]
    internal static extern void WindowsCreateString(
        [MarshalAs(UnmanagedType.LPWStr)] string source,
        [In] uint length,
        [Out] out IntPtr hstring);

    [DllImport("combase.dll")]
    internal static extern int WindowsDeleteString(IntPtr hstring);
}

internal sealed class IndependentAudioRouter : IDisposable
{
    private readonly MMDevice _source;
    private readonly MMDevice _target;
    private readonly WasapiLoopbackCapture _capture;
    private readonly BufferedWaveProvider _buffer;
    private readonly MediaFoundationResampler? _resampler;
    private readonly StereoToMultiChannelWaveProvider? _channelMapper;
    private readonly WasapiOut _output;
    private readonly Timer _sourceVolumeLock;
    private readonly object _sync = new();
    private bool _disposed;
    private float _personalVolume;

    public string SourceId => _source.ID;
    public string SourceName => _source.FriendlyName;
    public string TargetId => _target.ID;
    public string TargetName => _target.FriendlyName;
    public float PersonalVolume
    {
        get
        {
            lock (_sync) return _personalVolume;
        }
    }

    public IndependentAudioRouter(string sourceId, string targetId, float personalVolume)
    {
        var enumerator = new MMDeviceEnumerator();
        try
        {
            _source = enumerator.GetDevice(sourceId);
            _target = enumerator.GetDevice(targetId);
        }
        finally
        {
            enumerator.Dispose();
        }

        if (_source.State != DeviceState.Active)
        {
            throw new InvalidOperationException($"A fonte '{_source.FriendlyName}' nao esta ativa.");
        }
        if (_target.State != DeviceState.Active)
        {
            throw new InvalidOperationException($"Os auscultadores '{_target.FriendlyName}' nao estao ativos.");
        }

        EnsureSourceAtUnity();
        _capture = new WasapiLoopbackCapture(_source);
        _buffer = new BufferedWaveProvider(_capture.WaveFormat)
        {
            BufferDuration = TimeSpan.FromMilliseconds(500),
            DiscardOnBufferOverflow = true
        };
        _output = new WasapiOut(_target, AudioClientShareMode.Shared, true, 80);
        var targetFormat = _target.AudioClient.MixFormat;
        if (CanUpmixStereoWithoutResampling(_capture.WaveFormat, targetFormat))
        {
            // Corsair's virtual 7.1 endpoint reports eight channels even though
            // CABLE is stereo. Mapping the two float channels directly avoids
            // the Media Foundation resampler that was starving this headset.
            _channelMapper = new StereoToMultiChannelWaveProvider(_buffer, targetFormat);
            _output.Init(_channelMapper);
        }
        else if (NeedsFormatConversion(_capture.WaveFormat, targetFormat))
        {
            _resampler = new MediaFoundationResampler(_buffer, targetFormat) { ResamplerQuality = 60 };
            _output.Init(_resampler);
        }
        else
        {
            _output.Init(_buffer);
        }
        _capture.DataAvailable += OnCaptureData;
        _source.AudioEndpointVolume.OnVolumeNotification += OnSourceVolumeChanged;
        _sourceVolumeLock = new Timer(_ => EnsureSourceAtUnity(), null, Timeout.Infinite, Timeout.Infinite);
        SetPersonalVolume(personalVolume);
    }

    public void Start()
    {
        ThrowIfDisposed();
        EnsureSourceAtUnity();
        _sourceVolumeLock.Change(TimeSpan.Zero, TimeSpan.FromMilliseconds(250));
        _output.Play();
        _capture.StartRecording();
    }

    public void SetPersonalVolume(float volume)
    {
        var normalized = Math.Clamp(volume, 0f, 1f);
        lock (_sync)
        {
            ThrowIfDisposed();
            _personalVolume = normalized;
            _output.Volume = normalized;
        }
    }

    public Result ToResult()
    {
        return new Result
        {
            Ok = true,
            Running = true,
            Volume = PersonalVolume,
            SourceId = SourceId,
            SourceName = SourceName,
            TargetId = TargetId,
            TargetName = TargetName
        };
    }

    private void OnCaptureData(object? sender, WaveInEventArgs eventArgs)
    {
        if (_disposed || eventArgs.BytesRecorded <= 0) return;
        try
        {
            _buffer.AddSamples(eventArgs.Buffer, 0, eventArgs.BytesRecorded);
        }
        catch (InvalidOperationException)
        {
            // The router is shutting down.
        }
    }

    private void OnSourceVolumeChanged(AudioVolumeNotificationData notification)
    {
        if (notification.MasterVolume < 0.999f || notification.Muted)
        {
            EnsureSourceAtUnity();
        }
    }

    private void EnsureSourceAtUnity()
    {
        if (_disposed) return;
        try
        {
            // Do not rewrite the endpoint on every timer tick: the VB-CABLE
            // driver can briefly interrupt its stream when its volume is set.
            // We still immediately restore unity if something actually changes it.
            var endpointVolume = _source.AudioEndpointVolume;
            if (endpointVolume.Mute)
            {
                endpointVolume.Mute = false;
            }
            if (endpointVolume.MasterVolumeLevelScalar < 0.999f)
            {
                endpointVolume.MasterVolumeLevelScalar = 1f;
            }
        }
        catch
        {
            // The driver can reject writes while reconnecting. The timer retries shortly.
        }
    }

    private void ThrowIfDisposed()
    {
        if (_disposed) throw new ObjectDisposedException(nameof(IndependentAudioRouter));
    }

    private static bool NeedsFormatConversion(WaveFormat source, WaveFormat target)
    {
        return source.SampleRate != target.SampleRate ||
               source.Channels != target.Channels ||
               source.BitsPerSample != target.BitsPerSample ||
               source.Encoding != target.Encoding;
    }

    private static bool CanUpmixStereoWithoutResampling(WaveFormat source, WaveFormat target)
    {
        return source.SampleRate == target.SampleRate &&
               source.Channels == 2 &&
               target.Channels > 2 &&
               source.BitsPerSample == 32 &&
               target.BitsPerSample == 32 &&
               source.BlockAlign == source.Channels * sizeof(float) &&
               target.BlockAlign == target.Channels * sizeof(float);
    }

    public void Dispose()
    {
        if (_disposed) return;
        _disposed = true;
        _sourceVolumeLock.Dispose();
        _source.AudioEndpointVolume.OnVolumeNotification -= OnSourceVolumeChanged;
        _capture.DataAvailable -= OnCaptureData;
        try { _capture.StopRecording(); } catch { }
        try { _output.Stop(); } catch { }
        _output.Dispose();
        _resampler?.Dispose();
        _capture.Dispose();
        _target.Dispose();
        _source.Dispose();
    }
}

internal sealed class StereoToMultiChannelWaveProvider : IWaveProvider
{
    private readonly IWaveProvider _source;
    private readonly int _sourceBlockAlign;
    private readonly int _targetBlockAlign;
    private byte[] _sourceBuffer = Array.Empty<byte>();

    public WaveFormat WaveFormat { get; }

    public StereoToMultiChannelWaveProvider(IWaveProvider source, WaveFormat targetFormat)
    {
        _source = source;
        WaveFormat = targetFormat;
        _sourceBlockAlign = source.WaveFormat.BlockAlign;
        _targetBlockAlign = targetFormat.BlockAlign;
    }

    public int Read(byte[] buffer, int offset, int count)
    {
        var requestedFrames = count / _targetBlockAlign;
        if (requestedFrames <= 0) return 0;

        var requestedSourceBytes = requestedFrames * _sourceBlockAlign;
        if (_sourceBuffer.Length < requestedSourceBytes)
        {
            _sourceBuffer = new byte[requestedSourceBytes];
        }

        var sourceBytes = _source.Read(_sourceBuffer, 0, requestedSourceBytes);
        var frames = sourceBytes / _sourceBlockAlign;
        for (var frame = 0; frame < frames; frame++)
        {
            var sourceOffset = frame * _sourceBlockAlign;
            var targetOffset = offset + (frame * _targetBlockAlign);
            Array.Clear(buffer, targetOffset, _targetBlockAlign);
            Buffer.BlockCopy(_sourceBuffer, sourceOffset, buffer, targetOffset, sizeof(float));
            Buffer.BlockCopy(_sourceBuffer, sourceOffset + sizeof(float), buffer, targetOffset + sizeof(float), sizeof(float));
        }

        return frames * _targetBlockAlign;
    }
}
