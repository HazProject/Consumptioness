import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  // Hardware
  scanHardware: () => ipcRenderer.invoke('hardware:scan'),
  startMonitor: () => ipcRenderer.invoke('monitor:start'),
  stopMonitor: () => ipcRenderer.invoke('monitor:stop'),
  onMonitorData: (callback: (data: any) => void) => {
    ipcRenderer.on('monitor:data', (_event, data) => callback(data));
  },
  removeMonitorListeners: () => {
    ipcRenderer.removeAllListeners('monitor:data');
  },

  // App
  getVersion: () => ipcRenderer.invoke('app:version'),

  // Updates
  checkUpdate: () => ipcRenderer.invoke('update:check'),
  downloadUpdate: () => ipcRenderer.invoke('update:download'),
  installUpdate: () => ipcRenderer.invoke('update:install'),
  onUpdateAvailable: (callback: (data: any) => void) => {
    ipcRenderer.on('update:available', (_event, data) => callback(data));
  },
  onUpdateNotAvailable: (callback: () => void) => {
    ipcRenderer.on('update:not-available', () => callback());
  },
  onUpdateProgress: (callback: (percent: number) => void) => {
    ipcRenderer.on('update:progress', (_event, percent) => callback(percent));
  },
  onUpdateDownloaded: (callback: () => void) => {
    ipcRenderer.on('update:downloaded', () => callback());
  },
});
