import { NextRequest, NextResponse } from "next/server";

/**
 * Built-in lookup table of California city coordinates.
 * Same pattern used across weather, seismic, and other API routes.
 */
const CALIFORNIA_CITIES: Record<string, { lat: number; lon: number }> = {
  "san jose": { lat: 37.3382, lon: -121.8863 },
  "los angeles": { lat: 34.0522, lon: -118.2437 },
  "san francisco": { lat: 37.7749, lon: -122.4194 },
  "san diego": { lat: 32.7157, lon: -117.1611 },
  sacramento: { lat: 38.5816, lon: -121.4944 },
  oakland: { lat: 37.8044, lon: -122.2712 },
  fresno: { lat: 36.7378, lon: -119.7871 },
  "long beach": { lat: 33.77, lon: -118.1937 },
  irvine: { lat: 33.6846, lon: -117.8265 },
  berkeley: { lat: 37.8716, lon: -122.2727 },
  "palo alto": { lat: 37.4419, lon: -122.143 },
  "santa clara": { lat: 37.3541, lon: -121.9552 },
  sunnyvale: { lat: 37.3688, lon: -122.0363 },
  cupertino: { lat: 37.323, lon: -122.0322 },
  "mountain view": { lat: 37.3861, lon: -122.0839 },
  hayward: { lat: 37.6688, lon: -122.0808 },
  fremont: { lat: 37.5483, lon: -121.9886 },
  anaheim: { lat: 33.8353, lon: -117.9145 },
  "santa ana": { lat: 33.7455, lon: -117.8677 },
  pasadena: { lat: 34.1478, lon: -118.1445 },
  "san mateo": { lat: 37.5621, lon: -122.3255 },
  "santa cruz": { lat: 36.9741, lon: -122.0308 },
  modesto: { lat: 37.6391, lon: -120.9969 },
  bakersfield: { lat: 35.3733, lon: -119.0187 },
  stockton: { lat: 37.9577, lon: -121.2908 },
  riverside: { lat: 33.9806, lon: -117.3755 },
  "san luis obispo": { lat: 35.2828, lon: -120.6596 },
  monterey: { lat: 36.6002, lon: -121.8947 },
};

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/**
 * Simple in-memory rate limiter: tracks timestamps per IP.
 * 15 requests per minute — historical data is heavy.
 */
const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 15;

/**
 * In-memory cache for climate history results.
 * Key: normalized city name -> { data, timestamp }
 * 6-hour TTL — historical data doesn't change.
 */
const climateCache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours

/**
 * Shape of a single monthly data point returned by Open-Meteo Archive API.
 */
interface MonthlyDataPoint {
  time: string; // "2019-01-01"
  temperature_2m_max: number;
  temperature_2m_min: number;
  precipitation_sum: number;
  wind_speed_10m_max: number;
  sunshine_duration: number;
}

/**
 * Aggregated monthly stats across all years for a single calendar month.
 */
interface MonthlyAggregation {
  month: number;
  name: string;
  avgHigh_c: number;
  avgHigh_f: number;
  avgLow_c: number;
  avgLow_f: number;
  avgPrecipitation_mm: number;
  avgWindMax_kmh: number;
  avgWindMax_mph: number;
  avgSunshineHours: number;
  constructionScore: number;
  constructionRating: string;
}

/**
 * Score a month for construction suitability (0-100).
 *
 * Ideal conditions:
 *  - Temperature: 50-85 °F  (10-30 °C)
 *  - Precipitation: < 50 mm
 *  - Max wind: < 25 km/h
 *  - Sunshine: > 200 hours
 */
