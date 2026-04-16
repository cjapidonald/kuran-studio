import Link from "next/link";
import { getBlogPosts } from "@/lib/blog";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import type { Metadata } from "next";

interface PageProps {
  params: Promise<{ lang: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { lang } = await params;
  const dict = await getDictionary(lang);
  return {
    title: dict["nav.blog"],
    description: `${dict["nav.blog"]} — ${dict["site.name"]}`,
  };
}

export default async function BlogPage({ params }: PageProps) {
  const { lang } = await params;
  const dict = await getDictionary(lang);
  const posts = getBlogPosts(lang);

  return (
    <div className="min-h-screen bg-gray-950 text-gray-200">
      <nav className="sticky top-0 z-50 bg-gray-950/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-3xl mx-auto flex items-center justify-between px-4 py-3">
          <Link href={`/${lang}`} className="flex items-center gap-2">
            <span className="w-6 h-6 bg-emerald-500 rounded-md flex items-center justify-center text-[10px] text-gray-950 font-black">Q</span>
            <span className="font-bold text-sm text-white">Kuran<span className="text-emerald-400">.</span></span>
          </Link>
          <span className="text-xs text-gray-500 font-mono">{dict["nav.blog"]}</span>
          <div className="w-12" />
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-2">{dict["nav.blog"]}</h1>
        <p className="text-gray-500 text-sm mb-10">{dict["site.description"]}</p>

        {posts.length === 0 ? (
          <p className="text-gray-500 text-sm">No posts yet.</p>
        ) : (
          <div className="space-y-6">
            {posts.map((post) => (
              <Link key={post.slug} href={`/${lang}/blog/${post.slug}`} className="block group">
                <article className="border border-gray-800/50 rounded-xl p-5 hover:border-emerald-500/30 transition-colors">
                  <time className="text-[10px] text-gray-600 font-mono">{post.date}</time>
                  <h2 className="text-lg font-semibold mt-1 group-hover:text-emerald-400 transition-colors">{post.title}</h2>
                  <p className="text-sm text-gray-500 mt-1 leading-relaxed">{post.description}</p>
                  {post.tags.length > 0 && (
                    <div className="flex gap-2 mt-3">
                      {post.tags.map((tag) => (
                        <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-gray-800 text-gray-400">{tag}</span>
                      ))}
                    </div>
                  )}
                </article>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
