"use client";

export default function FeedbackBars({ themes }) {
  if (!themes || themes.length === 0) return null;

  return (
    <div className="space-y-2">
      {themes.map((t) => (
        <div key={t.theme} className="flex items-center gap-2.5">
          <span className="text-xs text-sand-500 min-w-[90px]">{t.theme}</span>
          <div className="flex-1 h-2 bg-sand-200 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${t.pct}%`,
                backgroundColor:
                  t.sentiment === "positive" ? "#1D9E75" : "#E24B4A",
              }}
            />
          </div>
          <span className="text-xs font-medium min-w-[28px] text-right">
            {t.pct}%
          </span>
        </div>
      ))}
    </div>
  );
}
