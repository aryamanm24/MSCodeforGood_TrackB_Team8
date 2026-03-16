"use client";

import { useState, useRef } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  ScatterChart, Scatter, ZAxis, ReferenceArea, ReferenceLine,
} from "recharts";
import { govData as defaultGovData } from "@/lib/mockData";
import Footer from "./Footer";
import ALICETab from "./ALICETab";

// ── Constants ─────────────────────────────────────────────────────────────────

const TABS = [
  { id: "overview",    label: "Overview" },
  { id: "underserved", label: "Underserved Areas" },
  { id: "barriers",   label: "Access Barriers" },
  { id: "gaps",       label: "Resource Gaps" },
  { id: "alice",      label: "True Demand" },
  { id: "transit",    label: "Transit Access" },
  { id: "reliability", label: "Reliability" },
  { id: "vulnerable", label: "Vulnerable Pop." },
];

const TAB_ICONS = {
  overview: (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 15, height: 15, marginRight: 5, flexShrink: 0 }}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
    </svg>
  ),
  underserved: (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 15, height: 15, marginRight: 5, flexShrink: 0 }}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
    </svg>
  ),
  barriers: (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 15, height: 15, marginRight: 5, flexShrink: 0 }}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0-10.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.75c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.75h-.152c-3.196 0-6.1-1.25-8.25-3.286Zm0 13.036h.008v.008H12v-.008Z" />
    </svg>
  ),
  gaps: (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 15, height: 15, marginRight: 5, flexShrink: 0 }}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m21 7.5-9-5.25L3 7.5m18 0-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
    </svg>
  ),
  alice: (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 15, height: 15, marginRight: 5, flexShrink: 0 }}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
    </svg>
  ),
  transit: (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 15, height: 15, marginRight: 5, flexShrink: 0 }}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
    </svg>
  ),
  reliability: (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 15, height: 15, marginRight: 5, flexShrink: 0 }}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  ),
  vulnerable: (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 15, height: 15, marginRight: 5, flexShrink: 0 }}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
    </svg>
  ),
};

// Borough color palette for dynamic visualizations
const BOROUGH_COLOR = {
  Manhattan:     "#EF4444",
  Brooklyn:      "#3B82F6",
  Queens:        "#10B981",
  Bronx:         "#F59E0B",
  "Staten Island": "#8B5CF6",
  Unknown:       "#9CA3AF",
};

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


// ── Shared sub-components ─────────────────────────────────────────────────────

function StatCard({ value, label, valueColor = "#111827", bg = "#F9FAFB", border = "#E5E7EB" }) {
  return (
    <div style={{ flex: 1, background: bg, border: `1px solid ${border}`, borderRadius: 12, padding: "12px 14px" }}>
      <div style={{ fontSize: 21, fontWeight: 800, color: valueColor, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 11, color: "#6B7280", marginTop: 4 }}>{label}</div>
    </div>
  );
}

// Coverage gap bubble chart dot
// isUnderserved=true  → full opacity, borough color, dashed if no fresh produce
// isUnderserved=false → light fill (context dot), shown when borough view uses all ZIPs
function CoverageBubbleDot({ cx, cy, payload }) {
  if (cx == null || cy == null) return null;
  const households = payload.aliceHouseholds || 0;
  const isUnderserved = payload.isUnderserved !== false; // default true for backwards compat
  const r = isUnderserved
    ? Math.max(Math.sqrt(households / 160), 4)
    : Math.max(Math.sqrt(households / 220), 3);
  const color = BOROUGH_COLOR[payload.borough] ?? "#9CA3AF";
  const noFreshProduce = (payload.freshProduceCount ?? 0) === 0;

  if (!isUnderserved) {
    // Context dot — muted, no ring, just a soft circle
  return (
      <g>
        <circle cx={cx} cy={cy} r={r} fill={color} fillOpacity={0.22} stroke={color} strokeWidth={1} strokeOpacity={0.35} />
      </g>
    );
  }

  return (
    <g>
      {/* Outer glow ring for high-ALICE ZIPs */}
      {payload.alicePct > 65 && (
        <circle cx={cx} cy={cy} r={r + 4} fill={color} fillOpacity={0.12} stroke="none" />
      )}
      <circle
        cx={cx} cy={cy} r={r}
        fill={color}
        fillOpacity={noFreshProduce ? 0.55 : 0.78}
        stroke={noFreshProduce ? "#DC2626" : "#fff"}
        strokeWidth={1.5}
        strokeDasharray={noFreshProduce ? "3 2" : "none"}
        strokeOpacity={0.9}
      />
    </g>
  );
}

