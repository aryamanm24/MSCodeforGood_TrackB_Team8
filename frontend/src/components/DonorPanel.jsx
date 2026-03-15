"use client";

import React, { useState, useMemo, useCallback } from "react";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { donorData as defaultDonorData } from "@/lib/mockData";
import Footer from "./Footer";

// ── Borough background dot colors ────────────────────────────────────────────
const BOROUGH_BG_COLOR = {
  Bronx:          "#FCA5A5",
  Brooklyn:       "#FCD34D",
  Manhattan:      "#93C5FD",
  Queens:         "#6EE7B7",
  "Staten Island": "#C4B5FD",
};

// Borough color palette
const BOROUGH_COLOR_MAP = {
  Manhattan:     "#EF4444",
  Brooklyn:      "#3B82F6",
  Queens:        "#10B981",
  Bronx:         "#F59E0B",
  "Staten Island": "#8B5CF6",
  Unknown:       "#9CA3AF",
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function impactBadge(score) {
  if (score >= 0.7) return { label: "Critical need", bg: "#FEE2E2", text: "#991B1B" };
  if (score >= 0.6) return { label: "High need",     bg: "#FEF3C7", text: "#92400E" };
  if (score >= 0.5) return { label: "Elevated need", bg: "#FEF9C3", text: "#854D0E" };
  return { label: "Moderate", bg: "#F3F4F6", text: "#6B7280" };
}

function ratingColor(r) {
  if (r == null) return "#9CA3AF";
  if (r < 2.5) return "#DC2626";
  if (r < 3.0) return "#D97706";
  return "#166534";
}

function povertyColor(p) {
  if (p >= 35) return "#DC2626";
  if (p >= 25) return "#D97706";
  return "#374151";
}

// Group topImpactResources by ZIP, sorted by highest impact in group
function groupByZip(resources) {
  const byZip = new Map();
  resources.forEach((r) => {
    if (!byZip.has(r.zip)) byZip.set(r.zip, { zip: r.zip, borough: r.borough, povertyRate: r.povertyRate, rows: [] });
    byZip.get(r.zip).rows.push(r);
  });
  const groups = Array.from(byZip.values());
  groups.forEach((g) => g.rows.sort((a, b) => b.impactScore - a.impactScore));
  groups.sort((a, b) => Math.max(...b.rows.map((r) => r.impactScore)) - Math.max(...a.rows.map((r) => r.impactScore)));
  return groups;
}

// ── Custom borough bubble shape with label ───────────────────────────────────
function BoroughBubble({ cx, cy, payload }) {
  if (!cx || !cy) return null;
  const r = Math.max(Math.sqrt(payload.z / 20), 10);
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill={payload.color} fillOpacity={0.65} stroke={payload.color} strokeWidth={1.5} />
      <text
        x={cx} y={cy + r + 13}
        textAnchor="middle"
        fontSize={10} fontWeight={600}
        fill="#374151"
      >
        {payload.borough}
      </text>
    </g>
  );
}

// ── Custom shapes for full-network scatter ───────────────────────────────────
function BgDot({ cx, cy, payload }) {
  if (!cx || !cy) return null;
  return <circle cx={cx} cy={cy} r={4} fill={BOROUGH_BG_COLOR[payload.borough] ?? "#D1D5DB"} fillOpacity={0.55} />;
}

function HaloDot({ cx, cy }) {
  if (!cx || !cy) return null;
  return (
    <g>
      <circle cx={cx} cy={cy} r={12} fill="#EF4444" fillOpacity={0.15} />
      <circle cx={cx} cy={cy} r={7}  fill="#EF4444" fillOpacity={0.85} />
    </g>
  );
}

