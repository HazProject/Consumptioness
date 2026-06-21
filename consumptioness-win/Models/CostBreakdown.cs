namespace Consumptioness.Models;

public class CostBreakdown
{
    public double CurrentWatts { get; set; }
    public double KwhPerHour { get; set; }
    public double CostPerHour { get; set; }
    public double CostPerDay { get; set; }
    public double CostPerMonth { get; set; }
    public double CostPerYear { get; set; }
    public double DailyUseHours { get; set; } = 8;
    public double CostPerDayStandby { get; set; }
    public double StandbyWatts { get; set; }
    public double AppliedRateRmPerKwh { get; set; }
    public TnbTariffBlock? AppliedBlock { get; set; }
}
