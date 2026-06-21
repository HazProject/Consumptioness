using System;
using System.ComponentModel;
using System.Diagnostics;
using System.Windows;
using System.Windows.Threading;
using Consumptioness.Models;
using Consumptioness.Services;

namespace Consumptioness;

public partial class MainWindow : Window
{
    private readonly HardwareDetector _hardware;
    private readonly PowerEstimator _powerEstimator;
    private readonly TnbTariffService _tnb;
    private readonly ExportService _export;
    private readonly UpdateChecker _updater;
    private PerformanceMonitor? _monitor;
    private DispatcherTimer? _liveTimer;
    private HardwareInfo? _currentHardware;
    private PowerData _currentPower = new();
    private CostBreakdown _currentCost = new();
    private bool _isMonitoring;

    public MainWindow()
    {
        InitializeComponent();
        _hardware = new HardwareDetector();
        _powerEstimator = new PowerEstimator();
        _tnb = new TnbTariffService();
        _export = new ExportService();
        _updater = new UpdateChecker();
    }

    private async void BtnScan_Click(object sender, RoutedEventArgs e)
    {
        BtnScan.IsEnabled = false;
        TxtStatus.Text = "Scanning hardware...";

        await Task.Run(() =>
        {
            _currentHardware = _hardware.Detect();
        });

        DisplayHardware(_currentHardware);

        var (maxWatts, otherWatts) = _powerEstimator.CalculateMaxPower(_currentHardware);
        _currentPower.MaxWatts = maxWatts;
        _currentPower.OtherWatts = otherWatts;
        TxtMaxPower.Text = $"{maxWatts:F0} W";

        StartMonitoring();
        UpdateCost();

        BtnExportPdf.IsEnabled = true;
        BtnExportExcel.IsEnabled = true;
        BtnScan.IsEnabled = true;
        TxtStatus.Text = $"Scan complete. Detected {_currentHardware.Cpu.Name} + {_currentHardware.Gpus[0].Name}";
    }

    private void DisplayHardware(HardwareInfo hw)
    {
        var items = new System.Collections.ObjectModel.ObservableCollection<HardwareItem>();

        items.Add(new HardwareItem { Icon = "🖥️", Label = $"CPU: {hw.Cpu.Name}", Value = $"{hw.Cpu.TdpWatts}W" });
        if (hw.Gpus.Count > 0)
            items.Add(new HardwareItem { Icon = "🎮", Label = $"GPU: {hw.Gpus[0].Name}", Value = $"{hw.Gpus[0].TdpWatts}W" });
        items.Add(new HardwareItem { Icon = "💾", Label = $"RAM: {hw.Ram.TotalBytes / (1024 * 1024 * 1024)}GB ({hw.Ram.StickCount} sticks)", Value = $"{hw.Ram.StickCount * hw.Ram.WattsPerStick:F0}W" });
        foreach (var s in hw.Storage)
            items.Add(new HardwareItem { Icon = "💽", Label = $"{s.Type}: {s.Name}", Value = $"{s.Watts}W" });
        items.Add(new HardwareItem { Icon = "🔧", Label = $"Mobo: {hw.Motherboard.Manufacturer}", Value = $"{hw.Motherboard.EstimatedWatts}W" });
        items.Add(new HardwareItem { Icon = "🌬️", Label = $"Fans + Peripherals", Value = $"{hw.FanCount * 2.5 + hw.UsbDevices * 2.5:F0}W" });

        HardwareList.ItemsSource = items;
    }

    private void StartMonitoring()
    {
        if (_isMonitoring) return;

        _monitor = new PerformanceMonitor();
        _monitor.Start();
        _isMonitoring = true;

        _liveTimer = new DispatcherTimer { Interval = TimeSpan.FromSeconds(1) };
        _liveTimer.Tick += OnLiveTick;
        _liveTimer.Start();
    }

    private void OnLiveTick(object? sender, EventArgs e)
    {
        if (_currentHardware == null || _monitor == null) return;

        var (cpuLoad, gpuLoad) = _monitor.GetCurrentLoad();
        var (cpuWatts, gpuWatts) = _powerEstimator.CalculateLivePower(_currentHardware, cpuLoad, gpuLoad);

        _currentPower.CpuWatts = cpuWatts;
        _currentPower.GpuWatts = gpuWatts;
        _currentPower.CpuLoadPercent = cpuLoad;
        _currentPower.GpuLoadPercent = gpuLoad;
        _currentPower.CurrentWatts = cpuWatts + gpuWatts + _currentPower.OtherWatts;
        _currentPower.Timestamp = DateTime.Now;

        UpdateDisplay();
        UpdateCost();
    }