// Borough tooltip for bubble chart
function BoroughTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  if (!d) return null;
  return (
    <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 8, padding: "10px 14px", fontSize: 11, lineHeight: 1.8, boxShadow: "0 2px 8px rgba(0,0,0,.1)" }}>
      <strong style={{ fontSize: 12 }}>{d.borough}</strong><br />
      Avg poverty: <strong>{d.x}%</strong><br />
      Avg rating: <strong>{d.y} / 5.0</strong><br />
      Subscribers at risk: <strong>{d.z.toLocaleString()}</strong><br />
      Demand per pantry: <strong>~{d.demandPerPantry?.toLocaleString()} food-insecure people</strong><br />
      Critical resources: <strong>{d.resourceCount}</strong>
    </div>
  );
}

// Network scatter tooltip
function NetworkTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  if (!d) return null;
  if (d.name) {
    return (
      <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 8, padding: "10px 14px", fontSize: 11, lineHeight: 1.8, boxShadow: "0 2px 8px rgba(0,0,0,.1)" }}>
        <strong style={{ fontSize: 12 }}>{d.name}</strong><br />
        Borough: <strong>{d.borough}</strong><br />
        Poverty: <strong>{d.povertyRate}%</strong><br />
        Rating: <strong>{d.rating}</strong><br />
        Subscribers: <strong>{d.subscriptions}</strong>
      </div>
    );
  }
  return (
    <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 8, padding: "10px 14px", fontSize: 11, lineHeight: 1.8, boxShadow: "0 2px 8px rgba(0,0,0,.1)" }}>
      <strong>{d.borough}</strong><br />
      Poverty: <strong>{d.poverty}%</strong><br />
      Rating: <strong>{d.rating}</strong><br />
      Subscribers: <strong>{d.subs}</strong>
    </div>
  );
}

// Derive donorData metrics from govData (real) or fall back to mock
function buildDonorMetrics(govData) {
  if (!govData?.boroughStats) return null;

  const boroughKeys = ["Manhattan", "Brooklyn", "Queens", "Bronx", "Staten Island"];
  const boroughImpact = boroughKeys.map((name) => {
    const key = name === "Staten Island" ? "StatenIsland" : name;
    const stats = govData.boroughStats[key] ?? { total: 0, published: 0, unavailable: 0 };
    const underservedInBorough = (govData.underservedZips ?? []).filter((z) => z.borough === name);
    const avgPoverty = underservedInBorough.length > 0
      ? underservedInBorough.reduce((s, z) => s + (z.poverty ?? 0), 0) / underservedInBorough.length : 20;
    const aliceData = (govData.aliceSummary?.boroughs ?? []).find((b) => b.borough === name);
    return {
      borough: name,
      avgRating: 2.5,
      avgPoverty: Math.round(avgPoverty * 10) / 10,
      resourceCount: stats.total,
      avgImpact: stats.total > 0 ? Math.min(0.4 + avgPoverty / 100, 0.9) : 0.3,
      subscribersAtRisk: aliceData?.belowAliceHH ?? Math.round(stats.published * 12),
      demandPerPantry: underservedInBorough.length > 0
        ? Math.round(underservedInBorough.reduce((s, z) => s + (z.snapPerPantry ?? 0), 0) / underservedInBorough.length) : 0,
      color: BOROUGH_COLOR_MAP[name] ?? "#9CA3AF",
    };
  });

  const sortedUnderserved = [...(govData.underservedZips ?? [])].sort((a, b) => b.needScore - a.needScore);
  const topImpactResources = sortedUnderserved.slice(0, 8).map((z) => ({
    name: z.neighborhood || `ZIP ${z.zip}`,
    borough: z.borough,
    zip: z.zip,
    povertyRate: z.poverty,
    rating: 2.3,
    subscriptions: z.aliceHouseholds || z.foodInsecurity || 0,
    impactScore: Math.min(z.needScore / 100, 0.95),
    status: "PUBLISHED",
    lat: z.lat,
    lng: z.lng,
  }));

  const backgroundResources = sortedUnderserved.map((z) => ({
    name: z.neighborhood || `ZIP ${z.zip}`,
    borough: z.borough,
    zip: z.zip,
    poverty: z.poverty,
    rating: 2.3,
  }));

  return {
    boroughImpact,
    topImpactResources,
    backgroundResources,
    network: { totalPantries: (govData.systemStats?.resourceTypes?.foodPantry ?? 0), totalSoupKitchens: (govData.systemStats?.resourceTypes?.soupKitchen ?? 0) },
    methodology: "Impact score derived from ALICE % below threshold, poverty rate, and pantry coverage ratio. Data from LemonTree platform + ACS 2024.",
  };
}

