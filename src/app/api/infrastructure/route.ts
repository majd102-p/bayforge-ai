import { NextRequest, NextResponse } from "next/server";

/**
 * Built-in lookup table of California city coordinates.
 * Reused from the transit route for consistency.
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
  "san ramon": { lat: 37.7799, lon: -121.978 },
  "walnut creek": { lat: 37.9101, lon: -122.0652 },
  "san leandro": { lat: 37.7228, lon: -122.1561 },
  "dublin": { lat: 37.7021, lon: -121.9358 },
  pleasanton: { lat: 37.6585, lon: -121.8746 },
};

/** Overpass API endpoint */
const OVERPASS_URL = "https://overpass-api.de/api/interpreter";

/** Search radii in meters for each infrastructure category */
const SEARCH_RADII: Record<string, number> = {
  schools: 3219,          // 2 miles
  parks: 1609,            // 1 mile
  fire_stations: 4828,    // 3 miles
  hospitals: 8047,        // 5 miles
  grocery_stores: 1609,   // 1 mile
  libraries: 3219,        // 2 miles
  community_centers: 3219, // 2 miles
};

/** Human-readable radius labels */
const RADIUS_LABELS: Record<string, string> = {
  schools: "2 miles",
  parks: "1 mile",
  fire_stations: "3 miles",
  hospitals: "5 miles",
  grocery_stores: "1 mile",
  libraries: "2 miles",
  community_centers: "2 miles",
};

/**
 * In-memory cache for infrastructure results.
 * Key: normalized city name → { data, timestamp }
 */
const infrastructureCache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_TTL_MS = 60 * 60 * 1000; // 60 minutes (Overpass is slower)

/**
 * Simple rate limiter for infrastructure requests.
 */
const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 20;

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
 * Build Overpass QL queries for all infrastructure categories.
 * Returns a combined query using union to minimize API calls.
 */
function buildOverpassQuery(lat: number, lon: number): string {
  const r = SEARCH_RADII;
  return `
[out:json][timeout:25];
(
  node["amenity"="school"](around:${r.schools},${lat},${lon});
  way["amenity"="school"](around:${r.schools},${lat},${lon});
  relation["amenity"="school"](around:${r.schools},${lat},${lon});

  node["leisure"="park"](around:${r.parks},${lat},${lon});
  way["leisure"="park"](around:${r.parks},${lat},${lon});
  node["leisure"="garden"](around:${r.parks},${lat},${lon});
  way["leisure"="garden"](around:${r.parks},${lat},${lon});
  node["leisure"="playground"](around:${r.parks},${lat},${lon});
  way["leisure"="playground"](around:${r.parks},${lat},${lon});
  node["leisure"="nature_reserve"](around:${r.parks},${lat},${lon});
  way["leisure"="nature_reserve"](around:${r.parks},${lat},${lon});
  node["boundary"="national_park"](around:${r.parks},${lat},${lon});
  way["boundary"="national_park"](around:${r.parks},${lat},${lon});

  node["amenity"="fire_station"](around:${r.fire_stations},${lat},${lon});
  way["amenity"="fire_station"](around:${r.fire_stations},${lat},${lon});

  node["amenity"="hospital"](around:${r.hospitals},${lat},${lon});
  way["amenity"="hospital"](around:${r.hospitals},${lat},${lon});
  node["amenity"="clinic"](around:${r.hospitals},${lat},${lon});
  way["amenity"="clinic"](around:${r.hospitals},${lat},${lon});
  node["amenity"="doctors"](around:${r.hospitals},${lat},${lon});
  way["amenity"="doctors"](around:${r.hospitals},${lat},${lon});
  node["emergency"="ambulance_station"](around:${r.hospitals},${lat},${lon});
  way["emergency"="ambulance_station"](around:${r.hospitals},${lat},${lon});

  node["shop"="supermarket"](around:${r.grocery_stores},${lat},${lon});
  way["shop"="supermarket"](around:${r.grocery_stores},${lat},${lon});
  node["shop"="convenience"](around:${r.grocery_stores},${lat},${lon});
  way["shop"="convenience"](around:${r.grocery_stores},${lat},${lon});
  node["shop"="grocery"](around:${r.grocery_stores},${lat},${lon});
  way["shop"="grocery"](around:${r.grocery_stores},${lat},${lon});

  node["amenity"="library"](around:${r.libraries},${lat},${lon});
  way["amenity"="library"](around:${r.libraries},${lat},${lon});

  node["amenity"="community_centre"](around:${r.community_centers},${lat},${lon});
  way["amenity"="community_centre"](around:${r.community_centers},${lat},${lon});
  node["amenity"="social_centre"](around:${r.community_centers},${lat},${lon});
  way["amenity"="social_centre"](around:${r.community_centers},${lat},${lon});
  node["leisure"="sports_centre"](around:${r.community_centers},${lat},${lon});
  way["leisure"="sports_centre"](around:${r.community_centers},${lat},${lon});
  node["leisure"="fitness_centre"](around:${r.community_centers},${lat},${lon});
  way["leisure"="fitness_centre"](around:${r.community_centers},${lat},${lon});
);
out body 500;
`.trim();
}

