import { NextRequest, NextResponse } from "next/server";

/**
 * Built-in housing data for major California cities.
 *
 * Sources: US Census ACS 5-Year Estimates (2022), Zillow/Median data,
 * California HCD ADU permit statistics. Data is approximate and intended
 * for informational/feasibility analysis purposes only.
 *
 * All monetary values are in USD.
 */
interface CityHousingData {
  medianHomeValue: number;
  medianRent: number;
  medianHomeValuePerSqFt: number;
  population: number;
  households: number;
  /** Estimated annual ADU permits issued (based on HCD data patterns) */
  annualAduPermits: number;
  /** Year-over-year ADU permit trend */
  aduPermitTrend: "growing" | "stable" | "declining";
  /** Average ADU construction cost range (low, high) */
  aduConstructionCostRange: { low: number; high: number };
  /** Estimated monthly rental income for a typical ADU */
  estimatedAduMonthlyRent: number;
}

const HOUSING_DATA: Record<string, CityHousingData> = {
  "san jose": {
    medianHomeValue: 1_350_000,
    medianRent: 2_850,
    medianHomeValuePerSqFt: 750,
    population: 970_000,
    households: 328_000,
    annualAduPermits: 1240,
    aduPermitTrend: "growing",
    aduConstructionCostRange: { low: 250_000, high: 550_000 },
    estimatedAduMonthlyRent: 2_200,
  },
  "los angeles": {
    medianHomeValue: 950_000,
    medianRent: 2_650,
    medianHomeValuePerSqFt: 600,
    population: 3_898_000,
    households: 1_372_000,
    annualAduPermits: 5200,
    aduPermitTrend: "growing",
    aduConstructionCostRange: { low: 200_000, high: 500_000 },
    estimatedAduMonthlyRent: 2_000,
  },
  "san francisco": {
    medianHomeValue: 1_250_000,
    medianRent: 3_200,
    medianHomeValuePerSqFt: 950,
    population: 808_000,
    households: 362_000,
    annualAduPermits: 680,
    aduPermitTrend: "stable",
    aduConstructionCostRange: { low: 350_000, high: 700_000 },
    estimatedAduMonthlyRent: 2_800,
  },
  "san diego": {
    medianHomeValue: 890_000,
    medianRent: 2_750,
    medianHomeValuePerSqFt: 580,
    population: 1_386_000,
    households: 485_000,
    annualAduPermits: 1800,
    aduPermitTrend: "growing",
    aduConstructionCostRange: { low: 200_000, high: 480_000 },
    estimatedAduMonthlyRent: 2_100,
  },
  sacramento: {
    medianHomeValue: 485_000,
    medianRent: 1_800,
    medianHomeValuePerSqFt: 310,
    population: 524_000,
    households: 185_000,
    annualAduPermits: 920,
    aduPermitTrend: "growing",
    aduConstructionCostRange: { low: 150_000, high: 350_000 },
    estimatedAduMonthlyRent: 1_500,
  },
  oakland: {
    medianHomeValue: 780_000,
    medianRent: 2_400,
    medianHomeValuePerSqFt: 580,
    population: 420_000,
    households: 155_000,
    annualAduPermits: 540,
    aduPermitTrend: "growing",
    aduConstructionCostRange: { low: 225_000, high: 500_000 },
    estimatedAduMonthlyRent: 1_950,
  },
  fresno: {
    medianHomeValue: 385_000,
    medianRent: 1_450,
    medianHomeValuePerSqFt: 230,
    population: 542_000,
    households: 170_000,
    annualAduPermits: 380,
    aduPermitTrend: "growing",
    aduConstructionCostRange: { low: 130_000, high: 280_000 },
    estimatedAduMonthlyRent: 1_200,
  },
  "long beach": {
    medianHomeValue: 780_000,
    medianRent: 2_350,
    medianHomeValuePerSqFt: 520,
    population: 466_000,
    households: 165_000,
    annualAduPermits: 480,
    aduPermitTrend: "growing",
    aduConstructionCostRange: { low: 200_000, high: 450_000 },
    estimatedAduMonthlyRent: 1_900,
  },
  irvine: {
    medianHomeValue: 1_150_000,
    medianRent: 2_900,
    medianHomeValuePerSqFt: 620,
    population: 307_000,
    households: 100_000,
    annualAduPermits: 310,
    aduPermitTrend: "stable",
    aduConstructionCostRange: { low: 225_000, high: 500_000 },
    estimatedAduMonthlyRent: 2_200,
  },
  berkeley: {
    medianHomeValue: 1_250_000,
    medianRent: 2_950,
    medianHomeValuePerSqFt: 850,
    population: 124_000,
    households: 46_000,
    annualAduPermits: 180,
    aduPermitTrend: "stable",
    aduConstructionCostRange: { low: 280_000, high: 580_000 },
    estimatedAduMonthlyRent: 2_400,
  },
  "palo alto": {
    medianHomeValue: 3_200_000,
    medianRent: 3_500,
    medianHomeValuePerSqFt: 1400,
    population: 66_000,
    households: 26_000,
    annualAduPermits: 85,
    aduPermitTrend: "growing",
    aduConstructionCostRange: { low: 400_000, high: 800_000 },
    estimatedAduMonthlyRent: 2_800,
  },
  "santa clara": {
    medianHomeValue: 1_350_000,
    medianRent: 2_900,
    medianHomeValuePerSqFt: 780,
    population: 127_000,
    households: 44_000,
    annualAduPermits: 220,
    aduPermitTrend: "growing",
    aduConstructionCostRange: { low: 260_000, high: 550_000 },
    estimatedAduMonthlyRent: 2_300,
  },
  sunnyvale: {
    medianHomeValue: 1_600_000,
    medianRent: 3_000,
    medianHomeValuePerSqFt: 900,
    population: 155_000,
    households: 53_000,
    annualAduPermits: 190,
    aduPermitTrend: "growing",
    aduConstructionCostRange: { low: 275_000, high: 580_000 },
    estimatedAduMonthlyRent: 2_350,
  },
  cupertino: {
    medianHomeValue: 2_400_000,
    medianRent: 3_200,
    medianHomeValuePerSqFt: 1100,
    population: 57_000,
    households: 20_000,
    annualAduPermits: 75,
    aduPermitTrend: "stable",
    aduConstructionCostRange: { low: 350_000, high: 700_000 },
    estimatedAduMonthlyRent: 2_600,
  },
  "mountain view": {
    medianHomeValue: 1_850_000,
    medianRent: 3_100,
    medianHomeValuePerSqFt: 1050,
    population: 82_000,
    households: 32_000,
    annualAduPermits: 120,
    aduPermitTrend: "growing",
    aduConstructionCostRange: { low: 300_000, high: 650_000 },
    estimatedAduMonthlyRent: 2_500,
  },
  hayward: {
    medianHomeValue: 780_000,
    medianRent: 2_250,
    medianHomeValuePerSqFt: 500,
    population: 162_000,
    households: 46_000,
    annualAduPermits: 280,
    aduPermitTrend: "growing",
    aduConstructionCostRange: { low: 200_000, high: 430_000 },
    estimatedAduMonthlyRent: 1_800,
  },
  fremont: {
    medianHomeValue: 1_150_000,
    medianRent: 2_600,
    medianHomeValuePerSqFt: 650,
    population: 230_000,
    households: 74_000,
    annualAduPermits: 420,
    aduPermitTrend: "growing",
    aduConstructionCostRange: { low: 240_000, high: 520_000 },
    estimatedAduMonthlyRent: 2_050,
  },
  anaheim: {
    medianHomeValue: 820_000,
    medianRent: 2_300,
    medianHomeValuePerSqFt: 480,
    population: 348_000,
    households: 100_000,
    annualAduPermits: 560,
    aduPermitTrend: "growing",
    aduConstructionCostRange: { low: 180_000, high: 400_000 },
    estimatedAduMonthlyRent: 1_850,
  },
  "santa ana": {
    medianHomeValue: 750_000,
    medianRent: 2_100,
    medianHomeValuePerSqFt: 470,
    population: 331_000,
    households: 74_000,
    annualAduPermits: 350,
    aduPermitTrend: "growing",
    aduConstructionCostRange: { low: 175_000, high: 380_000 },
    estimatedAduMonthlyRent: 1_700,
  },
  pasadena: {
    medianHomeValue: 1_050_000,
    medianRent: 2_700,
    medianHomeValuePerSqFt: 620,
    population: 138_000,
    households: 54_000,
    annualAduPermits: 260,
    aduPermitTrend: "growing",
    aduConstructionCostRange: { low: 220_000, high: 480_000 },
    estimatedAduMonthlyRent: 2_100,
  },
};