function scoreMonth(stats: {
  avgHigh_c: number;
  avgLow_c: number;
  avgPrecipitation_mm: number;
  avgWindMax_kmh: number;
  avgSunshineHours: number;
}): number {
  let score = 100;
  const highF = (stats.avgHigh_c * 9) / 5 + 32;
  const lowF = (stats.avgLow_c * 9) / 5 + 32;

  // --- Temperature penalties ---
  if (lowF < 32) {
    score -= 35; // freeze risk — concrete curing compromised
  } else if (lowF < 40) {
    score -= 20; // near-freezing — slow curing
  } else if (lowF < 50) {
    score -= 8; // cool but workable
  }

  if (highF > 105) {
    score -= 30; // extreme heat — rapid concrete drying, worker safety
  } else if (highF > 100) {
    score -= 22; // very hot
  } else if (highF > 95) {
    score -= 14;
  }

  // --- Precipitation penalties ---
  if (stats.avgPrecipitation_mm > 150) {
    score -= 35; // very wet — frequent rain delays
  } else if (stats.avgPrecipitation_mm > 100) {
    score -= 25;
  } else if (stats.avgPrecipitation_mm > 60) {
    score -= 15;
  } else if (stats.avgPrecipitation_mm > 30) {
    score -= 6;
  }

  // --- Wind penalties ---
  if (stats.avgWindMax_kmh > 45) {
    score -= 20; // crane / lift safety hazard
  } else if (stats.avgWindMax_kmh > 35) {
    score -= 12;
  } else if (stats.avgWindMax_kmh > 25) {
    score -= 5;
  }

  // --- Sunshine bonus ---
  if (stats.avgSunshineHours < 120) {
    score -= 10; // very cloudy — short work windows
  } else if (stats.avgSunshineHours > 250) {
    score += 5; // bonus for long sunny days
  }

  return Math.max(0, Math.min(100, score));
}

function ratingLabel(score: number): string {
  if (score >= 80) return "Excellent";
  if (score >= 65) return "Good";
  if (score >= 45) return "Fair";
  if (score >= 25) return "Poor";
  return "Not Recommended";
}

/**
 * Detect the 5-year climate trend by comparing the first and last year averages.
 */
function analyzeTrend(monthlyData: MonthlyDataPoint[]): {
  temperature: string;
  temperatureDelta_c: number;
  precipitation: string;
  precipitationDelta_mm: number;
  summary: string;
} {
  // Extract year from each entry
  const years = new Map<number, MonthlyDataPoint[]>();
  for (const m of monthlyData) {
    const year = new Date(m.time).getFullYear();
    if (!years.has(year)) years.set(year, []);
    years.get(year)!.push(m);
  }

  const sortedYears = [...years.keys()].sort();
  if (sortedYears.length < 2) {
    return {
      temperature: "Insufficient data",
      temperatureDelta_c: 0,
      precipitation: "Insufficient data",
      precipitationDelta_mm: 0,
      summary: "Need at least 2 years of data for trend analysis.",
    };
  }

  const firstYear = sortedYears[0];
  const lastYear = sortedYears[sortedYears.length - 1];
  const first = years.get(firstYear)!;
  const last = years.get(lastYear)!;

  const avg = (arr: number[]) => arr.reduce((s, v) => s + v, 0) / arr.length;

  const firstAvgTemp = avg(first.map((d) => (d.temperature_2m_max + d.temperature_2m_min) / 2));
  const lastAvgTemp = avg(last.map((d) => (d.temperature_2m_max + d.temperature_2m_min) / 2));
  const tempDelta = lastAvgTemp - firstAvgTemp;

  const firstAvgPrecip = avg(first.map((d) => d.precipitation_sum));
  const lastAvgPrecip = avg(last.map((d) => d.precipitation_sum));
  const precipDelta = lastAvgPrecip - firstAvgPrecip;

  let tempLabel: string;
  if (tempDelta > 0.5) tempLabel = "Warming trend detected";
  else if (tempDelta < -0.5) tempLabel = "Cooling trend detected";
  else tempLabel = "Stable temperatures";

  let precipLabel: string;
  if (precipDelta > 15) precipLabel = "Wetting trend detected";
  else if (precipDelta < -15) precipLabel = "Drying trend detected";
  else precipLabel = "Stable precipitation";

  const summaryParts: string[] = [];
  if (tempDelta > 0.5) summaryParts.push(`average temp increased +${tempDelta.toFixed(1)} °C`);
  else if (tempDelta < -0.5) summaryParts.push(`average temp decreased ${tempDelta.toFixed(1)} °C`);
  if (precipDelta > 15) summaryParts.push(`annual precipitation increased +${precipDelta.toFixed(0)} mm/month`);
  else if (precipDelta < -15) summaryParts.push(`annual precipitation decreased ${precipDelta.toFixed(0)} mm/month`);
  if (summaryParts.length === 0) summaryParts.push("climate conditions are relatively stable");

  return {
    temperature: tempLabel,
    temperatureDelta_c: Math.round(tempDelta * 100) / 100,
    precipitation: precipLabel,
    precipitationDelta_mm: Math.round(precipDelta * 100) / 100,
    summary: `Over ${firstYear}-${lastYear}: ${summaryParts.join(", ")}.`,
  };
}

