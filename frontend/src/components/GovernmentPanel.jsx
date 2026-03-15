"use client";

import { useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  ScatterChart, Scatter, ZAxis, ReferenceArea,
} from "recharts";
import { govData as defaultGovData } from "@/lib/mockData";
import Footer from "./Footer";
import ALICETab from "./ALICETab";

// ── Constants ─────────────────────────────────────────────────────────────────

const TABS = [
  { id: "overview",    emoji: "📊", label: "Overview" },
  { id: "underserved", emoji: "🗺",  label: "Underserved Areas" },
  { id: "barriers",   emoji: "🚧", label: "Access Barriers" },
  { id: "gaps",       emoji: "🧊", label: "Resource Gaps" },
  { id: "alice", emoji: "👥", label: "True Demand" },

];

// Priority matrix data — ZIP codes by coverage (x) vs poverty (y), sized by food-insecure pop
const SCATTER_POINTS = [
  { zip: "10030", name: "Central Harlem N",  x: 1.37, y: 36.4,  size: 14943, color: "#EF4444", needScore: 74 },
  { zip: "10029", name: "East Harlem",        x: 1.03, y: 30.98, size: 33593, color: "#EF4444", needScore: 73 },
  { zip: "10039", name: "Washington Hts",     x: 1.23, y: 28.47, size: 12951, color: "#F59E0B", needScore: 67 },
  { zip: "10031", name: "Hamilton Hts",       x: 0.98, y: 23.95, size: 20471, color: "#F59E0B", needScore: 57 },
  { zip: "10032", name: "Washington Hts S",   x: 1.08, y: 22.41, size: 17449, color: "#F59E0B", needScore: 59 },
  { zip: "10038", name: "Financial District", x: 0,    y: 19.38, size: 6031,  color: "#F59E0B", needScore: 56 },
  { zip: "10016", name: "Murray Hill",        x: 0,    y: 10.78, size: 7996,  color: "#EAB308", needScore: 49 },
];

// ID barrier concentration by neighborhood (hardcoded estimates from tag cross-ref)
const ID_BARRIERS_BY_NBHD = [
  { name: "East Harlem (10029)",    pct: 68 },
  { name: "Central Harlem (10030)", pct: 58 },
  { name: "Washington Hts (10039)", pct: 47 },
  { name: "Hamilton Hts (10031)",   pct: 41 },
  { name: "Financial Dist (10038)", pct: 31 },
];

// Maps filter select values → govData.boroughStats keys
const BOROUGH_KEY_MAP = {
  manhattan:    "Manhattan",
  brooklyn:     "Brooklyn",
  queens:       "Queens",
  bronx:        "Bronx",
  staten_island: "StatenIsland",
};

