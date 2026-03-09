import fs from "fs";
import path from "path";
import { notFound } from "next/navigation";
import matter from "gray-matter";
import { remark } from "remark";
import html from "remark-html";
import RelatedPosts from "@/app/components/related-posts";
import BlogHeader from "@/app/components/blog-header";


type BlogFrontmatter = {
  title?: string;
  description?: string;
  tags?: string[];
};

type TocItem = {
  id: string;
  text: string;
};

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

      toc.push({
        id,
        text: plainText,
      });

      return `<h2 id="${id}">${innerText}</h2>`;
    }
  );

  return { htmlWithIds, toc };
}

function getCtaVariant(data: BlogFrontmatter) {
  const title = (data.title || "").toLowerCase();
  const tags = (data.tags || []).map((t) => t.toLowerCase()).join(" ");
  const text = `${title} ${tags}`;

  if (text.includes("kontaktformular") || text.includes("formular")) {
    return {
      headline: "Dieses Problem lässt sich oft schnell beheben",
      copy:
        "Wenn dein Kontaktformular nicht funktioniert oder Anfragen nicht ankommen, passt das oft zu einem unserer Standard-Fixes.",
      primaryHref: "/#fixes",
      primaryLabel: "Fix auswählen →",
      secondaryHref: "/#book",
      secondaryLabel: "Problem anfragen",
    };
  }

  if (
    text.includes("langsam") ||
    text.includes("ladezeit") ||
    text.includes("pagespeed") ||
    text.includes("performance")
  ) {
    return {
      headline: "Dieses Problem lässt sich oft schnell beheben",
      copy:
        "Wenn deine Website langsam lädt, Besucher abspringen oder Pagespeed schlecht ist, passt das oft zu einem unserer Standard-Fixes.",
      primaryHref: "/#fixes",
      primaryLabel: "Fix auswählen →",
      secondaryHref: "/#book",
      secondaryLabel: "Problem anfragen",
    };
  }

  if (
    text.includes("mobile") ||
    text.includes("responsive") ||
    text.includes("handy")
  ) {
    return {
      headline: "Dieses Problem lässt sich oft schnell beheben",
      copy:
        "Wenn deine Website auf dem Handy kaputt aussieht oder mobil schlecht bedienbar ist, passt das oft zu einem unserer Standard-Fixes.",
      primaryHref: "/#fixes",
      primaryLabel: "Fix auswählen →",
      secondaryHref: "/#book",
      secondaryLabel: "Problem anfragen",
    };
  }

  if (
    text.includes("analytics") ||
    text.includes("tracking") ||
    text.includes("ga4")
  ) {
    return {
      headline: "Dieses Problem lässt sich oft schnell beheben",
      copy:
        "Wenn Tracking oder Analytics nicht sauber eingerichtet sind, lässt sich das oft als klarer Fix umsetzen.",
      primaryHref: "/#fixes",
      primaryLabel: "Fix auswählen →",
      secondaryHref: "/#book",
      secondaryLabel: "Problem anfragen",
    };
  }

  return {
    headline: "Technischer oder individueller Fall?",
    copy:
      "Nicht jedes Problem passt auf einen festen Standard-Fix. Wenn deine Website Fehler zeigt, offline ist oder der Fall technischer ist, beschreibe ihn kurz über das Anfrageformular.",
    primaryHref: "/#book",
    primaryLabel: "Problem anfragen →",
    secondaryHref: "/#fixes",
    secondaryLabel: "Fixes ansehen",
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: { slug: string };
}) {
  const filePath = path.join(
    process.cwd(),
    "content",
    "blog",
    `${params.slug}.md`
  );

  if (!fs.existsSync(filePath)) notFound();

  const raw = fs.readFileSync(filePath, "utf8");
  const { data, content } = matter(raw);

  const processed = await remark().use(html).process(content);
  const contentHtml = processed.toString();

  const { htmlWithIds, toc } = extractTocAndInjectIds(contentHtml);
  const cta = getCtaVariant(data as BlogFrontmatter);

  return (
      <><BlogHeader active="blog" lang="de" ctaLabel="Fix auswählen" /><main className="blogPostPage">
      <article>
        <h1 className="blogPostTitle">{String(data.title || "")}</h1>

        {data.description ? (
          <p className="blogPostDesc">{String(data.description)}</p>
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
          dangerouslySetInnerHTML={{ __html: htmlWithIds }} />

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
    </main></>
  );
}