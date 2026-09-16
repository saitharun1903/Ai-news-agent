import { ArticleGroup, Paper, PaperChunk } from "@/lib/db/types";

export interface ConceptExplanation {
  concept: string;
  description: string;
  status: "Mastered" | "Needs Review";
  briefExplanation: string;
}

export interface AIProvider {
  summarize(text: string, maxLength?: number): Promise<string>;
  classifyCategory(text: string): Promise<string>;
  generateWhyItMatters(title: string, summary: string): Promise<string>;
  generateDailySynthesis(stories: ArticleGroup[], papers: Paper[]): Promise<string>;
  answerPaperQuestion(paper: Paper, question: string, chunks: PaperChunk[]): Promise<string>;
  explainConcept(concept: string, paperTitle: string): Promise<ConceptExplanation>;
}
