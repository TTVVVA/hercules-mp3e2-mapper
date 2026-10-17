const { app, BrowserWindow, shell, ipcMain } = require("electron");
const { execFile, spawn } = require("node:child_process");
const fs = require("node:fs");
const net = require("node:net");
const path = require("path");
const { pathToFileURL } = require("node:url");

app.commandLine.appendSwitch("enable-blink-features", "WebMidi");

let audioRouterProcess = null;
let hotkeyServerProcess = null;
let mainWindow = null;
let statusOverlayWindow = null;
let appIsQuitting = false;
let overlaySaveTimer = null;
let statusOverlayPreferences = { x: null, y: null, locked: false };
let statusOverlayState = {
  discordPercent: null,
  phonesPercent: 75,
  micMuted: null,
  trackLabel: "Media",
  trackTitle: "Nenhuma música detetada",
  trackDetail: "Usa Play/Next na Hercules",
  locked: false
};
const HOTKEY_PIPE_PATH = "\\\\.\\pipe\\HerculesMapperHotkeyV1";

function isTrustedIpcSender(event) {
  const expectedUrl = pathToFileURL(path.join(__dirname, "index.html")).toString();
  return event.sender === mainWindow?.webContents && event.sender.getURL() === expectedUrl;
}

function handleIpc(channel, handler) {
  ipcMain.handle(channel, async (event, ...args) => {
    if (!isTrustedIpcSender(event)) {
      return { ok: false, error: "Pedido IPC bloqueado." };
    }
    return handler(event, ...args);
  });
}

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1500,
    height: 950,
    minWidth: 1000,
    minHeight: 700,
    backgroundColor: "#101316",
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  const ses = mainWindow.webContents.session;
  ses.setPermissionCheckHandler((_webContents, permission) => {
    if (permission === "midi" || permission === "midiSysex") return true;
    return false;
  });
  ses.setPermissionRequestHandler((_webContents, permission, callback) => {
    if (permission === "midi" || permission === "midiSysex") {
      callback(true);
      return;
    }
    callback(false);
  });

  mainWindow.loadFile(path.join(__dirname, "index.html"));

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
    if (!appIsQuitting) app.quit();
  });
}

function getStatusOverlayPreferencesPath() {
  return path.join(app.getPath("userData"), "status-overlay.json");
}

function loadStatusOverlayPreferences() {
  try {
    const parsed = JSON.parse(fs.readFileSync(getStatusOverlayPreferencesPath(), "utf8"));
    statusOverlayPreferences = {
      x: Number.isInteger(parsed?.x) ? parsed.x : null,
      y: Number.isInteger(parsed?.y) ? parsed.y : null,
      locked: Boolean(parsed?.locked)
    };
  } catch {
    statusOverlayPreferences = { x: null, y: null, locked: false };
  }
  statusOverlayState.locked = statusOverlayPreferences.locked;
}

function saveStatusOverlayPreferences() {
  clearTimeout(overlaySaveTimer);
  overlaySaveTimer = setTimeout(() => {
    try {
      fs.writeFileSync(getStatusOverlayPreferencesPath(), JSON.stringify(statusOverlayPreferences));
    } catch {
      // A posição é uma conveniência; nunca pode impedir a abertura da app.
    }
  }, 180);
}

function sendStatusOverlayState() {
  if (!statusOverlayWindow || statusOverlayWindow.isDestroyed()) return;
  statusOverlayWindow.webContents.send("status-overlay:state", statusOverlayState);
}

function setStatusOverlayLocked(locked) {
  statusOverlayPreferences.locked = Boolean(locked);
  statusOverlayState.locked = statusOverlayPreferences.locked;
  statusOverlayWindow?.setMovable(!statusOverlayPreferences.locked);
  saveStatusOverlayPreferences();
  sendStatusOverlayState();
}

