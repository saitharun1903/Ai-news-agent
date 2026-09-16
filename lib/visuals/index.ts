import { db } from "@/lib/db";
import { Article, ArticleGroup, Paper, VisualAsset, VisualSourceType } from "@/lib/db/types";
import { normalizeTopic } from "@/lib/analytics";

function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

/**
 * Generate technical editorial SVG illustration matching Lunor visual language
 */
export function generateTechnicalIllustrationSvg(
  topicId: string,
  title: string,
  width: number = 800,
  height: number = 450
): string {
  const hash = hashString(title);
    const num1 = parseInt(hash.slice(0, 2) || "3a", 36) % 50;
  const num2 = parseInt(hash.slice(2, 4) || "7f", 36) % 50;

  // Visual palettes: technical cobalt, slate, crisp white, deep charcoal
  let geometryElements = "";

  if (topicId.includes("agent")) {
    // Multi-Agent Collaboration Graph
    geometryElements = `
      <circle cx="${250 + num1}" cy="225" r="48" fill="#EFF6FF" stroke="#1D4ED8" stroke-width="2" />
      <circle cx="${550 - num2}" cy="160" r="38" fill="#F8FAFC" stroke="#2563EB" stroke-width="2" />
      <circle cx="${520 + num1}" cy="300" r="42" fill="#F8FAFC" stroke="#475569" stroke-width="2" />
      <circle cx="${400}" cy="225" r="58" fill="#FFFFFF" stroke="#0F172A" stroke-width="2" stroke-dasharray="6,4" />
      
      <path d="M ${250 + num1} 225 L 400 225 L ${550 - num2} 160" stroke="#1D4ED8" stroke-width="1.5" stroke-dasharray="4,4" fill="none" />
      <path d="M 400 225 L ${520 + num1} 300" stroke="#2563EB" stroke-width="1.5" fill="none" />
      
      <circle cx="400" cy="225" r="12" fill="#1D4ED8" />
      <circle cx="${250 + num1}" cy="225" r="8" fill="#0F172A" />
      <circle cx="${550 - num2}" cy="160" r="7" fill="#2563EB" />
      <circle cx="${520 + num1}" cy="300" r="7" fill="#475569" />
      
      <rect x="180" y="110" width="120" height="24" rx="12" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1.5" />
      <rect x="500" y="80" width="130" height="24" rx="12" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1.5" />
      <rect x="470" y="360" width="140" height="24" rx="12" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1.5" />
    `;
  } else if (topicId.includes("rag") || topicId.includes("retrieval") || topicId.includes("database")) {
    // Vector Embedding Space & Storage Architecture
    geometryElements = `
      <rect x="180" y="90" width="140" height="270" rx="16" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="2" />
      <line x1="200" y1="130" x2="300" y2="130" stroke="#1D4ED8" stroke-width="2.5" stroke-linecap="round" />
      <line x1="200" y1="150" x2="280" y2="150" stroke="#E2E8F0" stroke-width="2" stroke-linecap="round" />
      <line x1="200" y1="170" x2="260" y2="170" stroke="#E2E8F0" stroke-width="2" stroke-linecap="round" />
      <line x1="200" y1="210" x2="300" y2="210" stroke="#0F172A" stroke-width="2.5" stroke-linecap="round" />
      <line x1="200" y1="230" x2="270" y2="230" stroke="#E2E8F0" stroke-width="2" stroke-linecap="round" />
      
      <path d="M 320 225 C 380 225, 380 180, 440 180" stroke="#1D4ED8" stroke-width="2" stroke-dasharray="6,4" fill="none" />
      <path d="M 320 225 C 380 225, 380 270, 440 270" stroke="#2563EB" stroke-width="2" stroke-dasharray="6,4" fill="none" />
      
      <circle cx="480" cy="180" r="42" fill="#EFF6FF" stroke="#1D4ED8" stroke-width="2" />
      <circle cx="560" cy="240" r="32" fill="#F8FAFC" stroke="#2563EB" stroke-width="2" />
      <circle cx="500" cy="290" r="36" fill="#FFFFFF" stroke="#0F172A" stroke-width="2" />
      
      <line x1="480" y1="180" x2="560" y2="240" stroke="#CBD5E1" stroke-width="1.5" />
      <line x1="560" y1="240" x2="500" y2="290" stroke="#CBD5E1" stroke-width="1.5" />
      
      <circle cx="480" cy="180" r="8" fill="#1D4ED8" />
      <circle cx="560" cy="240" r="7" fill="#2563EB" />
      <circle cx="500" cy="290" r="7" fill="#0F172A" />
    `;
  } else if (topicId.includes("vision") || topicId.includes("multimodal")) {
    // Multimodal Patch Grid & Visual Attention
    geometryElements = `
      <rect x="190" y="110" width="190" height="230" rx="16" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="2" />
      <rect x="210" y="130" width="40" height="40" rx="8" fill="#EFF6FF" />
      <rect x="260" y="130" width="40" height="40" rx="8" fill="#F8FAFC" />
      <rect x="310" y="130" width="40" height="40" rx="8" fill="#EFF6FF" />
      <rect x="210" y="180" width="40" height="40" rx="8" fill="#F8FAFC" />
      <rect x="260" y="180" width="40" height="40" rx="8" fill="#1D4ED8" />
      <rect x="310" y="180" width="40" height="40" rx="8" fill="#F8FAFC" />
      <rect x="210" y="230" width="40" height="40" rx="8" fill="#EFF6FF" />
      <rect x="260" y="230" width="40" height="40" rx="8" fill="#F8FAFC" />
      <rect x="310" y="230" width="40" height="40" rx="8" fill="#EFF6FF" />
      
      <path d="M 380 200 L 460 200" stroke="#1D4ED8" stroke-width="2" stroke-dasharray="5,3" />
      
      <circle cx="540" cy="225" r="64" fill="#FFFFFF" stroke="#0F172A" stroke-width="2" />
      <circle cx="540" cy="225" r="44" fill="#EFF6FF" stroke="#1D4ED8" stroke-width="1.5" />
      <circle cx="540" cy="225" r="14" fill="#0F172A" />
      
      <circle cx="590" cy="140" r="16" fill="#F8FAFC" stroke="#2563EB" stroke-width="1.5" />
      <line x1="570" y1="180" x2="585" y2="155" stroke="#2563EB" stroke-width="1.5" />
    `;
  } else if (topicId.includes("system") || topicId.includes("distributed") || topicId.includes("security")) {
    // Distributed Consensus & Cryptographic Protocol
    geometryElements = `
      <polygon points="400,100 520,180 520,320 400,380 280,320 280,180" fill="#FFFFFF" stroke="#1D4ED8" stroke-width="2" />
      <line x1="400" y1="100" x2="400" y2="380" stroke="#E2E8F0" stroke-width="1.5" />
      <line x1="280" y1="180" x2="520" y2="320" stroke="#E2E8F0" stroke-width="1.5" />
      <line x1="280" y1="320" x2="520" y2="180" stroke="#E2E8F0" stroke-width="1.5" />
      
      <circle cx="400" cy="240" r="28" fill="#EFF6FF" stroke="#1D4ED8" stroke-width="1.5" />
      <circle cx="400" cy="240" r="10" fill="#0F172A" />
      
      <circle cx="520" cy="180" r="7" fill="#2563EB" />
      <circle cx="280" cy="180" r="7" fill="#2563EB" />
      <circle cx="400" cy="100" r="7" fill="#1D4ED8" />
      
      <path d="M 230 350 Q 300 280 400 310 T 570 260" stroke="#1D4ED8" stroke-width="2" stroke-linecap="round" fill="none" />
    `;
  } else {
    // Technical Architecture & Pipeline
    geometryElements = `
      <g transform="translate(180, 100)">
        <rect x="0" y="0" width="100" height="250" rx="14" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="2" />
        <rect x="15" y="20" width="70" height="28" rx="8" fill="#EFF6FF" stroke="#1D4ED8" stroke-width="1.5" />
        <rect x="15" y="65" width="70" height="28" rx="8" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="1.5" />
        <rect x="15" y="110" width="70" height="28" rx="8" fill="#EFF6FF" stroke="#1D4ED8" stroke-width="1.5" />
        <rect x="15" y="155" width="70" height="28" rx="8" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="1.5" />
        <rect x="15" y="200" width="70" height="28" rx="8" fill="#0F172A" />
      </g>
      
      <path d="M 280 160 C 350 160, 350 120, 420 120" stroke="#1D4ED8" stroke-width="2" stroke-dasharray="5,3" fill="none" />
      <path d="M 280 225 C 350 225, 350 225, 420 225" stroke="#2563EB" stroke-width="2" fill="none" />
      <path d="M 280 290 C 350 290, 350 330, 420 330" stroke="#1D4ED8" stroke-width="2" stroke-dasharray="5,3" fill="none" />
      
      <g transform="translate(420, 90)">
        <rect x="0" y="0" width="200" height="270" rx="18" fill="#FFFFFF" stroke="#1D4ED8" stroke-width="2" />
        <rect x="25" y="30" width="150" height="50" rx="12" fill="#F8FAFC" stroke="#E2E8F0" stroke-width="1.5" />
        <rect x="25" y="110" width="150" height="50" rx="12" fill="#EFF6FF" stroke="#1D4ED8" stroke-width="1.5" />
        <rect x="25" y="190" width="150" height="50" rx="12" fill="#F8FAFC" stroke="#0F172A" stroke-width="1.5" />
        
        <circle cx="100" cy="135" r="9" fill="#1D4ED8" />
        <line x1="50" y1="135" x2="80" y2="135" stroke="#1D4ED8" stroke-width="2" stroke-linecap="round" />
        <line x1="120" y1="135" x2="150" y2="135" stroke="#1D4ED8" stroke-width="2" stroke-linecap="round" />
      </g>
    `;
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="100%" height="100%">
    <defs>
      <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#FAFAF9" />
        <stop offset="100%" stop-color="#F1F5F9" />
      </linearGradient>
      <pattern id="gridPattern" width="30" height="30" patternUnits="userSpaceOnUse">
        <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#E2E8F0" stroke-width="0.75" stroke-opacity="0.6" />
      </pattern>
    </defs>
    
    <!-- Background Canvas -->
    <rect width="100%" height="100%" fill="url(#bgGrad)" />
    <rect width="100%" height="100%" fill="url(#gridPattern)" />
    
    <!-- Subtle Accent Glow -->
    <circle cx="${width * 0.7}" cy="${height * 0.3}" r="180" fill="#EFF6FF" fill-opacity="0.6" filter="blur(40px)" />
    <circle cx="${width * 0.3}" cy="${height * 0.7}" r="150" fill="#FFFFFF" fill-opacity="0.8" filter="blur(30px)" />
    
    <!-- Dynamic Technical Geometry -->
    ${geometryElements}
  </svg>`;

  return "data:image/svg+xml;utf8," + encodeURIComponent(svg);
}

export class VisualEngine {
  /**
   * Determine best visual asset for an article group (clustered story)
   */
  static async getVisualForArticleGroup(group: ArticleGroup): Promise<VisualAsset> {
    const existing =
      (await db.getVisualAsset("group", group.id)) ||
      (await db.getVisualAsset("article", group.id));
    if (existing && existing.status === "ready") return existing;

    const topic = normalizeTopic(group.topic);
    let sourceType: VisualSourceType = "generated";
    let url = "";

    // Check if any matching article in store has an official image
    const allArticles = await db.getArticles({ limit: 100 });
    const matching = allArticles.find(
      (a) =>
        a.groupId === group.id ||
        (group.sources && group.sources.some((s) => s.url === a.url)) ||
        a.title.toLowerCase() === group.title.toLowerCase()
    );

    if (matching?.imageUrl && matching.imageUrl.startsWith("http")) {
      sourceType = "official";
      url = matching.imageUrl;
    } else {
      sourceType = "generated";
      url = generateTechnicalIllustrationSvg(topic.id, group.title, 800, 450);
    }

    const asset: VisualAsset = {
      id: "vis_grp_" + group.id,
      entityType: "group",
      entityId: group.id,
      sourceType,
      url,
      altText: "Technical illustration representing " + group.title,
      width: 800,
      height: 450,
      visualStyle: "Lunor Light Technical Editorial",
      contentHash: hashString(group.title + group.summary),
      status: "ready",
      generatedAt: new Date().toISOString(),
    };

    await db.saveVisualAsset(asset);
    return asset;
  }

  /**
   * Determine best visual asset for an article
   */
  static async getVisualForArticle(article: Article): Promise<VisualAsset> {
    const existing = await db.getVisualAsset("article", article.id);
    if (existing && existing.status === "ready") return existing;

    const topic = normalizeTopic(article.category);
    let sourceType: VisualSourceType = "generated";
    let url = "";

    // Priority 1: Official source/article image
    if (article.imageUrl && article.imageUrl.startsWith("http")) {
      sourceType = "official";
      url = article.imageUrl;
    } else if ((article as any).thumbnailUrl && (article as any).thumbnailUrl.startsWith("http")) {
      sourceType = "official";
      url = (article as any).thumbnailUrl;
    } else {
      // Priority 4: Contextual technical editorial illustration
      sourceType = "generated";
      url = generateTechnicalIllustrationSvg(topic.id, article.title, 800, 450);
    }

    const asset: VisualAsset = {
      id: "vis_art_" + article.id,
      entityType: "article",
      entityId: article.id,
      sourceType,
      url,
      altText: "Technical illustration representing " + article.title,
      width: 800,
      height: 450,
      visualStyle: "Lunor Light Technical Editorial",
      contentHash: hashString(article.title + article.summary),
      status: "ready",
      generatedAt: new Date().toISOString(),
    };

    await db.saveVisualAsset(asset);
    return asset;
  }

  /**
   * Determine best visual asset for a research paper
   */
  static async getVisualForPaper(paper: Paper): Promise<VisualAsset> {
    const existing = await db.getVisualAsset("paper", paper.id);
    if (existing && existing.status === "ready") return existing;

    const topic = normalizeTopic(paper.primaryCategory || (paper.categories && paper.categories[0]));
    let sourceType: VisualSourceType = "generated";
    let url = "";

    // Priority 3: Paper figure if available
    if (paper.figureUrl && paper.figureUrl.startsWith("http")) {
      sourceType = "paper_figure";
      url = paper.figureUrl;
    } else if (paper.githubUrl && paper.githubUrl.includes("github.com/")) {
      // Priority 2: Verified project OpenGraph
      const parts = paper.githubUrl.replace("https://github.com/", "").split("/");
      if (parts.length >= 2) {
        sourceType = "project";
        url = "https://opengraph.githubassets.com/1/" + parts[0] + "/" + parts[1];
      } else {
        sourceType = "generated";
        url = generateTechnicalIllustrationSvg(topic.id, paper.title, 640, 480);
      }
    } else {
      // Priority 4: Contextual technical editorial illustration
      sourceType = "generated";
      url = generateTechnicalIllustrationSvg(topic.id, paper.title, 640, 480);
    }

    const asset: VisualAsset = {
      id: "vis_paper_" + paper.id,
      entityType: "paper",
      entityId: paper.id,
      sourceType,
      url,
      altText: "Conceptual architecture illustration for research paper: " + paper.title,
      width: 640,
      height: 480,
      visualStyle: "Lunor Light Technical Editorial",
      contentHash: hashString(paper.title + (paper.abstract || "")),
      status: "ready",
      generatedAt: new Date().toISOString(),
    };

    await db.saveVisualAsset(asset);
    return asset;
  }

  /**
   * Pre-seed/index visuals for all existing articles and papers
   */
  static async ensureAllVisualAssets(): Promise<number> {
    const [articles, papers] = await Promise.all([
      db.getArticles({ limit: 150 }),
      db.getPapers(),
    ]);

    let count = 0;
    for (const a of articles) {
      await this.getVisualForArticle(a);
      count++;
    }
    for (const p of papers) {
      await this.getVisualForPaper(p);
      count++;
    }

    return count;
  }
}
