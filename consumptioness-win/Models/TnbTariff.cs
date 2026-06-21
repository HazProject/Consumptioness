namespace Consumptioness.Models;

public class TnbTariffBlock
{
    public string Name { get; set; } = "";
    public int MinKwh { get; set; }
    public int? MaxKwh { get; set; }
    public double SenPerKwh { get; set; }
}

public class TnbTariff
{
    public string Name { get; set; } = "Tariff A - Residential";
    public List<TnbTariffBlock> Blocks { get; set; } = new();
}
