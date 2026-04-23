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
 * California Seismic Hazard Zone classifications.
 * Based on California Geological Survey (CGS) Seismic Hazard Zones
 * and the International Building Code (IBC) seismic design categories.
 *
 * Zone classifications for California counties/regions:
 *   - High: Near major fault lines (San Andreas, Hayward, Calaveras, San Jacinto, etc.)
 *   - Moderate: Within seismically active regions but not adjacent to major faults
 *   - Low: Further from major known fault systems
 *
 * These are generalized zone classifications based on county and proximity to known faults.
 * For actual site-specific analysis, consult the California Geological Survey (CGS)
 * and local building department.
 */
interface SeismicZone {
  zone: "High" | "Moderate" | "Low";
  riskLevel: number; // 1-3 (3 = highest)
  description: string;
  majorFaults: string[];
  county: string;
}

const SEISMIC_ZONES: Record<string, SeismicZone> = {
  // San Francisco Bay Area — highest seismic risk in California
  "san francisco": {
    zone: "High",
    riskLevel: 3,
    description: "Very high seismic risk — located on or very near the San Andreas Fault zone and multiple urban faults",
    majorFaults: ["San Andreas", "Hayward", "San Gregorio"],
    county: "San Francisco",
  },
  oakland: {
    zone: "High",
    riskLevel: 3,
    description: "Very high seismic risk — Hayward Fault runs directly through the eastern Oakland Hills",
    majorFaults: ["Hayward", "San Andreas", "Calaveras"],
    county: "Alameda",
  },
  berkeley: {
    zone: "High",
    riskLevel: 3,
    description: "Very high seismic risk — Hayward Fault passes within 1-2 miles of the city center",
    majorFaults: ["Hayward", "San Andreas"],
    county: "Alameda",
  },
  "san mateo": {
    zone: "High",
    riskLevel: 3,
    description: "High seismic risk — near San Andreas Fault and multiple minor faults",
    majorFaults: ["San Andreas", "San Gregorio"],
    county: "San Mateo",
  },
  hayward: {
    zone: "High",
    riskLevel: 3,
    description: "Very high seismic risk — Hayward Fault runs directly through the city",
    majorFaults: ["Hayward", "Calaveras", "San Andreas"],
    county: "Alameda",
  },
  fremont: {
    zone: "High",
    riskLevel: 3,
    description: "High seismic risk — near the Hayward and Calaveras Faults",
    majorFaults: ["Hayward", "Calaveras"],
    county: "Alameda",
  },
  "santa cruz": {
    zone: "High",
    riskLevel: 3,
    description: "High seismic risk — near the San Andreas Fault (1989 Loma Prieta epicenter area)",
    majorFaults: ["San Andreas", "Zayante"],
    county: "Santa Cruz",
  },

  // Silicon Valley — high risk
  "san jose": {
    zone: "High",
    riskLevel: 2,
    description: "High seismic risk — near the San Andreas and Calaveras Faults",
    majorFaults: ["San Andreas", "Calaveras", "Hayward"],
    county: "Santa Clara",
  },
  "santa clara": {
    zone: "High",
    riskLevel: 2,
    description: "High seismic risk — near the San Andreas and Calaveras Faults",
    majorFaults: ["San Andreas", "Calaveras"],
    county: "Santa Clara",
  },
  sunnyvale: {
    zone: "High",
    riskLevel: 2,
    description: "High seismic risk — near the San Andreas Fault zone",
    majorFaults: ["San Andreas"],
    county: "Santa Clara",
  },
  cupertino: {
    zone: "High",
    riskLevel: 2,
    description: "High seismic risk — near the San Andreas Fault",
    majorFaults: ["San Andreas"],
    county: "Santa Clara",
  },
  "mountain view": {
    zone: "High",
    riskLevel: 2,
    description: "High seismic risk — near the San Andreas Fault",
    majorFaults: ["San Andreas"],
    county: "Santa Clara",
  },
  "palo alto": {
    zone: "High",
    riskLevel: 2,
    description: "High seismic risk — near the San Andreas Fault",
    majorFaults: ["San Andreas"],
    county: "Santa Clara",
  },

  // Los Angeles / Southern California — high risk
  "los angeles": {
    zone: "High",
    riskLevel: 3,
    description: "Very high seismic risk — numerous fault systems including San Andreas, Sierra Madre, and many urban faults",
    majorFaults: ["San Andreas", "San Fernando", "Newport-Inglewood", "Puente Hills"],
    county: "Los Angeles",
  },
  pasadena: {
    zone: "High",
    riskLevel: 3,
    description: "High seismic risk — near the Sierra Madre and Raymond Faults",
    majorFaults: ["Sierra Madre", "Raymond", "San Andreas"],
    county: "Los Angeles",
  },
  "long beach": {
    zone: "High",
    riskLevel: 2,
    description: "High seismic risk — near the Newport-Inglewood Fault",
    majorFaults: ["Newport-Inglewood", "San Andreas"],
    county: "Los Angeles",
  },
  anaheim: {
    zone: "High",
    riskLevel: 2,
    description: "High seismic risk — near the Puente Hills thrust fault and Whittier Fault",
    majorFaults: ["Puente Hills", "Whittier", "San Andreas"],
    county: "Orange",
  },
  "santa ana": {
    zone: "High",
    riskLevel: 2,
    description: "High seismic risk — near the Newport-Inglewood Fault zone",
    majorFaults: ["Newport-Inglewood", "San Andreas"],
    county: "Orange",
  },
  irvine: {
    zone: "Moderate",
    riskLevel: 2,
    description: "Moderate-high seismic risk — within Southern California seismic zone, further from major faults",
    majorFaults: ["Newport-Inglewood", "San Andreas"],
    county: "Orange",
  },
  riverside: {
    zone: "Moderate",
    riskLevel: 2,
    description: "Moderate seismic risk — near the San Jacinto Fault",
    majorFaults: ["San Jacinto", "San Andreas"],
    county: "Riverside",
  },
  "san diego": {
    zone: "Moderate",
    riskLevel: 2,
    description: "Moderate seismic risk — near the Rose Canyon and Elsinore Faults",
    majorFaults: ["Rose Canyon", "Elsinore", "San Andreas"],
    county: "San Diego",
  },

  // Central Valley — moderate risk
  sacramento: {
    zone: "Moderate",
    riskLevel: 1,
    description: "Moderate seismic risk — not on a major fault but within active seismic region",
    majorFaults: ["Foothills Fault Zone"],
    county: "Sacramento",
  },
  stockton: {
    zone: "Moderate",
    riskLevel: 1,
    description: "Moderate seismic risk — near the San Joaquin Fault zone",
    majorFaults: ["San Joaquin"],
    county: "San Joaquin",
  },
  modesto: {
    zone: "Low",
    riskLevel: 1,
    description: "Lower seismic risk — Central Valley location, distant from major faults",
    majorFaults: [],
    county: "Stanislaus",
  },
  fresno: {
    zone: "Low",
    riskLevel: 1,
    description: "Lower seismic risk — Central Valley location, distant from major faults",
    majorFaults: [],
    county: "Fresno",
  },
  bakersfield: {
    zone: "Moderate",
    riskLevel: 2,
    description: "Moderate seismic risk — near the White Wolf Fault and southern San Andreas",
    majorFaults: ["White Wolf", "San Andreas"],
    county: "Kern",
  },
};

