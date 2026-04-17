import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Reflections — Kuran.studio",
  description: "Share your thoughts and reflections on Quran ayahs.",
};

export default async function ReflectionsLayout({
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
    redirect(`/${lang}/login?redirect=/${lang}/reflections`);
  }
  return <>{children}</>;
}
