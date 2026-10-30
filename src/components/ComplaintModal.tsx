/**
 * CivicPulse AI - Municipal Complaint Management Modal
 * Detailed inspection, AI Action Brief, duplicate warnings, manual priority override, and audit history.
 */

import React, { useState } from 'react';
import {
  X,
  Building2,
  Clock,
  Sparkles,
  AlertTriangle,
  UserCheck,
  CheckCircle2,
  Lock,
  MessageSquare,
  ShieldAlert,
  ArrowRight,
  Send,
  Loader2,
  Calendar,
  MapPin,
  Flame,
  Check,
} from 'lucide-react';
import { Complaint, ComplaintStatus, DepartmentName, PriorityLevel, User } from '../types/index.ts';
import { updateComplaint } from '../services/api.ts';

interface ComplaintModalProps {
  complaint: Complaint | null;
  currentUser: User | null;
  onClose: () => void;
  onComplaintUpdated: (updated: Complaint) => void;
  onOpenAnotherComplaint?: (complaintId: string) => void;
}

const DEPARTMENTS: DepartmentName[] = [
  'Road Works & Infrastructure',
  'Water Supply & Sewerage Board',
  'Solid Waste Management',
  'Electricity & Public Lighting',
  'Stormwater & Flood Management',
  'Public Health & Safety',
  'General Municipal Administration',
];

const WORKFLOW_STATUSES: ComplaintStatus[] = [
  'Submitted',
  'Under Review',
  'Assigned',
  'In Progress',
  'Resolved',
];