function createStatusOverlayWindow() {
  const bounds = {};
  if (Number.isInteger(statusOverlayPreferences.x)) bounds.x = statusOverlayPreferences.x;
  if (Number.isInteger(statusOverlayPreferences.y)) bounds.y = statusOverlayPreferences.y;

  statusOverlayWindow = new BrowserWindow({
    width: 324,
    height: 292,
    minWidth: 324,
    minHeight: 292,
    maxWidth: 324,
    maxHeight: 292,
    ...bounds,
    frame: false,
    transparent: true,
    backgroundColor: "#00000000",
    resizable: false,
    maximizable: false,
    minimizable: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    hasShadow: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "overlay-preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  statusOverlayWindow.setAlwaysOnTop(true, "screen-saver");
  statusOverlayWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  statusOverlayWindow.setMovable(!statusOverlayPreferences.locked);
  statusOverlayWindow.loadFile(path.join(__dirname, "overlay.html"));
  statusOverlayWindow.once("ready-to-show", () => {
    statusOverlayWindow?.showInactive();
    sendStatusOverlayState();
  });
  statusOverlayWindow.on("move", () => {
    if (!statusOverlayWindow || statusOverlayWindow.isDestroyed()) return;
    const [x, y] = statusOverlayWindow.getPosition();
    statusOverlayPreferences.x = x;
    statusOverlayPreferences.y = y;
    saveStatusOverlayPreferences();
  });
  statusOverlayWindow.on("close", (event) => {
    if (!appIsQuitting) {
      event.preventDefault();
      statusOverlayWindow?.showInactive();
    }
  });
  statusOverlayWindow.on("closed", () => {
    statusOverlayWindow = null;
  });
}

function getAppVolumeBridgeCommand() {
  const packagedHelper = path.join(process.resourcesPath, "bin", "AppVolumeBridge", "AppVolumeBridge.exe");
  if (app.isPackaged && fs.existsSync(packagedHelper)) {
    return { file: packagedHelper, argsPrefix: [] };
  }

  const devHelperExe = path.join(__dirname, "bin", "AppVolumeBridge", "AppVolumeBridge.exe");
  if (fs.existsSync(devHelperExe)) {
    return { file: devHelperExe, argsPrefix: [] };
  }

  const devHelperDll = path.join(__dirname, "tools", "AppVolumeBridge", "bin", "Release", "net9.0-windows", "AppVolumeBridge.dll");
  if (fs.existsSync(devHelperDll)) {
    return { file: "dotnet", argsPrefix: [devHelperDll] };
  }

  return null;
}

function runAppVolumeBridge(args) {
  return new Promise((resolve, reject) => {
    const cmd = getAppVolumeBridgeCommand();
    if (!cmd) {
      reject(new Error("AppVolumeBridge nao encontrado. Faz build do helper."));
      return;
    }

    execFile(
      cmd.file,
      [...cmd.argsPrefix, ...args],
      { windowsHide: true, timeout: 10000, maxBuffer: 1024 * 1024 * 2 },
      (error, stdout, stderr) => {
        const rawOut = String(stdout || "").trim();
        const rawErr = String(stderr || "").trim();
        let parsed = null;
        if (rawOut) {
          try {
            parsed = JSON.parse(rawOut);
          } catch {
            // ignore JSON parse error, will fall back to raw strings
          }
        }

        if (error) {
          if (parsed) {
            resolve(parsed);
            return;
          }
          reject(new Error(rawErr || rawOut || error.message));
          return;
        }

        if (parsed) {
          resolve(parsed);
          return;
        }

        resolve({ ok: true, raw: rawOut });
      }
    );
  });
}

function ensureHotkeyServer() {
  if (hotkeyServerProcess && !hotkeyServerProcess.killed) return;
  const cmd = getAppVolumeBridgeCommand();
  if (!cmd) return;

  const child = spawn(cmd.file, [...cmd.argsPrefix, "hotkey-server"], {
    windowsHide: true,
    stdio: "ignore"
  });
  hotkeyServerProcess = child;
  child.on("exit", () => {
    if (hotkeyServerProcess === child) hotkeyServerProcess = null;
  });
  child.on("error", () => {
    if (hotkeyServerProcess === child) hotkeyServerProcess = null;
  });
}

function sendHotkeyPipe(keys) {
  return new Promise((resolve, reject) => {
    const socket = net.createConnection(HOTKEY_PIPE_PATH);
    let settled = false;
    let raw = "";
    const finish = (error, value) => {
      if (settled) return;
      settled = true;
      socket.destroy();
      if (error) reject(error);
      else resolve(value);
    };

    socket.setTimeout(350);
    socket.once("connect", () => socket.write(`${keys}\n`, "utf8"));
    socket.on("data", (chunk) => {
      raw += String(chunk || "");
      if (!raw.includes("\n")) return;
      try {
        finish(null, JSON.parse(raw.trim()));
      } catch (error) {
        finish(error);
      }
    });
    socket.once("timeout", () => finish(new Error("Servidor de atalhos sem resposta.")));
    socket.once("error", (error) => finish(error));
    socket.once("end", () => {
      if (!settled) finish(new Error("Servidor de atalhos fechou a ligação."));
    });
  });
}

async function sendHotkeyFast(keys) {
  ensureHotkeyServer();
  let lastError = null;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      return await sendHotkeyPipe(keys);
    } catch (error) {
      lastError = error;
      await new Promise((resolve) => setTimeout(resolve, 35));
    }
  }
  throw lastError || new Error("Não foi possível contactar o servidor de atalhos.");
}

