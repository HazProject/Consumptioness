namespace Consumptioness.Models;

public class AppUpdate
{
    public string Version { get; set; } = "";
    public string DownloadUrl { get; set; } = "";
    public string ReleaseNotes { get; set; } = "";
    public DateTime PublishedAt { get; set; }
    public bool IsAvailable { get; set; }
}