/**
 * Calculate a simple ROI analysis for ADU construction.
 *
 * @param data - Housing data for the city
 * @returns ROI analysis with key financial metrics
 */
function calculateRoiAnalysis(data: CityHousingData): {
  annualRentalIncome: number;
  annualExpenses: number;
  annualNetIncome: number;
  simplePaybackYears: { low: number; high: number };
  capRate: number;
  monthlyCashFlow: number;
  notes: string[];
} {
  const annualRentalIncome = data.estimatedAduMonthlyRent * 12;
  // Estimate annual expenses at 35% of rental income (maintenance, insurance, property tax, vacancy)
  const annualExpenses = Math.round(annualRentalIncome * 0.35);
  const annualNetIncome = annualRentalIncome - annualExpenses;
  const monthlyCashFlow = Math.round(annualNetIncome / 12);

  // Simple payback period (ignoring appreciation, financing costs)
  const paybackLow =
    data.aduConstructionCostRange.low > 0
      ? Math.round(
          (data.aduConstructionCostRange.low / annualNetIncome) * 100
        ) / 100
      : 0;
  const paybackHigh =
    data.aduConstructionCostRange.high > 0
      ? Math.round(
          (data.aduConstructionCostRange.high / annualNetIncome) * 100
        ) / 100
      : 0;

  // Cap rate based on median construction cost
  const medianConstructionCost =
    (data.aduConstructionCostRange.low + data.aduConstructionCostRange.high) / 2;
  const capRate =
    medianConstructionCost > 0
      ? Math.round((annualNetIncome / medianConstructionCost) * 10000) / 100
      : 0;

  const notes: string[] = [];

  if (paybackLow <= 10) {
    notes.push(
      "Excellent payback period — ADU investment recouped in ~10 years or less"
    );
  } else if (paybackLow <= 15) {
    notes.push(
      "Good payback period — typical for California ADU investments"
    );
  } else if (paybackLow <= 20) {
    notes.push(
      "Moderate payback period — consider reducing construction costs"
    );
  } else {
    notes.push(
      "Long payback period — verify rental income assumptions and construction costs"
    );
  }

  if (data.estimatedAduMonthlyRent > data.medianRent * 0.8) {
    notes.push(
      "ADU rental income is competitive with market rates — strong demand indicator"
    );
  }

  if (data.aduPermitTrend === "growing") {
    notes.push(
      "ADU permits are trending upward — local government is ADU-friendly"
    );
  }

  if (data.medianHomeValuePerSqFt > 700) {
    notes.push(
      "High per-sq-ft value — even small ADUs can add significant property value"
    );
  }

  notes.push(
    "This analysis does not account for property value appreciation, financing costs, or tax benefits"
  );

  return {
    annualRentalIncome,
    annualExpenses,
    annualNetIncome,
    simplePaybackYears: { low: paybackLow, high: paybackHigh },
    capRate,
    monthlyCashFlow,
    notes,
  };
}

