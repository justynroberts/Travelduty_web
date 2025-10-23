const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
    getApiPort: () => ipcRenderer.invoke('get-api-port'),
    minimizeToTray: () => ipcRenderer.invoke('minimize-to-tray'),
    openDevTools: () => ipcRenderer.invoke('open-devtools'),
    onNavigate: (callback) => ipcRenderer.on('navigate', callback),
    platform: process.platform,
    version: process.versions.electron
});
