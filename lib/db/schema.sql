-- ==============================================================================
-- Lunor Production Supabase Schema
-- Persistent source of truth for users, bookmarks, streaks, reading sessions,
-- favorites, notes, articles, and research preprints.
-- ==============================================================================

-- 1. PROFILES (Users, Preferences, Habit Streaks)
create table if not exists public.profiles (
  id text primary key,
  name text not null,
  email text,
  avatar_url text,
  bio text,
  reading_streak integer default 0,
  longest_streak integer default 0,
  last_active_date date default current_date,
  total_reading_minutes integer default 0,
  papers_read_count integer default 0,
  articles_read_count integer default 0,
  difficulty_preference text default 'Intermediate',
  interested_topics jsonb default '["llms", "agents", "rag", "ai-infrastructure"]'::jsonb,
  daily_goal_minutes integer default 25,
  timezone text default 'Asia/Kolkata',
  morning_briefing_time text default '08:30',
  desktop_notifications_enabled boolean default true,
  weekend_notifications_enabled boolean default true,
  sound_enabled boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. BOOKMARKS (Reading List)
create table if not exists public.bookmarks (
  id text primary key,
  user_id text not null references public.profiles(id) on delete cascade,
  item_type text not null, -- 'paper' | 'article' | 'project'
  item_id text not null,
  title text not null,
  url text not null,
  category text,
  created_at timestamptz default now(),
  unique(user_id, item_id)
);

-- 3. FAVORITES (Permanent Saves)
create table if not exists public.favorites (
  id text primary key,
  user_id text not null references public.profiles(id) on delete cascade,
  entity_type text not null, -- 'paper' | 'article' | 'project'
  entity_id text not null,
  title text not null,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  unique(user_id, entity_type, entity_id)
);

-- 4. READING SESSIONS (Reading History, Durations, Habit Calculation)
create table if not exists public.reading_sessions (
  id text primary key,
  user_id text not null references public.profiles(id) on delete cascade,
  paper_id text not null,
  paper_title text not null,
  time_spent_seconds integer default 0,
  duration_seconds integer default 0,
  progress_percent float default 0.0,
  status text default 'started', -- 'started' | 'in_progress' | 'completed'
  completed boolean default false,
  completed_at timestamptz,
  started_at timestamptz default now(),
  last_heartbeat_at timestamptz default now(),
  last_updated_at timestamptz default now(),
  ended_at timestamptz
);

-- 5. RESEARCH NOTES & HIGHLIGHTS
create table if not exists public.notes (
  id text primary key,
  user_id text not null references public.profiles(id) on delete cascade,
  paper_id text not null,
  paper_title text not null,
  section_title text,
  highlighted_text text,
  note text not null,
  topic text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 6. SOURCES REGISTRY
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

-- 7. ARTICLES
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

-- 8. ARTICLE GROUPS (Clustered Topics / Events)
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

-- 9. RESEARCH PAPERS
create table if not exists public.papers (
  id text primary key,
  arxiv_id text unique,
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

-- 10. DAILY BRIEFINGS
create table if not exists public.daily_briefings (
  id text primary key,
  date date unique not null,
  title text not null,
  summary text not null,
  synthesis text not null,
  top_stories jsonb not null,
  recommended_papers jsonb not null,
  paper_of_day_id text,
  published_at timestamptz default now()
);

-- INDEXES FOR FAST QUERYING
create index if not exists idx_bookmarks_user on public.bookmarks(user_id);
create index if not exists idx_favorites_user on public.favorites(user_id);
create index if not exists idx_reading_sessions_user on public.reading_sessions(user_id, started_at desc);
create index if not exists idx_notes_user on public.notes(user_id);
create index if not exists idx_articles_published on public.articles(published_at desc);
create index if not exists idx_papers_published on public.papers(published_at desc);

-- ROW LEVEL SECURITY (RLS)
alter table public.profiles enable row level security;
alter table public.bookmarks enable row level security;
alter table public.favorites enable row level security;
alter table public.reading_sessions enable row level security;
alter table public.notes enable row level security;

-- Policies for public.profiles: users can read/update own profile or user_primary fallback
drop policy if exists "Profiles are viewable by owner or public" on public.profiles;
create policy "Profiles are viewable by owner or public"
  on public.profiles for select
  using (true);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid()::text = id or id = 'user_primary');

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid()::text = id or id = 'user_primary');

-- Policies for Bookmarks
drop policy if exists "Users can manage own bookmarks" on public.bookmarks;
create policy "Users can manage own bookmarks"
  on public.bookmarks for all
  using (auth.uid()::text = user_id or user_id = 'user_primary')
  with check (auth.uid()::text = user_id or user_id = 'user_primary');

-- Policies for Favorites
drop policy if exists "Users can manage own favorites" on public.favorites;
create policy "Users can manage own favorites"
  on public.favorites for all
  using (auth.uid()::text = user_id or user_id = 'user_primary')
  with check (auth.uid()::text = user_id or user_id = 'user_primary');

-- Policies for Reading Sessions
drop policy if exists "Users can manage own reading sessions" on public.reading_sessions;
create policy "Users can manage own reading sessions"
  on public.reading_sessions for all
  using (auth.uid()::text = user_id or user_id = 'user_primary')
  with check (auth.uid()::text = user_id or user_id = 'user_primary');

-- Policies for Notes
drop policy if exists "Users can manage own notes" on public.notes;
create policy "Users can manage own notes"
  on public.notes for all
  using (auth.uid()::text = user_id or user_id = 'user_primary')
  with check (auth.uid()::text = user_id or user_id = 'user_primary');

-- SEED PRIMARY USER PROFILE (Idempotent)
insert into public.profiles (
  id,
  name,
  email,
  timezone,
  daily_goal_minutes,
  difficulty_preference,
  interested_topics,
  morning_briefing_time,
  created_at
) values (
  'user_primary',
  'Sai Tharun Reddy',
  'sai@lunor.co.in',
  'Asia/Kolkata',
  25,
  'Intermediate',
  '["llms", "agents", "rag", "ai-infrastructure"]'::jsonb,
  '08:30',
  '2026-09-01T00:00:00.000Z'
) on conflict (id) do nothing;
