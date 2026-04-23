import { NextRequest, NextResponse } from "next/server";

/**
 * Weather code descriptions from WMO (World Meteorological Organization)
 */
const WEATHER_DESCRIPTIONS: Record<number, string> = {
  0: "Clear sky",
  1: "Mainly clear",
  2: "Partly cloudy",
  3: "Overcast",
  45: "Foggy",
  48: "Depositing rime fog",
  51: "Light drizzle",
  53: "Moderate drizzle",
  55: "Dense drizzle",
  56: "Light freezing drizzle",
  57: "Dense freezing drizzle",
  61: "Slight rain",
  63: "Moderate rain",
  65: "Heavy rain",
  66: "Light freezing rain",
  67: "Heavy freezing rain",
  71: "Slight snowfall",
  73: "Moderate snowfall",
  75: "Heavy snowfall",
  77: "Snow grains",
  80: "Slight rain showers",
  81: "Moderate rain showers",
  82: "Violent rain showers",
  85: "Slight snow showers",
  86: "Heavy snow showers",
  95: "Thunderstorm",
  96: "Thunderstorm with slight hail",
  99: "Thunderstorm with heavy hail",
};

/**
 * Built-in lookup table of California city coordinates.
 * Maps normalized city names to { latitude, longitude }.
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
  "bakersfield": { lat: 35.3733, lon: -119.0187 },
  stockton: { lat: 37.9577, lon: -121.2908 },
  riverside: { lat: 33.9806, lon: -117.3755 },
};

/** Simple in-memory rate limiter: tracks timestamps per IP */
const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 30;

/**
 * In-memory cache for weather results.
 * Key: normalized city name → { data, timestamp }
 */
const weatherCache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

/**
 * Calculate a construction suitability score (0–100) based on current weather.
 *
 * Factors:
 * - Temperature (ideal 50–85°F)
 * - Precipitation (none is best)
 * - Wind speed (under 20 mph is good)
 * - Weather code (clear/partly cloudy is best)
 */
function calculateConstructionSuitability(current: {
  temperature_2m: number;
  relative_humidity_2m: number;
  wind_speed_10m: number;
  precipitation: number;
  weather_code: number;
}): { score: number; details: string[] } {
  let score = 100;
  const details: string[] = [];
  const tempF = (current.temperature_2m * 9) / 5 + 32;

  // Temperature scoring
  if (tempF < 32) {
    score -= 40;
    details.push("Below freezing — poor for concrete work");
  } else if (tempF < 40) {
    score -= 25;
    details.push("Near freezing — caution with concrete curing");
  } else if (tempF < 50) {
    score -= 10;
    details.push("Cool temperatures — slower curing");
  } else if (tempF > 100) {
    score -= 25;
    details.push("Extreme heat — risk of rapid concrete drying");
  } else if (tempF > 95) {
    score -= 15;
    details.push("High heat — monitor concrete curing closely");
  } else {
    details.push("Temperature range is good for construction");
  }

  // Precipitation scoring
  if (current.precipitation > 0) {
    score -= 20;
    details.push(`Active precipitation (${current.precipitation} mm) — avoid exposed work`);
  }

  // Wind scoring
  if (current.wind_speed_10m > 30) {
    score -= 20;
    details.push("High winds — unsafe for crane/lift operations");
  } else if (current.wind_speed_10m > 20) {
    score -= 10;
    details.push("Moderate winds — use caution with tall equipment");
  }

  // Weather code scoring
  const severeCodes = [61, 63, 65, 66, 67, 71, 73, 75, 80, 81, 82, 85, 86, 95, 96, 99];
  if (severeCodes.includes(current.weather_code)) {
    score -= 15;
    details.push(`${WEATHER_DESCRIPTIONS[current.weather_code] ?? "Adverse weather"} — consider postponing`);
  }

  // Humidity scoring
  if (current.relative_humidity_2m > 85) {
    score -= 10;
    details.push("High humidity — may affect paint/drywall drying times");
  }

  score = Math.max(0, Math.min(100, score));

  let rating: string;
  if (score >= 80) rating = "Excellent";
  else if (score >= 60) rating = "Good";
  else if (score >= 40) rating = "Fair";
  else if (score >= 20) rating = "Poor";
  else rating = "Not Recommended";

  details.push(`Overall rating: ${rating} (${score}/100)`);

  return { score, details };
}