/**
 * Classify each OSM element into one or more infrastructure categories.
 */
function classifyInfrastructure(tags: Record<string, string>): string[] {
  const categories: string[] = [];
  const amenity = tags.amenity;
  const leisure = tags.leisure;
  const shop = tags.shop;
  const boundary = tags.boundary;
  const emergency = tags.emergency;

  // Schools
  if (amenity === "school") {
    categories.push("schools");
  }

  // Parks and recreation
  if (
    leisure === "park" ||
    leisure === "garden" ||
    leisure === "playground" ||
    leisure === "nature_reserve" ||
    boundary === "national_park"
  ) {
    categories.push("parks");
  }

  // Fire stations
  if (amenity === "fire_station") {
    categories.push("fire_stations");
  }

  // Hospitals / urgent care
  if (
    amenity === "hospital" ||
    amenity === "clinic" ||
    amenity === "doctors" ||
    emergency === "ambulance_station"
  ) {
    categories.push("hospitals");
  }

  // Grocery stores
  if (
    shop === "supermarket" ||
    shop === "convenience" ||
    shop === "grocery"
  ) {
    categories.push("grocery_stores");
  }

  // Libraries
  if (amenity === "library") {
    categories.push("libraries");
  }

  // Community centers and recreation facilities
  if (
    amenity === "community_centre" ||
    amenity === "social_centre" ||
    leisure === "sports_centre" ||
    leisure === "fitness_centre"
  ) {
    categories.push("community_centers");
  }

  return [...new Set(categories)];
}

interface InfrastructureItem {
  name: string | null;
  category: string;
  lat: number;
  lon: number;
  distanceM: number;
  distanceMi: number;
  osmType: string;
}

/**
 * Generate ADU-specific implications for each infrastructure category.
 */
function generateCategoryImplications(
  category: string,
  count: number,
  nearestDistanceMi: number | null
): string[] {
  const implications: string[] = [];
  const dist = nearestDistanceMi !== null ? nearestDistanceMi.toFixed(2) : null;

  switch (category) {
    case "schools":
      if (count > 0) {
        implications.push(
          `${count} school(s) within 2 miles — family-friendly ADU location`
        );
        if (dist && parseFloat(dist) <= 1) {
          implications.push(
            "School within walking distance (< 1 mi) — high demand for family tenants"
          );
        }
      } else {
        implications.push(
          "No schools found within 2 miles — may limit appeal for families with children"
        );
      }
      break;

    case "parks":
      if (count > 0) {
        implications.push(
          `${count} park(s)/recreation area(s) within 1 mile — enhances livability`
        );
        if (count >= 3) {
          implications.push(
            "Excellent park access — strong selling point for ADU tenants"
          );
        }
      } else {
        implications.push(
          "No parks within 1 mile — consider landscaping/outdoor space in ADU design"
        );
      }
      break;

    case "fire_stations":
      if (count > 0) {
        implications.push(
          `${count} fire station(s) within 3 miles`
        );
        if (dist && parseFloat(dist) <= 2) {
          implications.push(
            "Fire station nearby (< 2 mi) — may positively impact insurance rates"
          );
        }
      } else {
        implications.push(
          "No fire stations within 3 miles — verify local fire safety codes for ADU"
        );
      }
      break;

    case "hospitals":
      if (count > 0) {
        implications.push(
          `${count} medical facility(ies) within 5 miles`
        );
        if (dist && parseFloat(dist) <= 2) {
          implications.push(
            "Hospital/clinic nearby (< 2 mi) — attractive for elderly or healthcare-worker tenants"
          );
        }
      } else {
        implications.push(
          "No hospitals or clinics within 5 miles — factor in emergency access for ADU design"
        );
      }
      break;

    case "grocery_stores":
      if (count > 0) {
        implications.push(
          `${count} grocery store(s) within 1 mile — daily necessities within reach`
        );
        if (count >= 3) {
          implications.push(
            "Multiple grocery options — strong walkability and tenant convenience"
          );
        }
      } else {
        implications.push(
          "No grocery stores within 1 mile — car dependency likely for ADU tenants"
        );
      }
      break;

    case "libraries":
      if (count > 0) {
        implications.push(
          `${count} librar(ies) within 2 miles — good for remote workers and students`
        );
      } else {
        implications.push(
          "No libraries within 2 miles — consider proximity to co-working spaces"
        );
      }
      break;

    case "community_centers":
      if (count > 0) {
        implications.push(
          `${count} community/recreation center(s) within 2 miles — good social infrastructure`
        );
      } else {
        implications.push(
          "No community centers within 2 miles — limited local gathering spaces"
        );
      }
      break;
  }

  return implications;
}

