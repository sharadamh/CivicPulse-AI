/**
 * CivicPulse AI - Client API Client
 * Manages HTTP communication with the Express backend, role headers, and caching.
 */

import { AIAnalysisResult, CityGeocodeResult, Complaint, User } from '../types/index.ts';

const USER_STORAGE_KEY = 'civicpulse_current_user';

export function getStoredUser(): User | null {
  try {
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setStoredUser(user: User | null): void {
  if (user) {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(USER_STORAGE_KEY);
  }
}

function getAuthHeaders(): HeadersInit {
  const user = getStoredUser();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (user) {
    headers['x-user-role'] = user.role;
    headers['x-user-name'] = user.name;
    headers['x-user-email'] = user.email;
  }
  return headers;
}

export async function loginUser(identifier: string, password?: string): Promise<{ user: User; token: string }> {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier, password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Login failed' }));
    throw new Error(err.error || 'Authentication failed');
  }
  const data = await res.json();
  setStoredUser(data.user);
  return data;
}

export async function registerCitizen(name: string, email: string, phone?: string): Promise<{ user: User; token: string }> {
  const res = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, phone }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Registration failed' }));
    throw new Error(err.error || 'Registration failed');
  }
  const data = await res.json();
  setStoredUser(data.user);
  return data;
}

export async function fetchComplaints(params?: {
  city?: string;
  municipality?: string;
  status?: string;
  priority?: string;
  category?: string;
  search?: string;
  citizenEmail?: string;
}): Promise<Complaint[]> {
  const query = new URLSearchParams();
  if (params?.city && params.city !== 'All Cities' && params.city !== 'All') query.set('city', params.city);
  if (params?.municipality && params.municipality !== 'ALL') query.set('municipality', params.municipality);
  if (params?.status && params.status !== 'All') query.set('status', params.status);
  if (params?.priority && params.priority !== 'All') query.set('priority', params.priority);
  if (params?.category && params.category !== 'All') query.set('category', params.category);
  if (params?.search) query.set('search', params.search);
  if (params?.citizenEmail) query.set('citizenEmail', params.citizenEmail);

  const res = await fetch(`/api/complaints?${query.toString()}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    throw new Error('Failed to fetch complaints from municipal database');
  }
  const data = await res.json();
  return data.complaints || [];
}

export async function fetchComplaintById(id: string): Promise<Complaint> {
  const res = await fetch(`/api/complaints/${encodeURIComponent(id)}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    throw new Error(`Complaint ${id} not found.`);
  }
  return res.json();
}

export async function submitComplaint(payload: Partial<Complaint>): Promise<Complaint> {
  const res = await fetch('/api/complaints', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Submission failed' }));
    throw new Error(err.error || 'Failed to submit complaint');
  }
  return res.json();
}

export async function updateComplaint(
  id: string,
  payload: {
    status?: string;
    assignedDepartment?: string;
    assignedOfficer?: string;
    manualPriorityOverride?: { newPriority: string; reason: string };
    internalNote?: string;
    publicUpdate?: string;
    resolutionDetails?: { resolutionSummary: string };
  }
): Promise<Complaint> {
  const res = await fetch(`/api/complaints/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Update failed' }));
    throw new Error(err.error || 'Failed to update complaint');
  }
  return res.json();
}

export async function analyzeDraft(draft: {
  title: string;
  description: string;
  category: string;
  location: { city: string; area: string; lat?: number; lng?: number };
}): Promise<AIAnalysisResult> {
  const res = await fetch('/api/ai/analyze-draft', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(draft),
  });
  if (!res.ok) {
    throw new Error('AI analysis preview failed');
  }
  return res.json();
}

export async function searchCitiesGeocode(query: string): Promise<CityGeocodeResult[]> {
  const res = await fetch(`/api/geocode/search?q=${encodeURIComponent(query)}`);
  if (!res.ok) return [];
  const data = await res.json();
  return data.results || [];
}

export async function geocodeAddressApi(
  area: string,
  city: string,
  landmark?: string
): Promise<{ lat: number; lng: number; displayName: string }> {
  const query = new URLSearchParams({ area, city, landmark: landmark || '' });
  const res = await fetch(`/api/geocode/address?${query.toString()}`);
  if (!res.ok) {
    return { lat: 14.7954, lng: 75.3986, displayName: `${area}, ${city}, Karnataka` };
  }
  return res.json();
}

export async function fetchAnalytics(params?: { city?: string; municipality?: string }): Promise<{
  totalComplaints: number;
  statusCounts: Record<string, number>;
  priorityCounts: Record<string, number>;
  categoryCounts: Record<string, number>;
  cityCounts: Record<string, number>;
  deptWorkload: Record<string, number>;
  resolutionRate: number;
  criticalPending: number;
  hotspots: Array<{
    id: string;
    name: string;
    city: string;
    lat: number;
    lng: number;
    complaintCount: number;
    dominantCategory: string;
    dominantPriority: string;
    complaintIds: string[];
  }>;
  recommendations: string[];
}> {
  const query = new URLSearchParams();
  if (params?.city && params.city !== 'All Cities' && params.city !== 'All') query.set('city', params.city);
  if (params?.municipality && params.municipality !== 'ALL') query.set('municipality', params.municipality);

  const res = await fetch(`/api/analytics?${query.toString()}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Failed to load analytics');
  return res.json();
}

export async function resetDemoDataset(): Promise<void> {
  await fetch('/api/reset-demo', {
    method: 'POST',
    headers: getAuthHeaders(),
  });
}
