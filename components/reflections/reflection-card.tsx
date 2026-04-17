"use client";

import { useState } from "react";
import Link from "next/link";
import { Heart, MessageCircle, Share2 } from "lucide-react";
import { likeReflection, unlikeReflection } from "@/app/actions/reflections";
import { CommentSection } from "./comment-section";
import type { ReflectionRow } from "@/lib/reflections/queries";
import { SURAHS } from "@/lib/quran/surahs";

export function ReflectionCard({
  reflection,
  lang,
  currentUserId,
}: {
  reflection: ReflectionRow;
  lang: string;
  currentUserId: string | null;
}) {
  const [liked, setLiked] = useState(reflection.user_has_liked);
  const [likeCount, setLikeCount] = useState(reflection.like_count);
  const [showComments, setShowComments] = useState(false);
  const [copied, setCopied] = useState(false);

  const surahMeta = SURAHS.find((s) => s.number === reflection.surah);

  const toggleLike = async () => {
    if (!currentUserId) return;
    if (liked) {
      setLiked(false);
      setLikeCount((c) => c - 1);
      await unlikeReflection(reflection.id);
    } else {
      setLiked(true);
      setLikeCount((c) => c + 1);
      await likeReflection(reflection.id);
    }
  };

  const share = async () => {
    const url = `${window.location.origin}/${lang}/reflections/${reflection.id}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-xl bg-white/5 border border-white/10 p-4 space-y-3">
      <div className="flex items-center gap-3">
        {reflection.author.avatar_url ? (
          <img src={reflection.author.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover" />
        ) : (
          <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 text-xs font-bold">
            {reflection.author.full_name[0]?.toUpperCase()}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <Link
            href={`/${lang}/profile/${reflection.user_id}`}
            className="text-sm font-semibold text-white hover:text-emerald-400 transition-colors"
          >
            {reflection.author.full_name}
          </Link>
          <div className="flex items-center gap-2 text-[11px] text-white/40">
            <Link
              href={`/${lang}/${reflection.surah}`}
              className="hover:text-emerald-400 transition-colors"
            >
              {surahMeta?.transliteration ?? `Surah ${reflection.surah}`} : {reflection.ayah}
            </Link>
            <span>&middot;</span>
            <span>{new Date(reflection.created_at).toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      <p className="text-sm text-gray-300 leading-relaxed">{reflection.content}</p>

      <div className="flex items-center gap-4 pt-1">
        <button
          onClick={toggleLike}
          disabled={!currentUserId}
          className={`flex items-center gap-1.5 text-xs transition-colors ${
            liked ? "text-red-400" : "text-white/40 hover:text-red-400"
          } disabled:opacity-40`}
        >
          <Heart size={14} fill={liked ? "currentColor" : "none"} />
          {likeCount > 0 && <span>{likeCount}</span>}
        </button>
        <button
          onClick={() => setShowComments((v) => !v)}
          className="flex items-center gap-1.5 text-xs text-white/40 hover:text-emerald-400 transition-colors"
        >
          <MessageCircle size={14} />
          {reflection.comment_count > 0 && <span>{reflection.comment_count}</span>}
        </button>
        <button
          onClick={share}
          className="flex items-center gap-1.5 text-xs text-white/40 hover:text-emerald-400 transition-colors"
        >
          <Share2 size={14} />
          {copied && <span className="text-emerald-400">Copied!</span>}
        </button>
      </div>

      {showComments && (
        <CommentSection reflectionId={reflection.id} currentUserId={currentUserId} />
      )}
    </div>
  );
}
