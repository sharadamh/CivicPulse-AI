/**
 * CivicPulse AI - Core Domain Types
 */

export type ComplaintCategory =
  | 'Roads and potholes'
  | 'Waterlogging'
  | 'Drainage and sewage'
  | 'Garbage and waste management'
  | 'Streetlights'
  | 'Water supply'
  | 'Electrical hazards'
  | 'Public infrastructure'
  | 'Other civic problems';

export type PriorityLevel = 'Critical' | 'High' | 'Medium' | 'Low';

export type ComplaintStatus =
  | 'Submitted'
  | 'Under Review'
  | 'Assigned'
  | 'In Progress'
  | 'Resolved';

export type DepartmentName =
  | 'Road Works & Infrastructure'
  | 'Water Supply & Sewerage Board'
  | 'Solid Waste Management'
  | 'Electricity & Public Lighting'
  | 'Stormwater & Flood Management'
  | 'Public Health & Safety'
  | 'General Municipal Administration';

export interface PriorityScoreBreakdown {
  safety: number; // 0-35
  urgency: number; // 0-25
  crowdImpact: number; // 0-20
  infrastructureImpact: number; // 0-20
  total: number; // 0-100
  reasoning: string;
}

export interface DuplicateMatch {
  complaintId: string;
  title: string;
  category: string;
  similarityScore: number; // 0-100%
  distanceMeters?: number;
  reason: string;
}

export interface AIAnalysisResult {
  summary: string;
  mainProblem: string;
  detectedCategory: ComplaintCategory;
  affectedInfrastructure: string;
  possibleSafetyRisks: string[];
  suggestedDepartment: DepartmentName;
  priorityScore: PriorityScoreBreakdown;
  priorityLevel: PriorityLevel;
  actionBrief: {
    whatHappened: string;
    where: string;
    whyImportant: string;
    whoAffected: string;
    recommendedNextStep: string;
  };
  duplicates: DuplicateMatch[];
  isUrgentPublicSafety?: boolean;
  safetyAlerts?: string[];
  isGeminiPowered: boolean;
  modelUsed?: string;
  analysisTimestamp: string;
}

export interface StatusHistoryEntry {
  status: ComplaintStatus;
  timestamp: string;
  changedBy: string;
  note?: string;
}

export interface PublicUpdate {
  id: string;
  timestamp: string;
  updateText: string;
  author: string;
}

export interface InternalAdminNote {
  id: string;
  timestamp: string;
  note: string;
  author: string;
}

export interface ComplaintLocation {
  city: string;
  area: string;
  landmark?: string;
  lat: number;
  lng: number;
  address?: string;
}

export interface Complaint {
  id: string; // e.g. CP-2026-104921
  title: string;
  description: string;
  category: ComplaintCategory;
  location: ComplaintLocation;
  imageUrl?: string;
  submittedBy: {
    name: string;
    email: string;
    phone?: string;
  };
  municipality: string; // e.g. "Haveri Municipal Council", "BBMP Bengaluru", "Mysuru City Corporation"
  status: ComplaintStatus;
  priority: PriorityLevel;
  manualPriorityOverride?: {
    originalPriority: PriorityLevel;
    newPriority: PriorityLevel;
    reason: string;
    overriddenBy: string;
    overriddenAt: string;
  };
  assignedDepartment?: DepartmentName;
  assignedOfficer?: string;
  aiAnalysis: AIAnalysisResult;
  statusHistory: StatusHistoryEntry[];
  publicUpdates: PublicUpdate[];
  internalNotes?: InternalAdminNote[]; // Strip for citizen view!
  resolutionDetails?: {
    resolvedAt: string;
    resolvedBy: string;
    resolutionSummary: string;
    resolutionPhotoUrl?: string;
  };
  createdAt: string;
  updatedAt: string;
  isDemo?: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'citizen' | 'admin';
  municipality?: string; // If admin, assigned municipal jurisdiction or "ALL"
  department?: DepartmentName;
}

export interface CityGeocodeResult {
  city: string;
  state: string;
  lat: number;
  lng: number;
  displayName: string;
  bounds?: [number, number, number, number];
}

export interface MunicipalHotspot {
  id: string;
  name: string;
  city: string;
  lat: number;
  lng: number;
  radiusMeters: number;
  complaintCount: number;
  dominantCategory: ComplaintCategory;
  dominantPriority: PriorityLevel;
  complaintIds: string[];
}
