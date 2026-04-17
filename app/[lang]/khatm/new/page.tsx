"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { createKhatm } from "@/app/actions/khatm";
import type { GoalUnit } from "@/lib/quran/khatm";

export default function NewKhatmPage() {
  const router = useRouter();
  const { lang } = useParams<{ lang: string }>();
  const locale = lang || "en";

  const [name, setName] = useState("");
  const [goalUnit, setGoalUnit] = useState<GoalUnit>("ayahs");
  const [goalPerDay, setGoalPerDay] = useState(20);
  const [targetDate, setTargetDate] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await createKhatm({
      name,
      goal_unit: goalUnit,
      goal_per_day: goalPerDay,
      target_completion_at: targetDate || null,
      notes,
    });
    if ("error" in res) {
      setError(res.error);
      setLoading(false);
      return;
    }
    router.push(`/${locale}/khatm/${res.id}`);
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-200 flex items-center justify-center p-6">
      <div className="w-full max-w-lg">
        <div className="mb-6">
          <Link href={`/${locale}/khatm`} className="text-xs text-emerald-500 hover:text-emerald-400 font-mono">
            &larr; Khatm
          </Link>
          <h1 className="mt-3 text-2xl font-bold text-white">Start a new Khatm</h1>
          <p className="mt-1 text-sm text-gray-400">
            Give it a name and a daily goal. You can always adjust later.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-white/10 bg-white/5 p-6">
          <div>
            <label className="block text-[11px] text-gray-400 mb-1 font-mono">NAME</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Ramadan 2026"
              className="w-full px-3 py-2 rounded-md bg-white/5 border border-white/10 text-white placeholder:text-gray-600 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] text-gray-400 mb-1 font-mono">GOAL UNIT</label>
              <select
                value={goalUnit}
                onChange={(e) => setGoalUnit(e.target.value as GoalUnit)}
                className="w-full px-3 py-2 rounded-md bg-white/5 border border-white/10 text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="ayahs" className="bg-gray-900">Ayahs</option>
                <option value="juz" className="bg-gray-900">Juz</option>
                <option value="surahs" className="bg-gray-900">Surahs</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] text-gray-400 mb-1 font-mono">PER DAY</label>
              <input
                type="number"
                min={1}
                max={goalUnit === "juz" ? 30 : goalUnit === "surahs" ? 114 : 6236}
                required
                value={goalPerDay}
                onChange={(e) => setGoalPerDay(parseInt(e.target.value || "0", 10))}
                className="w-full px-3 py-2 rounded-md bg-white/5 border border-white/10 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] text-gray-400 mb-1 font-mono">TARGET COMPLETION (optional)</label>
            <input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="w-full px-3 py-2 rounded-md bg-white/5 border border-white/10 text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-[11px] text-gray-400 mb-1 font-mono">NOTES (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 rounded-md bg-white/5 border border-white/10 text-white placeholder:text-gray-600 focus:outline-none focus:border-emerald-500"
              placeholder="Intentions, reminders, etc."
            />
          </div>

          {error && (
            <div role="alert" className="text-xs rounded-md px-3 py-2 bg-red-500/10 border border-red-500/30 text-red-300">
              {error}
            </div>
          )}

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-3 rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black font-semibold transition"
            >
              {loading ? "…" : "Create Khatm"}
            </button>
            <Link
              href={`/${locale}/khatm`}
              className="px-4 py-3 rounded-lg border border-white/10 text-gray-300 hover:bg-white/5 transition"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
