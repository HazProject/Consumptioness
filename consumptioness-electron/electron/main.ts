import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import si from 'systeminformation';
import { autoUpdater } from 'electron-updater';
import { execSync } from 'child_process';

let mainWindow: BrowserWindow | null = null;

const VERSION = '0.0.1';

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 700,
    minWidth: 700,
    minHeight: 600,
    title: `Consumptioness v${VERSION}`,
    backgroundColor: '#0d0b15',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  checkForUpdates();
}

function checkForUpdates() {
  autoUpdater.checkForUpdates().catch(() => {});
}

autoUpdater.on('update-available', (info) => {
  mainWindow?.webContents.send('update:available', {
    version: info.version,
    releaseNotes: info.releaseNotes || '',
  });
});

autoUpdater.on('update-not-available', () => {
  mainWindow?.webContents.send('update:not-available');
});

autoUpdater.on('download-progress', (progress) => {
  mainWindow?.webContents.send('update:progress', progress.percent);
});

autoUpdater.on('update-downloaded', () => {
  mainWindow?.webContents.send('update:downloaded');
});

// ── Hardware Detection ──

async function detectHardware() {
  const cpu = await si.cpu();
  const graphics = await si.graphics();
  const mem = await si.mem();
  const disks = await si.diskLayout();
  const system = await si.system();

  return {
    cpu: {
      name: `${cpu.manufacturer} ${cpu.brand}`,
      cores: cpu.cores,
      speedGHz: cpu.speed,
      manufacturer: cpu.manufacturer,
      tdp: estimateCpuTdp(cpu.brand, cpu.cores, cpu.manufacturer),
    },
    gpus: graphics.controllers.map((gpu: any) => ({
      name: gpu.model || 'Unknown',
      vramMB: gpu.vram || 0,
      vendor: gpu.vendor || 'Unknown',
      tdp: estimateGpuTdp(gpu.model || ''),
    })),
    ram: {
      totalGB: Math.round(mem.total / (1024 * 1024 * 1024)),
      sticks: Math.max(1, Math.round(mem.total / (8 * 1024 * 1024 * 1024))),
      wattsPerStick: 3.0,
    },
    storage: disks.map((d: any) => ({
      name: d.name || 'Unknown',
      type: d.type === 'SSD' || d.name?.includes('NVMe') ? 'SSD' : 'HDD',
      sizeGB: Math.round((d.size || 0) / (1024 * 1024 * 1024)),
      watts: d.type === 'SSD' || d.name?.includes('NVMe') ? 3.0 : 8.0,
    })),
    motherboard: {
      manufacturer: system.manufacturer || 'Unknown',
      model: system.model || 'Unknown',
      estimatedWatts: system.model?.toLowerCase().includes('laptop') ? 15 : 40,
    },
  };
}

function estimateCpuTdp(brand: string, cores: number, manufacturer: string): number {
  const name = brand.toLowerCase();
  if (name.includes('ultra 9') || name.includes('i9') || name.includes('ryzen 9') || name.includes('threadripper'))
    return Math.min(cores * 18, 280);
  if (name.includes('ultra 7') || name.includes('i7') || name.includes('ryzen 7'))
    return Math.min(cores * 15, 170);
  if (name.includes('ultra 5') || name.includes('i5') || name.includes('ryzen 5'))
    return Math.min(cores * 12, 130);
  if (name.includes('i3') || name.includes('ryzen 3'))
    return Math.min(cores * 10, 100);
  return Math.min(cores * 12, 150);
}

function estimateGpuTdp(name: string): number {
  const n = name.toLowerCase();
  if (n.includes('rtx 5090')) return 575;
  if (n.includes('rtx 5080')) return 360;
  if (n.includes('rtx 5070')) return 250;
  if (n.includes('rtx 5060')) return 150;
  if (n.includes('rtx 4090')) return 450;
  if (n.includes('rtx 4080')) return 320;
  if (n.includes('rtx 4070')) return 200;
  if (n.includes('rtx 4060')) return 115;
  if (n.includes('rtx 3090')) return 350;
  if (n.includes('rtx 3080')) return 320;
  if (n.includes('rtx 3070')) return 220;
  if (n.includes('rtx 3060')) return 170;
  if (n.includes('rtx 3050')) return 130;
  if (n.includes('gtx 1080')) return 180;
  if (n.includes('gtx 1070')) return 150;
  if (n.includes('gtx 1060')) return 120;
  if (n.includes('rx 7900')) return 300;
  if (n.includes('rx 7800')) return 260;
  if (n.includes('rx 7700')) return 200;
  if (n.includes('rx 7600')) return 165;
  if (n.includes('rx 6900')) return 300;
  if (n.includes('rx 6800')) return 250;
  if (n.includes('rx 6700')) return 175;
  if (n.includes('rx 6600')) return 132;
  if (n.includes('arc a770') || n.includes('arc a750')) return 225;
  if (n.includes('arc a580')) return 175;
  if (n.includes('arc a380')) return 75;
  if (n.includes('nvidia')) return 150;
  if (n.includes('radeon')) return 175;
  if (n.includes('intel')) return 100;
  return 75;
}

// ── Real-time Monitoring ──

let monitorInterval: ReturnType<typeof setInterval> | null = null;

function startMonitoring() {
  if (monitorInterval) return;
  monitorInterval = setInterval(async () => {
    try {
      const load = await si.currentLoad();
      const cpuPercent = Math.round(load.currentLoad * 10) / 10;
      const gpuPercent = Math.round(cpuPercent * 0.6 * 10) / 10;
      mainWindow?.webContents.send('monitor:data', {
        cpuLoad: cpuPercent,
        gpuLoad: gpuPercent,
        timestamp: Date.now(),
      });
    } catch {}
  }, 1000);
}

function stopMonitoring() {
  if (monitorInterval) {
    clearInterval(monitorInterval);
    monitorInterval = null;
  }
}

// ── IPC Handlers ──

ipcMain.handle('hardware:scan', async () => {
  try {
    return await detectHardware();
  } catch {
    return null;
  }
});

ipcMain.handle('monitor:start', () => {
  startMonitoring();
  return true;
});

ipcMain.handle('monitor:stop', () => {
  stopMonitoring();
  return true;
});

ipcMain.handle('app:version', () => VERSION);

ipcMain.handle('update:check', async () => {
  try {
    const result = await autoUpdater.checkForUpdates();
    if (result?.updateInfo) {
      return {
        available: true,
        version: result.updateInfo.version,
        releaseNotes: result.updateInfo.releaseNotes || '',
      };
    }
  } catch {}
  return { available: false, version: VERSION };
});

ipcMain.handle('update:download', () => {
  autoUpdater.downloadUpdate();
  return true;
});

ipcMain.handle('update:install', () => {
  autoUpdater.quitAndInstall();
  return true;
});

// ── Window Events ──

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  stopMonitoring();
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
