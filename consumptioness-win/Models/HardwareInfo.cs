namespace Consumptioness.Models;

public class HardwareInfo
{
    public CpuInfo Cpu { get; set; } = new();
    public List<GpuInfo> Gpus { get; set; } = new();
    public RamInfo Ram { get; set; } = new();
    public List<StorageInfo> Storage { get; set; } = new();
    public MotherboardInfo Motherboard { get; set; } = new();
    public int FanCount { get; set; } = 3;
    public int UsbDevices { get; set; } = 2;
    public string CoolerModel { get; set; } = "Stock/Default";
    public double CoolerWatts { get; set; } = 4.0;
}

public class CpuInfo
{
    public string Name { get; set; } = "Unknown";
    public int CoreCount { get; set; }
    public double BaseClockGHz { get; set; }
    public string Manufacturer { get; set; } = "Unknown";
    public int TdpWatts { get; set; }
}

public class GpuInfo
{
    public string Name { get; set; } = "Unknown";
    public string Manufacturer { get; set; } = "Unknown";
    public int VramMB { get; set; }
    public int TdpWatts { get; set; }
}

public class RamInfo
{
    public long TotalBytes { get; set; }
    public int StickCount { get; set; }
    public double WattsPerStick { get; set; } = 3.0;
}

public class StorageInfo
{
    public string Name { get; set; } = "Unknown";
    public string Type { get; set; } = "Unknown";
    public long SizeBytes { get; set; }
    public double Watts { get; set; }
}

public class MotherboardInfo
{
    public string Manufacturer { get; set; } = "Unknown";
    public string Product { get; set; } = "Unknown";
    public string Chipset { get; set; } = "Unknown";
    public int EstimatedWatts { get; set; } = 40;
}
