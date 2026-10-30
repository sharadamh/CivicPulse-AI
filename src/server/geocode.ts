/**
 * CivicPulse AI - Resilient Geocoding Service
 * Provides server-side cached geocoding for any city in India via Nominatim with preloaded Karnataka coordinates.
 */

import { CityGeocodeResult } from '../types/index.ts';

const PRELOADED_CITIES: Record<string, CityGeocodeResult> = {
  haveri: {
    city: 'Haveri',
    state: 'Karnataka',
    lat: 14.7954,
    lng: 75.3986,
    displayName: 'Haveri, Karnataka, India',
    bounds: [14.76, 75.36, 14.83, 75.43],
  },
  bengaluru: {
    city: 'Bengaluru',
    state: 'Karnataka',
    lat: 12.9716,
    lng: 77.5946,
    displayName: 'Bengaluru, Karnataka, India',
    bounds: [12.83, 77.46, 13.14, 77.75],
  },
  bangalore: {
    city: 'Bengaluru',
    state: 'Karnataka',
    lat: 12.9716,
    lng: 77.5946,
    displayName: 'Bengaluru, Karnataka, India',
    bounds: [12.83, 77.46, 13.14, 77.75],
  },
  mysuru: {
    city: 'Mysuru',
    state: 'Karnataka',
    lat: 12.2958,
    lng: 76.6394,
    displayName: 'Mysuru, Karnataka, India',
    bounds: [12.24, 76.58, 12.36, 76.71],
  },
  mysore: {
    city: 'Mysuru',
    state: 'Karnataka',
    lat: 12.2958,
    lng: 76.6394,
    displayName: 'Mysuru, Karnataka, India',
    bounds: [12.24, 76.58, 12.36, 76.71],
  },
  hubballi: {
    city: 'Hubballi',
    state: 'Karnataka',
    lat: 15.3647,
    lng: 75.124,
    displayName: 'Hubballi, Dharwad, Karnataka, India',
    bounds: [15.31, 75.07, 15.41, 75.18],
  },
  hubli: {
    city: 'Hubballi',
    state: 'Karnataka',
    lat: 15.3647,
    lng: 75.124,
    displayName: 'Hubballi, Dharwad, Karnataka, India',
    bounds: [15.31, 75.07, 15.41, 75.18],
  },
  dharwad: {
    city: 'Dharwad',
    state: 'Karnataka',
    lat: 15.4589,
    lng: 75.0078,
    displayName: 'Dharwad, Karnataka, India',
    bounds: [15.41, 74.96, 15.51, 75.06],
  },
  mangaluru: {
    city: 'Mangaluru',
    state: 'Karnataka',
    lat: 12.9141,
    lng: 74.856,
    displayName: 'Mangaluru, Dakshina Kannada, Karnataka, India',
    bounds: [12.82, 74.8, 12.99, 74.91],
  },
  mangalore: {
    city: 'Mangaluru',
    state: 'Karnataka',
    lat: 12.9141,
    lng: 74.856,
    displayName: 'Mangaluru, Dakshina Kannada, Karnataka, India',
    bounds: [12.82, 74.8, 12.99, 74.91],
  },
  belagavi: {
    city: 'Belagavi',
    state: 'Karnataka',
    lat: 15.8497,
    lng: 74.4977,
    displayName: 'Belagavi, Karnataka, India',
    bounds: [15.8, 74.44, 15.91, 74.56],
  },
  belgaum: {
    city: 'Belagavi',
    state: 'Karnataka',
    lat: 15.8497,
    lng: 74.4977,
    displayName: 'Belagavi, Karnataka, India',
    bounds: [15.8, 74.44, 15.91, 74.56],
  },
  ranebennur: {
    city: 'Ranebennur',
    state: 'Karnataka',
    lat: 14.6225,
    lng: 75.6219,
    displayName: 'Ranebennur, Haveri, Karnataka, India',
    bounds: [14.58, 75.58, 14.66, 75.66],
  },
  davanagere: {
    city: 'Davanagere',
    state: 'Karnataka',
    lat: 14.4644,
    lng: 75.9218,
    displayName: 'Davanagere, Karnataka, India',
    bounds: [14.41, 75.87, 14.51, 75.97],
  },
  shivamogga: {
    city: 'Shivamogga',
    state: 'Karnataka',
    lat: 13.9299,
    lng: 75.5681,
    displayName: 'Shivamogga, Karnataka, India',
    bounds: [13.88, 75.51, 13.98, 75.62],
  },
  shimoga: {
    city: 'Shivamogga',
    state: 'Karnataka',
    lat: 13.9299,
    lng: 75.5681,
    displayName: 'Shivamogga, Karnataka, India',
    bounds: [13.88, 75.51, 13.98, 75.62],
  },
  ballari: {
    city: 'Ballari',
    state: 'Karnataka',
    lat: 15.1394,
    lng: 76.9214,
    displayName: 'Ballari, Karnataka, India',
    bounds: [15.09, 76.87, 15.19, 76.97],
  },
  kalaburagi: {
    city: 'Kalaburagi',
    state: 'Karnataka',
    lat: 17.3297,
    lng: 76.8343,
    displayName: 'Kalaburagi, Karnataka, India',
    bounds: [17.27, 76.78, 17.38, 76.89],
  },
  udupi: {
    city: 'Udupi',
    state: 'Karnataka',
    lat: 13.3409,
    lng: 74.7421,
    displayName: 'Udupi, Karnataka, India',
    bounds: [13.3, 74.7, 13.39, 74.79],
  },
  tumakuru: {
    city: 'Tumakuru',
    state: 'Karnataka',
    lat: 13.3379,
    lng: 77.1173,
    displayName: 'Tumakuru, Karnataka, India',
    bounds: [13.29, 77.06, 13.38, 77.16],
  },
  vijayapura: {
    city: 'Vijayapura',
    state: 'Karnataka',
    lat: 16.8302,
    lng: 75.71,
    displayName: 'Vijayapura, Karnataka, India',
    bounds: [16.78, 75.66, 16.88, 75.76],
  },
  bidar: {
    city: 'Bidar',
    state: 'Karnataka',
    lat: 17.9104,
    lng: 77.5199,
    displayName: 'Bidar, Karnataka, India',
    bounds: [17.86, 77.47, 17.96, 77.57],
  },
  hassan: {
    city: 'Hassan',
    state: 'Karnataka',
    lat: 13.0033,
    lng: 76.1004,
    displayName: 'Hassan, Karnataka, India',
    bounds: [12.95, 76.05, 13.05, 76.15],
  },
  delhi: {
    city: 'Delhi',
    state: 'Delhi',
    lat: 28.6139,
    lng: 77.209,
    displayName: 'New Delhi, Delhi, India',
  },
  mumbai: {
    city: 'Mumbai',
    state: 'Maharashtra',
    lat: 19.076,
    lng: 72.8777,
    displayName: 'Mumbai, Maharashtra, India',
  },
  pune: {
    city: 'Pune',
    state: 'Maharashtra',
    lat: 18.5204,
    lng: 73.8567,
    displayName: 'Pune, Maharashtra, India',
  },
  chennai: {
    city: 'Chennai',
    state: 'Tamil Nadu',
    lat: 13.0827,
    lng: 80.2707,
    displayName: 'Chennai, Tamil Nadu, India',
  },
  hyderabad: {
    city: 'Hyderabad',
    state: 'Telangana',
    lat: 17.385,
    lng: 78.4867,
    displayName: 'Hyderabad, Telangana, India',
  },
};

