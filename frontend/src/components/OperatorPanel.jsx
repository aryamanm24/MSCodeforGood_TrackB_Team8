"use client";

import { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import StatCard from "./StatCard";
import FeedbackBars from "./FeedbackBars";
import { feedbackThemes, ratingColor } from "@/lib/data";

export default function OperatorPanel({ resource }) {
  const themes = feedbackThemes[resource?.id] || feedbackThemes["res_002"];

  const ratingData = useMemo(() => {
    if (!resource) return [];
    return resource.monthLabels.map((m, i) => ({
      month: m,
      rating: resource.ratingTrend[i],
    }));
  }, [resource]);

  const waitData = useMemo(() => {
    if (!resource) return [];
    return resource.monthLabels.map((m, i) => ({
      month: m,
      wait: resource.waitTrend[i],
    }));
  }, [resource]);

  if (!resource) return null;

  const color = ratingColor(resource.rating);
  const badgeLabel =
    resource.rating >= 3.8
      ? "Good"
      : resource.rating >= 3.0
      ? "Fair"
      : "Needs attention";

  const topNeg = themes
    .filter((t) => t.sentiment === "negative")
    .sort((a, b) => b.pct - a.pct)[0];

  const actionText = topNeg
    ? `${topNeg.pct}% of reviews mention "${topNeg.theme.toLowerCase()}". ${
        topNeg.theme === "Long wait"
          ? "Consider adding a second distribution window or extending hours on peak days."
          : topNeg.theme === "Wrong hours"
          ? "Please verify your listed hours — visitors are arriving when you're closed."
          : topNeg.theme === "Limited variety"
          ? "Visitors are requesting more variety, especially fresh produce and dairy."
          : "Addressing this could significantly improve visitor satisfaction."
      }`
    : "Your pantry is performing well across all feedback categories.";

  return (
    <div className="p-6 pt-14 animate-fadeIn">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold leading-tight">
            {resource.name}
          </h2>
          <p className="text-xs text-sand-400 mt-1">{resource.address}</p>
        </div>
        <span
          className="text-xs font-medium px-3 py-1 rounded-lg shrink-0 ml-3"
          style={{ backgroundColor: color + "15", color }}
        >
          {badgeLabel} — {resource.rating}
        </span>
      </div>

      {/* Stat grid */}
      <div className="grid grid-cols-2 gap-2.5 mb-6">
        <StatCard
          label="Rating"
          value={resource.rating.toFixed(1)}
          delta={+(
            resource.ratingTrend[resource.ratingTrend.length - 1] -
            resource.ratingTrend[0]
          ).toFixed(1)}
          deltaLabel="vs 6mo ago"
          color={color}
        />
        <StatCard
          label="Avg wait"
          value={`${resource.waitTime} min`}
          delta={
            resource.waitTrend[resource.waitTrend.length - 1] -
            resource.waitTrend[0]
          }
          deltaLabel="min"
          color="inverse"
        />
        <StatCard
          label="Got help rate"
          value={`${Math.round(resource.gotHelpRate * 100)}%`}
        />
        <StatCard
          label="Info accuracy"
          value={`${Math.round(resource.infoAccuracy * 100)}%`}
          color={resource.infoAccuracy < 0.7 ? "#E24B4A" : undefined}
        />
      </div>

      {/* Rating trend */}
      <div className="bg-sand-50 rounded-xl p-4 mb-3">
        <div className="text-[11px] font-medium text-sand-500 mb-3">
          Rating trend (6 months)
        </div>
        <ResponsiveContainer width="100%" height={90}>
          <LineChart data={ratingData}>
            <XAxis
              dataKey="month"
              tick={{ fontSize: 10, fill: "#9c9588" }}
              axisLine={false}
              tickLine={false}
            />
            <Line
              type="monotone"
              dataKey="rating"
              stroke={color}
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 4, fill: color }}
            />
            <Tooltip
              contentStyle={{
                fontSize: 12,
                background: "#fff",
                border: "1px solid #e8e4d8",
                borderRadius: 10,
                boxShadow: "0 2px 8px rgba(0,0,0,.06)",
              }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Wait trend */}
      <div className="bg-sand-50 rounded-xl p-4 mb-6">
        <div className="text-[11px] font-medium text-sand-500 mb-3">
          Wait time trend (6 months)
        </div>
        <ResponsiveContainer width="100%" height={90}>
          <LineChart data={waitData}>
            <XAxis
              dataKey="month"
              tick={{ fontSize: 10, fill: "#9c9588" }}
              axisLine={false}
              tickLine={false}
            />
            <Line
              type="monotone"
              dataKey="wait"
              stroke="#E24B4A"
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 4, fill: "#E24B4A" }}
            />
            <Tooltip
              contentStyle={{
                fontSize: 12,
                background: "#fff",
                border: "1px solid #e8e4d8",
                borderRadius: 10,
                boxShadow: "0 2px 8px rgba(0,0,0,.06)",
              }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Feedback themes */}
      <div className="bg-sand-50 rounded-xl p-4 mb-5">
        <div className="text-[11px] font-medium text-sand-500 mb-3">
          Feedback themes ({resource.reviews} reviews)
        </div>
        <FeedbackBars themes={themes} />
      </div>

      {/* Action */}
      <div className="bg-leaf-50 rounded-xl p-4 border border-leaf-200 mb-5">
        <div className="text-xs font-semibold text-leaf-800 mb-1">
          Suggested action
        </div>
        <div className="text-xs text-leaf-700 leading-relaxed">
          {actionText}
        </div>
      </div>

      <button className="w-full py-3 bg-leaf-600 text-white text-sm font-medium rounded-xl hover:bg-leaf-700 transition-colors cursor-pointer">
        Export pantry report (PDF)
      </button>
    </div>
  );
}
