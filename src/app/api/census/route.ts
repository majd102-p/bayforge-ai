import { NextRequest, NextResponse } from "next/server";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CensusRawData {
  population: number;
  malePopulation: number;
  femalePopulation: number;
  ownerOccupied: number;
  renterOccupied: number;
  housingUnits: number;
  medianHomeValue: number;
  medianRent: number;
  medianIncome: number;
  yearBuilt: {
    before1940: number;
    "1940to1959": number;
    "1960to1969": number;
    "1970to1979": number;
    "1980to1989": number;
    "1990to1999": number;
    "2000to2009": number;
    "2010to2022": number;
  };
}

interface CityFallback {
  population: number;
  malePopulation: number;
  femalePopulation: number;
  ownerOccupied: number;
  renterOccupied: number;
  housingUnits: number;
  medianHomeValue: number;
  medianRent: number;
  medianIncome: number;
  yearBuilt: {
    before1940: number;
    "1940to1959": number;
    "1960to1969": number;
    "1970to1979": number;
    "1980to1989": number;
    "1990to1999": number;
    "2000to2009": number;
    "2010to2022": number;
  };
  landAreaSqMi: number;
}

// ---------------------------------------------------------------------------
// In-memory cache  (1 hour TTL — Census data rarely changes)
// ---------------------------------------------------------------------------

const censusCache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

// ---------------------------------------------------------------------------
// Rate limiter — 20 requests / min per IP
// ---------------------------------------------------------------------------

const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 20;

// ---------------------------------------------------------------------------
// Built-in fallback data for 25 California cities
// Sources: US Census ACS 5-Year Estimates (2022), approximate values.
// ---------------------------------------------------------------------------