/**
 * GET /api/housing-data?city=San Jose
 *
 * Returns housing market data for a California city, including:
 * - Median home values and rent
 * - ADU permit trends
 * - Construction cost estimates
 * - ADU ROI analysis
 *
 * Data is sourced from built-in statistics (Census ACS 5-Year, Zillow, CA HCD patterns).
 * No external API key is required.
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

  const normalizedCity = city.trim().toLowerCase();
  const data = HOUSING_DATA[normalizedCity];

  if (!data) {
    return NextResponse.json(
      {
        error: `No housing data available for "${city}".`,
        availableCities: Object.keys(HOUSING_DATA).map(
          (c) => c.charAt(0).toUpperCase() + c.slice(1)
        ),
      },
      { status: 404 }
    );
  }

  const roiAnalysis = calculateRoiAnalysis(data);

  const result = {
    city: city.trim(),
    housingMarket: {
      medianHomeValue: data.medianHomeValue,
      medianRent: data.medianRent,
      medianHomeValuePerSqFt: data.medianHomeValuePerSqFt,
      population: data.population,
      households: data.households,
    },
    aduData: {
      annualPermits: data.annualAduPermits,
      permitTrend: data.aduPermitTrend,
      constructionCostRange: data.aduConstructionCostRange,
      estimatedMonthlyRent: data.estimatedAduMonthlyRent,
      permitsPerHousehold: Math.round(
        (data.annualAduPermits / data.households) * 10000
      ) / 10000,
    },
    roiAnalysis,
    dataSource: {
      description: "Built-in data from Census ACS, Zillow, and CA HCD patterns",
      caveat: "Values are approximate and for informational purposes only. Consult a local real estate professional for current market conditions.",
      lastUpdated: "2024",
    },
    fetchedAt: new Date().toISOString(),
  };

  return NextResponse.json(result);
}
