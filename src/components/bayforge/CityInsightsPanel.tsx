'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { COVERED_CITIES } from '@/store/ai-store';
import {
  MapPin,
  Cloud,
  CloudRain,
  CloudSnow,
  Sun,
  Thermometer,
  Mountain,
  Users,
  Ruler,
  Radio,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Building2,
  Activity,
  Train,
  Wind,
  AirVent,
  Waves,
  Car,
  Gauge,
  TriangleAlert,
} from 'lucide-react';

// ── Types ───────────────────────────────────────────────────────────────────

interface WeatherData {
  temperature: number;
  feelsLike?: number;
  humidity: number;
  windSpeed: number;
  condition: string;
  icon: string;
  constructionSuitability: 'excellent' | 'good' | 'fair' | 'poor';
  score?: number;
  details?: string[];
}

interface ForecastDay {
  day: string;
  high: number;
  low: number;
  condition: string;
  icon: string;
}

interface CityWikiData {
  description: string | null;
  extract: string | null;
  population: number | null;
  areaSqMi: number | null;
  founded: string | null;
  elevationFt: number | null;
}

interface ElevationData {
  elevation: number;
  source: string;
  hillsideRisk?: {
    riskLevel: string;
    considerations: string[];
    aduImplications: string[];
  };
}

interface TransitData {
  transitStopCount: number;
  transitTypes: string[];
  nearestStopDistance: number;
  qualifiesForParkingWaiver: boolean;
  nearestMajorTransit: string | null;
  topStops: Array<{ name: string; type: string; distance: number }>;
  aduImplications: string[];
}

interface AirQualityData {
  airQuality: {
    aqi: number;
    level: string;
    description: string;
  };
  pollutants: {
    pm2_5: { value: number; whoGuideline: number; withinWhoLimit: boolean };
    pm10: { value: number; whoGuideline: number; withinWhoLimit: boolean };
    no2: { value: number; whoGuideline: number; withinWhoLimit: boolean };
    o3: { value: number; whoGuideline: number; withinWhoLimit: boolean };
  };
  constructionSuitability: {
    rating: string;
    description: string;
    considerations: string[];
  };
  constructionGuidance: string[];
}

interface SeismicData {
  seismicZone: {
    zone: string;
    riskLevel: string;
    majorFaults: string[];
    county: string;
  };
  recentActivity: {
    count: number;
    activityLevel: string;
  };
  nearestEarthquake: {
    distance: number;
    magnitude: number;
    location: string;
    time: string;
  };
  recentEarthquakes: Array<{
    magnitude: number;
    location: string;
    distance: number;
    time: string;
  }>;
  aduConstructionImplications: {
    seismicRequirements: string[];
    recommendations: string[];
    costEstimate: string;
    engineeringNotes: string[];
  };
}

interface CityInsightsPanelProps {
  cityName: string;
}

// ── City Coordinate Lookup ─────────────────────────────────────────────────