const FALLBACK_DATA: Record<string, CityFallback> = {
  "san jose": {
    population: 970_239,
    malePopulation: 493_402,
    femalePopulation: 476_837,
    ownerOccupied: 195_800,
    renterOccupied: 132_200,
    housingUnits: 337_100,
    medianHomeValue: 1_350_000,
    medianRent: 2_850,
    medianIncome: 139_200,
    yearBuilt: {
      before1940: 8200,
      "1940to1959": 18400,
      "1960to1969": 52300,
      "1970to1979": 68500,
      "1980to1989": 53100,
      "1990to1999": 49200,
      "2000to2009": 51800,
      "2010to2022": 35600,
    },
    landAreaSqMi: 180.7,
  },
  "los angeles": {
    population: 3_898_747,
    malePopulation: 1_937_100,
    femalePopulation: 1_961_647,
    ownerOccupied: 726_000,
    renterOccupied: 646_000,
    housingUnits: 1_470_200,
    medianHomeValue: 950_000,
    medianRent: 2_650,
    medianIncome: 76_500,
    yearBuilt: {
      before1940: 196_200,
      "1940to1959": 178_500,
      "1960to1969": 327_800,
      "1970to1979": 263_400,
      "1980to1989": 195_100,
      "1990to1999": 127_200,
      "2000to2009": 112_000,
      "2010to2022": 70_000,
    },
    landAreaSqMi: 468.7,
  },
  "san francisco": {
    population: 808_437,
    malePopulation: 412_300,
    femalePopulation: 396_137,
    ownerOccupied: 197_000,
    renterOccupied: 165_000,
    housingUnits: 384_500,
    medianHomeValue: 1_250_000,
    medianRent: 3_200,
    medianIncome: 136_800,
    yearBuilt: {
      before1940: 102_300,
      "1940to1959": 52100,
      "1960to1969": 42800,
      "1970to1979": 43500,
      "1980to1989": 38200,
      "1990to1999": 28100,
      "2000to2009": 40200,
      "2010to2022": 37300,
    },
    landAreaSqMi: 46.7,
  },
  "san diego": {
    population: 1_386_932,
    malePopulation: 697_800,
    femalePopulation: 689_132,
    ownerOccupied: 285_000,
    renterOccupied: 200_000,
    housingUnits: 530_100,
    medianHomeValue: 890_000,
    medianRent: 2_750,
    medianIncome: 96_500,
    yearBuilt: {
      before1940: 14_800,
      "1940to1959": 37_200,
      "1960to1969": 78_500,
      "1970to1979": 97_300,
      "1980to1989": 85_600,
      "1990to1999": 71_200,
      "2000to2009": 84_500,
      "2010to2022": 61_000,
    },
    landAreaSqMi: 325.9,
  },
  sacramento: {
    population: 524_943,
    malePopulation: 258_400,
    femalePopulation: 266_543,
    ownerOccupied: 108_000,
    renterOccupied: 77_000,
    housingUnits: 204_300,
    medianHomeValue: 485_000,
    medianRent: 1_800,
    medianIncome: 72_300,
    yearBuilt: {
      before1940: 10_600,
      "1940to1959": 14_200,
      "1960to1969": 25_800,
      "1970to1979": 43_500,
      "1980to1989": 33_600,
      "1990to1999": 29_100,
      "2000to2009": 30_400,
      "2010to2022": 17_100,
    },
    landAreaSqMi: 99.2,
  },
  oakland: {
    population: 420_005,
    malePopulation: 206_100,
    femalePopulation: 213_905,
    ownerOccupied: 83_000,
    renterOccupied: 72_000,
    housingUnits: 172_400,
    medianHomeValue: 780_000,
    medianRent: 2_400,
    medianIncome: 89_400,
    yearBuilt: {
      before1940: 34_200,
      "1940to1959": 17_300,
      "1960to1969": 18_900,
      "1970to1979": 22_100,
      "1980to1989": 17_500,
      "1990to1999": 16_800,
      "2000to2009": 27_600,
      "2010to2022": 18_000,
    },
    landAreaSqMi: 55.9,
  },
  fresno: {
    population: 542_107,
    malePopulation: 270_200,
    femalePopulation: 271_907,
    ownerOccupied: 101_000,
    renterOccupied: 69_000,
    housingUnits: 180_100,
    medianHomeValue: 385_000,
    medianRent: 1_450,
    medianIncome: 62_800,
    yearBuilt: {
      before1940: 5_800,
      "1940to1959": 9_400,
      "1960to1969": 21_300,
      "1970to1979": 37_200,
      "1980to1989": 33_500,
      "1990to1999": 28_600,
      "2000to2009": 26_200,
      "2010to2022": 18_100,
    },
    landAreaSqMi: 114.0,
  },
  "long beach": {
    population: 466_742,
    malePopulation: 229_800,
    femalePopulation: 236_942,
    ownerOccupied: 91_000,
    renterOccupied: 74_000,
    housingUnits: 176_500,
    medianHomeValue: 780_000,
    medianRent: 2_350,
    medianIncome: 81_200,
    yearBuilt: {
      before1940: 12_100,
      "1940to1959": 14_800,
      "1960to1969": 25_300,
      "1970to1979": 31_600,
      "1980to1989": 24_200,
      "1990to1999": 21_500,
      "2000to2009": 29_800,
      "2010to2022": 17_200,
    },
    landAreaSqMi: 50.3,
  },
  irvine: {
    population: 307_670,
    malePopulation: 153_100,
    femalePopulation: 154_570,
    ownerOccupied: 60_000,
    renterOccupied: 40_000,
    housingUnits: 110_200,
    medianHomeValue: 1_150_000,
    medianRent: 2_900,
    medianIncome: 129_500,
    yearBuilt: {
      before1940: 200,
      "1940to1959": 300,
      "1960to1969": 1_800,
      "1970to1979": 6_900,
      "1980to1989": 15_400,
      "1990to1999": 21_800,
      "2000to2009": 34_600,
      "2010to2022": 29_200,
    },
    landAreaSqMi: 66.1,
  },
  berkeley: {
    population: 124_321,
    malePopulation: 61_800,
    femalePopulation: 62_521,
    ownerOccupied: 23_000,
    renterOccupied: 23_000,
    housingUnits: 49_800,
    medianHomeValue: 1_250_000,
    medianRent: 2_950,
    medianIncome: 96_700,
    yearBuilt: {
      before1940: 9_800,
      "1940to1959": 5_400,
      "1960to1969": 5_600,
      "1970to1979": 4_800,
      "1980to1989": 3_500,
      "1990to1999": 3_400,
      "2000to2009": 6_200,
      "2010to2022": 11_100,
    },
    landAreaSqMi: 10.5,
  },
  "palo alto": {
    population: 66_573,
    malePopulation: 33_800,
    femalePopulation: 32_773,
    ownerOccupied: 14_000,
    renterOccupied: 12_000,
    housingUnits: 27_800,
    medianHomeValue: 3_200_000,
    medianRent: 3_500,
    medianIncome: 194_800,
    yearBuilt: {
      before1940: 2_200,
      "1940to1959": 4_800,
      "1960to1969": 3_900,
      "1970to1979": 2_500,
      "1980to1989": 2_100,
      "1990to1999": 2_600,
      "2000to2009": 4_900,
      "2010to2022": 4_800,
    },
    landAreaSqMi: 24.0,
  },
  "santa clara": {
    population: 127_647,
    malePopulation: 64_200,
    femalePopulation: 63_447,
    ownerOccupied: 25_000,
    renterOccupied: 19_000,
    housingUnits: 47_300,
    medianHomeValue: 1_350_000,
    medianRent: 2_900,
    medianIncome: 158_300,
    yearBuilt: {
      before1940: 1_200,
      "1940to1959": 2_800,
      "1960to1969": 4_600,
      "1970to1979": 7_200,
      "1980to1989": 7_100,
      "1990to1999": 6_500,
      "2000to2009": 9_500,
      "2010to2022": 8_400,
    },
    landAreaSqMi: 18.3,
  },
  sunnyvale: {
    population: 155_295,
    malePopulation: 79_400,
    femalePopulation: 75_895,
    ownerOccupied: 29_000,
    renterOccupied: 24_000,
    housingUnits: 57_100,
    medianHomeValue: 1_600_000,
    medianRent: 3_000,
    medianIncome: 165_200,
    yearBuilt: {
      before1940: 700,
      "1940to1959": 2_100,
      "1960to1969": 4_300,
      "1970to1979": 8_100,
      "1980to1989": 9_200,
      "1990to1999": 9_100,
      "2000to2009": 12_300,
      "2010to2022": 11_300,
    },
    landAreaSqMi: 22.0,
  },
  cupertino: {
    population: 57_388,
    malePopulation: 28_900,
    femalePopulation: 28_488,
    ownerOccupied: 13_000,
    renterOccupied: 7_000,
    housingUnits: 21_200,
    medianHomeValue: 2_400_000,
    medianRent: 3_200,
    medianIncome: 187_600,
    yearBuilt: {
      before1940: 300,
      "1940to1959": 1_200,
      "1960to1969": 2_400,
      "1970to1979": 4_100,
      "1980to1989": 3_500,
      "1990to1999": 3_200,
      "2000to2009": 3_500,
      "2010to2022": 3_000,
    },
    landAreaSqMi: 11.3,
  },
  "mountain view": {
    population: 82_376,
    malePopulation: 42_300,
    femalePopulation: 40_076,
    ownerOccupied: 14_000,
    renterOccupied: 18_000,
    housingUnits: 34_200,
    medianHomeValue: 1_850_000,
    medianRent: 3_100,
    medianIncome: 165_400,
    yearBuilt: {
      before1940: 400,
      "1940to1959": 1_600,
      "1960to1969": 2_800,
      "1970to1979": 5_100,
      "1980to1989": 5_400,
      "1990to1999": 5_200,
      "2000to2009": 7_300,
      "2010to2022": 7_400,
    },
    landAreaSqMi: 12.0,
  },
  hayward: {
    population: 162_694,
    malePopulation: 81_400,
    femalePopulation: 81_294,
    ownerOccupied: 30_000,
    renterOccupied: 16_000,
    housingUnits: 49_800,
    medianHomeValue: 780_000,
    medianRent: 2_250,
    medianIncome: 98_700,
    yearBuilt: {
      before1940: 2_400,
      "1940to1959": 3_600,
      "1960to1969": 6_800,
      "1970to1979": 10_200,
      "1980to1989": 7_600,
      "1990to1999": 5_800,
      "2000to2009": 7_100,
      "2010to2022": 6_300,
    },
    landAreaSqMi: 45.5,
  },
  fremont: {
    population: 230_504,
    malePopulation: 115_800,
    femalePopulation: 114_704,
    ownerOccupied: 49_000,
    renterOccupied: 25_000,
    housingUnits: 79_200,
    medianHomeValue: 1_150_000,
    medianRent: 2_600,
    medianIncome: 158_700,
    yearBuilt: {
      before1940: 900,
      "1940to1959": 3_100,
      "1960to1969": 7_500,
      "1970to1979": 13_200,
      "1980to1989": 12_100,
      "1990to1999": 12_400,
      "2000to2009": 17_600,
      "2010to2022": 13_400,
    },
    landAreaSqMi: 77.5,
  },
  anaheim: {
    population: 348_408,
    malePopulation: 174_200,
    femalePopulation: 174_208,
    ownerOccupied: 62_000,
    renterOccupied: 38_000,
    housingUnits: 107_800,
    medianHomeValue: 820_000,
    medianRent: 2_300,
    medianIncome: 92_400,
    yearBuilt: {
      before1940: 1_600,
      "1940to1959": 4_200,
      "1960to1969": 14_800,
      "1970to1979": 25_600,
      "1980to1989": 20_100,
      "1990to1999": 15_800,
      "2000to2009": 15_300,
      "2010to2022": 10_400,
    },
    landAreaSqMi: 50.0,
  },
  "santa ana": {
    population: 331_365,
    malePopulation: 167_200,
    femalePopulation: 164_165,
    ownerOccupied: 42_000,
    renterOccupied: 32_000,
    housingUnits: 79_600,
    medianHomeValue: 750_000,
    medianRent: 2_100,
    medianIncome: 76_800,
    yearBuilt: {
      before1940: 3_200,
      "1940to1959": 6_100,
      "1960to1969": 14_300,
      "1970to1979": 19_800,
      "1980to1989": 13_500,
      "1990to1999": 10_200,
      "2000to2009": 8_200,
      "2010to2022": 4_300,
    },
    landAreaSqMi: 27.3,
  },
  pasadena: {
    population: 138_699,
    malePopulation: 67_500,
    femalePopulation: 71_199,
    ownerOccupied: 26_000,
    renterOccupied: 28_000,
    housingUnits: 59_100,
    medianHomeValue: 1_050_000,
    medianRent: 2_700,
    medianIncome: 99_300,
    yearBuilt: {
      before1940: 14_500,
      "1940to1959": 7_200,
      "1960to1969": 6_400,
      "1970to1979": 6_100,
      "1980to1989": 4_500,
      "1990to1999": 4_200,
      "2000to2009": 6_300,
      "2010to2022": 9_900,
    },
    landAreaSqMi: 23.0,
  },
  "san mateo": {
    population: 105_661,
    malePopulation: 52_400,
    femalePopulation: 53_261,
    ownerOccupied: 20_000,
    renterOccupied: 18_000,
    housingUnits: 40_600,
    medianHomeValue: 1_400_000,
    medianRent: 2_950,
    medianIncome: 162_100,
    yearBuilt: {
      before1940: 3_600,
      "1940to1959": 5_200,
      "1960to1969": 4_800,
      "1970to1979": 4_500,
      "1980to1989": 4_200,
      "1990to1999": 3_800,
      "2000to2009": 7_200,
      "2010to2022": 7_300,
    },
    landAreaSqMi: 12.1,
  },
  stockton: {
    population: 322_120,
    malePopulation: 160_400,
    femalePopulation: 161_720,
    ownerOccupied: 62_000,
    renterOccupied: 45_000,
    housingUnits: 113_800,
    medianHomeValue: 450_000,
    medianRent: 1_500,
    medianIncome: 68_500,
    yearBuilt: {
      before1940: 4_200,
      "1940to1959": 7_600,
      "1960to1969": 14_300,
      "1970to1979": 22_100,
      "1980to1989": 18_200,
      "1990to1999": 14_800,
      "2000to2009": 20_100,
      "2010to2022": 12_500,
    },
    landAreaSqMi: 61.7,
  },
  riverside: {
    population: 331_360,
    malePopulation: 163_800,
    femalePopulation: 167_560,
    ownerOccupied: 62_000,
    renterOccupied: 38_000,
    housingUnits: 105_400,
    medianHomeValue: 560_000,
    medianRent: 2_000,
    medianIncome: 82_100,
    yearBuilt: {
      before1940: 2_100,
      "1940to1959": 3_800,
      "1960to1969": 8_200,
      "1970to1979": 17_500,
      "1980to1989": 22_300,
      "1990to1999": 19_800,
      "2000to2009": 19_600,
      "2010to2022": 12_100,
    },
    landAreaSqMi: 81.4,
  },
  bakersfield: {
    population: 408_310,
    malePopulation: 205_400,
    femalePopulation: 202_910,
    ownerOccupied: 74_000,
    renterOccupied: 42_000,
    housingUnits: 123_200,
    medianHomeValue: 380_000,
    medianRent: 1_400,
    medianIncome: 71_600,
    yearBuilt: {
      before1940: 3_100,
      "1940to1959": 6_400,
      "1960to1969": 12_800,
      "1970to1979": 23_500,
      "1980to1989": 24_300,
      "1990to1999": 19_600,
      "2000to2009": 20_800,
      "2010to2022": 12_700,
    },
    landAreaSqMi: 142.8,
  },
  modesto: {
    population: 218_464,
    malePopulation: 108_900,
    femalePopulation: 109_564,
    ownerOccupied: 44_000,
    renterOccupied: 26_000,
    housingUnits: 75_300,
    medianHomeValue: 425_000,
    medianRent: 1_550,
    medianIncome: 72_100,
    yearBuilt: {
      before1940: 2_800,
      "1940to1959": 5_100,
      "1960to1969": 9_200,
      "1970to1979": 15_600,
      "1980to1989": 13_800,
      "1990to1999": 10_200,
      "2000to2009": 10_800,
      "2010to2022": 7_800,
    },
    landAreaSqMi: 37.1,
  },
};

