import fs from "fs";
import path from "path";
import { notFound } from "next/navigation";
import { cache } from "react";
import matter from "gray-matter";
import { remark } from "remark";
import html from "remark-html";
import RelatedPosts from "@/app/components/related-posts";
import BlogHeader from "@/app/components/blog-header";

// --- TYPEN ---
type BlogFrontmatter = {
  title?: string;
  description?: string;
  tags?: string[];
  date?: string;
};

type TocItem = {
  id: string;
  text: string;
};

// --- DATEN-LOGIK (Optimiert mit Cache) ---
const getPostData = cache(async (slug: string) => {
  const filePath = path.join(process.cwd(), "content", "blog", `${slug}.md`);
  
  if (!fs.existsSync(filePath)) return null;

  const raw = fs.readFileSync(filePath, "utf8");
  const { data, content } = matter(raw);

  const processed = await remark().use(html).process(content);
  const contentHtml = processed.toString();

  return {
    data: data as BlogFrontmatter,
    contentHtml,
  };
});

// --- SEO METADATEN ---
export async function generateMetadata({ params }: { params: { slug: string } }) {
  const post = await getPostData(params.slug);
  if (!post) return { title: "Beitrag nicht gefunden" };

  const ogUrl = new URL('https://website-fix.com/api/og');
  ogUrl.searchParams.set('title', post.data.title || '');

  return {
    title: post.data.title,
    description: post.data.description,
    alternates: {
      canonical: `/blog/${params.slug}`,
    },
    openGraph: {
      title: post.data.title,
      description: post.data.description,
      type: "article",
      images: [
        {
          url: ogUrl.toString(),
          width: 1200,
          height: 630,
          alt: post.data.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: post.data.title,
      description: post.data.description,
      images: [ogUrl.toString()],
    },
  };
}

// --- HILFSFUNKTIONEN ---
function slugifyHeading(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-");
}

function extractTocAndInjectIds(contentHtml: string): {
  htmlWithIds: string;
  toc: TocItem[];
} {
  const toc: TocItem[] = [];
  const htmlWithIds = contentHtml.replace(
    /<h2>(.*?)<\/h2>/g,
    (_match, innerText: string) => {
      const plainText = innerText.replace(/<[^>]+>/g, "").trim();
      const id = slugifyHeading(plainText);
      toc.push({ id, text: plainText });
      return `<h2 id="${id}">${innerText}</h2>`;
    }
  );
  return { htmlWithIds, toc };
}

function getCtaVariant(data: BlogFrontmatter) {
  const title = (data.title || "").toLowerCase();
  const tags = (data.tags || []).map((t) => t.toLowerCase()).join(" ");
  const text = `${title} ${tags}`;

  const defaultFixCta = {
    primaryHref: "/#fixes",
    primaryLabel: "Fix auswählen →",
    secondaryHref: "/#book",
    secondaryLabel: "Problem anfragen",
  };

  if (text.includes("kontaktformular") || text.includes("formular")) {
    return { ...defaultFixCta, headline: "Kontaktformular defekt?", copy: "Wir fixen PHP-Mailer, SMTP oder JavaScript-Fehler in Kürze." };
  }
  if (text.includes("langsam") || text.includes("ladezeit") || text.includes("pagespeed")) {
    return { ...defaultFixCta, headline: "Ladezeit optimieren", copy: "Wir machen deine Website wieder schnell – messbar in Google Pagespeed." };
  }
  
  return {
    headline: "Technischer Check nötig?",
    copy: "Nicht jedes Problem lässt sich selbst lösen. Unsere Experten prüfen deinen Fall individuell.",
    primaryHref: "/#book",
    primaryLabel: "Anfrage senden →",
    secondaryHref: "/#fixes",
    secondaryLabel: "Fix-Pakete",
  };
}

// --- HAUPT-KOMPONENTE ---
export default async function BlogPostPage({
  params,
}: {
  params: { slug: string };
}) {
  const post = await getPostData(params.slug);
  if (!post) notFound();

  const { htmlWithIds, toc } = extractTocAndInjectIds(post.contentHtml);
  const cta = getCtaVariant(post.data);

  // --- SCHEMA MARKUP (JSON-LD) ---
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    "name": post.data.title,
    "description": post.data.description,
    "image": `https://website-fix.com/api/og?title=${encodeURIComponent(post.data.title || '')}`,
    "step": toc.map((item, index) => ({
      "@type": "HowToStep",
      "position": index + 1,
      "name": item.text,
      "url": `https://website-fix.com/blog/${params.slug}#${item.id}`
    })),
    "publisher": {
      "@type": "Organization",
      "name": "WebsiteFix",
      "logo": { "@type": "ImageObject", "url": "https://website-fix.com/favicon.svg" }
    }
  };

  return (
    <>
      {/* Schema Markup für Google */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <BlogHeader active="blog" lang="de" ctaLabel="Fix auswählen" />
      
      <main className="blogPostPage">
        <article>
          <h1 className="blogPostTitle">{String(post.data.title || "")}</h1>

          {post.data.description && (
            <p className="blogPostDesc">{String(post.data.description)}</p>
          )}

          {toc.length >= 2 && (
            <nav className="blogToc" aria-label="Inhaltsverzeichnis">
              <strong className="blogTocTitle">Inhalt</strong>
              <div className="blogTocList">
                {toc.map((item) => (
                  <a key={item.id} href={`#${item.id}`} className="blogTocLink">
                    {item.text}
                  </a>
                ))}
              </div>
            </nav>
          )}

          <div
            className="blogContent"
            dangerouslySetInnerHTML={{ __html: htmlWithIds }}
          />

          <div className="blogPostCta">
            <strong className="blogPostCtaTitle">{cta.headline}</strong>
            <p className="blogPostCtaText">{cta.copy}</p>
            <div className="blogPostCtaActions">
              <a href={cta.primaryHref} className="cta">
                {cta.primaryLabel}
              </a>
              <a href={cta.secondaryHref} className="ghostBtn">
                {cta.secondaryLabel}
              </a>
            </div>
          </div>

          <RelatedPosts slug={params.slug} lang="de" />
        </article>
      </main>
    </>
  );
}