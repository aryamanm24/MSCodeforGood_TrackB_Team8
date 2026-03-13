# Lemontree Insights Dashboard

Multi-persona data visualization platform for Lemontree food access partners.

## Quick start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Architecture

The app is a single full-screen map with context-aware panels that change based on the active persona mode.

### Three modes (toggle at top center)

**Pantry Operator** — Map zooms to their location. Right panel slides in with:
- Rating + wait time stats with deltas
- 6-month trend sparklines (Recharts)
- Feedback theme breakdown (horizontal bars)
- Auto-generated action suggestion
- PDF export button

**Donor / Funder** — Map shows full city, funded locations pulse. Bottom drawer slides up with:
- Hero stat (families reached)
- Before/after comparison
- Per-location detail cards
- Testimonial from shared reviews
- Impact report export

**Government / Policy** — Map shows poverty choropleth overlay. Bottom drawer slides up with:
- Coverage gap bar chart
- Critical gap zone cards with population + demand estimates
- Region and timeframe filters
- Policy brief + CSV export

### Key files

```
src/
├── app/
│   ├── globals.css          # Tailwind + Leaflet overrides + animations
│   ├── layout.js            # Root layout
│   └── page.js              # Main orchestrator
├── components/
│   ├── ModeToggle.jsx       # Three-way persona switch
│   ├── MapView.jsx          # Leaflet map with mode-aware rendering
│   ├── OperatorPanel.jsx    # Right slide panel
│   ├── DonorPanel.jsx       # Bottom drawer
│   ├── GovernmentPanel.jsx  # Bottom drawer with charts
│   ├── StatCard.jsx         # Reusable metric card
│   └── FeedbackBars.jsx     # Horizontal bar component
└── lib/
    └── data.js              # Mock data (replace with API calls)
```

### Tech stack

- **Next.js 14** (App Router)
- **React 18**
- **Leaflet** via react-leaflet for maps
- **Recharts** for charts
- **Tailwind CSS** for styling
- **Framer Motion** available for additional animations

### Connecting to real data

Replace the mock data in `src/lib/data.js` with API calls to:
1. Lemontree Resources API (`GET /api/resources`)
2. Your PostgreSQL database (reviews, census tracts, demand estimates)
3. USDA Food Access Research Atlas data

All data fetching should happen in Next.js API routes (`src/app/api/`) 
which query your Supabase/PostgreSQL database.

### Deployment

```bash
npm run build
# Deploy to Vercel (Lemontree's existing platform)
vercel deploy
```