// ---------------------------------------------------------------------------
// California state FIPS code
// ---------------------------------------------------------------------------

const CA_STATE_FIPS = "06";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function parseCensusNumber(val: string | number | null): number {
  if (val === null || val === undefined || val === "-") return 0;
  const n = typeof val === "string" ? parseFloat(val) : val;
  return Number.isFinite(n) ? n : 0;
}

/**
 * Look up a city's FIPS place code via the Census Places API.
 * Returns `{ stateFips, placeFips, displayName }` or null on failure.
 */
async function lookupFipsCode(
  cityName: string
): Promise<{ stateFips: string; placeFips: string; displayName: string } | null> {
  const url = new URL("https://api.census.gov/data/2022/acs/acs5");
  url.searchParams.set("get", "NAME");
  url.searchParams.set("for", "place:*");
  url.searchParams.set("in", `state:${CA_STATE_FIPS}`);

  const resp = await fetch(url.toString(), {
    headers: { "User-Agent": "BayForge-AI/1.0" },
    signal: AbortSignal.timeout(15_000),
  });

  if (!resp.ok) return null;

  const rows = (await resp.json()) as (string[])[];
  if (!Array.isArray(rows) || rows.length < 2) return null;

  const normalizedTarget = cityName.trim().toLowerCase();

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!Array.isArray(row) || row.length < 3) continue;
    const name = (row[0] as string).toLowerCase();
    // Census names look like "San Jose city, California"
    const cleaned = name.replace(/\s+city\s*,\s*california\s*$/, "").trim();
    if (cleaned === normalizedTarget || name.startsWith(normalizedTarget + " city")) {
      return {
        stateFips: row[1] as string,
        placeFips: row[2] as string,
        displayName: row[0] as string,
      };
    }
  }

  return null;
}

