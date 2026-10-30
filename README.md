# CivicPulse AI

**National Hackathon Entry: "From Complaints to Action — AI for Civic Impact"**

A professional, full-stack municipal civic grievance intelligence and action platform connecting citizens with municipal authorities across Karnataka and India.

---

## 1. Problem Statement
Municipal corporations receive hundreds of citizen complaints every month across disparate channels. Critical safety hazards (such as exposed live wires next to schools or open manholes on arterial pavements) get lost in queues behind routine issues. Lack of transparent progress tracking frustrates citizens, while municipal authorities struggle with duplicate complaints, ambiguous descriptions, and lack of explainable priority routing.

**CivicPulse AI** solves this through:
- **Instant Citizen Filing (< 1 minute)**: 9 structured categories, image upload, GPS geocoding, and pre-submission AI analysis.
- **Explainable 100-Point Priority Model**: Transparent, formula-based scoring (Safety /35, Urgency /25, Crowd Impact /20, Infrastructure /20) with recorded reasons—never a black box.
- **Duplicate Complaint Warnings**: Proximity (< 1.5km) and textual similarity analysis prevent duplicated field work orders without deleting records.
- **Dynamic Leaflet & Nominatim City Search**: Real GIS mapping supporting **any Indian city** (e.g. Haveri, Mysuru, Bengaluru, Dharwad, Hubballi, Mangaluru, Ranebennur, etc.) with strict city isolation and subtle hotspot detection.
- **Closed-Loop Administrative Action**: Clear workflow (`Submitted` → `Under Review` → `Assigned` → `In Progress` → `Resolved`), department routing, officer assignment, public timeline broadcast, and private internal notes.

---

## 2. Portals & Features

### A. Citizen Portal
1. **Quick Registration & Login**: Instant registration with name, email, and phone.
2. **Grievance Submission Form**:
   - 9 civic categories (Roads, Waterlogging, Drainage/Sewage, Garbage, Streetlights, Water Supply, Electrical, Public Infra, Other).
   - City and locality selector with GPS auto-detection.
   - Photographic evidence upload.
   - **Gemini AI Pre-Analysis Preview**: Real-time evaluation of severity score, safety risks, and duplicate warnings before submitting.
3. **Unique Tracking ID**: Generated as `CP-YYYY-NNNNNN` with copy-to-clipboard.
4. **Visual 5-Step Status Tracker**:
   - Live workflow timeline (`Submitted` → `Under Review` → `Assigned` → `In Progress` → `Resolved`).
   - Public progress updates and formal resolution details.
   - **Strict Privacy**: Citizens never see internal municipal notes.

### B. Municipal Admin Portal
1. **Executive Operational Dashboard**:
   - 8 Real-time KPIs: Total Complaints, Pending Action, Critical Hazards, High Priority, Assigned, In-Progress, Resolved, Resolution Rate (%).
   - Critical Hazard Attention Banner with 1-click dispatch.
2. **Filterable Grievance Directory**:
   - Multi-filter by city, status, priority, and category.
   - Export complaint registers to CSV.
3. **Detailed Complaint Management Modal**:
   - Full evidence view and citizen contact details.
   - AI Action Brief: What happened, Where, Why important, Who affected, Recommended next steps.
   - Duplicate warning cards with links to inspect matched complaints.
   - Manual priority override with recorded justification.
   - Public timeline broadcasts and private municipal officer notes.
   - Formal resolution logging with timestamps and resolving officer.
4. **Dynamic Leaflet GIS & Hotspot Command**:
   - Dynamic search for any valid city in India.
   - Color-coded markers: Red (Critical), Orange (High), Yellow (Medium), Green (Low).
   - Subtle hotspot circles highlighting repeated problem clusters without hiding markers.
5. **Municipal Analytics & Recommendations**:
   - Category distribution, priority breakdown, department workload, and city distributions.
   - AI-generated municipal action recommendations based on real complaint patterns.

---