/**
 * GET /api/weather?city=San Jose
 *
 * Returns current weather, 7-day forecast, climate summary,
 * and a construction suitability score for ADU building projects.
 * Uses the free Open-Meteo API — no API key required.
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

  // Rate limiting by IP
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

  // Lookup city coordinates
  const normalizedCity = city.trim().toLowerCase();
  const coords = CALIFORNIA_CITIES[normalizedCity];

  if (!coords) {
    return NextResponse.json(
      {
        error: `City "${city}" not found in our California city database.`,
        availableCities: Object.keys(CALIFORNIA_CITIES).map(
          (c) => c.charAt(0).toUpperCase() + c.slice(1)
        ),
      },
      { status: 404 }
    );
  }

  // Check cache
  const cacheKey = normalizedCity;
  const cached = weatherCache.get(cacheKey);
  if (cached && now - cached.timestamp < CACHE_TTL_MS) {
    return NextResponse.json({
      ...(cached.data as Record<string, unknown>),
      _cached: true,
      _cacheAge: Math.round((now - cached.timestamp) / 1000),
    });
  }

  // Build Open-Meteo URL
  const openMeteoUrl = new URL("https://api.open-meteo.com/v1/forecast");
  openMeteoUrl.searchParams.set("latitude", coords.lat.toString());
  openMeteoUrl.searchParams.set("longitude", coords.lon.toString());
  openMeteoUrl.searchParams.set(
    "current",
    "temperature_2m,relative_humidity_2m,wind_speed_10m,precipitation,weather_code"
  );
  openMeteoUrl.searchParams.set(
    "daily",
    "temperature_2m_max,temperature_2m_min,precipitation_sum"
  );
  openMeteoUrl.searchParams.set("timezone", "America/Los_Angeles");
  openMeteoUrl.searchParams.set("forecast_days", "7");

  try {
    const response = await fetch(openMeteoUrl.toString(), {
      headers: { "User-Agent": "BayForge-AI/1.0" },
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
      throw new Error(
        `Open-Meteo API returned ${response.status}: ${response.statusText}`
      );
    }

    const data = await response.json();
    const current = data.current;
    const daily = data.daily;

    // Build current weather object
    const currentWeather = {
      temperature_c: current.temperature_2m,
      temperature_f: Math.round((current.temperature_2m * 9) / 5 + 32),
      humidity: current.relative_humidity_2m,
      windSpeed_mph: Math.round(current.wind_speed_10m * 0.621371),
      windSpeed_kmh: current.wind_speed_10m,
      precipitation_mm: current.precipitation,
      weatherCode: current.weather_code,
      description:
        WEATHER_DESCRIPTIONS[current.weather_code] ?? "Unknown",
    };

    // Build 7-day forecast
    const forecast = daily.time.map((date: string, i: number) => ({
      date,
      high_c: daily.temperature_2m_max[i],
      low_c: daily.temperature_2m_min[i],
      high_f: Math.round((daily.temperature_2m_max[i] * 9) / 5 + 32),
      low_f: Math.round((daily.temperature_2m_min[i] * 9) / 5 + 32),
      precipitation_mm: daily.precipitation_sum[i],
    }));

    // Climate summary
    const avgHigh =
      daily.temperature_2m_max.reduce(
        (sum: number, v: number) => sum + v,
        0
      ) / daily.temperature_2m_max.length;
    const avgLow =
      daily.temperature_2m_min.reduce(
        (sum: number, v: number) => sum + v,
        0
      ) / daily.temperature_2m_min.length;
    const totalPrecip = daily.precipitation_sum.reduce(
      (sum: number, v: number) => sum + v,
      0
    );

    const climateSummary = {
      avgHigh_c: Math.round(avgHigh * 10) / 10,
      avgLow_c: Math.round(avgLow * 10) / 10,
      avgHigh_f: Math.round(((avgHigh * 9) / 5 + 32) * 10) / 10,
      avgLow_f: Math.round(((avgLow * 9) / 5 + 32) * 10) / 10,
      totalPrecipitation_mm: Math.round(totalPrecip * 10) / 10,
      dryDays: daily.precipitation_sum.filter(
        (v: number) => v === 0
      ).length,
    };

    // Construction suitability
    const constructionSuitability = calculateConstructionSuitability({
      temperature_2m: current.temperature_2m,
      relative_humidity_2m: current.relative_humidity_2m,
      wind_speed_10m: current.wind_speed_10m,
      precipitation: current.precipitation,
      weather_code: current.weather_code,
    });

    const result = {
      city: city.trim(),
      coordinates: coords,
      current: currentWeather,
      forecast,
      climateSummary,
      constructionSuitability,
      fetchedAt: new Date().toISOString(),
    };

    // Cache the result
    weatherCache.set(cacheKey, { data: result, timestamp: now });

    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error";
    console.error("[Weather API Error]", message);

    return NextResponse.json(
      {
        error: "Failed to fetch weather data",
        details: message,
      },
      { status: 502 }
    );
  }
}
