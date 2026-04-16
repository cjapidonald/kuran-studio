"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const params = useParams<{ lang: string }>();
  const lang = params.lang || "en";

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();
    // On click in the email, Supabase redirects to /auth/callback which
    // exchanges the token for a session, then forwards to /[lang]/auth/reset.
    const redirectTo = `${window.location.origin}/auth/callback?lang=${lang}&redirect=/${lang}/auth/reset`;
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    // Always show "sent" even if the email doesn't exist — don't leak enumeration.
    setSent(true);
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <span className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center text-sm text-gray-950 font-black">Q</span>
            <span className="text-xl font-bold text-white">Kuran<span className="text-emerald-400">.</span></span>
          </div>
          <h1 className="text-xl font-bold text-white">Reset your password</h1>
          <p className="text-sm text-gray-400 mt-2">
            Enter the email on your account. We&apos;ll send you a link to set a new password.
          </p>
        </div>

        {sent ? (
          <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-4 text-sm text-emerald-200">
            <p className="font-semibold mb-1">Check your inbox</p>
            <p className="text-emerald-200/80">
              If an account exists for <span className="font-mono">{email}</span>, we just sent a reset
              link. It may take a minute to arrive &mdash; check spam too.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label htmlFor="email" className="block text-[11px] text-gray-400 mb-1 font-mono">EMAIL</label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 rounded-md bg-white/5 border border-white/10 text-white placeholder:text-gray-600 focus:outline-none focus:border-emerald-500 transition"
                placeholder="you@example.com"
              />
            </div>
            {error && (
              <div role="alert" className="text-xs rounded-md px-3 py-2 bg-red-500/10 border border-red-500/30 text-red-300">
                {error}
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-3 rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black font-semibold transition shadow-md shadow-emerald-500/20"
            >
              {loading ? "\u2026" : "Send reset link"}
            </button>
          </form>
        )}

        <p className="text-center text-[10px] text-gray-600 mt-6">
          <Link href={`/${lang}/login`} className="hover:text-gray-400 transition">&larr; Back to sign in</Link>
        </p>
      </div>
    </div>
  );
}