function runAppVolumeBridgeElevated(args) {
  return new Promise((resolve, reject) => {
    const cmd = getAppVolumeBridgeCommand();
    if (!cmd) {
      reject(new Error("AppVolumeBridge nao encontrado. Faz build do helper."));
      return;
    }

    const psQuote = (value) => `'${String(value).replace(/'/g, "''")}'`;
    const commandArgs = [...cmd.argsPrefix, ...args].map(psQuote).join(", ");
    const script = [
      "$ErrorActionPreference = 'Stop'",
      `$process = Start-Process -FilePath ${psQuote(cmd.file)} -ArgumentList @(${commandArgs}) -Verb RunAs -Wait -PassThru -WindowStyle Hidden`,
      "exit $process.ExitCode"
    ].join("; ");
    const encodedScript = Buffer.from(script, "utf16le").toString("base64");

    execFile(
      "powershell.exe",
      ["-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", "-EncodedCommand", encodedScript],
      { windowsHide: true, timeout: 90000, maxBuffer: 1024 * 1024 },
      (error, stdout, stderr) => {
        if (error) {
          const details = String(stderr || stdout || "").trim();
          reject(new Error(details || "A operação foi cancelada ou o Windows recusou a autorização."));
          return;
        }
        resolve();
      }
    );
  });
}

function asBridgeResult(result) {
  return {
    ok: Boolean(result?.Ok ?? result?.ok),
    error: result?.Error ?? result?.error ?? null,
    running: result?.Running ?? result?.running ?? null,
    volume: result?.Volume ?? result?.volume ?? null,
    sourceId: result?.SourceId ?? result?.sourceId ?? null,
    sourceName: result?.SourceName ?? result?.sourceName ?? null,
    targetId: result?.TargetId ?? result?.targetId ?? null,
    targetName: result?.TargetName ?? result?.targetName ?? null,
    devices: result?.Devices ?? result?.devices ?? [],
    defaultDeviceId: result?.DefaultDeviceId ?? result?.defaultDeviceId ?? null,
    process: result?.Process ?? result?.process ?? null,
    sessionsMatched: Number(result?.SessionsMatched ?? result?.sessionsMatched ?? 0),
    listening: result?.Listening ?? result?.listening ?? null,
    muted: result?.Muted ?? result?.muted ?? null
  };
}

