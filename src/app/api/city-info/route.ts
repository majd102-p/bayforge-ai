import { NextRequest, NextResponse } from "next/server";

/**
 * In-memory cache for city info results.
 * Key: normalized city name → { data, timestamp }
 */
const cityInfoCache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

/**
 * Simple in-memory rate limiter.
 */
const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 20;

/**
 * GET /api/city-info?city=San Jose
 *
 * Fetches city information from the free Wikipedia REST API.
 * Uses search to find the correct article, then gets the summary/extract.
 *
 * Returns structured data relevant to ADU feasibility analysis:
 * population, area, elevation, founded date, description.
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
  const cached = cityInfoCache.get(cacheKey);
  if (cached && now - cached.timestamp < CACHE_TTL_MS) {
    return NextResponse.json({
      ...(cached.data as Record<string, unknown>),
      _cached: true,
    });
  }

  try {
    // Step 1: Search Wikipedia for the city
    const searchQuery = `${city.trim()} California`;
    const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(searchQuery)}&format=json&utf8=1&srlimit=3&origin=*`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8_000);

    let searchResponse: Response;
    try {
      searchResponse = await fetch(searchUrl, {
        headers: {
          "User-Agent": "BayForge-AI/1.0 (educational ADU zoning tool)",
          Accept: "application/json",
        },
        signal: controller.signal,
      });
    } catch {
      clearTimeout(timeoutId);
      throw new Error("Wikipedia search request timed out");
    }
    clearTimeout(timeoutId);

    if (!searchResponse.ok) {
      throw new Error(`Wikipedia search returned ${searchResponse.status}`);
    }

    const searchData = await searchResponse.json();
    const searchResults = searchData?.query?.search;

    if (!searchResults || searchResults.length === 0) {
      return NextResponse.json(
        {
          error: `No Wikipedia article found for "${city}" in California.`,
          hint: "Try the full city name (e.g., 'San Jose' instead of 'San J')",
        },
        { status: 404 }
      );
    }

    // Step 2: Get the first relevant result's page summary
    const pageTitle = searchResults[0].title;

    const summaryUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(pageTitle)}`;

    const summaryController = new AbortController();
    const summaryTimeoutId = setTimeout(() => summaryController.abort(), 8_000);

    let wikiData: Record<string, unknown> | null = null;
    try {
      const summaryResponse = await fetch(summaryUrl, {
        headers: {
          "User-Agent": "BayForge-AI/1.0 (educational ADU zoning tool)",
          Accept: "application/json",
        },
        signal: summaryController.signal,
      });

      clearTimeout(summaryTimeoutId);

      if (summaryResponse.ok) {
        const json = await summaryResponse.json();
        if (json.type === "disambiguation" || (json.type as string)?.includes("Error")) {
          // Try second result
          if (searchResults.length > 1) {
            const page2Url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(searchResults[1].title)}`;
            const resp2 = await fetch(page2Url, {
              headers: {
                "User-Agent": "BayForge-AI/1.0",
                Accept: "application/json",
              },
              signal: AbortSignal.timeout(5_000),
            });
            if (resp2.ok) {
              const json2 = await resp2.json();
              if (json2.type !== "disambiguation" && !(json2.type as string)?.includes("Error")) {
                wikiData = json2 as Record<string, unknown>;
              }
            }
          }
        } else {
          wikiData = json as Record<string, unknown>;
        }
      }
    } catch {
      clearTimeout(summaryTimeoutId);
    }

    if (!wikiData) {
      return NextResponse.json(
        {
          error: `Could not load Wikipedia data for "${city}".`,
          hint: "Wikipedia API may be temporarily unavailable. Please try again.",
        },
        { status: 404 }
      );
    }

    // Extract thumbnail URL
    const thumbnail = wikiData.thumbnail as
      | { source: string; width: number; height: number }
      | undefined;

    // Try to extract structured data
    const extract = wikiData.extract as string | undefined;
    const description = wikiData.description as string | undefined;

    // Attempt to find population, area, elevation from extract text
    const populationMatch = extract?.match(
      /population(?:\s+of)?\s+(?:was|is|approximately)?\s*([\d,]+)/i
    );
    const areaMatch = extract?.match(
      /(?:total area|area)\s+(?:of|is)?\s*([\d.]+)\s*(?:square\s*miles|sq\s*mi|mi²)/i
    );
    const elevationMatch = extract?.match(
      /elevation\s+(?:is|of)?\s*([\d,]+)\s*feet/i
    );
    const foundedMatch = extract?.match(
      /(?:founded|established|incorporated)\s+(?:on\s+)?(?:in\s+)?([\w\s,.\d]+)/i
    );

    const population = populationMatch
      ? parseInt(populationMatch[1].replace(/,/g, ""), 10)
      : null;
    const areaSqMi = areaMatch ? parseFloat(areaMatch[1]) : null;
    const elevationFt = elevationMatch
      ? parseInt(elevationMatch[1].replace(/,/g, ""), 10)
      : null;
    const founded = foundedMatch ? foundedMatch[1].trim() : null;

    const result = {
      city: city.trim(),
      source: {
        type: "wikipedia",
        title: pageTitle,
        url: ((wikiData.content_urls as Record<string, Record<string, string>> | undefined)?.desktop?.page) ?? null,
      },
      description,
      extract: extract ? extract.slice(0, 600) : null, // Truncate long extracts
      thumbnailUrl: thumbnail?.source ?? null,
      population,
      areaSqMi,
      elevationFt,
      founded,
      fetchedAt: new Date().toISOString(),
    };

    // Cache result
    cityInfoCache.set(cacheKey, { data: result, timestamp: now });

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[City Info API Error]", message);

    return NextResponse.json(
      {
        error: "Failed to fetch city information from Wikipedia",
        details: message,
      },
      { status: 502 }
    );
  }
}
