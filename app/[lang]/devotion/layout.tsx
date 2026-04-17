import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Devotion — Kuran.studio",
  description: "Track your daily prayers, dhikr, fasting, and personal duas.",
};

export default async function DevotionLayout({
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
    redirect(`/${lang}/login?redirect=/${lang}/devotion`);
  }
  return <>{children}</>;
}