// Fase 1: o router WASAPI antigo (comando "monitor" do helper) esta bloqueado.
// A rota estavel e feita pelo Windows ("Ouvir este dispositivo" em CABLE Output).
// So reativar com HERCULES_ALLOW_LEGACY_ROUTER=1 (uso de diagnostico, nunca por defeito).
const LEGACY_ROUTER_ENABLED = process.env.HERCULES_ALLOW_LEGACY_ROUTER === "1";
const LEGACY_ROUTER_BLOCKED_MESSAGE =
  "O router WASAPI antigo esta desativado. A rota estavel e feita pelo Windows (Ouvir este dispositivo).";

function startAudioRouter({ sourceId, targetId, volume }) {
  if (!LEGACY_ROUTER_ENABLED) {
    return Promise.resolve({ ok: false, blocked: true, error: LEGACY_ROUTER_BLOCKED_MESSAGE });
  }
  const source = String(sourceId || "").trim();
  const target = String(targetId || "").trim();
  const normalizedVolume = Math.max(0, Math.min(1, Number(volume)));
  if (!source || !target) {
    return Promise.resolve({ ok: false, error: "Escolhe a fonte da transmissao e os auscultadores." });
  }
  if (!Number.isFinite(normalizedVolume)) {
    return Promise.resolve({ ok: false, error: "Volume pessoal invalido." });
  }
  if (audioRouterProcess && audioRouterProcess.exitCode === null) {
    return controlAudioRouter("status");
  }

  const cmd = getAppVolumeBridgeCommand();
  if (!cmd) {
    return Promise.resolve({ ok: false, error: "AppVolumeBridge nao encontrado. Faz build do helper." });
  }

  return new Promise((resolve) => {
    let settled = false;
    let stdoutBuffer = "";
    let stderrBuffer = "";
    let startupTimer = null;
    const child = spawn(
      cmd.file,
      [...cmd.argsPrefix, "monitor", "--source-id", source, "--target-id", target, "--volume", normalizedVolume.toFixed(4)],
      { windowsHide: true, stdio: ["ignore", "pipe", "pipe"] }
    );
    audioRouterProcess = child;

    const finish = (result) => {
      if (settled) return;
      settled = true;
      if (startupTimer) clearTimeout(startupTimer);
      resolve(result);
    };

    child.stdout.on("data", (chunk) => {
      stdoutBuffer += String(chunk || "");
      const lines = stdoutBuffer.split(/\r?\n/);
      stdoutBuffer = lines.pop() || "";
      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          finish(asBridgeResult(JSON.parse(line)));
          return;
        } catch {
          // The helper should only write JSON; retain any unexpected text for diagnostics.
          stderrBuffer += `${line}\n`;
        }
      }
    });
    child.stderr.on("data", (chunk) => {
      stderrBuffer += String(chunk || "");
    });
    child.once("error", (error) => {
      if (audioRouterProcess === child) audioRouterProcess = null;
      finish({ ok: false, error: String(error?.message || error) });
    });
    child.once("exit", (code) => {
      if (audioRouterProcess === child) audioRouterProcess = null;
      finish({ ok: false, error: stderrBuffer.trim() || `O router terminou (codigo ${code ?? "desconhecido"}).` });
    });
    startupTimer = setTimeout(() => {
      finish({ ok: false, error: stderrBuffer.trim() || "O router de audio demorou demasiado a iniciar." });
    }, 6000);
  });
}

async function controlAudioRouter(action, volume) {
  try {
    const args = ["monitor-control", "--action", String(action || "").trim()];
    if (Number.isFinite(Number(volume))) {
      args.push("--volume", Math.max(0, Math.min(1, Number(volume))).toFixed(4));
    }
    return asBridgeResult(await runAppVolumeBridge(args));
  } catch (error) {
    return { ok: false, running: false, error: String(error?.message || error) };
  }
}

