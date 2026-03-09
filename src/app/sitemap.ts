import { MetadataRoute } from "next";
import fs from "fs";
import path from "path";

const SITE_URL = "https://website-fix.com";

export default function sitemap(): MetadataRoute.Sitemap {

  const blogDir = path.join(process.cwd(), "content/blog");

  const blogFiles = fs
    .readdirSync(blogDir)
    .filter((file) => file.endsWith(".md"));

  const blogUrls = blogFiles.map((file) => {
    const slug = file.replace(".md", "");

    return {
      url: `${SITE_URL}/blog/${slug}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    };
  });

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

    ...blogUrls,
  ];
}