// Maps filter select values → display names
const BOROUGH_DISPLAY = {
  manhattan:    "Manhattan",
  brooklyn:     "Brooklyn",
  queens:       "Queens",
  bronx:        "Bronx",
  staten_island: "Staten Island",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function needBadge(score) {
  if (score >= 70) return { bg: "#FEE2E2", text: "#991B1B", border: "#FECACA" };
  return { bg: "#FEF3C7", text: "#92400E", border: "#FDE68A" };
}

function povertyColor(pct) {
  if (pct >= 30) return "#DC2626";
  if (pct >= 20) return "#D97706";
  return "#374151";
}

function downloadCSV(govData) {
  const rows = [
    ["Type","ZIP","Neighborhood","Poverty %","Food Insecure","Population","Pantries","SNAP/Pantry","Need Score","Median Income"],
    ...(govData.underservedZips || []).map((z) => ["Underserved",z.zip,z.neighborhood,z.poverty,z.foodInsecurity,z.population,z.pantryCount,z.snapPerPantry,z.needScore,z.medianIncome]),
    ...(govData.zeroPantryZips || []).map((z) => ["Zero-pantry",z.zip,z.neighborhood,z.poverty,z.foodInsecurity,z.population,z.pantryCount,"—",z.needScore,z.medianIncome]),
  ];
  const csv = rows.map((r) => r.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "lemontree_coverage_gaps.csv";
  a.click();
  URL.revokeObjectURL(url);
}

// ── Shared sub-components ─────────────────────────────────────────────────────

function StatCard({ value, label, valueColor = "#111827", bg = "#F9FAFB", border = "#E5E7EB" }) {
  return (
    <div style={{ flex: 1, background: bg, border: `1px solid ${border}`, borderRadius: 12, padding: "12px 14px" }}>
      <div style={{ fontSize: 21, fontWeight: 800, color: valueColor, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 11, color: "#6B7280", marginTop: 4 }}>{label}</div>
    </div>
  );
}

// Custom dot for ScatterChart — color/size driven by payload
function ScatterDot({ cx, cy, payload }) {
  if (cx == null || cy == null) return null;
  const r = Math.max(Math.sqrt(payload.size / 500), 6);
  return (
    <circle cx={cx} cy={cy} r={r}
      fill={payload.color} fillOpacity={0.72}
      stroke={payload.color} strokeWidth={1.5} />
  );
}

// Custom tooltip for ScatterChart
function ScatterTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  if (!d) return null;
  return (
    <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 8, padding: "8px 12px", fontSize: 11, lineHeight: 1.7, boxShadow: "0 2px 8px rgba(0,0,0,0.12)" }}>
      <strong style={{ fontSize: 12 }}>ZIP {d.zip} — {d.name}</strong><br />
      Poverty: <strong>{d.y}%</strong><br />
      Coverage: <strong>{d.x} pantries / 10k</strong><br />
      Food insecure: <strong>{d.size.toLocaleString()}</strong><br />
      Need score: <strong style={{ color: d.color }}>{d.needScore}</strong>
    </div>
  );
}

// ── TAB 1: Overview ───────────────────────────────────────────────────────────

