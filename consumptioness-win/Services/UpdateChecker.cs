using System.Net.Http;
using System.Reflection;
using Newtonsoft.Json.Linq;
using Consumptioness.Models;

namespace Consumptioness.Services;

public class UpdateChecker
{
    private readonly string _repoUrl;
    private readonly string _currentVersion;
    private readonly HttpClient _http;

    public UpdateChecker(string githubRepo = "HazProject/Consumptioness")
    {
        _repoUrl = $"https://api.github.com/repos/{githubRepo}/releases/latest";
        _currentVersion = Assembly.GetExecutingAssembly().GetName().Version?.ToString() ?? "0.0.1.0";
        _http = new HttpClient();
        _http.DefaultRequestHeaders.UserAgent.ParseAdd("Consumptioness");
    }

    public string CurrentVersion => _currentVersion;

    public async Task<AppUpdate> CheckForUpdates()
    {
        var update = new AppUpdate { IsAvailable = false };

        try
        {
            var response = await _http.GetStringAsync(_repoUrl);
            var json = JObject.Parse(response);

            var latestTag = json["tag_name"]?.ToString()?.TrimStart('v') ?? "0.0.1";
            update.Version = latestTag;

            var current = new Version(ParseVersion(_currentVersion));
            var latest = new Version(ParseVersion(latestTag));

            if (latest > current)
            {
                update.IsAvailable = true;
                update.DownloadUrl = json["html_url"]?.ToString() ?? "";
                update.ReleaseNotes = json["body"]?.ToString() ?? "No release notes available.";
                update.PublishedAt = json["published_at"]?.ToObject<DateTime>() ?? DateTime.Now;
            }
        }
        catch
        {
            // Offline or no releases yet
        }

        return update;
    }

    private string ParseVersion(string v)
    {
        var parts = v.Split('.');
        if (parts.Length == 3) return v + ".0";
        if (parts.Length < 3) return v + ".0.0.0";
        return v;
    }
}
