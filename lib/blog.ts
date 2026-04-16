import fs from "fs";
import path from "path";
import matter from "gray-matter";

const contentDir = path.join(process.cwd(), "content/blog");

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

export function getBlogPosts(locale: string): BlogPostMeta[] {
  const dir = path.join(contentDir, locale);
  if (!fs.existsSync(dir)) return [];

  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".mdx"));

  return files
    .map((file) => {
      const raw = fs.readFileSync(path.join(dir, file), "utf-8");
      const { data } = matter(raw);
      return {
        slug: file.replace(".mdx", ""),
        title: data.title || "",
        description: data.description || "",
        date: data.date || "",
        author: data.author || "Donald Cjapi",
        tags: data.tags || [],
      };
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function getBlogPost(locale: string, slug: string): BlogPost | null {
  const filePath = path.join(contentDir, locale, `${slug}.mdx`);
  if (!fs.existsSync(filePath)) return null;

  const raw = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(raw);

  return {
    slug,
    title: data.title || "",
    description: data.description || "",
    date: data.date || "",
    author: data.author || "Donald Cjapi",
    tags: data.tags || [],
    locale,
    content,
  };
}