function OverviewTab({ filters, govData }) {
  const bKey     = BOROUGH_KEY_MAP[filters.borough];
  const bStats   = bKey ? govData?.boroughStats?.[bKey] : null;
  const bLabel   = filters.borough !== "all" ? BOROUGH_DISPLAY[filters.borough] : null;

  const totalVal     = bStats ? bStats.total.toLocaleString() : "1,976";
  const publishedVal = bStats ? bStats.published.toLocaleString() : "1,343";
  const unavailPct   = bStats ? Math.round(bStats.unavailable / bStats.total * 100) : 32;
  const unavailVal   = bStats ? `${bStats.unavailable} (${unavailPct}%)` : "633 (32%)";

  return (
    <div>
      {/* 3 stat cards — borough-aware when filter active */}
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <StatCard value={totalVal}     label={bLabel ? `food resources in ${bLabel}` : "food resources in NYC"} />
        <StatCard value={publishedVal} label="currently published"   valueColor="#166534" bg="#F0FDF4" border="#BBF7D0" />
        <StatCard value={unavailVal}   label="currently unavailable" valueColor="#991B1B" bg="#FEF2F2" border="#FECACA" />
      </div>

      {/* Avg rating card */}
      <div style={{ background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 12, padding: "14px 16px", marginBottom: 12 }}>
        <div style={{ fontSize: 30, fontWeight: 800, color: "#D97706", lineHeight: 1 }}>
          2.29 <span style={{ fontSize: 16, fontWeight: 500, color: "#92400E" }}>/ 5.0</span>
        </div>
        <div style={{ fontSize: 12, color: "#6B7280", marginTop: 4 }}>
          City-wide average rating across 1,097 rated resources
        </div>
        <div style={{ fontSize: 11, color: "#92400E", marginTop: 6, fontWeight: 600 }}>
          Only 77 resources (7%) are rated above 3.0
        </div>
      </div>

      {/* Action priority matrix — ScatterChart */}
      <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 12, padding: "14px 16px", marginBottom: 12 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#111827", marginBottom: 2 }}>
          Action priority matrix
        </div>
        <div style={{ fontSize: 11, color: "#6B7280", marginBottom: 10 }}>
          ZIP codes plotted by need vs current coverage — hover for details
        </div>
        <ResponsiveContainer width="100%" height={250}>
          <ScatterChart margin={{ top: 10, right: 16, bottom: 28, left: 4 }}>
            {/* Quadrant background fills */}
            <ReferenceArea x1={0} x2={1.5} y1={20} y2={40} fill="#FEE2E2" fillOpacity={0.45}
              label={{ value: "CRITICAL", position: "insideTopLeft", style: { fill: "#DC2626", fontSize: 9, fontWeight: 700 } }} />
            <ReferenceArea x1={1.5} x2={3} y1={20} y2={40} fill="#FEF3C7" fillOpacity={0.4}
              label={{ value: "Monitored", position: "insideTopRight", style: { fill: "#92400E", fontSize: 9, fontWeight: 600 } }} />
            <ReferenceArea x1={0} x2={1.5} y1={0} y2={20} fill="#F3F4F6" fillOpacity={0.5}
              label={{ value: "Gap zone", position: "insideBottomLeft", style: { fill: "#6B7280", fontSize: 9, fontWeight: 600 } }} />
            <ReferenceArea x1={1.5} x2={3} y1={0} y2={20} fill="#F0FDF4" fillOpacity={0.5}
              label={{ value: "Served", position: "insideBottomRight", style: { fill: "#166534", fontSize: 9, fontWeight: 600 } }} />

            <XAxis
              type="number" dataKey="x" name="Pantries / 10k" domain={[0, 3]}
              tick={{ fontSize: 9, fill: "#9CA3AF" }} axisLine={false} tickLine={false}
              label={{ value: "Pantries per 10k residents", position: "insideBottom", offset: -14, style: { fontSize: 9, fill: "#9CA3AF" } }}
            />
            <YAxis
              type="number" dataKey="y" name="Poverty %" domain={[0, 40]}
              tick={{ fontSize: 9, fill: "#9CA3AF" }} axisLine={false} tickLine={false}
              label={{ value: "Poverty %", angle: -90, position: "insideLeft", style: { fontSize: 9, fill: "#9CA3AF" } }}
            />
            <ZAxis type="number" dataKey="size" range={[60, 360]} />
            <Tooltip content={<ScatterTooltip />} cursor={{ strokeDasharray: "3 3" }} />
            <Scatter data={SCATTER_POINTS} shape={<ScatterDot />} />
          </ScatterChart>
        </ResponsiveContainer>
        <div style={{ fontSize: 10, color: "#9CA3AF", textAlign: "center", marginTop: 2 }}>
          Dot size = food-insecure population · Red = critical (≥70), orange = high, yellow = moderate
        </div>
      </div>

      {/* Export buttons */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <button
          onClick={() => window.print()}
          style={{ padding: "9px 0", background: "#2D6A4F", color: "#fff", fontSize: 12, fontWeight: 600, borderRadius: 10, border: "none", cursor: "pointer" }}
        >
          Print / Save as PDF
        </button>
        <button
          onClick={() => downloadCSV(govData)}
          style={{ padding: "9px 0", background: "#fff", color: "#374151", fontSize: 12, fontWeight: 600, borderRadius: 10, border: "1px solid #D1D5DB", cursor: "pointer" }}
        >
          Download CSV
        </button>
      </div>
    </div>
  );
}

// ── TAB 2: Underserved Areas ──────────────────────────────────────────────────

function UnderservedTab({ filters, flyTo, govData }) {
  const [selectedZip, setSelectedZip] = useState(null);

  const filteredZips = (govData?.underservedZips ?? [])
    .filter((z) => {
      // Borough filter — all underserved ZIPs are Manhattan; other boroughs show empty state
      if (filters.borough !== "all") {
        const expectedBorough = BOROUGH_DISPLAY[filters.borough] ?? "";
        if ((z.borough ?? "Manhattan") !== expectedBorough) return false;
      }
      if (filters.poverty === "high"   && z.poverty <  30) return false;
      if (filters.poverty === "medium" && (z.poverty < 15 || z.poverty >= 30)) return false;
      if (filters.poverty === "low"    && z.poverty >= 15) return false;
      return true;
    })
    .sort((a, b) => b.needScore - a.needScore);

  function handleCardClick(z) {
    setSelectedZip(z.zip === selectedZip ? null : z.zip);
    flyTo(z.lat, z.lng, 14);
  }

  return (
    <div>
      {/* Summary strip */}
      <div style={{ background: "#F0FDF4", borderLeft: "3px solid #2D6A4F", borderRadius: "0 8px 8px 0", padding: "9px 12px", marginBottom: 14, fontSize: 12, color: "#166534", lineHeight: 1.5 }}>
      32 ZIP codes across all 5 boroughs are critically underserved.
      </div>

      {/* ZIP cards */}
      {filteredZips.length === 0 ? (
        <div style={{ fontSize: 13, color: "#6B7280", textAlign: "center", padding: "28px 0", background: "#F9FAFB", borderRadius: 12, border: "1px solid #E5E7EB" }}>
          No underserved areas found for this filter.
          {filters.borough !== "all" && (
            <div style={{ fontSize: 11, marginTop: 6, color: "#9CA3AF" }}>
              All 5 underserved ZIP codes are in Manhattan.
            </div>
          )}
        </div>
      ) : (
        filteredZips.map((z) => {
          const badge = needBadge(z.needScore);
          const borderColor = z.needScore >= 70 ? "#EF4444" : "#F59E0B";
          const isSelected = selectedZip === z.zip;
          return (
            <div
              key={z.zip}
              onClick={() => handleCardClick(z)}
              style={{
                background: isSelected ? "#FAFAF9" : "#fff",
                border: `1px solid ${isSelected ? borderColor : "#E5E7EB"}`,
                borderLeft: `4px solid ${borderColor}`,
                borderRadius: 12,
                padding: "14px 16px",
                marginBottom: 10,
                cursor: "pointer",
                boxShadow: isSelected ? `0 2px 8px ${borderColor}28` : "0 1px 3px rgba(0,0,0,0.05)",
                transition: "box-shadow 0.15s, border-color 0.15s",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>{z.neighborhood}</div>
                  <div style={{ fontSize: 11, color: "#6B7280", marginTop: 2 }}>ZIP {z.zip}</div>
                </div>
                <span style={{ background: badge.bg, color: badge.text, border: `1px solid ${badge.border}`, borderRadius: 6, padding: "2px 8px", fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                  Need: {z.needScore}
                </span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 12px", fontSize: 11, color: "#6B7280" }}>
                <span>Poverty: <strong style={{ color: povertyColor(z.poverty) }}>{z.poverty.toFixed(1)}%</strong></span>
                <span>Food insecure: <strong style={{ color: "#374151" }}>{z.foodInsecurity.toLocaleString()}</strong></span>
                <span>Pantries: <strong style={{ color: "#374151" }}>{z.pantryCount}</strong></span>
                <span>SNAP / pantry: <strong style={{ color: "#374151" }}>{z.snapPerPantry.toLocaleString()}</strong></span>
              </div>
            </div>
          );
        })
      )}

      {/* Insight callout */}
      <div style={{ padding: "10px 12px", background: "#F0FDF4", borderLeft: "3px solid #2D6A4F", borderRadius: "0 8px 8px 0", fontSize: 12, color: "#166534", lineHeight: 1.5, marginBottom: 18 }}>
        ZIP 10030 (Central Harlem North) has the highest need score (74.3) with 3,736 SNAP recipients per pantry — the most critically underserved area in Manhattan.
      </div>

      {/* Zero-pantry ZIPs */}
      <div style={{ fontSize: 12, fontWeight: 700, color: "#111827", marginBottom: 10 }}>
        ZIP codes with zero food resources
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {(govData?.zeroPantryZips ?? []).map((z) => (
          <div
            key={z.zip}
            onClick={() => flyTo(z.lat, z.lng, 14)}
            style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 12, padding: "12px 14px", cursor: "pointer" }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#991B1B" }}>ZIP {z.zip}</div>
              <span style={{ fontSize: 9, fontWeight: 700, background: "#FEE2E2", color: "#991B1B", border: "1px solid #FECACA", borderRadius: 4, padding: "1px 5px" }}>No coverage</span>
            </div>
            <div style={{ fontSize: 11, color: "#991B1B", fontWeight: 500, marginBottom: 5 }}>{z.neighborhood}</div>
            <div style={{ fontSize: 10, color: "#6B7280", lineHeight: 1.7 }}>
              Pop: {z.population.toLocaleString()}<br />
              Poverty: {z.poverty.toFixed(1)}%<br />
              Food insecure: ~{z.foodInsecurity.toLocaleString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── TAB 3: Access Barriers ────────────────────────────────────────────────────

function AccessBarriersTab({ govData }) {
  const { barriers, totalPublished } = govData?.accessBarriers ?? { barriers: [], totalPublished: 0 };
  const rel = govData?.reliability ?? { unavailableInUnderservedZips: 0, publishedInUnderservedZips: 0, pctOfflineInUnderserved: 0 };
  const available = rel.publishedInUnderservedZips;
  const unavailable = rel.unavailableInUnderservedZips;
  const total = available + unavailable;
  const availPct = Math.round((available / total) * 100);

  return (
    <div>
      {/* Reliability crisis card */}
      <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderLeft: "4px solid #EF4444", borderRadius: "0 12px 12px 0", padding: "14px 16px", marginBottom: 14 }}>
        <div style={{ fontSize: 44, fontWeight: 800, color: "#DC2626", lineHeight: 1, marginBottom: 4 }}>42%</div>
        <div style={{ fontSize: 12, color: "#991B1B", fontWeight: 600, marginBottom: 10 }}>
          of resources in underserved ZIP codes are UNAVAILABLE
        </div>
        {/* Stacked bar */}
        <div style={{ display: "flex", height: 16, borderRadius: 4, overflow: "hidden", marginBottom: 7 }}>
          <div style={{ width: `${availPct}%`, background: "#2D6A4F" }} />
          <div style={{ width: `${100 - availPct}%`, background: "#DC2626" }} />
        </div>
        <div style={{ display: "flex", gap: 14, fontSize: 10 }}>
          <span style={{ display: "flex", alignItems: "center", gap: 4, color: "#166534" }}>
            <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: 1, background: "#2D6A4F" }} />
            {available} published ({availPct}%)
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 4, color: "#991B1B" }}>
            <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: 1, background: "#DC2626" }} />
            {unavailable} unavailable ({100 - availPct}%)
          </span>
        </div>
        <div style={{ fontSize: 11, color: "#991B1B", marginTop: 9, lineHeight: 1.5 }}>
          This exceeds the city-wide offline rate of {govData?.systemStats?.unavailableRate ?? 32}% — high-need areas face disproportionately unreliable service.
        </div>
      </div>

      {/* Access barriers chart */}
      <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 12, padding: "14px 16px", marginBottom: 14 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#111827", marginBottom: 3 }}>Requirements that limit access</div>
        <div style={{ fontSize: 11, color: "#6B7280", marginBottom: 12 }}>{totalPublished.toLocaleString()} published resources total</div>
        <ResponsiveContainer width="100%" height={230}>
          <BarChart data={barriers} layout="vertical" margin={{ left: 0, right: 38, top: 0, bottom: 0 }}>
            <XAxis type="number" tick={{ fontSize: 9, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
            <YAxis type="category" dataKey="tag" tick={{ fontSize: 10, fill: "#374151" }} width={168} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid #E5E7EB" }}
              formatter={(val, _n, p) => [`${val} resources (${p.payload.pct}%)`, ""]}
            />
            <Bar dataKey="count" radius={[0, 5, 5, 0]} barSize={15}>
              {barriers.map((b, i) => (
                <Cell
                  key={i}
                  fill={
                    b.tag === "Fresh produce available" ? "#2D6A4F"
                    : b.restrictive ? "#EF4444"
                    : "#F59E0B"
                  }
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Policy insight */}
      <div style={{ padding: "10px 12px", background: "#FEF2F2", borderLeft: "3px solid #EF4444", borderRadius: "0 8px 8px 0", fontSize: 12, color: "#991B1B", lineHeight: 1.5, marginBottom: 14 }}>
        31% of published resources require ID — a significant barrier for undocumented residents, who represent a substantial portion of food-insecure populations in Manhattan.
      </div>

      {/* ID barriers by neighborhood */}
      <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 12, padding: "14px 16px", marginBottom: 14 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#111827", marginBottom: 3 }}>
          Where ID barriers are most concentrated
        </div>
        <div style={{ fontSize: 11, color: "#6B7280", marginBottom: 12 }}>
          % of resources requiring ID, by neighborhood
        </div>
        {ID_BARRIERS_BY_NBHD.map((n) => (
          <div key={n.name} style={{ marginBottom: 11 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5, fontSize: 11 }}>
              <span style={{ color: "#374151" }}>{n.name}</span>
              <span style={{ fontWeight: 700, color: "#DC2626" }}>{n.pct}%</span>
            </div>
            <div style={{ height: 8, borderRadius: 4, background: "#F3F4F6", overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${n.pct}%`, background: "#EF4444", borderRadius: 4 }} />
            </div>
          </div>
        ))}
      </div>

      {/* Compounding barrier callout */}
      <div style={{ padding: "10px 12px", background: "#FEF2F2", borderLeft: "3px solid #EF4444", borderRadius: "0 8px 8px 0", fontSize: 12, color: "#991B1B", lineHeight: 1.5 }}>
        The highest-need neighborhoods also have the highest concentration of ID requirements — creating a compounding barrier for the most vulnerable residents.
      </div>
    </div>
  );
}

// ── TAB 4: Resource Gaps ──────────────────────────────────────────────────────

function ResourceGapsTab({ govData }) {
  const f = govData?.communityFridges ?? { total: 0, inUnderservedZips: 0, pctMisaligned: 0, topZips: [] };

  return (
    <div>
      {/* Fridge misalignment numbers */}
      <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 12, padding: "16px", marginBottom: 12 }}>
        <div style={{ display: "flex", gap: 0, marginBottom: 14 }}>
          <div style={{ flex: 1, paddingRight: 20, borderRight: "1px solid #E5E7EB" }}>
            <div style={{ fontSize: 40, fontWeight: 800, color: "#111827", lineHeight: 1 }}>{f.total}</div>
            <div style={{ fontSize: 11, color: "#6B7280", marginTop: 4 }}>Total community fridges in NYC</div>
          </div>
          <div style={{ flex: 1, paddingLeft: 20 }}>
            <div style={{ fontSize: 40, fontWeight: 800, color: "#DC2626", lineHeight: 1 }}>
              {f.inUnderservedZips}{" "}
              <span style={{ fontSize: 15, fontWeight: 600 }}>(14.6%)</span>
            </div>
            <div style={{ fontSize: 11, color: "#6B7280", marginTop: 4 }}>In underserved ZIP codes</div>
          </div>
        </div>
        <div style={{ fontSize: 12, color: "#374151", lineHeight: 1.6 }}>
          <strong>{f.pctMisaligned}%</strong> of community fridges are NOT in the highest-need ZIP codes. Redirecting placement to 10029, 10030, and 10039 could significantly improve access.
        </div>
      </div>

      {/* Where fridges are vs where they should be */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
        {/* Left: current clusters */}
        <div style={{ background: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: 12, padding: "12px 14px" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#374151", marginBottom: 4 }}>
            Current fridge clusters
          </div>
          <div style={{ fontSize: 10, color: "#9CA3AF", marginBottom: 10 }}>not underserved</div>
          {[
            { area: "Bushwick, Brooklyn",       zips: "11221, 11206", count: 6 },
            { area: "Carroll Gardens, Brooklyn", zips: "11231",        count: 3 },
            { area: "Crown Heights, Brooklyn",   zips: "11216",        count: 3 },
            { area: "Mott Haven, Bronx",         zips: "10454",        count: 2 },
          ].map((c) => (
            <div key={c.zips} style={{ marginBottom: 9, fontSize: 11, color: "#6B7280" }}>
              <div style={{ fontWeight: 600, color: "#374151" }}>{c.area}</div>
              <div>ZIPs {c.zips} — <strong>{c.count} fridges</strong></div>
            </div>
          ))}
        </div>

        {/* Right: recommended zones */}
        <div style={{ background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 12, padding: "12px 14px" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#166534", marginBottom: 4 }}>
            Recommended zones
          </div>
          <div style={{ fontSize: 10, color: "#4ADE80", marginBottom: 10 }}>underserved · 0 fridges</div>
          {[
            { area: "Central Harlem N", zip: "10030", needScore: 74.3 },
            { area: "East Harlem",      zip: "10029", needScore: 73.1 },
            { area: "Washington Hts",   zip: "10039", needScore: 66.8 },
          ].map((r) => (
            <div key={r.zip} style={{ marginBottom: 9, fontSize: 11, color: "#166534" }}>
              <div style={{ fontWeight: 600 }}>{r.area} ({r.zip})</div>
              <div>Need: <strong>{r.needScore}</strong> · 0 fridges</div>
            </div>
          ))}
        </div>
      </div>

      {/* Key callout */}
      <div style={{ padding: "10px 12px", background: "#FEF2F2", borderLeft: "3px solid #EF4444", borderRadius: "0 8px 8px 0", fontSize: 12, color: "#991B1B", lineHeight: 1.5, marginBottom: 12 }}>
        85% of community fridges are located outside the highest-need ZIP codes.
      </div>

      {/* Methodology */}
      <div style={{ background: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: 10, padding: "12px 14px" }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: "#6B7280", marginBottom: 4 }}>How this data was computed</div>
        <div style={{ fontSize: 11, color: "#9CA3AF", lineHeight: 1.7 }}>
          Need score = composite of poverty rate, SNAP recipients per pantry, and food insecurity estimates. Underserved flag = is_underserved field from ACS 2024 demographic dataset (169 NYC ZIP codes), cross-referenced with 1,976 LemonTree resources. Zero-pantry ZIPs identified by joining demographics dataset ZIP codes with resource ZIP codes.
        </div>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function GovernmentPanel({ govData = defaultGovData, dataSource = "static" }) {
  const [activeTab, setActiveTab] = useState("overview");
  const [filters, setFilters] = useState({ borough: "all", poverty: "all", status: "all" });

  const flyTo = (lat, lng, zoom = 14) => {
    window.dispatchEvent(new CustomEvent("gov:flyto", { detail: { lat, lng, zoom } }));
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    window.dispatchEvent(new CustomEvent("gov:tabchange", { detail: { tab } }));
  };

  const activeFilterCount = Object.values(filters).filter((v) => v !== "all").length;

  // Count underserved ZIPs that match current filters (used in filter bar)
  const filteredZipCount = govData.underservedZips.filter((z) => {
    if (filters.borough !== "all") {
      const expectedBorough = BOROUGH_DISPLAY[filters.borough] ?? "";
      if ((z.borough ?? "Manhattan") !== expectedBorough) return false;
    }
    if (filters.poverty === "high"   && z.poverty <  30) return false;
    if (filters.poverty === "medium" && (z.poverty < 15 || z.poverty >= 30)) return false;
    if (filters.poverty === "low"    && z.poverty >= 15) return false;
    return true;
  }).length;

  const FILTER_DEFS = [
    {
      key: "borough", options: [
        ["all", "All boroughs"], ["manhattan", "Manhattan"], ["brooklyn", "Brooklyn"],
        ["queens", "Queens"], ["bronx", "Bronx"], ["staten_island", "Staten Island"],
      ],
    },
    {
      key: "poverty", options: [
        ["all", "All poverty levels"], ["high", "High (>30%)"],
        ["medium", "Medium (15–30%)"], ["low", "Low (<15%)"],
      ],
    },
    {
      key: "status", options: [
        ["all", "All status"], ["published", "Published only"], ["unavailable", "Unavailable only"],
      ],
    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", fontFamily: "'DM Sans', system-ui, sans-serif", overflow: "hidden" }}>

      {/* ── Always-visible header ── */}
      <div style={{ padding: "12px 18px 10px", borderBottom: "1px solid #E5E7EB", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
          <h3 style={{ fontSize: 15, fontWeight: 800, color: "#111827", margin: 0 }}>
            Coverage gap analysis
            {dataSource === "supabase" && (
              <span style={{ marginLeft: 8, fontSize: 10, fontWeight: 600, color: "#166534", background: "#DCFCE7", padding: "2px 6px", borderRadius: 6 }}>
                ● Live data
              </span>
            )}
          </h3>
          <div style={{ fontSize: 11, whiteSpace: "nowrap" }}>
            <span style={{ color: "#6B7280" }}>{govData.systemStats?.totalResources?.toLocaleString() ?? "1,976"} total</span>
            <span style={{ margin: "0 4px", color: "#D1D5DB" }}>·</span>
            <span style={{ color: "#166534" }}>{(govData.systemStats?.publishedResources ?? 1343).toLocaleString()} live</span>
            <span style={{ margin: "0 4px", color: "#D1D5DB" }}>·</span>
            <span style={{ color: "#DC2626", fontWeight: 700 }}>{(govData.systemStats?.unavailableResources ?? 633).toLocaleString()} offline ({govData.systemStats?.unavailableRate ?? 32}%) ⚠</span>
          </div>
        </div>
        <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 2 }}>
          NYC food resource network · ACS 2024
        </div>
      </div>

      {/* ── Filter bar ── */}
      <div style={{ padding: "8px 18px", background: "#F9FAFB", borderBottom: "1px solid #E5E7EB", flexShrink: 0, display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
        {FILTER_DEFS.map(({ key, options }) => (
          <select
            key={key}
            value={filters[key]}
            onChange={(e) => setFilters((f) => ({ ...f, [key]: e.target.value }))}
            style={{
              fontSize: 11,
              color: "#374151",
              background: "#fff",
              border: `1px solid ${filters[key] !== "all" ? "#2D6A4F" : "#D1D5DB"}`,
              borderRadius: 7,
              padding: "4px 8px",
              cursor: "pointer",
              outline: "none",
              fontWeight: filters[key] !== "all" ? 600 : 400,
            }}
          >
            {options.map(([val, txt]) => <option key={val} value={val}>{txt}</option>)}
          </select>
        ))}
        {activeFilterCount > 0 && (
          <button
            onClick={() => setFilters({ borough: "all", poverty: "all", status: "all" })}
            style={{ fontSize: 11, color: "#DC2626", background: "none", border: "none", cursor: "pointer", padding: "4px 0", fontWeight: 600 }}
          >
            Clear ({activeFilterCount})
          </button>
        )}
        {activeFilterCount > 0 && (
          <span style={{ fontSize: 11, color: "#6B7280", marginLeft: 2 }}>
            {filteredZipCount} of {govData.underservedZips.length} ZIPs
          </span>
        )}
      </div>

      {/* ── Tab bar ── */}
      <div style={{ padding: "8px 18px 0", borderBottom: "1px solid #E5E7EB", flexShrink: 0, display: "flex", gap: 3 }}>
        {TABS.map((t) => {
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => handleTabChange(t.id)}
              style={{
                padding: "7px 11px",
                fontSize: 11,
                fontWeight: 600,
                borderRadius: "8px 8px 0 0",
                border: `1px solid ${isActive ? "#2D6A4F" : "#E5E7EB"}`,
                borderBottom: isActive ? "1px solid #fff" : "1px solid #E5E7EB",
                background: isActive ? "#2D6A4F" : "#fff",
                color: isActive ? "#fff" : "#6B7280",
                cursor: "pointer",
                marginBottom: isActive ? -1 : 0,
                whiteSpace: "nowrap",
                transition: "background 0.15s, color 0.15s",
              }}
            >
              {t.emoji} {t.label}
            </button>
          );
        })}
      </div>

      {/* ── Tab content (independently scrollable) ── */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 18px 8px" }}>
        {activeTab === "overview"    && <OverviewTab filters={filters} govData={govData} />}
        {activeTab === "underserved" && <UnderservedTab filters={filters} flyTo={flyTo} govData={govData} />}
        {activeTab === "barriers"    && <AccessBarriersTab govData={govData} />}
        {activeTab === "gaps"        && <ResourceGapsTab govData={govData} />}
        {activeTab === "alice" && <ALICETab flyTo={flyTo} />}
        <div style={{ height: 12 }} />
        <Footer />
      </div>
    </div>
  );
}
