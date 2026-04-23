import { NextRequest, NextResponse } from "next/server";

/**
 * In-memory cache for elevation results.
 * Key: "{lat},{lon}" (rounded to 4 decimals) → { data, timestamp }
 */
const elevationCache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours (elevation doesn't change)

/**
 * Simple rate limiter for elevation requests.
 */
const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 30;

/** Threshold (in feet) above which hillside considerations apply */
const HILLSIDE_THRESHOLD_FT = 500;

/** Threshold (in feet) above which extreme hillside risk applies */
const EXTREME_HILLSIDE_THRESHOLD_FT = 1500;

/** Threshold (in feet) for fire zone considerations */
const FIRE_ZONE_THRESHOLD_FT = 1000;

/**
 * Assess hillside risk based on elevation.
 */
function assessHillsideRisk(elevationFt: number): {
  riskLevel: string;
  considerations: string[];
  aduImplications: string[];
} {
  const considerations: string[] = [];
  const aduImplications: string[] = [];

  if (elevationFt < 100) {
    considerations.push("Very low elevation — flat terrain");
    aduImplications.push(
      "Standard ADU construction methods apply",
      "Minimal grading required",
      "Favorable foundation conditions"
    );
  } else if (elevationFt < HILLSIDE_THRESHOLD_FT) {
    considerations.push(
      "Moderate elevation — generally flat to gentle slopes",
      "Standard site preparation typically sufficient"
    );
    aduImplications.push(
      "Minor grading may be needed",
      "Standard foundation types (slab-on-grade) usually suitable"
    );
  } else if (elevationFt < EXTREME_HILLSIDE_THRESHOLD_FT) {
    considerations.push(
      `Elevation of ${elevationFt} ft exceeds ${HILLSIDE_THRESHOLD_FT} ft hillside threshold`,
      "Sloped terrain considerations likely apply"
    );
    aduImplications.push(
      "Hillside setback requirements may reduce buildable area",
      "Engineered foundation may be required (caissons or retaining walls)",
      "Grading permits may be needed in addition to building permits",
      "Slope stability analysis may be required by local jurisdiction",
      "Increased foundation costs (estimate 30-60% above flat-land costs)"
    );
  } else {
    considerations.push(
      `Elevation of ${elevationFt} ft — significant mountainous terrain`,
      "Extreme slope and access challenges likely"
    );
    aduImplications.push(
      "Major geotechnical investigation required",
      "Retaining walls and specialized foundations almost certainly needed",
      "Road access and utility connections may be difficult",
      "Significantly higher construction costs (estimate 60-120% above flat-land)",
      "Check with local building department for hillside development restrictions",
      "Wildfire zone regulations likely apply"
    );
  }

  if (elevationFt >= FIRE_ZONE_THRESHOLD_FT) {
    considerations.push(
      `Elevation exceeds ${FIRE_ZONE_THRESHOLD_FT} ft — wildfire zone considerations apply`
    );
    aduImplications.push(
      "Fire-resistant exterior materials may be required (Class A roof, etc.)",
      "Defensible space requirements around the ADU",
      "Check CAL FIRE maps for specific fire severity zone"
    );
  }

  let riskLevel: string;
  if (elevationFt < HILLSIDE_THRESHOLD_FT) riskLevel = "Low";
  else if (elevationFt < EXTREME_HILLSIDE_THRESHOLD_FT) riskLevel = "Moderate";
  else riskLevel = "High";

  return { riskLevel, considerations, aduImplications };
}

/**
 * GET /api/elevation?lat=37.3382&lon=-121.8863
 *
 * Returns elevation data using the free Open-Meteo Elevation API.
 * No API key required. Includes hillside risk assessment for ADU construction.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const latParam = searchParams.get("lat");
  const lonParam = searchParams.get("lon");

  if (!latParam || !lonParam) {
    return NextResponse.json(
      {
        error:
          "Missing required query parameters: lat and lon (e.g., ?lat=37.3382&lon=-121.8863)",
      },
      { status: 400 }
    );
  }

  const lat = parseFloat(latParam);
  const lon = parseFloat(lonParam);

  if (Number.isNaN(lat) || Number.isNaN(lon)) {
    return NextResponse.json(
      { error: "Invalid lat/lon values. Must be numeric coordinates." },
      { status: 400 }
    );
  }

  if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
    return NextResponse.json(
      { error: "Coordinates out of range. Latitude: -90 to 90, Longitude: -180 to 180." },
      { status: 400 }
    );
  }

  // Rate limiting
  const clientIP = request.headers.get("x-forwarded-for") ?? "unknown";
  const now = Date.now();
  const timestamps = rateLimitMap.get(clientIP) ?? [];
  const recentTimestamps = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);

  if (recentTimestamps.length >= RATE_LIMIT_MAX_REQUESTS) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Please try again in 1 minute." },
      { status: 429 }
    );
  }
  recentTimestamps.push(now);
  rateLimitMap.set(clientIP, recentTimestamps);

  // Check cache
  const cacheKey = `${lat.toFixed(4)},${lon.toFixed(4)}`;
  const cached = elevationCache.get(cacheKey);
  if (cached && now - cached.timestamp < CACHE_TTL_MS) {
    return NextResponse.json({
      ...(cached.data as Record<string, unknown>),
      _cached: true,
    });
  }

  // Use Open-Meteo Elevation API (free, no key, reliable)
  const openMeteoUrl = `https://api.open-meteo.com/v1/elevation?latitude=${lat}&longitude=${lon}`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10_000);

    const response = await fetch(openMeteoUrl, {
      headers: {
        "User-Agent": "BayForge-AI/1.0",
        Accept: "application/json",
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(
        `Open-Meteo Elevation API returned ${response.status}: ${response.statusText}`
      );
    }

    const data = await response.json();

    if (!data.elevation || !Array.isArray(data.elevation) || data.elevation.length === 0) {
      return NextResponse.json(
        { error: "No elevation data returned for the given coordinates." },
        { status: 404 }
      );
    }

    const elevationM = data.elevation[0] as number;
    const elevationFt = Math.round(elevationM * 3.28084);
    const hillsideRisk = assessHillsideRisk(elevationFt);

    const result = {
      coordinates: { lat, lon },
      elevation: {
        meters: Math.round(elevationM * 100) / 100,
        feet: elevationFt,
      },
      hillsideThresholds: {
        hillsideFt: HILLSIDE_THRESHOLD_FT,
        extremeHillsideFt: EXTREME_HILLSIDE_THRESHOLD_FT,
        fireZoneFt: FIRE_ZONE_THRESHOLD_FT,
      },
      hillsideRisk,
      source: "open-meteo",
      fetchedAt: new Date().toISOString(),
    };

    // Cache result
    elevationCache.set(cacheKey, { data: result, timestamp: now });

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[Elevation API Error]", message);

    return NextResponse.json(
      { error: "Failed to fetch elevation data", details: message },
      { status: 502 }
    );
  }
}
