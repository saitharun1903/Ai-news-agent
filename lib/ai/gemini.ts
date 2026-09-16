import { AIProvider, ConceptExplanation } from "./types";
import { ArticleGroup, Paper, PaperChunk } from "@/lib/db/types";
import { HeuristicLocalProvider } from "./local-heuristic";

export class GeminiProvider implements AIProvider {
  private apiKey: string;
  private fallback: HeuristicLocalProvider;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.fallback = new HeuristicLocalProvider();
  }

  private async callGemini(prompt: string): Promise<string> {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${this.apiKey}`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.2, maxOutputTokens: 1000 },
        }),
      });

      if (!res.ok) {
        throw new Error(`Gemini API error ${res.status}: ${await res.text()}`);
      }

      const json = await res.json();
      return (
        json.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || ""
      );
    } catch (err) {
      console.warn("[GeminiProvider] Failed, using fallback:", err);
      return "";
    }
  }

  async summarize(text: string, maxLength: number = 220): Promise<string> {
    const prompt = `Summarize the following AI news or paper text cleanly in 1-2 concise, high-signal sentences (maximum ${maxLength} characters). Avoid fluff, hype, or buzzwords.\n\nText: ${text}`;
    const res = await this.callGemini(prompt);
    return res || this.fallback.summarize(text, maxLength);
  }

  async classifyCategory(text: string): Promise<string> {
    const prompt = `Classify this AI article into exactly ONE category from this list: [BREAKING, RESEARCH, PRODUCT, OPEN SOURCE, AGENTS, LLMs, AI INFRASTRUCTURE, COMPUTER VISION, ROBOTICS, SECURITY, INDUSTRY, STARTUPS, POLICY, TOOLS]. Return only the category name.\n\nContent: ${text.slice(0, 1000)}`;
    const res = await this.callGemini(prompt);
    return res.trim().toUpperCase() || this.fallback.classifyCategory(text);
  }

  async generateWhyItMatters(title: string, summary: string): Promise<string> {
    const prompt = `In 1-2 direct, technically grounded sentences, explain WHY this AI event or paper matters for engineers, researchers, and developers. Focus on real impact (latency, cost, capabilities, architecture).\n\nTitle: ${title}\nSummary: ${summary}`;
    const res = await this.callGemini(prompt);
    return res || this.fallback.generateWhyItMatters(title, summary);
  }

  async generateDailySynthesis(stories: ArticleGroup[], papers: Paper[]): Promise<string> {
    const headlines = stories.slice(0, 5).map((s) => s.title).join("; ");
    const paperTitles = papers.slice(0, 3).map((p) => p.title).join("; ");
    const prompt = `Write a concise 2-paragraph synthesis answering 'What changed in AI today?' based on these real events and research papers:\nHeadlines: ${headlines}\nPapers: ${paperTitles}\n\nMaintain an editorial, intelligent, calm tone. Do not fabricate facts. Connect the dots between research trends and industry moves.`;
    const res = await this.callGemini(prompt);
    return res || this.fallback.generateDailySynthesis(stories, papers);
  }

  async answerPaperQuestion(paper: Paper, question: string, chunks: PaperChunk[]): Promise<string> {
    const context = chunks
      .slice(0, 4)
      .map((c) => `[${c.sectionTitle}]: ${c.content}`)
      .join("\n\n");

    const prompt = `You are ResearchPulse AI Assistant. Answer this question about the research paper "${paper.title}" (${paper.authors.slice(0, 3).join(", ")}) grounded strictly in the provided paper context.\n\nPaper Abstract: ${paper.abstract}\n\nContext Chunks:\n${context}\n\nUser Question: ${question}\n\nProvide an accurate, technical yet accessible answer. Quote key findings or math when relevant.`;
    const res = await this.callGemini(prompt);
    return res || this.fallback.answerPaperQuestion(paper, question, chunks);
  }

  async explainConcept(concept: string, paperTitle: string): Promise<ConceptExplanation> {
    const prompt = `Explain the prerequisite AI concept "${concept}" needed to read the paper "${paperTitle}". Return JSON formatted as: {"description": "1 sentence overview", "briefExplanation": "2-3 sentences explaining the mechanism and mathematical or architectural intuition"}`;
    const res = await this.callGemini(prompt);
    try {
      const match = res.match(/\{[\s\S]*\}/);
      if (match) {
        const parsed = JSON.parse(match[0]);
        return {
          concept,
          description: parsed.description,
          status: "Needs Review",
          briefExplanation: parsed.briefExplanation,
        };
      }
    } catch {
      // fallback
    }
    return this.fallback.explainConcept(concept, paperTitle);
  }
}