const CITY_COORDS: Record<string, { lat: number; lon: number }> = {
  'San Francisco': { lat: 37.7749, lon: -122.4194 },
  'Los Angeles': { lat: 34.0522, lon: -118.2437 },
  'San Jose': { lat: 37.3382, lon: -121.8863 },
  'San Diego': { lat: 32.7157, lon: -117.1611 },
  'Sacramento': { lat: 38.5816, lon: -121.4944 },
  'Oakland': { lat: 37.8044, lon: -122.2712 },
  'Fresno': { lat: 36.7378, lon: -119.7871 },
  'Long Beach': { lat: 33.77, lon: -118.1937 },
  'Bakersfield': { lat: 35.3733, lon: -119.0187 },
  'Anaheim': { lat: 33.8366, lon: -117.9143 },
  'Santa Ana': { lat: 33.7455, lon: -117.8677 },
  'Riverside': { lat: 33.9806, lon: -117.3755 },
  'Stockton': { lat: 37.9577, lon: -121.2908 },
  'Irvine': { lat: 33.6846, lon: -117.8265 },
  'Chula Vista': { lat: 32.6401, lon: -117.0842 },
  'Fremont': { lat: 37.5485, lon: -121.9886 },
  'Santa Clarita': { lat: 34.3917, lon: -118.5426 },
  'San Bernardino': { lat: 34.1083, lon: -117.2898 },
  'Modesto': { lat: 37.6391, lon: -120.9969 },
  'Pasadena': { lat: 34.1478, lon: -118.1445 },
  'Palo Alto': { lat: 37.4419, lon: -122.143 },
  'Berkeley': { lat: 37.8716, lon: -122.2727 },
  'Burbank': { lat: 34.1808, lon: -118.309 },
  'Glendale': { lat: 34.1425, lon: -118.2551 },
  'Santa Cruz': { lat: 36.9741, lon: -122.0308 },
  'Ventura': { lat: 34.2747, lon: -119.229 },
  'Simi Valley': { lat: 34.2694, lon: -118.7815 },
  'Thousand Oaks': { lat: 34.1706, lon: -118.8376 },
  'Oxnard': { lat: 34.1975, lon: -119.1771 },
  'Concord': { lat: 37.9779, lon: -122.0311 },
  'Walnut Creek': { lat: 37.9101, lon: -122.0652 },
  'Richmond': { lat: 37.9358, lon: -122.3477 },
  'Daly City': { lat: 37.6879, lon: -122.4702 },
  'San Mateo': { lat: 37.5629, lon: -122.3255 },
  'Redwood City': { lat: 37.4852, lon: -122.2364 },
  'Mountain View': { lat: 37.3861, lon: -122.0839 },
  'Sunnyvale': { lat: 37.3688, lon: -122.0363 },
  'Cupertino': { lat: 37.323, lon: -122.0322 },
  'Santa Clara': { lat: 37.3541, lon: -121.9552 },
  'Hayward': { lat: 37.6688, lon: -122.0808 },
  'Napa': { lat: 38.2975, lon: -122.2869 },
  'Petaluma': { lat: 38.2324, lon: -122.6367 },
  'Santa Rosa': { lat: 38.4405, lon: -122.7144 },
  'Visalia': { lat: 36.3302, lon: -119.2921 },
  'Clovis': { lat: 36.8253, lon: -119.7029 },
  'Huntington Beach': { lat: 33.6603, lon: -117.9992 },
  'Garden Grove': { lat: 33.7739, lon: -117.9414 },
  'Fullerton': { lat: 33.8704, lon: -117.924 },
  'Costa Mesa': { lat: 33.6411, lon: -117.9187 },
  'Newport Beach': { lat: 33.6189, lon: -117.929 },
  'Carlsbad': { lat: 33.1581, lon: -117.3506 },
  'Encinitas': { lat: 33.037, lon: -117.292 },
  'Escondido': { lat: 33.1192, lon: -117.0864 },
  'Oceanside': { lat: 33.1959, lon: -117.3795 },
  'Ontario': { lat: 34.0633, lon: -117.6509 },
  'Rancho Cucamonga': { lat: 34.1064, lon: -117.5931 },
};

// ── Helpers ─────────────────────────────────────────────────────────────────

function getWeatherIcon(condition: string): React.ReactNode {
  const lower = condition.toLowerCase();
  if (lower.includes('sun') || lower.includes('clear')) return <Sun className="h-8 w-8 text-amber-400" />;
  if (lower.includes('rain') || lower.includes('drizzle')) return <CloudRain className="h-8 w-8 text-blue-400" />;
  if (lower.includes('snow')) return <CloudSnow className="h-8 w-8 text-slate-300" />;
  if (lower.includes('cloud') || lower.includes('overcast')) return <Cloud className="h-8 w-8 text-gray-400" />;
  return <Thermometer className="h-8 w-8 text-amber-400" />;
}

