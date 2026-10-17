const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("statusOverlay", {
  toggleLock: () => ipcRenderer.send("status-overlay:toggle-lock"),
  onState: (callback) => {
    const listener = (_event, state) => callback(state);
    ipcRenderer.on("status-overlay:state", listener);
    return () => ipcRenderer.removeListener("status-overlay:state", listener);
  }
});
