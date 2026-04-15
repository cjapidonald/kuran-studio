"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const links = [
  { href: "/", label: "Kryefaqja" },
  { href: "/#features", label: "Vecori" },
  { href: "/#about", label: "Rreth Nesh" },
];

export function LandingNav() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto relative z-10">
      <div className="flex items-center gap-8">
        <Link href="/" className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
          <span className="w-7 h-7 bg-emerald-500 rounded-md flex items-center justify-center text-sm text-gray-950 font-black">Q</span>
          Kurani<span className="text-emerald-400">.</span>
          <span className="text-[10px] text-gray-600 font-normal ml-0.5 tracking-widest">STUDIO</span>
        </Link>
        <div className="hidden sm:flex gap-1">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                "px-3 py-1.5 rounded-md text-sm transition",
                pathname === l.href
                  ? "text-white bg-white/10"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              )}
            >
              {l.label}
            </Link>
          ))}
        </div>
      </div>
      <div className="flex gap-3">
        <Link href="/login" className="px-4 py-2 text-sm text-gray-400 hover:text-white transition">Hyr</Link>
        <Link href="/login" className="px-4 py-2 text-sm bg-emerald-500 hover:bg-emerald-400 text-black font-semibold rounded-md transition">
          Fillo Leximin
        </Link>
      </div>
    </nav>
  );
}
