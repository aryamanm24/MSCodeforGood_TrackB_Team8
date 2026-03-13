"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { demandEstimates, censusTracts } from "@/lib/data";

export default function GovernmentPanel() {
  const totalPop = censusTracts.reduce((s, t) => s + t.population, 0);
  const avgPoverty =
    censusTracts.reduce((s, t) => s + t.povertyRate, 0) / censusTracts.length;
  const gapZones = demandEstimates.filter((d) => d.gapScore > 0.5).length;
  const desertTracts = censusTracts.filter((t) => t.povertyRate > 0.4).length;

  const barData = demandEstimates.slice(0, 6).map((d) => ({
    name: d.tract,
    gap: Math.round(d.gapScore * 100),
    need: d.estimatedNeed,
    capacity: d.pantryCapacity,
  }));

  function gapColor(score) {
    if (score >= 70) return "#E24B4A";
    if (score >= 40) return "#EF9F27";
    return "#1D9E75";
  }

  return (
    <div className="p-6 pt-14 animate-fadeIn">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-lg font-semibold">Coverage gap analysis</h3>
        <div className="flex gap-2">
          <select className="text-xs border border-sand-200 rounded-lg px-2.5 py-1.5 bg-white cursor-pointer">
            <option>All regions</option>
            <option>Bayview</option>
            <option>South West</option>
          </select>
          <select className="text-xs border border-sand-200 rounded-lg px-2.5 py-1.5 bg-white cursor-pointer">
            <option>Last 6 months</option>
            <option>Last year</option>
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-2.5 mb-6">
        <div className="bg-sand-50 rounded-xl p-3.5">
          <div className="text-[10px] text-sand-400">Population</div>
          <div className="text-xl font-semibold">
            {(totalPop / 1000).toFixed(1)}k
          </div>
        </div>
        <div className="bg-sand-50 rounded-xl p-3.5">
          <div className="text-[10px] text-sand-400">Avg poverty</div>
          <div className="text-xl font-semibold">
            {Math.round(avgPoverty * 100)}%
          </div>
        </div>
        <div className="bg-sand-50 rounded-xl p-3.5">
          <div className="text-[10px] text-sand-400">Gap zones</div>
          <div className="text-xl font-semibold text-coral-400">
            {gapZones}
          </div>
        </div>
        <div className="bg-sand-50 rounded-xl p-3.5">
          <div className="text-[10px] text-sand-400">High poverty</div>
          <div className="text-xl font-semibold text-amber-400">
            {desertTracts}
          </div>
        </div>
      </div>

      {/* Gap chart */}
      <div className="bg-sand-50 rounded-xl p-4 mb-6">
        <div className="text-[11px] font-medium text-sand-500 mb-3">
          Demand vs supply gap by area
        </div>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={barData} layout="vertical">
            <XAxis
              type="number"
              domain={[0, 100]}
              tick={{ fontSize: 10, fill: "#9c9588" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fontSize: 10, fill: "#9c9588" }}
              width={75}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                fontSize: 11,
                background: "#fff",
                border: "1px solid #e8e4d8",
                borderRadius: 10,
              }}
              formatter={(val) => [`${val}%`, "Gap score"]}
            />
            <Bar dataKey="gap" radius={[0, 6, 6, 0]} barSize={14}>
              {barData.map((entry, i) => (
                <Cell key={i} fill={gapColor(entry.gap)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Critical gap cards */}
      <div className="mb-6">
        <div className="text-xs font-medium text-sand-400 mb-3">
          Critical gaps requiring intervention
        </div>
        <div className="space-y-2.5">
          {demandEstimates
            .filter((d) => d.gapScore > 0.5)
            .map((d) => (
              <div
                key={d.tract}
                className="bg-red-50 rounded-xl p-4 border border-red-100"
              >
                <div className="flex items-center justify-between mb-2.5">
                  <div className="text-sm font-semibold text-red-800">
                    {d.tract}
                  </div>
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-red-100 text-red-600">
                    Gap: {Math.round(d.gapScore * 100)}%
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-red-400">Population</span>
                    <span className="font-medium text-red-700">
                      {d.population.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-red-400">Poverty rate</span>
                    <span className="font-medium text-red-700">
                      {Math.round(d.povertyRate * 100)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-red-400">Est. monthly need</span>
                    <span className="font-medium text-red-700">
                      {d.estimatedNeed} families
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-red-400">Current capacity</span>
                    <span className="font-medium text-red-700">
                      {d.pantryCapacity || "None"}
                    </span>
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Demand estimation note */}
      <div className="bg-sand-50 rounded-xl p-4 mb-6">
        <div className="text-[11px] font-medium text-sand-500 mb-1">
          How demand is estimated
        </div>
        <div className="text-[11px] text-sand-400 leading-relaxed">
          Monthly need = tract population × poverty rate × 15% USDA food
          assistance utilization rate. Gap score = (estimated need − current
          pantry capacity) / estimated need. Scores above 50% indicate critical
          underservice.
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button className="py-3 bg-leaf-600 text-white text-sm font-medium rounded-xl hover:bg-leaf-700 transition-colors cursor-pointer">
          Export policy brief (PDF)
        </button>
        <button className="py-3 bg-white text-sand-800 text-sm font-medium rounded-xl border border-sand-200 hover:bg-sand-50 transition-colors cursor-pointer">
          Download data (CSV)
        </button>
      </div>
    </div>
  );
}
