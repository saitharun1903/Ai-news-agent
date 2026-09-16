export interface NavItem {
  title: string;
  href: string;
  icon?: string;
  badge?: string;
}

export interface TopicItem {
  id: string;
  name: string;
  slug: string;
  description: string;
  color: string;
}

export const siteConfig = {
  name: "ResearchPulse",
  shortName: "Pulse",
  tagline: "The daily intelligence and research companion for AI builders.",
  description:
    "Stay current with AI without information overload, while building a daily habit of reading high-quality research papers.",
  url: process.env.NEXT_PUBLIC_APP_URL || "https://lunor.co.in",
  version: "1.0.0",

  defaultBriefingTime: "08:30",
  defaultTimezone: "auto",

  categories: [
    "ALL",
    "BREAKING",
    "RESEARCH",
    "PRODUCT",
    "OPEN SOURCE",
    "AGENTS",
    "LLMs",
    "AI INFRASTRUCTURE",
    "COMPUTER VISION",
    "ROBOTICS",
    "SECURITY",
    "INDUSTRY",
    "STARTUPS",
    "POLICY",
    "TOOLS",
  ] as const,

  topics: [
    {
      id: "software-engineering",
      name: "Software Engineering",
      slug: "software-engineering",
      description: "Architecture patterns, automated testing, program synthesis, maintenance, and verification.",
      color: "blue",
    },
    {
      id: "programming-languages",
      name: "Programming Languages",
      slug: "programming-languages",
      description: "Type systems, static analysis, formal semantics, compiler optimizations, and memory safety.",
      color: "indigo",
    },
    {
      id: "distributed-systems",
      name: "Distributed Systems",
      slug: "distributed-systems",
      description: "Consensus protocols, Byzantine fault tolerance, state machine replication, and edge computing.",
      color: "cyan",
    },
    {
      id: "databases",
      name: "Databases & Storage",
      slug: "databases",
      description: "LSM trees, distributed transactions, query planning, vector indexes, and columnar storage.",
      color: "emerald",
    },
    {
      id: "security",
      name: "Security & Cryptography",
      slug: "security",
      description: "Zero-knowledge proofs, vulnerability detection, privacy-preserving computing, and threat models.",
      color: "rose",
    },
    {
      id: "operating-systems",
      name: "Operating Systems",
      slug: "operating-systems",
      description: "Kernel architecture, memory virtualization, eBPF, scheduling, and hardware drivers.",
      color: "slate",
    },
    {
      id: "networking",
      name: "Networking & Cloud Infrastructure",
      slug: "networking",
      description: "Congestion control, software-defined networking, RPC frameworks, and datacenter topology.",
      color: "teal",
    },
    {
      id: "developer-tools",
      name: "Developer Tools",
      slug: "developer-tools",
      description: "IDEs, build systems, performance profiling, linters, and generative coding assistants.",
      color: "amber",
    },
    {
      id: "algorithms",
      name: "Algorithms & Complexity",
      slug: "algorithms",
      description: "Asymptotic optimization, randomized algorithms, graph theory, and algorithmic complexity.",
      color: "violet",
    },
    {
      id: "ai-ml",
      name: "AI & Machine Learning",
      slug: "ai-ml",
      description: "Foundation models, attention mechanisms, representation learning, and optimization algorithms.",
      color: "blue",
    },
    {
      id: "agents",
      name: "Autonomous Agents",
      slug: "agents",
      description: "Autonomous reasoning loops, tool use, multi-agent coordination, and memory architectures.",
      color: "emerald",
    },
    {
      id: "computer-vision",
      name: "Computer Vision",
      slug: "computer-vision",
      description: "Vision-language models, spatial intelligence, diffusion models, and scene understanding.",
      color: "purple",
    },
    {
      id: "robotics",
      name: "Robotics & Embodied AI",
      slug: "robotics",
      description: "Vision-Language-Action (VLA) models, policy learning, sim2real transfer, and humanoid control.",
      color: "orange",
    },
    {
      id: "hci",
      name: "Human-Computer Interaction (HCI)",
      slug: "hci",
      description: "Adaptive interfaces, multimodal input, cognitive ergonomics, and developer experience.",
      color: "sky",
    },
  ] as TopicItem[],

  researchTabs: [
    { id: "trending", label: "Trending", description: "Rapidly gaining community and citation attention" },
    { id: "new", label: "New", description: "Freshly submitted preprints within the last 24-48 hours" },
    { id: "important", label: "Important", description: "High-impact methodology benchmarks and foundational shifts" },
    { id: "practical", label: "Practical", description: "Engineering relevance, inference optimization, and tooling" },
    { id: "foundational", label: "Foundational", description: "Seminal papers every technical practitioner should master" },
    { id: "for-you", label: "For You", description: "Tailored to your reading history and selected topics" },
  ] as const,

  navItems: [
    { title: "Today", href: "/" },
    { title: "Briefing", href: "/today" },
    { title: "News", href: "/news" },
    { title: "Research", href: "/research" },
    { title: "Topics", href: "/topics" },
    { title: "Reading List", href: "/reading-list" },
    { title: "Notes", href: "/notes" },
    { title: "Insights", href: "/insights" },
  ] as NavItem[],

  adminNavItems: [
    { title: "Operations & Admin", href: "/admin" },
    { title: "Preferences", href: "/settings" },
  ] as NavItem[],

  difficulties: ["Beginner", "Intermediate", "Advanced"] as const,

  trustLevels: {
    TIER_1_LAB: { label: "AI Lab Official", weight: 1.0 },
    TIER_1_ACADEMIC: { label: "Academic Preprint", weight: 0.95 },
    TIER_2_TECH_PRESS: { label: "Verified Tech Press", weight: 0.8 },
    TIER_3_COMMUNITY: { label: "Community Discussion", weight: 0.65 },
  },
};
