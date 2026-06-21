import { useEffect, useRef, useState } from 'react';
import type { MonitorData } from '../types';

export function usePowerMonitor(isRunning: boolean) {
  const [data, setData] = useState<MonitorData | null>(null);
  const callbackRef = useRef<((d: MonitorData) => void) | null>(null);

  useEffect(() => {
    if (!window.electronAPI) return;

    if (isRunning) {
      window.electronAPI.startMonitor();

      window.electronAPI.onMonitorData((d) => {
        setData(d);
        callbackRef.current?.(d);
      });
    } else {
      window.electronAPI.stopMonitor();
      window.electronAPI.removeMonitorListeners();
      setData(null);
    }

    return () => {
      window.electronAPI?.stopMonitor();
      window.electronAPI?.removeMonitorListeners();
    };
  }, [isRunning]);

  return { data, onData: (cb: (d: MonitorData) => void) => { callbackRef.current = cb; } };
}