export const ComplaintModal: React.FC<ComplaintModalProps> = ({
  complaint,
  currentUser,
  onClose,
  onComplaintUpdated,
  onOpenAnotherComplaint,
}) => {
  if (!complaint) return null;

  const [selectedStatus, setSelectedStatus] = useState<ComplaintStatus>(complaint.status);
  const [selectedDepartment, setSelectedDepartment] = useState<DepartmentName>(
    complaint.assignedDepartment || complaint.aiAnalysis.suggestedDepartment
  );
  const [assignedOfficer, setAssignedOfficer] = useState(complaint.assignedOfficer || '');
  const [newInternalNote, setNewInternalNote] = useState('');
  const [newPublicUpdate, setNewPublicUpdate] = useState('');
  const [resolutionSummary, setResolutionSummary] = useState(
    complaint.resolutionDetails?.resolutionSummary || ''
  );

  // Manual Priority Override State
  const [overridePriority, setOverridePriority] = useState<PriorityLevel>(complaint.priority);
  const [overrideReason, setOverrideReason] = useState('');
  const [showOverrideBox, setShowOverrideBox] = useState(false);

  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'ai-brief' | 'actions' | 'audit'>('overview');

  const handleSave = async () => {
    setSaving(true);
    setSuccessMessage(null);

    const payload: any = {
      status: selectedStatus,
      assignedDepartment: selectedDepartment,
      assignedOfficer: assignedOfficer.trim() || undefined,
    };

    // Priority override if changed
    if (overridePriority !== complaint.priority && overrideReason.trim() !== '') {
      payload.manualPriorityOverride = {
        newPriority: overridePriority,
        reason: overrideReason.trim(),
      };
    }

    // Internal note
    if (newInternalNote.trim() !== '') {
      payload.internalNote = newInternalNote.trim();
    }

    // Public update
    if (newPublicUpdate.trim() !== '') {
      payload.publicUpdate = newPublicUpdate.trim();
    }

    // Resolution details
    if (selectedStatus === 'Resolved' && resolutionSummary.trim() !== '') {
      payload.resolutionDetails = {
        resolutionSummary: resolutionSummary.trim(),
      };
    }

    try {
      const updated = await updateComplaint(complaint.id, payload);
      onComplaintUpdated(updated);
      setSuccessMessage('Complaint updated successfully!');
      setNewInternalNote('');
      setNewPublicUpdate('');
      setShowOverrideBox(false);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to update complaint.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="bg-slate-900 text-white p-5 sm:p-6 relative flex flex-wrap items-center justify-between gap-3 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="font-mono text-xs font-extrabold text-blue-400 bg-blue-950/80 px-2.5 py-1 rounded border border-blue-800">
                {complaint.id}
              </span>
              <span
                className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                  complaint.priority === 'Critical'
                    ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                    : complaint.priority === 'High'
                    ? 'bg-orange-500/20 text-orange-300 border border-orange-500/40'
                    : complaint.priority === 'Medium'
                    ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/40'
                    : 'bg-green-500/20 text-green-300 border border-green-500/40'
                }`}
              >
                {complaint.priority} Priority ({complaint.aiAnalysis.priorityScore.total}/100)
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded bg-slate-800 text-slate-300 font-medium">
                {complaint.category}
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white line-clamp-2">
              {complaint.title}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Subnav Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-3 px-3 border-b-2 transition-colors ${
              activeTab === 'overview'
                ? 'border-blue-600 text-blue-700 font-bold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Overview & Evidence
          </button>
          <button
            onClick={() => setActiveTab('ai-brief')}
            className={`py-3 px-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'ai-brief'
                ? 'border-blue-600 text-blue-700 font-bold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>AI Intelligence & Brief</span>
            {complaint.aiAnalysis.duplicates.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-amber-500" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('actions')}
            className={`py-3 px-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'actions'
                ? 'border-blue-600 text-blue-700 font-bold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building2 className="w-3.5 h-3.5 text-blue-600" />
            <span>Administrative Actions & Notes</span>
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`py-3 px-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'audit'
                ? 'border-blue-600 text-blue-700 font-bold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span>Audit History ({complaint.statusHistory.length})</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {successMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* TAB 1: OVERVIEW & EVIDENCE */}
          {activeTab === 'overview' && (
            <div className="space-y-6 text-xs text-slate-700">
              {/* Description */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <span className="font-bold text-slate-900 text-xs uppercase tracking-wider block mb-1">
                  Citizen Description
                </span>
                <p className="text-sm text-slate-800 leading-relaxed">{complaint.description}</p>
              </div>

              {/* Geographic and Citizen Metadata */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-2">
                  <span className="font-bold text-slate-900 block text-xs uppercase tracking-wider">
                    Geographic Location
                  </span>
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-slate-900">{complaint.location.address}</p>
                      <p className="text-slate-500 text-[11px] font-mono mt-0.5">
                        Coordinates: {complaint.location.lat.toFixed(4)}°N, {complaint.location.lng.toFixed(4)}°E
                      </p>
                      {complaint.location.landmark && (
                        <p className="text-slate-600 text-[11px] mt-0.5">
                          Landmark: <strong>{complaint.location.landmark}</strong>
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-2">
                  <span className="font-bold text-slate-900 block text-xs uppercase tracking-wider">
                    Submitted Citizen Information
                  </span>
                  <div className="flex items-start gap-2">
                    <UserCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-slate-900">{complaint.submittedBy.name}</p>
                      <p className="text-slate-500 text-[11px]">{complaint.submittedBy.email}</p>
                      {complaint.submittedBy.phone && (
                        <p className="text-slate-500 text-[11px]">{complaint.submittedBy.phone}</p>
                      )}
                      <p className="text-slate-400 text-[10px] mt-1">
                        Reported at: {new Date(complaint.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Uploaded Evidence Image */}
              {complaint.imageUrl && (
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="font-bold text-slate-900 text-xs uppercase tracking-wider block mb-2">
                    Uploaded Visual Evidence
                  </span>
                  <img
                    src={complaint.imageUrl}
                    alt="Citizen Evidence"
                    className="max-h-72 rounded-lg object-contain bg-black/5 mx-auto border border-slate-300"
                  />
                </div>
              )}
            </div>
          )}

          {/* TAB 2: AI INTELLIGENCE & BRIEF */}
          {activeTab === 'ai-brief' && (
            <div className="space-y-5 text-xs text-slate-700">
              {/* Intelligence Engine Tag */}
              <div className="flex items-center justify-between p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-indigo-950">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  <span className="font-bold text-xs">
                    {complaint.aiAnalysis.isGeminiPowered
                      ? `Evaluated with Gemini 3.8 Flash (${complaint.aiAnalysis.modelUsed || 'SDK'})`
                      : 'Evaluated with CivicPulse Deterministic Intelligence Engine'}
                  </span>
                </div>
                <span className="text-[11px] text-indigo-700 font-mono">
                  {new Date(complaint.aiAnalysis.analysisTimestamp).toLocaleTimeString()}
                </span>
              </div>

              {/* 100-Point Explainable Score Breakdown */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                    Explainable 100-Point Priority Model
                  </span>
                  <span className="text-xs font-mono font-bold text-blue-700">
                    Total: {complaint.aiAnalysis.priorityScore.total} / 100
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-500 font-bold uppercase block">Safety (Max 35)</span>
                    <span className="text-base font-extrabold text-red-600">
                      {complaint.aiAnalysis.priorityScore.safety}
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Physical danger</span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-500 font-bold uppercase block">Urgency (Max 25)</span>
                    <span className="text-base font-extrabold text-orange-600">
                      {complaint.aiAnalysis.priorityScore.urgency}
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Rate of escalation</span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-500 font-bold uppercase block">Crowd Impact (Max 20)</span>
                    <span className="text-base font-extrabold text-purple-600">
                      {complaint.aiAnalysis.priorityScore.crowdImpact}
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Commuters/Schools</span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-500 font-bold uppercase block">Infrastructure (Max 20)</span>
                    <span className="text-base font-extrabold text-blue-600">
                      {complaint.aiAnalysis.priorityScore.infrastructureImpact}
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Asset damage</span>
                  </div>
                </div>

                <p className="text-xs text-slate-600 italic bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <strong>Scoring Reason:</strong> {complaint.aiAnalysis.priorityScore.reasoning}
                </p>
              </div>

              {/* Duplicate Warnings (Part 3 Requirement 3) */}
              {complaint.aiAnalysis.duplicates.length > 0 && (
                <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-amber-900 font-bold text-xs uppercase tracking-wider mb-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span>Duplicate Complaint Warning ({complaint.aiAnalysis.duplicates.length} match)</span>
                  </div>
                  <p className="text-xs text-amber-800 mb-2">
                    CivicPulse detected existing reports in close proximity with similar characteristics:
                  </p>
                  <div className="space-y-2">
                    {complaint.aiAnalysis.duplicates.map(d => (
                      <div
                        key={d.complaintId}
                        className="bg-white p-3 rounded-lg border border-amber-200 flex items-center justify-between gap-3 text-xs"
                      >
                        <div>
                          <div className="font-bold text-slate-900">
                            <span className="font-mono text-blue-700">{d.complaintId}</span>: {d.title}
                          </div>
                          <p className="text-[11px] text-slate-600 mt-0.5">{d.reason}</p>
                        </div>
                        {onOpenAnotherComplaint && (
                          <button
                            onClick={() => onOpenAnotherComplaint(d.complaintId)}
                            className="text-xs text-blue-600 hover:underline font-semibold shrink-0"
                          >
                            Inspect Duplicate
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* AI-Generated Action Brief (Part 3 Requirement 4) */}
              <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-200 space-y-2.5">
                <span className="font-bold text-blue-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  AI-Generated Municipal Action Brief
                </span>

                <div className="space-y-2 text-xs">
                  <div>
                    <span className="font-bold text-slate-800">What Happened: </span>
                    <span className="text-slate-700">{complaint.aiAnalysis.actionBrief.whatHappened}</span>
                  </div>
                  <div>
                    <span className="font-bold text-slate-800">Where: </span>
                    <span className="text-slate-700">{complaint.aiAnalysis.actionBrief.where}</span>
                  </div>
                  <div>
                    <span className="font-bold text-slate-800">Why Important: </span>
                    <span className="text-slate-700">{complaint.aiAnalysis.actionBrief.whyImportant}</span>
                  </div>
                  <div>
                    <span className="font-bold text-slate-800">Who May Be Affected: </span>
                    <span className="text-slate-700">{complaint.aiAnalysis.actionBrief.whoAffected}</span>
                  </div>
                  <div className="p-2.5 bg-blue-100/70 rounded-lg text-blue-950 font-medium">
                    <strong>Recommended Municipal Next Step: </strong>
                    {complaint.aiAnalysis.actionBrief.recommendedNextStep}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ADMINISTRATIVE ACTIONS */}
          {activeTab === 'actions' && (
            <div className="space-y-5 text-xs text-slate-700">
              {/* 1. Workflow Status */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <label className="font-bold text-slate-900 block text-xs uppercase tracking-wider">
                  1. Update Administrative Status *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {WORKFLOW_STATUSES.map(st => {
                    const isSelected = selectedStatus === st;
                    return (
                      <button
                        key={st}
                        type="button"
                        onClick={() => setSelectedStatus(st)}
                        className={`p-2 rounded-lg text-xs font-semibold text-center border transition-all ${
                          isSelected
                            ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                            : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                        }`}
                      >
                        {st}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Department & Officer Assignment */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <label className="font-bold text-slate-900 block text-xs uppercase tracking-wider">
                  2. Department Routing & Officer Assignment
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <span className="block text-[11px] font-semibold text-slate-600 mb-1">Assigned Department</span>
                    <select
                      value={selectedDepartment}
                      onChange={e => setSelectedDepartment(e.target.value as DepartmentName)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white text-slate-800 focus:ring-2 focus:ring-blue-500"
                    >
                      {DEPARTMENTS.map(d => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <span className="block text-[11px] font-semibold text-slate-600 mb-1">Assign Officer / Engineer</span>
                    <input
                      type="text"
                      value={assignedOfficer}
                      onChange={e => setAssignedOfficer(e.target.value)}
                      placeholder="e.g. Er. Anand Hiremath"
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white text-slate-800 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* 3. Priority Manual Override (Part 3 Requirement 2) */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                    3. Manual Priority Override
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowOverrideBox(!showOverrideBox)}
                    className="text-xs text-blue-600 font-semibold hover:underline"
                  >
                    {showOverrideBox ? 'Cancel Override' : 'Override Priority Level'}
                  </button>
                </div>

                {showOverrideBox ? (
                  <div className="mt-2 p-3 bg-white border border-slate-300 rounded-lg space-y-2">
                    <span className="text-[11px] text-slate-500">
                      Original AI Priority: <strong>{complaint.priority}</strong>
                    </span>
                    <div className="grid grid-cols-4 gap-2">
                      {(['Critical', 'High', 'Medium', 'Low'] as PriorityLevel[]).map(lvl => (
                        <button
                          key={lvl}
                          type="button"
                          onClick={() => setOverridePriority(lvl)}
                          className={`py-1.5 px-2 rounded text-xs font-bold border ${
                            overridePriority === lvl
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'bg-slate-50 text-slate-700 border-slate-300'
                          }`}
                        >
                          {lvl}
                        </button>
                      ))}
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Mandatory Override Justification *
                      </label>
                      <input
                        type="text"
                        value={overrideReason}
                        onChange={e => setOverrideReason(e.target.value)}
                        placeholder="e.g. On-ground site inspection showed transformer isolated; risk reduced."
                        className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg text-slate-800"
                      />
                    </div>
                  </div>
                ) : complaint.manualPriorityOverride ? (
                  <div className="text-[11px] text-amber-800 bg-amber-50 p-2 rounded border border-amber-200">
                    Overridden from <strong>{complaint.manualPriorityOverride.originalPriority}</strong> to{' '}
                    <strong>{complaint.manualPriorityOverride.newPriority}</strong> by{' '}
                    {complaint.manualPriorityOverride.overriddenBy}.
                    <br />
                    Reason: "{complaint.manualPriorityOverride.reason}"
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-500">
                    Current priority is <strong>{complaint.priority}</strong> (AI-calculated).
                  </p>
                )}
              </div>

              {/* 4. Public Progress Update */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <span className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
                  4. Add Public Citizen Progress Update (Visible on Citizen Portal)
                </span>
                <input
                  type="text"
                  value={newPublicUpdate}
                  onChange={e => setNewPublicUpdate(e.target.value)}
                  placeholder="e.g. Repair crew has reached site. Replacement cable being pulled."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white text-slate-800"
                />
              </div>

              {/* 5. Private Administrative Internal Note (Strictly Hidden from Citizens) */}
              <div className="p-4 bg-amber-50/50 border border-amber-200 rounded-xl space-y-2">
                <span className="font-bold text-amber-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-amber-700" />
                  5. Private Internal Note (Strictly Municipal Officers Only)
                </span>
                <input
                  type="text"
                  value={newInternalNote}
                  onChange={e => setNewInternalNote(e.target.value)}
                  placeholder="e.g. Contractor penalty clause 4 initiated for unbarricaded trench."
                  className="w-full px-3 py-2 text-xs border border-amber-300 rounded-lg bg-white text-slate-800"
                />
              </div>

              {/* 6. Resolution Summary (if marking resolved) */}
              {selectedStatus === 'Resolved' && (
                <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl space-y-2">
                  <span className="font-bold text-emerald-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                    6. Formal Resolution Summary *
                  </span>
                  <textarea
                    rows={2}
                    value={resolutionSummary}
                    onChange={e => setResolutionSummary(e.target.value)}
                    placeholder="Describe how the problem was resolved, assets replaced, and testing done..."
                    className="w-full px-3 py-2 text-xs border border-emerald-300 rounded-lg bg-white text-slate-800"
                  />
                </div>
              )}
            </div>
          )}

          {/* TAB 4: AUDIT HISTORY & INTERNAL NOTES */}
          {activeTab === 'audit' && (
            <div className="space-y-5 text-xs text-slate-700">
              {/* Private Notes Section */}
              <div className="p-4 bg-amber-50/40 rounded-xl border border-amber-200">
                <span className="font-bold text-amber-900 text-xs uppercase tracking-wider block mb-3 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-amber-700" />
                  Private Municipal Internal Notes Log
                </span>

                {complaint.internalNotes && complaint.internalNotes.length > 0 ? (
                  <div className="space-y-2">
                    {complaint.internalNotes.map(n => (
                      <div key={n.id} className="p-2.5 bg-white rounded border border-amber-200 text-xs">
                        <p className="font-medium text-slate-800">{n.note}</p>
                        <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                          <span>{n.author}</span>
                          <span>{new Date(n.timestamp).toLocaleString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic">No internal notes logged yet.</p>
                )}
              </div>

              {/* Status Audit Timeline */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <span className="font-bold text-slate-900 text-xs uppercase tracking-wider block mb-3">
                  Complete Status Change Audit Log
                </span>
                <div className="space-y-3">
                  {complaint.statusHistory.map((hist, i) => (
                    <div key={i} className="flex gap-2.5 items-start">
                      <div className="w-2 h-2 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                      <div className="flex-1 bg-white p-2.5 rounded border border-slate-200">
                        <div className="flex items-center justify-between font-semibold text-slate-800">
                          <span>Status: {hist.status}</span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {new Date(hist.timestamp).toLocaleString()}
                          </span>
                        </div>
                        {hist.note && <p className="text-[11px] text-slate-600 mt-0.5">{hist.note}</p>}
                        <span className="text-[10px] text-slate-400 block mt-1">Updated by: {hist.changedBy}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer / Save Actions */}
        <div className="bg-slate-50 p-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="py-2.5 px-4 rounded-xl border border-slate-300 text-slate-700 font-semibold text-xs hover:bg-slate-100 transition-colors"
          >
            Close
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="py-2.5 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs transition-colors shadow-xs flex items-center gap-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            <span>Save Municipal Changes</span>
          </button>
        </div>
      </div>
    </div>
  );
};
