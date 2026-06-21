import type { TnbTariffBlock, CostBreakdown } from '../types';

const TARIFF_BLOCKS: TnbTariffBlock[] = [
  { name: 'Block 1', minKwh: 0, maxKwh: 200, senPerKwh: 21.8 },
  { name: 'Block 2', minKwh: 201, maxKwh: 300, senPerKwh: 33.4 },
  { name: 'Block 3', minKwh: 301, maxKwh: 600, senPerKwh: 51.6 },
  { name: 'Block 4', minKwh: 601, maxKwh: 900, senPerKwh: 54.6 },
  { name: 'Block 5', minKwh: 901, maxKwh: null, senPerKwh: 57.1 },
];

export function getTariff() {
  return { name: 'Tariff A - Residential', blocks: TARIFF_BLOCKS };
}

function getRateForKwh(kwh: number): { ratePerKwh: number; block: TnbTariffBlock | null } {
  let totalSen = 0;
  let appliedBlock: TnbTariffBlock | null = null;

  for (const block of TARIFF_BLOCKS) {
    if (block.maxKwh !== null && kwh > block.maxKwh) {
      totalSen += (block.maxKwh - block.minKwh + 1) * block.senPerKwh;
    } else {
      const blockUnits = kwh - block.minKwh + 1;
      if (blockUnits > 0) {
        totalSen += blockUnits * block.senPerKwh;
        appliedBlock = block;
      }
      break;
    }
  }

  return { ratePerKwh: totalSen / 100, block: appliedBlock };
}

export function calculateCost(watts: number, dailyHours: number): CostBreakdown {
  const kwhPerHour = watts / 1000;
  const kwhPerDay = kwhPerHour * dailyHours;
  const { ratePerKwh } = getRateForKwh(kwhPerDay);

  const costPerHour = kwhPerHour * ratePerKwh;
  const costPerDay = kwhPerDay * ratePerKwh;
  const costPerMonth = costPerDay * 30;
  const costPerYear = costPerDay * 365;

  const standbyWatts = watts * 0.3;
  const standbyKwhPerDay = (standbyWatts / 1000) * (24 - dailyHours);
  const costPerDayStandby = standbyKwhPerDay * ratePerKwh;

  return {
    currentWatts: watts,
    kwhPerHour: Math.round(kwhPerHour * 100) / 100,
    costPerHour: Math.round(costPerHour * 100) / 100,
    costPerDay: Math.round(costPerDay * 100) / 100,
    costPerMonth: Math.round(costPerMonth * 100) / 100,
    costPerYear: Math.round(costPerYear * 100) / 100,
    dailyUseHours: dailyHours,
    costPerDayStandby: Math.round(costPerDayStandby * 100) / 100,
    standbyWatts: Math.round(standbyWatts * 10) / 10,
    appliedRateRmPerKwh: Math.round(ratePerKwh * 10000) / 10000,
    appliedBlock: null,
  };
}
