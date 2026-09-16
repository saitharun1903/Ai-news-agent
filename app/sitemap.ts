import { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = siteConfig.url;
  const now = new Date();

  const routes = [
    "",
    "/today",
    "/news",
    "/research",
    "/topics",
    "/favorites",
    "/archive",
    "/insights",
    "/notes",
  ].map((path) => ({
    url: `${baseUrl}${path}`,
    lastModified: now,
    changeFrequency: "daily" as const,
    priority: path === "" || path === "/today" ? 1.0 : 0.8,
  }));

  const topicRoutes = siteConfig.topics.map((t) => ({
    url: `${baseUrl}/topics/${t.slug}`,
    lastModified: now,
    changeFrequency: "daily" as const,
    priority: 0.7,
  }));

  return [...routes, ...topicRoutes];
}
