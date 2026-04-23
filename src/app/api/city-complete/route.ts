import { NextRequest, NextResponse } from "next/server";

/**
 * BayForge AI — City Complete Aggregator API
 *
 * Combines data from ALL 14 city data endpoints into a single response:
 *   1.  /api/weather         — Current weather + construction suitability
 *   2.  /api/city-info       — Wikipedia city information
 *   3.  /api/geocode         — OSM Nominatim geocoding
 *   4.  /api/elevation       — Open-Meteo elevation + hillside risk
 *   5.  /api/seismic         — USGS earthquake hazards
 *   6.  /api/air-quality     — Open-Meteo air quality index
 *   7.  /api/transit         — OSM Overpass transit stops
 *   8.  /api/housing-data    — Built-in housing market + ROI analysis
 *   9.  /api/solar           — Open-Meteo solar radiation + ADU solar ROI
 *  10. /api/infrastructure   — OSM Overpass nearby amenities
 *  11. /api/census           — US Census Bureau demographics
 *  12. /api/climate-history  — Open-Meteo 5-year historical climate
 *
 * Uses Promise.allSettled so partial failures don't block the response.
 * Cached in-memory for 5 minutes. Rate limited to 10 req/min per IP.
 */

const cityCompleteCache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 10;

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL
  ? `${process.env.NEXT_PUBLIC_BASE_URL}`
  : "http://localhost:3000";

