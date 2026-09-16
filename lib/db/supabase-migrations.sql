-- ==============================================================================
-- ResearchPulse Supabase / PostgreSQL + pgvector Migration Schema
-- Run this in your Supabase SQL Editor to provision tables, vector extensions, and indexes.
-- ==============================================================================

-- Enable pgvector extension for dense embeddings
create extension if not exists vector;

-- Users / Profiles
create table if not exists public.profiles (
  id text primary key,
  name text not null,
  email text,
  reading_streak integer default 0,
  longest_streak integer default 0,
  last_active_date date default current_date,
  total_reading_minutes integer default 0,
  papers_read_count integer default 0,
  articles_read_count integer default 0,
  difficulty_preference text default 'Intermediate',
  interested_topics jsonb default '["llms", "agents", "rag", "ai-infrastructure"]'::jsonb,
  daily_goal_minutes integer default 25,
  morning_briefing_time text default '08:30',
  desktop_notifications_enabled boolean default true,
  weekend_notifications_enabled boolean default true,
  sound_enabled boolean default true,
  created_at timestamptz default now()
);

-- Sources Registry
create table if not exists public.sources (
  id text primary key,
  name text not null,
  type text not null,
  url text not null,
  rss_url text,
  trust_level text not null,
  category text not null,
  enabled boolean default true,
  last_fetched_at timestamptz,
  error_count integer default 0
);

-- Articles
create table if not exists public.articles (
  id text primary key,
  slug text unique not null,
  title text not null,
  url text unique not null,
  source_id text references public.sources(id) on delete cascade,
  source_name text not null,
  summary text not null,
  content text,
  published_at timestamptz not null,
  fetched_at timestamptz default now(),
  category text not null,
  importance_score float default 1.0,
  read_time_minutes integer default 3,
  group_id text,
  author text,
  image_url text
);

-- Article Groups (Deduplicated Events)
create table if not exists public.article_groups (
  id text primary key,
  title text not null,
  summary text not null,
  why_it_matters text not null,
  topic text not null,
  importance_score float default 1.0,
  article_count integer default 1,
  sources jsonb not null,
  published_at timestamptz not null,
  created_at timestamptz default now()
);

-- Research Papers
create table if not exists public.papers (
  id text primary key,
  arxiv_id text unique not null,
  slug text unique not null,
  title text not null,
  authors jsonb not null,
  abstract text not null,
  published_at timestamptz not null,
  primary_category text not null,
  categories jsonb not null,
  pdf_url text not null,
  arxiv_url text not null,
  github_url text,
  upvotes integer default 0,
  citation_count integer default 0,
  difficulty text not null,
  reading_time_minutes integer not null,
  why_it_matters text not null,
  core_contribution text not null,
  method text not null,
  results text not null,
  limitations text not null,
  prerequisites jsonb not null,
  recommendation_reasons jsonb not null,
  is_paper_of_day boolean default false,
  paper_of_day_date date,
  outline jsonb,
  discovery_category text not null
);

-- Paper Chunks & Embeddings (for RAG Assistant)
create table if not exists public.paper_chunks (
  id text primary key,
  paper_id text references public.papers(id) on delete cascade,
  chunk_index integer not null,
  section_title text not null,
  content text not null,
  embedding vector(768),
  keywords jsonb
);

-- Reading Sessions
create table if not exists public.reading_sessions (
  id text primary key,
  user_id text references public.profiles(id) on delete cascade,
  paper_id text references public.papers(id) on delete cascade,
  paper_title text not null,
  time_spent_seconds integer default 0,
  progress_percent float default 0.0,
  completed boolean default false,
  started_at timestamptz default now(),
  last_updated_at timestamptz default now()
);

-- Bookmarks & Reading List
create table if not exists public.bookmarks (
  id text primary key,
  user_id text references public.profiles(id) on delete cascade,
  item_type text not null,
  item_id text not null,
  title text not null,
  url text not null,
  category text,
  created_at timestamptz default now()
);

-- Research Notes & Highlights
create table if not exists public.notes (
  id text primary key,
  user_id text references public.profiles(id) on delete cascade,
  paper_id text references public.papers(id) on delete cascade,
  paper_title text not null,
  section_title text,
  highlighted_text text,
  note text not null,
  topic text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Daily Briefings
create table if not exists public.daily_briefings (
  id text primary key,
  date date unique not null,
  title text not null,
  summary text not null,
  synthesis text not null,
  top_stories jsonb not null,
  recommended_papers jsonb not null,
  paper_of_day_id text references public.papers(id),
  published_at timestamptz default now()
);

-- Indexes for lightning fast lookups
create index if not exists idx_articles_published on public.articles (published_at desc);
create index if not exists idx_articles_category on public.articles (category);
create index if not exists idx_papers_published on public.papers (published_at desc);
create index if not exists idx_papers_discovery on public.papers (discovery_category);
create index if not exists idx_paper_chunks_paper on public.paper_chunks (paper_id, chunk_index);
