import { NextRequest, NextResponse } from "next/server";

/**
 * Built-in lookup table of California city coordinates.
 * Maps normalized city names to { latitude, longitude }.
 * Same comprehensive set used across BayForge API routes.
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
  "san bernardino": { lat: 34.1083, lon: -117.2898 },
  "santa barbara": { lat: 34.4208, lon: -119.6982 },
  "los gatos": { lat: 37.2388, lon: -121.9544 },
};

/**
 * California solar seasonal adjustment factors.
 * Applied to the measured daily average to estimate each month's output.
 * Summer months in California receive significantly more solar irradiance
 * due to longer days and clearer skies (marine layer burns off).
 */
const CA_SEASONAL_FACTORS: Record<number, number> = {
  1: 0.72, // January — short days, winter storms
  2: 0.78, // February
  3: 0.88, // March
  4: 0.95, // April
  5: 1.06, // May
  6: 1.16, // June — peak month
  7: 1.18, // July — peak month
  8: 1.12, // August
  9: 1.03, // September
  10: 0.92, // October
  11: 0.78, // November
  12: 0.68, // December — shortest days
};

/** Days in each month (non-leap year — close enough for solar estimates) */
const DAYS_IN_MONTH: Record<number, number> = {
  1: 31, 2: 28, 3: 31, 4: 30, 5: 31, 6: 30,
  7: 31, 8: 31, 9: 30, 10: 31, 11: 30, 12: 31,
};

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/** Simple in-memory rate limiter: tracks timestamps per IP */
const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 30;

/**
 * In-memory cache for solar results.
 * Key: normalized city name → { data, timestamp }
 */
const solarCache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

/**
 * ADU solar panel system assumptions.
 * Based on typical California residential solar installations.
 */
const ADU_ROOF_AREA_SQFT = 500;
const SQFT_TO_SQM = 0.092903;
const USABLE_ROOF_FRACTION = 0.70; // ~70% of roof is usable (obstructions, setbacks, fire code)
const PANEL_AREA_SQM = 1.72; // Standard residential panel ~65" × 39"
const PANEL_WATTAGE = 350; // Typical premium residential panel in 2024
const PERFORMANCE_RATIO = 0.75; // System losses: inverter (~5%), wiring (~2%), soiling (~3%), shading (~5%), mismatch (~2%), thermal (~5%), age (~3%)
const INSTALL_COST_PER_WATT = 3.50; // Average California residential solar installation cost ($/W) in 2024
const CA_AVG_ELECTRICITY_RATE = 0.28; // California average residential rate ($/kWh) — tiered rates often higher
const PANEL_LIFESPAN_YEARS = 25;

/**
 * Calculate solar energy metrics from hourly Open-Meteo radiation data.
 *
 * Returns daily averages, monthly estimates, annual yield,
 * ADU ROI calculations, and a solar suitability rating.
 */