// Coverage gap bubble chart tooltip
function CoverageBubbleTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  if (!d) return null;
  const noFreshProduce = (d.freshProduceCount ?? 0) === 0;
  const color = BOROUGH_COLOR[d.borough] ?? "#9CA3AF";
  return (
    <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 10, padding: "10px 14px", fontSize: 11, lineHeight: 1.8, boxShadow: "0 4px 16px rgba(0,0,0,0.12)", maxWidth: 220 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
        <span style={{ width: 8, height: 8, borderRadius: "50%", background: color, display: "inline-block", flexShrink: 0 }} />
        <strong style={{ fontSize: 12, color: "#111827" }}>ZIP {d.zip}</strong>
        <span style={{ color: "#6B7280", fontSize: 11 }}>· {d.neighborhood}</span>
      </div>
      <div style={{ color: "#6B7280", fontSize: 10, marginBottom: 6 }}>{d.borough}</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2px 12px", fontSize: 11 }}>
        <span style={{ color: "#6B7280" }}>ALICE</span>
        <strong style={{ color: "#DC2626" }}>{d.alicePct != null ? `${d.alicePct.toFixed(1)}%` : "N/A"}</strong>
        <span style={{ color: "#6B7280" }}>Pantries/10k</span>
        <strong style={{ color: "#374151" }}>{d.pantresPer10k?.toFixed(2) ?? 0}</strong>
        <span style={{ color: "#6B7280" }}>ALICE HH</span>
        <strong style={{ color: "#374151" }}>{(d.aliceHouseholds || 0).toLocaleString()}</strong>
        <span style={{ color: "#6B7280" }}>Need score</span>
        <strong style={{ color: "#374151" }}>{d.needScore ?? "—"}</strong>
      </div>
      {noFreshProduce && (
        <div style={{ marginTop: 6, fontSize: 10, color: "#DC2626", fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" style={{ width: 12, height: 12 }}>
            <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
          </svg>
          No fresh produce available
        </div>
      )}
    </div>
  );
}

// ── TAB 1: Overview ───────────────────────────────────────────────────────────

function OverviewTab({ filters, govData, onExportPDF, exporting }) {
  const bKey       = BOROUGH_KEY_MAP[filters.borough];
  const bStats     = bKey ? govData?.boroughStats?.[bKey] : null;
  const bLabel     = filters.borough !== "all" ? BOROUGH_DISPLAY[filters.borough] : null;
  const sys        = govData?.systemStats ?? {};

  const totalVal     = bStats ? bStats.total.toLocaleString() : (sys.totalResources ?? 0).toLocaleString();
  const publishedVal = bStats ? bStats.published.toLocaleString() : (sys.publishedResources ?? 0).toLocaleString();
  const unavailPct   = bStats
    ? (bStats.total > 0 ? Math.round(bStats.unavailable / bStats.total * 100) : 0)
    : (sys.unavailableRate ?? 0);
  const unavailNum   = bStats ? bStats.unavailable : (sys.unavailableResources ?? 0);
  const unavailVal   = `${unavailNum.toLocaleString()} (${unavailPct}%)`;

  const avgRating  = sys.avgRating ?? 0;
  const totalRated = sys.totalRated ?? 0;

  const boroughKey = filters.borough !== "all" ? (BOROUGH_DISPLAY[filters.borough] ?? null) : null;

  // When a specific borough is selected, pull ALL its ZIPs from zipDemographics so the
  // chart is never empty just because a borough has few spots in the city-wide top-30.
  // Underserved ZIPs (those in govData.underservedZips) are rendered at full opacity;
  // the rest are shown as faint context dots.
  const underservedZipSet = new Set((govData?.underservedZips ?? []).map((z) => z.zip));
  // Neighbourhood lookup (underservedZips has geo names; zipDemographics doesn't)
  const neighborhoodByZip = {};
  (govData?.underservedZips ?? []).forEach((z) => { neighborhoodByZip[z.zip] = z.neighborhood; });

  const usingAllBoroughZips = !!(boroughKey && govData?.zipDemographics?.length > 0);

  const bubbleData = usingAllBoroughZips
    // Borough-specific view: every ZIP in the borough from the full demographics table
    ? (govData.zipDemographics)
        .filter((z) => z.borough === boroughKey && (z.population ?? 0) > 500)
        .map((z) => {
          const aliceHH = Math.round((z.population || 0) * (z.alicePct || 0) / 100);
          return {
            zip: z.zip,
            neighborhood: neighborhoodByZip[z.zip] || `ZIP ${z.zip}`,
            borough: z.borough,
            alicePct: z.alicePct,
            pantresPer10k: z.pantriesPer10k ?? 0,   // note: zipDemographics spells it correctly
            aliceHouseholds: aliceHH,
            freshProduceCount: z.freshProduceCount ?? 0,
            needScore: z.needScore ?? 0,
            isUnderserved: underservedZipSet.has(z.zip),
            x: z.alicePct,
            y: z.pantriesPer10k ?? 0,
            size: aliceHH,
          };
        })
    // City-wide view: top-30 underserved ZIPs only, optionally trimmed by borough
    : (govData?.underservedZips ?? [])
        .filter((z) => z.alicePct != null)
        .filter((z) => !boroughKey || z.borough === boroughKey)
        .map((z) => ({
          ...z,
          isUnderserved: true,
          x: z.alicePct,
          y: z.pantresPer10k ?? 0,
          size: z.aliceHouseholds ?? 0,
        }));

  const underservedCount = bubbleData.filter((d) => d.isUnderserved).length;
  const boroughsInData = [...new Set(bubbleData.map((d) => d.borough))].filter(Boolean);

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
          {avgRating > 0 ? avgRating.toFixed(2) : "—"} <span style={{ fontSize: 16, fontWeight: 500, color: "#92400E" }}>/ 5.0</span>
        </div>
        <div style={{ fontSize: 12, color: "#6B7280", marginTop: 4 }}>
          City-wide average rating across {totalRated.toLocaleString()} rated resources
        </div>
        {avgRating > 0 && (
        <div style={{ fontSize: 11, color: "#92400E", marginTop: 6, fontWeight: 600 }}>
            {unavailPct}% of {bLabel ? `${bLabel} resources` : "all resources"} are currently unavailable — a service reliability concern
        </div>
        )}
      </div>

      {/* Coverage gap bubble chart */}
      <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 12, padding: "16px 16px 12px", marginBottom: 12 }}>
        {/* Chart header row */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 10 }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#111827" }}>
              Coverage Gap Bubble Chart
              {boroughKey && (
                <span style={{ marginLeft: 6, fontSize: 10, fontWeight: 600, color: "#2D6A4F", background: "#DCFCE7", padding: "1px 6px", borderRadius: 5 }}>
                  {boroughKey}
                </span>
              )}
        </div>
            <div style={{ fontSize: 10, color: "#6B7280", marginTop: 2 }}>
              {usingAllBoroughZips
                ? `All ${bubbleData.length} ZIPs in ${boroughKey} · ${underservedCount} underserved highlighted · size ∝ ALICE households`
                : `Top ${bubbleData.length} underserved ZIPs city-wide · size ∝ ALICE households · dashed = no fresh produce`}
        </div>
          </div>
          {/* Borough legend pill — only shown in city-wide (multi-borough) mode */}
          {!usingAllBoroughZips && boroughsInData.length > 0 && (
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "flex-end", maxWidth: 180 }}>
              {boroughsInData.map((b) => (
                <span key={b} style={{
                  fontSize: 10, display: "inline-flex", alignItems: "center", gap: 4,
                  background: (BOROUGH_COLOR[b] ?? "#9CA3AF") + "22",
                  color: "#374151", padding: "2px 7px", borderRadius: 999,
                  border: `1px solid ${(BOROUGH_COLOR[b] ?? "#9CA3AF")}55`,
                }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: BOROUGH_COLOR[b] ?? "#9CA3AF", display: "inline-block" }} />
                  {b}
                </span>
              ))}
            </div>
          )}
          {/* Borough view: show underserved vs context legend */}
          {usingAllBoroughZips && (
            <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-end" }}>
              <span style={{ fontSize: 9, display: "flex", alignItems: "center", gap: 4, color: "#374151" }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: BOROUGH_COLOR[boroughKey] ?? "#9CA3AF", display: "inline-block" }} />
                Underserved ZIP
              </span>
              <span style={{ fontSize: 9, display: "flex", alignItems: "center", gap: 4, color: "#9CA3AF" }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: BOROUGH_COLOR[boroughKey] ?? "#9CA3AF", opacity: 0.3, display: "inline-block" }} />
                Other ZIPs (context)
              </span>
            </div>
          )}
        </div>

        <ResponsiveContainer width="100%" height={275}>
          <ScatterChart margin={{ top: 8, right: 16, bottom: 30, left: 4 }}>
            {/* Quadrant shading — subtle */}
            <ReferenceArea x1={45} x2={100} y1={0} y2={1.4} fill="#FEE2E2" fillOpacity={0.25} />
            <ReferenceArea x1={0} x2={45} y1={1.4} y2={6} fill="#ECFDF5" fillOpacity={0.3} />
            {/* Quadrant labels as reference lines */}
            <ReferenceLine x={45} stroke="#E5E7EB" strokeDasharray="4 3" strokeWidth={1} />
            <ReferenceLine y={1.4} stroke="#E5E7EB" strokeDasharray="4 3" strokeWidth={1} />
            <XAxis
              type="number" dataKey="x" name="ALICE %" domain={[0, 100]}
              tick={{ fontSize: 9, fill: "#9CA3AF" }} axisLine={false} tickLine={false}
              label={{ value: "ALICE % (below threshold) →", position: "insideBottom", offset: -16, style: { fontSize: 9, fill: "#9CA3AF" } }}
            />
            <YAxis
              type="number" dataKey="y" name="Pantries / 10k" domain={[0, "auto"]}
              tick={{ fontSize: 9, fill: "#9CA3AF" }} axisLine={false} tickLine={false}
              label={{ value: "Pantries / 10k ↑", angle: -90, position: "insideLeft", offset: 12, style: { fontSize: 9, fill: "#9CA3AF" } }}
            />
            <ZAxis type="number" dataKey="size" range={[30, 300]} />
            <Tooltip content={<CoverageBubbleTooltip />} cursor={false} />
            <Scatter data={bubbleData} shape={<CoverageBubbleDot />} />
          </ScatterChart>
        </ResponsiveContainer>

        {bubbleData.length === 0 && (
          <div style={{ textAlign: "center", fontSize: 11, color: "#9CA3AF", padding: "20px 0" }}>
            {boroughKey
              ? `No ZIP codes with ALICE data found in ${boroughKey}.`
              : "ALICE data loading — chart will populate automatically."}
          </div>
        )}

        {/* Quadrant annotations */}
        <div style={{ display: "flex", justifyContent: "space-between", padding: "0 4px", marginTop: 2 }}>
          <span style={{ fontSize: 9, color: "#059669", fontWeight: 600 }}>← LOW NEED / WELL SERVED</span>
          <span style={{ fontSize: 9, color: "#DC2626", fontWeight: 600 }}>HIGH NEED / LOW COVERAGE →</span>
        </div>

        {/* Missing-borough note — only shown in city-wide (unfiltered) mode */}
        {!usingAllBoroughZips && (() => {
          const ALL_BOROUGHS = ["Manhattan", "Brooklyn", "Queens", "Bronx", "Staten Island"];
          const missing = ALL_BOROUGHS.filter((b) => !boroughsInData.includes(b));
          if (missing.length === 0) return null;
          return (
            <div style={{ marginTop: 8, padding: "6px 10px", background: "#F9FAFB", borderRadius: 7, fontSize: 10, color: "#6B7280", display: "flex", alignItems: "flex-start", gap: 6 }}>
              <span style={{ flexShrink: 0, color: "#9CA3AF" }}>ℹ</span>
              <span>
                <strong style={{ color: "#374151" }}>{missing.join(", ")}</strong>
                {missing.length === 1 ? " has" : " have"} no ZIP codes in the city-wide top-30 underserved list — poverty and food-insecurity levels are lower relative to other boroughs.
                {" "}Use the borough filter above to explore {missing.length === 1 ? "its" : "their"} full ZIP-level data.
              </span>
            </div>
          );
        })()}
      </div>

      {/* Export button — PDF only */}
        <button
        onClick={onExportPDF}
        disabled={exporting}
        style={{ width: "100%", padding: "9px 0", background: "#2D6A4F", color: "#fff", fontSize: 12, fontWeight: 600, borderRadius: 10, border: "none", cursor: exporting ? "wait" : "pointer", opacity: exporting ? 0.7 : 1 }}
      >
        {exporting ? "Exporting..." : "Print / Save as PDF"}
        </button>
    </div>
  );
}

