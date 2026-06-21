# 🖟️ Consumptioness — C# WPF

PC Power Consumption Calculator with TNB Malaysia tariff rates. Native Windows app using WMI for hardware detection.

## Features
- One-click hardware scan (CPU, GPU, RAM, storage, motherboard)
- Real-time power monitoring via Performance Counters
- TNB Tariff A (Residential) progressive block pricing → RM
- Cost per hour / day / month / year
- Standby mode cost estimate
- Export to PDF & Excel
- Auto update checker via GitHub Releases

## Requirements
- Windows 10/11 (64-bit)
- .NET 8 Runtime

## Build
```bash
dotnet publish -c Release -r win-x64 --self-contained true
```
