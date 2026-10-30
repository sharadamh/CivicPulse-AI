/**
 * CivicPulse AI - Citizen Profile & Grievance Portfolio
 * Displays authenticated citizen profile, personal grievance statistics,
 * and list of submitted complaints with real-time status tracking.
 */

import React, { useState, useMemo } from 'react';
import {
  User,
  ShieldCheck,
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  ArrowRight,
  Search,
  PlusCircle,
  ExternalLink,
  Calendar,
  Building2,
} from 'lucide-react';
import { Complaint, User as UserType } from '../types/index.ts';

interface CitizenPortalViewProps {
  currentUser: UserType | null;
  complaints: Complaint[];
  onOpenReportForm: () => void;
  onTrackComplaint: (id: string) => void;
  onOpenComplaintModal: (complaint: Complaint) => void;
  onOpenAuth: () => void;
}

export const CitizenPortalView: React.FC<CitizenPortalViewProps> = ({
  currentUser,
  complaints,
  onOpenReportForm,
  onTrackComplaint,
  onOpenComplaintModal,
  onOpenAuth,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Filter complaints belonging ONLY to this citizen
  const citizenComplaints = useMemo(() => {
    if (!currentUser?.email) return [];
    const email = currentUser.email.toLowerCase().trim();
    return complaints.filter(c => c.submittedBy.email.toLowerCase().trim() === email);
  }, [complaints, currentUser]);

  const filtered = useMemo(() => {
    return citizenComplaints.filter(c => {
      if (statusFilter !== 'All' && c.status !== statusFilter) return false;
      if (searchTerm.trim() !== '') {
        const q = searchTerm.toLowerCase();
        return (
          c.id.toLowerCase().includes(q) ||
          c.title.toLowerCase().includes(q) ||
          c.location.area.toLowerCase().includes(q) ||
          c.location.city.toLowerCase().includes(q) ||
          c.category.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [citizenComplaints, statusFilter, searchTerm]);

  // Citizen Stats
  const total = citizenComplaints.length;
  const pending = citizenComplaints.filter(c => c.status !== 'Resolved').length;
  const inProgress = citizenComplaints.filter(c => c.status === 'In Progress').length;
  const resolved = citizenComplaints.filter(c => c.status === 'Resolved').length;

  if (!currentUser) {
    return (
      <div className="max-w-3xl mx-auto my-12 bg-white rounded-2xl border border-slate-200 p-8 text-center shadow-sm">
        <div className="w-16 h-16 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-4">
          <User className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Citizen Profile & Grievances</h2>
        <p className="text-sm text-slate-500 max-w-md mx-auto mb-6">
          Sign in or register to view your submitted complaints, track municipal resolution progress, and manage your civic profile.
        </p>
        <button
          onClick={onOpenAuth}
          className="py-2.5 px-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm transition-colors shadow-sm"
        >
          Sign In / Register
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Profile Header Banner */}
      <div className="bg-slate-900 text-white p-6 sm:p-8 rounded-2xl border border-slate-800 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center font-bold text-xl text-white shadow-md">
            {currentUser.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white">
                {currentUser.name}
              </h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-500/40">
                Citizen Account
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">{currentUser.email}</p>
            <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Verified Municipal Citizen Portal Access</span>
            </p>
          </div>
        </div>

        <button
          onClick={onOpenReportForm}
          className="py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-xs sm:text-sm transition-colors shadow-sm flex items-center gap-2"
        >
          <PlusCircle className="w-4 h-4 text-emerald-300" />
          <span>Report New Grievance</span>
        </button>
      </div>

      {/* 4 Citizen KPI Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
            Total Submitted
          </span>
          <div className="text-2xl font-extrabold text-slate-900">{total}</div>
          <span className="text-[10px] text-slate-400 mt-0.5 block">Lifetime complaints</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider block mb-1">
            Under Review
          </span>
          <div className="text-2xl font-extrabold text-amber-600">{pending}</div>
          <span className="text-[10px] text-amber-700/80 mt-0.5 block">Awaiting field action</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider block mb-1">
            In Progress
          </span>
          <div className="text-2xl font-extrabold text-blue-600">{inProgress}</div>
          <span className="text-[10px] text-blue-700/80 mt-0.5 block">Crews on-site</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider block mb-1">
            Resolved
          </span>
          <div className="text-2xl font-extrabold text-emerald-600">{resolved}</div>
          <span className="text-[10px] text-emerald-700/80 mt-0.5 block">Completed works</span>
        </div>
      </div>

      {/* Grievance Management Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900">My Registered Grievances</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Only grievances submitted from your email are displayed. Track progress and view resolution updates.
            </p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Search */}
            <div className="relative flex-1 sm:w-56">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search my grievances..."
                className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Filter */}
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white text-slate-700 focus:outline-none"
            >
              <option value="All">All Statuses</option>
              <option value="Submitted">Submitted</option>
              <option value="Under Review">Under Review</option>
              <option value="Assigned">Assigned</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
            </select>
          </div>
        </div>

        {/* Complaints List */}
        {filtered.length > 0 ? (
          <div className="space-y-3">
            {filtered.map(c => {
              const isResolved = c.status === 'Resolved';
              return (
                <div
                  key={c.id}
                  className="p-4 bg-slate-50/70 hover:bg-slate-100/70 rounded-xl border border-slate-200 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        {c.id}
                      </span>
                      <span
                        className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                          c.status === 'Resolved'
                            ? 'bg-emerald-100 text-emerald-800'
                            : c.status === 'In Progress'
                            ? 'bg-blue-100 text-blue-800'
                            : c.status === 'Assigned'
                            ? 'bg-purple-100 text-purple-800'
                            : c.status === 'Under Review'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-200 text-slate-800'
                        }`}
                      >
                        {c.status}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                          c.priority === 'Critical'
                            ? 'bg-red-100 text-red-800'
                            : c.priority === 'High'
                            ? 'bg-orange-100 text-orange-800'
                            : c.priority === 'Medium'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-green-100 text-green-800'
                        }`}
                      >
                        {c.priority} Priority
                      </span>
                      <span className="text-[11px] text-slate-500 font-medium">
                        {c.category}
                      </span>
                    </div>

                    <h3 className="font-bold text-sm text-slate-900">{c.title}</h3>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        {c.location.area}, {c.location.city}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {new Date(c.createdAt).toLocaleDateString()}
                      </span>
                      {c.assignedDepartment && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1 text-slate-600">
                            <Building2 className="w-3.5 h-3.5 text-slate-400" />
                            {c.assignedDepartment}
                          </span>
                        </>
                      )}
                    </div>

                    {isResolved && c.resolutionDetails && (
                      <p className="text-xs text-emerald-800 bg-emerald-50 p-2 rounded-lg border border-emerald-200 mt-1">
                        <strong>Resolution:</strong> {c.resolutionDetails.resolutionSummary}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    <button
                      onClick={() => onOpenComplaintModal(c)}
                      className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 font-semibold rounded-lg text-xs transition-colors"
                    >
                      View Details
                    </button>
                    <button
                      onClick={() => onTrackComplaint(c.id)}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-xs transition-colors flex items-center gap-1.5 shadow-xs"
                    >
                      <span>Track</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-12 text-center text-slate-500 space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
              <FileText className="w-6 h-6" />
            </div>
            {citizenComplaints.length === 0 ? (
              <>
                <p className="text-sm font-semibold text-slate-800">You haven't reported any grievances yet.</p>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Help improve your city by reporting road damage, water issues, overflowing garbage, or safety hazards.
                </p>
                <button
                  onClick={onOpenReportForm}
                  className="mt-2 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs transition-colors inline-flex items-center gap-1.5"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Report Your First Grievance</span>
                </button>
              </>
            ) : (
              <p className="text-xs">No grievances match the filter "{statusFilter}".</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