/**
 * Calculate a Walk Score estimate (0–100) based on nearby amenity counts and distances.
 * This is a simplified heuristic, not the official Walk Score® algorithm.
 */
function calculateWalkScore(
  categorized: Record<string, InfrastructureItem[]>
): number {
  // Weights reflect how much each category contributes to walkability
  const weights: Record<string, number> = {
    grocery_stores: 25,
    parks: 15,
    schools: 10,
    libraries: 10,
    community_centers: 10,
    hospitals: 10,
    fire_stations: 5,
  };

  let score = 0;

  for (const [category, items] of Object.entries(categorized)) {
    const weight = weights[category] ?? 5;
    const nearby = items.filter((i) => i.distanceMi <= 0.5).length;
    const moderate = items.filter((i) => i.distanceMi > 0.5 && i.distanceMi <= 1.0).length;
    const far = items.filter((i) => i.distanceMi > 1.0).length;

    // Full weight for very close, diminishing for further
    const categoryScore = Math.min(1, (nearby * 1.0 + moderate * 0.5 + far * 0.15));
    score += weight * categoryScore;
  }

  return Math.min(100, Math.round(score));
}

/**
 * Calculate a family-friendliness rating (0–10).
 */
function calculateFamilyFriendliness(
  categorized: Record<string, InfrastructureItem[]>
): { score: number; factors: string[] } {
  const factors: string[] = [];
  let score = 0;

  // Schools (up to 3 points)
  const schoolCount = categorized.schools?.length ?? 0;
  const nearbySchools = categorized.schools?.filter((s) => s.distanceMi <= 1).length ?? 0;
  if (nearbySchools >= 2) {
    score += 3;
    factors.push("Multiple schools within walking distance");
  } else if (schoolCount >= 1) {
    score += 2;
    factors.push(`${schoolCount} school(s) within 2 miles`);
  } else {
    factors.push("No nearby schools — less appealing for families");
  }

  // Parks (up to 3 points)
  const parkCount = categorized.parks?.length ?? 0;
  if (parkCount >= 3) {
    score += 3;
    factors.push("Excellent park and recreation access");
  } else if (parkCount >= 1) {
    score += 2;
    factors.push(`${parkCount} park(s) nearby`);
  } else {
    factors.push("No parks within 1 mile");
  }

  // Grocery (up to 2 points)
  const groceryCount = categorized.grocery_stores?.length ?? 0;
  if (groceryCount >= 2) {
    score += 2;
    factors.push("Multiple grocery stores nearby");
  } else if (groceryCount >= 1) {
    score += 1;
    factors.push("At least one grocery store nearby");
  }

  // Libraries (up to 1 point)
  const libraryCount = categorized.libraries?.length ?? 0;
  if (libraryCount >= 1) {
    score += 1;
    factors.push("Library accessible for families");
  }

  // Community centers (up to 1 point)
  const ccCount = categorized.community_centers?.length ?? 0;
  if (ccCount >= 1) {
    score += 1;
    factors.push("Community/recreation centers available");
  }

  return { score: Math.min(10, score), factors };
}

