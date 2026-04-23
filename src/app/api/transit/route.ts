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

/** Overpass API endpoint */
const OVERPASS_URL = "https://overpass-api.de/api/interpreter";

/** Search radius in meters (~3 miles) for transit stops */
const SEARCH_RADIUS_M = 4828;

/** Distance threshold for parking waiver qualification (~0.5 miles in meters) */
const PARKING_WAIVER_RADIUS_M = 805;

/**
 * In-memory cache for transit results.
 * Key: normalized city name → { data, timestamp }
 */
const transitCache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

/**
 * Simple rate limiter for transit requests.
 */
const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 30;

/**
 * Known transit system identifiers for classifying stop types.
 * Maps OSM tags/railway values to human-readable transit type names.
 */
function classifyStop(tags: Record<string, string>): string[] {
  const types: string[] = [];

  const railway = tags.railway;
  const station = tags.station;
  const publicTransport = tags["public_transport"];
  const train = tags.train;
  const subway = tags.subway;
  const lightRail = tags.light_rail;
  const operator = tags.operator?.toLowerCase() ?? "";
  const name = (tags.name ?? "").toLowerCase();

  // Heavy rail / Commuter rail / BART
  if (railway === "station" || railway === "halt") {
    if (operator.includes("bart") || name.includes("bart")) {
      types.push("BART");
    } else if (operator.includes("caltrain") || name.includes("caltrain")) {
      types.push("Commuter Rail (Caltrain)");
    } else if (operator.includes("metrolink") || name.includes("metrolink")) {
      types.push("Commuter Rail (Metrolink)");
    } else if (operator.includes("amtrak") || name.includes("amtrak")) {
      types.push("Commuter Rail (Amtrak)");
    } else if (operator.includes("ace") || name.includes("ace")) {
      types.push("Commuter Rail (ACE)");
    } else if (subway === "yes" || publicTransport === "stop" && train === "yes") {
      types.push("Metro / Subway");
    } else {
      types.push("Commuter Rail");
    }
  }

  // Light rail
  if (lightRail === "yes" || railway === "light_rail" || name.includes("light rail")) {
    if (operator.includes("vta") || name.includes("vta")) {
      types.push("Light Rail (VTA)");
    } else if (operator.includes("muni") || name.includes("muni")) {
      types.push("Light Rail (Muni Metro)");
    } else if (operator.includes("metro") || name.includes("metro")) {
      types.push("Light Rail (Metro)");
    } else {
      types.push("Light Rail");
    }
  }

  // Subway / Metro
  if (subway === "yes" && !types.includes("Metro / Subway")) {
    if (operator.includes("bart")) {
      types.push("BART");
    } else if (operator.includes("metro")) {
      types.push("Metro / Subway");
    } else {
      types.push("Metro / Subway");
    }
  }

  // Bus stops
  if (publicTransport === "station" || publicTransport === "stop") {
    if (!types.length || tags.highway === "bus_stop") {
      if (types.length === 0 && tags.highway === "bus_stop") {
        types.push("Bus");
      } else if (types.length === 0 && publicTransport === "station") {
        // Transit station without more specific tags — could be multi-modal
        types.push("Transit Station");
      }
    }
  }

  if (tags.highway === "bus_stop" && !types.includes("Bus")) {
    types.push("Bus");
  }

  // Tram / Streetcar
  if (railway === "tram_stop") {
    types.push("Tram / Streetcar");
  }

  // Fallback
  if (types.length === 0) {
    types.push("Transit Stop");
  }

  return [...new Set(types)];
}

/**
 * Calculate distance between two coordinates using Haversine formula.
 * Returns distance in meters.
 */
function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Earth radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Determine if a transit type qualifies as "major transit" for parking waiver purposes.
 * Major transit typically includes: BART, Metro, Light Rail, Commuter Rail, Subway.
 * Bus stops generally do NOT qualify for the parking waiver alone.
 */
function isMajorTransit(stopType: string): boolean {
  const majorTypes = [
    "bart",
    "metro",
    "light rail",
    "commuter rail",
    "subway",
    "tram",
    "streetcar",
  ];
  return majorTypes.some((mt) => stopType.toLowerCase().includes(mt));
}

/**
 * Build the Overpass QL query for finding transit stops near coordinates.
 * Queries for: public_transport stations, railway stations, and bus stops.
 */
