"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { toggleFasting, getFasting } from "@/app/actions/devotion";

function toDateKey(d: Date) { return d.toISOString().slice(0, 10); }
function getMonthKey(d: Date) { return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`; }
function getDaysInMonth(year: number, month: number) { return new Date(year, month + 1, 0).getDate(); }
function getFirstDayOfWeek(year: number, month: number) { return new Date(year, month, 1).getDay(); }

export function FastingLog() {
  const [viewDate, setViewDate] = useState(new Date());
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const monthKey = getMonthKey(viewDate);
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfWeek(year, month);
  const [fastedDays, setFastedDays] = useState<Set<string>>(new Set());

  useEffect(() => {
    getFasting(monthKey).then((data) => {
      setFastedDays(new Set(data.map((f: { day: string }) => f.day)));
    });
  }, [monthKey]);

  const toggle = async (day: number) => {
    const key = `${monthKey}-${String(day).padStart(2, "0")}`;
    const next = new Set(fastedDays);
    if (next.has(key)) next.delete(key); else next.add(key);
    setFastedDays(next);
    await toggleFasting(key);
  };

  const prevMonth = () => { const d = new Date(viewDate); d.setMonth(d.getMonth() - 1); setViewDate(d); };
  const nextMonth = () => { const d = new Date(viewDate); d.setMonth(d.getMonth() + 1); setViewDate(d); };
  const monthLabel = viewDate.toLocaleDateString(undefined, { month: "long", year: "numeric" });
  const fastedCount = [...fastedDays].filter((d) => d.startsWith(monthKey)).length;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <button onClick={prevMonth} className="text-white/40 hover:text-white transition-colors"><ChevronLeft size={16} /></button>
        <div className="text-center">
          <span className="text-sm font-semibold text-white">{monthLabel}</span>
          <p className="text-[10px] text-white/30">{fastedCount} days fasted</p>
        </div>
        <button onClick={nextMonth} className="text-white/40 hover:text-white transition-colors"><ChevronRight size={16} /></button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center">
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
          <div key={i} className="text-[10px] text-white/20 py-1">{d}</div>
        ))}
        {Array.from({ length: firstDay }, (_, i) => <div key={`empty-${i}`} />)}
        {Array.from({ length: daysInMonth }, (_, i) => {
          const day = i + 1;
          const key = `${monthKey}-${String(day).padStart(2, "0")}`;
          const fasted = fastedDays.has(key);
          const isToday = key === toDateKey(new Date());
          return (
            <button
              key={day}
              onClick={() => toggle(day)}
              className={`aspect-square rounded-lg text-xs font-mono flex items-center justify-center transition-colors ${
                fasted ? "bg-emerald-500/30 text-emerald-300" : "bg-white/5 text-white/30 hover:bg-white/10"
              } ${isToday ? "ring-1 ring-emerald-500/50" : ""}`}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}
