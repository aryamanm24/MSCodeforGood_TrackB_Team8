# Lemontree Community Impact Hub

Multi-persona analytics dashboard for Lemontree food access partners — built for Morgan Stanley Code for Good 2026, Track B, Team 8.

## Quick start

```bash
cd frontend
npm install
npm install lucide-react
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## App structure

```
/ (localhost:3000)          → Login page (persona selector)
/dashboard (localhost:3000/dashboard) → Map + analytics dashboard
```

---

## Three dashboard modes

**🏪 Pantry Operator** — Click a pin on the map. Right panel slides in with rating trends, wait time charts, feedback themes, and AI-suggested actions.

**💚 Donor / Funder** — Shows funded locations pulsing on the map. Panel shows families reached, before/after comparison, and impact report export.

**🏛 Government** — Poverty choropleth overlay on the map. Panel shows coverage gap analysis, critical zone cards, demand estimates, and CSV export.

---

## Key files

```
frontend/src/
├── app/
│   ├── page.js                  ← Login / landing page
│   ├── dashboard/
│   │   └── page.js              ← Main map + panel dashboard
│   ├── layout.js
│   └── globals.css
├── components/
│   ├── Navbar.jsx               ← Top header with mode toggle
│   ├── MapView.jsx              ← Leaflet map (mode-aware)
│   ├── OperatorPanel.jsx        ← Operator right panel
│   ├── DonorPanel.jsx           ← Donor right panel
│   ├── GovernmentPanel.jsx      ← Government right panel
│   ├── StatCard.jsx             ← Reusable metric card
│   └── FeedbackBars.jsx         ← Horizontal bar chart
└── lib/
    └── data.js                  ← Mock data (swap with API later)

backend/
    fetch_data.py                ← Fetches live Lemontree API
    lemontree_nyc.csv/.json      ← ~35 NYC pantries dataset
```

---

## Tech stack

| Layer | Tool |
|---|---|
| Frontend | Next.js 14 + React 18 |
| Maps | Leaflet.js |
| Charts | Recharts |
| Styling | Tailwind CSS |
| Icons | lucide-react |
| Data | Mock (`data.js`) → real API when backend ready |

---

## Connecting real data (backend team)

Replace imports in each component from:
```js
import { resources } from "@/lib/data"
```
To fetch calls hitting your API routes:
```js
const res = await fetch("/api/resources")
```

Backend API contracts needed by Saturday:
- `GET /api/resources` — enriched pantry list
- `GET /api/reviews/:id` — NLP-processed feedback
- `GET /api/government/gaps` — demand + census data
- `GET /api/donor/:id` — donor portfolio

---

## Deploy

```bash
npm run build
vercel deploy
```