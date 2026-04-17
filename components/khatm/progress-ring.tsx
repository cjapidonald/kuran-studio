export function ProgressRing({
  percent,
  size = 120,
  label,
  sublabel,
}: {
  percent: number;
  size?: number;
  label: string;
  sublabel?: string;
}) {
  const r = (size - 12) / 2;
  const c = 2 * Math.PI * r;
  const p = Math.max(0, Math.min(100, percent));
  const offset = c * (1 - p / 100);
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="currentColor" className="text-white/10" strokeWidth="8" fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="currentColor"
          className="text-emerald-400 transition-[stroke-dashoffset] duration-500"
          strokeWidth="8"
          strokeDasharray={c}
          strokeDashoffset={offset}
          strokeLinecap="round"
          fill="none"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-xl font-bold text-white">{label}</div>
        {sublabel && <div className="text-[10px] text-white/60 font-mono mt-0.5">{sublabel}</div>}
      </div>
    </div>
  );
}
