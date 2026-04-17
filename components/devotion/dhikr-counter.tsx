"use client";

import { useState, useEffect, useCallback } from "react";
import { RotateCcw } from "lucide-react";
import { upsertDhikr, getDhikrForDay } from "@/app/actions/devotion";

const PRESETS = [
  { type: "subhanallah", label: "SubhanAllah", target: 33 },
  { type: "alhamdulillah", label: "Alhamdulillah", target: 33 },
  { type: "allahuakbar", label: "Allahu Akbar", target: 34 },
  { type: "istighfar", label: "Astaghfirullah", target: 100 },
];

function toDateKey(d: Date) { return d.toISOString().slice(0, 10); }

export function DhikrCounter() {
  const today = toDateKey(new Date());
  const [activeType, setActiveType] = useState(PRESETS[0].type);
  const [counts, setCounts] = useState<Map<string, number>>(new Map());

  useEffect(() => {
    getDhikrForDay(today).then((data) => {
      const map = new Map<string, number>();
      for (const d of data) map.set(d.type, d.count);
      setCounts(map);
    });
  }, [today]);

  const activePreset = PRESETS.find((p) => p.type === activeType) ?? PRESETS[0];
  const count = counts.get(activeType) ?? 0;
  const progress = activePreset.target ? Math.min(count / activePreset.target, 1) : 0;

  const tap = useCallback(async () => {
    const newCount = count + 1;
    setCounts((prev) => new Map(prev).set(activeType, newCount));
    if (navigator.vibrate) navigator.vibrate(10);
    await upsertDhikr({ day: today, type: activeType, label: activePreset.label, count: newCount, target: activePreset.target });
  }, [count, activeType, activePreset, today]);

  const reset = async () => {
    setCounts((prev) => new Map(prev).set(activeType, 0));
    await upsertDhikr({ day: today, type: activeType, label: activePreset.label, count: 0, target: activePreset.target });
  };

  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        {PRESETS.map((p) => (
          <button
            key={p.type}
            onClick={() => setActiveType(p.type)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              activeType === p.type ? "bg-emerald-500/20 text-emerald-400" : "bg-white/5 text-white/40 hover:text-white/60"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="flex flex-col items-center">
        <button onClick={tap} className="relative w-48 h-48 rounded-full flex items-center justify-center active:scale-95 transition-transform">
          <svg className="absolute inset-0 -rotate-90" viewBox="0 0 160 160">
            <circle cx="80" cy="80" r={radius} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="6" />
            <circle cx="80" cy="80" r={radius} fill="none" stroke="rgb(16,185,129)" strokeWidth="6" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} className="transition-all duration-200" />
          </svg>
          <div className="text-center z-10">
            <span className="text-4xl font-bold text-white tabular-nums">{count}</span>
            {activePreset.target && <p className="text-xs text-white/30 mt-1">/ {activePreset.target}</p>}
          </div>
        </button>
        <button onClick={reset} className="mt-3 flex items-center gap-1.5 text-xs text-white/30 hover:text-white/60 transition-colors">
          <RotateCcw size={12} />
          Reset
        </button>
      </div>
    </div>
  );
}
