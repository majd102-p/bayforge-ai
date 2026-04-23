import { NextRequest, NextResponse } from "next/server";

/**
 * In-memory cache for geocode results.
 * Key: "{city}+{county}" → { data, timestamp }
 */
const geocodeCache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours (geocoding rarely changes)

/**
 * Simple rate limiter for geocode requests.
 */
const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 20;

/**
 * GET /api/geocode?city=San Jose&county=Santa Clara
 *
 * Geocodes a California city using the free OpenStreetMap Nominatim API.
 * Returns latitude, longitude, display name, and bounding box.
 *
 * All queries are scoped to California to ensure accurate results.
 * Results are cached for 24 hours to respect Nominatim usage policy.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const city = searchParams.get("city");
  const county = searchParams.get("county") ?? "";

  if (!city) {
    return NextResponse.json(
      { error: "Missing required query parameter: city" },
      { status: 400 }
    );
  }

  // Rate limiting
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
      },
      { status: 429 }
    );
  }
  recentTimestamps.push(now);
  rateLimitMap.set(clientIP, recentTimestamps);

  // Check cache
  const cacheKey = `${city.trim().toLowerCase()}+${county.trim().toLowerCase()}`;
  const cached = geocodeCache.get(cacheKey);
  if (cached && now - cached.timestamp < CACHE_TTL_MS) {
    return NextResponse.json({
      ...(cached.data as Record<string, unknown>),
      _cached: true,
    });
  }

  // Build Nominatim query — always scope to California
  const queryParts = [
    city.trim(),
    "California",
    county.trim(),
  ].filter(Boolean);
  const query = queryParts.join("+");

  const nominatimUrl = new URL("https://nominatim.openstreetmap.org/search");
  nominatimUrl.searchParams.set("q", query);
  nominatimUrl.searchParams.set("format", "json");
  nominatimUrl.searchParams.set("limit", "1");
  nominatimUrl.searchParams.set("addressdetails", "1");

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10_000);

    const response = await fetch(nominatimUrl.toString(), {
      headers: {
        "User-Agent": "BayForge-AI/1.0 (California ADU zoning analysis tool)",
        Accept: "application/json",
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(
        `Nominatim API returned ${response.status}: ${response.statusText}`
      );
    }

    const results = await response.json();

    if (!Array.isArray(results) || results.length === 0) {
      return NextResponse.json(
        {
          error: `Could not geocode "${city}"${county ? ` in ${county} County` : ""} in California.`,
          hint: "Check the city spelling or try adding the county parameter.",
        },
        { status: 404 }
      );
    }

    const top = results[0] as Record<string, unknown>;
    const address = top.address as Record<string, string> | undefined;

    const result = {
      city: city.trim(),
      county: county.trim() ?? address?.county ?? null,
      lat: parseFloat(top.lat as string),
      lon: parseFloat(top.lon as string),
      displayName: top.display_name as string,
      boundingBox: {
        south: parseFloat((top.boundingbox as string[])[0]),
        west: parseFloat((top.boundingbox as string[])[1]),
        north: parseFloat((top.boundingbox as string[])[2]),
        east: parseFloat((top.boundingbox as string[])[3]),
      },
      address: {
        state: address?.state ?? "California",
        county: address?.county ?? null,
        city: address?.city ?? address?.town ?? address?.village ?? city.trim(),
        postcode: address?.postcode ?? null,
      },
      osmType: top.osm_type as string,
      osmId: top.osm_id as number,
      source: "openstreetmap-nominatim",
      fetchedAt: new Date().toISOString(),
    };

    // Cache the result
    geocodeCache.set(cacheKey, { data: result, timestamp: now });

    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error";
    console.error("[Geocode API Error]", message);

    return NextResponse.json(
      {
        error: "Failed to geocode city using OpenStreetMap",
        details: message,
      },
      { status: 502 }
    );
  }
}
