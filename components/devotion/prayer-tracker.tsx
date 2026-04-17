"use client";

import { useState, useEffect } from "react";
import { togglePrayer, getPrayers } from "@/app/actions/devotion";

const PRAYERS = ["fajr", "dhuhr", "asr", "maghrib", "isha"] as const;
const PRAYER_LABELS: Record<string, string> = {
  fajr: "Fajr", dhuhr: "Dhuhr", asr: "Asr", maghrib: "Maghrib", isha: "Isha",
};

function toDateKey(d: Date) {
  return d.toISOString().slice(0, 10);
}

function getLast7Days(): string[] {
  const days: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(toDateKey(d));
  }
  return days;
}

export function PrayerTracker() {
  const today = toDateKey(new Date());
  const days = getLast7Days();
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPrayers(days[0], days[days.length - 1]).then((data) => {
      const keys = new Set(data.map((p: { day: string; prayer: string }) => `${p.day}:${p.prayer}`));
      setCompleted(keys);
      setLoading(false);
    });
  }, []);

  const toggle = async (day: string, prayer: string) => {
    const key = `${day}:${prayer}`;
    const next = new Set(completed);
    if (next.has(key)) next.delete(key); else next.add(key);
    setCompleted(next);
    await togglePrayer(day, prayer);
  };

  if (loading) return <div className="text-xs text-white/30 text-center py-8">Loading prayers...</div>;

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-xs font-mono text-emerald-500 tracking-widest mb-3">TODAY</h3>
        <div className="flex items-center justify-between gap-2">
          {PRAYERS.map((p) => {
            const done = completed.has(`${today}:${p}`);
            return (
              <button key={p} onClick={() => toggle(today, p)} className="flex flex-col items-center gap-1.5">
                <div className={`w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all ${
                  done ? "bg-emerald-500/20 border-emerald-500 text-emerald-400" : "border-white/10 text-white/20 hover:border-white/30"
                }`}>
                  {done && (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <span className={`text-[10px] font-mono ${done ? "text-emerald-400" : "text-white/30"}`}>{PRAYER_LABELS[p]}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <h3 className="text-xs font-mono text-white/30 tracking-widest mb-2">LAST 7 DAYS</h3>
        <div className="grid grid-cols-8 gap-1 text-[10px]">
          <div />
          {days.map((d) => (
            <div key={d} className="text-center text-white/20 font-mono">
              {new Date(d + "T12:00:00").toLocaleDateString(undefined, { weekday: "narrow" })}
            </div>
          ))}
          {PRAYERS.map((p) => (
            <div key={p} className="contents">
              <div className="text-white/30 font-mono text-right pr-1 flex items-center justify-end">{PRAYER_LABELS[p].slice(0, 3)}</div>
              {days.map((d) => {
                const done = completed.has(`${d}:${p}`);
                return (
                  <button
                    key={`${d}:${p}`}
                    onClick={() => toggle(d, p)}
                    className={`w-full aspect-square rounded transition-colors ${
                      done ? "bg-emerald-500/40" : "bg-white/5 hover:bg-white/10"
                    }`}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
