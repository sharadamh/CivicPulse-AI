/**
 * CivicPulse AI - Municipal Admin Operational Dashboard
 * Executive KPI cards, critical alerts, and operational breakdown.
 */

import React from 'react';
import {
  AlertOctagon,
  Clock,
  CheckCircle2,
  TrendingUp,
  FileText,
  MapPin,
  Building2,
  Sparkles,
  ArrowRight,
  Flame,
} from 'lucide-react';
import { Complaint, User } from '../types/index.ts';

interface AdminDashboardProps {
  complaints: Complaint[];
  currentUser: User | null;
  onViewComplaints: (filter?: { status?: string; priority?: string }) => void;
  onOpenMap: () => void;
  onOpenComplaintModal: (complaint: Complaint) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  complaints,
  currentUser,
  onViewComplaints,
  onOpenMap,
  onOpenComplaintModal,
}) => {
  const total = complaints.length;
  const critical = complaints.filter(c => c.priority === 'Critical');
  const high = complaints.filter(c => c.priority === 'High');
  const pending = complaints.filter(c => c.status !== 'Resolved');
  const criticalPending = critical.filter(c => c.status !== 'Resolved');
  const assigned = complaints.filter(c => c.status === 'Assigned');
  const inProgress = complaints.filter(c => c.status === 'In Progress');
  const resolved = complaints.filter(c => c.status === 'Resolved');
  const resolutionRate = total === 0 ? 0 : Math.round((resolved.length / total) * 100);

  // Group by City
  const cityCounts = complaints.reduce((acc, c) => {
    acc[c.location.city] = (acc[c.location.city] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      {/* Top Banner: Municipality Overview */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 text-white rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-400 uppercase tracking-wider mb-1">
            <Building2 className="w-4 h-4" />
            <span>Municipal Command Center</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            {currentUser?.municipality === 'ALL'
              ? 'Karnataka State Civic Command Center'
              : currentUser?.municipality || 'Municipal Grievance Dashboard'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
            Real-time complaint triage, explainable priority dispatch, and inter-departmental action accountability.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onViewComplaints()}
            className="py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-xs sm:text-sm transition-colors shadow-xs flex items-center gap-2"
          >
            <FileText className="w-4 h-4" />
            <span>Manage All Complaints</span>
          </button>
        </div>
      </div>

      {/* CRITICAL ATTENTION BANNER (If any Critical unresolved) */}
      {criticalPending.length > 0 && (
        <div className="bg-red-50 border-2 border-red-300 rounded-2xl p-5 shadow-xs animate-pulse-slow">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-center gap-2.5 text-red-900 font-extrabold text-sm sm:text-base">
              <AlertOctagon className="w-6 h-6 text-red-600 shrink-0" />
              <span>
                ACTION REQUIRED: {criticalPending.length} Unresolved Critical Safety Hazard{criticalPending.length > 1 ? 's' : ''}!
              </span>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-200 text-red-800 uppercase tracking-wider">
              Immediate Dispatch
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {criticalPending.slice(0, 2).map(c => (
              <div
                key={c.id}
                onClick={() => onOpenComplaintModal(c)}
                className="bg-white p-3.5 rounded-xl border border-red-200 hover:border-red-400 cursor-pointer transition-all shadow-2xs hover:shadow-xs"
              >
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-mono font-bold text-red-700">{c.id}</span>
                  <span className="text-[11px] font-semibold text-slate-500">{c.location.city} • {c.location.area}</span>
                </div>
                <h4 className="font-bold text-xs text-slate-900 truncate mb-1">{c.title}</h4>
                <div className="flex items-center justify-between text-[11px] text-slate-600">
                  <span>Score: <strong className="text-red-700">{c.aiAnalysis.priorityScore.total}/100</strong></span>
                  <span className="text-blue-600 font-medium hover:underline flex items-center gap-1">
                    Take Action <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 8 Municipal KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Total */}
        <div
          onClick={() => onViewComplaints()}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-xs transition-shadow cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total Grievances</span>
            <FileText className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">{total}</div>
          <span className="text-[11px] text-slate-500 mt-1 block">Registered in jurisdiction</span>
        </div>

        {/* Pending */}
        <div
          onClick={() => onViewComplaints({ status: 'Submitted' })}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-xs transition-shadow cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700">Pending Action</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-amber-600">{pending.length}</div>
          <span className="text-[11px] text-slate-500 mt-1 block">Awaiting completion</span>
        </div>

        {/* Critical */}
        <div
          onClick={() => onViewComplaints({ priority: 'Critical' })}
          className="bg-red-50/50 p-5 rounded-2xl border border-red-200 shadow-2xs hover:shadow-xs transition-shadow cursor-pointer"
        >
          <div className="flex items-center justify-between text-red-700 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Critical Priority</span>
            <AlertOctagon className="w-4 h-4 text-red-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-red-700">{critical.length}</div>
          <span className="text-[11px] text-red-600/80 mt-1 block">Score ≥ 50 / 100</span>
        </div>

        {/* High */}
        <div
          onClick={() => onViewComplaints({ priority: 'High' })}
          className="bg-orange-50/50 p-5 rounded-2xl border border-orange-200 shadow-2xs hover:shadow-xs transition-shadow cursor-pointer"
        >
          <div className="flex items-center justify-between text-orange-700 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">High Priority</span>
            <Flame className="w-4 h-4 text-orange-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-orange-700">{high.length}</div>
          <span className="text-[11px] text-orange-600/80 mt-1 block">Score 30–49 / 100</span>
        </div>

        {/* Assigned */}
        <div
          onClick={() => onViewComplaints({ status: 'Assigned' })}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-xs transition-shadow cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-700">Assigned</span>
            <Building2 className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-purple-700">{assigned.length}</div>
          <span className="text-[11px] text-slate-500 mt-1 block">Routed to departments</span>
        </div>

        {/* In Progress */}
        <div
          onClick={() => onViewComplaints({ status: 'In Progress' })}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-xs transition-shadow cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-700">In Progress</span>
            <Clock className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-blue-700">{inProgress.length}</div>
          <span className="text-[11px] text-slate-500 mt-1 block">Field team deployed</span>
        </div>

        {/* Resolved */}
        <div
          onClick={() => onViewComplaints({ status: 'Resolved' })}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-xs transition-shadow cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">Resolved</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-700">{resolved.length}</div>
          <span className="text-[11px] text-slate-500 mt-1 block">Closed & confirmed</span>
        </div>

        {/* Resolution Rate */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-900">Resolution Rate</span>
            <TrendingUp className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">{resolutionRate}%</div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
            <div
              className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${resolutionRate}%` }}
            />
          </div>
        </div>
      </div>

      {/* City Breakdown Quick Nav */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-slate-900 text-sm">City & Municipality Breakdown</h3>
          </div>
          <button
            onClick={onOpenMap}
            className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1"
          >
            <span>Open Interactive Map</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          {Object.entries(cityCounts).map(([cityName, count]) => (
            <div
              key={cityName}
              onClick={onOpenMap}
              className="p-3 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-xl cursor-pointer transition-all text-center"
            >
              <div className="font-bold text-sm text-slate-900">{cityName}</div>
              <div className="text-xs text-slate-500 mt-0.5">
                <strong className="text-blue-700">{count}</strong> complaint{count > 1 ? 's' : ''}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
