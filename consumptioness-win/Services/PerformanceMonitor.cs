using System.Diagnostics;

namespace Consumptioness.Services;

public class PerformanceMonitor : IDisposable
{
    private PerformanceCounter? _cpuCounter;
    private PerformanceCounter? _gpuCounter;
    private bool _disposed;

    public void Start()
    {
        try
        {
            _cpuCounter = new PerformanceCounter("Processor", "% Processor Time", "_Total");
            _cpuCounter.NextValue();
        }
        catch { }

        try
        {
            _gpuCounter = new PerformanceCounter("GPU Engine", "Utilization Percentage", "_Total");
            _gpuCounter.NextValue();
        }
        catch { }
    }

    public (double cpuPercent, double gpuPercent) GetCurrentLoad()
    {
        double cpu = 0, gpu = 0;

        try
        {
            if (_cpuCounter != null)
                cpu = Math.Round(_cpuCounter.NextValue(), 1);
        }
        catch { }

        try
        {
            if (_gpuCounter != null)
                gpu = Math.Round(_gpuCounter.NextValue(), 1);
        }
        catch
        {
            gpu = cpu * 0.6;
        }

        return (cpu, gpu);
    }

    public void Dispose()
    {
        if (!_disposed)
        {
            _cpuCounter?.Dispose();
            _gpuCounter?.Dispose();
            _disposed = true;
        }
    }
}
