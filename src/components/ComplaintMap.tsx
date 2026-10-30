/**
 * CivicPulse AI - Interactive Leaflet Map & Dynamic Indian City Search
 * Features:
 * - Dynamic geocoding for ANY valid Indian city (OpenStreetMap Nominatim + local cache)
 * - Immediate map flyTo on city selection
 * - Strict city-level isolation (when Haveri is selected, ONLY Haveri complaints are shown)
 * - Color-coded markers (Red=Critical, Orange=High, Yellow=Medium, Green=Low)
 * - Subtle hotspot circles that do not obscure markers
 * - Zero-complaint empty state display
 * - Tab-change invalidation to prevent grey tile glitches
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import L from 'leaflet';
import {
  Search,
  MapPin,
  AlertTriangle,
  Flame,
  AlertOctagon,
  Layers,
  Sparkles,
  Info,
  Loader2,
  X,
  Navigation,
  CheckCircle2,
} from 'lucide-react';
import { Complaint, PriorityLevel, CityGeocodeResult } from '../types/index.ts';
import { searchCitiesGeocode } from '../services/api.ts';

interface ComplaintMapProps {
  complaints: Complaint[];
  selectedCity: string;
  onSelectCity: (city: string) => void;
  onOpenComplaintModal: (complaint: Complaint) => void;
}

// Map center points
const KARNATAKA_CENTER: [number, number] = [15.1, 75.7];
const INDIA_CENTER: [number, number] = [21.7679, 78.8718];

const QUICK_CITIES = [
  { name: 'Karnataka Overview', city: 'All Cities', lat: 15.1, lng: 75.7, zoom: 7 },
  { name: 'Haveri', city: 'Haveri', lat: 14.7954, lng: 75.3986, zoom: 13 },
  { name: 'Bengaluru', city: 'Bengaluru', lat: 12.9716, lng: 77.5946, zoom: 12 },
  { name: 'Mysuru', city: 'Mysuru', lat: 12.2958, lng: 76.6394, zoom: 13 },
  { name: 'Hubballi', city: 'Hubballi', lat: 15.3647, lng: 75.124, zoom: 13 },
  { name: 'Dharwad', city: 'Dharwad', lat: 15.4589, lng: 75.0078, zoom: 13 },
  { name: 'Mangaluru', city: 'Mangaluru', lat: 12.9141, lng: 74.856, zoom: 13 },
  { name: 'Ranebennur', city: 'Ranebennur', lat: 14.6225, lng: 75.6219, zoom: 14 },
  { name: 'Belagavi', city: 'Belagavi', lat: 15.8497, lng: 74.4977, zoom: 13 },
];

export const ComplaintMap: React.FC<ComplaintMapProps> = ({
  complaints,
  selectedCity,
  onSelectCity,
  onOpenComplaintModal,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const hotspotsLayerRef = useRef<L.LayerGroup | null>(null);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<CityGeocodeResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);

  // Map Filter state
  const [filterPriority, setFilterPriority] = useState<string>('All');
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [showHotspots, setShowHotspots] = useState(true);

  // Filter complaints based on Selected City + Priority + Category
  const visibleComplaints = useMemo(() => {
    return complaints.filter(c => {
      // STRICT CITY ISOLATION: When a specific city is selected (e.g. Haveri),
      // DO NOT show complaints from other cities!
      if (selectedCity && selectedCity !== 'All' && selectedCity !== 'All Cities') {
        if (c.location.city.toLowerCase() !== selectedCity.toLowerCase()) {
          return false;
        }
      }

      // Priority filter
      if (filterPriority !== 'All' && c.priority !== filterPriority) return false;

      // Category filter
      if (filterCategory !== 'All' && c.category !== filterCategory) return false;

      return true;
    });
  }, [complaints, selectedCity, filterPriority, filterCategory]);

  // City-level stats
  const cityStats = useMemo(() => {
    const total = visibleComplaints.length;
    const critical = visibleComplaints.filter(c => c.priority === 'Critical').length;
    const high = visibleComplaints.filter(c => c.priority === 'High').length;
    const medium = visibleComplaints.filter(c => c.priority === 'Medium').length;
    const low = visibleComplaints.filter(c => c.priority === 'Low').length;
    return { total, critical, high, medium, low };
  }, [visibleComplaints]);

  // 1. Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return; // already initialized

    const map = L.map(mapContainerRef.current, {
      center: KARNATAKA_CENTER,
      zoom: 7,
      zoomControl: true,
      attributionControl: false,
    });

    // OpenStreetMap standard tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap contributors',
    }).addTo(map);

    // Attribution
    L.control.attribution({ position: 'bottomright', prefix: false })
      .addAttribution('OpenStreetMap • CivicPulse AI')
      .addTo(map);

    // Layer groups for markers and hotspots
    const hotspotsLayer = L.layerGroup().addTo(map);
    const markersLayer = L.layerGroup().addTo(map);

    mapInstanceRef.current = map;
    hotspotsLayerRef.current = hotspotsLayer;
    markersLayerRef.current = markersLayer;

    // Invalidate size to ensure proper rendering
    setTimeout(() => {
      map.invalidateSize();
    }, 150);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // 2. Invalidate map size on tab changes or resize
  useEffect(() => {
    const handleResize = () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    };
    window.addEventListener('resize', handleResize);
    const timer = setTimeout(handleResize, 300);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timer);
    };
  }, []);

  // 3. Move map when selectedCity changes
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    if (selectedCity === 'All Cities' || selectedCity === 'All') {
      mapInstanceRef.current.flyTo(KARNATAKA_CENTER, 7, { duration: 1.2 });
      return;
    }

    const quick = QUICK_CITIES.find(
      q => q.city.toLowerCase() === selectedCity.toLowerCase()
    );

    if (quick) {
      mapInstanceRef.current.flyTo([quick.lat, quick.lng], quick.zoom, { duration: 1.2 });
    } else {
      // Find coordinates from any complaints in that city
      const matched = complaints.find(
        c => c.location.city.toLowerCase() === selectedCity.toLowerCase()
      );
      if (matched) {
        mapInstanceRef.current.flyTo([matched.location.lat, matched.location.lng], 13, { duration: 1.2 });
      }
    }
  }, [selectedCity, complaints]);

  // 4. Render Markers and Hotspots
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current || !hotspotsLayerRef.current) return;

    const markersLayer = markersLayerRef.current;
    const hotspotsLayer = hotspotsLayerRef.current;

    markersLayer.clearLayers();
    hotspotsLayer.clearLayers();

    // Hotspot clustering: find clusters with >= 2 complaints within ~1.2km
    if (showHotspots && visibleComplaints.length >= 2) {
      const visited = new Set<string>();
      for (let i = 0; i < visibleComplaints.length; i++) {
        const c1 = visibleComplaints[i];
        if (visited.has(c1.id)) continue;

        const cluster = [c1];
        for (let j = i + 1; j < visibleComplaints.length; j++) {
          const c2 = visibleComplaints[j];
          const dLat = c1.location.lat - c2.location.lat;
          const dLng = c1.location.lng - c2.location.lng;
          const distKm = Math.sqrt(dLat * dLat + dLng * dLng) * 111;
          if (distKm <= 1.2) {
            cluster.push(c2);
            visited.add(c2.id);
          }
        }

        if (cluster.length >= 2) {
          const avgLat = cluster.reduce((sum, c) => sum + c.location.lat, 0) / cluster.length;
          const avgLng = cluster.reduce((sum, c) => sum + c.location.lng, 0) / cluster.length;
          const hasCritical = cluster.some(c => c.priority === 'Critical');

          // Subtle, semi-transparent circle that DOES NOT obscure markers
          const circle = L.circle([avgLat, avgLng], {
            radius: 700,
            color: hasCritical ? '#ef4444' : '#f59e0b',
            fillColor: hasCritical ? '#f87171' : '#fbbf24',
            fillOpacity: 0.15,
            weight: 1.5,
            dashArray: '4, 4',
          });

          circle.bindTooltip(
            `<strong>${c1.location.area} Hotspot</strong><br/>${cluster.length} complaints clustered`,
            { direction: 'top', className: 'hotspot-tooltip' }
          );

          hotspotsLayer.addLayer(circle);
        }
      }
    }

    // Render complaint markers (8-12px radius circle markers)
    visibleComplaints.forEach(c => {
      const isCritical = c.priority === 'Critical';
      const isHigh = c.priority === 'High';
      const isMedium = c.priority === 'Medium';

      const color = isCritical
        ? '#ef4444' // Red
        : isHigh
        ? '#f97316' // Orange
        : isMedium
        ? '#eab308' // Yellow
        : '#22c55e'; // Green

      const radius = isCritical ? 11 : isHigh ? 10 : 8;

      const marker = L.circleMarker([c.location.lat, c.location.lng], {
        radius,
        fillColor: color,
        color: '#ffffff',
        weight: 2,
        opacity: 1,
        fillOpacity: 0.9,
      });

      // Interactive popup
      const popupContent = document.createElement('div');
      popupContent.className = 'p-1 text-slate-800 text-xs';
      popupContent.innerHTML = `
        <div style="font-family: inherit;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
            <span style="font-family: monospace; font-weight:bold; color:#1d4ed8;">${c.id}</span>
            <span style="font-weight:bold; font-size:10px; padding:2px 6px; border-radius:9999px; background:${color}20; color:${color};">
              ${c.priority} (${c.aiAnalysis.priorityScore.total}/100)
            </span>
          </div>
          <div style="font-weight:bold; font-size:13px; color:#0f172a; margin-bottom:4px;">${c.title}</div>
          <div style="font-size:11px; color:#64748b; margin-bottom:6px;">
            📍 ${c.location.area}, ${c.location.city}
          </div>
          <div style="display:flex; justify-content:space-between; align-items:center; font-size:11px; margin-bottom:8px;">
            <span style="background:#f1f5f9; padding:2px 6px; border-radius:4px; font-weight:600;">${c.category}</span>
            <span style="font-weight:600; color:#475569;">Status: ${c.status}</span>
          </div>
          <button id="btn-inspect-${c.id}" style="width:100%; padding:6px 10px; background:#2563eb; color:white; font-weight:bold; font-size:11px; border-radius:6px; border:none; cursor:pointer;">
            Inspect Complaint
          </button>
        </div>
      `;

      popupContent.querySelector(`#btn-inspect-${c.id}`)?.addEventListener('click', () => {
        onOpenComplaintModal(c);
      });

      marker.bindPopup(popupContent, { maxWidth: 300 });
      markersLayer.addLayer(marker);
    });
  }, [visibleComplaints, showHotspots, onOpenComplaintModal]);

  // Debounced City Search
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      setSearchError(null);
      try {
        const results = await searchCitiesGeocode(searchQuery);
        setSearchResults(results);
        setShowDropdown(results.length > 0);
        if (results.length === 0) {
          setSearchError(`No coordinates found for "${searchQuery}". Please check spelling.`);
        }
      } catch (err) {
        setSearchError('Geocoding service unavailable. Please retry.');
      } finally {
        setIsSearching(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Select a searched city
  const handleSelectCityResult = (res: CityGeocodeResult) => {
    setSearchQuery('');
    setShowDropdown(false);
    onSelectCity(res.city);

    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([res.lat, res.lng], 13, { duration: 1.2 });
    }
  };

  return (
    <div className="space-y-4">
      {/* Search Bar & City Selector Header */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Dynamic Geocoding Search Input */}
          <div className="relative w-full sm:max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => {
                setSearchQuery(e.target.value);
                setShowDropdown(true);
              }}
              onFocus={() => setShowDropdown(searchResults.length > 0)}
              placeholder="Search any Indian city (e.g. Haveri, Dharwad, Pune)..."
              className="w-full pl-9 pr-9 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
            />
            {isSearching && (
              <Loader2 className="w-4 h-4 text-blue-600 animate-spin absolute right-3 top-2.5" />
            )}
            {searchQuery && !isSearching && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSearchResults([]);
                  setShowDropdown(false);
                }}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            {/* Autocomplete Dropdown */}
            {showDropdown && searchResults.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-50 max-h-60 overflow-y-auto divide-y divide-slate-100 text-xs">
                {searchResults.map((res, i) => (
                  <button
                    key={i}
                    onClick={() => handleSelectCityResult(res)}
                    className="w-full p-2.5 text-left hover:bg-blue-50 flex items-center justify-between gap-2 transition-colors"
                  >
                    <div>
                      <span className="font-bold text-slate-900 block">{res.city}</span>
                      <span className="text-[11px] text-slate-500 truncate block max-w-xs">
                        {res.displayName}
                      </span>
                    </div>
                    <span className="text-[10px] text-blue-600 font-mono shrink-0">
                      {res.lat.toFixed(2)}°, {res.lng.toFixed(2)}°
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end text-xs">
            {/* Priority Filter */}
            <select
              value={filterPriority}
              onChange={e => setFilterPriority(e.target.value)}
              className="px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white text-slate-800"
            >
              <option value="All">All Priorities</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>

            {/* Category Filter */}
            <select
              value={filterCategory}
              onChange={e => setFilterCategory(e.target.value)}
              className="px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white text-slate-800 max-w-[150px] truncate"
            >
              <option value="All">All Categories</option>
              <option value="Roads and potholes">Roads</option>
              <option value="Drainage and sewage">Drainage</option>
              <option value="Electrical hazards">Electrical</option>
              <option value="Waterlogging">Waterlogging</option>
              <option value="Water supply">Water Supply</option>
              <option value="Streetlights">Streetlights</option>
              <option value="Garbage and waste management">Garbage</option>
              <option value="Public infrastructure">Public Infra</option>
            </select>

            {/* Hotspots Toggle */}
            <button
              onClick={() => setShowHotspots(!showHotspots)}
              className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                showHotspots
                  ? 'bg-amber-50 border-amber-300 text-amber-800'
                  : 'bg-white border-slate-300 text-slate-600'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-amber-600" />
              <span>Hotspots</span>
            </button>
          </div>
        </div>

        {/* Quick Jump City Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar pt-1 border-t border-slate-100">
          <span className="text-[11px] font-semibold text-slate-500 whitespace-nowrap mr-1">
            Quick Cities:
          </span>
          {QUICK_CITIES.map(q => {
            const isSelected = selectedCity.toLowerCase() === q.city.toLowerCase();
            return (
              <button
                key={q.name}
                onClick={() => onSelectCity(q.city)}
                className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition-colors text-[11px] ${
                  isSelected
                    ? 'bg-blue-600 text-white font-bold shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                {q.name}
              </button>
            );
          })}
        </div>

        {searchError && (
          <p className="text-xs text-red-600 font-medium">{searchError}</p>
        )}
      </div>

      {/* Selected City & Active Statistics Bar */}
      <div className="bg-slate-900 text-white p-3.5 sm:p-4 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-red-400" />
          <span className="font-bold text-sm text-slate-100">
            {selectedCity === 'All Cities' || selectedCity === 'All'
              ? 'Karnataka State Overview'
              : `${selectedCity} Municipal Jurisdiction`}
          </span>
          <span className="text-slate-400">•</span>
          <span className="text-slate-300 font-medium">
            <strong>{cityStats.total}</strong> active grievance{cityStats.total === 1 ? '' : 's'}
          </span>
        </div>

        {/* Priority breakdown counters */}
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-red-950/80 text-red-300 border border-red-800 text-[11px] font-semibold">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            Critical: {cityStats.critical}
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-orange-950/80 text-orange-300 border border-orange-800 text-[11px] font-semibold">
            <span className="w-2 h-2 rounded-full bg-orange-500" />
            High: {cityStats.high}
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-yellow-950/80 text-yellow-300 border border-yellow-800 text-[11px] font-semibold">
            <span className="w-2 h-2 rounded-full bg-yellow-500" />
            Medium: {cityStats.medium}
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-green-950/80 text-green-300 border border-green-800 text-[11px] font-semibold">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            Low: {cityStats.low}
          </span>
        </div>
      </div>

      {/* ZERO COMPLAINTS EMPTY STATE BANNER */}
      {cityStats.total === 0 && selectedCity !== 'All Cities' && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3 text-xs text-blue-900">
          <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block text-sm mb-0.5">
              No Complaints Reported Yet in {selectedCity}
            </span>
            <p className="text-blue-800">
              The municipal geographic map is active and centered on {selectedCity}. As soon as citizens in this area submit reports, they will immediately appear on this map.
            </p>
          </div>
        </div>
      )}

      {/* Actual Leaflet Map View Container */}
      <div className="relative rounded-2xl overflow-hidden border border-slate-300 shadow-md">
        <div
          ref={mapContainerRef}
          className="w-full h-[520px] bg-slate-100 z-10"
        />

        {/* Map Legend Overlay */}
        <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-xs p-3 rounded-xl border border-slate-200 shadow-lg z-20 text-[11px] space-y-1.5">
          <div className="font-bold text-slate-800 uppercase tracking-wider text-[10px] mb-1">
            Grievance Severity Legend
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-500 border border-white shadow-xs" />
            <span className="text-slate-700 font-medium">Critical Priority (Score ≥ 50)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-orange-500 border border-white shadow-xs" />
            <span className="text-slate-700 font-medium">High Priority (Score 30–49)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-yellow-500 border border-white shadow-xs" />
            <span className="text-slate-700 font-medium">Medium Priority (Score 15–29)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-green-500 border border-white shadow-xs" />
            <span className="text-slate-700 font-medium">Low Priority (Score &lt; 15)</span>
          </div>
          {showHotspots && (
            <div className="flex items-center gap-2 pt-1 border-t border-slate-200">
              <span className="w-3.5 h-3.5 rounded-full border border-dashed border-amber-600 bg-amber-400/20" />
              <span className="text-amber-800 font-medium">Repeated Complaint Hotspot</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
