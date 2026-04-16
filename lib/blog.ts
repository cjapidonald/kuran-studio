import { createClient } from "@supabase/supabase-js";

export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  date: string;
  author: string;
  tags: string[];
  locale: string;
  content: string;
}

export interface BlogPostMeta {
  slug: string;
  title: string;
  description: string;
  date: string;
  author: string;
  tags: string[];
}

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } }
  );
}

interface BlogRow {
  slug: string;
  lang: string;
  title: string;
  description: string | null;
  content: string;
  date: string;
  author: string;
  tags: string[];
}

export async function getBlogPosts(locale: string): Promise<BlogPostMeta[]> {
  try {
    const supabase = getSupabase();
    const { data } = await supabase
      .from("blog_posts")
      .select("slug, title, description, date, author, tags")
      .eq("lang", locale)
      .eq("published", true)
      .order("date", { ascending: false });

    if (!data) return [];
    return data.map((r: Omit<BlogRow, "lang" | "content">) => ({
      slug: r.slug,
      title: r.title,
      description: r.description || "",
      date: r.date,
      author: r.author,
      tags: r.tags || [],
    }));
  } catch {
    return [];
  }
}

export async function getBlogPost(locale: string, slug: string): Promise<BlogPost | null> {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("blog_posts")
      .select("slug, title, description, content, date, author, tags")
      .eq("lang", locale)
      .eq("slug", slug)
      .eq("published", true)
      .single();

    if (error || !data) return null;
    return {
      slug: data.slug,
      title: data.title,
      description: data.description || "",
      date: data.date,
      author: data.author,
      tags: data.tags || [],
      locale,
      content: data.content,
    };
  } catch {
    return null;
  }
}

export async function getAllBlogPostPaths(): Promise<{ lang: string; slug: string }[]> {
  try {
    const supabase = getSupabase();
    const { data } = await supabase
      .from("blog_posts")
      .select("lang, slug")
      .eq("published", true);
    return data || [];
  } catch {
    return [];
  }
}