## 3. Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, TypeScript, Tailwind CSS v4, Lucide Icons |
| **Backend** | Express 4, Node.js, `tsx` runtime |
| **GIS / Mapping** | Leaflet 1.9, OpenStreetMap tiles, OpenStreetMap Nominatim API |
| **AI Engine** | Google Gemini 3.8 Flash (`@google/genai` TypeScript SDK) + Deterministic 100-Point Rule Engine Fallback |
| **Data Storage** | Persistent JSON Database (`/data/civicpulse_db.json`) with role-based field sanitization |

---

## 4. Architecture & Security

```
[ Citizen / Admin Browser ]
            │
            ▼
[ Express Server (server.ts) on Port 3000 ]
 ├── /api/auth/*               -> Role-based authentication & session handling
 ├── /api/complaints           -> Role-projected complaint data (strips internalNotes for citizens)
 ├── /api/ai/analyze-draft     -> Server-side Gemini 3.8 Flash API proxy
 ├── /api/geocode/search       -> Nominatim geocoding proxy with memory caching
 └── /api/analytics            -> Dynamic KPI aggregations & hotspot clustering
            │
            ├── Persistent Store (`/data/civicpulse_db.json`)
            └── Google Gemini API (`gemini-3.8-flash`) via process.env.GEMINI_API_KEY
```

**Security & Privacy:**
- `GEMINI_API_KEY` is strictly managed server-side and is never exposed in client bundles.
- Citizens see only public updates; `internalNotes` are projected out at the database layer.
- Municipal administrators have access scoped to their assigned municipal jurisdiction (e.g. Haveri City Municipal Council).

---

## 5. 100-Point Explainable Priority Scoring Model

To prevent arbitrary "black box" decisions, CivicPulse AI enforces a transparent 100-point model:

| Factor | Weight | Evaluation Criteria |
|---|---|---|
| **Safety Impact** | 35 points | Exposed live wires, electric shocks, open manholes, cave-ins, collapse risks, children/school proximity. |
| **Urgency** | 25 points | Active flooding, overflowing sewage, gas leaks, immediate escalation potential. |
| **Crowd Impact** | 20 points | Main arterial roads, bus terminals, railway stations, markets, hospitals. |
| **Infrastructure Impact** | 20 points | Transformers, bridges, water supply mains, primary culverts. |

**Priority Tiers:**
- **Critical (≥ 50 pts)**: Immediate emergency dispatch (< 4 hours).
- **High (30–49 pts)**: Targeted inspection (< 24 hours).
- **Medium (15–29 pts)**: Standard municipal repair (< 48 hours).
- **Low (< 15 pts)**: Scheduled routine maintenance (< 7 days).

---

## 6. Demo Credentials

| Role | Username / Identifier | Password | Access Scope |
|---|---|---|---|
| **Municipal Admin (State Super Admin)** | `admin` | `CivicAdmin@2025` | All Karnataka Municipalities |
| **Haveri Municipal Commissioner** | `admin.haveri@civicpulse.gov.in` | `CivicAdmin@2025` | Haveri City Municipal Council |
| **Citizen (Deepak Rao)** | `citizen1@demo.com` | `Demo@1234` | Citizen Portal & Tracking |

*Quick login buttons are available directly inside the Sign In modal.*

---

## 7. Setup & Run Instructions

```bash
# 1. Install dependencies
npm install

# 2. Configure Environment (Optional - falls back cleanly to deterministic engine if key is absent)
# Add your Gemini API key to .env:
# GEMINI_API_KEY="your_google_ai_studio_key"

# 3. Start development server
npm run dev

# App runs on http://localhost:3000
```

---

## 8. Limitations & Future Roadmap
- **SMS / WhatsApp Gateway**: Add Twilio or Gupshup integration to send SMS tracking links upon submission.
- **Offline PWA Service Worker**: Cache map tiles for offline civic inspection in rural areas with weak mobile connectivity.
- **Multilingual Support**: Kannada and Hindi UI localization.
