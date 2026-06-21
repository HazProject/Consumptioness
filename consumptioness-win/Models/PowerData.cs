namespace Consumptioness.Models;

public class PowerData
{
    public double CurrentWatts { get; set; }
    public double MaxWatts { get; set; }
    public double CpuWatts { get; set; }
    public double GpuWatts { get; set; }
    public double OtherWatts { get; set; }
    public double CpuLoadPercent { get; set; }
    public double GpuLoadPercent { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.Now;
}
