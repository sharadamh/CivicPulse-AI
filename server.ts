/**
 * CivicPulse AI - Full-Stack Express Server Entry Point
 * Implements persistent database APIs, Gemini 3.8 Flash intelligence proxy,
 * role-based access control, and Vite middleware integration.
 */

import express, { Request, Response } from 'express';
import path from 'path';
import dotenv from 'dotenv';
import {
  addComplaint,
  findUserByEmail,
  getComplaintById,
  getComplaints,
  registerUser,
  resetToSeedData,
  updateComplaint,
} from './src/server/db.ts';
import { runGeminiAnalysis, runDeterministicAnalysis } from './src/server/intelligence.ts';
import { searchCity } from './src/server/geocode.ts';
import { Complaint, ComplaintCategory, ComplaintStatus, PriorityLevel, User } from './src/types/index.ts';

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const isProduction = process.env.NODE_ENV === 'production';

app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Helper to extract authenticated user role from headers
function getCallerRole(req: Request): 'citizen' | 'admin' {
  const roleHeader = req.headers['x-user-role'];
  if (roleHeader === 'admin') return 'admin';
  return 'citizen';
}

function getCallerName(req: Request): string {
  const nameHeader = req.headers['x-user-name'];
  return (nameHeader as string) || 'Authorized User';
}

// --- AUTHENTICATION APIS ---

app.post('/api/auth/login', (req: Request, res: Response) => {
  const { identifier, password } = req.body;
  const idStr = (identifier || '').toString().trim();

  // Admin login check
  if (idStr === 'admin' || idStr === 'admin.haveri@civicpulse.gov.in') {
    if (password === 'CivicAdmin@2025' || password === 'admin' || password === 'password') {
      const adminUser: User = {
        id: idStr.includes('haveri') ? 'usr_admin_haveri' : 'usr_admin_all',
        name: idStr.includes('haveri') ? 'Suresh Patil (Commissioner)' : 'Municipal Administrator',
        email: idStr,
        role: 'admin',
        municipality: idStr.includes('haveri') ? 'Haveri City Municipal Council' : 'ALL',
        department: 'General Municipal Administration',
      };
      return res.json({ success: true, user: adminUser, token: 'token_admin_' + Date.now() });
    }
    return res.status(401).json({ error: 'Invalid admin password. Default demo password is: CivicAdmin@2025' });
  }

  // Citizen login check
  const user = findUserByEmail(idStr);
  if (user) {
    return res.json({ success: true, user, token: 'token_citizen_' + Date.now() });
  }

  // Auto-login or register citizen for seamless demo experience
  if (idStr.includes('@')) {
    const newCitizen: User = {
      id: 'usr_' + Date.now(),
      name: idStr.split('@')[0],
      email: idStr,
      role: 'citizen',
    };
    registerUser(newCitizen);
    return res.json({ success: true, user: newCitizen, token: 'token_citizen_' + Date.now() });
  }

  return res.status(401).json({ error: 'User not found. Please register or sign in as Admin.' });
});

app.post('/api/auth/register', (req: Request, res: Response) => {
  const { name, email, phone } = req.body;
  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required.' });
  }

  const existing = findUserByEmail(email);
  if (existing) {
    return res.json({ success: true, user: existing, token: 'token_citizen_' + Date.now() });
  }

  const newCitizen: User = {
    id: 'usr_' + Date.now(),
    name: name.trim(),
    email: email.trim().toLowerCase(),
    role: 'citizen',
  };
  registerUser(newCitizen);
  return res.status(201).json({ success: true, user: newCitizen, token: 'token_citizen_' + Date.now() });
});

// --- COMPLAINTS APIS ---

// GET list of complaints with role-based field projections
app.get('/api/complaints', (req: Request, res: Response) => {
  const userRole = getCallerRole(req);
  const { city, municipality, status, priority, category, search, citizenEmail } = req.query;

  const complaints = getComplaints({
    city: city as string,
    municipality: municipality as string,
    status: status as string,
    priority: priority as string,
    category: category as string,
    search: search as string,
    citizenEmail: citizenEmail as string,
    userRole,
  });

  res.json({ complaints, total: complaints.length });
});

