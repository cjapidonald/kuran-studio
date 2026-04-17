export function DailyBars({
  data,
  goal,
  height = 80,
}: {
  data: { day: string; ayahs_read: number }[];
  goal: number;
  height?: number;
}) {
  const max = Math.max(goal, 1, ...data.map((d) => d.ayahs_read));
  const n = data.length;
  return (
    <div className="w-full">
      <svg
        viewBox={`0 0 ${n * 10} ${height}`}
        className="w-full"
        preserveAspectRatio="none"
        style={{ height }}
      >
        {/* Goal line */}
        {goal > 0 && goal <= max && (
          <line
            x1={0}
            x2={n * 10}
            y1={height - (goal / max) * height}
            y2={height - (goal / max) * height}
            stroke="rgba(251, 191, 36, 0.5)"
            strokeWidth="1"
            strokeDasharray="2 3"
          />
        )}
        {data.map((d, i) => {
          const h = Math.max(1, (d.ayahs_read / max) * height);
          const x = i * 10 + 1;
          const y = height - h;
          const hit = d.ayahs_read >= goal && goal > 0;
          return (
            <g key={d.day}>
              <rect
                x={x}
                y={y}
                width={8}
                height={h}
                rx={1.5}
                className={hit ? "fill-emerald-400" : "fill-white/25"}
              >
                <title>
                  {d.day}: {d.ayahs_read} ayah{d.ayahs_read === 1 ? "" : "s"}
                </title>
              </rect>
            </g>
          );
        })}
      </svg>
      <div className="mt-1 flex justify-between text-[10px] text-white/40 font-mono">
        <span>{data[0]?.day}</span>
        <span>{data[data.length - 1]?.day}</span>
      </div>
    </div>
  );
}
