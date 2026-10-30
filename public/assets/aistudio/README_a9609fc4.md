# CivicPulse AI

**PromptWars × ASTRA National Hackathon 2025**

> From Complaints to Action — AI for Civic Impact

A professional, fully functional AI-assisted civic complaint management platform that transforms scattered citizen reports into categorised, prioritised, trackable actions for authorities.

---

## Live Demo

Run locally (see setup below). Open `http://localhost:5173` in your browser.

### Demo Credentials

| Role | Username / Email | Password |
|------|-----------------|----------|
| **Admin** | `admin` | `CivicAdmin@2025` |
| **Citizen** | `citizen1@demo.com` | `Demo@1234` |

Register as a new citizen from the app's Registration tab.

---

## Features

### Citizen Portal
- Register and log in
- Submit complaints with title, description, category, location and optional photo
- Automatic unique tracking ID (`CP-YYYY-NNNNNN`)
- Track complaint status with a visual 5-step timeline
- Citizen-only view — admin notes are never shown

### Admin Dashboard
- View, search and filter all complaints
- Review AI-generated intelligence (priority score, summary, duplicates, department, action brief)
- Update complaint status (Submitted → Under Review → Assigned → In Progress → Resolved)
- Assign departments and officers
- Manually override AI-detected priority (preserved on save)
- Add internal notes (not visible to citizens)
- Full status history with timestamps

### Intelligence Engine (Rule-Based, Local)
| Feature | Description |
|---------|-------------|
| Category detection | Keyword matching against 7 complaint categories |
| Complaint summary | First sentence, capped at 120 chars |
| Priority scoring | 4-factor scoring: Safety (35%) + Urgency (25%) + Crowd (20%) + Infrastructure (20%) |
| Duplicate detection | Jaccard similarity + location overlap |
| Department suggestion | Category-to-department mapping with description overrides |
| Action brief | Structured recommendation for administrators |

**Priority thresholds:** Critical ≥ 50 · High ≥ 30 · Medium ≥ 15 · Low < 15

### Interactive Map
- Leaflet + OpenStreetMap tiles
- **Dynamic city search** using Nominatim geocoding — works for any Indian city
- Autocomplete suggestions as you type
- Colour-coded markers (Red=Critical, Orange=High, Yellow=Medium, Green=Low)
- Hotspot detection (500m grid clustering)
- Complaint filters (category, priority, status)
- Default view: Karnataka state overview
- Empty-state message when a city has no complaints

### Analytics
- Complaints by category (bar chart)
- Priority distribution (bar chart)
- Status breakdown (pie chart)
- Trend over time (area chart)
- Area insights derived from complaint patterns

---

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + Vite 8 |
| Styling | Tailwind CSS v4 (`@tailwindcss/vite`) |
| Maps | Leaflet + react-leaflet + OpenStreetMap |
| Geocoding | Nominatim API (free, no key required) |
| Charts | Recharts |
| Intelligence | Local rule-based engine (no external AI API) |
| Storage | Browser localStorage (demo only) |
| Auth | localStorage-based role auth (demo only) |

**No backend server. No API keys required.** Everything runs in the browser.

---

## Architecture

```
src/
  App.jsx                  ← Root: auth gate, tab routing, state
  components/
    AuthScreen.jsx         ← Login / Register / Admin login
    Header.jsx             ← Nav, user info, logout
    ComplaintForm.jsx      ← Citizen submission + intelligence preview
    ComplaintTracker.jsx   ← Citizen tracking with status timeline
    AdminDashboard.jsx     ← Admin statistics + table
    ComplaintTable.jsx     ← Filterable table with modals
    ComplaintModal.jsx     ← Status update, priority override, notes
    ComplaintMap.jsx       ← Leaflet map + Nominatim city search
    MapInsights.jsx        ← Map / Analytics / Area Insights tabs
    AnalyticsCharts.jsx    ← Recharts dashboard
    AreaInsights.jsx       ← Pattern-based insight cards
    StatCard.jsx           ← Reusable KPI card
  data/
    sampleComplaints.js    ← 25 synthetic complaints, real Karnataka coords
  intelligence/
    engine.js              ← Priority, category, summary, duplicate, dept
    hotspots.js            ← 500m grid clustering
    analytics.js           ← Aggregation helpers
  storage/
    persist.js             ← localStorage complaint storage (key v5)
    auth.js                ← localStorage auth (demo)
  utils/
    tracking.js            ← CP-YYYY-NNNNNN ID generation
```

