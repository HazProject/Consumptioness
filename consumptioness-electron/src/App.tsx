import React, { useState, useEffect, useCallback, useRef } from 'react';
import HardwareList from './components/HardwareList';
import PowerMeter from './components/PowerMeter';
import CostBreakdown from './components/CostBreakdown';
import TnbTariffPanel from './components/TnbTariffPanel';
import ExportButtons from './components/ExportButtons';
import { scanHardware, calculateMaxPower, calculateLivePower } from './services/hardware';
import { getTariff, calculateCost } from './services/tnb';
import { lookupCoolerWatts } from './services/coolerLookup';
import type { HardwareInfo, PowerData, CostBreakdown as CostData, MonitorData, TnbTariffBlock } from './types';
import './index.css';

export default function App() {
  const [hardware, setHardware] = useState<HardwareInfo | null>(null);
  const [power, setPower] = useState<PowerData>({
    currentWatts: 0, maxWatts: 0, cpuWatts: 0, gpuWatts: 0, otherWatts: 0,
    cpuLoadPercent: 0, gpuLoadPercent: 0, timestamp: Date.now(),
  });
  const [cost, setCost] = useState<CostData>({
    currentWatts: 0, kwhPerHour: 0, costPerHour: 0, costPerDay: 0, costPerMonth: 0,
    costPerYear: 0, dailyUseHours: 8, costPerDayStandby: 0, standbyWatts: 0,
    appliedRateRmPerKwh: 0, appliedBlock: null,
  });
  const [history, setHistory] = useState<{ time: string; watts: number }[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [status, setStatus] = useState("Ready. Click 'Scan My PC' to begin.");
  const [dailyHours, setDailyHours] = useState(8);
  const [version, setVersion] = useState('0.0.1');
  const [coolerInput, setCoolerInput] = useState('');
  const [isSearchingCooler, setIsSearchingCooler] = useState(false);
  const liveWattsRef = useRef(0);

  const { blocks, name: tariffName } = getTariff();

  useEffect(() => {
    if (window.electronAPI) {
      window.electronAPI.getVersion().then(setVersion);
    }
  }, []);

  useEffect(() => {
    if (!window.electronAPI) return;
    window.electronAPI.onUpdateAvailable((data) => {
      if (confirm(`Version ${data.version} is available!\n\n${data.releaseNotes}\n\nDownload now?`)) {
        window.electronAPI!.downloadUpdate();
      }
    });
    window.electronAPI.onUpdateDownloaded(() => {
      if (confirm('Update downloaded. Install now?')) {
        window.electronAPI!.installUpdate();
      }
    });
  }, []);

  const handleScan = async () => {
    setIsScanning(true);
    setStatus('Scanning hardware...');

    const hw = await scanHardware();
    if (hw) {
      setHardware(hw);
      const { maxWatts, otherWatts } = calculateMaxPower(hw);
      setPower(prev => ({ ...prev, maxWatts, otherWatts }));
      setStatus(`Scan complete. Detected ${hw.cpu.name} + ${hw.gpus[0]?.name}`);
      startMonitoring(hw);
    } else {
      setStatus('Scan failed. Try again.');
    }

    setIsScanning(false);
  };

  const startMonitoring = (hw: HardwareInfo) => {
    setIsMonitoring(true);

    if (window.electronAPI) {
      window.electronAPI.startMonitor();
      window.electronAPI.onMonitorData((data: MonitorData) => {
        const { cpuWatts, gpuWatts } = calculateLivePower(hw, data.cpuLoad, data.gpuLoad);
        const otherWatts = power.otherWatts;
        const currentWatts = cpuWatts + gpuWatts + otherWatts;
        liveWattsRef.current = currentWatts;

        const now = new Date();
        const time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;

        setHistory(prev => {
          const next = [...prev, { time, watts: Math.round(currentWatts) }];
          if (next.length > 60) next.shift();
          return next;
        });

        setPower({
          currentWatts, maxWatts: power.maxWatts, cpuWatts, gpuWatts, otherWatts,
          cpuLoadPercent: data.cpuLoad, gpuLoadPercent: data.gpuLoad, timestamp: data.timestamp,
        });

        const c = calculateCost(currentWatts, dailyHours);
        setCost(c);
      });
    }
  };

  const handleHoursChange = useCallback((hours: number) => {
    setDailyHours(hours);
    const c = calculateCost(liveWattsRef.current, hours);
    setCost(c);
  }, []);

  const handleUpdateCheck = async () => {
    setStatus('Checking for updates...');
    if (window.electronAPI) {
      const result = await window.electronAPI.checkUpdate();
      if (result.available) {
        if (confirm(`Version ${result.version} is available!\n\n${result.releaseNotes || ''}\n\nDownload now?`)) {
          window.electronAPI.downloadUpdate();
        }
      } else {
        setStatus(`You're up to date (v${version}).`);
      }
    } else {
      setStatus('Update check not available in browser mode.');
    }
  };

  const handleCoolerLookup = async () => {
    if (!coolerInput.trim()) return;
    setIsSearchingCooler(true);
    setStatus(`Searching specs for cooler: ${coolerInput}...`);

    const watts = await lookupCoolerWatts(coolerInput);
    
    setHardware(prev => {
      const baseHw = prev || {
        cpu: { name: 'AMD Ryzen 7 7800X3D', cores: 8, speedGHz: 4.2, manufacturer: 'AMD', tdp: 120 },
        gpus: [{ name: 'NVIDIA RTX 4080', vramMB: 16384, vendor: 'NVIDIA', tdp: 320 }],
        ram: { totalGB: 32, sticks: 2, wattsPerStick: 3.0 },
        storage: [{ name: 'Samsung 990 Pro', type: 'SSD', sizeGB: 2000, watts: 3.0 }],
        motherboard: { manufacturer: 'ASUS', model: 'ROG STRIX B650', estimatedWatts: 40 },
      };
      
      const nextHw = {
        ...baseHw,
        coolerModel: coolerInput,
        coolerWatts: watts,
      };

      const { maxWatts, otherWatts } = calculateMaxPower(nextHw);
      
      const newOtherWatts = otherWatts;
      const currentWatts = power.cpuWatts + power.gpuWatts + newOtherWatts;
      liveWattsRef.current = currentWatts;

      setPower(p => ({
        ...p,
        maxWatts,
        otherWatts: newOtherWatts,
        currentWatts,
      }));

      const c = calculateCost(currentWatts, dailyHours);
      setCost(c);

      return nextHw;
    });

    setIsSearchingCooler(false);
    setStatus(`Updated cooler specs: ${coolerInput} (${watts}W estimated)`);
  };

  const handleDownloadNative = () => {
    window.open('https://github.com/HazProject/Consumptioness/releases', '_blank');
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>⚡ Consumptioness <span className="version">v{version}</span></h1>
        {!window.electronAPI && (
          <button className="btn btn-download" onClick={handleDownloadNative}>
            📥 Download Desktop App
          </button>
        )}
      </header>

      <div className="actions">
        <div className="main-actions">
          <button className="btn btn-primary" onClick={handleScan} disabled={isScanning}>
            🔍 {isScanning ? 'Scanning...' : 'Scan My PC'}
          </button>
          <button className="btn btn-secondary" onClick={handleUpdateCheck}>
            🔄 Check Update
          </button>
        </div>
        
        <div className="cooler-lookup-row">
          <label>❄️ Cooler Model:</label>
          <input
            type="text"
            value={coolerInput}
            onChange={(e) => setCoolerInput(e.target.value)}
            placeholder="e.g. Corsair H150i, Noctua NH-D15"
            className="cooler-input"
          />
          <button className="btn btn-secondary" onClick={handleCoolerLookup} disabled={isSearchingCooler}>
            {isSearchingCooler ? 'Searching...' : 'Search Specs'}
          </button>
        </div>
      </div>

      {hardware && (
        <>
          <HardwareList hardware={hardware} maxWatts={power.maxWatts} otherWatts={power.otherWatts} />
          <PowerMeter
            currentWatts={power.currentWatts}
            cpuWatts={power.cpuWatts}
            gpuWatts={power.gpuWatts}
            cpuLoad={power.cpuLoadPercent}
            gpuLoad={power.gpuLoadPercent}
            otherWatts={power.otherWatts}
            history={history}
          />
          <CostBreakdown cost={cost} onHoursChange={handleHoursChange} />
          {window.electronAPI && (
            <ExportButtons hardware={hardware} power={power} cost={cost} isScanning={isScanning} />
          )}
        </>
      )}

      <TnbTariffPanel blocks={blocks} tariffName={tariffName} />

      <footer className="status-bar">
        <span>{status}</span>
      </footer>
    </div>
  );
}