// ── TAB 2: Underserved Areas ──────────────────────────────────────────────────

function UnderservedTab({ filters, flyTo, govData }) {
  const [selectedZip, setSelectedZip] = useState(null);

  const filteredZips = (govData?.underservedZips ?? [])
    .filter((z) => {
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
      Top {govData?.underservedZips?.length ?? 0} ZIP codes identified as critically underserved.
      </div>

      {/* ZIP cards */}
      {filteredZips.length === 0 ? (
        <div style={{ fontSize: 13, color: "#6B7280", textAlign: "center", padding: "28px 0", background: "#F9FAFB", borderRadius: 12, border: "1px solid #E5E7EB" }}>
          No underserved areas found for this filter.
          {filters.borough !== "all" && (
            <div style={{ fontSize: 11, marginTop: 6, color: "#9CA3AF" }}>
              {`No underserved ZIP codes found in ${BOROUGH_DISPLAY[filters.borough] ?? filters.borough} with current data.`}
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

      {/* Insight callout — dynamic from top ZIP */}
      {filteredZips.length > 0 && (
      <div style={{ padding: "10px 12px", background: "#F0FDF4", borderLeft: "3px solid #2D6A4F", borderRadius: "0 8px 8px 0", fontSize: 12, color: "#166534", lineHeight: 1.5, marginBottom: 18 }}>
          ZIP {filteredZips[0].zip} ({filteredZips[0].neighborhood}) has the highest need score ({filteredZips[0].needScore}) with {filteredZips[0].snapPerPantry.toLocaleString()} SNAP recipients per pantry.
      </div>
      )}

      {/* Zero-pantry ZIPs — filtered by borough */}
      <div style={{ fontSize: 12, fontWeight: 700, color: "#111827", marginBottom: 10 }}>
        ZIP codes with zero food resources
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {(govData?.zeroPantryZips ?? [])
          .filter((z) => {
            if (filters.borough === "all") return true;
            const expectedBorough = BOROUGH_DISPLAY[filters.borough] ?? "";
            return (z.borough ?? "") === expectedBorough;
          })
          .map((z) => (
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

function AccessBarriersTab({ govData, filters }) {
  const { barriers, totalPublished } = govData?.accessBarriers ?? { barriers: [], totalPublished: 0 };
  const rel = govData?.reliability ?? { unavailableInUnderservedZips: 0, publishedInUnderservedZips: 0, pctOfflineInUnderserved: 0 };
  const available = rel.publishedInUnderservedZips;
  const unavailable = rel.unavailableInUnderservedZips;
  const total = available + unavailable;
  const availPct = total > 0 ? Math.round((available / total) * 100) : 0;
  const unavailPctDynamic = 100 - availPct;

  // ID barrier stat from real access barriers data
  const idBarrier = barriers.find((b) => b.tag?.toLowerCase().includes("id required"));
  const idPct = idBarrier?.pct ?? 0;

  // Language gaps from backend — filtered by borough
  const boroughKey = filters?.borough && filters.borough !== "all" ? (BOROUGH_DISPLAY[filters.borough] ?? null) : null;
  const languageGaps = boroughKey
    ? (govData?.languageGaps ?? []).filter((g) => g.borough === boroughKey)
    : (govData?.languageGaps ?? []);

  // Borough-level language gap summary
  const langByBorough = languageGaps.reduce((acc, g) => {
    if (!acc[g.borough]) acc[g.borough] = { count: 0, maxPct: 0 };
    acc[g.borough].count += 1;
    if (g.pctLimitedEnglish > acc[g.borough].maxPct) acc[g.borough].maxPct = g.pctLimitedEnglish;
    return acc;
  }, {});

  return (
    <div>
      {/* Reliability crisis card */}
      <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderLeft: "4px solid #EF4444", borderRadius: "0 12px 12px 0", padding: "14px 16px", marginBottom: 14 }}>
        <div style={{ fontSize: 44, fontWeight: 800, color: "#DC2626", lineHeight: 1, marginBottom: 4 }}>
          {total > 0 ? `${unavailPctDynamic}%` : "Data unavailable"}
        </div>
        <div style={{ fontSize: 12, color: "#991B1B", fontWeight: 600, marginBottom: 10 }}>
          of resources in underserved ZIP codes are UNAVAILABLE
        </div>
        {/* Stacked bar */}
        <div style={{ display: "flex", height: 16, borderRadius: 4, overflow: "hidden", marginBottom: 7 }}>
          <div style={{ width: `${availPct}%`, background: "#2D6A4F" }} />
          <div style={{ width: `${unavailPctDynamic}%`, background: "#DC2626" }} />
        </div>
        <div style={{ display: "flex", gap: 14, fontSize: 10 }}>
          <span style={{ display: "flex", alignItems: "center", gap: 4, color: "#166534" }}>
            <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: 1, background: "#2D6A4F" }} />
            {available} published ({availPct}%)
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 4, color: "#991B1B" }}>
            <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: 1, background: "#DC2626" }} />
            {unavailable} unavailable ({unavailPctDynamic}%)
          </span>
        </div>
        <div style={{ fontSize: 11, color: "#991B1B", marginTop: 9, lineHeight: 1.5 }}>
          This exceeds the city-wide offline rate of {govData?.systemStats?.unavailableRate ?? 0}% — high-need areas face disproportionately unreliable service.
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

      {/* ID barrier policy insight */}
      {idPct > 0 && (
      <div style={{ padding: "10px 12px", background: "#FEF2F2", borderLeft: "3px solid #EF4444", borderRadius: "0 8px 8px 0", fontSize: 12, color: "#991B1B", lineHeight: 1.5, marginBottom: 14 }}>
          {idPct}% of published resources require ID — a significant barrier for undocumented residents, who represent a substantial portion of food-insecure populations.
      </div>
      )}

      {/* Language access gap section */}
      <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 12, padding: "14px 16px", marginBottom: 14 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#111827", marginBottom: 3 }}>Language access gap</div>
        <div style={{ fontSize: 11, color: "#6B7280", marginBottom: 12 }}>
          ZIP codes where &gt;15% residents have limited English, but zero multilingual resources
        </div>
        {languageGaps.length === 0 ? (
          <div style={{ fontSize: 11, color: "#9CA3AF", textAlign: "center", padding: "16px 0" }}>
            {boroughKey ? `No language gaps detected in ${boroughKey} with current data.` : "No language gaps detected in current data"}
            </div>
        ) : (
          <>
            {/* Borough summary */}
            {Object.entries(langByBorough).length > 0 && (
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
                {Object.entries(langByBorough).map(([b, d]) => (
                  <div key={b} style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8, padding: "6px 10px", fontSize: 11 }}>
                    <div style={{ fontWeight: 700, color: "#991B1B" }}>{b}</div>
                    <div style={{ color: "#6B7280" }}>{d.count} ZIP{d.count !== 1 ? "s" : ""} · up to {d.maxPct.toFixed(1)}% limited English</div>
                  </div>
                ))}
              </div>
            )}
            {/* Top language gap ZIPs */}
            {languageGaps.slice(0, 5).map((g) => (
              <div key={g.zip} style={{ marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, fontSize: 11 }}>
                  <span style={{ color: "#374151", fontWeight: 600 }}>
                    ZIP {g.zip} — {g.neighborhood || g.borough}
                  </span>
                  <span style={{ fontWeight: 700, color: "#DC2626" }}>{g.pctLimitedEnglish.toFixed(1)}% limited English</span>
                </div>
                <div style={{ height: 7, borderRadius: 4, background: "#F3F4F6", overflow: "hidden", marginBottom: 2 }}>
                  <div style={{ height: "100%", width: `${Math.min(g.pctLimitedEnglish, 100)}%`, background: "#EF4444", borderRadius: 4 }} />
                </div>
                <div style={{ fontSize: 10, color: "#9CA3AF" }}>
                  {g.pctForeignBorn.toFixed(1)}% foreign-born · {g.pantryCount} pantry{g.pantryCount !== 1 ? "ies" : ""} · pop {(g.population || 0).toLocaleString()}
            </div>
          </div>
        ))}
            <div style={{ padding: "8px 10px", background: "#FEF2F2", borderLeft: "3px solid #EF4444", borderRadius: "0 6px 6px 0", fontSize: 11, color: "#991B1B", lineHeight: 1.5, marginTop: 4 }}>
              These neighborhoods have significant immigrant populations with no multilingual food resources — a compounding barrier.
            </div>
          </>
        )}
      </div>

      {/* Compounding barrier callout */}
      <div style={{ padding: "10px 12px", background: "#FEF2F2", borderLeft: "3px solid #EF4444", borderRadius: "0 8px 8px 0", fontSize: 12, color: "#991B1B", lineHeight: 1.5 }}>
        The highest-need neighborhoods face multiple compounding barriers: ID requirements, language barriers, and appointment-only access — for the most vulnerable residents.
      </div>
    </div>
  );
}

