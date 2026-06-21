using System.Management;
using Consumptioness.Models;

namespace Consumptioness.Services;

public class HardwareDetector
{
    public HardwareInfo Detect()
    {
        var info = new HardwareInfo();
        info.Cpu = DetectCpu();
        info.Gpus = DetectGpus();
        info.Ram = DetectRam();
        info.Storage = DetectStorage();
        info.Motherboard = DetectMotherboard();
        return info;
    }

    private CpuInfo DetectCpu()
    {
        var cpu = new CpuInfo();
        try
        {
            using var searcher = new ManagementObjectSearcher("SELECT * FROM Win32_Processor");
            foreach (var obj in searcher.Get())
            {
                cpu.Name = obj["Name"]?.ToString()?.Trim() ?? "Unknown";
                cpu.CoreCount = Convert.ToInt32(obj["NumberOfCores"] ?? 0);
                cpu.Manufacturer = obj["Manufacturer"]?.ToString()?.Contains("Intel") == true ? "Intel" : "AMD";
                var maxClock = Convert.ToDouble(obj["MaxClockSpeed"] ?? 0);
                cpu.BaseClockGHz = Math.Round(maxClock / 1000.0, 2);
                cpu.TdpWatts = EstimateCpuTdp(cpu.Name, cpu.CoreCount, cpu.Manufacturer);
            }
        }
        catch { }
        return cpu;
    }

    private int EstimateCpuTdp(string name, int cores, string manufacturer)
    {
        name = name.ToLower();
        if (name.Contains("ultra 9") || name.Contains("i9") || name.Contains("ryzen 9") || name.Contains("threadripper"))
            return Math.Min(cores * 18, 280);
        if (name.Contains("ultra 7") || name.Contains("i7") || name.Contains("ryzen 7"))
            return Math.Min(cores * 15, 170);
        if (name.Contains("ultra 5") || name.Contains("i5") || name.Contains("ryzen 5"))
            return Math.Min(cores * 12, 130);
        if (name.Contains("i3") || name.Contains("ryzen 3"))
            return Math.Min(cores * 10, 100);
        return Math.Min(cores * 12, 150);
    }

    private List<GpuInfo> DetectGpus()
    {
        var gpus = new List<GpuInfo>();
        try
        {
            using var searcher = new ManagementObjectSearcher("SELECT * FROM Win32_VideoController");
            foreach (var obj in searcher.Get())
            {
                var gpu = new GpuInfo();
                gpu.Name = obj["Name"]?.ToString()?.Trim() ?? "Unknown";
                gpu.VramMB = Convert.ToInt32(obj["AdapterRAM"] ?? 0) / (1024 * 1024);
                gpu.Manufacturer = obj["AdapterCompatibility"]?.ToString() ?? "Unknown";
                gpu.TdpWatts = EstimateGpuTdp(gpu.Name);
                gpus.Add(gpu);
            }
        }
        catch { }
        if (gpus.Count == 0)
            gpus.Add(new GpuInfo { Name = "Unknown GPU", TdpWatts = 75 });
        return gpus;
    }

    private int EstimateGpuTdp(string name)
    {
        name = name.ToLower();
        if (name.Contains("rtx 5090")) return 575;
        if (name.Contains("rtx 5080")) return 360;
        if (name.Contains("rtx 5070")) return 250;
        if (name.Contains("rtx 5060")) return 150;
        if (name.Contains("rtx 4090")) return 450;
        if (name.Contains("rtx 4080")) return 320;
        if (name.Contains("rtx 4070")) return 200;
        if (name.Contains("rtx 4060")) return 115;
        if (name.Contains("rtx 3090")) return 350;
        if (name.Contains("rtx 3080")) return 320;
        if (name.Contains("rtx 3070")) return 220;
        if (name.Contains("rtx 3060")) return 170;
        if (name.Contains("rtx 3050")) return 130;
        if (name.Contains("gtx 1080")) return 180;
        if (name.Contains("gtx 1070")) return 150;
        if (name.Contains("gtx 1060")) return 120;
        if (name.Contains("rx 7900")) return 300;
        if (name.Contains("rx 7800")) return 260;
        if (name.Contains("rx 7700")) return 200;
        if (name.Contains("rx 7600")) return 165;
        if (name.Contains("rx 6900")) return 300;
        if (name.Contains("rx 6800")) return 250;
        if (name.Contains("rx 6700")) return 175;
        if (name.Contains("rx 6600")) return 132;
        if (name.Contains("arc a770") || name.Contains("arc a750")) return 225;
        if (name.Contains("arc a580")) return 175;
        if (name.Contains("arc a380")) return 75;
        if (name.Contains("nvidia")) return 150;
        if (name.Contains("radeon")) return 175;
        if (name.Contains("intel")) return 100;
        return 75;
    }

    private RamInfo DetectRam()
    {
        var ram = new RamInfo();
        try
        {
            using var searcher = new ManagementObjectSearcher("SELECT * FROM Win32_PhysicalMemory");
            long total = 0;
            int sticks = 0;
            foreach (var obj in searcher.Get())
            {
                total += Convert.ToInt64(obj["Capacity"] ?? 0);
                sticks++;
            }
            ram.TotalBytes = total;
            ram.StickCount = sticks > 0 ? sticks : 1;
            ram.WattsPerStick = 3.0;
        }
        catch
        {
            ram.TotalBytes = 8L * 1024 * 1024 * 1024;
            ram.StickCount = 1;
        }
        return ram;
    }

    private List<StorageInfo> DetectStorage()
    {
        var storage = new List<StorageInfo>();
        try
        {
            using var searcher = new ManagementObjectSearcher("SELECT * FROM Win32_DiskDrive");
            foreach (var obj in searcher.Get())
            {
                var s = new StorageInfo();
                s.Name = obj["Model"]?.ToString()?.Trim() ?? "Unknown";
                s.SizeBytes = Convert.ToInt64(obj["Size"] ?? 0);
                var mediaType = obj["MediaType"]?.ToString() ?? "";
                s.Type = mediaType.Contains("SSD") || mediaType.Contains("Solid State") || s.Name.Contains("NVMe") ? "SSD" : "HDD";
                s.Watts = s.Type == "SSD" ? 3.0 : 8.0;
                storage.Add(s);
            }
        }
        catch { }
        if (storage.Count == 0)
            storage.Add(new StorageInfo { Name = "Unknown Drive", Type = "SSD", Watts = 3.0 });
        return storage;
    }

    private MotherboardInfo DetectMotherboard()
    {
        var mobo = new MotherboardInfo();
        try
        {
            using var searcher = new ManagementObjectSearcher("SELECT * FROM Win32_BaseBoard");
            foreach (var obj in searcher.Get())
            {
                mobo.Manufacturer = obj["Manufacturer"]?.ToString()?.Trim() ?? "Unknown";
                mobo.Product = obj["Product"]?.ToString()?.Trim() ?? "Unknown";
            }
        }
        catch { }

        try
        {
            using var searcher = new ManagementObjectSearcher("SELECT * FROM Win32_ComputerSystem");
            foreach (var obj in searcher.Get())
            {
                var model = obj["Model"]?.ToString()?.ToLower() ?? "";
                if (model.Contains("laptop") || model.Contains("book"))
                    mobo.EstimatedWatts = 15;
                else if (model.Contains("workstation") || model.Contains("server"))
                    mobo.EstimatedWatts = 60;
                else
                    mobo.EstimatedWatts = 40;
            }
        }
        catch { }

        mobo.Chipset = mobo.Product.Length > 0 ? mobo.Product : "Unknown";
        return mobo;
    }
}
