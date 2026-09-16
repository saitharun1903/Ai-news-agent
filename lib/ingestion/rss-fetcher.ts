import { XMLParser } from "fast-xml-parser";
import { Article, Source } from "@/lib/db/types";

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  textNodeName: "#text",
  trimValues: true,
  processEntities: false,
  htmlEntities: false,
});

export async function fetchRssSource(source: Source): Promise<Article[]> {
  if (!source.rssUrl) return [];

  try {
    const res = await fetch(source.rssUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 ResearchPulse/1.0",
        Accept: "application/rss+xml, application/xml, application/atom+xml, text/xml, */*",
      },
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(12000),
    });

    if (!res.ok) {
      console.warn(`[RSS] ${source.name} returned status ${res.status}`);
      return [];
    }

    const xml = await res.text();
    const parsed = parser.parse(xml);

    let rawItems: any[] = [];
    if (parsed.rss?.channel?.item) {
      rawItems = Array.isArray(parsed.rss.channel.item)
        ? parsed.rss.channel.item
        : [parsed.rss.channel.item];
    } else if (parsed.feed?.entry) {
      rawItems = Array.isArray(parsed.feed.entry)
        ? parsed.feed.entry
        : [parsed.feed.entry];
    }

    const articles: Article[] = [];

    for (const item of rawItems.slice(0, 15)) {
      const title =
        typeof item.title === "object" ? item.title["#text"] || "" : item.title || "";
      if (!title || title.trim().length < 5) continue;

      let link = "";
      if (typeof item.link === "string") {
        link = item.link;
      } else if (item.link?.["@_href"]) {
        link = item.link["@_href"];
      } else if (Array.isArray(item.link)) {
        const alt = item.link.find((l: any) => l["@_rel"] === "alternate" || !l["@_rel"]);
        link = alt ? alt["@_href"] : item.link[0]["@_href"] || "";
      }

      if (!link) continue;

      const rawDate = item.pubDate || item.published || item.updated || item["dc:date"];
      let publishedAt = new Date().toISOString();
      if (rawDate) {
        const parsedDate = new Date(rawDate);
        if (!isNaN(parsedDate.getTime())) {
          publishedAt = parsedDate.toISOString();
        }
      }

      let summary =
        item.description || item.summary?.["#text"] || item.summary || item["content:encoded"] || "";
      if (typeof summary === "object") summary = summary["#text"] || "";
      summary = summary.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
      if (summary.length > 300) summary = summary.slice(0, 297) + "...";

      const author =
        typeof item.author === "object"
          ? item.author?.name || source.name
          : item["dc:creator"] || item.author || source.name;

      let imageUrl: string | undefined;
      if (item.enclosure?.["@_url"] && item.enclosure?.["@_type"]?.startsWith("image/")) {
        imageUrl = item.enclosure["@_url"];
      } else if (item["media:content"]?.["@_url"]) {
        imageUrl = item["media:content"]["@_url"];
      }

      const slug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "")
        .slice(0, 70);

      articles.push({
        id: `art_${Math.abs(hashString(link))}`,
        slug: `${slug}-${Math.abs(hashString(link)).toString(36)}`,
        title: title.trim(),
        url: link,
        sourceId: source.id,
        sourceName: source.name,
        summary: summary || title,
        publishedAt,
        fetchedAt: new Date().toISOString(),
        category: source.category,
        importanceScore: source.trustLevel === "TIER_1_LAB" ? 1.4 : 1.0,
        readTimeMinutes: Math.max(2, Math.round((summary.split(" ").length + 200) / 200)),
        author: typeof author === "string" ? author : source.name,
        imageUrl,
      });
    }

    return articles;
  } catch (err: any) {
    console.warn(`[RSS] Failed fetching from ${source.name}:`, err.message);
    return [];
  }
}

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const chr = str.charCodeAt(i);
    hash = (hash << 5) - hash + chr;
    hash |= 0;
  }
  return hash;
}