/**
 * Generate ADU-specific construction recommendations based on climate analysis.
 */
function generateADURecommendations(monthlyAggs: MonthlyAggregation[], trend: ReturnType<typeof analyzeTrend>): {
  timing: string[];
  materials: string[];
  design: string[];
  riskMitigation: string[];
  summary: string;
} {
  const timing: string[] = [];
  const materials: string[] = [];
  const design: string[] = [];
  const riskMitigation: string[] = [];

  // Sort months by construction score descending
  const ranked = [...monthlyAggs].sort((a, b) => b.constructionScore - a.constructionScore);
  const bestMonths = ranked.slice(0, 3).map((m) => m.name);
  const worstMonths = ranked.slice(-3).map((m) => m.name);

  timing.push(`Optimal construction window: ${bestMonths.join(", ")}`);
  timing.push(`Avoid scheduling major work during: ${worstMonths.join(", ")}`);
  timing.push("Plan to pour foundations during the driest, mildest months for optimal curing");

  // Find the best contiguous block for a typical 3-6 month ADU build
  const byMonthNum = new Map<number, MonthlyAggregation>();
  for (const m of monthlyAggs) byMonthNum.set(m.month, m);

  let bestContigStart = 1;
  let bestContigScore = 0;
  for (let start = 0; start < 12; start++) {
    let blockScore = 0;
    for (let len = 0; len < 6; len++) {
      const idx = (start + len) % 12;
      const m = byMonthNum.get(idx + 1)!;
      blockScore += m.constructionScore;
      if (m.constructionScore < 40) break; // stop if we hit a bad month
    }
    if (blockScore > bestContigScore) {
      bestContigScore = blockScore;
      bestContigStart = start + 1;
    }
  }
  const contigMonths = [];
  for (let i = 0; i < 6; i++) {
    const idx = (bestContigStart - 1 + i) % 12;
    const m = byMonthNum.get(idx + 1)!;
    if (m.constructionScore < 40) break;
    contigMonths.push(m.name);
  }
  if (contigMonths.length >= 2) {
    timing.push(`Recommended 6-month ADU build window: ${contigMonths[0]} through ${contigMonths[contigMonths.length - 1]}`);
  }

  // Freeze risk recommendations
  const freezeMonths = monthlyAggs.filter((m) => m.avgLow_c < 2);
  if (freezeMonths.length > 0) {
    const names = freezeMonths.map((m) => m.name).join(", ");
    timing.push(`Freeze risk during ${names} — schedule concrete pours before or after this period`);
    materials.push("Use frost-resistant concrete mix (air-entrained) if pouring near freeze-risk months");
    riskMitigation.push(`Protect fresh concrete with insulated blankets during ${names}`);
  }

  // Heat recommendations
  const heatMonths = monthlyAggs.filter((m) => m.avgHigh_c > 35);
  if (heatMonths.length > 0) {
    const names = heatMonths.map((m) => m.name).join(", ");
    timing.push(`Extreme heat during ${names} — schedule heavy outdoor work for early morning`);
    materials.push("Use concrete with retarding admixtures during hot months to prevent flash setting");
    riskMitigation.push(`Provide shade structures and frequent hydration breaks during ${names}`);
    design.push("Consider radiant barrier roof sheathing to reduce cooling loads in hot months");
  }

  // Wet season recommendations
  const wetMonths = monthlyAggs.filter((m) => m.avgPrecipitation_mm > 80);
  if (wetMonths.length > 0) {
    const names = wetMonths.map((m) => m.name).join(", ");
    timing.push(`Rainy season typically: ${names} — plan indoor work (electrical, plumbing, drywall) for this period`);
    materials.push("Use pressure-treated lumber for any framing exposed during wet season");
    riskMitigation.push("Have tarps and temporary roof coverings ready during the rainy season");
    design.push("Install proper drainage and grading before rainy season begins");
  }

  // General ADU material recommendations
  materials.push("Fiber-cement siding (HardiePanel) performs well across California climate zones");
  materials.push("Consider cool-roof rated materials to meet Title 24 energy requirements");
  materials.push("Spray foam insulation provides both thermal and moisture barrier benefits");

  // Design recommendations
  design.push("Orient windows for cross-ventilation to take advantage of prevailing wind patterns");
  design.push("Include proper overhangs to shade windows during peak summer sun");
  design.push("Consider a mini-split heat pump system for efficient year-round comfort");

  // Trend-based recommendations
  if (trend.temperature.includes("Warming")) {
    design.push("Plan for increasing cooling loads — oversize HVAC slightly or add solar shading");
    materials.push("High-SHGC windows may lead to overheating; consider low-E coatings");
  }
  if (trend.precipitation.includes("Drying")) {
    riskMitigation.push("Declining precipitation trend — plan for potential future water restrictions");
    design.push("Consider drought-tolerant landscaping and graywater recycling for the ADU");
  }
  if (trend.precipitation.includes("Wetting")) {
    design.push("Ensure site grading directs water away from the ADU foundation");
    materials.push("Add extra waterproofing membranes to below-grade portions");
    riskMitigation.push("Monitor foundation drainage during increasingly wet seasons");
  }

  const summary = `Based on 5-year climate data, ${bestMonths.join(", ")} are the best months for ADU construction in this area. Start site prep and foundation work in ${bestMonths[0]}, target a completion goal within ${contigMonths.length >= 2 ? contigMonths[contigMonths.length - 1] : bestMonths[2]}. Schedule interior finishes during the less favorable months.`;

  return { timing, materials, design, riskMitigation, summary };
}

