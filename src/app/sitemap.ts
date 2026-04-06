import { MetadataRoute } from "next";
import fs from "fs";
import path from "path";
import matter from "gray-matter"; // Du nutzt gray-matter ja bereits

const SITE_URL = "https://website-fix.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const blogDir = path.join(process.cwd(), "content/blog");
  const blogFiles = fs.readdirSync(blogDir).filter((file) => file.endsWith(".md"));

  const blogUrls = blogFiles.map((file) => {
    const slug = file.replace(".md", "");
    const filePath = path.join(blogDir, file);
    const fileContent = fs.readFileSync(filePath, "utf8");
    const { data } = matter(fileContent);

    return {
      url: `${SITE_URL}/blog/${slug}`,
      // Nutze das Datum aus dem Markdown, falls vorhanden, sonst das aktuelle Datum
      lastModified: data.date ? new Date(data.date) : new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    };
  });

  const landingPages = [
    "/wordpress-kritischer-fehler",
    "/website-wird-nicht-gefunden",
    "/warum-findet-google-meine-homepage-nicht",
    "/website-langsam",
    "/kontaktformular-funktioniert-nicht",
    "/google-analytics-funktioniert-nicht",
    "/fuer-agenturen",
  ].map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.85,
  }));

  return [
    {
      url: `${SITE_URL}/`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${SITE_URL}/blog`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    ...landingPages,
    ...blogUrls,
  ];
}