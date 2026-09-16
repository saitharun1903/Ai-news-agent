import { AIProvider, ConceptExplanation } from "./types";
import { ArticleGroup, Paper, PaperChunk } from "@/lib/db/types";

// Pre-curated high-fidelity concept knowledge base
const CONCEPT_KNOWLEDGE: Record<string, { desc: string; explanation: string }> = {
  "attention mechanism": {
    desc: "Dynamically weights the relevance of different tokens in an input sequence regardless of distance.",
    explanation:
      "Calculates Query, Key, and Value projections. Similarity between Query and Key determines softmax attention weights, enabling direct modeling of long-range token relationships with O(1) path length.",
  },
  "kv cache": {
    desc: "Key-Value caching for autoregressive generation to avoid redundant token recomputations.",
    explanation:
      "During sequential token generation, past Keys and Values are retained in GPU VRAM so attention is only computed for the newest query token against the historical KV states.",
  },
  "speculative decoding": {
    desc: "Accelerating LLM inference using a small draft model and parallel verification by the target model.",
    explanation:
      "A fast draft model drafts K prospective tokens; the large target model evaluates all K candidates in a single forward pass, accepting valid tokens and guaranteeing mathematically identical output distribution.",
  },
  "mixture of experts": {
    desc: "Sparsely gated architecture routing tokens to specialized subnetworks (experts).",
    explanation:
      "Replaces dense feed-forward blocks with multiple parallel expert networks. A learned router directs each token to top-k experts, dramatically scaling parameter count without proportional FLOP increases.",
  },
  "flashattention": {
    desc: "IO-aware exact attention algorithm optimizing GPU High Bandwidth Memory (HBM) and SRAM transfers.",
    explanation:
      "Tiles the softmax computation across query/key blocks to keep intermediate attention matrices entirely inside fast GPU SRAM, avoiding quadratic memory writes to slow HBM.",
  },
  "lora": {
    desc: "Low-Rank Adaptation for parameter-efficient fine-tuning (PEFT).",
    explanation:
      "Freezes pretrained weights and decomposes the weight update matrix into two low-rank matrices (A and B). Only rank-r updates are trained, slashing trainable parameters by >99% without degradation.",
  },
  "direct preference optimization": {
    desc: "Aligns language models directly from human preference pairs without separate reward model training.",
    explanation:
      "Mathematically derives an exact closed-form mapping between the reward function and optimal policy, optimizing the language model directly via cross-entropy loss on chosen vs rejected responses.",
  },
  "contrastive learning": {
    desc: "Self-supervised representation learning pulling semantically similar pairs together and pushing dissimilar pairs apart.",
    explanation:
      "Maps inputs into a shared embedding space using InfoNCE loss, maximizing mutual information between positive augmentations while contrasting against negative samples.",
  },
  "multi-agent orchestration": {
    desc: "Coordinated systems where autonomous agents collaborate with role specialization and tool interfaces.",
    explanation:
      "Employs structured communication protocols, shared scratchpads/memory, and supervisor verification loops to decompose complex multi-step workflows into resilient, modular tasks.",
  },
  "reinforcement learning": {
    desc: "Learning optimal policy actions through environment rewards, trial, and exploration.",
    explanation:
      "Formulates problems as Markov Decision Processes (MDP). The agent optimizes expected cumulative discounted reward via value-based or policy-gradient methods.",
  },
};

export class HeuristicLocalProvider implements AIProvider {
  async summarize(text: string, maxLength: number = 220): Promise<string> {
    const clean = text.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
    if (clean.length <= maxLength) return clean;

    const sentences = clean.match(/[^.!?]+[.!?]+/g) || [clean];
    let result = "";
    for (const s of sentences) {
      if ((result + s).length <= maxLength) {
        result += (result ? " " : "") + s.trim();
      } else {
        break;
      }
    }
    return result || clean.substring(0, maxLength) + "...";
  }

  async classifyCategory(text: string): Promise<string> {
    const lower = text.toLowerCase();
    if (lower.includes("agent") || lower.includes("tool use") || lower.includes("multi-agent")) return "AGENTS";
    if (lower.includes("rag") || lower.includes("retrieval") || lower.includes("vector")) return "RESEARCH";
    if (lower.includes("quantiz") || lower.includes("inference") || lower.includes("vllm") || lower.includes("gpu") || lower.includes("speculative")) return "AI INFRASTRUCTURE";
    if (lower.includes("vision") || lower.includes("diffusion") || lower.includes("image") || lower.includes("video")) return "COMPUTER VISION";
    if (lower.includes("robot") || lower.includes("embodied") || lower.includes("humanoid")) return "ROBOTICS";
    if (lower.includes("security") || lower.includes("jailbreak") || lower.includes("safety") || lower.includes("alignment")) return "SECURITY";
    if (lower.includes("open-source") || lower.includes("open weight") || lower.includes("hugging face")) return "OPEN SOURCE";
    if (lower.includes("release") || lower.includes("launch") || lower.includes("introduc")) return "PRODUCT";
    if (lower.includes("model") || lower.includes("llm") || lower.includes("reasoning") || lower.includes("gpt")) return "LLMs";
    return "RESEARCH";
  }

