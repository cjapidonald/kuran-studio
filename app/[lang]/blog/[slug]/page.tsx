import { notFound } from "next/navigation";
import Link from "next/link";
import { getBlogPost, getAllBlogPostPaths } from "@/lib/blog";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { MDXRemote } from "next-mdx-remote/rsc";
import type { Metadata } from "next";

interface PageProps {
  params: Promise<{ lang: string; slug: string }>;
}

export async function generateStaticParams() {
  return getAllBlogPostPaths();
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { lang, slug } = await params;
  const post = await getBlogPost(lang, slug);
  if (!post) return { title: "Not found" };

  return {
    title: post.title,
    description: post.description,
    openGraph: {
      title: post.title,
      description: post.description,
      type: "article",
      publishedTime: post.date,
      locale: lang,
    },
  };
}

const mdxComponents = {
  h1: (props: React.HTMLAttributes<HTMLHeadingElement>) => <h1 className="text-2xl font-bold mt-8 mb-4" {...props} />,
  h2: (props: React.HTMLAttributes<HTMLHeadingElement>) => <h2 className="text-xl font-bold mt-6 mb-3" {...props} />,
  h3: (props: React.HTMLAttributes<HTMLHeadingElement>) => <h3 className="text-lg font-semibold mt-4 mb-2" {...props} />,
  p: (props: React.HTMLAttributes<HTMLParagraphElement>) => <p className="text-gray-300 leading-relaxed mb-4" {...props} />,
  ul: (props: React.HTMLAttributes<HTMLUListElement>) => <ul className="list-disc list-inside text-gray-300 mb-4 space-y-1" {...props} />,
  ol: (props: React.HTMLAttributes<HTMLOListElement>) => <ol className="list-decimal list-inside text-gray-300 mb-4 space-y-1" {...props} />,
  blockquote: (props: React.HTMLAttributes<HTMLQuoteElement>) => (
    <blockquote className="border-l-2 border-emerald-500 pl-4 my-4 text-gray-400 italic" {...props} />
  ),
  a: (props: React.AnchorHTMLAttributes<HTMLAnchorElement>) => <a className="text-emerald-400 hover:text-emerald-300 underline" {...props} />,
  code: (props: React.HTMLAttributes<HTMLElement>) => <code className="bg-gray-800 px-1.5 py-0.5 rounded text-sm text-emerald-300" {...props} />,
};

export default async function BlogPostPage({ params }: PageProps) {
  const { lang, slug } = await params;
  const post = await getBlogPost(lang, slug);
  if (!post) notFound();

  const dict = await getDictionary(lang);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    author: { "@type": "Person", name: post.author },
    inLanguage: lang,
    url: `https://kuran.studio/${lang}/blog/${slug}`,
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-200">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <nav className="sticky top-0 z-50 bg-gray-950/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-3xl mx-auto flex items-center justify-between px-4 py-3">
          <Link href={`/${lang}/blog`} className="text-xs text-emerald-500 hover:text-emerald-400 font-mono transition-colors">
            &larr; {dict["nav.blog"]}
          </Link>
          <Link href={`/${lang}`} className="flex items-center gap-1.5">
            <span className="w-5 h-5 bg-emerald-500 rounded flex items-center justify-center text-[8px] text-gray-950 font-black">Q</span>
            <span className="font-bold text-xs text-white">Kuran<span className="text-emerald-400">.</span></span>
          </Link>
          <div className="w-12" />
        </div>
      </nav>

      <article className="max-w-3xl mx-auto px-4 py-12">
        <header className="mb-8">
          <time className="text-[10px] text-gray-600 font-mono">{post.date}</time>
          <h1 className="text-3xl font-bold mt-2">{post.title}</h1>
          <p className="text-gray-500 mt-2">{post.description}</p>
          {post.tags.length > 0 && (
            <div className="flex gap-2 mt-4">
              {post.tags.map((tag) => (
                <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-gray-800 text-gray-400">{tag}</span>
              ))}
            </div>
          )}
        </header>

        <div className="prose-invert">
          <MDXRemote source={post.content} components={mdxComponents} />
        </div>
      </article>
    </div>
  );
}
