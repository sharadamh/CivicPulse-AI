/**
 * CivicPulse AI - Analytics & Municipal Intelligence Insights
 * Uses actual dynamic complaint data to render interactive visual breakdown:
 * - Complaints by category, priority, district/city
 * - Resolved vs pending grievance pipeline
 * - Real monthly grievance progression trends
 * - Average resolution turnaround time from actual resolved complaints
 * - High-complaint hotspot areas
 * - Department performance scorecard (rate, average time, critical load)
 * - AI pattern-based municipal recommendations
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
  Layers,
  Calendar,
  Check,
  Activity,
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

  // City-wise distribution
  const cityDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    complaints.forEach(c => {
      counts[c.location.city] = (counts[c.location.city] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [complaints]);

  // Resolution Turnaround Time & Pending vs Resolved
  const resolutionStats = useMemo(() => {
    const resolvedComplaints = filtered.filter(c => c.status === 'Resolved');
    let totalMs = 0;
    let countWithTime = 0;

    resolvedComplaints.forEach(c => {
      const created = new Date(c.createdAt).getTime();
      const resolved = c.resolutionDetails?.resolvedAt
        ? new Date(c.resolutionDetails.resolvedAt).getTime()
        : new Date(c.updatedAt).getTime();

      if (resolved >= created) {
        totalMs += resolved - created;
        countWithTime++;
      }
    });

    const avgHours = countWithTime > 0 ? totalMs / countWithTime / (1000 * 60 * 60) : 0;
    const avgDays = (avgHours / 24).toFixed(1);
    const resolvedCount = resolvedComplaints.length;
    const pendingCount = total - resolvedCount;
    const rate = total === 0 ? 0 : Math.round((resolvedCount / total) * 100);

    return {
      resolvedCount,
      pendingCount,
      rate,
      avgHours: avgHours.toFixed(1),
      avgDays,
      hasData: countWithTime > 0,
    };
  }, [filtered, total]);

  // Monthly complaint trends calculated from actual complaint creation dates
  const monthlyTrends = useMemo(() => {
    const map = new Map<string, { month: string; total: number; resolved: number; critical: number }>();
    const sorted = [...filtered].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    sorted.forEach(c => {
      const d = new Date(c.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const monthLabel = d.toLocaleDateString('default', { month: 'short', year: 'numeric' });

      const item = map.get(key) || { month: monthLabel, total: 0, resolved: 0, critical: 0 };
      item.total++;
      if (c.status === 'Resolved') item.resolved++;
      if (c.priority === 'Critical') item.critical++;
      map.set(key, item);
    });

    const list = Array.from(map.values());
    return list.length > 0 ? list : [{ month: 'Current Period', total, resolved: resolutionStats.resolvedCount, critical: priorityCounts.Critical }];
  }, [filtered, total, resolutionStats.resolvedCount, priorityCounts.Critical]);

  // Department Performance Scorecard
  const departmentPerformance = useMemo(() => {
    const map = new Map<
      string,
      { total: number; resolved: number; critical: number; totalMs: number; timeCount: number }
    >();

    filtered.forEach(c => {
      const dept = c.assignedDepartment || 'General Municipal Administration';
      const item = map.get(dept) || { total: 0, resolved: 0, critical: 0, totalMs: 0, timeCount: 0 };
      item.total++;
      if (c.status === 'Resolved') {
        item.resolved++;
        const created = new Date(c.createdAt).getTime();
        const resolved = c.resolutionDetails?.resolvedAt
          ? new Date(c.resolutionDetails.resolvedAt).getTime()
          : new Date(c.updatedAt).getTime();
        if (resolved >= created) {
          item.totalMs += resolved - created;
          item.timeCount++;
        }
      }
      if (c.priority === 'Critical') item.critical++;
      map.set(dept, item);
    });

    return Array.from(map.entries())
      .map(([dept, data]) => {
        const rate = data.total > 0 ? Math.round((data.resolved / data.total) * 100) : 0;
        const avgHours =
          data.timeCount > 0 ? (data.totalMs / data.timeCount / (1000 * 60 * 60)).toFixed(1) + ' hrs' : 'Pending';
        return {
          dept,
          total: data.total,
          resolved: data.resolved,
          rate,
          critical: data.critical,
          avgHours,
        };
      })
      .sort((a, b) => b.total - a.total);
  }, [filtered]);

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

    const drainageIssues =
      (categoryCounts.find(c => c[0] === 'Drainage and sewage')?.[1] || 0) +
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
            <option value="All Cities" className="bg-slate-900">
              All Karnataka Cities
            </option>
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
          <span>AI-Generated Municipal Action Recommendations (Pattern Analysis)</span>
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
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600">{resolutionStats.resolvedCount}</div>
          <span className="text-[11px] text-emerald-700/80 mt-1 block">
            {resolutionStats.pendingCount} pending field action
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-bold text-blue-600 uppercase tracking-wider block mb-1">
            Avg Turnaround Time
          </span>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            {resolutionStats.hasData ? `${resolutionStats.avgHours} hrs` : 'N/A'}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            {resolutionStats.hasData ? `~${resolutionStats.avgDays} days per resolved case` : 'Sufficient data required'}
          </span>
        </div>
      </div>

      {/* Main Charts Grid 1: Category & Priority */}
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

          {/* Workflow Status Pipeline & Resolution Rate */}
          <div className="pt-3 border-t border-slate-100 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Resolution Ratio ({resolutionStats.rate}% Completed)
              </span>
              <span className="font-bold text-emerald-700">
                {resolutionStats.resolvedCount} Resolved / {resolutionStats.pendingCount} Pending
              </span>
            </div>

            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden flex">
              <div
                className="bg-emerald-500 h-2 transition-all duration-500"
                style={{ width: `${resolutionStats.rate}%` }}
                title={`Resolved: ${resolutionStats.rate}%`}
              />
              <div
                className="bg-amber-400 h-2 transition-all duration-500"
                style={{ width: `${100 - resolutionStats.rate}%` }}
                title={`Pending: ${100 - resolutionStats.rate}%`}
              />
            </div>

            <div className="grid grid-cols-5 gap-1.5 text-center text-xs pt-2">
              {Object.entries(statusCounts).map(([st, cnt]) => (
                <div key={st} className="p-2 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="font-bold text-slate-800 text-sm">{cnt}</div>
                  <div className="text-[10px] text-slate-500 truncate mt-0.5">{st}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Charts Grid 2: Monthly Trends & Department Scorecard */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 3. Monthly Complaint Progression Trends */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              <span>Monthly Grievance Inflow & Resolution Trends</span>
            </h3>
            <span className="text-[11px] text-slate-400 font-medium">Historical Timeline</span>
          </div>

          <div className="space-y-3 text-xs">
            {monthlyTrends.map(item => {
              const maxVol = Math.max(...monthlyTrends.map(m => m.total), 1);
              const totalPct = Math.round((item.total / maxVol) * 100);
              const resPct = item.total > 0 ? Math.round((item.resolved / item.total) * 100) : 0;

              return (
                <div key={item.month} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between font-bold text-slate-900">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {item.month}
                    </span>
                    <span className="font-mono text-blue-700">{item.total} Complaints</span>
                  </div>

                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden flex">
                    <div
                      className="bg-blue-600 h-2 transition-all duration-500"
                      style={{ width: `${totalPct}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span className="text-emerald-700 font-semibold">
                      ✓ {item.resolved} Resolved ({resPct}%)
                    </span>
                    {item.critical > 0 && (
                      <span className="text-red-700 font-semibold">
                        ⚡ {item.critical} Critical Hazard{item.critical > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 4. Department Performance Scorecard */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Building2 className="w-4 h-4 text-purple-600" />
              <span>Department Performance & Workload</span>
            </h3>
            <span className="text-[11px] text-slate-400 font-medium">Work order execution</span>
          </div>

          <div className="space-y-2.5 text-xs max-h-80 overflow-y-auto pr-1">
            {departmentPerformance.map(d => (
              <div key={d.dept} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                <div className="flex items-center justify-between font-semibold text-slate-900">
                  <span className="truncate pr-2">{d.dept}</span>
                  <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold font-mono text-[11px]">
                    {d.total} Assigned
                  </span>
                </div>

                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-purple-600 h-1.5 rounded-full transition-all duration-500"
                    style={{ width: `${d.rate}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span>
                    Resolution Rate: <strong className="text-slate-800">{d.rate}%</strong> ({d.resolved}/{d.total})
                  </span>
                  <span>
                    Avg Turnaround: <strong className="text-slate-800">{d.avgHours}</strong>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Charts Grid 3: Hotspots & District Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 5. Geographic Hotspots */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Layers className="w-4 h-4 text-amber-600" />
              <span>Identified Grievance Hotspots</span>
            </h3>
            <span className="text-[11px] text-slate-400 font-medium">≥ 2 overlapping reports</span>
          </div>

          {hotspots.length > 0 ? (
            <div className="space-y-2.5 text-xs">
              {hotspots.slice(0, 5).map(h => (
                <div
                  key={h.area}
                  className="p-3.5 bg-slate-50 hover:bg-slate-100/80 rounded-xl border border-slate-200 transition-colors flex items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 font-bold text-slate-900">
                      <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0" />
                      <span>{h.area}</span>
                      {h.hasCritical && (
                        <span className="px-1.5 py-0.2 rounded text-[10px] bg-red-100 text-red-800 font-bold uppercase">
                          Critical
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-500 block">Dominant issue: {h.topCategory}</span>
                  </div>

                  <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 font-bold font-mono text-xs shrink-0">
                    {h.count} Cases
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-slate-500 text-xs italic">
              No concentrated complaint clusters detected in current view.
            </div>
          )}
        </div>

        {/* 6. District Grievance Distribution */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-600" />
              <span>Jurisdiction Grievance Distribution</span>
            </h3>
            <span className="text-[11px] text-slate-400 font-medium">State-wide database</span>
          </div>

          <div className="space-y-2.5 text-xs max-h-80 overflow-y-auto pr-1">
            {cityDistribution.map(([cityName, count]) => {
              const pct = Math.round((count / complaints.length) * 100);
              const isSelected = selectedCity.toLowerCase() === cityName.toLowerCase();

              return (
                <div
                  key={cityName}
                  onClick={() => onSelectCity(cityName)}
                  className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-blue-50 border-blue-400 shadow-2xs'
                      : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center justify-between text-slate-800 font-semibold mb-1">
                    <span className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${isSelected ? 'bg-blue-600' : 'bg-slate-400'}`} />
                      {cityName}
                    </span>
                    <span className="font-mono text-slate-900">
                      {count} ({pct}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-1.5 rounded-full ${isSelected ? 'bg-blue-600' : 'bg-slate-500'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