/**
 * Calculate ADU tenant desirability score (0–100).
 * Considers walkability, safety infrastructure, and convenience.
 */
function calculateTenantDesirability(
  walkScore: number,
  categorized: Record<string, InfrastructureItem[]>
): { score: number; strengths: string[]; weaknesses: string[] } {
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  let score = 0;

  // Walkability component (0–35 points)
  score += Math.round(walkScore * 0.35);

  // Grocery proximity (0–15 points)
  const groceryCount = categorized.grocery_stores?.length ?? 0;
  const walkableGrocery = categorized.grocery_stores?.filter((g) => g.distanceMi <= 0.5).length ?? 0;
  if (walkableGrocery >= 1) {
    score += 15;
    strengths.push("Walkable grocery shopping");
  } else if (groceryCount >= 1) {
    score += 8;
    strengths.push("Grocery stores within easy reach");
  } else {
    weaknesses.push("No grocery stores within 1 mile");
  }

  // Transit-adjacent benefit (0–10 points)
  const parkCount = categorized.parks?.length ?? 0;
  if (parkCount >= 2) {
    score += 10;
    strengths.push("Multiple nearby parks enhance quality of life");
  } else if (parkCount >= 1) {
    score += 5;
  }

  // Healthcare access (0–15 points)
  const hospitalCount = categorized.hospitals?.length ?? 0;
  if (hospitalCount >= 1) {
    score += 15;
    strengths.push("Healthcare facilities nearby");
  } else {
    weaknesses.push("Limited healthcare access within 5 miles");
  }

  // Community infrastructure (0–10 points)
  const ccCount = categorized.community_centers?.length ?? 0;
  const libCount = categorized.libraries?.length ?? 0;
  if (ccCount >= 1 && libCount >= 1) {
    score += 10;
    strengths.push("Strong community amenities (library, community center)");
  } else if (ccCount >= 1 || libCount >= 1) {
    score += 5;
  }

  // Safety infrastructure (0–15 points)
  const fireCount = categorized.fire_stations?.length ?? 0;
  if (fireCount >= 1) {
    score += 15;
    strengths.push("Fire station nearby for emergency response");
  } else {
    weaknesses.push("No fire station within 3 miles");
  }

  return {
    score: Math.min(100, Math.max(0, score)),
    strengths,
    weaknesses,
  };
}

/**
 * Generate overall infrastructure adequacy assessment.
 */