function listOpenWindowsApps() {
  return new Promise((resolve, reject) => {
    if (process.platform !== "win32") {
      resolve([]);
      return;
    }

    const script = [
      "$ErrorActionPreference='SilentlyContinue';",
      "Get-Process |",
      "  Where-Object { $_.MainWindowHandle -ne 0 -and -not [string]::IsNullOrWhiteSpace($_.MainWindowTitle) } |",
      "  Select-Object ProcessName, Id, MainWindowTitle |",
      "  Sort-Object ProcessName, MainWindowTitle |",
      "  ConvertTo-Json -Compress"
    ].join(" ");

    execFile(
      "powershell.exe",
      ["-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", script],
      { windowsHide: true, timeout: 10000, maxBuffer: 1024 * 1024 * 4 },
      (error, stdout) => {
        if (error) {
          reject(error);
          return;
        }
        try {
          const raw = String(stdout || "").trim();
          if (!raw) {
            resolve([]);
            return;
          }
          const parsed = JSON.parse(raw);
          const rows = Array.isArray(parsed) ? parsed : [parsed];
          const dedup = new Map();
          for (const row of rows) {
            const processName = String(row?.ProcessName || "").trim();
            const windowTitle = String(row?.MainWindowTitle || "").trim();
            const pid = Number(row?.Id) || 0;
            if (!processName || !windowTitle) continue;
            const key = processName.toLowerCase();
            if (processName.toLowerCase().includes("herculesdjcontrolmp3")) continue;
            if (processName.toLowerCase() === "electron") continue;
            if (!dedup.has(key)) {
              dedup.set(key, { processName, pid, windowTitle });
            }
          }
          resolve(Array.from(dedup.values()).sort((a, b) => a.processName.localeCompare(b.processName)));
        } catch (parseError) {
          reject(parseError);
        }
      }
    );
  });
}

handleIpc("desktop:list-open-apps", async () => {
  try {
    return { ok: true, apps: await listOpenWindowsApps() };
  } catch (error) {
    return { ok: false, apps: [], error: String(error?.message || error) };
  }
});

handleIpc("desktop:set-app-volume", async (_event, payload) => {
  try {
    const processName = String(payload?.processName || "").trim();
    const volume = Number(payload?.volume);
    if (!processName) {
      return { ok: false, error: "Processo vazio." };
    }
    if (!Number.isFinite(volume)) {
      return { ok: false, error: "Volume invalido." };
    }
    const normalizedVolume = Math.max(0, Math.min(1, volume));
    const result = await runAppVolumeBridge([
      "set",
      "--process",
      processName,
      "--volume",
      normalizedVolume.toFixed(4)
    ]);
    return {
      ok: Boolean(result?.Ok ?? result?.ok),
      error: result?.Error ?? result?.error ?? null,
      sessionsMatched: Number(result?.SessionsMatched ?? result?.sessionsMatched ?? 0),
      volume: result?.Volume ?? result?.volume ?? null
    };
  } catch (error) {
    return { ok: false, error: String(error?.message || error) };
  }
});

handleIpc("desktop:get-app-volume", async (_event, payload) => {
  try {
    const processName = String(payload?.processName || "").trim();
    if (!processName) {
      return { ok: false, error: "Processo vazio." };
    }
    return asBridgeResult(await runAppVolumeBridge(["get-process-volume", "--process", processName]));
  } catch (error) {
    return { ok: false, error: String(error?.message || error) };
  }
});

handleIpc("desktop:list-audio-devices", async () => {
  try {
    return asBridgeResult(await runAppVolumeBridge(["list-render-devices"]));
  } catch (error) {
    return { ok: false, devices: [], error: String(error?.message || error) };
  }
});