// In-memory cache for live searches
const SEARCH_CACHE = new Map<string, CityGeocodeResult[]>();

export async function searchCity(query: string): Promise<CityGeocodeResult[]> {
  const clean = query.trim().toLowerCase();
  if (!clean || clean.length < 2) return [];

  // Check memory cache
  if (SEARCH_CACHE.has(clean)) {
    return SEARCH_CACHE.get(clean)!;
  }

  // Check preloaded first
  const preloadedMatches: CityGeocodeResult[] = [];
  for (const [key, val] of Object.entries(PRELOADED_CITIES)) {
    if (key.includes(clean) || clean.includes(key)) {
      if (!preloadedMatches.some(m => m.city.toLowerCase() === val.city.toLowerCase())) {
        preloadedMatches.push(val);
      }
    }
  }

  if (preloadedMatches.length > 0) {
    SEARCH_CACHE.set(clean, preloadedMatches);
    return preloadedMatches;
  }

  // Live query to OpenStreetMap Nominatim with safe User-Agent & timeout
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
      query + ', India'
    )}&format=json&limit=5&addressdetails=1`;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(url, {
      headers: {
        'User-Agent': 'CivicPulse-AI/1.0 (Hackathon Civic Problem Solver; civicpulse@hackathon.org)',
        Accept: 'application/json',
      },
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (res.ok) {
      const data = (await res.json()) as Array<{
        display_name: string;
        lat: string;
        lon: string;
        address?: {
          city?: string;
          town?: string;
          village?: string;
          state?: string;
          county?: string;
        };
        boundingbox?: [string, string, string, string];
      }>;

      const results: CityGeocodeResult[] = data.map(item => {
        const cityName =
          item.address?.city ||
          item.address?.town ||
          item.address?.village ||
          item.address?.county ||
          query.charAt(0).toUpperCase() + query.slice(1);

        return {
          city: cityName,
          state: item.address?.state || 'India',
          lat: parseFloat(item.lat),
          lng: parseFloat(item.lon),
          displayName: item.display_name,
          bounds: item.boundingbox
            ? [
                parseFloat(item.boundingbox[0]),
                parseFloat(item.boundingbox[2]),
                parseFloat(item.boundingbox[1]),
                parseFloat(item.boundingbox[3]),
              ]
            : undefined,
        };
      });

      if (results.length > 0) {
        SEARCH_CACHE.set(clean, results);
        return results;
      }
    }
  } catch (err) {
    console.warn(`Nominatim geocoding failed for "${query}", using heuristic fallback:`, err);
  }

  return [];
}