function assessInfrastructureAdequacy(
  categorized: Record<string, InfrastructureItem[]>
): { rating: string; summary: string; recommendations: string[] } {
  const totalAmenities = Object.values(categorized).reduce((sum, items) => sum + items.length, 0);
  const hasSchools = (categorized.schools?.length ?? 0) > 0;
  const hasParks = (categorized.parks?.length ?? 0) > 0;
  const hasGrocery = (categorized.grocery_stores?.length ?? 0) > 0;
  const hasHospital = (categorized.hospitals?.length ?? 0) > 0;
  const hasLibrary = (categorized.libraries?.length ?? 0) > 0;
  const hasFireStation = (categorized.fire_stations?.length ?? 0) > 0;
  const hasCommunityCenter = (categorized.community_centers?.length ?? 0) > 0;

  const criticalCategories = [hasSchools, hasParks, hasGrocery, hasHospital].filter(Boolean).length;
  const allCategories = [hasSchools, hasParks, hasGrocery, hasHospital, hasLibrary, hasFireStation, hasCommunityCenter].filter(Boolean).length;

  const recommendations: string[] = [];

  let rating: string;
  let summary: string;

  if (allCategories >= 7 && totalAmenities >= 20) {
    rating = "Excellent";
    summary = "Outstanding infrastructure coverage. This is a premium ADU location with comprehensive access to all essential services and amenities.";
  } else if (allCategories >= 6 && totalAmenities >= 12) {
    rating = "Very Good";
    summary = "Strong infrastructure across nearly all categories. High tenant demand expected with minimal gaps in services.";
  } else if (allCategories >= 5 && totalAmenities >= 8) {
    rating = "Good";
    summary = "Solid infrastructure foundation with most essential services nearby. Minor gaps may be acceptable depending on target tenant profile.";
  } else if (allCategories >= 4 && totalAmenities >= 4) {
    rating = "Adequate";
    summary = "Basic infrastructure needs are met. Some categories are under-served, which may affect rental competitiveness.";
  } else if (allCategories >= 3) {
    rating = "Limited";
    summary = "Several infrastructure categories are missing or sparse. ADU may need enhanced amenities to compensate for neighborhood gaps.";
  } else {
    rating = "Sparse";
    summary = "Significant infrastructure gaps detected. Tenants may need to travel for most services — consider targeting auto-dependent renters.";
  }

  // Generate recommendations based on gaps
  if (!hasGrocery) {
    recommendations.push(
      "No grocery stores within 1 mile — ensure ADU includes adequate kitchen storage and consider bike rack"
    );
  }
  if (!hasSchools && criticalCategories < 3) {
    recommendations.push(
      "No schools nearby — market toward professionals or retirees rather than families"
    );
  }
  if (!hasParks) {
    recommendations.push(
      "No parks within 1 mile — consider adding a small patio or garden space to the ADU"
    );
  }
  if (!hasHospital) {
    recommendations.push(
      "No hospitals/clinics within 5 miles — include smoke detectors, CO monitors, and first-aid kit as standard"
    );
  }
  if (!hasFireStation) {
    recommendations.push(
      "No fire station within 3 miles — ensure ADU meets all fire safety requirements and has clear egress"
    );
  }
  if (!hasLibrary && !hasCommunityCenter) {
    recommendations.push(
      "Limited community infrastructure — consider ADU features like high-speed internet to attract remote workers"
    );
  }
  if (recommendations.length === 0) {
    recommendations.push(
      "Infrastructure is comprehensive — proceed with standard ADU design and focus on quality finishes"
    );
  }

  return { rating, summary, recommendations };
}

