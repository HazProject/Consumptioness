using Consumptioness.Models;

namespace Consumptioness.Services;

public class PowerEstimator
{
    public (double maxWatts, double otherWatts) CalculateMaxPower(HardwareInfo hw)
    {
        double cpu = hw.Cpu.TdpWatts;
        double gpu = hw.Gpus.Count > 0 ? hw.Gpus.Max(g => g.TdpWatts) : 0;
        double ram = hw.Ram.StickCount * hw.Ram.WattsPerStick;
        double storage = hw.Storage.Sum(s => s.Watts);
        double mobo = hw.Motherboard.EstimatedWatts;
        double fans = hw.FanCount * 2.5;
        double usb = hw.UsbDevices * 2.5;
        double other = ram + storage + mobo + fans + usb;

        return (cpu + gpu + other, other);
    }

    public (double cpuWatts, double gpuWatts) CalculateLivePower(
        HardwareInfo hw, double cpuLoad, double gpuLoad)
    {
        double cpuMax = hw.Cpu.TdpWatts;
        double gpuMax = hw.Gpus.Count > 0 ? hw.Gpus[0].TdpWatts : 0;

        double cpuWatts = Math.Round(cpuMax * (cpuLoad / 100.0), 1);
        double gpuWatts = Math.Round(gpuMax * (gpuLoad / 100.0), 1);

        return (cpuWatts, gpuWatts);
    }
}