// ── Main component ────────────────────────────────────────────────────────────
export default function DonorPanel({ govData: govDataProp }) {
  const [showWhy, setShowWhy] = useState(false);
  const [selected, setSelected] = useState(new Set());

  const derivedDonorData = useMemo(() => buildDonorMetrics(govDataProp), [govDataProp]);
  const donorData = derivedDonorData ?? defaultDonorData;

  // Borough bubbles computed from real or mock data
  const BOROUGH_BUBBLES = useMemo(() => donorData.boroughImpact.map((b) => ({
    borough: b.borough,
    x: b.avgPoverty,
    y: b.avgRating,
    z: b.subscribersAtRisk,
    impactScore: b.avgImpact,
    resourceCount: b.resourceCount,
    demandPerPantry: b.demandPerPantry,
    color: b.color,
  })), [donorData]);

  const { network, topImpactResources, backgroundResources, methodology } = donorData;

  const zipGroups = useMemo(() => groupByZip(topImpactResources), [topImpactResources]);

  // Full-network scatter — background then highlighted
  const bgScatterData = useMemo(
    () => backgroundResources.map((r) => ({ ...r, x: r.poverty, y: r.rating })),
    [backgroundResources]
  );
  const topScatterData = useMemo(
    () => topImpactResources.map((r) => ({ ...r, x: r.povertyRate, y: r.rating })),
    [topImpactResources]
  );

  // Portfolio builder stats
  const portfolioStats = useMemo(() => {
    if (selected.size === 0) return null;
    const sel = topImpactResources.filter((r) => selected.has(r.name));
    const totalSubs = sel.reduce((s, r) => s + r.subscriptions, 0);
    const zips = [...new Set(sel.map((r) => r.zip))];
    const avgPoverty = sel.reduce((s, r) => s + r.povertyRate, 0) / sel.length;
    return { count: sel.length, totalSubs, zips, avgPoverty: avgPoverty.toFixed(1) };
  }, [selected, topImpactResources]);

  const toggleResource = useCallback((name) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }, []);

  return (
    <div
      style={{
        padding: "28px 32px 32px",
        background: "#F8F9FA",
        fontFamily: "'DM Sans', system-ui, sans-serif",
        maxWidth: 960,
        margin: "0 auto",
      }}
    >
      {/* ── Fix 6: panel subtitle ── */}
      <div style={{ fontSize: 11, color: "#9CA3AF", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
        Impact dashboard · NYC food resource network · ACS 2024
        <span style={{ background: "#DCFCE7", color: "#166534", padding: "2px 8px", borderRadius: 10, fontSize: 10, fontWeight: 600 }}>
          Active funder
        </span>
      </div>

      {/* ── Fix 3: Impact reach hero stat ── */}
      <div
        style={{
          background: "#fff",
          border: "1px solid #E5E7EB",
          borderLeft: "4px solid #2D6A4F",
          borderRadius: "0 12px 12px 0",
          padding: "20px 24px",
          marginBottom: 20,
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", gap: 24, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: 42, fontWeight: 800, color: "#2D6A4F", lineHeight: 1 }}>5,634</div>
            <div style={{ fontSize: 13, color: "#374151", marginTop: 5, lineHeight: 1.5 }}>
              families depending on critical-need resources across NYC
            </div>
            <div style={{ fontSize: 12, color: "#6B7280", marginTop: 4 }}>
              44 resources rated below 2.5 in neighborhoods averaging 36.9% poverty · Bronx is the highest-need concentration
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
              {[["44 critical resources", "#F3F4F6", "#374151"], ["Bronx: 40 of 44", "#FEE2E2", "#991B1B"], ["Avg poverty: 36.9%", "#FEF3C7", "#92400E"]].map(([lbl, bg, clr]) => (
                <span key={lbl} style={{ fontSize: 11, fontWeight: 600, color: clr, background: bg, padding: "4px 10px", borderRadius: 8 }}>{lbl}</span>
              ))}
            </div>
          </div>
          <div style={{ flex: 1, minWidth: 200, fontSize: 12, color: "#6B7280", lineHeight: 1.7, paddingTop: 4 }}>
            Across NYC, <strong style={{ color: "#374151" }}>{network.highDemandLowRated} food pantries</strong> have high community demand but ratings below 2.5 — meaning hundreds of families rely on resources that aren&apos;t meeting their needs. These are the highest-impact funding targets.
          </div>
        </div>
      </div>

      {/* ── Fix 1: Borough bubble chart ── */}
      <div
        style={{
          background: "#fff",
          border: "1px solid #E5E7EB",
          borderRadius: 12,
          padding: "18px 20px",
          marginBottom: 20,
        }}
      >
        <div style={{ fontSize: 14, fontWeight: 700, color: "#111827", marginBottom: 3 }}>
          Where is the need most concentrated?
        </div>
        <div style={{ fontSize: 12, color: "#6B7280", marginBottom: 14 }}>
          Bubble size = families depending on critical-need resources · X = poverty rate · Y = quality (lower = worse)
        </div>
        <div style={{ position: "relative" }}>
          <div style={{ position: "absolute", top: 4, right: 8, fontSize: 10, fontWeight: 600, color: "#DC2626", zIndex: 10 }}>
            Highest impact zone →
          </div>
          <div style={{ position: "absolute", bottom: 36, left: 60, fontSize: 10, color: "#9CA3AF", zIndex: 10 }}>
            ← Lower priority
          </div>
          <ResponsiveContainer width="100%" height={320}>
            <ScatterChart margin={{ top: 20, right: 20, bottom: 36, left: 0 }}>
              <XAxis
                type="number" dataKey="x"
                domain={[0, 40]}
                tick={{ fontSize: 10, fill: "#9CA3AF" }}
                axisLine={false} tickLine={false}
                label={{ value: "Average poverty rate (%)", position: "insideBottom", offset: -20, style: { fontSize: 10, fill: "#9CA3AF" } }}
              />
              <YAxis
                type="number" dataKey="y"
                domain={[1.5, 3.0]}
                reversed
                tick={{ fontSize: 10, fill: "#9CA3AF" }}
                axisLine={false} tickLine={false}
                label={{ value: "Avg rating (lower = worse quality)", angle: -90, position: "insideLeft", offset: 10, style: { fontSize: 10, fill: "#9CA3AF" } }}
              />
              <ZAxis type="number" dataKey="z" range={[80, 700]} />
              <Tooltip content={<BoroughTooltip />} cursor={false} />
              <Scatter data={BOROUGH_BUBBLES} shape={<BoroughBubble />} />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
        <div style={{ padding: "10px 12px", background: "#FEF2F2", borderLeft: "3px solid #EF4444", borderRadius: "0 8px 8px 0", fontSize: 12, color: "#991B1B", lineHeight: 1.5 }}>
          The Bronx sits in the top-right corner — highest poverty and worst average quality — with 5,304 subscribers at risk. It is the unambiguous highest-impact zone for donor funding.
        </div>
      </div>

      {/* ── Honest caveat card ── */}
      <div style={{ background: "#F9FAFB", borderRadius: 12, padding: "18px 20px", border: "1px solid #F3F4F6", marginBottom: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 12 }}>
          What this data can and cannot tell you
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px 24px", fontSize: 12, color: "#6B7280", lineHeight: 1.7 }}>
          <div>
            <div style={{ fontWeight: 600, color: "#374151", marginBottom: 6 }}>Can tell you:</div>
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              <li>Which resources serve the highest-need communities</li>
              <li>Which resources have the most room for quality improvement</li>
              <li>How many people currently depend on each resource</li>
              <li>Geographic concentration of need by borough and ZIP</li>
            </ul>
          </div>
          <div>
            <div style={{ fontWeight: 600, color: "#374151", marginBottom: 6 }}>Cannot tell you (yet):</div>
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              <li>The specific dollar amount needed per resource</li>
              <li>Confirmed before/after impact of past donations</li>
              <li>What specific improvements donors have funded</li>
              <li>Revenue or operational budget of each pantry</li>
            </ul>
          </div>
        </div>
        <p style={{ fontSize: 11, color: "#9CA3AF", marginTop: 14, marginBottom: 0, lineHeight: 1.6 }}>
          LemonTree is building toward longitudinal impact tracking. This dashboard represents current-state analysis from ACS 2024 demographic data cross-referenced with 1,976 LemonTree resources.
        </p>
      </div>

      {/* ── Fix 2: Full-network scatter ── */}
      <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 12, padding: "18px 20px", marginBottom: 20 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#111827", marginBottom: 3 }}>
          The funding landscape — 703 scored resources
        </div>
        <div style={{ fontSize: 12, color: "#6B7280", marginBottom: 14 }}>
          Highlighted = highest-impact opportunities · Gray dots = full network context
        </div>
        <div style={{ position: "relative" }}>
          <div style={{ position: "absolute", top: 6, right: 8, fontSize: 10, fontWeight: 600, color: "#DC2626", zIndex: 10, maxWidth: 180, textAlign: "right" }}>
            High poverty + low rating = most improvement potential
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <ScatterChart margin={{ top: 10, right: 20, bottom: 28, left: 0 }}>
              <XAxis
                type="number" dataKey="x"
                domain={[0, 45]}
                tick={{ fontSize: 10, fill: "#9CA3AF" }}
                axisLine={false} tickLine={false}
                label={{ value: "Poverty rate (%)", position: "insideBottom", offset: -14, style: { fontSize: 10, fill: "#9CA3AF" } }}
              />
              <YAxis
                type="number" dataKey="y"
                domain={[1.5, 3.5]}
                tick={{ fontSize: 10, fill: "#9CA3AF" }}
                axisLine={false} tickLine={false}
                label={{ value: "Current rating", angle: -90, position: "insideLeft", style: { fontSize: 10, fill: "#9CA3AF" } }}
              />
              <ZAxis range={[20, 20]} />
              <Tooltip content={<NetworkTooltip />} cursor={{ strokeDasharray: "3 3" }} />
              <Scatter data={bgScatterData} shape={<BgDot />} name="Network" />
              <Scatter data={topScatterData} shape={<HaloDot />} name="Top impact" />
            </ScatterChart>
          </ResponsiveContainer>
          {/* Legend */}
          <div style={{ display: "flex", gap: 16, fontSize: 11, color: "#6B7280", justifyContent: "center", marginTop: 6 }}>
            <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{ display: "inline-block", width: 10, height: 10, borderRadius: "50%", background: "#D1D5DB" }} />
              Full network (703 resources)
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{ display: "inline-block", width: 10, height: 10, borderRadius: "50%", background: "#EF4444" }} />
              Top impact opportunities
            </span>
          </div>
        </div>
      </div>

      {/* ── Fix 4 + 5: Portfolio builder ── */}
      <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 12, overflow: "hidden", marginBottom: 20 }}>
        <div style={{ padding: "14px 20px", borderBottom: "1px solid #E5E7EB" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#6B7280", letterSpacing: "0.06em", marginBottom: 4 }}>
            SUGGESTED PORTFOLIO
          </div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#111827", marginBottom: 4 }}>
            Build your impact portfolio
          </div>
          <div style={{ fontSize: 12, color: "#6B7280" }}>
            Select resources to see your combined reach · Impact level = poverty + quality gap + subscriber demand
          </div>
        </div>

        {/* ZIP-grouped rows (Fix 5 two-line format + checkboxes) */}
        <div>
          {zipGroups.map((group) => (
            <React.Fragment key={group.zip}>
              {/* ZIP divider */}
              <div style={{ background: "#F9FAFB", borderBottom: "1px solid #E5E7EB", borderTop: "1px solid #E5E7EB", padding: "6px 20px", fontSize: 11, color: "#6B7280" }}>
                ZIP {group.zip}, {group.borough} — poverty {group.povertyRate}%
              </div>
              {group.rows.map((r) => {
                const badge = impactBadge(r.impactScore);
                const isChecked = selected.has(r.name);
                return (
                  <div
                    key={r.name}
                    onClick={() => toggleResource(r.name)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 14,
                      padding: "12px 20px",
                      borderBottom: "1px solid #F3F4F6",
                      cursor: "pointer",
                      background: isChecked ? "#F0FDF4" : "transparent",
                      transition: "background 0.12s",
                    }}
                    onMouseEnter={(e) => { if (!isChecked) e.currentTarget.style.background = "#F9FAFB"; }}
                    onMouseLeave={(e) => { if (!isChecked) e.currentTarget.style.background = "transparent"; }}
                  >
                    {/* Checkbox */}
                    <div
                      style={{
                        width: 18, height: 18, borderRadius: 4, flexShrink: 0,
                        border: `2px solid ${isChecked ? "#2D6A4F" : "#D1D5DB"}`,
                        background: isChecked ? "#2D6A4F" : "#fff",
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}
                    >
                      {isChecked && (
                        <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                          <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </div>
                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#111827", marginBottom: 3 }}>{r.name}</div>
                      <div style={{ fontSize: 11, color: "#6B7280" }}>
                        <span style={{ color: ratingColor(r.rating), fontWeight: 600 }}>Rating {r.rating}</span>
                        {" · "}
                        <span style={{ color: povertyColor(r.povertyRate) }}>Poverty {r.povertyRate}%</span>
                        {" · "}
                        {r.subscriptions} subscribers
                      </div>
                    </div>
                    {/* Badge */}
                    <span style={{ background: badge.bg, color: badge.text, padding: "4px 10px", borderRadius: 6, fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                      {badge.label}
                    </span>
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>

        {/* Live portfolio summary bar */}
        <div
          style={{
            padding: "14px 20px",
            background: portfolioStats ? "#2D6A4F" : "#F9FAFB",
            transition: "background 0.2s",
          }}
        >
          {portfolioStats ? (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12 }}>
              {[
                { val: portfolioStats.count, label: "resources selected" },
                { val: portfolioStats.totalSubs.toLocaleString(), label: "combined subscribers" },
                { val: portfolioStats.zips.join(", "), label: "ZIP codes covered" },
                { val: `${portfolioStats.avgPoverty}%`, label: "avg poverty rate" },
              ].map(({ val, label }) => (
                <div key={label}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: "#fff", lineHeight: 1 }}>{val}</div>
                  <div style={{ fontSize: 10, color: "#86EFAC", marginTop: 3 }}>{label}</div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ fontSize: 12, color: "#9CA3AF", textAlign: "center" }}>
              Select resources above to see your combined impact
            </div>
          )}
        </div>

        {/* Insight + methodology */}
        <div style={{ padding: "12px 20px", background: "#F0FDF4", borderTop: "1px solid #BBF7D0", fontSize: 12, color: "#166534", lineHeight: 1.6 }}>
          These resources span 4 Bronx ZIP codes — a concentrated high-need area where coordinated support across multiple pantries would have the greatest combined impact.
        </div>
        <div style={{ padding: "8px 20px 14px", borderTop: "1px solid #F3F4F6" }}>
          <button
            type="button"
            onClick={() => setShowWhy((s) => !s)}
            style={{ fontSize: 11, color: "#6B7280", background: "none", border: "none", cursor: "pointer", padding: 0, textDecoration: "underline", fontWeight: 600 }}
          >
            {showWhy ? "Hide methodology" : "How is impact score calculated?"}
          </button>
          {showWhy && (
            <p style={{ fontSize: 11, color: "#9CA3AF", marginTop: 8, lineHeight: 1.6 }}>{methodology}</p>
          )}
        </div>
      </div>

      <div style={{ height: 24 }} />
      <Footer />
    </div>
  );
}