function safeFetch(url: string): Promise<unknown> {
  return fetch(url).then((r) => r.json()).catch(() => null);
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const city = searchParams.get("city");

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
  const cacheKey = city.trim().toLowerCase();
  const cached = cityCompleteCache.get(cacheKey);
  if (cached && now - cached.timestamp < CACHE_TTL_MS) {
    return NextResponse.json({
      ...(cached.data as Record<string, unknown>),
      _cached: true,
      _cacheAgeSec: Math.round((now - cached.timestamp) / 1000),
    });
  }

  const ec = encodeURIComponent(city.trim());

  // Build all fetch promises — independent calls go in parallel
  const weatherPromise = safeFetch(`${BASE_URL}/api/weather?city=${ec}`);
  const cityInfoPromise = safeFetch(`${BASE_URL}/api/city-info?city=${ec}`);
  const geocodePromise = safeFetch(`${BASE_URL}/api/geocode?city=${ec}`);
  const seismicPromise = safeFetch(`${BASE_URL}/api/seismic?city=${ec}`);
  const airQualityPromise = safeFetch(`${BASE_URL}/api/air-quality?city=${ec}`);
  const transitPromise = safeFetch(`${BASE_URL}/api/transit?city=${ec}`);
  const housingDataPromise = safeFetch(`${BASE_URL}/api/housing-data?city=${ec}`);
  const solarPromise = safeFetch(`${BASE_URL}/api/solar?city=${ec}`);
  const infrastructurePromise = safeFetch(`${BASE_URL}/api/infrastructure?city=${ec}`);
  const censusPromise = safeFetch(`${BASE_URL}/api/census?city=${ec}`);
  const climateHistoryPromise = safeFetch(`${BASE_URL}/api/climate-history?city=${ec}`);

  // Elevation requires coordinates — chain after geocode
  const elevationPromise = geocodePromise.then(async (geoData: unknown) => {
    const geo = geoData as Record<string, unknown> | null;
    if (geo && geo.lat && geo.lon) {
      return safeFetch(`${BASE_URL}/api/elevation?lat=${geo.lat}&lon=${geo.lon}`);
    }
    return null;
  });

  try {
    const [
      weatherResult,
      cityInfoResult,
      geocodeResult,
      elevationResult,
      seismicResult,
      airQualityResult,
      transitResult,
      housingDataResult,
      solarResult,
      infrastructureResult,
      censusResult,
      climateHistoryResult,
    ] = await Promise.allSettled([
      weatherPromise,
      cityInfoPromise,
      geocodePromise,
      elevationPromise,
      seismicPromise,
      airQualityPromise,
      transitPromise,
      housingDataPromise,
      solarPromise,
      infrastructurePromise,
      censusPromise,
      climateHistoryPromise,
    ]);

    // Helper to extract result or error
    const extract = (result: PromiseSettledResult<unknown>, label: string) => {
      if (result.status === "fulfilled") {
        const val = result.value;
        if (val && typeof val === "object" && "error" in (val as Record<string, unknown>)) {
          return { data: null, available: false, error: (val as Record<string, string>).error };
        }
        return { data: val, available: true, error: null };
      }
      return { data: null, available: false, error: result.reason?.message ?? `${label} unavailable` };
    };

    const weather = extract(weatherResult, "Weather");
    const cityInfo = extract(cityInfoResult, "City Info");
    const geocode = extract(geocodeResult, "Geocode");
    const elevation = extract(elevationResult, "Elevation");
    const seismic = extract(seismicResult, "Seismic");
    const airQuality = extract(airQualityResult, "Air Quality");
    const transit = extract(transitResult, "Transit");
    const housingData = extract(housingDataResult, "Housing Data");
    const solar = extract(solarResult, "Solar");
    const infrastructure = extract(infrastructureResult, "Infrastructure");
    const census = extract(censusResult, "Census");
    const climateHistory = extract(climateHistoryResult, "Climate History");

    // Completeness tracking
    const sources = [
      { key: "weather", available: weather.available },
      { key: "cityInfo", available: cityInfo.available },
      { key: "geocode", available: geocode.available },
      { key: "elevation", available: elevation.available },
      { key: "seismic", available: seismic.available },
      { key: "airQuality", available: airQuality.available },
      { key: "transit", available: transit.available },
      { key: "housingData", available: housingData.available },
      { key: "solar", available: solar.available },
      { key: "infrastructure", available: infrastructure.available },
      { key: "census", available: census.available },
      { key: "climateHistory", available: climateHistory.available },
    ];
    const availableCount = sources.filter((s) => s.available).length;

    // ── Build comprehensive ADU feasibility summary ──
    const factors: string[] = [];
    const warnings: string[] = [];
    const strengths: string[] = [];

    // Weather
    if (weather.data) {
      const wd = weather.data as Record<string, unknown>;
      const cs = wd.constructionSuitability as Record<string, unknown> | undefined;
      if (cs) {
        const score = cs.score as number;
        if (score >= 80) factors.push(`Favorable weather for construction (${score}/100)`);
        else if (score >= 60) factors.push(`Acceptable weather for construction (${score}/100)`);
        else warnings.push(`Suboptimal weather conditions (${score}/100)`);
      }
    }

    // Elevation / Hillside
    if (elevation.data) {
      const ed = elevation.data as Record<string, unknown>;
      const hr = ed.hillsideRisk as Record<string, unknown> | undefined;
      if (hr) {
        const risk = hr.riskLevel as string;
        if (risk === "Low") factors.push("Flat terrain — standard construction feasible");
        else if (risk === "Moderate") {
          factors.push("Moderate elevation — hillside considerations apply");
          warnings.push("Budget for retaining walls and engineered foundations");
        } else {
          warnings.push("High elevation terrain — significant construction challenges");
        }
      }
    }

    // Seismic
    if (seismic.data) {
      const sd = seismic.data as Record<string, unknown>;
      const sz = sd.seismicZone as Record<string, unknown> | undefined;
      if (sz) {
        const zone = sz.zone as string;
        if (zone === "High") warnings.push(`High seismic risk zone — enhanced engineering required`);
        else if (zone === "Moderate") factors.push("Moderate seismic zone — standard code provisions apply");
        else factors.push("Low seismic risk zone — minimal seismic premiums");
      }
    }

    // Air Quality
    if (airQuality.data) {
      const aqd = airQuality.data as Record<string, unknown>;
      const cs = aqd.constructionSuitability as string | undefined;
      if (cs === "Favorable") factors.push("Good air quality for outdoor construction");
      else if (cs === "Postpone Outdoor Work") warnings.push("Poor air quality — postpone outdoor work");
    }

    // Transit / Parking waiver
    if (transit.data) {
      const td = transit.data as Record<string, unknown>;
      if (td.qualifiesForParkingWaiver) {
        strengths.push("Transit-rich area — ADU may qualify for parking waiver (CA Gov Code §65913.4)");
      }
    }

    // Housing / ROI
    if (housingData.data) {
      const hd = housingData.data as Record<string, unknown>;
      const roi = hd.roiAnalysis as Record<string, unknown> | undefined;
      if (roi) {
        const pb = roi.simplePaybackYears as Record<string, number> | undefined;
        if (pb && pb.low <= 12) {
          strengths.push(`Strong ROI — ${pb.low}-${pb.high} year payback period`);
        }
        const notes = roi.notes as string[] | undefined;
        if (notes) {
          notes.forEach((n) => {
            if (n.includes("Excellent") || n.includes("Competitive") || n.includes("trending upward")) {
              factors.push(n);
            }
          });
        }
      }
    }

    // Solar
    if (solar.data) {
      const sold = solar.data as Record<string, unknown>;
      const rating = sold.suitabilityRating as string | undefined;
      if (rating === "Excellent" || rating === "Good") {
        strengths.push(`Solar potential: ${rating} — add solar panels for energy savings`);
      }
    }

    // Census / Demographics
    if (census.data) {
      const cd = census.data as Record<string, unknown>;
      const af = cd.aduFeasibility as Record<string, unknown> | undefined;
      if (af) {
        const score = af.aduMarketPotentialScore as number | undefined;
        if (score && score >= 70) {
          strengths.push(`High ADU market potential score (${score}/100)`);
        } else if (score && score >= 50) {
          factors.push(`Moderate ADU market potential (${score}/100)`);
        }
        const demand = af.housingDemandIndicator as string | undefined;
        if (demand === "High" || demand === "Very High") {
          strengths.push(`High housing demand in this area`);
        }
      }
    }

    // Infrastructure
    if (infrastructure.data) {
      const id = infrastructure.data as Record<string, unknown>;
      const td = id.tenantDesirability as Record<string, unknown> | undefined;
      if (td) {
        const score = td.score as number | undefined;
        if (score && score >= 70) {
          strengths.push(`High tenant desirability area (${score}/100)`);
        }
      }
      const ff = id.familyFriendliness as Record<string, unknown> | undefined;
      if (ff) {
        const score = ff.score as number | undefined;
        if (score && score >= 7) {
          strengths.push("Family-friendly neighborhood — attractive for ADU tenants");
        }
      }
    }

    // Determine overall assessment
    let overallAssessment: string;
    if (availableCount >= 10) overallAssessment = "Excellent — comprehensive data from all major sources";
    else if (availableCount >= 8) overallAssessment = "Very Good — most data sources available";
    else if (availableCount >= 6) overallAssessment = "Good — majority of data sources available";
    else if (availableCount >= 3) overallAssessment = "Fair — partial data available";
    else overallAssessment = "Limited — insufficient data for full assessment";

    const result = {
      city: city.trim(),
      apiVersion: "2.0",
      dataSources: 12,
      data: {
        weather: weather.data,
        cityInfo: cityInfo.data,
        geocode: geocode.data,
        elevation: elevation.data,
        seismic: seismic.data,
        airQuality: airQuality.data,
        transit: transit.data,
        housingData: housingData.data,
        solar: solar.data,
        infrastructure: infrastructure.data,
        census: census.data,
        climateHistory: climateHistory.data,
      },
      aduFeasibility: {
        overallAssessment,
        strengths,
        factors,
        warnings,
        sourceCount: availableCount,
        sourceTotal: 12,
      },
      dataCompleteness: Object.fromEntries(sources.map((s) => [s.key, s.available])),
      fetchedAt: new Date().toISOString(),
    };

    cityCompleteCache.set(cacheKey, { data: result, timestamp: now });
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[City Complete API Error]", message);
    return NextResponse.json(
      { error: "Failed to aggregate city data", details: message },
      { status: 502 }
    );
  }
}