    private void UpdateDisplay()
    {
        TxtLiveWatts.Text = $"{_currentPower.CurrentWatts:F0} W";
        TxtCpuLoad.Text = $"{_currentPower.CpuLoadPercent:F0}%";
        TxtCpuWatts.Text = $"{_currentPower.CpuWatts:F0} W";
        TxtGpuLoad.Text = $"{_currentPower.GpuLoadPercent:F0}%";
        TxtGpuWatts.Text = $"{_currentPower.GpuWatts:F0} W";
        TxtOtherWatts.Text = $"{_currentPower.OtherWatts:F0} W";
    }

    private void UpdateCost()
    {
        var hours = SliderHours.Value;
        _currentCost = _tnb.CalculateCost(_currentPower.CurrentWatts, hours);

        TxtCostHour.Text = $"RM {_currentCost.CostPerHour:F2}";
        TxtCostDay.Text = $"RM {_currentCost.CostPerDay:F2}";
        TxtCostMonth.Text = $"RM {_currentCost.CostPerMonth:F2}";
        TxtCostYear.Text = $"RM {_currentCost.CostPerYear:F2}";
        TxtStandbyCost.Text = $"RM {_currentCost.CostPerDayStandby:F2}";
    }

    private void SliderHours_ValueChanged(object sender, RoutedPropertyChangedEventArgs<double> e)
    {
        TxtDailyHours.Text = $"{e.NewValue:F0} hours";
        UpdateCost();
    }

    private async void BtnExportPdf_Click(object sender, RoutedEventArgs e)
    {
        if (_currentHardware == null) return;

        BtnExportPdf.IsEnabled = false;
        TxtStatus.Text = "Generating PDF...";

        try
        {
            var path = await _export.ExportToPdf(_currentHardware, _currentPower, _currentCost, _tnb.GetTariff());
            Process.Start(new ProcessStartInfo(path) { UseShellExecute = true });
            TxtStatus.Text = $"PDF saved: {path}";
        }
        catch (Exception ex)
        {
            TxtStatus.Text = $"PDF export failed: {ex.Message}";
        }

        BtnExportPdf.IsEnabled = true;
    }

    private async void BtnExportExcel_Click(object sender, RoutedEventArgs e)
    {
        if (_currentHardware == null) return;

        BtnExportExcel.IsEnabled = false;
        TxtStatus.Text = "Generating Excel...";

        try
        {
            var path = await _export.ExportToExcel(_currentHardware, _currentPower, _currentCost, _tnb.GetTariff());
            Process.Start(new ProcessStartInfo(path) { UseShellExecute = true });
            TxtStatus.Text = $"Excel saved: {path}";
        }
        catch (Exception ex)
        {
            TxtStatus.Text = $"Excel export failed: {ex.Message}";
        }

        BtnExportExcel.IsEnabled = true;
    }

    private async void BtnUpdate_Click(object sender, RoutedEventArgs e)
    {
        BtnUpdate.IsEnabled = false;
        TxtStatus.Text = "Checking for updates...";

        var update = await _updater.CheckForUpdates();

        if (update.IsAvailable)
        {
            var result = MessageBox.Show(
                $"Version {update.Version} is available!\n\n{update.ReleaseNotes}\n\nDownload now?",
                "Update Available",
                MessageBoxButton.YesNo,
                MessageBoxImage.Information);

            if (result == MessageBoxResult.Yes)
                Process.Start(new ProcessStartInfo(update.DownloadUrl) { UseShellExecute = true });
        }
        else
        {
            TxtStatus.Text = $"You're up to date (v{_updater.CurrentVersion.Split('.')[0]}.0.0.1).";
        }

        BtnUpdate.IsEnabled = true;
    }

    protected override void OnClosing(CancelEventArgs e)
    {
        _liveTimer?.Stop();
        _monitor?.Dispose();
        base.OnClosing(e);
    }
}

public class HardwareItem
{
    public string Icon { get; set; } = "";
    public string Label { get; set; } = "";
    public string Value { get; set; } = "";
}
