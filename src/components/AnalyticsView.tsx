/**
 * CivicPulse AI - Analytics & Municipal Intelligence Insights
 * Uses actual dynamic complaint data to render interactive visual breakdown,
 * departmental workload, hotspot identification, and Gemini-pattern action recommendations.
 */

import React, { useMemo } from 'react';
import {
  BarChart3,
  PieChart,
  TrendingUp,
  Sparkles,
  Building2,
  MapPin,
  CheckCircle2,
  Clock,
  AlertOctagon,
  Flame,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import { Complaint } from '../types/index.ts';

interface AnalyticsViewProps {
  complaints: Complaint[];
  selectedCity: string;
  onSelectCity: (city: string) => void;
  onOpenComplaintModal: (complaint: Complaint) => void;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  complaints,
  selectedCity,
  onSelectCity,
  onOpenComplaintModal,
}) => {
  // Filter complaints based on city selection
  const filtered = useMemo(() => {
    if (selectedCity && selectedCity !== 'All Cities' && selectedCity !== 'All') {
      return complaints.filter(c => c.location.city.toLowerCase() === selectedCity.toLowerCase());
    }
    return complaints;
  }, [complaints, selectedCity]);

  const total = filtered.length;

  // Status breakdown
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {
      Submitted: 0,
      'Under Review': 0,
      Assigned: 0,
      'In Progress': 0,
      Resolved: 0,
    };
    filtered.forEach(c => {
      counts[c.status] = (counts[c.status] || 0) + 1;
    });
    return counts;
  }, [filtered]);

  // Priority breakdown
  const priorityCounts = useMemo(() => {
    const counts = { Critical: 0, High: 0, Medium: 0, Low: 0 };
    filtered.forEach(c => {
      counts[c.priority] = (counts[c.priority] || 0) + 1;
    });
    return counts;
  }, [filtered]);

  // Category breakdown
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    filtered.forEach(c => {
      counts[c.category] = (counts[c.category] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [filtered]);

  // Department workload
  const departmentWorkload = useMemo(() => {
    const counts: Record<string, number> = {};
    filtered.forEach(c => {
      const dept = c.assignedDepartment || 'General Municipal Administration';
      counts[dept] = (counts[dept] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [filtered]);

  // City-wise distribution
  const cityDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    complaints.forEach(c => {
      counts[c.location.city] = (counts[c.location.city] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [complaints]);

  // Hotspots identification
  const hotspots = useMemo(() => {
    const map = new Map<string, Complaint[]>();
    filtered.forEach(c => {
      const key = `${c.location.city} - ${c.location.area}`;
      const list = map.get(key) || [];
      list.push(c);
      map.set(key, list);
    });

    return Array.from(map.entries())
      .filter(([_, list]) => list.length >= 2)
      .map(([areaName, list]) => ({
        area: areaName,
        count: list.length,
        hasCritical: list.some(c => c.priority === 'Critical'),
        topCategory: list[0].category,
        complaints: list,
      }))
      .sort((a, b) => b.count - a.count);
  }, [filtered]);

  // Resolution Rate
  const resolvedCount = statusCounts['Resolved'] || 0;
  const resolutionRate = total === 0 ? 0 : Math.round((resolvedCount / total) * 100);

  // Dynamic AI Municipal Action Recommendations based on actual patterns
  const recommendations = useMemo(() => {
    const recs: string[] = [];
    const criticalPending = filtered.filter(c => c.priority === 'Critical' && c.status !== 'Resolved');

    if (criticalPending.length > 0) {
      recs.push(
        `Immediate Response Alert: ${criticalPending.length} critical safety hazards are active in ${
          selectedCity === 'All Cities' ? 'Karnataka' : selectedCity
        }. Immediate priority dispatch to ${criticalPending[0].assignedDepartment || 'Civil Emergency Squad'}.`
      );
    }

    const drainageIssues = (categoryCounts.find(c => c[0] === 'Drainage and sewage')?.[1] || 0) +
      (categoryCounts.find(c => c[0] === 'Waterlogging')?.[1] || 0);

    if (drainageIssues >= 3) {
      recs.push(
        `Pre-Monsoon Flood Prevention: Elevated concentration of drainage choking (${drainageIssues} reports). Mandate immediate mechanical desilting across major culverts.`
      );
    }

    const electricalIssues = categoryCounts.find(c => c[0] === 'Electrical hazards')?.[1] || 0;
    if (electricalIssues >= 2) {
      recs.push(
        `Distribution Grid Audit: Multiple electrical hazard reports detected. Recommend joint inspection with electricity supply company to secure live cables and transformers.`
      );
    }

    if (hotspots.length > 0) {
      recs.push(
        `Hotspot Surveillance: Chronic civic complaints identified in ${hotspots[0].area} (${hotspots[0].count} reports). Recommend municipal field audit and preventive maintenance.`
      );
    }

    if (recs.length === 0) {
      recs.push('Municipal grievance resolution is on track with standard operational SLAs.');
    }

    return recs;
  }, [filtered, selectedCity, categoryCounts, hotspots]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 text-white p-6 sm:p-8 rounded-2xl border border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-400 uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>AI-Driven Municipal Intelligence</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Civic Analytics & Operational Insights
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            Real-time data visualization of civic complaints across Karnataka municipalities.
          </p>
        </div>

        {/* City Filter selector */}
        <div className="flex items-center gap-2 bg-slate-800/80 p-1.5 rounded-xl border border-slate-700">
          <MapPin className="w-4 h-4 text-slate-400 ml-2" />
          <select
            value={selectedCity}
            onChange={e => onSelectCity(e.target.value)}
            className="bg-transparent text-xs text-white font-semibold pr-4 py-1.5 focus:outline-none"
          >
            <option value="All Cities" className="bg-slate-900">All Karnataka Cities</option>
            {cityDistribution.map(([cityName]) => (
              <option key={cityName} value={cityName} className="bg-slate-900">
                {cityName}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* AI RECOMMENDATIONS CARD */}
      <div className="bg-gradient-to-r from-blue-900/40 via-indigo-900/30 to-purple-900/40 border border-blue-500/30 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-2 font-bold text-sm text-blue-200 mb-3 uppercase tracking-wider">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>AI-Generated Municipal Action Recommendations (Based on Pattern Analysis)</span>
        </div>
        <div className="space-y-2.5">
          {recommendations.map((rec, i) => (
            <div
              key={i}
              className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-xl text-xs text-slate-200 flex items-start gap-3 shadow-xs"
            >
              <div className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 mt-0.5 font-bold text-[10px]">
                {i + 1}
              </div>
              <p className="leading-relaxed">{rec}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 4 Stat Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
            Total Analyzed
          </span>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">{total}</div>
          <span className="text-[11px] text-slate-500 mt-1 block">In selected scope</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-bold text-red-600 uppercase tracking-wider block mb-1">
            Critical Safety Hazards
          </span>
          <div className="text-2xl sm:text-3xl font-extrabold text-red-600">{priorityCounts.Critical}</div>
          <span className="text-[11px] text-red-700/80 mt-1 block">Requires immediate dispatch</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider block mb-1">
            Resolved Grievances
          </span>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600">{resolvedCount}</div>
          <span className="text-[11px] text-emerald-700/80 mt-1 block">Completed work orders</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-bold text-blue-600 uppercase tracking-wider block mb-1">
            Resolution Rate
          </span>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">{resolutionRate}%</div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
            <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: `${resolutionRate}%` }} />
          </div>
        </div>
      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Complaints by Category */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-blue-600" />
              <span>Complaints by Category</span>
            </h3>
            <span className="text-[11px] text-slate-400 font-medium">Actual application data</span>
          </div>

          <div className="space-y-2.5 text-xs">
            {categoryCounts.map(([cat, count]) => {
              const pct = total === 0 ? 0 : Math.round((count / total) * 100);
              return (
                <div key={cat} className="space-y-1">
                  <div className="flex items-center justify-between text-slate-700 font-medium">
                    <span className="truncate pr-2">{cat}</span>
                    <span className="font-bold font-mono">
                      {count} ({pct}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 2. Priority Distribution */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Flame className="w-4 h-4 text-orange-600" />
              <span>Severity & Priority Distribution</span>
            </h3>
            <span className="text-[11px] text-slate-400 font-medium">100-Point Scoring Model</span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
              <div className="flex items-center justify-between text-red-800 font-bold mb-1">
                <span>Critical Priority</span>
                <span className="font-mono text-base">{priorityCounts.Critical}</span>
              </div>
              <p className="text-[11px] text-red-600">Score ≥ 50 • Severe hazard</p>
            </div>

            <div className="p-4 bg-orange-50 border border-orange-200 rounded-xl">
              <div className="flex items-center justify-between text-orange-800 font-bold mb-1">
                <span>High Priority</span>
                <span className="font-mono text-base">{priorityCounts.High}</span>
              </div>
              <p className="text-[11px] text-orange-600">Score 30–49 • Escalating</p>
            </div>

            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
              <div className="flex items-center justify-between text-yellow-800 font-bold mb-1">
                <span>Medium Priority</span>
                <span className="font-mono text-base">{priorityCounts.Medium}</span>
              </div>
              <p className="text-[11px] text-yellow-600">Score 15–29 • Moderate</p>
            </div>

            <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
              <div className="flex items-center justify-between text-green-800 font-bold mb-1">
                <span>Low Priority</span>
                <span className="font-mono text-base">{priorityCounts.Low}</span>
              </div>
              <p className="text-[11px] text-green-600">Score &lt; 15 • Routine maintenance</p>
            </div>
          </div>

          {/* Workflow Status Breakdown */}
          <div className="pt-3 border-t border-slate-100">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
              Administrative Status Pipeline
            </span>
            <div className="grid grid-cols-5 gap-1.5 text-center text-xs">
              {Object.entries(statusCounts).map(([st, cnt]) => (
                <div key={st} className="p-2 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="font-bold text-slate-800 text-sm">{cnt}</div>
                  <div className="text-[10px] text-slate-500 truncate mt-0.5">{st}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 3. Department Workload */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Building2 className="w-4 h-4 text-purple-600" />
              <span>Department Workload & Routing</span>
            </h3>
            <span className="text-[11px] text-slate-400 font-medium">Active work orders</span>
          </div>

          <div className="space-y-3 text-xs">
            {departmentWorkload.map(([dept, count]) => (
              <div key={dept} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                <span className="font-medium text-slate-800 truncate pr-2">{dept}</span>
                <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold font-mono text-xs">
                  {count}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 4. Repeated Complaint Hotspots */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <MapPin className="w-4 h-4 text-red-600" />
              <span>Repeated Complaint Hotspots</span>
            </h3>
            <span className="text-[11px] text-slate-400 font-medium">≥ 2 overlapping reports</span>
          </div>

          {hotspots.length === 0 ? (
            <p className="text-xs text-slate-500 italic py-6 text-center">
              No overlapping complaint clusters detected in current view.
            </p>
          ) : (
            <div className="space-y-3 text-xs">
              {hotspots.map(spot => (
                <div
                  key={spot.area}
                  className="p-3.5 bg-slate-50 hover:bg-blue-50/50 rounded-xl border border-slate-200 transition-colors flex items-center justify-between gap-3"
                >
                  <div>
                    <div className="font-bold text-slate-900 flex items-center gap-1.5">
                      <span>{spot.area}</span>
                      {spot.hasCritical && (
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-red-100 text-red-800">
                          Critical Hazard
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Dominant issue: <strong>{spot.topCategory}</strong>
                    </p>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg bg-white border border-slate-300 font-bold font-mono text-slate-800 shrink-0">
                    {spot.count} complaints
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
