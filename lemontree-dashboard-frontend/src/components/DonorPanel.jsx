"use client";

import { useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { resources, donorPortfolio, ratingColor } from "@/lib/data";

export default function DonorPanel() {
  const dp = donorPortfolio;

  const fundedResources = useMemo(
    () => resources.filter((r) => dp.fundedResourceIds.includes(r.id)),
    [dp.fundedResourceIds]
  );

  // Aggregate trend across funded resources
  const trendData = useMemo(() => {
    const months = fundedResources[0]?.monthLabels || [];
    return months.map((m, i) => {
      const avgRating =
        fundedResources.reduce((s, r) => s + r.ratingTrend[i], 0) /
        fundedResources.length;
      return { month: m, rating: +avgRating.toFixed(2) };
    });
  }, [fundedResources]);

  return (
    <div className="p-6 pt-14 animate-fadeIn">
      {/* Hero */}
      <div className="text-center mb-7">
        <div className="text-5xl font-semibold text-leaf-600 tracking-tight">
          {dp.impactStats.familiesReached.toLocaleString()}
        </div>
        <div className="text-sm text-sand-400 mt-2">
          families reached across {fundedResources.length} funded locations
        </div>
      </div>

      {/* Impact cards */}
      <div className="grid grid-cols-3 gap-3 mb-7">
        <div className="bg-sand-50 rounded-xl p-4 text-center">
          <div className="text-2xl font-semibold text-leaf-600">
            +{Math.round(dp.impactStats.satisfactionDelta * 100)}%
          </div>
          <div className="text-[10px] text-sand-400 mt-1">
            Satisfaction improvement
          </div>
        </div>
        <div className="bg-sand-50 rounded-xl p-4 text-center">
          <div className="text-2xl font-semibold text-leaf-600">
            {Math.round(dp.impactStats.waitTimeDelta * 100)}%
          </div>
          <div className="text-[10px] text-sand-400 mt-1">
            Wait time reduction
          </div>
        </div>
        <div className="bg-sand-50 rounded-xl p-4 text-center">
          <div className="text-2xl font-semibold">
            {dp.impactStats.resourcesAdded}
          </div>
          <div className="text-[10px] text-sand-400 mt-1">
            New resources funded
          </div>
        </div>
      </div>

      {/* Aggregate satisfaction trend */}
      <div className="bg-sand-50 rounded-xl p-4 mb-6">
        <div className="text-[11px] font-medium text-sand-500 mb-3">
          Average satisfaction across funded locations
        </div>
        <ResponsiveContainer width="100%" height={100}>
          <AreaChart data={trendData}>
            <defs>
              <linearGradient id="greenFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#1D9E75" stopOpacity={0.15} />
                <stop offset="100%" stopColor="#1D9E75" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="month"
              tick={{ fontSize: 10, fill: "#9c9588" }}
              axisLine={false}
              tickLine={false}
            />
            <Area
              type="monotone"
              dataKey="rating"
              stroke="#1D9E75"
              strokeWidth={2.5}
              fill="url(#greenFill)"
              dot={false}
              activeDot={{ r: 4, fill: "#1D9E75" }}
            />
            <Tooltip
              contentStyle={{
                fontSize: 12,
                background: "#fff",
                border: "1px solid #e8e4d8",
                borderRadius: 10,
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Before / After */}
      <div className="grid grid-cols-[1fr_36px_1fr] items-center gap-0 mb-6">
        <div className="bg-sand-50 rounded-xl p-4">
          <div className="text-xs font-medium text-sand-400 mb-2.5">
            6 months ago
          </div>
          <div className="space-y-2 text-xs">
            <Row label="Avg rating" value={dp.beforeMetrics.avgRating} />
            <Row label="Avg wait" value={`${dp.beforeMetrics.avgWait} min`} />
            <Row
              label="Got help"
              value={`${Math.round(dp.beforeMetrics.gotHelpRate * 100)}%`}
            />
          </div>
        </div>
        <div className="text-center text-sand-300 text-lg">→</div>
        <div className="bg-sand-50 rounded-xl p-4">
          <div className="text-xs font-medium text-sand-400 mb-2.5">
            Current
          </div>
          <div className="space-y-2 text-xs">
            <Row
              label="Avg rating"
              value={dp.currentMetrics.avgRating}
              good
            />
            <Row
              label="Avg wait"
              value={`${dp.currentMetrics.avgWait} min`}
              good
            />
            <Row
              label="Got help"
              value={`${Math.round(dp.currentMetrics.gotHelpRate * 100)}%`}
              good
            />
          </div>
        </div>
      </div>

      {/* Per-location cards */}
      <div className="mb-5">
        <div className="text-xs font-medium text-sand-400 mb-3">
          Your funded locations
        </div>
        <div className="space-y-2.5">
          {fundedResources.map((r) => {
            const color = ratingColor(r.rating);
            return (
              <div
                key={r.id}
                className="bg-sand-50 rounded-xl p-4 flex items-center gap-4"
              >
                <div
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: color }}
                />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">
                    {r.name}
                  </div>
                  <div className="text-[10px] text-sand-400 mt-0.5">
                    {r.address}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-sm font-semibold" style={{ color }}>
                    {r.rating}
                  </div>
                  <div className="text-[10px] text-sand-400">
                    {r.waitTime}m wait
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Testimonial */}
      <div className="bg-sand-50 rounded-xl p-4 border-l-[3px] border-leaf-600 mb-6">
        <div className="text-sm italic text-sand-800 leading-relaxed">
          &ldquo;Amazing variety of fresh food! The volunteers were so kind and
          helpful. Very grateful for this resource.&rdquo;
        </div>
        <div className="text-[10px] text-sand-400 mt-2">
          — Visitor at Highland Park Food Bank (shared with permission)
        </div>
      </div>

      <button className="w-full py-3 bg-leaf-600 text-white text-sm font-medium rounded-xl hover:bg-leaf-700 transition-colors cursor-pointer">
        Export impact report (PDF)
      </button>
    </div>
  );
}

function Row({ label, value, good }) {
  return (
    <div className="flex justify-between">
      <span className="text-sand-400">{label}</span>
      <span className={`font-medium ${good ? "text-leaf-600" : ""}`}>
        {value}
      </span>
    </div>
  );
}