function calculateSolarMetrics(hourly: {
  time: string[];
  shortwave_radiation: number[];
  direct_radiation: number[];
  diffuse_radiation: number[];
}) {
  const { time, shortwave_radiation, direct_radiation, diffuse_radiation } = hourly;

  // Group hourly data by calendar date (YYYY-MM-DD)
  const dailyData = new Map<
    string,
    {
      totalShortwave: number;
      totalDirect: number;
      totalDiffuse: number;
      peakShortwave: number;
      peakDirect: number;
      peakDiffuse: number;
      hours: number;
    }
  >();

  for (let i = 0; i < time.length; i++) {
    const dateStr = time[i].slice(0, 10); // "YYYY-MM-DD"
    const sw = shortwave_radiation[i] ?? 0;
    const dr = direct_radiation[i] ?? 0;
    const df = diffuse_radiation[i] ?? 0;

    const existing = dailyData.get(dateStr) ?? {
      totalShortwave: 0,
      totalDirect: 0,
      totalDiffuse: 0,
      peakShortwave: 0,
      peakDirect: 0,
      peakDiffuse: 0,
      hours: 0,
    };

    existing.totalShortwave += sw;
    existing.totalDirect += dr;
    existing.totalDiffuse += df;
    existing.peakShortwave = Math.max(existing.peakShortwave, sw);
    existing.peakDirect = Math.max(existing.peakDirect, dr);
    existing.peakDiffuse = Math.max(existing.peakDiffuse, df);
    existing.hours += 1;

    dailyData.set(dateStr, existing);
  }

  // Calculate daily Peak Sun Hours (PSH) for each day
  // PSH = total daily shortwave radiation (Wh/m²) / 1000 = kWh/m²
  const dailyPSH: { date: string; psh: number; directKwh: number; diffuseKwh: number }[] = [];

  for (const [date, data] of dailyData) {
    const psh = data.totalShortwave / 1000;
    dailyPSH.push({
      date,
      psh: Math.round(psh * 100) / 100,
      directKwh: Math.round((data.totalDirect / 1000) * 100) / 100,
      diffuseKwh: Math.round((data.totalDiffuse / 1000) * 100) / 100,
    });
  }

  // Average daily PSH across all measured days
  const totalDays = dailyPSH.length;
  const avgDailyPSH =
    dailyPSH.reduce((sum, d) => sum + d.psh, 0) / Math.max(totalDays, 1);

  // Average peak radiation values (for context)
  let avgPeakSW = 0;
  let avgPeakDirect = 0;
  for (const data of dailyData.values()) {
    avgPeakSW += data.peakShortwave;
    avgPeakDirect += data.peakDirect;
  }
  avgPeakSW = Math.round((avgPeakSW / totalDays) * 10) / 10;
  avgPeakDirect = Math.round((avgPeakDirect / totalDays) * 10) / 10;

  // Average direct vs diffuse ratio
  const avgDirectKwh =
    dailyPSH.reduce((sum, d) => sum + d.directKwh, 0) / totalDays;
  const avgDiffuseKwh =
    dailyPSH.reduce((sum, d) => sum + d.diffuseKwh, 0) / totalDays;
  const directFraction = Math.round((avgDirectKwh / Math.max(avgDailyPSH, 0.01)) * 100);

  // Monthly estimates using seasonal adjustment factors
  const monthlyEstimates = MONTH_NAMES.map((name, idx) => {
    const month = idx + 1;
    const factor = CA_SEASONAL_FACTORS[month];
    const monthPSH = avgDailyPSH * factor;
    const days = DAYS_IN_MONTH[month];
    const potential = monthPSH * days;

    return {
      month: name,
      monthNumber: month,
      days,
      avgPeakSunHours: Math.round(monthPSH * 100) / 100,
      solarPotential_kWhm2: Math.round(potential * 10) / 10,
      seasonalFactor: factor,
    };
  });

  // Annual totals
  const annualSolarPotential = monthlyEstimates.reduce(
    (sum, m) => sum + m.solarPotential_kWhm2,
    0
  );
  const annualAvgPSH =
    monthlyEstimates.reduce((sum, m) => sum + m.avgPeakSunHours, 0) / 12;
  const sunniestMonth = monthlyEstimates.reduce((best, m) =>
    m.avgPeakSunHours > best.avgPeakSunHours ? m : best
  );
  const leastSunnyMonth = monthlyEstimates.reduce((worst, m) =>
    m.avgPeakSunHours < worst.avgPeakSunHours ? m : worst
  );

  // ADU solar ROI calculations
  const roofAreaM2 = ADU_ROOF_AREA_SQFT * SQFT_TO_SQM;
  const usableRoofM2 = roofAreaM2 * USABLE_ROOF_FRACTION;
  const recommendedPanels = Math.floor(usableRoofM2 / PANEL_AREA_SQM);
  const systemCapacityKW = (recommendedPanels * PANEL_WATTAGE) / 1000;
  const annualProductionKWh =
    systemCapacityKW * annualAvgPSH * 365 * PERFORMANCE_RATIO;
  const systemCost = systemCapacityKW * 1000 * INSTALL_COST_PER_WATT;
  const annualSavings = annualProductionKWh * CA_AVG_ELECTRICITY_RATE;
  const breakEvenYears = systemCost / Math.max(annualSavings, 0.01);
  const twentyYearNetSavings = annualSavings * PANEL_LIFESPAN_YEARS - systemCost;
  const lifetimeCO2Avoided =
    (annualProductionKWh * PANEL_LIFESPAN_YEARS * 0.000265) / 1000; // CA grid: ~0.265 kg CO2/kWh → tonnes

  // Solar suitability rating
  let rating: string;
  let score: number;

  if (annualAvgPSH >= 5.5) {
    rating = "Excellent";
    score = Math.min(100, Math.round(85 + (annualAvgPSH - 5.5) * 10));
  } else if (annualAvgPSH >= 5.0) {
    rating = "Excellent";
    score = Math.round(80 + (annualAvgPSH - 5.0) * 10);
  } else if (annualAvgPSH >= 4.5) {
    rating = "Good";
    score = Math.round(65 + (annualAvgPSH - 4.5) * 30);
  } else if (annualAvgPSH >= 4.0) {
    rating = "Good";
    score = Math.round(55 + (annualAvgPSH - 4.0) * 20);
  } else if (annualAvgPSH >= 3.5) {
    rating = "Fair";
    score = Math.round(40 + (annualAvgPSH - 3.5) * 30);
  } else if (annualAvgPSH >= 3.0) {
    rating = "Poor";
    score = Math.round(25 + (annualAvgPSH - 3.0) * 30);
  } else {
    rating = "Poor";
    score = Math.max(0, Math.round(annualAvgPSH * 10));
  }

  score = Math.max(0, Math.min(100, score));

  // Build contextual recommendations
  const recommendations: string[] = [];

  if (rating === "Excellent") {
    recommendations.push(
      "Outstanding solar resource — one of the best locations in the U.S. for rooftop solar"
    );
  } else if (rating === "Good") {
    recommendations.push(
      "Strong solar resource — rooftop solar is highly viable for ADU construction"
    );
  } else if (rating === "Fair") {
    recommendations.push(
      "Moderate solar resource — solar panels can still provide meaningful energy offset"
    );
  } else {
    recommendations.push(
      "Limited solar resource — consider whether solar investment meets your payback goals"
    );
  }

  if (directFraction >= 70) {
    recommendations.push(
      `${directFraction}% direct radiation — excellent for standard panel installations with low tilt angles`
    );
  } else if (directFraction >= 55) {
    recommendations.push(
      `${directFraction}% direct radiation — good mix of direct and diffuse light; panels perform well year-round`
    );
  } else {
    recommendations.push(
      `${directFraction}% direct radiation — significant diffuse component; consider bifacial panels to capture reflected light`
    );
  }

  if (breakEvenYears <= 6) {
    recommendations.push(
      `Strong ROI with ${breakEvenYears.toFixed(1)}-year payback — well below the panel warranty period of 25 years`
    );
  } else if (breakEvenYears <= 9) {
    recommendations.push(
      `Solid ${breakEvenYears.toFixed(1)}-year payback period — competitive with California averages`
    );
  } else {
    recommendations.push(
      `Payback of ${breakEvenYears.toFixed(1)} years — consider available incentives (ITC, SGIP) to improve economics`
    );
  }

  if (annualAvgPSH >= 5.0) {
    recommendations.push(
      "Under California's Title 24 solar mandate, new ADU construction over 500 sq ft requires a solar PV system"
    );
  }

  recommendations.push(
    "Under NEM 3.0 (2023+), prioritize self-consumption with battery storage to maximize solar savings"
  );

  // California regulatory context
  const californiaContext = {
    solarMandate:
      "Since January 1, 2020, the California Building Standards Commission requires solar photovoltaic systems on most new residential construction, including additions that increase conditioned floor area. This mandate is part of the 2019 Building Energy Efficiency Standards (Title 24, Part 6).",
    title24Requirements:
      "Title 24 sets minimum solar system sizes based on the home's floor area, climate zone, and compliance approach. Builders may opt for a smaller solar system paired with additional energy efficiency measures or battery storage to meet compliance. For ADUs, the requirement typically applies to units larger than 500 sq ft of conditioned floor area.",
    aduExemption:
      "ADUs up to 500 sq ft of conditioned floor area are generally exempt from the Title 24 solar mandate. However, many California utilities and municipalities offer incentives that make solar financially attractive even for smaller ADUs. The federal Investment Tax Credit (ITC) of 30% applies to qualifying residential solar installations regardless of size.",
    nem3Impact:
      "California's NEM 3.0 (Net Energy Metering), effective April 2023, significantly reduced the compensation rate for solar energy exported to the grid. Under NEM 3.0, exported energy is valued at 'Avoided Cost' rates (~$0.05–0.08/kWh), compared to retail rates (~$0.28/kWh). This makes battery storage and maximizing self-consumption much more important for solar ROI.",
    incentives: [
      "Federal Investment Tax Credit (ITC): 30% of installation costs through 2032",
      "California SGIP (Self-Generation Incentive Program): Battery storage rebates",
      "Property tax exclusion: Solar systems do not increase assessed property value",
      "Local utility rebates: Check PG&E, SCE, or SDG&E for additional programs",
    ],
  };

  return {
    currentPeriod: {
      dateRange: `${dailyPSH[0]?.date ?? "N/A"} to ${dailyPSH[dailyPSH.length - 1]?.date ?? "N/A"}`,
      daysMeasured: totalDays,
      dataPoints: time.length,
      avgDailyPeakSunHours: Math.round(avgDailyPSH * 100) / 100,
      avgDailyShortwave_kWhm2: Math.round(avgDailyPSH * 100) / 100,
      avgDailyDirect_kWhm2: Math.round(avgDirectKwh * 100) / 100,
      avgDailyDiffuse_kWhm2: Math.round(avgDiffuseKwh * 100) / 100,
      directRadiationPct: directFraction,
      avgPeakRadiation_Wm2: avgPeakSW,
      avgPeakDirectRadiation_Wm2: avgPeakDirect,
    },
    dailyBreakdown: dailyPSH,
    monthlyEstimates,
    annualEstimate: {
      totalSolarPotential_kWhm2: Math.round(annualSolarPotential * 10) / 10,
      avgPeakSunHoursPerDay: Math.round(annualAvgPSH * 100) / 100,
      sunniestMonth: sunniestMonth.month,
      sunniestMonthPSH: sunniestMonth.avgPeakSunHours,
      leastSunnyMonth: leastSunnyMonth.month,
      leastSunnyMonthPSH: leastSunnyMonth.avgPeakSunHours,
      seasonalVariationPct: Math.round(
        ((sunniestMonth.avgPeakSunHours - leastSunnyMonth.avgPeakSunHours) /
          leastSunnyMonth.avgPeakSunHours) *
          100
      ),
    },
    aduSolarROI: {
      aduRoofSize_sqft: ADU_ROOF_AREA_SQFT,
      totalRoofArea_m2: Math.round(roofAreaM2 * 10) / 10,
      usableRoofArea_m2: Math.round(usableRoofM2 * 10) / 10,
      recommendedPanels,
      panelWattage_W: PANEL_WATTAGE,
      systemCapacity_kW: Math.round(systemCapacityKW * 100) / 100,
      annualProduction_kWh: Math.round(annualProductionKWh),
      performanceRatio: PERFORMANCE_RATIO,
      systemCost_usd: Math.round(systemCost),
      costPerWatt_usd: INSTALL_COST_PER_WATT,
      annualSavings_usd: Math.round(annualSavings),
      electricityRate_kWh_usd: CA_AVG_ELECTRICITY_RATE,
      breakEvenYears: Math.round(breakEvenYears * 10) / 10,
      twentyYearNetSavings_usd: Math.round(twentyYearNetSavings),
      lifetimeCO2Avoided_tonnes: Math.round(lifetimeCO2Avoided * 100) / 100,
      panelLifespan_years: PANEL_LIFESPAN_YEARS,
      federalITC_savings: Math.round(systemCost * 0.3),
      netCostAfterITC: Math.round(systemCost * 0.7),
      breakEvenAfterITC_years:
        Math.round((systemCost * 0.7) / Math.max(annualSavings, 0.01) * 10) / 10,
    },
    solarSuitability: {
      rating,
      score,
      avgPeakSunHours: Math.round(annualAvgPSH * 100) / 100,
      recommendations,
    },
    californiaContext,
  };
}

