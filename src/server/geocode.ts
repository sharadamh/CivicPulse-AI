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
  bagalkote: {
    city: 'Bagalkote',
    state: 'Karnataka',
    lat: 16.1818,
    lng: 75.6958,
    displayName: 'Bagalkote, Karnataka, India',
    bounds: [16.14, 75.65, 16.22, 75.74],
  },
  chamarajanagar: {
    city: 'Chamarajanagar',
    state: 'Karnataka',
    lat: 11.9261,
    lng: 76.9437,
    displayName: 'Chamarajanagar, Karnataka, India',
    bounds: [11.88, 76.9, 11.97, 76.99],
  },
  chikkamagaluru: {
    city: 'Chikkamagaluru',
    state: 'Karnataka',
    lat: 13.3161,
    lng: 75.772,
    displayName: 'Chikkamagaluru, Karnataka, India',
    bounds: [13.27, 75.72, 13.36, 75.82],
  },
  chitradurga: {
    city: 'Chitradurga',
    state: 'Karnataka',
    lat: 14.2251,
    lng: 76.398,
    displayName: 'Chitradurga, Karnataka, India',
    bounds: [14.18, 76.35, 14.27, 76.45],
  },
  gadag: {
    city: 'Gadag',
    state: 'Karnataka',
    lat: 15.4297,
    lng: 75.6318,
    displayName: 'Gadag-Betageri, Karnataka, India',
    bounds: [15.38, 75.58, 15.47, 75.68],
  },
  kolar: {
    city: 'Kolar',
    state: 'Karnataka',
    lat: 13.1358,
    lng: 78.1328,
    displayName: 'Kolar, Karnataka, India',
    bounds: [13.09, 78.08, 13.18, 78.18],
  },
  koppal: {
    city: 'Koppal',
    state: 'Karnataka',
    lat: 15.3444,
    lng: 76.1558,
    displayName: 'Koppal, Karnataka, India',
    bounds: [15.3, 76.11, 15.39, 76.2],
  },
  mandya: {
    city: 'Mandya',
    state: 'Karnataka',
    lat: 12.5238,
    lng: 76.897,
    displayName: 'Mandya, Karnataka, India',
    bounds: [12.48, 76.85, 12.57, 76.95],
  },
  raichur: {
    city: 'Raichur',
    state: 'Karnataka',
    lat: 16.2076,
    lng: 77.3463,
    displayName: 'Raichur, Karnataka, India',
    bounds: [16.16, 77.3, 16.25, 77.4],
  },
  ramanagara: {
    city: 'Ramanagara',
    state: 'Karnataka',
    lat: 12.7209,
    lng: 77.2799,
    displayName: 'Ramanagara, Karnataka, India',
    bounds: [12.67, 77.23, 12.77, 77.33],
  },
  yadgir: {
    city: 'Yadgir',
    state: 'Karnataka',
    lat: 16.7622,
    lng: 77.1378,
    displayName: 'Yadgir, Karnataka, India',
    bounds: [16.71, 77.09, 16.81, 77.19],
  },
  hosapete: {
    city: 'Hosapete',
    state: 'Karnataka',
    lat: 15.2689,
    lng: 76.3909,
    displayName: 'Hosapete (Vijayanagara), Karnataka, India',
    bounds: [15.22, 76.34, 15.31, 76.44],
  },
  karwar: {
    city: 'Karwar',
    state: 'Karnataka',
    lat: 14.8185,
    lng: 74.1352,
    displayName: 'Karwar (Uttara Kannada), Karnataka, India',
    bounds: [14.77, 74.09, 14.86, 74.18],
  },
  madikeri: {
    city: 'Madikeri',
    state: 'Karnataka',
    lat: 12.4244,
    lng: 75.7382,
    displayName: 'Madikeri (Kodagu), Karnataka, India',
    bounds: [12.38, 75.69, 12.47, 75.78],
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

const KNOWN_LANDMARKS: Record<string, { lat: number; lng: number }> = {
  // Haveri
  'haveri_old bus stand road': { lat: 14.7972, lng: 75.3995 },
  'haveri_shivaji nagar': { lat: 14.7912, lng: 75.4041 },
  'haveri_apmc market yard': { lat: 14.8021, lng: 75.3912 },
  'haveri_pb road': { lat: 14.7895, lng: 75.4012 },
  'haveri_ashwini nagar': { lat: 14.7942, lng: 75.4088 },
  'haveri_railway station': { lat: 14.7933, lng: 75.3944 },
  'haveri_vidya nagar': { lat: 14.8011, lng: 75.4065 },
  'haveri_gandhi circle': { lat: 14.7961, lng: 75.3989 },
  'haveri_market area': { lat: 14.7958, lng: 75.3975 },
  // Bengaluru
  'bengaluru_silk board junction': { lat: 12.9172, lng: 77.6228 },
  'bengaluru_indiranagar 100ft road': { lat: 12.9719, lng: 77.6412 },
  'bengaluru_koramangala 4th block': { lat: 12.9345, lng: 77.6265 },
  'bengaluru_whitefield itpl': { lat: 12.9854, lng: 77.7289 },
  'bengaluru_malleshwaram': { lat: 13.0033, lng: 77.5694 },
  'bengaluru_jayanagar': { lat: 12.9298, lng: 77.5835 },
  // Mysuru
  'mysuru_devaraja market': { lat: 12.3112, lng: 76.6521 },
  'mysuru_vijayanagar 2nd stage': { lat: 12.3389, lng: 76.6145 },
  'mysuru_kuvempunagar': { lat: 12.2891, lng: 76.6278 },
  // Hubballi
  'hubballi_gokul road': { lat: 15.3582, lng: 75.1123 },
  'hubballi_chennamma circle': { lat: 15.3619, lng: 75.1384 },
  'hubballi_keshwapur': { lat: 15.3695, lng: 75.1481 },
};

export async function geocodeAddress(
  area: string,
  city: string,
  landmark?: string
): Promise<{ lat: number; lng: number; displayName: string }> {
  const cityClean = (city || 'Haveri').trim().toLowerCase();
  const areaClean = (area || '').trim().toLowerCase();
  const landmarkClean = (landmark || '').trim().toLowerCase();

  // 1. Check known landmark
  const landmarkKey = `${cityClean}_${landmarkClean}`;
  const areaKey = `${cityClean}_${areaClean}`;
  if (landmarkClean && KNOWN_LANDMARKS[landmarkKey]) {
    const loc = KNOWN_LANDMARKS[landmarkKey];
    return { lat: loc.lat, lng: loc.lng, displayName: `${landmark}, ${area}, ${city}, Karnataka` };
  }
  if (KNOWN_LANDMARKS[areaKey]) {
    const loc = KNOWN_LANDMARKS[areaKey];
    return { lat: loc.lat, lng: loc.lng, displayName: `${area}, ${city}, Karnataka` };
  }

  // 2. Try live Nominatim search
  try {
    const query = `${landmark ? landmark + ', ' : ''}${area}, ${city}, Karnataka, India`;
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
      query
    )}&format=json&limit=1&addressdetails=1`;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3500);
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'CivicPulse-AI/1.0 (Hackathon Civic Problem Solver; civicpulse@hackathon.org)',
        Accept: 'application/json',
      },
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        return {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon),
          displayName: data[0].display_name,
        };
      }
    }
  } catch (err) {
    // fallback
  }

  // 3. City Center Baseline + Deterministic Local Offset
  const cityInfo = PRELOADED_CITIES[cityClean] || PRELOADED_CITIES['haveri'];

  let hash = 0;
  const str = `${areaClean} ${landmarkClean}`;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  const latOffset = ((Math.abs(hash) % 100) - 50) * 0.0003;
  const lngOffset = ((Math.abs(hash * 31) % 100) - 50) * 0.0003;

  return {
    lat: Number((cityInfo.lat + latOffset).toFixed(5)),
    lng: Number((cityInfo.lng + lngOffset).toFixed(5)),
    displayName: `${landmark ? landmark + ', ' : ''}${area}, ${cityInfo.city}, ${cityInfo.state}, India`,
  };
}
