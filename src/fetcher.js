/**
 * Yahoo Finance data fetcher with CORS proxy + localStorage caching.
 * Returns monthly [date, price, dividend] arrays compatible with ETF_CATALOGUE.monthly format.
 */

const PROXY = "https://corsproxy.io/?";
const YF_BASE = "https://query1.finance.yahoo.com/v8/finance/chart/";

function cacheKey(ticker) {
  const d = new Date();
  const day = `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,"0")}${String(d.getDate()).padStart(2,"0")}`;
  return `etf_${ticker}_${day}`;
}

function getCache(ticker) {
  try {
    const key = cacheKey(ticker);
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch { return null; }
}

function setCache(ticker, data) {
  try {
    // Clean old caches for this ticker
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(`etf_${ticker}_`) && k !== cacheKey(ticker)) {
        localStorage.removeItem(k);
      }
    }
    localStorage.setItem(cacheKey(ticker), JSON.stringify(data));
  } catch { /* quota exceeded — ignore */ }
}

/**
 * Fetch monthly data from Yahoo Finance.
 * @param {string} ticker
 * @returns {Promise<{monthly: Array, lastDate: string, source: string}>}
 */
export async function fetchMonthlyData(ticker) {
  // 1. Check cache
  const cached = getCache(ticker);
  if (cached) return { ...cached, source: "cache" };

  // 2. Fetch from Yahoo Finance
  try {
    const url = `${PROXY}${encodeURIComponent(`${YF_BASE}${ticker}?range=max&interval=1mo&events=div`)}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();

    const result = json.chart?.result?.[0];
    if (!result) throw new Error("No data in response");

    const timestamps = result.timestamp || [];
    const closes = result.indicators?.quote?.[0]?.close || [];
    const divEvents = result.events?.dividends || {};

    // Build dividend lookup: timestamp -> amount
    const divMap = {};
    for (const [ts, info] of Object.entries(divEvents)) {
      // Round timestamp to start of month for matching
      const d = new Date(Number(ts) * 1000);
      const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;
      divMap[key] = (divMap[key] || 0) + (info.amount || 0);
    }

    // Build monthly array
    const monthly = [];
    for (let i = 0; i < timestamps.length; i++) {
      const d = new Date(timestamps[i] * 1000);
      const date = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;
      const price = closes[i];
      if (price == null || isNaN(price)) continue;
      const div = divMap[date] || 0;
      monthly.push([date, parseFloat(price.toFixed(2)), parseFloat(div.toFixed(4))]);
    }

    // Deduplicate by date (keep last)
    const seen = new Map();
    for (const row of monthly) {
      seen.set(row[0], row);
    }
    const deduped = [...seen.values()].sort((a, b) => a[0].localeCompare(b[0]));

    const lastDate = deduped.length > 0 ? deduped[deduped.length - 1][0] : "N/A";
    const payload = { monthly: deduped, lastDate };
    setCache(ticker, payload);
    return { ...payload, source: "yahoo" };
  } catch (err) {
    console.warn(`[fetcher] Failed to fetch ${ticker}:`, err.message);
    return null; // caller should use fallback
  }
}

/**
 * Interpolate missing months in a quarterly-only monthly array.
 * Used as fallback when API is unavailable.
 */
export function interpolateMonthly(monthly) {
  if (!monthly || monthly.length < 2) return monthly;

  const sorted = [...monthly].sort((a, b) => a[0].localeCompare(b[0]));
  const result = [];

  for (let i = 0; i < sorted.length - 1; i++) {
    const [d1, p1, div1] = sorted[i];
    const [d2, p2, div2] = sorted[i + 1];
    result.push(sorted[i]);

    // Parse dates
    const [y1, m1] = d1.split("-").map(Number);
    const [y2, m2] = d2.split("-").map(Number);
    const months1 = y1 * 12 + m1;
    const months2 = y2 * 12 + m2;
    const gap = months2 - months1;

    if (gap > 1) {
      for (let j = 1; j < gap; j++) {
        const totalM = months1 + j;
        const yr = Math.floor((totalM - 1) / 12);
        const mo = ((totalM - 1) % 12) + 1;
        const t = j / gap;
        const price = parseFloat((p1 + (p2 - p1) * t).toFixed(2));
        // Spread dividends evenly into interpolated months (approximate)
        const div = 0;
        result.push([`${yr}-${String(mo).padStart(2, "0")}`, price, div]);
      }
    }
  }
  // Add the last point
  result.push(sorted[sorted.length - 1]);
  return result;
}