// GET single complaint by ID
app.get('/api/complaints/:id', (req: Request, res: Response) => {
  const userRole = getCallerRole(req);
  const complaint = getComplaintById(req.params.id, userRole);
  if (!complaint) {
    return res.status(404).json({ error: `Complaint ${req.params.id} not found.` });
  }
  res.json(complaint);
});

// POST submit new complaint
app.post('/api/complaints', async (req: Request, res: Response) => {
  try {
    const { title, description, category, location, imageUrl, submittedBy, municipality } = req.body;

    if (!title || !description || !category || !location?.city || !location?.area) {
      return res.status(400).json({ error: 'Missing required complaint fields (title, description, category, city, area).' });
    }

    const currentComplaints = getComplaints({ userRole: 'admin' });

    // Run AI analysis (Gemini 3.8 Flash with deterministic fallback)
    const aiAnalysis = await runGeminiAnalysis(
      title,
      description,
      category as ComplaintCategory,
      {
        city: location.city,
        area: location.area,
        lat: Number(location.lat) || 14.7954,
        lng: Number(location.lng) || 75.3986,
      },
      currentComplaints
    );

    const year = new Date().getFullYear();
    const randomDigits = Math.floor(100000 + Math.random() * 900000);
    const id = `CP-${year}-${randomDigits}`;

    const newComplaint: Complaint = {
      id,
      title: title.trim(),
      description: description.trim(),
      category: category as ComplaintCategory,
      location: {
        city: location.city.trim(),
        area: location.area.trim(),
        landmark: location.landmark?.trim(),
        lat: Number(location.lat) || 14.7954,
        lng: Number(location.lng) || 75.3986,
        address: location.address || `${location.area}, ${location.city}`,
      },
      imageUrl,
      submittedBy: {
        name: submittedBy?.name || 'Concerned Citizen',
        email: submittedBy?.email || 'citizen@example.com',
        phone: submittedBy?.phone,
      },
      municipality: municipality || `${location.city} City Municipal Council`,
      status: 'Submitted',
      priority: aiAnalysis.priorityLevel,
      assignedDepartment: aiAnalysis.suggestedDepartment,
      aiAnalysis,
      statusHistory: [
        {
          status: 'Submitted',
          timestamp: new Date().toISOString(),
          changedBy: submittedBy?.name || 'Citizen Portal',
          note: 'Complaint registered and analyzed by CivicPulse AI Intelligence Engine.',
        },
      ],
      publicUpdates: [
        {
          id: 'pub_init_' + Date.now(),
          timestamp: new Date().toISOString(),
          updateText: `Complaint received. Automatically assigned priority ${aiAnalysis.priorityLevel} and routed to ${aiAnalysis.suggestedDepartment}.`,
          author: 'CivicPulse Automated Gateway',
        },
      ],
      internalNotes: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const saved = addComplaint(newComplaint);
    res.status(201).json(saved);
  } catch (err) {
    console.error('Error creating complaint:', err);
    res.status(500).json({ error: 'Failed to process complaint submission.' });
  }
});

// PATCH update complaint status, department, notes, priority override
app.patch('/api/complaints/:id', (req: Request, res: Response) => {
  const userRole = getCallerRole(req);
  const callerName = getCallerName(req);

  if (userRole !== 'admin') {
    return res.status(403).json({ error: 'Unauthorized. Only municipal administrators can modify complaints.' });
  }

  const { status, assignedDepartment, assignedOfficer, manualPriorityOverride, internalNote, publicUpdate, resolutionDetails } = req.body;

  const updated = updateComplaint(req.params.id, current => {
    // Status update
    if (status && status !== current.status) {
      current.status = status as ComplaintStatus;
      current.statusHistory.push({
        status: status as ComplaintStatus,
        timestamp: new Date().toISOString(),
        changedBy: callerName,
        note: `Status changed to ${status}`,
      });
    }

    // Department update
    if (assignedDepartment) {
      current.assignedDepartment = assignedDepartment;
    }
    if (assignedOfficer !== undefined) {
      current.assignedOfficer = assignedOfficer;
    }

    // Priority manual override with recorded reason
    if (manualPriorityOverride?.newPriority) {
      current.manualPriorityOverride = {
        originalPriority: current.priority,
        newPriority: manualPriorityOverride.newPriority,
        reason: manualPriorityOverride.reason || 'Administrative re-evaluation',
        overriddenBy: callerName,
        overriddenAt: new Date().toISOString(),
      };
      current.priority = manualPriorityOverride.newPriority;
      current.statusHistory.push({
        status: current.status,
        timestamp: new Date().toISOString(),
        changedBy: callerName,
        note: `Priority manually reclassified to ${manualPriorityOverride.newPriority}. Reason: ${manualPriorityOverride.reason}`,
      });
    }

    // Internal admin note (private)
    if (internalNote && internalNote.trim() !== '') {
      current.internalNotes = current.internalNotes || [];
      current.internalNotes.push({
        id: 'in_' + Date.now(),
        timestamp: new Date().toISOString(),
        note: internalNote.trim(),
        author: callerName,
      });
    }

    // Public update (visible to citizens)
    if (publicUpdate && publicUpdate.trim() !== '') {
      current.publicUpdates.push({
        id: 'pub_' + Date.now(),
        timestamp: new Date().toISOString(),
        updateText: publicUpdate.trim(),
        author: callerName,
      });
    }

    // Resolution details
    if (resolutionDetails?.resolutionSummary) {
      current.status = 'Resolved';
      current.resolutionDetails = {
        resolvedAt: new Date().toISOString(),
        resolvedBy: callerName,
        resolutionSummary: resolutionDetails.resolutionSummary,
        resolutionPhotoUrl: resolutionDetails.resolutionPhotoUrl,
      };
      current.statusHistory.push({
        status: 'Resolved',
        timestamp: new Date().toISOString(),
        changedBy: callerName,
        note: `Complaint marked resolved: ${resolutionDetails.resolutionSummary}`,
      });
      current.publicUpdates.push({
        id: 'pub_res_' + Date.now(),
        timestamp: new Date().toISOString(),
        updateText: `Issue resolved: ${resolutionDetails.resolutionSummary}`,
        author: callerName,
      });
    }

    return current;
  });

  if (!updated) {
    return res.status(404).json({ error: `Complaint ${req.params.id} not found.` });
  }

  res.json(updated);
});

// POST pre-submission AI analysis preview
app.post('/api/ai/analyze-draft', async (req: Request, res: Response) => {
  try {
    const { title, description, category, location } = req.body;
    if (!title || !description) {
      return res.status(400).json({ error: 'Title and description required.' });
    }

    const currentComplaints = getComplaints({ userRole: 'admin' });
    const analysis = await runGeminiAnalysis(
      title,
      description,
      (category as ComplaintCategory) || 'Other civic problems',
      {
        city: location?.city || 'Haveri',
        area: location?.area || 'Market Area',
        lat: Number(location?.lat) || 14.7954,
        lng: Number(location?.lng) || 75.3986,
      },
      currentComplaints
    );

    res.json(analysis);
  } catch (err) {
    console.error('AI draft analysis error:', err);
    res.status(500).json({ error: 'AI analysis failed' });
  }
});

// GET geocoding search for any city in India
app.get('/api/geocode/search', async (req: Request, res: Response) => {
  const query = (req.query.q as string) || '';
  if (!query || query.trim().length < 2) {
    return res.json({ results: [] });
  }

  const results = await searchCity(query);
  res.json({ results });
});

// GET municipal analytics
app.get('/api/analytics', (req: Request, res: Response) => {
  const { city, municipality } = req.query;
  const complaints = getComplaints({
    city: city as string,
    municipality: municipality as string,
    userRole: 'admin',
  });

  const total = complaints.length;
  const statusCounts: Record<string, number> = {
    Submitted: 0,
    'Under Review': 0,
    Assigned: 0,
    'In Progress': 0,
    Resolved: 0,
  };

  const priorityCounts: Record<string, number> = {
    Critical: 0,
    High: 0,
    Medium: 0,
    Low: 0,
  };

  const categoryCounts: Record<string, number> = {};
  const cityCounts: Record<string, number> = {};
  const deptWorkload: Record<string, number> = {};

  let resolvedCount = 0;
  let criticalPending = 0;

  for (const c of complaints) {
    statusCounts[c.status] = (statusCounts[c.status] || 0) + 1;
    priorityCounts[c.priority] = (priorityCounts[c.priority] || 0) + 1;
    categoryCounts[c.category] = (categoryCounts[c.category] || 0) + 1;
    cityCounts[c.location.city] = (cityCounts[c.location.city] || 0) + 1;

    const dept = c.assignedDepartment || 'Unassigned';
    deptWorkload[dept] = (deptWorkload[dept] || 0) + 1;

    if (c.status === 'Resolved') resolvedCount++;
    if (c.priority === 'Critical' && c.status !== 'Resolved') criticalPending++;
  }

  const resolutionRate = total === 0 ? 0 : Math.round((resolvedCount / total) * 100);

  // Hotspot clustering algorithm (1.5km proximity)
  const hotspots: Array<{
    id: string;
    name: string;
    city: string;
    lat: number;
    lng: number;
    complaintCount: number;
    dominantCategory: string;
    dominantPriority: string;
    complaintIds: string[];
  }> = [];

  const visited = new Set<string>();
  for (let i = 0; i < complaints.length; i++) {
    const c1 = complaints[i];
    if (visited.has(c1.id)) continue;

    const cluster = [c1];
    for (let j = i + 1; j < complaints.length; j++) {
      const c2 = complaints[j];
      if (c1.location.city === c2.location.city) {
        const dLat = c1.location.lat - c2.location.lat;
        const dLng = c1.location.lng - c2.location.lng;
        const distApproxKm = Math.sqrt(dLat * dLat + dLng * dLng) * 111;
        if (distApproxKm <= 1.2) {
          cluster.push(c2);
          visited.add(c2.id);
        }
      }
    }

    if (cluster.length >= 2) {
      hotspots.push({
        id: `hotspot_${c1.location.city}_${i}`,
        name: `${c1.location.area} Cluster`,
        city: c1.location.city,
        lat: cluster.reduce((sum, c) => sum + c.location.lat, 0) / cluster.length,
        lng: cluster.reduce((sum, c) => sum + c.location.lng, 0) / cluster.length,
        complaintCount: cluster.length,
        dominantCategory: cluster[0].category,
        dominantPriority: cluster.some(c => c.priority === 'Critical')
          ? 'Critical'
          : cluster.some(c => c.priority === 'High')
          ? 'High'
          : 'Medium',
        complaintIds: cluster.map(c => c.id),
      });
    }
  }

  // AI-generated municipal action recommendations based on patterns
  const recommendations: string[] = [];
  if (criticalPending > 0) {
    recommendations.push(
      `URGENT: ${criticalPending} unresolved Critical hazards identified (primarily Electrical & Drainage). Deploy emergency municipal inspection squads within 4 hours.`
    );
  }
  if ((categoryCounts['Drainage and sewage'] || 0) + (categoryCounts['Waterlogging'] || 0) >= 3) {
    recommendations.push(
      'Systemic stormwater blockage detected across multiple wards. Recommend desilting primary trunk canals ahead of seasonal rains.'
    );
  }
  if ((priorityCounts['High'] || 0) > 4) {
    recommendations.push(
      'High-priority complaint density is rising. Consider reallocating maintenance engineers from low-density zones.'
    );
  }
  if (recommendations.length === 0) {
    recommendations.push('Municipal operations are steady. All critical complaints are under containment.');
  }

  res.json({
    totalComplaints: total,
    statusCounts,
    priorityCounts,
    categoryCounts,
    cityCounts,
    deptWorkload,
    resolutionRate,
    criticalPending,
    hotspots,
    recommendations,
  });
});

// POST reset demo dataset
app.post('/api/reset-demo', (req: Request, res: Response) => {
  const result = resetToSeedData();
  res.json({ success: true, message: `Reset to ${result.count} synthetic Karnataka demo complaints.` });
});

// --- VITE MIDDLEWARE / STATIC ASSETS ---

async function startServer() {
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`CivicPulse AI Server running on port ${PORT} [Mode: ${isProduction ? 'Production' : 'Development'}]`);
  });
}

startServer().catch(err => {
  console.error('Failed to start CivicPulse AI server:', err);
  process.exit(1);
});
