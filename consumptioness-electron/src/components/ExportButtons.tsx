import React from 'react';
import type { HardwareInfo, PowerData, CostBreakdown, TnbTariffBlock } from '../types';
import { exportToPdf, exportToExcel } from '../services/export';
import { getTariff } from '../services/tnb';

interface Props {
  hardware: HardwareInfo | null;
  power: PowerData;
  cost: CostBreakdown;
  isScanning: boolean;
}

export default function ExportButtons({ hardware, power, cost, isScanning }: Props) {
  if (!hardware) return null;

  const handlePdf = () => {
    const { blocks, name } = getTariff();
    exportToPdf(hardware, power, cost, name, blocks);
  };

  const handleExcel = () => {
    const { blocks } = getTariff();
    exportToExcel(hardware, power, cost, blocks);
  };

  return (
    <div className="export-buttons">
      <button className="btn btn-secondary" onClick={handlePdf} disabled={isScanning}>
        📄 Export PDF
      </button>
      <button className="btn btn-secondary" onClick={handleExcel} disabled={isScanning}>
        📊 Export Excel
      </button>
    </div>
  );
}