function buildOverpassQuery(lat: number, lon: number): string {
  return `
[out:json][timeout:25];
(
  node["public_transport"="station"](around:${SEARCH_RADIUS_M},${lat},${lon});
  way["public_transport"="station"](around:${SEARCH_RADIUS_M},${lat},${lon});
  node["railway"="station"](around:${SEARCH_RADIUS_M},${lat},${lon});
  way["railway"="station"](around:${SEARCH_RADIUS_M},${lat},${lon});
  node["railway"="halt"](around:${SEARCH_RADIUS_M},${lat},${lon});
  way["railway"="halt"](around:${SEARCH_RADIUS_M},${lat},${lon});
  node["railway"="tram_stop"](around:${SEARCH_RADIUS_M},${lat},${lon});
  node["highway"="bus_stop"](around:${PARKING_WAIVER_RADIUS_M},${lat},${lon});
);
out body 100;
`.trim();
}

/**
 * GET /api/transit?city=San Jose
 *
 * Finds nearby transit stops using the OpenStreetMap Overpass API.
 * Identifies transit types (BART, light rail, bus, commuter rail, metro).
 * Determines if the city qualifies for California's "transit-rich" parking waiver
 * (within 0.5 miles of a major transit stop).
 *
 * Uses the free Overpass API — no API key required.
 * Rate limited to 30 requests/min per IP. Cached for 30 minutes.
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
  const cached = transitCache.get(cacheKey);
  if (cached && now - cached.timestamp < CACHE_TTL_MS) {
    return NextResponse.json({
      ...(cached.data as Record<string, unknown>),
      _cached: true,
      _cacheAge: Math.round((now - cached.timestamp) / 1000),
    });
  }

  // Build and send Overpass query
  const overpassQuery = buildOverpassQuery(coords.lat, coords.lon);

  try {
    const response = await fetch(OVERPASS_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "BayForge-AI/1.0 (California ADU zoning analysis tool)",
      },
      body: `data=${encodeURIComponent(overpassQuery)}`,
      signal: AbortSignal.timeout(30_000),
    });

    if (!response.ok) {
      throw new Error(
        `Overpass API returned ${response.status}: ${response.statusText}`
      );
    }

    const data = await response.json();

    if (!data.elements || !Array.isArray(data.elements)) {
      return NextResponse.json(
        { error: "No transit data returned from Overpass API." },
        { status: 502 }
      );
    }

    // Process each transit stop
    const allTypes = new Set<string>();
    let nearestMajorTransitDistance: number | null = null;
    let nearestMajorTransitName: string | null = null;
    let nearestAnyStopDistance: number | null = null;
    let nearestAnyStopName: string | null = null;
    let nearestMajorTransitType: string | null = null;

    interface TransitStop {
      name: string | null;
      type: string[];
      lat: number | null;
      lon: number | null;
      distanceM: number;
      distanceMi: number;
      isMajorTransit: boolean;
      operator: string | null;
    }

    const stops: TransitStop[] = [];

    for (const element of data.elements) {
      // Get coordinates — for nodes it's direct, for ways we use center
      let stopLat: number | null = null;
      let stopLon: number | null = null;

      if (element.type === "node") {
        stopLat = element.lat;
        stopLon = element.lon;
      } else if (element.type === "way" && element.center) {
        stopLat = element.center.lat;
        stopLon = element.center.lon;
      } else if (element.type === "way" && element.bounds) {
        stopLat = (element.bounds.minlat + element.bounds.maxlat) / 2;
        stopLon = (element.bounds.minlon + element.bounds.maxlon) / 2;
      }

      if (stopLat === null || stopLon === null) continue;

      const tags = element.tags ?? {};
      const distanceM = haversineDistance(
        coords.lat,
        coords.lon,
        stopLat,
        stopLon
      );
      const distanceMi = distanceM / 1609.34;

      const stopTypes = classifyStop(tags);
      stopTypes.forEach((t) => allTypes.add(t));

      const majorTransit = stopTypes.some(isMajorTransit);

      const stop: TransitStop = {
        name: tags.name ?? null,
        type: stopTypes,
        lat: stopLat,
        lon: stopLon,
        distanceM: Math.round(distanceM),
        distanceMi: Math.round(distanceMi * 100) / 100,
        isMajorTransit: majorTransit,
        operator: tags.operator ?? null,
      };

      stops.push(stop);

      // Track nearest any stop
      if (
        nearestAnyStopDistance === null ||
        distanceM < nearestAnyStopDistance
      ) {
        nearestAnyStopDistance = distanceM;
        nearestAnyStopName = tags.name ?? "Unnamed stop";
      }

      // Track nearest major transit
      if (
        majorTransit &&
        (nearestMajorTransitDistance === null ||
          distanceM < nearestMajorTransitDistance)
      ) {
        nearestMajorTransitDistance = distanceM;
        nearestMajorTransitName = tags.name ?? "Unnamed station";
        nearestMajorTransitType = stopTypes.find(isMajorTransit) ?? null;
      }
    }

    // Sort stops by distance
    stops.sort((a, b) => a.distanceM - b.distanceM);

    // Classify transit types into categories
    const transitTypes = {
      bus: stops.filter((s) => s.type.includes("Bus")).length,
      lightRail: stops.filter((s) => s.type.some((t) => t.toLowerCase().includes("light rail"))).length,
      commuterRail: stops.filter((s) => s.type.some((t) => t.toLowerCase().includes("commuter rail"))).length,
      metro: stops.filter((s) => s.type.some((t) => t.toLowerCase().includes("metro") || t.toLowerCase().includes("subway"))).length,
      bart: stops.filter((s) => s.type.some((t) => t.toLowerCase().includes("bart"))).length,
      tram: stops.filter((s) => s.type.some((t) => t.toLowerCase().includes("tram") || t.toLowerCase().includes("streetcar"))).length,
      other: stops.filter(
        (s) =>
          !s.type.some(
            (t) =>
              t.toLowerCase().includes("bus") ||
              t.toLowerCase().includes("light rail") ||
              t.toLowerCase().includes("commuter rail") ||
              t.toLowerCase().includes("metro") ||
              t.toLowerCase().includes("subway") ||
              t.toLowerCase().includes("bart") ||
              t.toLowerCase().includes("tram") ||
              t.toLowerCase().includes("streetcar")
          )
      ).length,
    };

    // Determine parking waiver eligibility
    // California Government Code §65913.4: "transit-rich area" = within 0.5 mi of major transit stop
    const qualifiesForParkingWaiver =
      nearestMajorTransitDistance !== null &&
      nearestMajorTransitDistance <= PARKING_WAIVER_RADIUS_M;

    // Build ADU implications
    const aduImplications: string[] = [];

    if (qualifiesForParkingWaiver) {
      aduImplications.push(
        "✅ Transit-rich area: ADU may qualify for reduced parking requirements (CA Gov Code §65913.4)"
      );
      aduImplications.push(
        `Nearest major transit (${nearestMajorTransitType}): ${nearestMajorTransitName} — ${(nearestMajorTransitDistance! / 1609.34).toFixed(2)} mi`
      );
    } else if (nearestMajorTransitDistance !== null) {
      const distMi = (nearestMajorTransitDistance / 1609.34).toFixed(2);
      aduImplications.push(
        `Nearest major transit (${nearestMajorTransitType}): ${nearestMajorTransitName} — ${distMi} mi (outside 0.5 mi waiver zone)`
      );
      aduImplications.push(
        "Standard parking requirements likely apply for ADU"
      );
    } else {
      aduImplications.push(
        "No major rail transit found within 3 miles — standard parking requirements apply"
      );
    }

    if (transitTypes.bus > 0) {
      aduImplications.push(
        `${transitTypes.bus} bus stop(s) within 0.5 mi — good local connectivity for tenants`
      );
    }

    if (stops.length === 0) {
      aduImplications.push(
        "Limited public transit — ADU tenants will likely need personal vehicles"
      );
    }

    // Top 10 nearest stops for the response
    const topStops = stops.slice(0, 10).map((s) => ({
      name: s.name,
      type: s.type,
      distanceMi: s.distanceMi,
      distanceM: s.distanceM,
      isMajorTransit: s.isMajorTransit,
    }));

    const result = {
      city: city.trim(),
      coordinates: coords,
      transitStopCount: stops.length,
      transitTypes: {
        ...transitTypes,
        allTypes: [...allTypes].sort(),
      },
      nearestStop: {
        name: nearestAnyStopName,
        distanceMi:
          nearestAnyStopDistance !== null
            ? Math.round((nearestAnyStopDistance / 1609.34) * 100) / 100
            : null,
        distanceM:
          nearestAnyStopDistance !== null
            ? Math.round(nearestAnyStopDistance)
            : null,
      },
      nearestMajorTransit: {
        name: nearestMajorTransitName,
        type: nearestMajorTransitType,
        distanceMi:
          nearestMajorTransitDistance !== null
            ? Math.round((nearestMajorTransitDistance / 1609.34) * 100) / 100
            : null,
        distanceM:
          nearestMajorTransitDistance !== null
            ? Math.round(nearestMajorTransitDistance)
            : null,
      },
      qualifiesForParkingWaiver,
      parkingWaiverRadius: {
        meters: PARKING_WAIVER_RADIUS_M,
        miles: Math.round((PARKING_WAIVER_RADIUS_M / 1609.34) * 100) / 100,
      },
      aduImplications,
      topStops,
      source: "openstreetmap-overpass",
      fetchedAt: new Date().toISOString(),
    };

    // Cache result
    transitCache.set(cacheKey, { data: result, timestamp: now });

    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error";
    console.error("[Transit API Error]", message);

    return NextResponse.json(
      {
        error: "Failed to fetch transit data from OpenStreetMap",
        details: message,
      },
      { status: 502 }
    );
  }
}