/**
 * GET /api/climate-history?city=San Jose
 *
 * Returns 5-year historical climate patterns for California cities using the
 * free Open-Meteo Historical Weather Archive API (no API key required).
 *
 * Includes:
 *  - Monthly temperature, precipitation, wind, and sunshine averages
 *  - Construction suitability scores per month
 *  - Best/worst months for construction
 *  - Freeze and heat wave risk analysis
 *  - Optimal construction season window
 *  - 5-year climate trend analysis
 *  - ADU-specific construction recommendations
 *
 * Rate limited to 15 requests/min per IP. Cached for 6 hours.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const city = searchParams.get("city");

  if (!city) {
    return NextResponse.json(
      { error: "Missing required query parameter: city" },
      { status: 400 }
    );
  }

  // --- Rate limiting by IP ---
  const clientIP = request.headers.get("x-forwarded-for") ?? "unknown";
  const now = Date.now();
  const timestamps = rateLimitMap.get(clientIP) ?? [];
  const recentTimestamps = timestamps.filter(
    (t) => now - t < RATE_LIMIT_WINDOW_MS
  );

  if (recentTimestamps.length >= RATE_LIMIT_MAX_REQUESTS) {
    return NextResponse.json(
      {
        error: "Rate limit exceeded. Please try again in 1 minute.",
        retryAfter: Math.ceil(
          (RATE_LIMIT_WINDOW_MS - (now - recentTimestamps[0])) / 1000
        ),
      },
      { status: 429 }
    );
  }
  recentTimestamps.push(now);
  rateLimitMap.set(clientIP, recentTimestamps);

  // --- Lookup city coordinates ---
  const normalizedCity = city.trim().toLowerCase();
  const coords = CALIFORNIA_CITIES[normalizedCity];

  if (!coords) {
    return NextResponse.json(
      {
        error: `City "${city}" not found in our California city database.`,
        availableCities: Object.keys(CALIFORNIA_CITIES).map(
          (c) => c.replace(/\b\w/g, (ch) => ch.toUpperCase())
        ),
      },
      { status: 404 }
    );
  }

  // --- Check cache ---
  const cacheKey = normalizedCity;
  const cached = climateCache.get(cacheKey);
  if (cached && now - cached.timestamp < CACHE_TTL_MS) {
    return NextResponse.json({
      ...(cached.data as Record<string, unknown>),
      _cached: true,
      _cacheAge: Math.round((now - cached.timestamp) / 1000),
    });
  }

  // --- Build Open-Meteo Historical Archive URL ---
  // Uses daily data and aggregates to monthly in-application.
  const apiUrl = new URL("https://archive-api.open-meteo.com/v1/archive");
  apiUrl.searchParams.set("latitude", coords.lat.toString());
  apiUrl.searchParams.set("longitude", coords.lon.toString());
  apiUrl.searchParams.set(
    "daily",
    "temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max,sunshine_duration"
  );
  apiUrl.searchParams.set("start_date", "2019-01-01");
  apiUrl.searchParams.set("end_date", "2023-12-31");
  apiUrl.searchParams.set("timezone", "America/Los_Angeles");

  try {
    const response = await fetch(apiUrl.toString(), {
      headers: { "User-Agent": "BayForge-AI/1.0" },
      signal: AbortSignal.timeout(15_000),
    });

    if (!response.ok) {
      throw new Error(
        `Open-Meteo Archive API returned ${response.status}: ${response.statusText}`
      );
    }

    const data = await response.json();
    const dailyTime: string[] = data.daily?.time ?? [];
    const dailyTempMax: (number | null)[] = data.daily?.temperature_2m_max ?? [];
    const dailyTempMin: (number | null)[] = data.daily?.temperature_2m_min ?? [];
    const dailyPrecip: (number | null)[] = data.daily?.precipitation_sum ?? [];
    const dailyWindMax: (number | null)[] = data.daily?.wind_speed_10m_max ?? [];
    const dailySunshine: (number | null)[] = data.daily?.sunshine_duration ?? [];

    if (dailyTime.length === 0) {
      return NextResponse.json(
        { error: "No historical climate data returned from Open-Meteo." },
        { status: 502 }
      );
    }

    // --- Aggregate daily data into monthly data points ---
    const monthlyMap = new Map<string, {
      maxTempMax: number;
      minTempMin: number;
      totalPrecip: number;
      maxWind: number;
      totalSunshine: number;
      days: number;
    }>();

    for (let i = 0; i < dailyTime.length; i++) {
      const date = dailyTime[i];
      const monthKey = date.substring(0, 7); // "2019-01"

      if (!monthlyMap.has(monthKey)) {
        monthlyMap.set(monthKey, {
          maxTempMax: -Infinity,
          minTempMin: Infinity,
          totalPrecip: 0,
          maxWind: 0,
          totalSunshine: 0,
          days: 0,
        });
      }

      const bucket = monthlyMap.get(monthKey)!;
      bucket.days++;

      const tMax = dailyTempMax[i];
      const tMin = dailyTempMin[i];
      const pr = dailyPrecip[i];
      const wMax = dailyWindMax[i];
      const sun = dailySunshine[i];

      if (tMax !== null && tMax > bucket.maxTempMax) bucket.maxTempMax = tMax;
      if (tMin !== null && tMin < bucket.minTempMin) bucket.minTempMin = tMin;
      if (pr !== null) bucket.totalPrecip += pr;
      if (wMax !== null && wMax > bucket.maxWind) bucket.maxWind = wMax;
      if (sun !== null) bucket.totalSunshine += sun;
    }

    // Convert to sorted MonthlyDataPoint array
    const monthlyData: MonthlyDataPoint[] = [...monthlyMap.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, b]) => ({
        time: `${key}-01`,
        temperature_2m_max: b.maxTempMax === -Infinity ? 0 : Math.round(b.maxTempMax * 10) / 10,
        temperature_2m_min: b.minTempMin === Infinity ? 0 : Math.round(b.minTempMin * 10) / 10,
        precipitation_sum: Math.round(b.totalPrecip * 10) / 10,
        wind_speed_10m_max: Math.round(b.maxWind * 10) / 10,
        sunshine_duration: Math.round(b.totalSunshine),
      }));

    // --- Aggregate by calendar month ---
    const buckets: Map<number, {
      highs: number[];
      lows: number[];
      precip: number[];
      wind: number[];
      sunshine: number[];
    }> = new Map();

    for (let m = 1; m <= 12; m++) {
      buckets.set(m, { highs: [], lows: [], precip: [], wind: [], sunshine: [] });
    }

    for (const dp of monthlyData) {
      const monthNum = new Date(dp.time).getMonth() + 1; // 1-12
      const bucket = buckets.get(monthNum)!;
      bucket.highs.push(dp.temperature_2m_max);
      bucket.lows.push(dp.temperature_2m_min);
      bucket.precip.push(dp.precipitation_sum);
      bucket.wind.push(dp.wind_speed_10m_max);
      bucket.sunshine.push(dp.sunshine_duration);
    }

    const avg = (arr: number[]) => arr.length ? arr.reduce((s, v) => s + v, 0) / arr.length : 0;
    const cToF = (c: number) => Math.round((c * 9) / 5 + 32);
    const kmhToMph = (k: number) => Math.round(k * 0.621371 * 10) / 10;

    const monthlyAggregations: MonthlyAggregation[] = [];
    for (let m = 1; m <= 12; m++) {
      const b = buckets.get(m)!;
      const avgHigh_c = Math.round(avg(b.highs) * 10) / 10;
      const avgLow_c = Math.round(avg(b.lows) * 10) / 10;
      const avgPrecipitation_mm = Math.round(avg(b.precip) * 10) / 10;
      const avgWindMax_kmh = Math.round(avg(b.wind) * 10) / 10;
      const avgSunshineHours = Math.round((avg(b.sunshine) / 3600) * 10) / 10;

      const score = scoreMonth({
        avgHigh_c,
        avgLow_c,
        avgPrecipitation_mm,
        avgWindMax_kmh,
        avgSunshineHours,
      });

      monthlyAggregations.push({
        month: m,
        name: MONTH_NAMES[m - 1],
        avgHigh_c,
        avgHigh_f: cToF(avgHigh_c),
        avgLow_c,
        avgLow_f: cToF(avgLow_c),
        avgPrecipitation_mm,
        avgWindMax_kmh,
        avgWindMax_mph: kmhToMph(avgWindMax_kmh),
        avgSunshineHours,
        constructionScore: score,
        constructionRating: ratingLabel(score),
      });
    }

    // --- Best & worst months ---
    const ranked = [...monthlyAggregations].sort(
      (a, b) => b.constructionScore - a.constructionScore
    );

    const bestMonths = ranked.slice(0, 3).map((m) => ({
      name: m.name,
      score: m.constructionScore,
      rating: m.constructionRating,
    }));

    const worstMonths = ranked.slice(-3).reverse().map((m) => ({
      name: m.name,
      score: m.constructionScore,
      rating: m.constructionRating,
    }));

    // --- Freeze risk months (avg low < 2 °C / 35.6 °F) ---
    const freezeMonths = monthlyAggregations.filter((m) => m.avgLow_c < 2).map((m) => m.name);

    // --- Heat wave months (avg high > 35 °C / 95 °F) ---
    const heatWaveMonths = monthlyAggregations.filter((m) => m.avgHigh_c > 35).map((m) => m.name);

    // --- Average annual precipitation ---
    const totalAllPrecip = monthlyData.reduce((s, d) => s + d.precipitation_sum, 0);
    const numYears = new Set(monthlyData.map((d) => new Date(d.time).getFullYear())).size;
    const avgAnnualPrecip_mm = Math.round((totalAllPrecip / numYears) * 10) / 10;
    const avgAnnualPrecip_inches = Math.round((avgAnnualPrecip_mm / 25.4) * 100) / 100;

    // --- Optimal construction season window ---
    // Find the longest contiguous run of months with score >= 50
    let bestWindowStart = 1;
    let bestWindowLen = 0;
    for (let start = 0; start < 12; start++) {
      let len = 0;
      for (let offset = 0; offset < 12; offset++) {
        const idx = (start + offset) % 12;
        if (monthlyAggregations[idx].constructionScore >= 50) {
          len++;
        } else {
          break;
        }
      }
      if (len > bestWindowLen) {
        bestWindowLen = len;
        bestWindowStart = start + 1;
      }
    }

    const windowMonths: string[] = [];
    for (let i = 0; i < bestWindowLen; i++) {
      const idx = (bestWindowStart - 1 + i) % 12;
      windowMonths.push(MONTH_NAMES[idx]);
    }

    const optimalWindow = {
      startMonth: MONTH_NAMES[(bestWindowStart - 1) % 12],
      endMonth: MONTH_NAMES[(bestWindowStart - 1 + bestWindowLen - 1) % 12],
      durationMonths: bestWindowLen,
      months: windowMonths,
    };

    // --- Recommended construction start/end dates ---
    // Use the best scoring month as ideal start, allow 4-6 months of build time
    const bestStartMonth = ranked[0].month;
    const buildMonths = Math.min(6, bestWindowLen);
    const recEndDate = new Date(2019, bestStartMonth - 1 + buildMonths - 1, 28);

    const recommendedDates = {
      idealStartDate: `${MONTH_NAMES[bestStartMonth - 1]} 1`,
      targetEndDate: `${MONTH_NAMES[recEndDate.getMonth()]} ${recEndDate.getDate()}`,
      buildDurationMonths: buildMonths,
      rationale: `Starting in ${ranked[0].name} (score: ${ranked[0].constructionScore}/100) maximizes dry, mild-weather days for foundation, framing, and exterior work.`,
    };

    // --- 5-year climate trend ---
    const trend = analyzeTrend(monthlyData);

    // --- ADU-specific recommendations ---
    const aduRecommendations = generateADURecommendations(monthlyAggregations, trend);

    // --- Per-year breakdown for reference ---
    const yearlyBreakdown: {
      year: number;
      avgTemp_c: number;
      avgTemp_f: number;
      totalPrecip_mm: number;
      totalPrecip_inches: number;
    }[] = [];

    const yearMap = new Map<number, MonthlyDataPoint[]>();
    for (const dp of monthlyData) {
      const yr = new Date(dp.time).getFullYear();
      if (!yearMap.has(yr)) yearMap.set(yr, []);
      yearMap.get(yr)!.push(dp);
    }

    for (const [yr, dps] of [...yearMap.entries()].sort()) {
      const yearAvgTemp = avg(dps.map((d) => (d.temperature_2m_max + d.temperature_2m_min) / 2));
      const yearTotalPrecip = dps.reduce((s, d) => s + d.precipitation_sum, 0);
      yearlyBreakdown.push({
        year: yr,
        avgTemp_c: Math.round(yearAvgTemp * 10) / 10,
        avgTemp_f: cToF(yearAvgTemp),
        totalPrecip_mm: Math.round(yearTotalPrecip * 10) / 10,
        totalPrecip_inches: Math.round((yearTotalPrecip / 25.4) * 100) / 100,
      });
    }

    // --- Build result ---
    const result = {
      city: city.trim(),
      coordinates: coords,
      dataPeriod: {
        start: "2019-01-01",
        end: "2023-12-31",
        years: numYears,
        dataPoints: monthlyData.length,
      },

      monthlyAverages: monthlyAggregations.map((m) => ({
        month: m.name,
        avgHigh_c: m.avgHigh_c,
        avgHigh_f: m.avgHigh_f,
        avgLow_c: m.avgLow_c,
        avgLow_f: m.avgLow_f,
        avgPrecipitation_mm: m.avgPrecipitation_mm,
        avgPrecipitation_inches: Math.round((m.avgPrecipitation_mm / 25.4) * 100) / 100,
        avgMaxWind_kmh: m.avgWindMax_kmh,
        avgMaxWind_mph: m.avgWindMax_mph,
        avgSunshineHours: m.avgSunshineHours,
        constructionScore: m.constructionScore,
        constructionRating: m.constructionRating,
      })),

      bestConstructionMonths: bestMonths,
      worstConstructionMonths: worstMonths,

      precipitation: {
        avgAnnual_mm: avgAnnualPrecip_mm,
        avgAnnual_inches: avgAnnualPrecip_inches,
        driestMonth: ranked[ranked.length - 1]?.name,
        wettestMonth: [...monthlyAggregations].sort(
          (a, b) => b.avgPrecipitation_mm - a.avgPrecipitation_mm
        )[0]?.name,
      },

      freezeRisk: {
        hasFreezeRisk: freezeMonths.length > 0,
        months: freezeMonths,
        severity: freezeMonths.length >= 3
          ? "High — extended freeze period, plan carefully"
          : freezeMonths.length >= 1
            ? "Low — occasional frost, minor precautions needed"
            : "None — freezing temperatures extremely rare",
      },

      heatRisk: {
        hasHeatWaveRisk: heatWaveMonths.length > 0,
        months: heatWaveMonths,
        severity: heatWaveMonths.length >= 3
          ? "High — extended extreme heat, worker safety critical"
          : heatWaveMonths.length >= 1
            ? "Moderate — occasional extreme heat days"
            : "Low — extreme heat unlikely",
      },

      optimalConstructionSeason: optimalWindow,
      recommendedConstructionDates: recommendedDates,

      fiveYearTrend: trend,

      aduRecommendations,

      yearlyBreakdown,

      source: "open-meteo-historical-archive",
      fetchedAt: new Date().toISOString(),
    };

    // --- Cache the result ---
    climateCache.set(cacheKey, { data: result, timestamp: now });

    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error";
    console.error("[Climate History API Error]", message);

    return NextResponse.json(
      {
        error: "Failed to fetch historical climate data",
        details: message,
      },
      { status: 502 }
    );
  }
}