/**
 * Fetch multiple ACS 5-Year data groups for a given place.
 */
async function fetchAcsData(
  stateFips: string,
  placeFips: string
): Promise<CensusRawData | null> {
  // Request multiple group variables in a single call
  const groups = "B01003,B25003,B25034,B25077,B25064,B19013,B25001";
  const url = new URL("https://api.census.gov/data/2022/acs/acs5");
  url.searchParams.set("get", `group(${groups})`);
  url.searchParams.set("for", `place:${placeFips}`);
  url.searchParams.set("in", `state:${stateFips}`);

  const resp = await fetch(url.toString(), {
    headers: { "User-Agent": "BayForge-AI/1.0" },
    signal: AbortSignal.timeout(15_000),
  });

  if (!resp.ok) return null;

  const json = await resp.json();
  // The Census API returns [ ["label","estimate","error",...,"state","place"], [values...] ]
  if (!Array.isArray(json) || json.length < 2) return null;

  const labels = json[0] as string[];
  const values = json[1] as string[];

  const get = (label: string): number => {
    const idx = labels.indexOf(label);
    return idx >= 0 ? parseCensusNumber(values[idx]) : 0;
  };

  return {
    population: get("B01003_001E"), // Total population
    malePopulation: get("B01003_002E"),
    femalePopulation: get("B01003_003E"),
    ownerOccupied: get("B25003_002E"), // Owner occupied
    renterOccupied: get("B25003_003E"), // Renter occupied
    housingUnits: get("B25001_001E"), // Total housing units
    medianHomeValue: get("B25077_001E"), // Median value
    medianRent: get("B25064_001E"), // Median gross rent
    medianIncome: get("B19013_001E"), // Median household income
    yearBuilt: {
      before1940: get("B25034_002E"),
      "1940to1959": get("B25034_003E") + get("B25034_004E") + get("B25034_005E"),
      "1960to1969": get("B25034_006E") + get("B25034_007E"),
      "1970to1979": get("B25034_008E") + get("B25034_009E"),
      "1980to1989": get("B25034_010E") + get("B25034_011E"),
      "1990to1999": get("B25034_012E") + get("B25034_013E"),
      "2000to2009": get("B25034_014E") + get("B25034_015E"),
      "2010to2022": get("B25034_016E") + get("B25034_017E"),
    },
  };
}

