import type { ReflectionRow } from "@/lib/reflections/queries";
import { ReflectionCard } from "./reflection-card";

export function ReflectionFeed({
  reflections,
  lang,
  currentUserId,
  emptyMessage = "No reflections yet.",
}: {
  reflections: ReflectionRow[];
  lang: string;
  currentUserId: string | null;
  emptyMessage?: string;
}) {
  if (reflections.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-sm text-white/30">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {reflections.map((r) => (
        <ReflectionCard key={r.id} reflection={r} lang={lang} currentUserId={currentUserId} />
      ))}
    </div>
  );
}