  async generateWhyItMatters(title: string, summary: string): Promise<string> {
    const combined = `${title} ${summary}`.toLowerCase();
    if (combined.includes("inference") || combined.includes("quantiz") || combined.includes("faster")) {
      return "Directly reduces deployment latency and per-token compute costs, making real-time production serving economically viable.";
    }
    if (combined.includes("agent") || combined.includes("autonomous") || combined.includes("workflow")) {
      return "Pushes beyond isolated prompt-response loops toward reliable, autonomous multi-step execution in production systems.";
    }
    if (combined.includes("reasoning") || combined.includes("math") || combined.includes("code")) {
      return "Demonstrates measurable gains in complex chain-of-thought verification, narrowing the gap between human expertise and automated reasoning.";
    }
    if (combined.includes("open source") || combined.includes("weights")) {
      return "Broadens developer sovereignty by enabling self-hosted fine-tuning and private enterprise deployment without vendor lock-in.";
    }
    return "Represents a meaningful technical shift that impacts developer tooling, architectural standards, and practical implementation roadmaps.";
  }

  async generateDailySynthesis(stories: ArticleGroup[], papers: Paper[]): Promise<string> {
    const storyThemes = stories.slice(0, 4).map((s) => s.title);
    const paperThemes = papers.slice(0, 3).map((p) => p.title);

    return `Today's primary developments highlight accelerated convergence between production-grade agentic architectures and low-overhead inference optimization. Major announcements across ${storyThemes.slice(0, 2).join(" and ")} underscore a structural shift from raw parameter scaling toward post-training reasoning verification and specialized systems engineering. Meanwhile, cutting-edge preprints including "${paperThemes[0] || "recent foundational work"}" point to rigorous empirical benchmarking over superficial metric claims.`;
  }

  async answerPaperQuestion(paper: Paper, question: string, chunks: PaperChunk[]): Promise<string> {
    const qLower = question.toLowerCase();

    // Check for standard inquiries first
    if (qLower.includes("what problem") || qLower.includes("what is it solving") || qLower.includes("motivation")) {
      return `**Problem Solved by this Research:**\n\n${paper.whyItMatters}\n\n*Background Context:* Prior approaches faced critical bottlenecks in scaling or fidelity. This work directly addresses those architectural limitations with empirical validation on standard benchmarks.`;
    }

    if (qLower.includes("main contribution") || qLower.includes("core contribution") || qLower.includes("novel")) {
      return `**Core Contribution:**\n\n${paper.coreContribution}\n\n*Methodology Summary:* ${paper.method}`;
    }

    if (qLower.includes("limitation") || qLower.includes("drawback") || qLower.includes("weakness")) {
      return `**Key Limitations Identified:**\n\n${paper.limitations}\n\n*Practical Implication:* While results are promising, hardware requirements and edge-case sensitivity remain considerations for production deployment.`;
    }

    if (qLower.includes("beginner") || qLower.includes("explain like i'm 5") || qLower.includes("simple")) {
      return `**Intuitive Explanation for Beginners:**\n\nThink of ${paper.title} as solving a fundamental communication or calculation bottleneck in AI. Instead of doing everything the slow or heavy way, the authors discovered a smarter technique: ${paper.coreContribution.split(".")[0]}. This lets AI models perform higher-quality reasoning with fewer wasted resources.`;
    }

    // Rank chunks based on token overlap
    const tokens = qLower.split(/\W+/).filter((t) => t.length > 3);
    let bestChunk = chunks[0];
    let bestScore = -1;

    for (const chunk of chunks) {
      const chunkLower = chunk.content.toLowerCase();
      let score = 0;
      for (const t of tokens) {
        if (chunkLower.includes(t)) score += 1;
      }
      if (score > bestScore) {
        bestScore = score;
        bestChunk = chunk;
      }
    }

    if (bestChunk && bestScore > 0) {
      return `Based on **${bestChunk.sectionTitle}** in the paper:\n\n> "${bestChunk.content.substring(0, 380)}..."\n\n**Key Takeaway:** The paper demonstrates that this approach maintains stability while improving efficiency. Specifically, ${paper.method.substring(0, 180)}...`;
    }

    return `From the paper's findings on **${paper.title}**:\n\n${paper.abstract}\n\n*Core Methodology:* ${paper.method}`;
  }

  async explainConcept(concept: string, paperTitle: string): Promise<ConceptExplanation> {
    const key = concept.toLowerCase().trim();
    for (const [knownKey, val] of Object.entries(CONCEPT_KNOWLEDGE)) {
      if (key.includes(knownKey) || knownKey.includes(key)) {
        return {
          concept,
          description: val.desc,
          status: "Needs Review",
          briefExplanation: val.explanation,
        };
      }
    }

    return {
      concept,
      description: `Foundational mathematical and architectural prerequisite for understanding ${paperTitle}.`,
      status: "Needs Review",
      briefExplanation: `Essential technical concept covering algebraic formulations, vector spaces, or training dynamics relevant to the proposed methodology.`,
    };
  }
}
