import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface Props {
  currentWatts: number;
  cpuWatts: number;
  gpuWatts: number;
  cpuLoad: number;
  gpuLoad: number;
  otherWatts: number;
  history: { time: string; watts: number }[];
}

export default function PowerMeter({
  currentWatts, cpuWatts, gpuWatts, cpuLoad, gpuLoad, otherWatts, history,
}: Props) {
  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title blue">Live Power</h3>
        <span className="live-watts">{Math.round(currentWatts)} W</span>
      </div>

      <div className="meter-grid">
        <div className="meter-item">
          <span className="meter-label">CPU</span>
          <span className="meter-value">{cpuLoad}%</span>
          <span className="meter-sub">{cpuWatts} W</span>
        </div>
        <div className="meter-item">
          <span className="meter-label">GPU</span>
          <span className="meter-value">{gpuLoad}%</span>
          <span className="meter-sub">{gpuWatts} W</span>
        </div>
        <div className="meter-item">
          <span className="meter-label">Other</span>
          <span className="meter-value">—</span>
          <span className="meter-sub">{Math.round(otherWatts)} W</span>
        </div>
      </div>

      {history.length > 0 && (
        <div className="chart-container">
          <ResponsiveContainer width="100%" height={120}>
            <LineChart data={history}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2740" />
              <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#8b89a3' }} />
              <YAxis tick={{ fontSize: 10, fill: '#8b89a3' }} />
              <Tooltip
                contentStyle={{ background: '#1e1b29', border: '1px solid #c084fc4d', borderRadius: 8, color: '#fff' }}
              />
              <Line type="monotone" dataKey="watts" stroke="#c084fc" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
