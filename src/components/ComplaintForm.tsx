/**
 * CivicPulse AI - Citizen Complaint Submission Form
 * Designed for rapid < 1 minute submission with Gemini AI pre-analysis preview.
 */

import React, { useState } from 'react';
import {
  Send,
  Upload,
  Sparkles,
  MapPin,
  AlertTriangle,
  CheckCircle2,
  Copy,
  ArrowRight,
  ShieldAlert,
  Loader2,
  Building,
  Info,
} from 'lucide-react';
import { ComplaintCategory, AIAnalysisResult, Complaint, User } from '../types/index.ts';
import { analyzeDraft, submitComplaint } from '../services/api.ts';

interface ComplaintFormProps {
  currentUser: User | null;
  onComplaintSubmitted: (complaint: Complaint) => void;
  onTrackComplaint: (complaintId: string) => void;
  onOpenAuth: () => void;
}

const CATEGORIES: ComplaintCategory[] = [
  'Roads and potholes',
  'Waterlogging',
  'Drainage and sewage',
  'Garbage and waste management',
  'Streetlights',
  'Water supply',
  'Electrical hazards',
  'Public infrastructure',
  'Other civic problems',
];

const COMMON_CITIES = [
  'Haveri',
  'Bengaluru',
  'Mysuru',
  'Hubballi',
  'Dharwad',
  'Mangaluru',
  'Belagavi',
  'Ranebennur',
  'Davanagere',
  'Shivamogga',
];

const CITY_COORDS: Record<string, { lat: number; lng: number }> = {
  haveri: { lat: 14.7954, lng: 75.3986 },
  bengaluru: { lat: 12.9716, lng: 77.5946 },
  mysuru: { lat: 12.2958, lng: 76.6394 },
  hubballi: { lat: 15.3647, lng: 75.124 },
  dharwad: { lat: 15.4589, lng: 75.0078 },
  mangaluru: { lat: 12.9141, lng: 74.856 },
  belagavi: { lat: 15.8497, lng: 74.4977 },
  ranebennur: { lat: 14.6225, lng: 75.6219 },
  davanagere: { lat: 14.4644, lng: 75.9218 },
  shivamogga: { lat: 13.9299, lng: 75.5681 },
};

