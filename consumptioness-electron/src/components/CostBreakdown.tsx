import React from 'react';
import type { CostBreakdown as CostData } from '../types';

interface Props {
  cost: CostData;
  onHoursChange: (hours: number) => void;
}

export default function CostBreakdown({ cost, onHoursChange }: Props) {
  return (
    <div className="card">
      <h3 className="card-title peach">Cost Breakdown (TNB Malaysia - RM)</h3>

      <div className="cost-grid">
        <div className="cost-item">
          <span className="cost-label">Per Hour</span>
          <span className="cost-value">RM {cost.costPerHour}</span>
        </div>
        <div className="cost-item">
          <span className="cost-label">Per Day</span>
          <span className="cost-value">RM {cost.costPerDay}</span>
        </div>
        <div className="cost-item">
          <span className="cost-label">Per Month</span>
          <span className="cost-value">RM {cost.costPerMonth}</span>
        </div>
        <div className="cost-item">
          <span className="cost-label">Per Year</span>
          <span className="cost-value">RM {cost.costPerYear}</span>
        </div>
      </div>

      <div className="divider" />

      <div className="standby-row">
        <span>💤 Standby cost per day</span>
        <span className="standby-value">RM {cost.costPerDayStandby}</span>
      </div>

      <div className="divider" />

      <div className="hours-control">
        <span className="hours-label">Daily Usage: {cost.dailyUseHours}h</span>
        <input
          type="range"
          min="1"
          max="24"
          value={cost.dailyUseHours}
          onChange={(e) => onHoursChange(Number(e.target.value))}
          className="hours-slider"
        />
      </div>
    </div>
  );
}
