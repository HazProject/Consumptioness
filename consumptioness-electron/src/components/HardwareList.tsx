import React from 'react';
import type { HardwareInfo } from '../types';

interface Props {
  hardware: HardwareInfo;
  maxWatts: number;
  otherWatts: number;
}

export default function HardwareList({ hardware, maxWatts, otherWatts }: Props) {
  const items: { icon: string; label: string; value: string }[] = [
    { icon: '🖥️', label: `CPU: ${hardware.cpu.name}`, value: `${hardware.cpu.tdp}W` },
    { icon: '🎮', label: `GPU: ${hardware.gpus[0]?.name || 'None'}`, value: `${hardware.gpus[0]?.tdp || 0}W` },
    { icon: '💾', label: `RAM: ${hardware.ram.totalGB}GB (${hardware.ram.sticks} sticks)`, value: `${hardware.ram.sticks * hardware.ram.wattsPerStick}W` },
    ...hardware.storage.map(s => ({ icon: '💽', label: `${s.type}: ${s.name}`, value: `${s.watts}W` })),
    { icon: '🔧', label: `Mobo: ${hardware.motherboard.manufacturer}`, value: `${hardware.motherboard.estimatedWatts}W` },
    { icon: '🌬️', label: 'Fans + Peripherals', value: `${otherWatts - (hardware.ram.sticks * hardware.ram.wattsPerStick) - hardware.storage.reduce((a, s) => a + s.watts, 0) - hardware.motherboard.estimatedWatts}F0}W` },
  ];

  return (
    <div className="card">
      <h3 className="card-title purple">Hardware Detected</h3>
      <div className="hardware-list">
        {items.map((item, i) => (
          <div key={i} className="hardware-row">
            <span className="hardware-icon">{item.icon}</span>
            <span className="hardware-label">{item.label}</span>
            <span className="hardware-value">{item.value}</span>
          </div>
        ))}
      </div>
      <div className="divider" />
      <div className="hardware-row total-row">
        <span className="hardware-icon">⚡</span>
        <span className="hardware-label total-label">Total Estimated Max</span>
        <span className="hardware-value total-value">{Math.round(maxWatts)} W</span>
      </div>
    </div>
  );
}