/**
 * ADU construction implications based on seismic zone.
 */
function getSeismicConstructionImplications(
  zone: SeismicZone
): {
  requirements: string[];
  recommendations: string[];
  costImplications: string[];
  engineeringNotes: string[];
} {
  const requirements: string[] = [];
  const recommendations: string[] = [];
  const costImplications: string[] = [];
  const engineeringNotes: string[] = [];

  // Universal California requirements
  requirements.push(
    "All structures must comply with California Building Code (CBC) seismic provisions"
  );
  requirements.push(
    "Seismic design category determined by site-specific analysis per ASCE 7"
  );

  if (zone.riskLevel >= 3) {
    requirements.push(
      "Geotechnical (soil) investigation likely required by local jurisdiction"
    );
    requirements.push(
      "Site-specific seismic hazard analysis may be required (not just CBC default)"
    );
    requirements.push(
      "Liquefaction hazard assessment required if near water table or loose soils"
    );
    requirements.push(
      "Seismic retrofitting of existing structures may be required before ADU addition"
    );
    recommendations.push(
      "Hire a licensed structural engineer experienced in seismic design"
    );
    recommendations.push(
      "Consider a continuous reinforced concrete foundation for maximum seismic resistance"
    );
    recommendations.push(
      "Use shear wall panels and metal connectors (Simpson Strong-Tie) at all framing connections"
    );
    recommendations.push(
      "Avoid soft-story conditions (large open ground floor walls)"
    );
    recommendations.push(
      "Consider base-isolated or energy-dissipating structural systems for premium safety"
    );
    costImplications.push(
      "Structural engineering: $3,000–$8,000+ for seismic design and calculations"
    );
    costImplications.push(
      "Geotechnical report: $2,000–$5,000 (may be required)"
    );
    costImplications.push(
      "Enhanced foundation: 15–30% increase over standard foundation costs"
    );
    costImplications.push(
      "Seismic detailing (holdowns, anchor bolts, shear panels): $5,000–$15,000 additional"
    );
    costImplications.push(
      "Plan check fees may be higher due to seismic review requirements"
    );
    engineeringNotes.push(
      "ADU in high seismic zones requires careful attention to the primary dwelling's seismic capacity if attached"
    );
    engineeringNotes.push(
      "If attaching to an older (pre-1975) primary residence, a seismic retrofit of the existing structure may be required"
    );
    engineeringNotes.push(
      "Detached ADUs generally have simpler seismic design requirements than attached additions"
    );
  } else if (zone.riskLevel === 2) {
    requirements.push(
      "Standard CBC seismic provisions apply — no extraordinary measures typically required"
    );
    requirements.push(
      "Soil report recommended but may not be mandatory (check local jurisdiction)"
    );
    recommendations.push(
      "Consult a structural engineer to optimize seismic performance within standard code"
    );
    recommendations.push(
      "Use engineered wood framing with proper holdowns and Simpson ties"
    );
    recommendations.push(
      "Ensure proper foundation anchoring per CBC requirements"
    );
    costImplications.push(
      "Structural engineering: $1,500–$4,000 for standard design"
    );
    costImplications.push(
      "Standard seismic detailing included in most contractor bids"
    );
    engineeringNotes.push(
      "Moderate seismic zone — standard construction practices generally sufficient"
    );
    engineeringNotes.push(
      "Prefabricated ADUs from certified manufacturers already meet seismic code requirements"
    );
  } else {
    requirements.push(
      "Standard CBC seismic provisions apply — lower design forces"
    );
    recommendations.push(
      "Basic seismic-resistant construction practices still recommended"
    );
    recommendations.push(
      "Standard foundation and framing techniques typically sufficient"
    );
    costImplications.push(
      "No significant seismic cost premiums expected"
    );
    engineeringNotes.push(
      "Lower seismic zone — standard construction costs apply"
    );
  }

  // General California notes
  engineeringNotes.push(
    "California Residential Code (CRC) includes prescriptive seismic bracing requirements for residential construction"
  );
  engineeringNotes.push(
    "All ADUs must be permitted and inspected — seismic compliance verified during inspection"
  );
  engineeringNotes.push(
    "For site-specific seismic hazard maps, visit the California Geological Survey (CGS) website"
  );

  return { requirements, recommendations, costImplications, engineeringNotes };
}

