"use client";

import { useState } from "react";
import { PenLine, X, Loader2 } from "lucide-react";
import { createReflection } from "@/app/actions/reflections";

export function AyahReflectButton({ surah, ayah }: { surah: number; ayah: number }) {
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || loading) return;
    setLoading(true);
    setError(null);
    const result = await createReflection({ surah, ayah, content: content.trim() });
    setLoading(false);
    if ("error" in result) {
      setError(result.error);
    } else {
      setSuccess(true);
      setContent("");
      setTimeout(() => { setSuccess(false); setOpen(false); }, 1500);
    }
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-7 h-7 rounded-full flex items-center justify-center text-white/30 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors"
        aria-label="Write reflection"
      >
        <PenLine size={14} />
      </button>
    );
  }

  return (
    <div className="mt-3 rounded-xl bg-gray-900/80 border border-white/10 overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/5">
        <span className="text-xs text-emerald-400 font-mono">Reflect on {surah}:{ayah}</span>
        <button onClick={() => setOpen(false)} className="text-white/40 hover:text-white transition-colors">
          <X size={14} />
        </button>
      </div>
      <form onSubmit={handleSubmit} className="p-3 space-y-2">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Share your thoughts on this ayah..."
          rows={3}
          className="w-full bg-transparent text-sm text-white placeholder-white/20 outline-none resize-none"
          disabled={loading}
        />
        {error && <p className="text-xs text-red-400">{error}</p>}
        {success && <p className="text-xs text-emerald-400">Reflection posted!</p>}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading || !content.trim()}
            className="px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 text-xs font-medium hover:bg-emerald-500/30 disabled:opacity-40 transition-colors inline-flex items-center gap-1.5"
          >
            {loading && <Loader2 size={12} className="animate-spin" />}
            Post
          </button>
        </div>
      </form>
    </div>
  );
}
