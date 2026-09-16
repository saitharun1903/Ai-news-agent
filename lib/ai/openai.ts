import { AIProvider, ConceptExplanation } from "./types";
import { ArticleGroup, Paper, PaperChunk } from "@/lib/db/types";
import { HeuristicLocalProvider } from "./local-heuristic";

export class OpenAIProvider implements AIProvider {
  private apiKey: string;
  private fallback: HeuristicLocalProvider;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.fallback = new HeuristicLocalProvider();
  }

  private async callOpenAI(messages: { role: string; content: string }[]): Promise<string> {
    try {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages,
          temperature: 0.2,
          max_tokens: 1000,
        }),
      });

      if (!res.ok) throw new Error(`OpenAI error: ${await res.text()}`);
      const json = await res.json();
      return json.choices?.[0]?.message?.content?.trim() || "";
    } catch (err) {
      console.warn("[OpenAIProvider] Failed, using fallback:", err);
      return "";
    }
  }

  async summarize(text: string, maxLength: number = 220): Promise<string> {
    const res = await this.callOpenAI([
      { role: "system", content: "Summarize this AI text in 1-2 concise, high-signal sentences." },
      { role: "user", content: text },
    ]);
    return res || this.fallback.summarize(text, maxLength);
  }

  async classifyCategory(text: string): Promise<string> {
    const res = await this.callOpenAI([
      { role: "system", content: "Classify into ONE category: [BREAKING, RESEARCH, PRODUCT, OPEN SOURCE, AGENTS, LLMs, AI INFRASTRUCTURE, COMPUTER VISION, ROBOTICS, SECURITY, INDUSTRY, STARTUPS, POLICY, TOOLS]. Return only the category." },
      { role: "user", content: text.slice(0, 1000) },
    ]);
    return res.trim().toUpperCase() || this.fallback.classifyCategory(text);
  }

  async generateWhyItMatters(title: string, summary: string): Promise<string> {
    const res = await this.callOpenAI([
      { role: "system", content: "Explain in 1-2 direct sentences why this AI development matters for technical practitioners." },
      { role: "user", content: `Title: ${title}\nSummary: ${summary}` },
    ]);
    return res || this.fallback.generateWhyItMatters(title, summary);
  }

  async generateDailySynthesis(stories: ArticleGroup[], papers: Paper[]): Promise<string> {
    const headlines = stories.slice(0, 5).map((s) => s.title).join("; ");
    const paperTitles = papers.slice(0, 3).map((p) => p.title).join("; ");
    const res = await this.callOpenAI([
      { role: "system", content: "Synthesize today's AI trends in 2 calm, editorial paragraphs." },
      { role: "user", content: `Headlines: ${headlines}\nPapers: ${paperTitles}` },
    ]);
    return res || this.fallback.generateDailySynthesis(stories, papers);
  }

  async answerPaperQuestion(paper: Paper, question: string, chunks: PaperChunk[]): Promise<string> {
    const context = chunks.map((c) => `[${c.sectionTitle}]: ${c.content}`).join("\n\n");
    const res = await this.callOpenAI([
      { role: "system", content: `You are Lunor AI Assistant answering questions grounded in the paper "${paper.title}".` },
      { role: "user", content: `Context:\n${context}\n\nQuestion: ${question}` },
    ]);
    return res || this.fallback.answerPaperQuestion(paper, question, chunks);
  }

  async explainConcept(concept: string, paperTitle: string): Promise<ConceptExplanation> {
    return this.fallback.explainConcept(concept, paperTitle);
  }
}