/**
 * GET /api/solar?city=San Jose
 *
 * Returns comprehensive solar energy potential data for ADU construction
 * projects in California cities. Uses the free Open-Meteo Solar Radiation API
 * — no API key required.
 *
 * Provides:
 * - Peak solar hours per day
 * - Monthly & annual solar potential estimates
 * - ADU solar panel ROI analysis (500 sq ft roof)
 * - Solar suitability rating
 * - Recommended panel capacity & annual savings
 * - California-specific regulatory context (Title 24, NEM 3.0)
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
  const cached = solarCache.get(cacheKey);
  if (cached && now - cached.timestamp < CACHE_TTL_MS) {
    return NextResponse.json({
      ...(cached.data as Record<string, unknown>),
      _cached: true,
      _cacheAge: Math.round((now - cached.timestamp) / 1000),
    });
  }

  // Build Open-Meteo URL — use past data for actual measured radiation values
  const openMeteoUrl = new URL("https://api.open-meteo.com/v1/forecast");
  openMeteoUrl.searchParams.set("latitude", coords.lat.toString());
  openMeteoUrl.searchParams.set("longitude", coords.lon.toString());
  openMeteoUrl.searchParams.set(
    "hourly",
    "shortwave_radiation,direct_radiation,diffuse_radiation"
  );
  openMeteoUrl.searchParams.set("past_days", "16");
  openMeteoUrl.searchParams.set("forecast_days", "0");
  openMeteoUrl.searchParams.set("timezone", "America/Los_Angeles");

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

    if (!data.hourly || !data.hourly.time || data.hourly.time.length === 0) {
      throw new Error("No hourly solar radiation data returned from API");
    }

    // Calculate all solar metrics
    const metrics = calculateSolarMetrics({
      time: data.hourly.time,
      shortwave_radiation: data.hourly.shortwave_radiation,
      direct_radiation: data.hourly.direct_radiation,
      diffuse_radiation: data.hourly.diffuse_radiation,
    });

    const result = {
      city: city.trim(),
      coordinates: coords,
      ...metrics,
      dataSource: "Open-Meteo Solar Radiation API (open-meteo.com)",
      methodology: {
        description:
          "Solar potential is estimated from 16 days of actual measured hourly radiation data, extrapolated using California-specific seasonal adjustment factors. ADU ROI calculations assume a typical 500 sq ft roof with standard residential solar panels.",
        dataPeriodDays: 16,
        seasonalAdjustment: "California-specific monthly factors applied to measured daily average",
        panelAssumptions: `${PANEL_WATTAGE}W panels, ${PANEL_AREA_SQM} m² each, ${PERFORMANCE_RATIO} performance ratio`,
      },
      fetchedAt: new Date().toISOString(),
    };

    // Cache the result
    solarCache.set(cacheKey, { data: result, timestamp: now });

    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error";
    console.error("[Solar API Error]", message);

    return NextResponse.json(
      {
        error: "Failed to fetch solar radiation data",
        details: message,
      },
      { status: 502 }
    );
  }
}
