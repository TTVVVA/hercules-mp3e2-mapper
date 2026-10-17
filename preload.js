const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronMeta", {
  isDesktopApp: true,
  platform: process.platform
});

contextBridge.exposeInMainWorld("electronDesktop", {
  listOpenApps: () => ipcRenderer.invoke("desktop:list-open-apps"),
  setAppVolume: (processName, volume) => ipcRenderer.invoke("desktop:set-app-volume", { processName, volume }),
  getAppVolume: (processName) => ipcRenderer.invoke("desktop:get-app-volume", { processName }),
  listAudioDevices: () => ipcRenderer.invoke("desktop:list-audio-devices"),
  setDefaultAudioDevice: (deviceId) => ipcRenderer.invoke("desktop:set-default-audio-device", { deviceId }),
  setPersonalOutputVolume: (deviceId, volume) => ipcRenderer.invoke("desktop:set-personal-output-volume", { deviceId, volume }),
  getPersonalOutputVolume: (deviceId) => ipcRenderer.invoke("desktop:get-personal-output-volume", { deviceId }),
  getCableListenStatus: () => ipcRenderer.invoke("desktop:get-cable-listen-status"),
  setCableListen: (enabled, targetId) => ipcRenderer.invoke("desktop:set-cable-listen", { enabled, targetId }),
  routeAppToAudioDevice: (processName, deviceId) => ipcRenderer.invoke("desktop:route-app-to-audio-device", { processName, deviceId }),
  clearAppAudioRoute: (processName) => ipcRenderer.invoke("desktop:clear-app-audio-route", { processName }),
  audioRouterStatus: () => ipcRenderer.invoke("desktop:audio-router-status"),
  startAudioRouter: (sourceId, targetId, volume) => ipcRenderer.invoke("desktop:start-audio-router", { sourceId, targetId, volume }),
  stopAudioRouter: () => ipcRenderer.invoke("desktop:stop-audio-router"),
  setPersonalAudioVolume: (volume) => ipcRenderer.invoke("desktop:set-personal-audio-volume", { volume }),
  toggleDiscordMute: () => ipcRenderer.invoke("desktop:toggle-discord-mute"),
  mediaPlayPause: () => ipcRenderer.invoke("desktop:media-play-pause"),
  mediaPrev: () => ipcRenderer.invoke("desktop:media-prev"),
  mediaNext: () => ipcRenderer.invoke("desktop:media-next"),
  updateStatusOverlay: (status) => ipcRenderer.invoke("desktop:update-status-overlay", status),
  sendHotkey: (keys) => ipcRenderer.invoke("desktop:send-hotkey", { keys })
});
