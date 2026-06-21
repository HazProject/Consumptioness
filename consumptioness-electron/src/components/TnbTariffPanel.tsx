import React from 'react';
import type { TnbTariffBlock } from '../types';

interface Props {
  blocks: TnbTariffBlock[];
  tariffName: string;
}

export default function TnbTariffPanel({ blocks, tariffName }: Props) {
  return (
    <div className="card">
      <h3 className="card-title peach">{tariffName}</h3>
      <div className="tariff-table">
        <div className="tariff-header">
          <span>Block</span>
          <span>kWh Range</span>
          <span>sen/kWh</span>
        </div>
        {blocks.map((block, i) => (
          <div key={i} className="tariff-row">
            <span>{block.name}</span>
            <span>{block.maxKwh !== null ? `${block.minKwh}-${block.maxKwh}` : `${block.minKwh}+`}</span>
            <span>{block.senPerKwh}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