// ---------------------------------------------------------------------------
// ADU Feasibility Calculations
// ---------------------------------------------------------------------------

interface AduFeasibility {
  populationDensity: number;
  ownershipRatio: { owner: number; renter: number; renterHeavy: boolean };
  housingDemandIndicator: string;
  aduMarketPotentialScore: number;
  rentalMarketStrength: string;
  neighborhoodDemographics: string;
  aduInvestmentRecommendation: string;
  metrics: {
    population: number;
    housingUnits: number;
    households: number;
    medianIncome: number;
    medianHomeValue: number;
    medianRent: number;
    ownerOccupied: number;
    renterOccupied: number;
    medianYearBuilt: number;
    renterRatio: number;
    vacancyProxy: number;
  };
}

function calculateAduFeasibility(
  raw: CensusRawData & { landAreaSqMi?: number }
): AduFeasibility {
  const totalOccupied = raw.ownerOccupied + raw.renterOccupied;
  const households = totalOccupied;
  const renterRatio =
    totalOccupied > 0 ? raw.renterOccupied / totalOccupied : 0;
  const ownerRatio =
    totalOccupied > 0 ? raw.ownerOccupied / totalOccupied : 0;

  // Population density (per sq mi)
  const landArea = raw.landAreaSqMi && raw.landAreaSqMi > 0 ? raw.landAreaSqMi : 50;
  const populationDensity = Math.round(raw.population / landArea);

  // Median year built (weighted average)
  const yearBuckets = raw.yearBuilt;
  const yearMids: [number[], number] = [
    [yearBuckets.before1940, 1935],
    [yearBuckets["1940to1959"], 1950],
    [yearBuckets["1960to1969"], 1965],
    [yearBuckets["1970to1979"], 1975],
    [yearBuckets["1980to1989"], 1985],
    [yearBuckets["1990to1999"], 1995],
    [yearBuckets["2000to2009"], 2005],
    [yearBuckets["2010to2022"], 2017],
  ];
  const totalUnits = raw.housingUnits > 0 ? raw.housingUnits : 1;
  let weightedYearSum = 0;
  for (const [count, mid] of yearMids) {
    weightedYearSum += (count as number) * mid;
  }
  const medianYearBuilt = Math.round(weightedYearSum / totalUnits);

  // Vacancy proxy: housing units minus occupied
  const vacancyProxy = raw.housingUnits - totalOccupied;
  const vacancyRate =
    raw.housingUnits > 0 ? vacancyProxy / raw.housingUnits : 0;

  // --- Scoring (0-100) ---

  // Renter ratio score (0-25): more renters = more ADU demand
  let renterScore = 0;
  if (renterRatio >= 0.6) renterScore = 25;
  else if (renterRatio >= 0.5) renterScore = 20;
  else if (renterRatio >= 0.4) renterScore = 15;
  else if (renterRatio >= 0.3) renterScore = 10;
  else renterScore = 5;

  // Rent score (0-20): higher rent = more ADU rental income potential
  let rentScore = 0;
  if (raw.medianRent >= 3000) rentScore = 20;
  else if (raw.medianRent >= 2500) rentScore = 18;
  else if (raw.medianRent >= 2000) rentScore = 15;
  else if (raw.medianRent >= 1500) rentScore = 12;
  else if (raw.medianRent >= 1000) rentScore = 8;
  else rentScore = 5;

  // Income score (0-15): higher income = more homeowners can afford ADU construction
  let incomeScore = 0;
  if (raw.medianIncome >= 150_000) incomeScore = 15;
  else if (raw.medianIncome >= 120_000) incomeScore = 13;
  else if (raw.medianIncome >= 100_000) incomeScore = 11;
  else if (raw.medianIncome >= 80_000) incomeScore = 9;
  else if (raw.medianIncome >= 60_000) incomeScore = 7;
  else incomeScore = 4;

  // Density score (0-15): higher density = more constrained housing supply
  let densityScore = 0;
  if (populationDensity >= 7000) densityScore = 15;
  else if (populationDensity >= 5000) densityScore = 13;
  else if (populationDensity >= 3000) densityScore = 11;
  else if (populationDensity >= 1500) densityScore = 8;
  else if (populationDensity >= 800) densityScore = 5;
  else densityScore = 3;

  // Housing value score (0-15): higher home values = more to gain from ADU
  let homeValueScore = 0;
  if (raw.medianHomeValue >= 1_500_000) homeValueScore = 15;
  else if (raw.medianHomeValue >= 1_000_000) homeValueScore = 13;
  else if (raw.medianHomeValue >= 800_000) homeValueScore = 11;
  else if (raw.medianHomeValue >= 600_000) homeValueScore = 9;
  else if (raw.medianHomeValue >= 400_000) homeValueScore = 7;
  else homeValueScore = 4;

  // Age of housing score (0-10): older housing = more single-family lots for ADU
  let ageScore = 0;
  if (medianYearBuilt <= 1950) ageScore = 10;
  else if (medianYearBuilt <= 1970) ageScore = 8;
  else if (medianYearBuilt <= 1985) ageScore = 6;
  else if (medianYearBuilt <= 2000) ageScore = 4;
  else ageScore = 2;

  const aduMarketPotentialScore = Math.min(
    100,
    Math.round(renterScore + rentScore + incomeScore + densityScore + homeValueScore + ageScore)
  );

  // --- Housing demand indicator ---
  let housingDemandIndicator: string;
  if (renterRatio >= 0.5 && raw.medianRent >= 2500 && vacancyRate < 0.05) {
    housingDemandIndicator = "Very High";
  } else if (renterRatio >= 0.4 && raw.medianRent >= 2000) {
    housingDemandIndicator = "High";
  } else if (renterRatio >= 0.3 && raw.medianRent >= 1500) {
    housingDemandIndicator = "Moderate";
  } else {
    housingDemandIndicator = "Low";
  }

  // --- Rental market strength ---
  let rentalMarketStrength: string;
  if (raw.medianRent >= 2800 && renterRatio >= 0.45) {
    rentalMarketStrength = "Very Strong";
  } else if (raw.medianRent >= 2200 && renterRatio >= 0.35) {
    rentalMarketStrength = "Strong";
  } else if (raw.medianRent >= 1600 && renterRatio >= 0.25) {
    rentalMarketStrength = "Moderate";
  } else {
    rentalMarketStrength = "Emerging";
  }

  // --- Neighborhood demographics summary ---
  const malePct =
    raw.population > 0
      ? Math.round((raw.malePopulation / raw.population) * 100)
      : 50;
  const renterPct = Math.round(renterRatio * 100);
  const medianAgeEstimate =
    medianYearBuilt < 1980 ? "established" : medianYearBuilt < 2000 ? "mature" : "modern";

  const neighborhoodDemographics =
    `${raw.population.toLocaleString()} residents across ${households.toLocaleString()} households. ` +
    `${renterPct}% renter-occupied with a ${medianAgeEstimate} housing stock (median year built: ${medianYearBuilt}). ` +
    `Gender split: ~${malePct}% male, ${100 - malePct}% female.`;

  // --- ADU investment recommendation ---
  let aduInvestmentRecommendation: string;
  if (aduMarketPotentialScore >= 80) {
    aduInvestmentRecommendation =
      "Excellent opportunity for ADU investment. Strong rental market, high demand, and favorable demographics suggest excellent ROI potential. Consider building a detached ADU or garage conversion to capture rental income.";
  } else if (aduMarketPotentialScore >= 65) {
    aduInvestmentRecommendation =
      "Good opportunity for ADU investment. Solid rental demand and housing market fundamentals support ADU development. A well-designed ADU could generate strong rental returns and increase property value.";
  } else if (aduMarketPotentialScore >= 45) {
    aduInvestmentRecommendation =
      "Moderate opportunity for ADU investment. Market conditions are adequate but not exceptional. Focus on cost-effective ADU designs (e.g., garage conversions) to maximize ROI in a more price-sensitive rental market.";
  } else {
    aduInvestmentRecommendation =
      "Limited ADU investment opportunity. Lower rental demand and market values suggest a longer payback period. An ADU may still provide value for personal use (e.g., multigenerational housing) but rental ROI may be modest.";
  }

  return {
    populationDensity,
    ownershipRatio: {
      owner: Math.round(ownerRatio * 1000) / 10,
      renter: Math.round(renterRatio * 1000) / 10,
      renterHeavy: renterRatio >= 0.4,
    },
    housingDemandIndicator,
    aduMarketPotentialScore,
    rentalMarketStrength,
    neighborhoodDemographics,
    aduInvestmentRecommendation,
    metrics: {
      population: raw.population,
      housingUnits: raw.housingUnits,
      households,
      medianIncome: raw.medianIncome,
      medianHomeValue: raw.medianHomeValue,
      medianRent: raw.medianRent,
      ownerOccupied: raw.ownerOccupied,
      renterOccupied: raw.renterOccupied,
      medianYearBuilt,
      renterRatio: Math.round(renterRatio * 1000) / 10,
      vacancyProxy,
    },
  };
}