// ── TAB 4: Resource Gaps ──────────────────────────────────────────────────────

function ResourceGapsTab({ govData, filters }) {
  const f = govData?.communityFridges ?? { total: 0, inUnderservedZips: 0, pctMisaligned: 0, topZips: [] };

  // Top current fridge ZIPs (not underserved) from real data
  const currentClusters = (f.topZips ?? []).filter((z) => !z.underserved).slice(0, 4);
  // Recommended zones — underserved ZIPs that have the highest need scores and few fridges
  const recommendedZones = (govData?.underservedZips ?? [])
    .filter((z) => !f.topZips?.find((t) => t.zip === z.zip && t.count > 1))
    .sort((a, b) => b.needScore - a.needScore)
    .slice(0, 3);

  // Fridge pct in underserved computed dynamically
  const fridgeInUnderservedPct = f.total > 0 ? Math.round((f.inUnderservedZips / f.total) * 100) : 0;

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
              <span style={{ fontSize: 15, fontWeight: 600 }}>({fridgeInUnderservedPct}%)</span>
            </div>
            <div style={{ fontSize: 11, color: "#6B7280", marginTop: 4 }}>In underserved ZIP codes</div>
          </div>
        </div>
        <div style={{ fontSize: 12, color: "#374151", lineHeight: 1.6 }}>
          <strong>{f.pctMisaligned}%</strong> of community fridges are NOT in the highest-need ZIP codes.
          {recommendedZones.length > 0 && (
            <span> Redirecting placement to {recommendedZones.map((z) => z.zip).join(", ")} could significantly improve access.</span>
          )}
        </div>
      </div>

      {/* Where fridges are vs where they should be */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
        {/* Left: current clusters */}
        <div style={{ background: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: 12, padding: "12px 14px" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#374151", marginBottom: 4 }}>
            Current fridge clusters
          </div>
          <div style={{ fontSize: 10, color: "#9CA3AF", marginBottom: 10 }}>not in highest-need ZIPs</div>
          {currentClusters.length > 0 ? currentClusters.map((c) => (
            <div key={c.zip} style={{ marginBottom: 9, fontSize: 11, color: "#6B7280" }}>
              <div style={{ fontWeight: 600, color: "#374151" }}>ZIP {c.zip}</div>
              <div><strong>{c.count} fridges</strong> · not underserved</div>
            </div>
          )) : (
            <div style={{ fontSize: 11, color: "#9CA3AF" }}>Data loading…</div>
          )}
        </div>

        {/* Right: recommended zones */}
        <div style={{ background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 12, padding: "12px 14px" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#166534", marginBottom: 4 }}>
            Recommended zones
          </div>
          <div style={{ fontSize: 10, color: "#4ADE80", marginBottom: 10 }}>highest need · under-resourced</div>
          {recommendedZones.length > 0 ? recommendedZones.map((r) => (
            <div key={r.zip} style={{ marginBottom: 9, fontSize: 11, color: "#166534" }}>
              <div style={{ fontWeight: 600 }}>{r.neighborhood} ({r.zip})</div>
              <div>Need score: <strong>{r.needScore}</strong> · {r.pantryCount} pantry{r.pantryCount !== 1 ? "ies" : ""}</div>
            </div>
          )) : (
            <div style={{ fontSize: 11, color: "#9CA3AF" }}>Data loading…</div>
          )}
        </div>
      </div>

      {/* Key callout */}
      <div style={{ padding: "10px 12px", background: "#FEF2F2", borderLeft: "3px solid #EF4444", borderRadius: "0 8px 8px 0", fontSize: 12, color: "#991B1B", lineHeight: 1.5, marginBottom: 12 }}>
        {f.pctMisaligned > 0 ? `${f.pctMisaligned}%` : "The majority"} of community fridges are located outside the highest-need ZIP codes.
      </div>

      {/* Methodology */}
      <div style={{ background: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: 10, padding: "12px 14px" }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: "#6B7280", marginBottom: 4 }}>How this data was computed</div>
        <div style={{ fontSize: 11, color: "#9CA3AF", lineHeight: 1.7 }}>
          Need score = composite of poverty rate, SNAP recipients per pantry, and food insecurity estimates from ACS 2024.
          Underserved ZIPs cross-referenced with {(govData?.systemStats?.totalResources ?? 0).toLocaleString()} LemonTree resources.
          Zero-pantry ZIPs identified by joining ACS demographics with resource ZIP codes.
        </div>
      </div>
    </div>
  );
}

// ── TAB 6: Transit Access ─────────────────────────────────────────────────────

function TransitAccessTab({ govData, filters }) {
  const boroughKey = filters?.borough && filters.borough !== "all" ? (BOROUGH_DISPLAY[filters.borough] ?? null) : null;
  const transitGaps = boroughKey
    ? (govData?.transitGaps ?? []).filter((g) => g.borough === boroughKey)
    : (govData?.transitGaps ?? []);

  return (
    <div>
      <div style={{ background: "#EFF6FF", border: "1px solid #BFDBFE", borderLeft: "4px solid #3B82F6", borderRadius: "0 12px 12px 0", padding: "14px 16px", marginBottom: 14 }}>
        <div style={{ fontSize: 20, fontWeight: 800, color: "#1D4ED8", lineHeight: 1, marginBottom: 4 }}>
          {transitGaps.length} ZIP codes
        </div>
        <div style={{ fontSize: 12, color: "#1E40AF", fontWeight: 600 }}>
          are transit food deserts — high no-vehicle rate with fewer than 2 walkable resources
        </div>
      </div>

      {transitGaps.length === 0 ? (
        <div style={{ fontSize: 13, color: "#6B7280", textAlign: "center", padding: "28px 0", background: "#F9FAFB", borderRadius: 12, border: "1px solid #E5E7EB" }}>
          No transit gap data available yet
        </div>
      ) : (
        <>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#111827", marginBottom: 8 }}>
            Highest-risk transit deserts
          </div>
          {transitGaps.map((g) => (
            <div key={g.zip} style={{ background: "#fff", border: "1px solid #E5E7EB", borderLeft: "4px solid #3B82F6", borderRadius: "0 12px 12px 0", padding: "12px 14px", marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>{g.neighborhood || "—"}</div>
                  <div style={{ fontSize: 11, color: "#6B7280" }}>ZIP {g.zip} · {g.borough}</div>
                </div>
                <span style={{ background: "#DBEAFE", color: "#1E40AF", borderRadius: 6, padding: "2px 8px", fontSize: 11, fontWeight: 700 }}>
                  {g.noVehicleRate.toFixed(1)}% no vehicle
                    </span>
                  </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "4px 12px", fontSize: 11, color: "#6B7280" }}>
                <span>Walkable resources: <strong style={{ color: "#374151" }}>{g.resourcesWithinHalfMile}</strong></span>
                <span>Nearest: <strong style={{ color: "#374151" }}>{g.nearestResourceMiles > 0 ? `${g.nearestResourceMiles} mi` : "—"}</strong></span>
                <span>Pop: <strong style={{ color: "#374151" }}>{(g.population || 0).toLocaleString()}</strong></span>
              </div>
            </div>
          ))}
          <div style={{ padding: "10px 12px", background: "#EFF6FF", borderLeft: "3px solid #3B82F6", borderRadius: "0 8px 8px 0", fontSize: 12, color: "#1E40AF", lineHeight: 1.5, marginTop: 4 }}>
            Residents without vehicles in these ZIPs must travel over a mile to access food — a critical mobility barrier.
          </div>
        </>
      )}
    </div>
  );
}

// ── TAB 7: Service Reliability ────────────────────────────────────────────────

function ReliabilityTab({ govData, filters }) {
  const boroughKey = filters?.borough && filters.borough !== "all" ? (BOROUGH_DISPLAY[filters.borough] ?? null) : null;
  const reliabilityGaps = boroughKey
    ? (govData?.reliabilityGaps ?? []).filter((g) => g.borough === boroughKey)
    : (govData?.reliabilityGaps ?? []);
  const boroughStats = govData?.boroughReliabilityStats ?? [];

  return (
    <div>
      <div style={{ background: "#FFFBEB", border: "1px solid #FDE68A", borderLeft: "4px solid #D97706", borderRadius: "0 12px 12px 0", padding: "14px 16px", marginBottom: 14 }}>
        <div style={{ fontSize: 20, fontWeight: 800, color: "#92400E", lineHeight: 1, marginBottom: 4 }}>
          {reliabilityGaps.length} high-poverty ZIPs
        </div>
        <div style={{ fontSize: 12, color: "#92400E", fontWeight: 600 }}>
          have frequent service closures — avg &gt;2 skip events per resource
        </div>
      </div>

      {/* Borough reliability summary */}
      {boroughStats.length > 0 && (
        <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 12, padding: "14px 16px", marginBottom: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#111827", marginBottom: 10 }}>Confirmed open rate by borough</div>
          {boroughStats.sort((a, b) => a.avgConfirmedOpenRate - b.avgConfirmedOpenRate).map((b) => (
            <div key={b.borough} style={{ marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, fontSize: 11 }}>
                <span style={{ color: "#374151", fontWeight: 600 }}>{b.borough}</span>
                <span style={{ fontWeight: 700, color: b.avgConfirmedOpenRate < 50 ? "#DC2626" : b.avgConfirmedOpenRate < 70 ? "#D97706" : "#166534" }}>
                  {b.avgConfirmedOpenRate.toFixed(1)}% confirmed open
                    </span>
                  </div>
              <div style={{ height: 7, borderRadius: 4, background: "#F3F4F6", overflow: "hidden" }}>
                <div style={{
                  height: "100%",
                  width: `${Math.min(b.avgConfirmedOpenRate, 100)}%`,
                  background: b.avgConfirmedOpenRate < 50 ? "#EF4444" : b.avgConfirmedOpenRate < 70 ? "#F59E0B" : "#2D6A4F",
                  borderRadius: 4,
                }} />
              </div>
              <div style={{ fontSize: 10, color: "#9CA3AF", marginTop: 2 }}>Avg {b.avgSkipRangeCount.toFixed(1)} skip events</div>
            </div>
          ))}
        </div>
      )}

      {reliabilityGaps.length > 0 && (
        <>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#111827", marginBottom: 8 }}>Most unreliable high-poverty neighborhoods</div>
          {reliabilityGaps.map((g) => (
            <div key={g.zip} style={{ background: "#FFFBEB", border: "1px solid #FDE68A", borderLeft: "4px solid #D97706", borderRadius: "0 12px 12px 0", padding: "12px 14px", marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>{g.neighborhood || "—"}</div>
                  <div style={{ fontSize: 11, color: "#6B7280" }}>ZIP {g.zip} · {g.borough}</div>
                </div>
                <span style={{ background: "#FEF3C7", color: "#92400E", borderRadius: 6, padding: "2px 8px", fontSize: 11, fontWeight: 700 }}>
                  {g.avgSkipRangeCount} avg skips
                    </span>
                  </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 12px", fontSize: 11, color: "#6B7280" }}>
                <span>Open rate: <strong style={{ color: "#374151" }}>{g.confirmedOpenRate.toFixed(1)}%</strong></span>
                <span>Poverty: <strong style={{ color: "#374151" }}>{(g.poverty || 0).toFixed(1)}%</strong></span>
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}

// ── TAB 8: Vulnerable Populations ─────────────────────────────────────────────

function VulnerablePopTab({ govData, filters }) {
  const boroughKey = filters?.borough && filters.borough !== "all" ? (BOROUGH_DISPLAY[filters.borough] ?? null) : null;
  const seniorGaps = boroughKey
    ? (govData?.seniorAccessGaps ?? []).filter((g) => g.borough === boroughKey)
    : (govData?.seniorAccessGaps ?? []);
  const dietaryGaps = boroughKey
    ? (govData?.dietaryGaps ?? []).filter((g) => g.borough === boroughKey)
    : (govData?.dietaryGaps ?? []);

  return (
    <div>
      {/* Senior Access Section */}
      <div style={{ fontSize: 13, fontWeight: 700, color: "#111827", marginBottom: 8 }}>Senior access barriers</div>
      <div style={{ background: "#F5F3FF", border: "1px solid #DDD6FE", borderLeft: "4px solid #7C3AED", borderRadius: "0 12px 12px 0", padding: "12px 14px", marginBottom: 12 }}>
        <div style={{ fontSize: 11, color: "#5B21B6", lineHeight: 1.5 }}>
          ZIP codes where seniors (&gt;15% of population) face appointment-only resources — a significant mobility barrier for elderly residents.
        </div>
      </div>
      {seniorGaps.length === 0 ? (
        <div style={{ fontSize: 11, color: "#9CA3AF", textAlign: "center", padding: "12px 0", marginBottom: 12 }}>No senior access gaps found in current data</div>
      ) : (
        <div style={{ marginBottom: 16 }}>
          {seniorGaps.map((g) => (
            <div key={g.zip} style={{ background: "#fff", border: "1px solid #E5E7EB", borderLeft: "4px solid #7C3AED", borderRadius: "0 12px 12px 0", padding: "12px 14px", marginBottom: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>{g.neighborhood || "—"}</div>
                  <div style={{ fontSize: 11, color: "#6B7280" }}>ZIP {g.zip} · {g.borough}</div>
                </div>
                <span style={{ background: "#EDE9FE", color: "#5B21B6", borderRadius: 6, padding: "2px 8px", fontSize: 11, fontWeight: 700 }}>
                  {g.pctSeniors.toFixed(1)}% seniors
                    </span>
                  </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 12px", fontSize: 11, color: "#6B7280" }}>
                <span>Appt-only share: <strong style={{ color: "#374151" }}>{g.apptOnlyShare.toFixed(1)}%</strong></span>
                <span>Walk-in resources: <strong style={{ color: "#374151" }}>{g.walkInCount}</strong></span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Dietary Access Section */}
      <div style={{ fontSize: 13, fontWeight: 700, color: "#111827", marginBottom: 8 }}>Dietary access gaps (Halal/Kosher)</div>
      <div style={{ background: "#FFF7ED", border: "1px solid #FED7AA", borderLeft: "4px solid #EA580C", borderRadius: "0 12px 12px 0", padding: "12px 14px", marginBottom: 12 }}>
        <div style={{ fontSize: 11, color: "#9A3412", lineHeight: 1.5 }}>
          ZIP codes with food pantries but zero halal or kosher options — a barrier for Muslim and Jewish communities.
        </div>
      </div>
      {dietaryGaps.length === 0 ? (
        <div style={{ fontSize: 11, color: "#9CA3AF", textAlign: "center", padding: "12px 0" }}>No dietary gap data available</div>
      ) : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {dietaryGaps.slice(0, 6).map((g) => (
              <div key={g.zip} style={{ background: "#FFF7ED", border: "1px solid #FED7AA", borderRadius: 10, padding: "10px 12px" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#9A3412" }}>ZIP {g.zip}</div>
                <div style={{ fontSize: 11, color: "#6B7280" }}>{g.neighborhood || g.borough}</div>
                <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 4 }}>
                  {g.pantryCount} pantry{g.pantryCount !== 1 ? "ies" : ""} · 0 halal/kosher
                </div>
              </div>
            ))}
        </div>
          <div style={{ padding: "10px 12px", background: "#FFF7ED", borderLeft: "3px solid #EA580C", borderRadius: "0 8px 8px 0", fontSize: 12, color: "#9A3412", lineHeight: 1.5, marginTop: 10 }}>
            These {dietaryGaps.length} ZIP codes have active food resources but none serving dietary-specific needs — a gap affecting hundreds of thousands of residents.
          </div>
        </>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function GovernmentPanel({ govData = defaultGovData, dataSource = "static" }) {
  const [activeTab, setActiveTab] = useState("overview");
  const [filters, setFilters] = useState({ borough: "all", poverty: "all", status: "all" });
  const [exporting, setExporting] = useState(false);
  const dashboardRef = useRef(null);

  // NOTE: html2canvas has known limitations with Recharts SVG charts —
  // some charts may render as blank or incomplete in the exported PDF.
  // This is a known html2canvas/SVG limitation. The export works best
  // for list-based tabs (Underserved, Transit, Reliability, Vulnerable).
  // For chart-heavy tabs (Overview, ALICE), consider screenshotting manually.
  const handleExportPDF = async () => {
    const element = dashboardRef.current;
    if (!element) return;

    setExporting(true);
    try {
      const canvas = await html2canvas(element, {
        scale: 1.5,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#F8F9FA",
        logging: false,
        windowWidth: element.scrollWidth,
        windowHeight: element.scrollHeight,
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: canvas.width > canvas.height ? "landscape" : "portrait",
        unit: "px",
        format: [canvas.width, canvas.height],
      });

      pdf.addImage(imgData, "PNG", 0, 0, canvas.width, canvas.height);

      const date = new Date().toISOString().split("T")[0];
      const tabName = activeTab ?? "overview";
      pdf.save(`lemontree-${tabName}-${date}.pdf`);
    } catch (err) {
      console.error("PDF export failed:", err);
    } finally {
      setExporting(false);
    }
  };

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
    <div
      ref={dashboardRef}
      id="government-dashboard-content"
      style={{ display: "flex", flexDirection: "column", height: "100%", fontFamily: "'DM Sans', system-ui, sans-serif", overflow: "hidden" }}
    >

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
            <span style={{ color: "#6B7280" }}>{govData.systemStats?.totalResources?.toLocaleString() ?? "—"} total</span>
            <span style={{ margin: "0 4px", color: "#D1D5DB" }}>·</span>
            <span style={{ color: "#166534" }}>{govData.systemStats?.publishedResources?.toLocaleString() ?? "—"} live</span>
            <span style={{ margin: "0 4px", color: "#D1D5DB" }}>·</span>
            <span style={{ color: "#DC2626", fontWeight: 700 }}>{govData.systemStats?.unavailableResources?.toLocaleString() ?? "—"} offline ({govData.systemStats?.unavailableRate ?? "—"}%) ⚠</span>
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
      <style>{`#gov-tab-bar::-webkit-scrollbar { display: none; }`}</style>
      <div
        id="gov-tab-bar"
        style={{
          padding: "8px 18px 0",
          borderBottom: "1px solid #E5E7EB",
          flexShrink: 0,
          display: "flex",
          gap: 3,
          overflowX: "auto",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
          WebkitOverflowScrolling: "touch",
        }}
      >
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
                display: "flex",
                alignItems: "center",
              }}
            >
              {TAB_ICONS[t.id]}
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── Tab content (independently scrollable) ── */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 18px 8px" }}>
        {activeTab === "overview"    && <OverviewTab filters={filters} govData={govData} onExportPDF={handleExportPDF} exporting={exporting} />}
        {activeTab === "underserved" && <UnderservedTab filters={filters} flyTo={flyTo} govData={govData} />}
        {activeTab === "barriers"    && <AccessBarriersTab govData={govData} filters={filters} />}
        {activeTab === "gaps"        && <ResourceGapsTab govData={govData} filters={filters} />}
        {activeTab === "alice"       && <ALICETab flyTo={flyTo} govData={govData} filters={filters} />}
        {activeTab === "transit"     && <TransitAccessTab govData={govData} filters={filters} />}
        {activeTab === "reliability" && <ReliabilityTab govData={govData} filters={filters} />}
        {activeTab === "vulnerable"  && <VulnerablePopTab govData={govData} filters={filters} />}
        <div style={{ height: 12 }} />
        <Footer />
      </div>
    </div>
  );
}
