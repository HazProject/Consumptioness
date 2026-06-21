using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Text.RegularExpressions;
using System.Threading.Tasks;

namespace Consumptioness.Services;

public class CoolerLookupService
{
    private static readonly HttpClient _httpClient = new(new HttpClientHandler 
    { 
        AutomaticDecompression = System.Net.DecompressionMethods.All 
    })
    {
        Timeout = TimeSpan.FromSeconds(6)
    };

    // Predefined popular models for instant, zero-network lookup
    private static readonly Dictionary<string, double> LocalDatabase = new(StringComparer.OrdinalIgnoreCase)
    {
        { "nh-d15", 10.0 }, // Dual 140mm fans
        { "nh-u12s", 5.0 }, // Single 120mm fan
        { "nh-l9i", 3.0 },  // Low profile
        { "hyper 212", 4.0 }, // Single 120mm fan
        { "h150i", 25.0 },  // 360mm AIO (Pump + 3 fans)
        { "h100i", 18.0 },  // 240mm AIO (Pump + 2 fans)
        { "kraken x73", 26.0 }, // 360mm AIO
        { "kraken x53", 19.0 }, // 240mm AIO
        { "kraken elite 360", 28.0 },
        { "pure loop", 18.0 },
        { "dark rock pro 4", 12.0 },
        { "peerless assassin 120", 8.0 }, // Dual 120mm fans
        { "phantom spirit 120", 8.5 },
        { "wraith prism", 5.0 },
        { "wraith stealth", 3.0 },
        { "stock", 3.5 }
    };

    public async Task<double> LookupWatts(string model)
    {
        if (string.IsNullOrWhiteSpace(model)) return 4.0; // Default fallback

        // 1. Check local database
        string cleanModel = model.Trim().ToLower();
        foreach (var entry in LocalDatabase)
        {
            if (cleanModel.Contains(entry.Key))
            {
                return entry.Value;
            }
        }

        // 2. Perform simple online lookup via DuckDuckGo
        try
        {
            _httpClient.DefaultRequestHeaders.UserAgent.Clear();
            _httpClient.DefaultRequestHeaders.UserAgent.ParseAdd("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");

            string query = Uri.EscapeDataString($"{model} cooler power consumption wattage spec");
            string url = $"https://html.duckduckgo.com/html/?q={query}";
            
            string html = await _httpClient.GetStringAsync(url);
            
            // Clean HTML tags to get raw text snippets
            string text = Regex.Replace(html, "<[^>]*>", " ");

            // Scan for wattage numbers (e.g. 5W, 5 watts, 12W, max power draw 15W)
            // Look for patterns like " 15W", "12 watt", " 4.5 W"
            var matches = Regex.Matches(text, @"\b([0-9]{1,2}(?:\.[0-9])?)\s*(?:W|watts?|TDP)\b", RegexOptions.IgnoreCase);
            
            double sum = 0;
            int count = 0;

            foreach (Match match in matches)
            {
                if (double.TryParse(match.Groups[1].Value, out double val))
                {
                    // Filter out unrealistic wattages for fans/coolers (usually 2W to 40W)
                    if (val >= 1.5 && val <= 45)
                    {
                        sum += val;
                        count++;
                    }
                }
            }

            if (count > 0)
            {
                return Math.Round(sum / count, 1); // Return average of matches found
            }
        }
        catch
        {
            // Ignore network errors and proceed to heuristics
        }

        // 3. Heuristic fallback based on keywords
        if (cleanModel.Contains("aio") || cleanModel.Contains("liquid") || cleanModel.Contains("360") || cleanModel.Contains("280"))
        {
            return 22.0; // Estimated 3-fan AIO pump + fans
        }
        if (cleanModel.Contains("240") || cleanModel.Contains("120") && (cleanModel.Contains("water") || cleanModel.Contains("cooler")))
        {
            return 15.0; // Estimated 2-fan AIO
        }
        if (cleanModel.Contains("dual") || cleanModel.Contains("double"))
        {
            return 8.0;
        }

        return 4.5; // Average air cooler
    }
}