handleIpc("desktop:set-default-audio-device", async (_event, payload) => {
  const deviceId = String(payload?.deviceId || "").trim();
  if (!deviceId) return { ok: false, error: "Escolha primeiro o dispositivo CABLE Input." };
  try {
    const result = await runAppVolumeBridge(["set-default-render-device", "--device-id", deviceId]);
    if (!Boolean(result?.Ok ?? result?.ok)) return asBridgeResult(result);

    // O CABLE Input é a fonte da partilha: fica sempre a ganho unitário.
    const cableLevel = await runAppVolumeBridge([
      "set-render-device-volume",
      "--device-id", deviceId,
      "--volume", "1.0000"
    ]);
    if (!Boolean(cableLevel?.Ok ?? cableLevel?.ok)) return asBridgeResult(cableLevel);
    return asBridgeResult({ ...result, Volume: 1 });
  } catch (error) {
    return { ok: false, error: String(error?.message || error) };
  }
});

handleIpc("desktop:set-personal-output-volume", async (_event, payload) => {
  const deviceId = String(payload?.deviceId || "").trim();
  const volume = Number(payload?.volume);
  if (!deviceId) return { ok: false, error: "Escolha os auscultadores pessoais." };
  if (!Number.isFinite(volume)) return { ok: false, error: "Volume pessoal inválido." };
  try {
    // O Windows faz a monitorização nativa CABLE Output -> Corsair. Ao
    // ajustar o nível do CABLE Output, muda apenas o que se ouve dessa
    // monitorização; aplicações privadas, como o Discord, ficam intactas.
    return asBridgeResult(await runAppVolumeBridge([
      "set-cable-listen-session-volume",
      "--target-id", deviceId,
      "--volume", Math.max(0, Math.min(1, volume)).toFixed(4)
    ]));
  } catch (error) {
    return { ok: false, error: String(error?.message || error) };
  }
});

handleIpc("desktop:get-personal-output-volume", async (_event, payload) => {
  const deviceId = String(payload?.deviceId || "").trim();
  if (!deviceId) return { ok: false, error: "Escolha os auscultadores pessoais." };
  try {
    return asBridgeResult(await runAppVolumeBridge([
      "get-cable-listen-session-volume",
      "--target-id", deviceId
    ]));
  } catch (error) {
    return { ok: false, error: String(error?.message || error) };
  }
});

handleIpc("desktop:get-cable-listen-status", async () => {
  try {
    return asBridgeResult(await runAppVolumeBridge(["get-cable-listen-status"]));
  } catch (error) {
    return { ok: false, error: String(error?.message || error) };
  }
});

handleIpc("desktop:set-cable-listen", async (_event, payload) => {
  const enabled = Boolean(payload?.enabled);
  const targetId = String(payload?.targetId || "").trim();
  if (enabled && !targetId) return { ok: false, error: "Escolha primeiro os auscultadores." };
  try {
    const args = ["set-cable-listen", "--enabled", enabled ? "true" : "false"];
    if (enabled) args.push("--target-id", targetId);
    await runAppVolumeBridgeElevated(args);
    return asBridgeResult(await runAppVolumeBridge(["get-cable-listen-status"]));
  } catch (error) {
    return { ok: false, error: String(error?.message || error) };
  }
});

handleIpc("desktop:route-app-to-audio-device", async (_event, payload) => {
  const processName = String(payload?.processName || "").trim();
  const deviceId = String(payload?.deviceId || "").trim();
  if (!processName || !deviceId) return { ok: false, error: "Escolha a aplicacao e a saida." };
  try {
    return asBridgeResult(await runAppVolumeBridge([
      "route-process-to-render-device",
      "--process", processName,
      "--device-id", deviceId
    ]));
  } catch (error) {
    return { ok: false, error: String(error?.message || error) };
  }
});

handleIpc("desktop:clear-app-audio-route", async (_event, payload) => {
  const processName = String(payload?.processName || "").trim();
  if (!processName) return { ok: false, error: "Aplicacao em falta." };
  try {
    return asBridgeResult(await runAppVolumeBridge([
      "route-process-to-render-device",
      "--process", processName,
      "--clear"
    ]));
  } catch (error) {
    return { ok: false, error: String(error?.message || error) };
  }
});

handleIpc("desktop:audio-router-status", async () => controlAudioRouter("status"));

