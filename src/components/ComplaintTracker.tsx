/**
 * CivicPulse AI - Citizen Complaint Tracking Portal
 * Visual 5-step timeline, public progress feed, and strict privacy enforcement.
 */

import React, { useState, useEffect } from 'react';
import {
  Search,
  CheckCircle2,
  Clock,
  Building2,
  MapPin,
  Calendar,
  AlertCircle,
  ShieldCheck,
  FileText,
  UserCheck,
  Check,
  Loader2,
  History,
} from 'lucide-react';
import { Complaint, ComplaintStatus, User } from '../types/index.ts';
import { fetchComplaintById, fetchComplaints } from '../services/api.ts';

interface ComplaintTrackerProps {
  initialComplaintId?: string;
  currentUser: User | null;
  onSelectComplaint?: (c: Complaint) => void;
}

const WORKFLOW_STEPS: ComplaintStatus[] = [
  'Submitted',
  'Under Review',
  'Assigned',
  'In Progress',
  'Resolved',
];

export const ComplaintTracker: React.FC<ComplaintTrackerProps> = ({
  initialComplaintId = '',
  currentUser,
}) => {
  const [searchId, setSearchId] = useState(initialComplaintId);
  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [myComplaints, setMyComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load complaint on mount or when initialComplaintId changes
  useEffect(() => {
    if (initialComplaintId) {
      setSearchId(initialComplaintId);
      loadComplaint(initialComplaintId);
    }
  }, [initialComplaintId]);

  // Load user's recent complaints if logged in
  useEffect(() => {
    if (currentUser?.email) {
      fetchComplaints({ citizenEmail: currentUser.email })
        .then(res => setMyComplaints(res))
        .catch(() => {});
    }
  }, [currentUser]);

  const loadComplaint = async (id: string) => {
    if (!id.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchComplaintById(id.trim());
      setComplaint(data);
    } catch (err: any) {
      setError(`No complaint found with ID "${id}". Please verify and try again.`);
      setComplaint(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadComplaint(searchId);
  };

  const getStepIndex = (status: ComplaintStatus) => WORKFLOW_STEPS.indexOf(status);

  return (
    <div className="max-w-4xl mx-auto my-6 px-4">
      {/* Title */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Track Grievance Status
        </h1>
        <p className="text-slate-500 text-xs sm:text-sm mt-1">
          Monitor real-time municipal inspection progress, assigned department, and public updates.
        </p>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 mb-6">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              required
              value={searchId}
              onChange={e => setSearchId(e.target.value.toUpperCase())}
              placeholder="Enter Complaint ID (e.g. CP-2026-104921)"
              className="w-full pl-11 pr-4 py-2.5 text-sm font-mono border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase tracking-wider text-slate-900"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="py-2.5 px-6 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-xl text-sm transition-colors flex items-center justify-center gap-2 shadow-xs"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            <span>Track Grievance</span>
          </button>
        </form>

        {/* Quick select from recent demo complaints */}
        <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
          <span className="font-semibold text-slate-600">Quick Demo Search:</span>
          {['CP-2026-104921', 'CP-2026-104922', 'CP-2026-104923', 'CP-2026-300201'].map(id => (
            <button
              key={id}
              onClick={() => {
                setSearchId(id);
                loadComplaint(id);
              }}
              className="px-2 py-0.5 rounded bg-slate-100 hover:bg-blue-50 hover:text-blue-700 font-mono text-[11px] border border-slate-200 transition-colors"
            >
              {id}
            </button>
          ))}
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3 text-sm text-red-700 mb-6">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Complaint Details & Progress Tracking View */}
      {complaint && (
        <div className="space-y-6">
          {/* Main Overview Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8">
            {/* Header info */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-sm font-extrabold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200">
                    {complaint.id}
                  </span>
                  <span className="text-xs px-2.5 py-1 rounded-full font-semibold bg-slate-100 text-slate-700">
                    {complaint.category}
                  </span>
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 mt-2">
                  {complaint.title}
                </h2>
              </div>

              {/* Status and Priority badges */}
              <div className="flex sm:flex-col items-center sm:items-end gap-2">
                <span
                  className={`text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider ${
                    complaint.status === 'Resolved'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : complaint.status === 'In Progress'
                      ? 'bg-blue-100 text-blue-800 border border-blue-300'
                      : complaint.status === 'Assigned'
                      ? 'bg-purple-100 text-purple-800 border border-purple-300'
                      : 'bg-amber-100 text-amber-800 border border-amber-300'
                  }`}
                >
                  {complaint.status}
                </span>
                <span
                  className={`text-[11px] px-2 py-0.5 rounded font-semibold ${
                    complaint.priority === 'Critical'
                      ? 'text-red-700 bg-red-50 border border-red-200'
                      : complaint.priority === 'High'
                      ? 'text-orange-700 bg-orange-50 border border-orange-200'
                      : 'text-slate-600 bg-slate-50 border border-slate-200'
                  }`}
                >
                  Priority: {complaint.priority} ({complaint.aiAnalysis.priorityScore.total}/100)
                </span>
              </div>
            </div>

            {/* Description and location meta */}
            <div className="py-4 space-y-3 text-sm text-slate-700">
              <p className="leading-relaxed">{complaint.description}</p>
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4 text-slate-400" />
                  {complaint.location.address || `${complaint.location.area}, ${complaint.location.city}`}
                </span>
                <span className="flex items-center gap-1">
                  <Building2 className="w-4 h-4 text-slate-400" />
                  {complaint.municipality}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  Reported: {new Date(complaint.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>

            {/* 5-Step Administrative Workflow Progress Bar */}
            <div className="mt-6 pt-6 border-t border-slate-100">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-6">
                Administrative Progress Workflow
              </h3>

              <div className="relative">
                {/* Connecting Line */}
                <div className="absolute top-4 left-4 right-4 sm:left-6 sm:right-6 h-1 bg-slate-200 -z-0" />
                <div
                  className="absolute top-4 left-4 sm:left-6 h-1 bg-blue-600 transition-all duration-500 -z-0"
                  style={{
                    width: `${(getStepIndex(complaint.status) / (WORKFLOW_STEPS.length - 1)) * 92}%`,
                  }}
                />

                {/* Steps */}
                <div className="flex justify-between relative z-10">
                  {WORKFLOW_STEPS.map((step, idx) => {
                    const currentIdx = getStepIndex(complaint.status);
                    const isDone = idx < currentIdx;
                    const isCurrent = idx === currentIdx;

                    return (
                      <div key={step} className="flex flex-col items-center text-center max-w-[70px] sm:max-w-[100px]">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                            isDone
                              ? 'bg-blue-600 text-white ring-4 ring-blue-100'
                              : isCurrent
                              ? 'bg-white border-2 border-blue-600 text-blue-600 ring-4 ring-blue-100 shadow-md'
                              : 'bg-white border-2 border-slate-300 text-slate-400'
                          }`}
                        >
                          {isDone ? <Check className="w-4 h-4 stroke-[3]" /> : idx + 1}
                        </div>
                        <span
                          className={`text-[11px] sm:text-xs mt-2 font-semibold ${
                            isCurrent
                              ? 'text-blue-700 font-bold'
                              : isDone
                              ? 'text-slate-800'
                              : 'text-slate-400'
                          }`}
                        >
                          {step}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Assigned Department Badge */}
            {complaint.assignedDepartment && (
              <div className="mt-8 p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-blue-600" />
                  <span className="text-slate-600">Assigned Department:</span>
                  <span className="font-bold text-slate-800">{complaint.assignedDepartment}</span>
                </div>
                {complaint.assignedOfficer && (
                  <div className="flex items-center gap-1.5 text-slate-500">
                    <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Officer: <strong className="text-slate-800">{complaint.assignedOfficer}</strong></span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Resolution Details Card (if resolved) */}
          {complaint.resolutionDetails && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-emerald-950">
              <div className="flex items-center gap-2 font-bold text-base text-emerald-900 mb-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>Grievance Resolved</span>
              </div>
              <p className="text-sm text-emerald-800 leading-relaxed mb-3">
                {complaint.resolutionDetails.resolutionSummary}
              </p>
              <div className="flex flex-wrap items-center gap-4 text-xs text-emerald-700 font-medium pt-2 border-t border-emerald-200/60">
                <span>Resolved by: <strong>{complaint.resolutionDetails.resolvedBy}</strong></span>
                <span>Date: <strong>{new Date(complaint.resolutionDetails.resolvedAt).toLocaleString()}</strong></span>
              </div>
            </div>
          )}

          {/* Public Updates Timeline */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-4">
              <History className="w-4 h-4 text-blue-600" />
              <span>Public Progress Updates Timeline</span>
            </h3>

            {complaint.publicUpdates && complaint.publicUpdates.length > 0 ? (
              <div className="space-y-4">
                {complaint.publicUpdates.map((update, i) => (
                  <div key={update.id || i} className="flex gap-3 text-xs">
                    <div className="w-2 h-2 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                    <div className="flex-1 bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <p className="text-slate-800 font-medium mb-1">{update.updateText}</p>
                      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                        <span>{update.author}</span>
                        <span>{new Date(update.timestamp).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic">
                Complaint logged. Waiting for first municipal field update.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
