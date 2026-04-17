import { SURAHS } from "./surahs";

// The Quran has 6,236 ayahs across 114 surahs, divided into 30 juz.
export const TOTAL_AYAHS = SURAHS.reduce((n, s) => n + s.ayahCount, 0);
export const TOTAL_SURAHS = SURAHS.length;
export const TOTAL_JUZ = 30;

export type GoalUnit = "ayahs" | "juz" | "surahs";

export interface Khatm {
  id: string;
  user_id: string;
  name: string;
  goal_unit: GoalUnit;
  goal_per_day: number;
  started_at: string;
  target_completion_at: string | null;
  completed_at: string | null;
  current_surah: number;
  current_ayah: number;
  archived: boolean;
  notes: string | null;
  updated_at: string;
}

export interface ReadingDay {
  khatm_id: string;
  user_id: string;
  day: string; // YYYY-MM-DD
  ayahs_read: number;
  surahs_touched: number;
  juz_touched: number;
}

/** Convert a daily goal to ayahs so we can compare against `ayahs_read`. */
export function goalInAyahs(unit: GoalUnit, perDay: number): number {
  switch (unit) {
    case "ayahs":
      return perDay;
    case "juz":
      return Math.round((TOTAL_AYAHS / TOTAL_JUZ) * perDay); // ≈208 ayahs per juz
    case "surahs":
      return Math.round((TOTAL_AYAHS / TOTAL_SURAHS) * perDay); // ≈55 ayahs per surah
  }
}

export function displayGoal(unit: GoalUnit, perDay: number): string {
  const plural = perDay === 1 ? "" : "s";
  const label =
    unit === "ayahs" ? `ayah${plural}` : unit === "juz" ? `juz` : `surah${plural}`;
  return `${perDay} ${label}/day`;
}

/** Cumulative ayahs read across all reading_days rows. */
export function totalAyahsRead(rows: ReadingDay[]): number {
  return rows.reduce((n, r) => n + (r.ayahs_read || 0), 0);
}

/** Percentage 0..100 of the Quran read in this khatm. */
export function progressPercent(rows: ReadingDay[]): number {
  return Math.min(100, (totalAyahsRead(rows) / TOTAL_AYAHS) * 100);
}

/** Streak of consecutive days ending today with ayahs_read > 0. */
export function streakDays(rows: ReadingDay[], today: Date = new Date()): number {
  const readDays = new Set(rows.filter((r) => r.ayahs_read > 0).map((r) => r.day));
  let streak = 0;
  const cursor = new Date(today);
  cursor.setHours(0, 0, 0, 0);
  for (;;) {
    const key = toDateKey(cursor);
    if (!readDays.has(key)) break;
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

/** The last N days (oldest → newest) filled in with 0s where missing. */
export function lastNDays(
  rows: ReadingDay[],
  n: number,
  today: Date = new Date(),
): { day: string; ayahs_read: number }[] {
  const byDay = new Map(rows.map((r) => [r.day, r.ayahs_read]));
  const out: { day: string; ayahs_read: number }[] = [];
  const cursor = new Date(today);
  cursor.setHours(0, 0, 0, 0);
  cursor.setDate(cursor.getDate() - (n - 1));
  for (let i = 0; i < n; i++) {
    const key = toDateKey(cursor);
    out.push({ day: key, ayahs_read: byDay.get(key) ?? 0 });
    cursor.setDate(cursor.getDate() + 1);
  }
  return out;
}

export function todayReads(rows: ReadingDay[], today: Date = new Date()): number {
  const key = toDateKey(today);
  return rows.find((r) => r.day === key)?.ayahs_read ?? 0;
}

export function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** True when (aSurah,aAyah) is strictly before (bSurah,bAyah) in reading order. */
export function positionBefore(
  aSurah: number,
  aAyah: number,
  bSurah: number,
  bAyah: number,
): boolean {
  if (aSurah !== bSurah) return aSurah < bSurah;
  return aAyah < bAyah;
}

/** Juz index (1..30) for a given (surah, ayah). Uses approximate ayah-count
 *  boundaries; good enough for "how many juz touched today" stats. */
export function juzFor(surah: number, ayah: number): number {
  // Prefix-count ayahs up to this position.
  let count = 0;
  for (const s of SURAHS) {
    if (s.number < surah) count += s.ayahCount;
    else if (s.number === surah) {
      count += Math.min(ayah, s.ayahCount);
      break;
    }
  }
  const perJuz = TOTAL_AYAHS / TOTAL_JUZ;
  return Math.min(TOTAL_JUZ, Math.max(1, Math.ceil(count / perJuz)));
}
