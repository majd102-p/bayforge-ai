import { NextRequest, NextResponse } from "next/server";

/**
 * Built-in lookup table of California city coordinates.
 * Reused from the weather route for consistency.
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
};

/**
 * European Air Quality Index (EAQI) classification thresholds.
 * Based on the Common Air Quality Index (CAQI) used by the European Environment Agency.
 */
interface AQILevel {
  min: number;
  max: number;
  label: string;
  color: string;
  emoji: string;
  description: string;
}

const AQI_LEVELS: AQILevel[] = [
  {
    min: 0,
    max: 20,
    label: "Good",
    color: "#50F040",
    emoji: "🟢",
    description: "Air quality is satisfactory, and air pollution poses little or no risk.",
  },
  {
    min: 20,
    max: 40,
    label: "Fair",
    color: "#A0E632",
    emoji: "🟡",
    description: "Air quality is acceptable. However, there may be a risk for some people, particularly those who are unusually sensitive to air pollution.",
  },
  {
    min: 40,
    max: 60,
    label: "Moderate",
    color: "#FFE632",
    emoji: "🟠",
    description: "Members of sensitive groups may experience health effects. The general public is less likely to be affected.",
  },
  {
    min: 60,
    max: 80,
    label: "Poor",
    color: "#FF8C32",
    emoji: "🔴",
    description: "Everyone may begin to experience health effects; members of sensitive groups may experience more serious health effects.",
  },
  {
    min: 80,
    max: 100,
    label: "Very Poor",
    color: "#FF4040",
    emoji: "🟣",
    description:
      "Health alert: The risk of health effects is increased for everyone. Sensitive groups may experience more serious effects.",
  },
  {
    min: 100,
    max: Infinity,
    label: "Extremely Poor",
    color: "#901010",
    emoji: "⚫",
    description:
      "Health warning of emergency conditions: everyone is more likely to be affected. Avoid outdoor activities.",
  },
];

/**
 * Get construction guidance based on AQI level.
 */
function getConstructionGuidance(aqi: number, level: AQILevel): string[] {
  const guidance: string[] = [];

  if (aqi <= 20) {
    guidance.push("Good air quality — suitable for outdoor construction work");
    guidance.push("No special respiratory protection needed for workers");
    guidance.push("Ideal conditions for painting, sealing, and exterior finishing");
  } else if (aqi <= 40) {
    guidance.push("Fair air quality — generally acceptable for outdoor work");
    guidance.push("Workers with respiratory conditions should take standard precautions");
    guidance.push("Monitor air quality throughout the day, especially during summer");
  } else if (aqi <= 60) {
    guidance.push("Moderate air quality — take precautions for extended outdoor work");
    guidance.push("Consider N95 masks for workers during dusty activities");
    guidance.push("Schedule heavy earthwork and demolition for early morning when AQI tends to be lower");
    guidance.push("Use dust suppression measures (water spraying) on-site");
  } else if (aqi <= 80) {
    guidance.push("Poor air quality — limit prolonged outdoor exposure");
    guidance.push("Workers should wear N95 masks during all outdoor activities");
    guidance.push("Postpone painting and exterior finishing if possible");
    guidance.push("Avoid demolition and earthwork during poor air quality periods");
    guidance.push("Increase ventilation requirements for indoor work");
  } else if (aqi <= 100) {
    guidance.push("Very poor air quality — minimize outdoor construction activities");
    guidance.push("Reschedule outdoor work if possible; focus on indoor tasks");
    guidance.push("All workers must wear respiratory protection (N95 or better) outdoors");
    guidance.push("Construction dust control measures are mandatory");
    guidance.push("Consult with local air quality management district before proceeding");
  } else {
    guidance.push("Extremely poor air quality — STOP outdoor construction activities");
    guidance.push("Only emergency indoor work should proceed");
    guidance.push("All outdoor work postponed until air quality improves");
    guidance.push("Check with local air quality management district (e.g., BAAQMD, SCAQMD)");
    guidance.push("May qualify for construction delay due to environmental conditions");
  }

  return guidance;
}

/**
 * Provide pollutant-specific health context for construction.
 */
function getPollutantContext(pollutants: {
  pm2_5: number | null;
  pm10: number | null;
  no2: number | null;
  o3: number | null;
}): string[] {
  const context: string[] = [];

  if (pollutants.pm2_5 !== null) {
    if (pollutants.pm2_5 > 35) {
      context.push(
        `PM2.5 (${pollutants.pm2_5.toFixed(1)} µg/m³) is elevated — fine particulates pose risk to worker respiratory health`
      );
    } else if (pollutants.pm2_5 > 15) {
      context.push(
        `PM2.5 (${pollutants.pm2_5.toFixed(1)} µg/m³) is moderate — standard dust control measures sufficient`
      );
    } else {
      context.push(
        `PM2.5 (${pollutants.pm2_5.toFixed(1)} µg/m³) is low — minimal particulate concern`
      );
    }
  }

  if (pollutants.pm10 !== null) {
    if (pollutants.pm10 > 50) {
      context.push(
        `PM10 (${pollutants.pm10.toFixed(1)} µg/m³) is high — construction dust mitigation strongly recommended (water trucks, covered trucks)`
      );
    }
  }

  if (pollutants.no2 !== null) {
    if (pollutants.no2 > 40) {
      context.push(
        `NO₂ (${pollutants.no2.toFixed(1)} µg/m³) is elevated — likely from nearby traffic; consider construction vehicle emission controls`
      );
    }
  }

  if (pollutants.o3 !== null) {
    if (pollutants.o3 > 60) {
      context.push(
        `O₃ (${pollutants.o3.toFixed(1)} µg/m³) is elevated — summer smog may affect outdoor workers; schedule heavy work for early morning`
      );
    }
  }

  return context;
}

