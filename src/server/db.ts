/**
 * CivicPulse AI - Persistent Shared Backend Database Store
 * Implements persistent JSON storage with strict role-based data projection and municipal access enforcement.
 */

import fs from 'fs';
import path from 'path';
import { Complaint, User } from '../types/index.ts';
import { INITIAL_COMPLAINTS, INITIAL_USERS } from './seedData.ts';

interface DatabaseSchema {
  users: User[];
  complaints: Complaint[];
  version: number;
  lastUpdated: string;
}

const DB_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'civicpulse_db.json');

function ensureDb(): DatabaseSchema {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }

  if (!fs.existsSync(DB_FILE)) {
    const initialData: DatabaseSchema = {
      users: INITIAL_USERS,
      complaints: INITIAL_COMPLAINTS,
      version: 1,
      lastUpdated: new Date().toISOString(),
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), 'utf-8');
    return initialData;
  }

  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading DB file, recreating with seed data:', err);
    const initialData: DatabaseSchema = {
      users: INITIAL_USERS,
      complaints: INITIAL_COMPLAINTS,
      version: 1,
      lastUpdated: new Date().toISOString(),
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), 'utf-8');
    return initialData;
  }
}

function saveDb(data: DatabaseSchema): void {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }
  data.lastUpdated = new Date().toISOString();
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

/**
 * Filter complaints with role-based field sanitization.
 * Citizens NEVER receive internalNotes!
 */
export function getComplaints(filter?: {
  city?: string;
  municipality?: string;
  status?: string;
  priority?: string;
  category?: string;
  search?: string;
  citizenEmail?: string;
  userRole?: 'citizen' | 'admin';
}): Complaint[] {
  const db = ensureDb();
  let list = [...db.complaints];

  // City filter
  if (filter?.city && filter.city.trim() !== '' && filter.city !== 'All Cities' && filter.city !== 'All') {
    const targetCity = filter.city.trim().toLowerCase();
    list = list.filter(c => c.location.city.toLowerCase() === targetCity);
  }

  // Municipality filter (for admin jurisdictions)
  if (filter?.municipality && filter.municipality !== 'ALL' && filter.municipality !== 'All Municipalities') {
    const targetMuni = filter.municipality.trim().toLowerCase();
    list = list.filter(c => c.municipality.toLowerCase().includes(targetMuni) || targetMuni.includes(c.municipality.toLowerCase()));
  }

  // Status filter
  if (filter?.status && filter.status !== 'All' && filter.status !== 'ALL') {
    list = list.filter(c => c.status === filter.status);
  }

  // Priority filter
  if (filter?.priority && filter.priority !== 'All' && filter.priority !== 'ALL') {
    list = list.filter(c => c.priority === filter.priority);
  }

  // Category filter
  if (filter?.category && filter.category !== 'All' && filter.category !== 'ALL') {
    list = list.filter(c => c.category === filter.category);
  }

  // Citizen filter (for "My Complaints" portal view)
  if (filter?.citizenEmail) {
    const email = filter.citizenEmail.toLowerCase().trim();
    list = list.filter(c => c.submittedBy.email.toLowerCase().trim() === email);
  }

  // Text search
  if (filter?.search && filter.search.trim() !== '') {
    const q = filter.search.toLowerCase().trim();
    list = list.filter(
      c =>
        c.id.toLowerCase().includes(q) ||
        c.title.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        c.location.area.toLowerCase().includes(q) ||
        c.location.city.toLowerCase().includes(q)
    );
  }

  // Sort descending by creation date
  list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // SANITIZATION: If requested by citizen or unauthenticated, strip internalNotes!
  if (filter?.userRole !== 'admin') {
    return list.map(c => {
      const copy = { ...c };
      delete copy.internalNotes;
      return copy;
    });
  }

  return list;
}

export function getComplaintById(id: string, userRole?: 'citizen' | 'admin'): Complaint | null {
  const db = ensureDb();
  const found = db.complaints.find(c => c.id.toUpperCase() === id.toUpperCase());
  if (!found) return null;

  if (userRole !== 'admin') {
    const copy = { ...found };
    delete copy.internalNotes;
    return copy;
  }
  return found;
}

export function addComplaint(complaint: Complaint): Complaint {
  const db = ensureDb();
  db.complaints.unshift(complaint);
  saveDb(db);
  return complaint;
}

export function updateComplaint(
  id: string,
  updater: (complaint: Complaint) => Complaint
): Complaint | null {
  const db = ensureDb();
  const index = db.complaints.findIndex(c => c.id.toUpperCase() === id.toUpperCase());
  if (index === -1) return null;

  const current = db.complaints[index];
  const updated = updater({ ...current });
  updated.updatedAt = new Date().toISOString();
  db.complaints[index] = updated;
  saveDb(db);
  return updated;
}

export function resetToSeedData(): { count: number } {
  const db: DatabaseSchema = {
    users: INITIAL_USERS,
    complaints: INITIAL_COMPLAINTS,
    version: 1,
    lastUpdated: new Date().toISOString(),
  };
  saveDb(db);
  return { count: INITIAL_COMPLAINTS.length };
}

// User auth helpers
export function findUserByEmail(email: string): User | null {
  const db = ensureDb();
  return db.users.find(u => u.email.toLowerCase() === email.toLowerCase().trim()) || null;
}

export function registerUser(user: User): User {
  const db = ensureDb();
  const existing = db.users.find(u => u.email.toLowerCase() === user.email.toLowerCase().trim());
  if (existing) return existing;
  db.users.push(user);
  saveDb(db);
  return user;
}
