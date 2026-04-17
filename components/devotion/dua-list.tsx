"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, X } from "lucide-react";
import { createDua, deleteDua, getDuas } from "@/app/actions/devotion";

interface Dua { id: string; title: string; content: string; sort_order: number; }

export function DuaList() {
  const [duas, setDuas] = useState<Dua[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getDuas().then((data) => { setDuas(data as Dua[]); setLoading(false); });
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim() || saving) return;
    setSaving(true);
    const result = await createDua({ title: title.trim(), content: content.trim() });
    setSaving(false);
    if ("id" in result) {
      setDuas((prev) => [...prev, { id: result.id, title: title.trim(), content: content.trim(), sort_order: prev.length }]);
      setTitle(""); setContent(""); setShowForm(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDuas((prev) => prev.filter((d) => d.id !== id));
    await deleteDua(id);
  };

  if (loading) return <div className="text-xs text-white/30 text-center py-8">Loading duas...</div>;

  return (
    <div className="space-y-3">
      {duas.map((dua) => (
        <div key={dua.id} className="rounded-xl bg-white/5 border border-white/10 p-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h4 className="text-sm font-semibold text-white">{dua.title}</h4>
              <p className="text-xs text-gray-400 mt-1 leading-relaxed">{dua.content}</p>
            </div>
            <button onClick={() => handleDelete(dua.id)} className="text-white/20 hover:text-red-400 transition-colors shrink-0">
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      ))}
      {duas.length === 0 && !showForm && <p className="text-xs text-white/30 text-center py-4">No duas added yet.</p>}
      {showForm ? (
        <form onSubmit={handleAdd} className="rounded-xl bg-white/5 border border-white/10 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-emerald-400 font-mono">New Dua</span>
            <button type="button" onClick={() => setShowForm(false)} className="text-white/40 hover:text-white"><X size={14} /></button>
          </div>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" className="w-full bg-transparent text-sm text-white placeholder-white/20 outline-none border-b border-white/10 pb-2" />
          <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Dua text or notes..." rows={3} className="w-full bg-transparent text-xs text-white/80 placeholder-white/20 outline-none resize-none" />
          <div className="flex justify-end">
            <button type="submit" disabled={saving || !title.trim() || !content.trim()} className="px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 text-xs font-medium hover:bg-emerald-500/30 disabled:opacity-40 transition-colors">Save</button>
          </div>
        </form>
      ) : (
        <button onClick={() => setShowForm(true)} className="w-full py-3 rounded-xl border border-dashed border-white/10 text-xs text-white/30 hover:text-emerald-400 hover:border-emerald-500/30 transition-colors flex items-center justify-center gap-1.5">
          <Plus size={14} /> Add Dua
        </button>
      )}
    </div>
  );
}
