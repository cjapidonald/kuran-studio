"use client";

import { useState, useEffect, createContext, useContext } from "react";
import Link from "next/link";
import { UserMenu } from "@/components/layout/user-menu";
import type { User } from "@supabase/supabase-js";

const ThemeContext = createContext<{ dark: boolean; toggle: () => void }>({ dark: true, toggle: () => {} });
export const useTheme = () => useContext(ThemeContext);

export function AppShell({ user, children }: { user: User; children: React.ReactNode }) {
  const [dark, setDark] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem("kurani-theme");
    if (saved === "light") setDark(false);
  }, []);

  useEffect(() => {
    localStorage.setItem("kurani-theme", dark ? "dark" : "light");
  }, [dark]);

  function toggle() { setDark(!dark); }

  return (
    <ThemeContext.Provider value={{ dark, toggle }}>
      <div className="flex-1 flex flex-col overflow-hidden h-screen">
        <div
          className={`shrink-0 flex items-center px-3 py-1.5 border-b transition-colors ${
            dark ? "bg-gray-950 border-white/5" : "bg-white border-gray-200"
          }`}
          style={{ zIndex: 100 }}
        >
          <Link href="/reader" className="text-sm font-bold mr-4 shrink-0 flex items-center gap-1.5">
            <span className="w-6 h-6 bg-emerald-500 rounded-md flex items-center justify-center text-[10px] text-gray-950 font-black">Q</span>
            <span className={dark ? "text-white" : "text-gray-900"}>Kurani</span>
            <span className="text-emerald-400">.</span>
          </Link>

          <div className="flex-1" />

          <div className="flex items-center gap-1">
            <button
              onClick={toggle}
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                dark ? "text-gray-400 hover:text-white hover:bg-white/10" : "text-gray-500 hover:text-gray-800 hover:bg-gray-100"
              }`}
              title={dark ? "Tema e drites" : "Tema e erret"}
            >
              {dark ? (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
              ) : (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
              )}
            </button>
            <UserMenu user={user} />
          </div>
        </div>

        <main
          data-app-main
          className={`flex-1 min-h-0 min-w-0 relative transition-colors p-3 overflow-y-auto ${
            dark ? "bg-gray-950 text-gray-200 dark" : "bg-gray-50 text-gray-900"
          }`}
        >
          <div
            className="absolute inset-0 pointer-events-none opacity-20"
            style={{
              backgroundImage: `radial-gradient(circle, ${dark ? "#10B981" : "#10B981"} 1px, transparent 1px)`,
              backgroundSize: "10px 10px",
              maskImage: "radial-gradient(600px circle at center, white, transparent)",
              WebkitMaskImage: "radial-gradient(600px circle at center, white, transparent)",
            }}
          />
          <div className="relative z-10">{children}</div>
        </main>
      </div>
    </ThemeContext.Provider>
  );
}