/**
 * Calculate distance between two coordinates using Haversine formula.
 * Returns distance in kilometers.
 */
function haversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth radius in km
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
 * In-memory cache for seismic results.
 * Key: normalized city name → { data, timestamp }
 */
const seismicCache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour (seismic data changes slowly)

/**
 * Simple rate limiter for seismic requests.
 */
const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 30;

/**
 * GET /api/seismic?city=San Jose
 *
 * Returns seismic hazard data for a California city using the free USGS
 * Earthquake Hazards Program API. Combines real-time earthquake data with
 * pre-mapped seismic zone classifications for California cities.
 *
 * Includes ADU construction implications for each seismic zone level.
 *
 * Uses the free USGS API — no API key required.
 * Rate limited to 30 requests/min per IP. Cached for 1 hour.
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
  const cached = seismicCache.get(cacheKey);
  if (cached && now - cached.timestamp < CACHE_TTL_MS) {
    return NextResponse.json({
      ...(cached.data as Record<string, unknown>),
      _cached: true,
      _cacheAge: Math.round((now - cached.timestamp) / 1000),
    });
  }

  // Build USGS Earthquake API URL
  const usgsUrl = new URL(
    "https://earthquake.usgs.gov/fdsnws/event/1/query"
  );
  usgsUrl.searchParams.set("format", "geojson");
  usgsUrl.searchParams.set("latitude", coords.lat.toString());
  usgsUrl.searchParams.set("longitude", coords.lon.toString());
  usgsUrl.searchParams.set("maxradiuskm", "50");
  usgsUrl.searchParams.set("minmagnitude", "2.0");
  usgsUrl.searchParams.set("limit", "10");
  usgsUrl.searchParams.set("orderby", "time");

  // Look up seismic zone
  const seismicZone = SEISMIC_ZONES[normalizedCity] ?? {
    zone: "Moderate" as const,
    riskLevel: 1,
    description:
      "Moderate seismic risk — California is seismically active; consult local building department and CGS for site-specific data",
    majorFaults: ["San Andreas (regional)"],
    county: "California",
  };

  try {
    const response = await fetch(usgsUrl.toString(), {
      headers: { "User-Agent": "BayForge-AI/1.0" },
      signal: AbortSignal.timeout(15_000),
    });

    if (!response.ok) {
      throw new Error(
        `USGS Earthquake API returned ${response.status}: ${response.statusText}`
      );
    }

    const data = await response.json();

    if (!data.features || !Array.isArray(data.features)) {
      return NextResponse.json(
        { error: "No seismic data returned from USGS." },
        { status: 502 }
      );
    }

    // Process earthquake data
    const earthquakes = data.features.map(
      (feature: Record<string, unknown>) => {
        const props = feature.properties as Record<string, unknown>;
        const geom = feature.geometry as Record<string, unknown>;
        const coordsArr = geom.coordinates as number[];

        const distanceKm = haversineDistanceKm(
          coords.lat,
          coords.lon,
          coordsArr[1],
          coordsArr[0]
        );

        return {
          id: feature.id,
          magnitude: props.mag as number,
          place: props.place as string,
          time: new Date(props.time as number).toISOString(),
          depth_km: coordsArr[2],
          distance_km: Math.round(distanceKm * 10) / 10,
          distance_miles: Math.round(distanceKm * 0.621371 * 10) / 10,
          type: props.type as string,
          tsunami: props.tsunami as number,
          significance: props.significance as number,
          url: props.url as string,
        };
      }
    );

    // Sort by distance (nearest first)
    earthquakes.sort((a: { distance_km: number }, b: { distance_km: number }) => a.distance_km - b.distance_km);

    // Find nearest earthquake
    const nearestEarthquake =
      earthquakes.length > 0 ? earthquakes[0] : null;

    // Calculate seismic activity summary
    const recentCount = earthquakes.length;
    const maxMagnitude =
      earthquakes.length > 0
        ? Math.max(...earthquakes.map((e: { magnitude: number }) => e.magnitude))
        : 0;
    const avgDepth =
      earthquakes.length > 0
        ? Math.round(
            earthquakes.reduce(
              (sum: number, e: { depth_km: number }) => sum + e.depth_km,
              0
            ) / earthquakes.length
          )
        : 0;

    // Time range of recent earthquakes
    let timeRangeDays = 0;
    if (earthquakes.length >= 2) {
      const newest = new Date(earthquakes[earthquakes.length - 1].time).getTime();
      const oldest = new Date(earthquakes[0].time).getTime();
      timeRangeDays = Math.round((newest - oldest) / (1000 * 60 * 60 * 24));
    } else if (earthquakes.length === 1) {
      timeRangeDays = 30; // Default window
    }

    // Get construction implications
    const constructionImplications = getSeismicConstructionImplications(
      seismicZone
    );

    // Build activity assessment
    let activityLevel: string;
    let activityEmoji: string;
    if (recentCount === 0) {
      activityLevel = "No recent seismic activity detected";
      activityEmoji = "✅";
    } else if (recentCount <= 3) {
      activityLevel = "Low recent seismic activity";
      activityEmoji = "🟢";
    } else if (recentCount <= 7) {
      activityLevel = "Moderate recent seismic activity";
      activityEmoji = "🟡";
    } else {
      activityLevel = "High recent seismic activity";
      activityEmoji = "🔴";
    }

    const result = {
      city: city.trim(),
      coordinates: coords,
      seismicZone: {
        zone: seismicZone.zone,
        riskLevel: seismicZone.riskLevel,
        riskLevelLabel:
          seismicZone.riskLevel === 3
            ? "Very High"
            : seismicZone.riskLevel === 2
              ? "Moderate-High"
              : "Low-Moderate",
        description: seismicZone.description,
        majorFaults: seismicZone.majorFaults,
        county: seismicZone.county,
      },
      recentActivity: {
        count: recentCount,
        timeRangeDays,
        activityLevel,
        activityEmoji,
        maxMagnitude,
        maxMagnitudeLabel:
          maxMagnitude >= 7
            ? "Major"
            : maxMagnitude >= 5
              ? "Strong"
              : maxMagnitude >= 3
                ? "Minor"
                : maxMagnitude >= 2
                  ? "Micro"
                  : "None",
        averageDepth_km: avgDepth,
      },
      nearestEarthquake: nearestEarthquake
        ? {
            magnitude: nearestEarthquake.magnitude,
            place: nearestEarthquake.place,
            time: nearestEarthquake.time,
            distance_km: nearestEarthquake.distance_km,
            distance_miles: nearestEarthquake.distance_miles,
            depth_km: nearestEarthquake.depth_km,
          }
        : null,
      recentEarthquakes: earthquakes.map(
        (e: {
          magnitude: number;
          place: string;
          time: string;
          distance_km: number;
          distance_miles: number;
          depth_km: number;
        }) => ({
          magnitude: e.magnitude,
          place: e.place,
          time: e.time,
          distance_km: e.distance_km,
          distance_miles: e.distance_miles,
          depth_km: e.depth_km,
        })
      ),
      aduConstructionImplications: constructionImplications,
      source: "usgs-earthquake-hazards",
      fetchedAt: new Date().toISOString(),
    };

    // Cache result
    seismicCache.set(cacheKey, { data: result, timestamp: now });

    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error";
    console.error("[Seismic API Error]", message);

    return NextResponse.json(
      {
        error: "Failed to fetch seismic data from USGS",
        details: message,
      },
      { status: 502 }
    );
  }
}
