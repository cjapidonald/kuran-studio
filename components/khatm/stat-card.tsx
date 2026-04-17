export function StatCard({
  label,
  value,
  hint,
  accent = "emerald",
}: {
  label: string;
  value: string;
  hint?: string;
  accent?: "emerald" | "amber" | "blue" | "purple";
}) {
  const accentClass =
    accent === "amber"
      ? "text-amber-400"
      : accent === "blue"
      ? "text-blue-400"
      : accent === "purple"
      ? "text-purple-400"
      : "text-emerald-400";
  return (
    <div className="rounded-xl bg-white/5 border border-white/10 p-4">
      <p className="text-[10px] font-mono text-white/50 tracking-widest">{label}</p>
      <p className={`mt-2 text-2xl font-bold ${accentClass}`}>{value}</p>
      {hint && <p className="mt-1 text-[11px] text-white/50">{hint}</p>}
    </div>
  );
}
