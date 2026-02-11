import fs from "fs";
import path from "path";
import { notFound } from "next/navigation";
import matter from "gray-matter";
import { remark } from "remark";
import html from "remark-html";

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

  return (
    <main
      style={{
        maxWidth: 960,
        margin: "0 auto",
        padding: "40px 20px",
        color: "#fff",
      }}
    >
      <article>
        <h1 style={{ marginTop: 0 }}>{data.title}</h1>

        <p style={{ opacity: 0.75, marginBottom: 24 }}>
          {data.description}
        </p>

        <div
          className="blogContent"
          dangerouslySetInnerHTML={{ __html: contentHtml }}
        />

        {/* CTA */}
        <div
          style={{
            marginTop: 40,
            padding: 20,
            borderRadius: 16,
            background: "rgba(141,243,211,.10)",
            border: "1px solid rgba(141,243,211,.35)",
          }}
        >
          <strong>Brauchst du Hilfe bei genau diesem Problem?</strong>
          <p style={{ margin: "8px 0 14px", opacity: 0.85 }}>
            Wir prüfen deine Website kurz und beheben den Fehler zum Fixpreis.
          </p>
          <a
            href="/#fixes"
            style={{
              display: "inline-block",
              padding: "12px 18px",
              borderRadius: 12,
              background: "linear-gradient(90deg,#8df3d3,#7aa6ff)",
              color: "#0b0c10",
              fontWeight: 700,
              textDecoration: "none",
            }}
          >
            Fix auswählen →
          </a>
        </div>
      </article>
    </main>
  );
}
