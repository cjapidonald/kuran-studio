"use client";

import { useState, useEffect } from "react";
import { Send, Trash2 } from "lucide-react";
import { addComment, deleteComment } from "@/app/actions/reflections";
import { createClient } from "@/lib/supabase/client";

interface Comment {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  author: { full_name: string; avatar_url: string | null };
}

export function CommentSection({
  reflectionId,
  currentUserId,
}: {
  reflectionId: string;
  currentUserId: string | null;
}) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("reflection_comments")
      .select("*")
      .eq("reflection_id", reflectionId)
      .order("created_at", { ascending: true })
      .then(async ({ data }) => {
        if (!data || data.length === 0) { setLoading(false); return; }
        const userIds = [...new Set(data.map((c) => c.user_id))];
        const { data: profiles } = await supabase.rpc("get_profiles", { uids: userIds });
        const profileMap = new Map<string, { full_name: string; avatar_url: string | null }>();
        if (Array.isArray(profiles)) {
          for (const p of profiles) profileMap.set(p.id, p);
        }
        setComments(data.map((c) => ({
          ...c,
          author: profileMap.get(c.user_id) ?? { full_name: "Anonymous", avatar_url: null },
        })));
        setLoading(false);
      });
  }, [reflectionId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !currentUserId) return;
    const result = await addComment({ reflectionId, content: input.trim() });
    if ("id" in result) {
      setComments((prev) => [...prev, {
        id: result.id,
        user_id: currentUserId,
        content: input.trim(),
        created_at: new Date().toISOString(),
        author: { full_name: "You", avatar_url: null },
      }]);
      setInput("");
    }
  };

  const handleDelete = async (commentId: string) => {
    await deleteComment(commentId);
    setComments((prev) => prev.filter((c) => c.id !== commentId));
  };

  if (loading) return <p className="text-xs text-white/30 py-2">Loading comments...</p>;

  return (
    <div className="border-t border-white/5 pt-3 space-y-2">
      {comments.map((c) => (
        <div key={c.id} className="flex items-start gap-2 text-xs">
          <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[10px] text-white/50 shrink-0 mt-0.5">
            {c.author.full_name[0]?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <span className="font-semibold text-white/70">{c.author.full_name}</span>{" "}
            <span className="text-gray-400">{c.content}</span>
          </div>
          {c.user_id === currentUserId && (
            <button
              onClick={() => handleDelete(c.id)}
              className="text-white/20 hover:text-red-400 transition-colors shrink-0"
            >
              <Trash2 size={12} />
            </button>
          )}
        </div>
      ))}

      {currentUserId && (
        <form onSubmit={handleSubmit} className="flex items-center gap-2 pt-1">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Add a comment..."
            className="flex-1 bg-transparent text-xs text-white placeholder-white/20 outline-none"
          />
          <button
            type="submit"
            disabled={!input.trim()}
            className="text-emerald-400 disabled:text-white/20 transition-colors"
          >
            <Send size={12} />
          </button>
        </form>
      )}
    </div>
  );
}