function getConstructionSuitabilityBadge(suitability: string): {
  label: string;
  color: string;
  icon: React.ElementType;
} {
  switch (suitability) {
    case 'excellent':
      return { label: 'Excellent', color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30', icon: CheckCircle2 };
    case 'good':
      return { label: 'Good', color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30', icon: CheckCircle2 };
    case 'fair':
      return { label: 'Fair', color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30', icon: AlertTriangle };
    case 'poor':
      return { label: 'Poor', color: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30', icon: XCircle };
    default:
      return { label: 'N/A', color: 'bg-gray-500/10 text-gray-500 border-gray-500/30', icon: Activity };
  }
}

function getHillsideRisk(elevation: number): {
  level: string;
  color: string;
  description: string;
} {
  if (elevation > 1000) return { level: 'High', color: 'text-red-500', description: 'Steep terrain — expect higher foundation costs and potential VHFHSZ restrictions' };
  if (elevation > 500) return { level: 'Moderate', color: 'text-amber-500', description: 'Elevated terrain — may require special foundation engineering' };
  if (elevation > 200) return { level: 'Low', color: 'text-emerald-500', description: 'Slight elevation — generally suitable for standard ADU construction' };
  return { level: 'Minimal', color: 'text-emerald-400', description: 'Flat terrain — ideal conditions for ADU construction' };
}

function getAqiBadge(aqi: number): { label: string; color: string; bgColor: string } {
  if (aqi <= 50) return { label: 'Good', color: 'text-emerald-700 dark:text-emerald-300', bgColor: 'bg-emerald-500/15 border-emerald-500/30' };
  if (aqi <= 100) return { label: 'Moderate', color: 'text-yellow-700 dark:text-yellow-300', bgColor: 'bg-yellow-500/15 border-yellow-500/30' };
  if (aqi <= 150) return { label: 'Unhealthy (Sensitive)', color: 'text-orange-700 dark:text-orange-300', bgColor: 'bg-orange-500/15 border-orange-500/30' };
  if (aqi <= 200) return { label: 'Unhealthy', color: 'text-red-700 dark:text-red-300', bgColor: 'bg-red-500/15 border-red-500/30' };
  if (aqi <= 300) return { label: 'Very Unhealthy', color: 'text-purple-700 dark:text-purple-300', bgColor: 'bg-purple-500/15 border-purple-500/30' };
  return { label: 'Hazardous', color: 'text-rose-900 dark:text-rose-200', bgColor: 'bg-rose-900/15 border-rose-900/30' };
}

function getSeismicRiskBadge(riskLevel: string): { label: string; color: string; bgColor: string } {
  const lower = riskLevel.toLowerCase();
  if (lower.includes('very high') || lower.includes('extreme')) return { label: riskLevel, color: 'text-red-600 dark:text-red-400', bgColor: 'bg-red-500/15 border-red-500/30' };
  if (lower.includes('high')) return { label: riskLevel, color: 'text-orange-600 dark:text-orange-400', bgColor: 'bg-orange-500/15 border-orange-500/30' };
  if (lower.includes('moderate')) return { label: riskLevel, color: 'text-amber-600 dark:text-amber-400', bgColor: 'bg-amber-500/15 border-amber-500/30' };
  if (lower.includes('low')) return { label: riskLevel, color: 'text-emerald-600 dark:text-emerald-400', bgColor: 'bg-emerald-500/15 border-emerald-500/30' };
  return { label: riskLevel, color: 'text-muted-foreground', bgColor: 'bg-muted border-muted-foreground/20' };
}

function getCityInfo(cityName: string) {
  return COVERED_CITIES.find(
    (c) => c.name.toLowerCase() === cityName.toLowerCase()
  );
}

// ── Component ───────────────────────────────────────────────────────────────

export function CityInsightsPanel({ cityName }: CityInsightsPanelProps) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [wikiData, setWikiData] = useState<CityWikiData | null>(null);
  const [elevation, setElevation] = useState<ElevationData | null>(null);
  const [transit, setTransit] = useState<TransitData | null>(null);
  const [airQuality, setAirQuality] = useState<AirQualityData | null>(null);
  const [seismic, setSeismic] = useState<SeismicData | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [wikiLoading, setWikiLoading] = useState(true);
  const [elevationLoading, setElevationLoading] = useState(true);
  const [transitLoading, setTransitLoading] = useState(true);
  const [airQualityLoading, setAirQualityLoading] = useState(true);
  const [seismicLoading, setSeismicLoading] = useState(true);
  const [forecast, setForecast] = useState<ForecastDay[]>([]);
  const [weatherError, setWeatherError] = useState<string | null>(null);
  const [wikiError, setWikiError] = useState<string | null>(null);
  const [transitError, setTransitError] = useState<string | null>(null);
  const [airQualityError, setAirQualityError] = useState<string | null>(null);
  const [seismicError, setSeismicError] = useState<string | null>(null);

  const coords = CITY_COORDS[cityName];
  const cityInfo = getCityInfo(cityName);

  const fetchWeather = useCallback(async () => {
    if (!cityName) return;
    setWeatherLoading(true);
    setWeatherError(null);
    try {
      const res = await fetch(`/api/weather?city=${encodeURIComponent(cityName)}`);
      if (!res.ok) throw new Error('Failed to fetch weather data');
      const data = await res.json();
      const current = data.current;
      const suitability = data.constructionSuitability;
      // Map API response to component format
      setWeather({
        temperature: current.temperature_f,
        feelsLike: current.temperature_f,
        humidity: current.humidity,
        windSpeed: current.windSpeed_mph,
        condition: current.description,
        icon: current.description,
        constructionSuitability: suitability.rating?.toLowerCase() as WeatherData['constructionSuitability'] || 'good',
        score: suitability.score,
        details: suitability.details,
      });
      // Map forecast
      if (data.forecast) {
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        setForecast(data.forecast.slice(0, 3).map((f: { date: string; high_f: number; low_f: number; precipitation_mm: number }) => {
            const d = new Date(f.date + 'T12:00:00');
            return {
              day: days[d.getDay()] || f.date.slice(5),
              high: f.high_f,
              low: f.low_f,
              condition: f.precipitation_mm > 0 ? 'Rain' : 'Clear',
              icon: f.precipitation_mm > 0 ? 'rain' : 'clear',
            };
          }));
      }
    } catch {
      setWeatherError('Weather data unavailable');
    } finally {
      setWeatherLoading(false);
    }
  }, [cityName]);

  const fetchWiki = useCallback(async () => {
    if (!cityName) return;
    setWikiLoading(true);
    setWikiError(null);
    try {
      const res = await fetch(`/api/city-info?city=${encodeURIComponent(cityName)}`);
      if (!res.ok) throw new Error('Failed to fetch city info');
      const data = await res.json();
      // Map API response to component format
      setWikiData({
        description: data.extract || data.description || null,
        extract: data.extract || null,
        population: data.population ?? null,
        areaSqMi: data.areaSqMi ?? null,
        founded: data.founded ?? null,
        elevationFt: data.elevationFt ?? null,
      });
    } catch {
      setWikiError('City information unavailable');
    } finally {
      setWikiLoading(false);
    }
  }, [cityName]);

  const fetchElevation = useCallback(async () => {
    if (!coords) return;
    setElevationLoading(true);
    try {
      const res = await fetch(`/api/elevation?lat=${coords.lat}&lon=${coords.lon}`);
      if (!res.ok) throw new Error('Failed to fetch elevation');
      const data = await res.json();
      // Map API response to component format
      setElevation({
        elevation: data.elevation?.feet ?? data.elevation?.meters ? Math.round(data.elevation.meters * 3.28084) : 0,
        source: data.source ?? 'open-meteo',
        hillsideRisk: data.hillsideRisk,
      });
    } catch {
      // Silently fail for elevation
    } finally {
      setElevationLoading(false);
    }
  }, [coords]);

  const fetchTransit = useCallback(async () => {
    if (!cityName) return;
    setTransitLoading(true);
    setTransitError(null);
    try {
      const res = await fetch(`/api/transit?city=${encodeURIComponent(cityName)}`);
      if (!res.ok) throw new Error('Failed to fetch transit data');
      const data = await res.json();
      setTransit(data);
    } catch {
      setTransitError('Transit data unavailable');
    } finally {
      setTransitLoading(false);
    }
  }, [cityName]);

  const fetchAirQuality = useCallback(async () => {
    if (!cityName) return;
    setAirQualityLoading(true);
    setAirQualityError(null);
    try {
      const res = await fetch(`/api/air-quality?city=${encodeURIComponent(cityName)}`);
      if (!res.ok) throw new Error('Failed to fetch air quality data');
      const data = await res.json();
      setAirQuality(data);
    } catch {
      setAirQualityError('Air quality data unavailable');
    } finally {
      setAirQualityLoading(false);
    }
  }, [cityName]);

  const fetchSeismic = useCallback(async () => {
    if (!cityName) return;
    setSeismicLoading(true);
    setSeismicError(null);
    try {
      const res = await fetch(`/api/seismic?city=${encodeURIComponent(cityName)}`);
      if (!res.ok) throw new Error('Failed to fetch seismic data');
      const data = await res.json();
      setSeismic(data);
    } catch {
      setSeismicError('Seismic data unavailable');
    } finally {
      setSeismicLoading(false);
    }
  }, [cityName]);

  useEffect(() => {
    fetchWeather();
    fetchWiki();
    fetchElevation();
    fetchTransit();
    fetchAirQuality();
    fetchSeismic();
  }, [fetchWeather, fetchWiki, fetchElevation, fetchTransit, fetchAirQuality, fetchSeismic]);

  const suitability = weather ? getConstructionSuitabilityBadge(weather.constructionSuitability) : null;
  const hillside = elevation ? getHillsideRisk(elevation.elevation) : null;

  if (!cityName) {
    return (
      <Card className="p-6">
        <div className="text-center text-muted-foreground py-8">
          <MapPin className="h-8 w-8 mx-auto mb-3 opacity-50" />
          <p className="text-sm">Select a city to view live insights</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Live Data Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <MapPin className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            {cityName} Insights
          </h3>
        </div>
        <Badge variant="outline" className="text-[10px] gap-1.5 border-emerald-500/30 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          Live Data
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* City Description */}
        <Card className="p-4 lg:col-span-2">
          <div className="flex items-center gap-2 mb-3">
            <div className="rounded-md bg-amber-500/10 p-1.5">
              <Building2 className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
            </div>
            <h4 className="font-semibold text-sm">City Overview</h4>
          </div>

          {wikiLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ) : wikiError ? (
            <p className="text-sm text-muted-foreground">{wikiError}</p>
          ) : wikiData ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground leading-relaxed">
                {wikiData.description}
              </p>
              <div className="flex flex-wrap gap-3">
                {wikiData.population && (
                  <div className="flex items-center gap-1.5 text-xs">
                    <Users className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-muted-foreground">Pop:</span>
                    <span className="font-medium">{wikiData.population.toLocaleString()}</span>
                  </div>
                )}
                {wikiData.areaSqMi && (
                  <div className="flex items-center gap-1.5 text-xs">
                    <Ruler className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-muted-foreground">Area:</span>
                    <span className="font-medium">{wikiData.areaSqMi} sq mi</span>
                  </div>
                )}
                {cityInfo && (
                  <>
                    <Badge variant="secondary" className="text-[10px]">{cityInfo.county} County</Badge>
                    <Badge variant="outline" className="text-[10px]">{cityInfo.region}</Badge>
                    {cityInfo.hasJadu && (
                      <Badge variant="outline" className="text-[10px] text-emerald-600 dark:text-emerald-400 border-emerald-500/30">JADU Allowed</Badge>
                    )}
                    {cityInfo.hasPriority && (
                      <Badge variant="outline" className="text-[10px] text-amber-600 dark:text-amber-400 border-amber-500/30">Priority Processing</Badge>
                    )}
                  </>
                )}
              </div>
            </div>
          ) : null}
        </Card>

        {/* Current Weather */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="rounded-md bg-blue-500/10 p-1.5">
              <Cloud className="h-3.5 w-3.5 text-blue-500" />
            </div>
            <h4 className="font-semibold text-sm">Current Weather</h4>
          </div>

          {weatherLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-16 w-16 rounded-full mx-auto" />
              <Skeleton className="h-4 w-24 mx-auto" />
              <Skeleton className="h-3 w-full" />
            </div>
          ) : weatherError ? (
            <div className="text-center py-4">
              <Cloud className="h-8 w-8 mx-auto mb-2 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">{weatherError}</p>
              <button
                onClick={fetchWeather}
                className="mt-2 text-xs text-amber-600 dark:text-amber-400 hover:underline"
              >
                Retry
              </button>
            </div>
          ) : weather ? (
            <div className="space-y-3">
              <div className="flex items-center gap-4">
                {getWeatherIcon(weather.condition)}
                <div>
                  <p className="text-2xl font-bold">{weather.temperature}°F</p>
                  <p className="text-xs text-muted-foreground">{weather.condition}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Thermometer className="h-3 w-3" />
                  Feels like {weather.feelsLike}°F
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Activity className="h-3 w-3" />
                  Humidity {weather.humidity}%
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Cloud className="h-3 w-3" />
                  Wind {weather.windSpeed} mph
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="font-medium text-xs">Construction:</span>
                  {suitability && (
                    <Badge
                      variant="outline"
                      className={`text-[10px] gap-1 ${suitability.color}`}
                    >
                      <suitability.icon className="h-3 w-3" />
                      {suitability.label}
                    </Badge>
                  )}
                </div>
              </div>

              {/* 3-Day Forecast */}
              {forecast.length > 0 && (
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-2">
                    3-Day Forecast
                  </p>
                  <div className="flex gap-2">
                    {forecast.map((day) => (
                      <div
                        key={day.day}
                        className="flex-1 text-center rounded-md bg-muted/50 p-2"
                      >
                        <p className="text-[10px] font-medium text-muted-foreground">{day.day}</p>
                        <div className="flex justify-center my-1">
                          {getWeatherIcon(day.condition)}
                        </div>
                        <p className="text-[10px]">
                          <span className="font-medium">{day.high}°</span>
                          <span className="text-muted-foreground">/{day.low}°</span>
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </Card>

        {/* Elevation & Terrain */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="rounded-md bg-emerald-500/10 p-1.5">
              <Mountain className="h-3.5 w-3.5 text-emerald-500" />
            </div>
            <h4 className="font-semibold text-sm">Elevation & Terrain</h4>
          </div>

          {elevationLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ) : elevation ? (
            <motion.div
              className="space-y-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div>
                <p className="text-2xl font-bold">{elevation.elevation.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">
                  feet above sea level
                  {coords && (
                    <span className="ml-1">
                      ({coords.lat.toFixed(4)}°N, {Math.abs(coords.lon).toFixed(4)}°W)
                    </span>
                  )}
                </p>
              </div>

              {elevation.hillsideRisk ? (
                <div className="rounded-md bg-muted/50 p-3 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium">Hillside Risk</span>
                    <Badge
                      variant="outline"
                      className={`text-[10px] ${hillside.color}`}
                    >
                      {hillside.level}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {hillside.description}
                  </p>
                  {elevation.hillsideRisk.aduImplications.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {elevation.hillsideRisk.aduImplications.slice(0, 3).map((imp: string, i: number) => (
                        <p key={i} className="text-[11px] text-amber-600 dark:text-amber-400">
                          • {imp}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              ) : hillside ? (
                <div className="rounded-md bg-muted/50 p-3 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium">Hillside Risk</span>
                    <Badge
                      variant="outline"
                      className={`text-[10px] ${hillside.color}`}
                    >
                      {hillside.level}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {hillside.description}
                  </p>
                </div>
              ) : null}

              {elevation.source && (
                <p className="text-[10px] text-muted-foreground">
                  Source: {elevation.source}
                </p>
              )}
            </motion.div>
          ) : (
            <div className="text-center py-4">
              <Mountain className="h-8 w-8 mx-auto mb-2 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">Elevation data unavailable</p>
            </div>
          )}
        </Card>

        {/* ── Transit & Parking Waiver ──────────────────────────────────── */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="rounded-md bg-amber-500/10 p-1.5">
              <Train className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
            </div>
            <h4 className="font-semibold text-sm">Transit & Parking Waiver</h4>
          </div>

          {transitLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-40" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-6 w-48" />
            </div>
          ) : transitError ? (
            <div className="text-center py-4">
              <Train className="h-8 w-8 mx-auto mb-2 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">{transitError}</p>
              <button
                onClick={fetchTransit}
                className="mt-2 text-xs text-amber-600 dark:text-amber-400 hover:underline"
              >
                Retry
              </button>
            </div>
          ) : transit ? (
            <motion.div
              className="space-y-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {/* Parking Waiver Badge — most prominent */}
              <div className="flex items-center gap-2">
                {transit.qualifiesForParkingWaiver ? (
                  <Badge
                    variant="outline"
                    className="text-[11px] gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 font-semibold"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Parking Waiver Eligible
                  </Badge>
                ) : (
                  <Badge
                    variant="outline"
                    className="text-[11px] gap-1.5 px-3 py-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 font-semibold"
                  >
                    <Car className="h-3.5 w-3.5" />
                    Parking Required
                  </Badge>
                )}
              </div>

              {/* Key stats */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Train className="h-3 w-3" />
                  <span>{transit.transitStopCount} stops nearby</span>
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  <span>{transit.nearestStopDistance < 1
                    ? `${Math.round(transit.nearestStopDistance * 5280)} ft`
                    : `${transit.nearestStopDistance.toFixed(1)} mi`} to nearest</span>
                </div>
              </div>

              {/* Transit types */}
              {transit.transitTypes.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {transit.transitTypes.map((type) => (
                    <Badge
                      key={type}
                      variant="secondary"
                      className="text-[10px]"
                    >
                      {type}
                    </Badge>
                  ))}
                </div>
              )}

              {/* Nearest major transit */}
              {transit.nearestMajorTransit && (
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium">Nearest Major:</span>{' '}
                  {transit.nearestMajorTransit}
                </p>
              )}

              {/* ADU Implications */}
              {transit.aduImplications.length > 0 && (
                <div className="rounded-md bg-muted/50 p-3 space-y-1.5">
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">
                    ADU Implications
                  </p>
                  <div className="space-y-1">
                    {transit.aduImplications.slice(0, 4).map((imp: string, i: number) => (
                      <p key={i} className="text-[11px] text-amber-600 dark:text-amber-400">
                        • {imp}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          ) : null}
        </Card>

        {/* ── Air Quality ───────────────────────────────────────────────── */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="rounded-md bg-sky-500/10 p-1.5">
              <AirVent className="h-3.5 w-3.5 text-sky-500" />
            </div>
            <h4 className="font-semibold text-sm">Air Quality</h4>
          </div>

          {airQualityLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ) : airQualityError ? (
            <div className="text-center py-4">
              <AirVent className="h-8 w-8 mx-auto mb-2 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">{airQualityError}</p>
              <button
                onClick={fetchAirQuality}
                className="mt-2 text-xs text-amber-600 dark:text-amber-400 hover:underline"
              >
                Retry
              </button>
            </div>
          ) : airQuality ? (
            <motion.div
              className="space-y-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {/* AQI Display */}
              <div className="flex items-center gap-3">
                <div className={`text-2xl font-bold ${getAqiBadge(airQuality.airQuality.aqi).color}`}>
                  {airQuality.airQuality.aqi}
                </div>
                <div>
                  <Badge
                    variant="outline"
                    className={`text-[10px] gap-1 ${getAqiBadge(airQuality.airQuality.aqi).bgColor} ${getAqiBadge(airQuality.airQuality.aqi).color}`}
                  >
                    <Wind className="h-3 w-3" />
                    {airQuality.airQuality.level}
                  </Badge>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    {airQuality.airQuality.description}
                  </p>
                </div>
              </div>

              {/* Pollutant Grid */}
              <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
                {[
                  { label: 'PM2.5', value: airQuality.pollutants.pm2_5.value, unit: 'µg/m³', who: airQuality.pollutants.pm2_5.whoGuideline, ok: airQuality.pollutants.pm2_5.withinWhoLimit },
                  { label: 'PM10', value: airQuality.pollutants.pm10.value, unit: 'µg/m³', who: airQuality.pollutants.pm10.whoGuideline, ok: airQuality.pollutants.pm10.withinWhoLimit },
                  { label: 'NO₂', value: airQuality.pollutants.no2.value, unit: 'µg/m³', who: airQuality.pollutants.no2.whoGuideline, ok: airQuality.pollutants.no2.withinWhoLimit },
                  { label: 'O₃', value: airQuality.pollutants.o3.value, unit: 'µg/m³', who: airQuality.pollutants.o3.whoGuideline, ok: airQuality.pollutants.o3.withinWhoLimit },
                ].map((p) => (
                  <div key={p.label} className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{p.label}</span>
                    <div className="flex items-center gap-1">
                      <span className={`font-medium ${p.ok ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
                        {p.value.toFixed(1)}
                      </span>
                      <span className="text-[10px] text-muted-foreground">{p.unit}</span>
                      <span className={`ml-0.5 ${p.ok ? 'text-emerald-500' : 'text-red-400'}`}>
                        {p.ok ? <CheckCircle2 className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Construction Suitability */}
              {airQuality.constructionSuitability && (
                <div className="rounded-md bg-muted/50 p-3 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium">Construction Suitability</span>
                    {(() => {
                      const badge = getConstructionSuitabilityBadge(airQuality.constructionSuitability.rating?.toLowerCase() || 'good');
                      return (
                        <Badge variant="outline" className={`text-[10px] gap-1 ${badge.color}`}>
                          <badge.icon className="h-3 w-3" />
                          {badge.label}
                        </Badge>
                      );
                    })()}
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {airQuality.constructionSuitability.description}
                  </p>
                </div>
              )}

              {/* Construction Guidance */}
              {airQuality.constructionGuidance.length > 0 && (
                <div className="space-y-1">
                  {airQuality.constructionGuidance.slice(0, 3).map((g: string, i: number) => (
                    <p key={i} className="text-[11px] text-amber-600 dark:text-amber-400">
                      • {g}
                    </p>
                  ))}
                </div>
              )}
            </motion.div>
          ) : null}
        </Card>

        {/* ── Seismic Risk ──────────────────────────────────────────────── */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="rounded-md bg-orange-500/10 p-1.5">
              <Waves className="h-3.5 w-3.5 text-orange-500" />
            </div>
            <h4 className="font-semibold text-sm">Seismic Risk</h4>
          </div>

          {seismicLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ) : seismicError ? (
            <div className="text-center py-4">
              <Waves className="h-8 w-8 mx-auto mb-2 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">{seismicError}</p>
              <button
                onClick={fetchSeismic}
                className="mt-2 text-xs text-amber-600 dark:text-amber-400 hover:underline"
              >
                Retry
              </button>
            </div>
          ) : seismic ? (
            <motion.div
              className="space-y-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {/* Zone & Risk Level Badges */}
              <div className="flex items-center gap-2 flex-wrap">
                <Badge
                  variant="outline"
                  className="text-[10px] gap-1 bg-muted/50"
                >
                  <TriangleAlert className="h-3 w-3 text-orange-500" />
                  Zone {seismic.seismicZone.zone}
                </Badge>
                <Badge
                  variant="outline"
                  className={`text-[10px] gap-1 ${getSeismicRiskBadge(seismic.seismicZone.riskLevel).bgColor} ${getSeismicRiskBadge(seismic.seismicZone.riskLevel).color}`}
                >
                  <Activity className="h-3 w-3" />
                  {seismic.seismicZone.riskLevel}
                </Badge>
              </div>

              {/* Major Faults */}
              {seismic.seismicZone.majorFaults.length > 0 && (
                <div className="space-y-1">
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">
                    Major Faults
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {seismic.seismicZone.majorFaults.map((fault) => (
                      <Badge
                        key={fault}
                        variant="secondary"
                        className="text-[10px]"
                      >
                        {fault}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Key stats */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Activity className="h-3 w-3" />
                  <span>{seismic.recentActivity.count} recent quakes</span>
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Gauge className="h-3 w-3" />
                  <span>Activity: {seismic.recentActivity.activityLevel}</span>
                </div>
              </div>

              {/* Nearest Earthquake */}
              {seismic.nearestEarthquake && (
                <div className="rounded-md bg-muted/50 p-3 space-y-1.5">
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">
                    Nearest Earthquake
                  </p>
                  <div className="grid grid-cols-2 gap-1.5 text-xs">
                    <div>
                      <span className="text-muted-foreground">Magnitude: </span>
                      <span className="font-medium">{seismic.nearestEarthquake.magnitude}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Distance: </span>
                      <span className="font-medium">{seismic.nearestEarthquake.distance.toFixed(1)} mi</span>
                    </div>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    {seismic.nearestEarthquake.location}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {seismic.nearestEarthquake.time}
                  </p>
                </div>
              )}

              {/* ADU Construction Implications */}
              {seismic.aduConstructionImplications && (
                <div className="space-y-1.5">
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">
                    ADU Construction Implications
                  </p>
                  {seismic.aduConstructionImplications.costEstimate && (
                    <div className="rounded-md bg-muted/30 p-2 text-xs flex items-center gap-1.5">
                      <span className="text-muted-foreground">Cost Impact:</span>
                      <span className="font-medium text-amber-600 dark:text-amber-400">
                        {seismic.aduConstructionImplications.costEstimate}
                      </span>
                    </div>
                  )}
                  {seismic.aduConstructionImplications.recommendations.slice(0, 3).map((rec: string, i: number) => (
                    <p key={i} className="text-[11px] text-amber-600 dark:text-amber-400">
                      • {rec}
                    </p>
                  ))}
                </div>
              )}
            </motion.div>
          ) : null}
        </Card>

        {/* Quick ADU Stats */}
        <Card className="p-4 lg:col-span-2">
          <div className="flex items-center gap-2 mb-3">
            <div className="rounded-md bg-amber-500/10 p-1.5">
              <Radio className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
            </div>
            <h4 className="font-semibold text-sm">Quick ADU Stats for {cityName}</h4>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              {
                label: 'Max Detached ADU',
                value: '800 sq ft',
                detail: 'Ministerial approval',
              },
              {
                label: 'Max Attached ADU',
                value: '1,200 sq ft',
                detail: '50% of primary dwelling',
              },
              {
                label: 'Max Height',
                value: '16 ft',
                detail: 'Detached, may be 18 ft',
              },
              {
                label: 'Setback',
                value: '4 ft',
                detail: 'Side/rear minimum',
              },
              {
                label: 'Review Period',
                value: '60 days',
                detail: 'Ministerial (by-right)',
              },
              {
                label: 'Parking',
                value: 'Varies',
                detail: 'Often waived near transit',
              },
              {
                label: 'Impact Fees',
                value: 'Capped',
                detail: '≤ 750 sq ft: reduced/waived',
              },
              {
                label: 'Owner-Occupy',
                value: 'Not Required',
                detail: 'For ADUs after Jan 2020',
              },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-md bg-muted/30 p-2.5 space-y-1"
              >
                <p className="text-[10px] text-muted-foreground">{stat.label}</p>
                <p className="text-sm font-bold text-amber-600 dark:text-amber-400">
                  {stat.value}
                </p>
                <p className="text-[10px] text-muted-foreground">{stat.detail}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
