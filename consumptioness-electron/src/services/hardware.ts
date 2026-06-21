import type { HardwareInfo } from '../types';

export async function scanHardware(): Promise<HardwareInfo | null> {
  if (window.electronAPI) {
    return await window.electronAPI.scanHardware();
  }
  return demoHardware();
}

function demoHardware(): HardwareInfo {
  return {
    cpu: { name: 'AMD Ryzen 7 7800X3D', cores: 8, speedGHz: 4.2, manufacturer: 'AMD', tdp: 120 },
    gpus: [{ name: 'NVIDIA RTX 4080', vramMB: 16384, vendor: 'NVIDIA', tdp: 320 }],
    ram: { totalGB: 32, sticks: 2, wattsPerStick: 3.0 },
    storage: [
      { name: 'Samsung 990 Pro', type: 'SSD', sizeGB: 2000, watts: 3.0 },
    ],
    motherboard: { manufacturer: 'ASUS', model: 'ROG STRIX B650', estimatedWatts: 40 },
  };
}

export function calculateMaxPower(hw: HardwareInfo) {
  const cpu = hw.cpu.tdp;
  const gpu = hw.gpus.length > 0 ? Math.max(...hw.gpus.map(g => g.tdp)) : 0;
  const ram = hw.ram.sticks * hw.ram.wattsPerStick;
  const storage = hw.storage.reduce((sum, s) => sum + s.watts, 0);
  const mobo = hw.motherboard.estimatedWatts;
  const cooler = hw.coolerWatts || 4.0;
  const fans = 3 * 2.5;
  const usb = 2 * 2.5;
  const other = ram + storage + mobo + fans + cooler + usb;
  return { maxWatts: cpu + gpu + other, otherWatts: other };
}

export function calculateLivePower(hw: HardwareInfo, cpuLoad: number, gpuLoad: number) {
  const cpuWatts = Math.round(hw.cpu.tdp * (cpuLoad / 100) * 10) / 10;
  const gpuWatts = Math.round((hw.gpus[0]?.tdp || 0) * (gpuLoad / 100) * 10) / 10;
  return { cpuWatts, gpuWatts };
}
