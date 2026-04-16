"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { checkEmailStatus } from "@/app/actions/auth";

type Mode = "signin" | "signup";

export default function LoginPage() {
  const params = useParams<{ lang: string }>();
  const searchParams = useSearchParams();
  const lang = params.lang || "en";

  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<null | { kind: "error" | "info" | "success"; text: string }>(
    searchParams.get("reset") === "success"
      ? { kind: "success", text: "Password updated. You can now sign in with your new password." }
      : null,
  );
  const [loading, setLoading] = useState(false);

  async function handleGoogleLogin() {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?lang=${lang}`,
      },
    });
  }

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setStatus(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (!error) {
      window.location.href = `/${lang}/1`;
      return;
    }
    // Figure out WHY it failed so we can show the right guidance.
    try {
      const check = await checkEmailStatus(email);
      if (check.kind === "google_only") {
        setStatus({
          kind: "info",
          text:
            "This account was created with Google. Click \u201CForgot password\u201D below to set a password, or use Continue with Google.",
        });
      } else {
        setStatus({ kind: "error", text: "Invalid email or password." });
      }
    } catch {
      setStatus({ kind: "error", text: "Invalid email or password." });
    }
    setLoading(false);
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setStatus(null);
    if (password.length < 8) {
      setStatus({ kind: "error", text: "Password must be at least 8 characters." });
      setLoading(false);
      return;
    }
    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?lang=${lang}`,
      },
    });
    if (error) {
      setStatus({ kind: "error", text: error.message });
    } else {
      setStatus({
        kind: "success",
        text: "Check your email to confirm your account, then come back to sign in.",
      });
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <span className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center text-sm text-gray-950 font-black">Q</span>
            <span className="text-xl font-bold text-white">Kuran<span className="text-emerald-400">.</span></span>
          </div>
          <h1 className="text-xl font-bold text-white">
            {mode === "signin" ? "Sign in to Kuran.studio" : "Create your account"}
          </h1>
          <p className="text-sm text-gray-400 mt-2">
            {mode === "signin"
              ? "Read and study the Noble Quran in your language."
              : "Save your progress and bookmarks across devices."}
          </p>
        </div>

        {/* Mode toggle */}
        <div className="flex gap-1 p-1 rounded-lg bg-white/5 border border-white/10 mb-6">
          <button
            onClick={() => { setMode("signin"); setStatus(null); }}
            className={`flex-1 text-xs px-3 py-2 rounded-md transition ${
              mode === "signin" ? "bg-white/10 text-white" : "text-gray-400 hover:text-white"
            }`}
          >
            Sign in
          </button>
          <button
            onClick={() => { setMode("signup"); setStatus(null); }}
            className={`flex-1 text-xs px-3 py-2 rounded-md transition ${
              mode === "signup" ? "bg-white/10 text-white" : "text-gray-400 hover:text-white"
            }`}
          >
            Sign up
          </button>
        </div>

        {/* Email/password form */}
        <form onSubmit={mode === "signin" ? handleSignIn : handleSignUp} className="space-y-3">
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
          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="password" className="block text-[11px] text-gray-400 font-mono">PASSWORD</label>
              {mode === "signin" && (
                <Link href={`/${lang}/forgot-password`} className="text-[11px] text-emerald-400 hover:text-emerald-300 transition">
                  Forgot password?
                </Link>
              )}
            </div>
            <input
              id="password"
              type="password"
              required
              minLength={mode === "signup" ? 8 : undefined}
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 rounded-md bg-white/5 border border-white/10 text-white placeholder:text-gray-600 focus:outline-none focus:border-emerald-500 transition"
              placeholder={mode === "signup" ? "At least 8 characters" : "Your password"}
            />
          </div>

          {status && (
            <div
              role={status.kind === "error" ? "alert" : "status"}
              className={`text-xs rounded-md px-3 py-2 ${
                status.kind === "error"
                  ? "bg-red-500/10 border border-red-500/30 text-red-300"
                  : status.kind === "success"
                  ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-300"
                  : "bg-amber-500/10 border border-amber-500/30 text-amber-200"
              }`}
            >
              {status.text}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-3 rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-black font-semibold transition shadow-md shadow-emerald-500/20"
          >
            {loading ? "\u2026" : mode === "signin" ? "Sign in" : "Create account"}
          </button>
        </form>

        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-white/10" />
          <span className="text-[10px] text-gray-600 font-mono">OR</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>

        <button
          onClick={handleGoogleLogin}
          className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white hover:bg-gray-100 text-gray-900 font-medium rounded-lg transition"
        >
          <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59a14.5 14.5 0 0 1 0-9.18l-7.98-6.19a24.01 24.01 0 0 0 0 21.56l7.98-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
          Continue with Google
        </button>

        <p className="text-center text-[10px] text-gray-600 mt-6">
          <Link href={`/${lang}`} className="hover:text-gray-400 transition">&larr; Back to home</Link>
        </p>
      </div>
    </div>
  );
}
