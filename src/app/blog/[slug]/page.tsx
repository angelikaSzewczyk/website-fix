import fs from "fs";
import path from "path";
import { notFound } from "next/navigation";
import { cache } from "react";
import matter from "gray-matter";
import { remark } from "remark";
import html from "remark-html";
import gfm from "remark-gfm";
import RelatedPosts from "@/app/components/related-posts";
import BlogHeader from "@/app/components/blog-header";
import BlogClientWrapper from "@/app/components/blog-client-wrapper";
import SiteFooter from "@/app/components/SiteFooter";

/** Injiziert `data-label="<Spaltenname>"` in jeden <td>, damit das Mobile-CSS
 *  die Spalten-Header per ::before-Pseudo-Element anzeigen kann.
 *  Server-side Post-Processing — keine Client-JS-Abhängigkeit. */
function decorateTableCells(htmlString: string): string {
  return htmlString.replace(/<table([\s\S]*?)<\/table>/g, (tableMatch) => {
    // Header-Texte aus dem ersten <thead><tr> extrahieren
    const headerMatch = tableMatch.match(/<thead[\s\S]*?<tr[\s\S]*?>([\s\S]*?)<\/tr>[\s\S]*?<\/thead>/);
    if (!headerMatch) return tableMatch;
    const headers: string[] = [];
    const thRegex = /<th[^>]*>([\s\S]*?)<\/th>/g;
    let m: RegExpExecArray | null;
    while ((m = thRegex.exec(headerMatch[1])) !== null) {
      // HTML-Tags und " entfernen, kürzen
      const text = m[1].replace(/<[^>]+>/g, "").replace(/"/g, "&quot;").trim();
      headers.push(text);
    }
    if (headers.length === 0) return tableMatch;

    // Jede tbody-Row durchgehen und data-label auf die td's setzen
    return tableMatch.replace(/<tbody([\s\S]*?)<\/tbody>/, (tbodyMatch, tbodyAttrs) => {
      const updatedTbody = tbodyMatch.replace(/<tr([\s\S]*?)<\/tr>/g, (rowMatch) => {
        let colIdx = 0;
        return rowMatch.replace(/<td([^>]*)>/g, (tdMatch, tdAttrs) => {
          const label = headers[colIdx] ?? "";
          colIdx++;
          if (!label || /data-label=/.test(tdAttrs)) return tdMatch;
          return `<td${tdAttrs} data-label="${label}">`;
        });
      });
      return `<tbody${tbodyAttrs}${updatedTbody.replace(/^<tbody[\s\S]*?>/, "").replace(/<\/tbody>$/, "")}</tbody>`;
    });
  });
}

const getPostData = cache(async (slug: string) => {
  const filePath = path.join(process.cwd(), "content", "blog", `${slug}.md`);
  if (!fs.existsSync(filePath)) return null;
  const raw = fs.readFileSync(filePath, "utf8");
  const { data, content } = matter(raw);
  // GFM aktiviert Tabellen, Strikethrough, Task-Lists, Auto-Linking.
  // remark-html braucht allowDangerousHtml damit GFM-erzeugtes HTML
  // (z.B. <table>) nicht als Plaintext escaped wird.
  const processed = await remark()
    .use(gfm)
    .use(html, { sanitize: false })
    .process(content);
  // Post-process: data-label auf <td> injizieren fuer Mobile-Tabellen-Cards
  const decorated = decorateTableCells(processed.toString());
  return { data, contentHtml: decorated };
});

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const post = await getPostData(params.slug);
  if (!post) return { title: "Beitrag nicht gefunden" };

  const title = post.data.title;
  const description = post.data.description;
  const canonical = `https://website-fix.com/blog/${params.slug}`;
  const ogUrl = new URL("https://website-fix.com/api/og");
  ogUrl.searchParams.set("title", title || "");

  return {
    title: { absolute: `${title} | WebsiteFix Blog` },
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      type: "article",
      siteName: "WebsiteFix",
      locale: "de_DE",
      publishedTime: post.data.date ? new Date(post.data.date).toISOString() : undefined,
      images: [{ url: ogUrl.toString(), width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogUrl.toString()],
    },
  };
}

function slugifyHeading(text: string) {
  return text.toLowerCase().trim().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-");
}

function extractTocAndInjectIds(contentHtml: string) {
  const toc: { id: string; text: string }[] = [];
  const htmlWithIds = contentHtml.replace(/<h2>(.*?)<\/h2>/g, (_match, innerText) => {
    const plainText = innerText.replace(/<[^>]+>/g, "").trim();
    const id = slugifyHeading(plainText);
    toc.push({ id, text: plainText });
    return `<h2 id="${id}">${innerText}</h2>`;
  });
  return { htmlWithIds, toc };
}

function buildFaqJsonLd(faq: { q: string; a: string }[], pageUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faq.map(({ q, a }) => ({
      "@type": "Question",
      "name": q,
      "acceptedAnswer": { "@type": "Answer", "text": a },
    })),
    "url": pageUrl,
  };
}

export default async function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = await getPostData(params.slug);
  if (!post) notFound();

  const { htmlWithIds, toc } = extractTocAndInjectIds(post.contentHtml);
  const faq: { q: string; a: string }[] | undefined = post.data.faq;
  const pageUrl = `https://website-fix.com/blog/${params.slug}`;

  return (
    <>
      {faq && faq.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(buildFaqJsonLd(faq, pageUrl)) }}
        />
      )}
      <BlogHeader active="blog" lang="de" />

      <main style={{ maxWidth: 800, margin: "0 auto", padding: "64px 24px 96px" }}>
        <article>
          <h1 style={{
            fontSize: "clamp(24px, 5vw, 38px)", fontWeight: 700,
            margin: "0 0 12px", letterSpacing: "-0.03em", lineHeight: 1.2,
          }}>
            {post.data.title}
          </h1>

          {post.data.description && (
            <p style={{ fontSize: 16, color: "rgba(255,255,255,0.45)", lineHeight: 1.7, margin: "0 0 36px" }}>
              {post.data.description}
            </p>
          )}

          {toc.length >= 2 && (
            <nav style={{
              border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: 10, padding: "20px 24px",
              marginBottom: 40,
            }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.4)", letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 12px" }}>
                Inhalt
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {toc.map((item) => (
                  <a key={item.id} href={`#${item.id}`} style={{
                    fontSize: 14, color: "rgba(255,255,255,0.55)", textDecoration: "none",
                    display: "flex", alignItems: "center", gap: 8,
                  }}>
                    <span style={{ width: 4, height: 4, borderRadius: "50%", background: "#8df3d3", display: "inline-block", flexShrink: 0 }} />
                    {item.text}
                  </a>
                ))}
              </div>
            </nav>
          )}

          <div className="blogContent" dangerouslySetInnerHTML={{ __html: htmlWithIds }} />

          <BlogClientWrapper postData={post.data} />

          <RelatedPosts slug={params.slug} lang="de" />
        </article>
      </main>

      <SiteFooter />
    </>
  );
}