/**
 * In-memory cache for air quality results.
 * Key: normalized city name → { data, timestamp }
 */
const airQualityCache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

/**
 * Simple rate limiter for air quality requests.
 */
const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 30;

/**
 * GET /api/air-quality?city=San Jose
 *
 * Returns current air quality data using the free Open-Meteo Air Quality API.
 * Includes European AQI, PM2.5, PM10, NO2, O3 readings with
 * construction-specific guidance for ADU building projects.
 *
 * Uses the free Open-Meteo Air Quality API — no API key required.
 * Rate limited to 30 requests/min per IP. Cached for 15 minutes.
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
  const cached = airQualityCache.get(cacheKey);
  if (cached && now - cached.timestamp < CACHE_TTL_MS) {
    return NextResponse.json({
      ...(cached.data as Record<string, unknown>),
      _cached: true,
      _cacheAge: Math.round((now - cached.timestamp) / 1000),
    });
  }

  // Build Open-Meteo Air Quality API URL
  const aqUrl = new URL("https://air-quality-api.open-meteo.com/v1/air-quality");
  aqUrl.searchParams.set("latitude", coords.lat.toString());
  aqUrl.searchParams.set("longitude", coords.lon.toString());
  aqUrl.searchParams.set("current", "european_aqi,pm10,pm2_5,no2,o3");

  try {
    const response = await fetch(aqUrl.toString(), {
      headers: { "User-Agent": "BayForge-AI/1.0" },
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
      throw new Error(
        `Open-Meteo Air Quality API returned ${response.status}: ${response.statusText}`
      );
    }

    const data = await response.json();

    if (!data.current) {
      return NextResponse.json(
        { error: "No air quality data returned for the given city." },
        { status: 502 }
      );
    }

    const current = data.current;
    const aqiValue = current.european_aqi as number;

    // Find the matching AQI level
    const aqiLevel =
      AQI_LEVELS.find(
        (level) => aqiValue >= level.min && aqiValue < level.max
      ) ?? AQI_LEVELS[AQI_LEVELS.length - 1];

    // Extract pollutant values
    const pollutants = {
      pm2_5: (current.pm2_5 as number) ?? null,
      pm10: (current.pm10 as number) ?? null,
      no2: (current.no2 as number) ?? null,
      o3: (current.o3 as number) ?? null,
    };

    // Get guidance
    const constructionGuidance = getConstructionGuidance(aqiValue, aqiLevel);
    const pollutantContext = getPollutantContext(pollutants);

    // Determine suitability for construction
    let constructionSuitability: string;
    if (aqiValue <= 40) {
      constructionSuitability = "Favorable";
    } else if (aqiValue <= 60) {
      constructionSuitability = "Caution Advised";
    } else if (aqiValue <= 80) {
      constructionSuitability = "Limit Outdoor Work";
    } else {
      constructionSuitability = "Postpone Outdoor Work";
    }

    const result = {
      city: city.trim(),
      coordinates: coords,
      airQuality: {
        aqi: aqiValue,
        level: aqiLevel.label,
        color: aqiLevel.color,
        emoji: aqiLevel.emoji,
        description: aqiLevel.description,
      },
      pollutants: {
        pm2_5: {
          value: pollutants.pm2_5,
          unit: "µg/m³",
          label: "PM2.5 (Fine Particulates)",
          whoGuideline: 15,
          note:
            pollutants.pm2_5 !== null && pollutants.pm2_5 > 15
              ? "Exceeds WHO 24-hour guideline"
              : "Within WHO 24-hour guideline",
        },
        pm10: {
          value: pollutants.pm10,
          unit: "µg/m³",
          label: "PM10 (Coarse Particulates)",
          whoGuideline: 45,
          note:
            pollutants.pm10 !== null && pollutants.pm10 > 45
              ? "Exceeds WHO 24-hour guideline"
              : "Within WHO 24-hour guideline",
        },
        no2: {
          value: pollutants.no2,
          unit: "µg/m³",
          label: "NO₂ (Nitrogen Dioxide)",
          whoGuideline: 25,
          note:
            pollutants.no2 !== null && pollutants.no2 > 25
              ? "Exceeds WHO 24-hour guideline"
              : "Within WHO 24-hour guideline",
        },
        o3: {
          value: pollutants.o3,
          unit: "µg/m³",
          label: "O₃ (Ozone)",
          whoGuideline: 100,
          note:
            pollutants.o3 !== null && pollutants.o3 > 100
              ? "Exceeds WHO 8-hour guideline"
              : "Within WHO 8-hour guideline",
        },
      },
      constructionSuitability,
      constructionGuidance,
      pollutantContext,
      aqiScale: AQI_LEVELS.map((l) => ({
        label: l.label,
        range: l.max === Infinity ? `${l.min}+` : `${l.min}-${l.max}`,
        color: l.color,
        emoji: l.emoji,
      })),
      source: "open-meteo-air-quality",
      fetchedAt: new Date().toISOString(),
    };

    // Cache result
    airQualityCache.set(cacheKey, { data: result, timestamp: now });

    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error";
    console.error("[Air Quality API Error]", message);

    return NextResponse.json(
      {
        error: "Failed to fetch air quality data",
        details: message,
      },
      { status: 502 }
    );
  }
}
