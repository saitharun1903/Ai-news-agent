import { AIProvider } from "./types";
import { GeminiProvider } from "./gemini";
import { OpenAIProvider } from "./openai";
import { HeuristicLocalProvider } from "./local-heuristic";

export function getAIProvider(): AIProvider {
  const provider = process.env.AI_PROVIDER || "auto";
  const geminiKey = process.env.GEMINI_API_KEY || process.env.AI_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  if (provider === "gemini" && geminiKey) {
    return new GeminiProvider(geminiKey);
  }
  if (provider === "openai" && openaiKey) {
    return new OpenAIProvider(openaiKey);
  }

  if (provider === "auto") {
    if (geminiKey) return new GeminiProvider(geminiKey);
    if (openaiKey) return new OpenAIProvider(openaiKey);
  }

  // Default: Intelligent local heuristic provider with zero external dependencies
  return new HeuristicLocalProvider();
}

export const ai = getAIProvider();
