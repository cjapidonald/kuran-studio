"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const params = useParams<{ lang: string }>();
  const router = useRouter();
  const lang = params.lang || "en";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [authed, setAuthed] = useState<null | boolean>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Verify we have a recovery session — the callback route exchanges the
  // recovery code and sets a session cookie before we land here.
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setAuthed(Boolean(data.user));
    });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords don\u2019t match.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
    // Sign the user out so they have to log in with the new password.
    await supabase.auth.signOut();
    router.replace(`/${lang}/login?reset=success`);
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <span className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center text-sm text-gray-950 font-black">Q</span>
            <span className="text-xl font-bold text-white">Kuran<span className="text-emerald-400">.</span></span>
          </div>
          <h1 className="text-xl font-bold text-white">Set a new password</h1>
          <p className="text-sm text-gray-400 mt-2">
            Choose a password you&apos;ll use to sign in from now on.
          </p>
        </div>

        {authed === null ? (
          <p className="text-center text-xs text-gray-500">Verifying reset link…</p>
        ) : !authed ? (
          <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-4 text-sm text-red-300">
            <p className="font-semibold mb-1">Link expired or invalid</p>
            <p className="text-red-300/80">
              Please request a new reset link.
            </p>
            <Link
              href={`/${lang}/forgot-password`}
              className="inline-block mt-3 text-xs text-emerald-400 hover:text-emerald-300"
            >
              Request a new link &rarr;
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label htmlFor="password" className="block text-[11px] text-gray-400 mb-1 font-mono">NEW PASSWORD</label>
              <input
                id="password"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 rounded-md bg-white/5 border border-white/10 text-white placeholder:text-gray-600 focus:outline-none focus:border-emerald-500 transition"
                placeholder="At least 8 characters"
              />
            </div>
            <div>
              <label htmlFor="confirm" className="block text-[11px] text-gray-400 mb-1 font-mono">CONFIRM</label>
              <input
                id="confirm"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="w-full px-3 py-2 rounded-md bg-white/5 border border-white/10 text-white placeholder:text-gray-600 focus:outline-none focus:border-emerald-500 transition"
                placeholder="Repeat password"
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
              {loading ? "\u2026" : "Update password"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
