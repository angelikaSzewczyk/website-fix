import fs from "fs";
import path from "path";
import { notFound } from "next/navigation";
import { cache } from "react";
import matter from "gray-matter";
import { remark } from "remark";
import html from "remark-html";
import RelatedPosts from "@/app/components/related-posts";
import BlogHeader from "@/app/components/blog-header";
import BlogClientWrapper from "@/app/components/blog-client-wrapper";

// --- DATEN-LOGIK (Server-seitig) ---
const getPostData = cache(async (slug: string) => {
  const filePath = path.join(process.cwd(), "content", "blog", `${slug}.md`);
  if (!fs.existsSync(filePath)) return null;
  const raw = fs.readFileSync(filePath, "utf8");
  const { data, content } = matter(raw);
  const processed = await remark().use(html).process(content);
  return { data, contentHtml: processed.toString() };
});

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const post = await getPostData(params.slug);
  if (!post) return { title: "Beitrag nicht gefunden" };

  const title = post.data.title;
  const description = post.data.description;
  const ogUrl = new URL('https://website-fix.com/api/og');
  ogUrl.searchParams.set('title', title || '');

  return {
    title: title, // Dank 'template' im Layout wird daraus "Titel | WebsiteFix"
    description: description,
    alternates: { canonical: `/blog/${params.slug}` },
    openGraph: {
      title: title,
      description: description,
      url: `https://website-fix.com/blog/${params.slug}`,
      images: [{ url: ogUrl.toString() }],
    },
    twitter: {
      title: title,
      description: description,
      images: [ogUrl.toString()],
    },
  };
}

// --- HILFSFUNKTIONEN ---
function slugifyHeading(text: string) {
  return text.toLowerCase().trim().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-");
}

function extractTocAndInjectIds(contentHtml: string) {
  const toc: { id: string, text: string }[] = [];
  const htmlWithIds = contentHtml.replace(/<h2>(.*?)<\/h2>/g, (_match, innerText) => {
    const plainText = innerText.replace(/<[^>]+>/g, "").trim();
    const id = slugifyHeading(plainText);
    toc.push({ id, text: plainText });
    return `<h2 id="${id}">${innerText}</h2>`;
  });
  return { htmlWithIds, toc };
}

export default async function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = await getPostData(params.slug);
  if (!post) notFound();

  const { htmlWithIds, toc } = extractTocAndInjectIds(post.contentHtml);

  return (
    <>
      <BlogHeader active="blog" lang="de" ctaLabel="Fix auswählen" />
      <main className="blogPostPage">
        <article>
          <h1 className="blogPostTitle">{post.data.title}</h1>
          {post.data.description && <p className="blogPostDesc">{post.data.description}</p>}

          {toc.length >= 2 && (
            <nav className="blogToc">
              <strong className="blogTocTitle">Inhalt</strong>
              <div className="blogTocList">
                {toc.map((item) => (
                  <a key={item.id} href={`#${item.id}`} className="blogTocLink">{item.text}</a>
                ))}
              </div>
            </nav>
          )}

          <div className="blogContent" dangerouslySetInnerHTML={{ __html: htmlWithIds }} />

          {/* Der Client-Wrapper steuert die Anzeige der Quiz-Box (Keine Dopplung mehr) */}
          <BlogClientWrapper postData={post.data} />

          <RelatedPosts slug={params.slug} lang="de" />
        </article>
      </main>
    </>
  );
}