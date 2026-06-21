// Predefined popular models for instant lookup
const LocalDatabase: Record<string, number> = {
  'nh-d15': 10.0,
  'nh-u12s': 5.0,
  'nh-l9i': 3.0,
  'hyper 212': 4.0,
  'h150i': 25.0,
  'h100i': 18.0,
  'kraken x73': 26.0,
  'kraken x53': 19.0,
  'kraken elite 360': 28.0,
  'pure loop': 18.0,
  'dark rock pro 4': 12.0,
  'peerless assassin 120': 8.0,
  'phantom spirit 120': 8.5,
  'wraith prism': 5.0,
  'wraith stealth': 3.0,
  'stock': 3.5,
};

export async function lookupCoolerWatts(model: string): Promise<number> {
  if (!model || !model.trim()) return 4.0;

  const cleanModel = model.trim().toLowerCase();

  // 1. Local Database Search
  for (const [key, value] of Object.entries(LocalDatabase)) {
    if (cleanModel.includes(key)) {
      return value;
    }
  }

  // 2. Online search via DuckDuckGo (HTML)
  try {
    const query = encodeURIComponent(`${model} cooler power consumption wattage spec`);
    // In Electron, we can use fetch directly (if CORS permits or if executed in the Main process via IPC).
    // Let's do a fetch. If it fails due to CORS in renderer, we can catch it and fall back to heuristics.
    const url = `https://html.duckduckgo.com/html/?q=${query}`;
    const res = await fetch(url);
    const html = await res.text();

    // Strip HTML tags
    const text = html.replace(/<[^>]*>/g, ' ');

    // Match wattage patterns
    const regex = /\b([0-9]{1,2}(?:\.[0-9])?)\s*(?:W|watts?|TDP)\b/gi;
    let match;
    let sum = 0;
    let count = 0;

    while ((match = regex.exec(text)) !== null) {
      const val = parseFloat(match[1]);
      if (val >= 1.5 && val <= 45) {
        sum += val;
        count++;
      }
    }

    if (count > 0) {
      return Math.round((sum / count) * 10) / 10;
    }
  } catch (e) {
    // Fail silently, go to heuristics
  }

  // 3. Heuristic fallback
  if (cleanModel.includes('aio') || cleanModel.includes('liquid') || cleanModel.includes('360') || cleanModel.includes('280')) {
    return 22.0;
  }
  if (cleanModel.includes('240') || cleanModel.includes('120')) {
    return 15.0;
  }
  if (cleanModel.includes('dual') || cleanModel.includes('double')) {
    return 8.0;
  }

  return 4.5;
}
