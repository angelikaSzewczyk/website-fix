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

// --- SEO METADATEN (Für Google Search Console & Social Media) ---
export async function generateMetadata({ params }: { params: { slug: string } }) {
  const post = await getPostData(params.slug);
  if (!post) return { title: "Beitrag nicht gefunden" };

  // Wir erstellen eine URL, die auf unsere neue API zeigt und den Titel als Parameter übergibt
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
          url: ogUrl.toString(), // Hier wird das dynamische Bild geladen!
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
    return {
      ...defaultFixCta,
      headline: "Dieses Problem lässt sich oft schnell beheben",
      copy: "Wenn dein Kontaktformular nicht funktioniert oder Anfragen nicht ankommen, passt das oft zu einem unserer Standard-Fixes.",
    };
  }

  if (text.includes("langsam") || text.includes("ladezeit") || text.includes("pagespeed") || text.includes("performance")) {
    return {
      ...defaultFixCta,
      headline: "Ladezeit optimieren",
      copy: "Wenn deine Website langsam lädt oder der Pagespeed schlecht ist, passt das oft zu einem unserer Standard-Fixes.",
    };
  }

  if (text.includes("mobile") || text.includes("responsive") || text.includes("handy")) {
    return {
      ...defaultFixCta,
      headline: "Mobile Ansicht fixen",
      copy: "Wenn deine Website auf dem Handy kaputt aussieht, passt das oft zu einem unserer Standard-Fixes.",
    };
  }

  if (text.includes("analytics") || text.includes("tracking") || text.includes("ga4")) {
    return {
      ...defaultFixCta,
      headline: "Tracking korrigieren",
      copy: "Wenn Tracking oder Analytics nicht sauber eingerichtet sind, lässt sich das oft als klarer Fix umsetzen.",
    };
  }

  return {
    headline: "Technischer oder individueller Fall?",
    copy: "Nicht jedes Problem passt auf einen Standard-Fix. Beschreibe deinen Fall kurz über das Anfrageformular.",
    primaryHref: "/#book",
    primaryLabel: "Problem anfragen →",
    secondaryHref: "/#fixes",
    secondaryLabel: "Fixes ansehen",
  };
}

// --- HAUPT-KOMPONENTE (Server Component) ---
export default async function BlogPostPage({
  params,
}: {
  params: { slug: string };
}) {
  const post = await getPostData(params.slug);

  if (!post) notFound();

  const { htmlWithIds, toc } = extractTocAndInjectIds(post.contentHtml);
  const cta = getCtaVariant(post.data);

  return (
    <>
      <BlogHeader active="blog" lang="de" ctaLabel="Fix auswählen" />
      <main className="blogPostPage">
        <article>
          <h1 className="blogPostTitle">{String(post.data.title || "")}</h1>

          {post.data.description ? (
            <p className="blogPostDesc">{String(post.data.description)}</p>
          ) : null}

          {toc.length >= 2 ? (
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
          ) : null}

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