handleIpc("desktop:start-audio-router", async (_event, payload) => {
  return startAudioRouter({
    sourceId: payload?.sourceId,
    targetId: payload?.targetId,
    volume: payload?.volume
  });
});

handleIpc("desktop:stop-audio-router", async () => controlAudioRouter("stop"));

handleIpc("desktop:set-personal-audio-volume", async (_event, payload) => {
  return controlAudioRouter("set-volume", payload?.volume);
});

handleIpc("desktop:media-play-pause", async () => {
  try {
    const result = await runAppVolumeBridge(["media-play-pause"]);
    return {
      ok: Boolean(result?.Ok ?? result?.ok),
      error: result?.Error ?? result?.error ?? null
    };
  } catch (error) {
    return { ok: false, error: String(error?.message || error) };
  }
});

handleIpc("desktop:toggle-discord-mute", async () => {
  try {
    return asBridgeResult(await runAppVolumeBridge(["toggle-process-mute", "--process", "Discord"]));
  } catch (error) {
    return { ok: false, error: String(error?.message || error) };
  }
});

handleIpc("desktop:media-prev", async () => {
  try {
    const result = await runAppVolumeBridge(["media-prev"]);
    return {
      ok: Boolean(result?.Ok ?? result?.ok),
      error: result?.Error ?? result?.error ?? null
    };
  } catch (error) {
    return { ok: false, error: String(error?.message || error) };
  }
});

handleIpc("desktop:media-next", async () => {
  try {
    const result = await runAppVolumeBridge(["media-next"]);
    return {
      ok: Boolean(result?.Ok ?? result?.ok),
      error: result?.Error ?? result?.error ?? null
    };
  } catch (error) {
    return { ok: false, error: String(error?.message || error) };
  }
});

handleIpc("desktop:send-hotkey", async (_event, payload) => {
  try {
    const keys = String(payload?.keys || "").trim();
    if (!keys) {
      return { ok: false, error: "Atalho vazio." };
    }
    const result = await sendHotkeyFast(keys);
    return {
      ok: Boolean(result?.Ok ?? result?.ok),
      error: result?.Error ?? result?.error ?? null
    };
  } catch (error) {
    return { ok: false, error: String(error?.message || error) };
  }
});

handleIpc("desktop:update-status-overlay", async (_event, payload) => {
  const percent = (value) => Number.isFinite(Number(value)) ? Math.max(0, Math.min(100, Math.round(Number(value)))) : null;
  statusOverlayState = {
    discordPercent: percent(payload?.discordPercent),
    phonesPercent: percent(payload?.phonesPercent) ?? statusOverlayState.phonesPercent,
    micMuted: typeof payload?.micMuted === "boolean" ? payload.micMuted : null,
    trackLabel: String(payload?.trackLabel || "Media").slice(0, 24),
    trackTitle: String(payload?.trackTitle || "Nenhuma música detetada").slice(0, 80),
    trackDetail: String(payload?.trackDetail || "Usa Play/Next na Hercules").slice(0, 90),
    locked: statusOverlayPreferences.locked
  };
  sendStatusOverlayState();
  return { ok: true, locked: statusOverlayPreferences.locked };
});

ipcMain.on("status-overlay:toggle-lock", (event) => {
  if (event.sender !== statusOverlayWindow?.webContents) return;
  setStatusOverlayLocked(!statusOverlayPreferences.locked);
});

app.whenReady().then(() => {
  ensureHotkeyServer();
  loadStatusOverlayPreferences();
  createStatusOverlayWindow();
  createMainWindow();

  app.on("activate", () => {
    if (!mainWindow) {
      createMainWindow();
    }
  });
});

app.on("before-quit", () => {
  appIsQuitting = true;
  clearTimeout(overlaySaveTimer);
  if (hotkeyServerProcess && !hotkeyServerProcess.killed) {
    hotkeyServerProcess.kill();
  }
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("before-quit", () => {
  if (audioRouterProcess && audioRouterProcess.exitCode === null) {
    void controlAudioRouter("stop");
  }
});