// ---------------------------------------------------------------------------
// GET /api/census?city=San Jose
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const city = searchParams.get("city");

  if (!city) {
    return NextResponse.json(
      { error: "Missing required query parameter: city" },
      { status: 400 }
    );
  }

  // --- Rate limiting ---
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

  // --- Check cache ---
  const normalizedCity = city.trim().toLowerCase();
  const cacheKey = normalizedCity;
  const cached = censusCache.get(cacheKey);
  if (cached && now - cached.timestamp < CACHE_TTL_MS) {
    return NextResponse.json({
      ...(cached.data as Record<string, unknown>),
      _cached: true,
      _cacheAge: Math.round((now - cached.timestamp) / 1000),
    });
  }

  // --- Attempt Census API lookup ---
  let rawData: CensusRawData | null = null;
  let fipsInfo: { stateFips: string; placeFips: string; displayName: string } | null = null;
  let usedFallback = false;
  let dataSource = "us-census-acs5";

  try {
    // Step 1: Look up FIPS place code
    fipsInfo = await lookupFipsCode(normalizedCity);

    if (fipsInfo) {
      // Step 2: Fetch ACS data
      rawData = await fetchAcsData(fipsInfo.stateFips, fipsInfo.placeFips);
    }

    if (!rawData || rawData.population === 0) {
      throw new Error("Census data returned empty results");
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.warn("[Census API] Lookup failed, using fallback data:", msg);

    // Fall back to built-in data
    const fallback = FALLBACK_DATA[normalizedCity];
    if (fallback) {
      rawData = {
        population: fallback.population,
        malePopulation: fallback.malePopulation,
        femalePopulation: fallback.femalePopulation,
        ownerOccupied: fallback.ownerOccupied,
        renterOccupied: fallback.renterOccupied,
        housingUnits: fallback.housingUnits,
        medianHomeValue: fallback.medianHomeValue,
        medianRent: fallback.medianRent,
        medianIncome: fallback.medianIncome,
        yearBuilt: fallback.yearBuilt,
        landAreaSqMi: fallback.landAreaSqMi,
      };
      usedFallback = true;
      dataSource = "built-in-fallback";
    }
  }

  if (!rawData) {
    return NextResponse.json(
      {
        error: `No census or built-in data available for "${city}".`,
        availableFallbackCities: Object.keys(FALLBACK_DATA).map(
          (c) => c.charAt(0).toUpperCase() + c.slice(1)
        ),
        hint: "Try a different city name or check the spelling.",
      },
      { status: 404 }
    );
  }

  // --- Calculate ADU feasibility ---
  const feasibility = calculateAduFeasibility(rawData);

  // --- Build response ---
  const result = {
    city: city.trim(),
    censusPlace: fipsInfo?.displayName ?? null,
    fips: fipsInfo
      ? { state: fipsInfo.stateFips, place: fipsInfo.placeFips }
      : null,
    demographics: {
      totalPopulation: rawData.population,
      malePopulation: rawData.malePopulation,
      femalePopulation: rawData.femalePopulation,
    },
    housing: {
      totalHousingUnits: rawData.housingUnits,
      ownerOccupied: rawData.ownerOccupied,
      renterOccupied: rawData.renterOccupied,
      medianHomeValue: rawData.medianHomeValue,
      medianRent: rawData.medianRent,
      medianHouseholdIncome: rawData.medianIncome,
      yearBuiltDistribution: rawData.yearBuilt,
    },
    aduFeasibility: feasibility,
    dataSource: {
      source: dataSource,
      description:
        dataSource === "us-census-acs5"
          ? "US Census Bureau, ACS 5-Year Estimates (2022)"
          : "Built-in approximate data derived from Census ACS 5-Year Estimates (2022)",
      usedFallback,
      caveat: "Data is approximate and for informational/feasibility analysis purposes only. Consult local government databases for current official data.",
      lastUpdated: "2022",
    },
    fetchedAt: new Date().toISOString(),
  };

  // Cache the result
  censusCache.set(cacheKey, { data: result, timestamp: now });

  return NextResponse.json(result);
}
