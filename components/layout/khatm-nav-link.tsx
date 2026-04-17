"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

/**
 * Renders a "Khatm" link only when the current visitor has a Supabase session.
 * Client-side detection keeps the parent page SSG-cacheable — the link flashes
 * in after hydration for logged-in users, which is acceptable UX here.
 */
export function KhatmNavLink({
  lang,
  label,
  className,
  asCta = false,
  ctaClassName,
}: {
  lang: string;
  label: string;
  className?: string;
  asCta?: boolean;
  ctaClassName?: string;
}) {
  const [authed, setAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setAuthed(Boolean(data.user)));
    const { data: sub } = supabase.auth.onAuthStateChange((_evt, session) => {
      setAuthed(Boolean(session?.user));
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  if (!authed) return null;
  return (
    <Link href={`/${lang}/khatm`} className={asCta ? ctaClassName : className}>
      {label}
    </Link>
  );
}
