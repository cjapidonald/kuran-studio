"use client";

import { useState, useRef, useEffect } from "react";
import { Sparkles, Send, X, Loader2 } from "lucide-react";
import { askAboutAyah, type AiMessage } from "@/app/actions/ai";

interface AyahAiChatProps {
  surah: number;
  ayah: number;
  arabicText: string;
  translation: string;
  onClose: () => void;
}

export function AyahAiChat({ surah, ayah, arabicText, translation, onClose }: AyahAiChatProps) {
  const [messages, setMessages] = useState<AiMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const question = input.trim();
    if (!question || loading) return;

    setInput("");
    setError(null);
    const userMsg: AiMessage = { role: "user", content: question };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    const result = await askAboutAyah({
      surah,
      ayah,
      arabicText,
      translation,
      question,
      history: messages,
    });

    setLoading(false);
    if ("error" in result) {
      setError(result.error);
    } else {
      setMessages((prev) => [...prev, { role: "assistant", content: result.answer }]);
    }
  };

  return (
    <div className="mt-3 rounded-xl bg-gray-900/80 border border-white/10 overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/5">
        <div className="flex items-center gap-2 text-xs text-emerald-400">
          <Sparkles size={14} />
          <span className="font-mono">Ask about {surah}:{ayah}</span>
        </div>
        <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
          <X size={14} />
        </button>
      </div>

      <div ref={scrollRef} className="max-h-[240px] overflow-y-auto px-3 py-2 space-y-3">
        {messages.length === 0 && !loading && (
          <p className="text-xs text-white/30 text-center py-4">
            Ask anything about this ayah...
          </p>
        )}
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`text-sm leading-relaxed ${
              msg.role === "user"
                ? "text-white/90 bg-white/5 rounded-lg px-3 py-2"
                : "text-gray-300 pl-1"
            }`}
          >
            {msg.content}
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-2 text-xs text-white/40">
            <Loader2 size={12} className="animate-spin" />
            Thinking...
          </div>
        )}
        {error && (
          <p className="text-xs text-red-400">{error}</p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex items-center gap-2 px-3 py-2 border-t border-white/5">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question..."
          className="flex-1 bg-transparent text-sm text-white placeholder-white/30 outline-none"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="text-emerald-400 hover:text-emerald-300 disabled:text-white/20 transition-colors"
        >
          <Send size={14} />
        </button>
      </form>
    </div>
  );
}
