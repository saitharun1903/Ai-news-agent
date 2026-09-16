# ResearchPulse

> **The daily intelligence and research companion for AI builders.**
> *Stay current with AI without information overload, while building a daily habit of reading high-quality research papers.*

---

## 1. Architecture Overview

ResearchPulse is built as an editorial-grade, technical intelligence platform that transforms raw academic preprints and multi-source industry news into structured, actionable insights.

```
                    ┌─────────────────────────┐
                    │      Data Sources       │
                    │ arXiv · Hugging Face   │
                    │ Lab RSS · Hacker News   │
                    └────────────┬────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │ Ingestion & Normalizer  │
                    │ Deduplication · Grouping │
                    │ Transparent Scoring     │
                    └────────────┬────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │   Persistence Layer     │
                    │ SQLite / Postgres + RAG │
                    └────────────┬────────────┘
                                 │
        ┌────────────────────────┼────────────────────────┐
        │                        │                        │
┌───────▼────────┐      ┌────────▼────────┐      ┌────────▼────────┐
│ Today Command  │      │ AI Paper Reader │      │ Daily Briefing  │
│ Lead Story     │      │ Outline · RAG   │      │ Desktop Popup   │
│ Paper of Day   │      │ Prerequisites   │      │ Habit Streaks   │
└────────────────┘      └─────────────────┘      └─────────────────┘
```

---

## 2. Technology Stack

- **Framework**: Next.js 15 (App Router, Server Components & Streaming)
- **Language**: TypeScript (Strict mode)
- **Styling**: Tailwind CSS (Dark/Light mode, custom editorial typography, subtle borders)
- **Icons**: Lucide React
- **Storage**: Dual-tier architecture
  - Zero-config persistent engine (`data/researchpulse.json`) for instant out-of-the-box local execution
  - Production-ready PostgreSQL + `pgvector` migration DDL (`lib/db/supabase-migrations.sql`) for Supabase deployment
- **AI Abstraction Layer**:
  - `HeuristicLocalProvider` (built-in extractive summarizer, TF-IDF ranking, and zero-key prerequisite explainer)
  - `GeminiProvider` (Google Gemini 2.5 Flash)
  - `OpenAIProvider` (GPT-4o mini)
- **Parsing**: `fast-xml-parser` for high-throughput RSS/Atom XML feeds and arXiv preprints
- **Desktop Companion**: Node.js background companion script (`desktop/companion.mjs`) supporting Windows native toast notifications and macOS notifications

---

## 3. Database Schema

The platform defines full schemas for:
- `Source`: Ingestion source metadata, trust tier (`TIER_1_LAB`, `TIER_1_ACADEMIC`, `TIER_2_TECH_PRESS`, `TIER_3_COMMUNITY`), categories, and error tracking.
- `Article`: Normalized individual news articles with canonical URLs, authors, and publish timestamps.
- `ArticleGroup`: Clustered events grouping duplicate coverage across multiple independent outlets into a single event with corroborated source badges.
- `Paper`: Enriched preprints from arXiv and Hugging Face with difficulty rating, reading time estimation, structured breakdown ("Why it matters", "Core contribution", "Method", "Results", "Limitations"), prerequisite concepts, and transparent recommendation reasons.
- `PaperChunk`: Chunked text sections for RAG semantic retrieval in the Paper Reader.
- `UserProfile`: Reading streak, longest streak, total reading time, papers read count, daily goal (mins), and topic preferences.
- `ReadingSession`: Granular tracking of time spent reading each paper and completion percentages.
- `Bookmark`: Personal queued papers and saved news articles.
- `Note`: User research notes and highlights saved directly during reading sessions.
- `DailyBriefing`: Daily cached synthesis answering *"What changed today?"*.
- `IngestionLog`: Operational audit trail of background pipeline runs.

---

## 4. API Structure

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/api/briefing` | GET / POST | Retrieves or forces regeneration of today's cached executive briefing |
| `/api/ingest` | GET / POST | Inspects source health and triggers live multi-source ingestion |
| `/api/assistant` | POST | Grounded RAG assistant answering technical questions for a paper |
| `/api/search` | GET | Hybrid lexical + semantic intent search across papers, news, and topics |
| `/api/profile` | GET / PATCH / POST | Manages reading habits, streaks, daily goals, and notification times |
| `/api/bookmarks` | GET / POST / DELETE | Manages personal reading queue |
| `/api/notes` | GET / POST / DELETE | Manages user research notes and highlights |

---

## 5. Environment Variables

Create a `.env.local` file (or copy `.env.example`):

```bash
# Optional: Database (defaults to built-in SQLite persistence if omitted)
# DATABASE_URL="postgresql://postgres:password@localhost:5432/researchpulse"
# SUPABASE_URL=""
# SUPABASE_ANON_KEY=""

# Optional: Neural AI Provider ("gemini", "openai", or "local")
AI_PROVIDER="local"
# GEMINI_API_KEY="your-gemini-key"
# OPENAI_API_KEY="your-openai-key"

# Desktop Morning Briefing Preferences
NEXT_PUBLIC_DEFAULT_BRIEFING_TIME="08:30"
NEXT_PUBLIC_ENABLE_DESKTOP_POPUP="true"
```

*Note: ResearchPulse works 100% out of the box with real live data without any required API keys.*

---

## 6. Setup & Development Instructions

```bash
# 1. Navigate to directory
cd C:\Users\SaiTh\.gemini\antigravity\scratch\researchpulse

# 2. Install dependencies
npm install

# 3. Trigger live data ingestion (fetches from arXiv, Hugging Face, Lab RSS, HN)
npx tsx scripts/ingest.ts

# 4. Start development server
npm run dev

# 5. Open in browser
http://localhost:3000
```

---

## 7. First-Class Application Routes

- `/`: Today Command Center (Lead story with multi-source coverage, trending topics, Research Paper of the Day, For You, Reading Habit)
- `/today`: Dedicated Today's AI Daily Briefing with *"What changed today?"* synthesis
- `/news` & `/news/[id]`: Live Intelligence Wire with category filters and *"Research behind this trend"*
- `/research` & `/research/[id]`: Research Paper Discovery Hub with tabs (`Trending`, `New`, `Important`, `Practical`, `Foundational`, `For You`) and detailed paper breakdown
- `/reader/[id]`: Focused 3-Pane AI Paper Reader (Document Outline, Typography Canvas / PDF View, Grounded RAG Research Assistant)
- `/topics` & `/topics/[slug]`: Domain portals with dynamic research reading roadmaps
- `/reading-list`: Personal queued papers
- `/notes`: Personal AI knowledge base grouped by topic
- `/insights`: Reading habit analytics, streaks, reading hours, and topic distribution
- `/search`: Universal Search with semantic intent recognition
- `/settings` & `/profile`: Schedule preferences, morning briefing time, and topic interest map
- `/admin`: Ingestion operations dashboard, manual triggers, and source health

---

## 8. Desktop Morning Companion

Run the lightweight desktop companion in background:

```bash
node desktop/companion.mjs
```

This companion monitors your configured morning briefing time (default `08:30 AM`), checks for the day's fresh briefing, and delivers a native desktop notification with a link to open the executive briefing.

---

## 9. Production Deployment

### Vercel / Cloud Container Deployment
1. Connect repository to Vercel or your cloud container runner.
2. If connecting to Supabase:
   - Run `lib/db/supabase-migrations.sql` in your Supabase SQL Editor.
   - Set `DATABASE_URL` and `SUPABASE_URL` in environment variables.
3. Configure a cron job or Vercel Cron to hit `POST /api/ingest` every morning at 06:00 UTC.
