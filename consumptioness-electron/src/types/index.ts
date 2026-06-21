export interface HardwareInfo {
  cpu: CpuInfo;
  gpus: GpuInfo[];
  ram: RamInfo;
  storage: StorageInfo[];
  motherboard: MotherboardInfo;
  coolerModel?: string;
  coolerWatts?: number;
}

export interface CpuInfo {
  name: string;
  cores: number;
  speedGHz: number;
  manufacturer: string;
  tdp: number;
}

export interface GpuInfo {
  name: string;
  vramMB: number;
  vendor: string;
  tdp: number;
}

export interface RamInfo {
  totalGB: number;
  sticks: number;
  wattsPerStick: number;
}

export interface StorageInfo {
  name: string;
  type: string;
  sizeGB: number;
  watts: number;
}

export interface MotherboardInfo {
  manufacturer: string;
  model: string;
  estimatedWatts: number;
}

export interface PowerData {
  currentWatts: number;
  maxWatts: number;
  cpuWatts: number;
  gpuWatts: number;
  otherWatts: number;
  cpuLoadPercent: number;
  gpuLoadPercent: number;
  timestamp: number;
}

export interface CostBreakdown {
  currentWatts: number;
  kwhPerHour: number;
  costPerHour: number;
  costPerDay: number;
  costPerMonth: number;
  costPerYear: number;
  dailyUseHours: number;
  costPerDayStandby: number;
  standbyWatts: number;
  appliedRateRmPerKwh: number;
  appliedBlock: TnbTariffBlock | null;
}

export interface TnbTariffBlock {
  name: string;
  minKwh: number;
  maxKwh: number | null;
  senPerKwh: number;
}

export interface MonitorData {
  cpuLoad: number;
  gpuLoad: number;
  timestamp: number;
}

declare global {
  interface Window {
    electronAPI: {
      scanHardware: () => Promise<HardwareInfo | null>;
      startMonitor: () => Promise<boolean>;
      stopMonitor: () => Promise<boolean>;
      onMonitorData: (callback: (data: MonitorData) => void) => void;
      removeMonitorListeners: () => void;
      getVersion: () => Promise<string>;
      checkUpdate: () => Promise<{ available: boolean; version: string; releaseNotes?: string }>;
      downloadUpdate: () => Promise<boolean>;
      installUpdate: () => Promise<boolean>;
      onUpdateAvailable: (callback: (data: { version: string; releaseNotes: string }) => void) => void;
      onUpdateNotAvailable: (callback: () => void) => void;
      onUpdateProgress: (callback: (percent: number) => void) => void;
      onUpdateDownloaded: (callback: () => void) => void;
    };
  }
}
