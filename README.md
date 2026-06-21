# ⚡ Consumptioness

PC Power Consumption Calculator with **TNB Malaysia tariff rates**. Auto-detects your hardware, monitors real-time power draw, and shows costs in **Malaysian Ringgit (RM)**.

## Two Versions

| Version | Folder | Size | Detection |
|---------|--------|------|-----------|
| **C# WPF** (Recommended) | `consumptioness-win/` | ~35 MB | WMI — best hardware access |
| **Electron + React** | `consumptioness-electron/` | ~200 MB | systeminformation — cross-platform |

## Features
- One-click hardware scan — CPU, GPU, RAM, storage, motherboard
- Real-time power monitoring (1s refresh)
- TNB Tariff A — progressive block pricing (21.8–57.1 sen/kWh)
- Cost per hour / day / month / year in RM
- Standby/idle cost estimate
- Export to PDF & Excel
- Auto update checker via GitHub Releases

## Quick Start

### C# WPF
```bash
cd consumptioness-win
dotnet run
```

### Electron
```bash
cd consumptioness-electron
npm install
npm run electron:dev
```

## Tech Stack
- **C# WPF:** .NET 8, WMI, Performance Counters, QuestPDF, ClosedXML
- **Electron:** React, systeminformation, jsPDF, ExcelJS, electron-updater

## License
MIT — Made by [Haz](https://github.com/HazProject)