export const ComplaintForm: React.FC<ComplaintFormProps> = ({
  currentUser,
  onComplaintSubmitted,
  onTrackComplaint,
  onOpenAuth,
}) => {
  const [category, setCategory] = useState<ComplaintCategory>('Roads and potholes');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [city, setCity] = useState('Haveri');
  const [area, setArea] = useState('');
  const [landmark, setLandmark] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [aiPreview, setAiPreview] = useState<AIAnalysisResult | null>(null);
  const [submittedComplaint, setSubmittedComplaint] = useState<Complaint | null>(null);
  const [copiedId, setCopiedId] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handle Image Upload
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 8 * 1024 * 1024) {
        setError('Image file must be under 8MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Run AI Pre-Analysis Preview
  const handleAnalyzeDraft = async () => {
    if (!title || !description) {
      setError('Please provide a title and short description first to run AI intelligence.');
      return;
    }
    setError(null);
    setAnalyzing(true);
    try {
      const cityKey = city.toLowerCase().trim();
      const coords = CITY_COORDS[cityKey] || { lat: 14.7954, lng: 75.3986 };
      const analysis = await analyzeDraft({
        title,
        description,
        category,
        location: {
          city,
          area: area || 'Central Ward',
          lat: coords.lat,
          lng: coords.lng,
        },
      });
      setAiPreview(analysis);
    } catch (err: any) {
      setError('AI pre-analysis was unable to process. You can still submit your complaint directly.');
    } finally {
      setAnalyzing(false);
    }
  };

  // Submit Complaint
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || !city || !area) {
      setError('Please fill in all required fields (Category, Title, Description, City, Area).');
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      const cityKey = city.toLowerCase().trim();
      const coords = CITY_COORDS[cityKey] || { lat: 14.7954, lng: 75.3986 };

      const complaint = await submitComplaint({
        title,
        description,
        category,
        location: {
          city,
          area,
          landmark,
          lat: coords.lat,
          lng: coords.lng,
          address: `${area}, ${landmark ? landmark + ', ' : ''}${city}, Karnataka`,
        },
        imageUrl: imagePreview || undefined,
        submittedBy: {
          name: currentUser?.name || 'Concerned Citizen',
          email: currentUser?.email || 'citizen1@demo.com',
        },
        municipality: `${city} City Municipal Council`,
      });

      setSubmittedComplaint(complaint);
      onComplaintSubmitted(complaint);
    } catch (err: any) {
      setError(err.message || 'Failed to submit complaint. Please check your network and retry.');
    } finally {
      setSubmitting(false);
    }
  };

  const copyComplaintId = () => {
    if (submittedComplaint) {
      navigator.clipboard.writeText(submittedComplaint.id);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2500);
    }
  };

  // SUCCESS SCREEN
  if (submittedComplaint) {
    return (
      <div className="max-w-2xl mx-auto my-8 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-8 text-white text-center">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-xs">
            <CheckCircle2 className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight">Complaint Submitted Successfully!</h2>
          <p className="text-emerald-100 text-sm mt-1">
            Your grievance has been registered and routed to municipal authorities.
          </p>
        </div>

        <div className="p-8 space-y-6">
          {/* Tracking ID Box */}
          <div className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl p-5 text-center">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
              Your Unique Complaint Tracking ID
            </span>
            <div className="flex items-center justify-center gap-3">
              <span className="text-2xl sm:text-3xl font-mono font-extrabold text-blue-700 tracking-wider">
                {submittedComplaint.id}
              </span>
              <button
                onClick={copyComplaintId}
                className="p-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 transition-colors shadow-xs"
                title="Copy Tracking ID"
              >
                {copiedId ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <Copy className="w-5 h-5" />}
              </button>
            </div>
            {copiedId && <span className="text-xs text-emerald-600 font-medium block mt-1.5">Copied to clipboard!</span>}
          </div>

          {/* AI Intelligence Summary */}
          <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2 text-blue-900 font-bold text-sm">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span>AI Evaluation & Routing Summary</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs mb-3">
              <div className="bg-white p-2.5 rounded-lg border border-blue-100 shadow-2xs">
                <span className="text-slate-500 block text-[10px] uppercase font-semibold">Priority</span>
                <span
                  className={`font-bold inline-block px-1.5 py-0.5 rounded text-xs mt-0.5 ${
                    submittedComplaint.priority === 'Critical'
                      ? 'bg-red-100 text-red-800'
                      : submittedComplaint.priority === 'High'
                      ? 'bg-orange-100 text-orange-800'
                      : submittedComplaint.priority === 'Medium'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-green-100 text-green-800'
                  }`}
                >
                  {submittedComplaint.priority}
                </span>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-blue-100 shadow-2xs">
                <span className="text-slate-500 block text-[10px] uppercase font-semibold">Total Score</span>
                <span className="font-bold text-slate-800 text-sm">
                  {submittedComplaint.aiAnalysis.priorityScore.total}/100
                </span>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-blue-100 shadow-2xs col-span-2">
                <span className="text-slate-500 block text-[10px] uppercase font-semibold">Assigned Department</span>
                <span className="font-semibold text-slate-800 truncate block text-xs">
                  {submittedComplaint.assignedDepartment || 'General Administration'}
                </span>
              </div>
            </div>
            <p className="text-xs text-slate-600 italic">
              "{submittedComplaint.aiAnalysis.priorityScore.reasoning}"
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={() => onTrackComplaint(submittedComplaint.id)}
              className="flex-1 py-3 px-5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
            >
              <span>Track Complaint Status Now</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                setSubmittedComplaint(null);
                setTitle('');
                setDescription('');
                setArea('');
                setLandmark('');
                setImagePreview(null);
                setAiPreview(null);
              }}
              className="py-3 px-5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-sm transition-colors text-center"
            >
              Submit Another Complaint
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto my-6 px-4">
      {/* Header card */}
      <div className="mb-6 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Report a Civic Grievance
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">
            Submit road hazards, sewage spills, electrical dangers, or water issues. Powered by Gemini 3.8 Flash intelligence.
          </p>
        </div>
        {!currentUser && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 text-xs text-amber-800 flex items-center gap-2">
            <Info className="w-4 h-4 shrink-0 text-amber-600" />
            <span>
              Reporting as Guest Citizen.{' '}
              <button onClick={onOpenAuth} className="font-bold underline hover:text-amber-900">
                Sign in to save to your profile
              </button>
            </span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-xs text-red-700">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* 1. Category */}
            <div>
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                1. Select Civic Category *
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {CATEGORIES.map(cat => {
                  const isSelected = category === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => {
                        setCategory(cat);
                        setAiPreview(null);
                      }}
                      className={`p-2.5 rounded-xl border text-left text-xs font-semibold transition-all ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50/80 text-blue-900 ring-2 ring-blue-500/20'
                          : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Title */}
            <div>
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                2. Complaint Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={e => {
                  setTitle(e.target.value);
                  setAiPreview(null);
                }}
                placeholder="e.g. Exposed 440V live electric wire near Haveri Girls High School"
                className="w-full px-4 py-2.5 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 font-medium"
              />
            </div>

            {/* 3. Description */}
            <div>
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                3. Detailed Description *
              </label>
              <textarea
                required
                rows={3}
                value={description}
                onChange={e => {
                  setDescription(e.target.value);
                  setAiPreview(null);
                }}
                placeholder="Describe the issue, exact street, when it started, and who is at risk..."
                className="w-full px-4 py-2.5 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
              />
            </div>

            {/* 4. Location Details */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-blue-600" />
                4. Location & Municipal City *
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    City / Municipality *
                  </label>
                  <select
                    value={city}
                    onChange={e => {
                      setCity(e.target.value);
                      setAiPreview(null);
                    }}
                    className="w-full px-3 py-2 text-xs font-medium border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                  >
                    {COMMON_CITIES.map(c => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Area / Locality / Ward *
                  </label>
                  <input
                    type="text"
                    required
                    value={area}
                    onChange={e => setArea(e.target.value)}
                    placeholder="e.g. Old Bus Stand Road, Ward 4"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Landmark (Optional)
                </label>
                <input
                  type="text"
                  value={landmark}
                  onChange={e => setLandmark(e.target.value)}
                  placeholder="e.g. Opposite Bapuji College Gate, near water tank"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                />
              </div>
            </div>

            {/* 5. Image Upload */}
            <div>
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                5. Upload Photo (Optional)
              </label>
              <div className="border-2 border-dashed border-slate-300 hover:border-blue-400 rounded-xl p-4 text-center transition-colors">
                {imagePreview ? (
                  <div className="relative inline-block">
                    <img
                      src={imagePreview}
                      alt="Complaint Preview"
                      className="max-h-48 rounded-lg object-cover shadow-sm mx-auto"
                    />
                    <button
                      type="button"
                      onClick={() => setImagePreview(null)}
                      className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-full text-xs shadow-md"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <div>
                    <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                    <p className="text-xs text-slate-600">
                      Click to upload photograph or evidence (PNG, JPG up to 8MB)
                    </p>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="mt-2 text-xs text-slate-500 file:mr-2 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={handleAnalyzeDraft}
                disabled={analyzing || !title || !description}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-indigo-300 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 font-semibold text-xs transition-colors flex items-center justify-center gap-2 shadow-2xs"
              >
                {analyzing ? (
                  <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                ) : (
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                )}
                <span>Analyze with Gemini AI</span>
              </button>

              <button
                type="submit"
                disabled={submitting}
                className="w-full sm:flex-1 py-3 px-6 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                <span>Submit Grievance to Municipality</span>
              </button>
            </div>
          </form>
        </div>

        {/* AI Intelligence Sidebar Preview (1 col) */}
        <div className="space-y-4">
          <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-sm border border-slate-800">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-5 h-5 text-indigo-400" />
              <h3 className="font-bold text-sm tracking-tight">Gemini 3.8 AI Assistant</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              CivicPulse AI automatically evaluates civic risks using a 100-point model, alerts on duplicate complaints, and routes directly to the correct department.
            </p>

            {aiPreview ? (
              <div className="space-y-3 bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs">
                {/* Priority Badge */}
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-[11px]">Calculated Priority:</span>
                  <span
                    className={`font-bold px-2 py-0.5 rounded text-xs ${
                      aiPreview.priorityLevel === 'Critical'
                        ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                        : aiPreview.priorityLevel === 'High'
                        ? 'bg-orange-500/20 text-orange-300 border border-orange-500/40'
                        : aiPreview.priorityLevel === 'Medium'
                        ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/40'
                        : 'bg-green-500/20 text-green-300 border border-green-500/40'
                    }`}
                  >
                    {aiPreview.priorityLevel} ({aiPreview.priorityScore.total}/100)
                  </span>
                </div>

                {/* Score Breakdown */}
                <div className="grid grid-cols-2 gap-1.5 pt-2 border-t border-slate-800 text-[11px]">
                  <div className="text-slate-400">Safety Impact: <span className="text-white font-mono">{aiPreview.priorityScore.safety}/35</span></div>
                  <div className="text-slate-400">Urgency: <span className="text-white font-mono">{aiPreview.priorityScore.urgency}/25</span></div>
                  <div className="text-slate-400">Crowd Impact: <span className="text-white font-mono">{aiPreview.priorityScore.crowdImpact}/20</span></div>
                  <div className="text-slate-400">Infrastructure: <span className="text-white font-mono">{aiPreview.priorityScore.infrastructureImpact}/20</span></div>
                </div>

                {/* Suggested Department */}
                <div className="pt-2 border-t border-slate-800">
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Suggested Department:</span>
                  <span className="font-semibold text-blue-300">{aiPreview.suggestedDepartment}</span>
                </div>

                {/* Duplicate Alert */}
                {aiPreview.duplicates.length > 0 && (
                  <div className="pt-2 border-t border-slate-800">
                    <div className="flex items-center gap-1 text-amber-400 font-bold text-[11px] mb-1">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Possible Duplicate Detected</span>
                    </div>
                    <div className="bg-amber-950/40 border border-amber-800/60 rounded p-2 text-[10px] text-amber-200">
                      Matches complaint <strong>{aiPreview.duplicates[0].complaintId}</strong>: {aiPreview.duplicates[0].reason}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-slate-800/50 rounded-xl p-4 border border-dashed border-slate-700 text-center text-xs text-slate-400">
                Click <strong>"Analyze with Gemini AI"</strong> or start typing to see instant civic intelligence preview.
              </div>
            )}
          </div>

          {/* Civic Guidelines Card */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs text-xs space-y-2.5">
            <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-blue-600" />
              Administrative Response SLAs
            </h4>
            <div className="space-y-1.5 text-slate-600">
              <div className="flex items-center justify-between">
                <span className="text-red-700 font-semibold">• Critical Hazards:</span>
                <span className="font-mono text-slate-800 font-bold">&lt; 4 Hours</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-orange-700 font-semibold">• High Priority:</span>
                <span className="font-mono text-slate-800 font-bold">&lt; 24 Hours</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-yellow-700 font-semibold">• Medium Priority:</span>
                <span className="font-mono text-slate-800 font-bold">&lt; 48 Hours</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-green-700 font-semibold">• Routine Issues:</span>
                <span className="font-mono text-slate-800 font-bold">&lt; 7 Days</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
