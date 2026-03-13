"use client";

export default function StatCard({ label, value, delta, deltaLabel, color, large }) {
  const isPositive = delta > 0;
  const deltaColor =
    color === "inverse"
      ? isPositive
        ? "text-coral-400"
        : "text-leaf-600"
      : isPositive
      ? "text-leaf-600"
      : "text-coral-400";

  return (
    <div className="bg-sand-50 rounded-lg p-3.5">
      <div className="text-[11px] text-sand-500 font-medium">{label}</div>
      <div
        className={`${large ? "text-2xl" : "text-xl"} font-semibold mt-0.5`}
        style={color && color !== "inverse" ? { color } : undefined}
      >
        {value}
      </div>
      {delta !== undefined && (
        <div className={`text-[11px] mt-0.5 ${deltaColor}`}>
          {isPositive ? "+" : ""}
          {delta}
          {deltaLabel ? ` ${deltaLabel}` : ""}
        </div>
      )}
    </div>
  );
}