/**
 * GET /api/infrastructure?city=San Jose
 *
 * Finds nearby infrastructure and amenities using the OpenStreetMap Overpass API.
 * Categories: schools, parks, fire stations, hospitals, grocery stores, libraries,
 * community centers — each within defined search radii.
 *
 * Provides ADU-specific analysis: walk score estimate, family-friendliness,
 * tenant desirability score, and infrastructure adequacy assessment.
 *
 * Uses the free Overpass API — no API key required.
 * Rate limited to 20 requests/min per IP. Cached for 60 minutes.
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
  const cached = infrastructureCache.get(cacheKey);
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
        { error: "No infrastructure data returned from Overpass API." },
        { status: 502 }
      );
    }

    // Process each element into infrastructure items
    const allItems: InfrastructureItem[] = [];

    for (const element of data.elements) {
      // Get coordinates — for nodes it's direct, for ways/relations we use center/bounds
      let itemLat: number | null = null;
      let itemLon: number | null = null;

      if (element.type === "node") {
        itemLat = element.lat;
        itemLon = element.lon;
      } else if (element.type === "way" && element.center) {
        itemLat = element.center.lat;
        itemLon = element.center.lon;
      } else if (element.type === "way" && element.bounds) {
        itemLat = (element.bounds.minlat + element.bounds.maxlat) / 2;
        itemLon = (element.bounds.minlon + element.bounds.maxlon) / 2;
      } else if (element.type === "relation" && element.center) {
        itemLat = element.center.lat;
        itemLon = element.center.lon;
      }

      if (itemLat === null || itemLon === null) continue;

      const tags = element.tags ?? {};
      const categories = classifyInfrastructure(tags);

      if (categories.length === 0) continue;

      const distanceM = haversineDistance(
        coords.lat,
        coords.lon,
        itemLat,
        itemLon
      );
      const distanceMi = distanceM / 1609.34;

      for (const category of categories) {
        allItems.push({
          name: tags.name ?? null,
          category,
          lat: itemLat,
          lon: itemLon,
          distanceM: Math.round(distanceM),
          distanceMi: Math.round(distanceMi * 100) / 100,
          osmType: element.type,
        });
      }
    }

    // Deduplicate: same name + category at similar coordinates
    const seen = new Map<string, InfrastructureItem>();
    for (const item of allItems) {
      const key = `${item.category}:${(item.name ?? "").toLowerCase()}:${Math.round(item.lat * 10000)}:${Math.round(item.lon * 10000)}`;
      const existing = seen.get(key);
      if (!existing || item.distanceM < existing.distanceM) {
        seen.set(key, item);
      }
    }
    const uniqueItems = Array.from(seen.values());

    // Categorize items
    const categorized: Record<string, InfrastructureItem[]> = {
      schools: [],
      parks: [],
      fire_stations: [],
      hospitals: [],
      grocery_stores: [],
      libraries: [],
      community_centers: [],
    };

    for (const item of uniqueItems) {
      if (categorized[item.category]) {
        categorized[item.category].push(item);
      }
    }

    // Sort each category by distance
    for (const items of Object.values(categorized)) {
      items.sort((a, b) => a.distanceM - b.distanceM);
    }

    // Build per-category results with top 3 and implications
    const categoryResults: Record<string, {
      count: number;
      searchRadius: string;
      searchRadiusMeters: number;
      topNearest: Array<{
        name: string | null;
        distanceMi: number;
        distanceM: number;
      }>;
      aduImplications: string[];
    }> = {};

    for (const [category, items] of Object.entries(categorized)) {
      const top3 = items.slice(0, 3).map((item) => ({
        name: item.name,
        distanceMi: item.distanceMi,
        distanceM: item.distanceM,
      }));

      const nearestDistanceMi = items.length > 0 ? items[0].distanceMi : null;
      const implications = generateCategoryImplications(category, items.length, nearestDistanceMi);

      categoryResults[category] = {
        count: items.length,
        searchRadius: RADIUS_LABELS[category],
        searchRadiusMeters: SEARCH_RADII[category],
        topNearest: top3,
        aduImplications: implications,
      };
    }

    // Calculate composite scores
    const walkScore = calculateWalkScore(categorized);
    const familyFriendliness = calculateFamilyFriendliness(categorized);
    const tenantDesirability = calculateTenantDesirability(walkScore, categorized);
    const infrastructureAdequacy = assessInfrastructureAdequacy(categorized);

    // Collect all ADU implications across categories
    const allImplications: string[] = [];
    for (const result of Object.values(categoryResults)) {
      allImplications.push(...result.aduImplications);
    }

    // Walk score descriptor
    let walkScoreLabel: string;
    if (walkScore >= 90) walkScoreLabel = "Walker's Paradise";
    else if (walkScore >= 70) walkScoreLabel = "Very Walkable";
    else if (walkScore >= 50) walkScoreLabel = "Somewhat Walkable";
    else if (walkScore >= 25) walkScoreLabel = "Car-Dependent";
    else walkScoreLabel = "Very Car-Dependent";

    const result = {
      city: city.trim(),
      coordinates: coords,
      totalAmenitiesFound: uniqueItems.length,
      categories: categoryResults,
      scores: {
        walkScore: {
          score: walkScore,
          label: walkScoreLabel,
          note: "Estimated walk score (heuristic), not the official Walk Score®. Based on proximity and variety of nearby amenities.",
        },
        familyFriendliness: {
          score: familyFriendliness.score,
          maxScore: 10,
          factors: familyFriendliness.factors,
        },
        tenantDesirability: {
          score: tenantDesirability.score,
          maxScore: 100,
          strengths: tenantDesirability.strengths,
          weaknesses: tenantDesirability.weaknesses,
        },
        infrastructureAdequacy: {
          rating: infrastructureAdequacy.rating,
          summary: infrastructureAdequacy.summary,
          recommendations: infrastructureAdequacy.recommendations,
        },
      },
      aduImplications: allImplications,
      searchRadiiMeters: SEARCH_RADII,
      source: "openstreetmap-overpass",
      fetchedAt: new Date().toISOString(),
    };

    // Cache result
    infrastructureCache.set(cacheKey, { data: result, timestamp: now });

    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error";
    console.error("[Infrastructure API Error]", message);

    return NextResponse.json(
      {
        error: "Failed to fetch infrastructure data from OpenStreetMap",
        details: message,
      },
      { status: 502 }
    );
  }
}
