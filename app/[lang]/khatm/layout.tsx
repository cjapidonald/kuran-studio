import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Khatm — Kuran.studio",
  description: "Track your Quran reading progress, goals, and daily streaks.",
};

export default async function KhatmLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect(`/${lang}/login?redirect=/${lang}/khatm`);
  }
  return <>{children}</>;
}
