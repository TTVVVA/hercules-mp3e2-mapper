# Hercules MP3e2 Mapper

> Windows desktop application for mapping a **Hercules DJ Control MP3 e2** to media, hotkey, and personal-audio controls.

The project uses Electron for the interface and a small C# helper for Windows Core Audio operations.

## What it is for

- Map buttons, knobs, and faders from a Hercules DJ Control MP3 e2.
- Keep shared/game audio on **VB-CABLE** at full level.
- Adjust only the user's local monitoring level for VB-CABLE, without lowering the signal sent to a share.
- Keep Discord on a physical headset instead of the shared virtual cable.
- Send a configurable global hotkey from the controller (the current setup uses `A+S+C+O` for Discord microphone mute/unmute).

## Audio design

The stable route used by this project is Windows' native **Listen to this device** feature:

1. Windows/game audio is sent to `CABLE Input`.
2. `CABLE Output` is monitored to the physical headset through Windows.
3. The app changes the volume of that monitoring session only. It does not change the CABLE endpoint level used by the share.
4. Discord is configured directly to the physical headset and is excluded from the CABLE share.

The legacy WASAPI monitor/router is retained only for compatibility diagnostics and must not be used together with Windows' native monitoring: doing so can cause duplicated audio, cuts, or added latency.

## Requirements

- Windows 10 or 11
- Node.js and npm
- .NET 9 SDK
- VB-Audio Virtual Cable installed
- Hercules DJ Control MP3 e2 connected by USB

## Run from source

```powershell
npm ci
npm start
```

To build a portable Windows executable:

```powershell
npm run dist
```

`npm run dist` publishes the C# helper before packaging Electron.

## Important setup notes

- Configure Discord's playback/output device as the physical headset. Do not leave it on the default device if the default is `CABLE Input`.
- Enable Windows **Listen to this device** on `CABLE Output` and set the listening device to the physical headset.
- Verify the share with a recording or input monitor. Hearing sound locally does not prove that Discord is excluded from the shared CABLE signal.
- Keep the CABLE share signal at 100%; use the app's personal CABLE control only for local headset monitoring.

## Repository contents

- `main.js`, `preload.js`, `app.js`, `index.html`, `styles.css`: Electron application.
- `tools/AppVolumeBridge`: C# helper using Windows Core Audio / NAudio.
- `THIRD_PARTY_NOTICES.md`: attribution for the adapted EarTrumpet audio-policy interop declarations.

Generated packages, dependencies, caches, downloaded reference pages, and local review exports are intentionally not versioned.