---

## Setup Instructions

### Prerequisites
- Node.js ≥ 18
- npm ≥ 9

### Install and run

```bash
# Clone or extract the project
cd CivicPulse-AI

# Install dependencies
npm install

# Start development server
npm run dev
```

Open **http://localhost:5173**

### Production build

```bash
npm run build
# Output in dist/
```

---

## Demo Flow (5 minutes)

1. **Open the app** → land on Login screen
2. **Register** as a new citizen — fill name, email, password → account created
3. **Submit a complaint** — e.g. "Exposed electric wire near school entrance in Haveri"
   - Select Electricity, enter description, location, optionally upload photo
   - Click **Analyse with Intelligence Engine** → see Critical priority, score, department
   - Click **Submit Complaint** → get tracking ID (e.g. `CP-2025-178234`)
4. **Track the complaint** — paste tracking ID → see 5-step timeline at "Submitted"
5. **Sign out → Sign in as Admin** (admin / CivicAdmin@2025)
6. **Admin Dashboard** → find the complaint in the table → click Manage
   - Change status to "Assigned", select department, add note → Save
7. **Map & Insights** → type "Haveri" in the city search → map flies to Haveri → shows complaints
8. **Back to Citizen Portal** (sign out, sign in as citizen) → Track again → see "Assigned" status

---

## Sample Data

25 synthetic complaints across **7 Karnataka cities**:
- Bengaluru (MG Road, Indiranagar, Koramangala, Brigade Road)
- Mysuru (Bus Stand, Palace Road, Devaraja Market)
- Hubli (Keshwapur, Station Road)
- Haveri (Market Area, Bus Depot, Old Town)
- Dharwad (Court Circle, Unkal Lake)
- Belagavi (Camp Area, Tilakwadi)
- Mangaluru (Port Road, Panambur Beach)

All coordinates are **real GPS coordinates in Karnataka**. Complaint details are entirely fictional.

---

## AI Approach

The intelligence engine is **fully deterministic and rule-based** — no LLM, no API call, no randomness.

Priority calculation uses four weighted dimensions:
1. **Safety** (max 35 pts): keywords related to injury, danger, exposed wires, open manholes, children
2. **Urgency** (max 25 pts): broken, not working, overflowing, hanging, large, causing accidents
3. **Crowd Impact** (max 20 pts): community, main road, school, hospital, entire area
4. **Infrastructure** (max 20 pts): bridge, highway, transformer, sewer main

Each category also carries a **baseline score** (e.g. Electricity = +5 safety, +5 urgency) so even a minimal complaint in a high-risk category receives an appropriate minimum priority.

All reasoning is displayed to the citizen and admin — nothing is a black box.

---

## Known Limitations

| Limitation | Notes |
|------------|-------|
| localStorage auth | Not production-secure. Use a real backend with bcrypt + JWT for deployment |
| No shared database | Two different browsers/devices cannot see each other's complaints |
| Image analysis | Uploaded images are stored as base64 but not analysed (no vision AI connected) |
| No email service | Forgot-password and email notifications are not implemented |
| Nominatim rate limit | Free geocoding API; avoid rapid repeated searches |
| Sample data only 25 complaints | Hotspot detection needs ≥ 3 nearby complaints to trigger |

---

## Future Improvements

- Node.js + Express backend with SQLite / PostgreSQL
- JWT authentication with refresh tokens
- Real image classification (IBM Watson Visual Recognition or similar)
- SMS/email notifications on status change
- Citizen mobile app (React Native)
- Multilingual support (Kannada, Hindi)
- Bulk complaint import from CSV
- Export analytics as PDF/Excel
- Integration with municipal APIs

---

*Built for the PromptWars × ASTRA National Hackathon 2025*
