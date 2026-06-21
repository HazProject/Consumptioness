using Consumptioness.Models;

namespace Consumptioness.Services;

public class TnbTariffService
{
    private readonly TnbTariff _tariff;

    public TnbTariffService()
    {
        _tariff = new TnbTariff
        {
            Name = "Tariff A - Residential",
            Blocks = new List<TnbTariffBlock>
            {
                new() { Name = "Block 1", MinKwh = 0, MaxKwh = 200, SenPerKwh = 21.8 },
                new() { Name = "Block 2", MinKwh = 201, MaxKwh = 300, SenPerKwh = 33.4 },
                new() { Name = "Block 3", MinKwh = 301, MaxKwh = 600, SenPerKwh = 51.6 },
                new() { Name = "Block 4", MinKwh = 601, MaxKwh = 900, SenPerKwh = 54.6 },
                new() { Name = "Block 5", MinKwh = 901, MaxKwh = null, SenPerKwh = 57.1 },
            }
        };
    }

    public TnbTariff GetTariff() => _tariff;

    public (double ratePerKwh, TnbTariffBlock? block) GetRateForKwh(double kwh)
    {
        var totalSen = 0.0;
        TnbTariffBlock? appliedBlock = null;

        foreach (var block in _tariff.Blocks)
        {
            if (block.MaxKwh.HasValue && kwh > block.MaxKwh.Value)
            {
                var blockUnits = block.MaxKwh.Value - block.MinKwh + 1;
                totalSen += blockUnits * block.SenPerKwh;
            }
            else
            {
                var blockUnits = kwh - block.MinKwh + 1;
                if (blockUnits > 0)
                {
                    totalSen += blockUnits * block.SenPerKwh;
                    appliedBlock = block;
                }
                break;
            }
        }

        var effectiveRatePerKwh = totalSen / 100.0;
        return (effectiveRatePerKwh, appliedBlock);
    }

    public CostBreakdown CalculateCost(double watts, double dailyHours)
    {
        var kwhPerHour = watts / 1000.0;
        var kwhPerDay = kwhPerHour * dailyHours;
        var (rate, block) = GetRateForKwh(kwhPerDay);

        var costPerHour = kwhPerHour * rate;
        var costPerDay = kwhPerDay * rate;
        var costPerMonth = costPerDay * 30;
        var costPerYear = costPerDay * 365;

        var standbyWatts = watts * 0.3;
        var standbyKwhPerDay = (standbyWatts / 1000.0) * (24 - dailyHours);
        var costPerDayStandby = standbyKwhPerDay * rate;

        return new CostBreakdown
        {
            CurrentWatts = watts,
            KwhPerHour = kwhPerHour,
            CostPerHour = Math.Round(costPerHour, 2),
            CostPerDay = Math.Round(costPerDay, 2),
            CostPerMonth = Math.Round(costPerMonth, 2),
            CostPerYear = Math.Round(costPerYear, 2),
            DailyUseHours = dailyHours,
            CostPerDayStandby = Math.Round(costPerDayStandby, 2),
            StandbyWatts = Math.Round(standbyWatts, 1),
            AppliedRateRmPerKwh = Math.Round(rate, 4),
            AppliedBlock = block
        };
    }
}
