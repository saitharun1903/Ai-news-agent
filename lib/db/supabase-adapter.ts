import { createAdminClient } from "@/lib/supabase/server";
import {
  UserProfile,
  Bookmark,
  UserFavorite,
  ReadingSession,
  Note,
  DailyFeedSnapshot,
} from "./types";

function getSupabaseClient() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SECRET_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key || key === "[SENSITIVE]" || key.includes("[SENSITIVE]")) {
    return null;
  }

  try {
    return createAdminClient();
  } catch (err) {
    return null;
  }
}

export function isSupabaseConfigured(): boolean {
  return getSupabaseClient() !== null;
}

// -------------------------------------------------------------
// USER PROFILES
// -------------------------------------------------------------
export function mapProfileRowToModel(row: any): UserProfile {
  return {
    id: row.id,
    name: row.name || "Sai Tharun Reddy",
    email: row.email || "sai@lunor.co.in",
    avatarUrl: row.avatar_url || undefined,
    timezone: row.timezone || "Asia/Kolkata",
    createdAt: row.created_at || "2026-09-01T00:00:00.000Z",
    readingStreak: Number(row.reading_streak) || 0,
    longestStreak: Number(row.longest_streak) || 0,
    lastActiveDate: row.last_active_date || "",
    totalReadingMinutes: Number(row.total_reading_minutes) || 0,
    papersReadCount: Number(row.papers_read_count) || 0,
    articlesReadCount: Number(row.articles_read_count) || 0,
    difficultyPreference: row.difficulty_preference || "Intermediate",
    interestedTopics: Array.isArray(row.interested_topics)
      ? row.interested_topics
      : ["llms", "agents", "rag", "ai-infrastructure"],
    dailyGoalMinutes: Number(row.daily_goal_minutes) || 25,
    morningBriefingTime: row.morning_briefing_time || "08:30",
    desktopNotificationsEnabled: row.desktop_notifications_enabled ?? true,
    weekendNotificationsEnabled: row.weekend_notifications_enabled ?? true,
    soundEnabled: row.sound_enabled ?? true,
    updatedAt: row.updated_at || undefined,
  };
}

export async function fetchUserProfileFromDb(userId: string): Promise<UserProfile | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (error || !data) return null;
    return mapProfileRowToModel(data);
  } catch {
    return null;
  }
}

export async function upsertUserProfileInDb(profile: UserProfile): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase) return false;

  try {
    const row = {
      id: profile.id,
      name: profile.name,
      email: profile.email,
      avatar_url: profile.avatarUrl || null,
      timezone: profile.timezone,
      daily_goal_minutes: profile.dailyGoalMinutes,
      difficulty_preference: profile.difficultyPreference,
      interested_topics: profile.interestedTopics,
      morning_briefing_time: profile.morningBriefingTime,
      desktop_notifications_enabled: profile.desktopNotificationsEnabled,
      weekend_notifications_enabled: profile.weekendNotificationsEnabled,
      sound_enabled: profile.soundEnabled,
      reading_streak: profile.readingStreak,
      longest_streak: profile.longestStreak,
      papers_read_count: profile.papersReadCount,
      articles_read_count: profile.articlesReadCount,
      total_reading_minutes: profile.totalReadingMinutes,
      last_active_date: profile.lastActiveDate,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from("profiles").upsert(row);
    return !error;
  } catch {
    return false;
  }
}

// -------------------------------------------------------------
// BOOKMARKS
// -------------------------------------------------------------
export function mapBookmarkRowToModel(row: any): Bookmark {
  return {
    id: row.id,
    userId: row.user_id,
    itemType: row.item_type || "paper",
    itemId: row.item_id,
    title: row.title,
    url: row.url,
    category: row.category,
    createdAt: row.created_at || new Date().toISOString(),
  };
}

export async function fetchBookmarksFromDb(userId: string): Promise<Bookmark[] | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from("bookmarks")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error || !data) return null;
    return data.map(mapBookmarkRowToModel);
  } catch {
    return null;
  }
}

export async function saveBookmarkToDb(bookmark: Bookmark): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase) return false;

  try {
    const row = {
      id: bookmark.id,
      user_id: bookmark.userId || "user_primary",
      item_type: bookmark.itemType,
      item_id: bookmark.itemId,
      title: bookmark.title,
      url: bookmark.url,
      category: bookmark.category,
      created_at: bookmark.createdAt,
    };

    const { error } = await supabase.from("bookmarks").upsert(row, {
      onConflict: "user_id, item_id",
    });
    return !error;
  } catch {
    return false;
  }
}

export async function deleteBookmarkFromDb(userId: string, itemId: string): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase) return false;

  try {
    const { error } = await supabase
      .from("bookmarks")
      .delete()
      .eq("user_id", userId)
      .eq("item_id", itemId);

    return !error;
  } catch {
    return false;
  }
}

// -------------------------------------------------------------
// FAVORITES
// -------------------------------------------------------------
export function mapFavoriteRowToModel(row: any): UserFavorite {
  return {
    id: row.id,
    userId: row.user_id,
    entityType: row.entity_type,
    entityId: row.entity_id,
    title: row.title,
    url: row.url,
    category: row.category,
    description: row.description,
    metadata: row.metadata || undefined,
    createdAt: row.created_at || new Date().toISOString(),
  };
}

export async function fetchFavoritesFromDb(
  userId: string,
  entityType?: string
): Promise<UserFavorite[] | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  try {
    let query = supabase
      .from("favorites")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (entityType && entityType !== "all") {
      query = query.eq("entity_type", entityType);
    }

    const { data, error } = await query;
    if (error || !data) return null;
    return data.map(mapFavoriteRowToModel);
  } catch {
    return null;
  }
}

export async function saveFavoriteToDb(fav: UserFavorite): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase) return false;

  try {
    const row = {
      id: fav.id,
      user_id: fav.userId || "user_primary",
      entity_type: fav.entityType,
      entity_id: fav.entityId,
      title: fav.title,
      url: fav.url,
      category: fav.category,
      description: fav.description,
      metadata: fav.metadata || {},
      created_at: fav.createdAt,
    };

    const { error } = await supabase.from("favorites").upsert(row, {
      onConflict: "user_id, entity_type, entity_id",
    });
    return !error;
  } catch {
    return false;
  }
}

export async function deleteFavoriteFromDb(
  userId: string,
  entityType: string,
  entityId: string
): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase) return false;

  try {
    const { error } = await supabase
      .from("favorites")
      .delete()
      .eq("user_id", userId)
      .eq("entity_type", entityType)
      .eq("entity_id", entityId);

    return !error;
  } catch {
    return false;
  }
}

// -------------------------------------------------------------
// READING SESSIONS
// -------------------------------------------------------------
export function mapSessionRowToModel(row: any): ReadingSession {
  return {
    id: row.id,
    userId: row.user_id,
    paperId: row.paper_id,
    paperTitle: row.paper_title,
    timeSpentSeconds: Number(row.time_spent_seconds) || 0,
    durationSeconds: Number(row.duration_seconds) || Number(row.time_spent_seconds) || 0,
    progressPercent: Number(row.progress_percent) || 0,
    status: row.status || "started",
    completed: Boolean(row.completed),
    startedAt: row.started_at || new Date().toISOString(),
    endedAt: row.ended_at || undefined,
    lastHeartbeatAt: row.last_heartbeat_at || undefined,
    lastUpdatedAt: row.last_updated_at || row.started_at || new Date().toISOString(),
    completedAt: row.completed_at || undefined,
  };
}

export async function fetchReadingSessionsFromDb(userId: string): Promise<ReadingSession[] | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from("reading_sessions")
      .select("*")
      .eq("user_id", userId)
      .order("started_at", { ascending: false });

    if (error || !data) return null;
    return data.map(mapSessionRowToModel);
  } catch {
    return null;
  }
}

export async function saveReadingSessionToDb(session: ReadingSession): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase) return false;

  try {
    const row = {
      id: session.id,
      user_id: session.userId || "user_primary",
      paper_id: session.paperId,
      paper_title: session.paperTitle,
      time_spent_seconds: session.timeSpentSeconds,
      duration_seconds: session.durationSeconds || session.timeSpentSeconds,
      progress_percent: session.progressPercent,
      status: session.status,
      completed: session.completed,
      started_at: session.startedAt,
      ended_at: session.endedAt || null,
      last_heartbeat_at: session.lastHeartbeatAt || null,
      last_updated_at: session.lastUpdatedAt,
      completed_at: session.completedAt || null,
    };

    const { error } = await supabase.from("reading_sessions").upsert(row);
    return !error;
  } catch {
    return false;
  }
}

// -------------------------------------------------------------
// NOTES
// -------------------------------------------------------------
export function mapNoteRowToModel(row: any): Note {
  return {
    id: row.id,
    userId: row.user_id,
    paperId: row.paper_id,
    paperTitle: row.paper_title,
    sectionTitle: row.section_title,
    highlightedText: row.highlighted_text,
    note: row.note,
    topic: row.topic,
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || new Date().toISOString(),
  };
}

export async function fetchNotesFromDb(
  userId: string,
  filter?: { paperId?: string; topic?: string }
): Promise<Note[] | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  try {
    let query = supabase
      .from("notes")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (filter?.paperId) {
      query = query.eq("paper_id", filter.paperId);
    }
    if (filter?.topic) {
      query = query.ilike("topic", filter.topic);
    }

    const { data, error } = await query;
    if (error || !data) return null;
    return data.map(mapNoteRowToModel);
  } catch {
    return null;
  }
}

export async function saveNoteToDb(note: Note): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase) return false;

  try {
    const row = {
      id: note.id,
      user_id: note.userId || "user_primary",
      paper_id: note.paperId,
      paper_title: note.paperTitle,
      section_title: note.sectionTitle || null,
      highlighted_text: note.highlightedText || null,
      note: note.note,
      topic: note.topic,
      created_at: note.createdAt,
      updated_at: note.updatedAt,
    };

    const { error } = await supabase.from("notes").upsert(row);
    return !error;
  } catch {
    return false;
  }
}

export async function deleteNoteFromDb(userId: string, noteId: string): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase) return false;

  try {
    const { error } = await supabase
      .from("notes")
      .delete()
      .eq("user_id", userId)
      .eq("id", noteId);

    return !error;
  } catch {
    return false;
  }
}

// -------------------------------------------------------------
// DAILY FEEDS SNAPSHOTS
// -------------------------------------------------------------
export function mapDailyFeedRowToModel(row: any): DailyFeedSnapshot {
  return {
    id: row.id,
    date: typeof row.edition_date === "string" ? row.edition_date.split("T")[0] : row.edition_date,
    timezone: row.timezone || "Asia/Kolkata",
    generatedAt: row.generated_at || new Date().toISOString(),
    status: row.status || "active",
    title: row.title,
    summary: row.summary,
    synthesis: row.synthesis,
    leadStory: row.lead_story || null,
    stories: Array.isArray(row.stories) ? row.stories : [],
    papers: Array.isArray(row.papers) ? row.papers : [],
    paperOfDay: row.paper_of_day || null,
    topicCounts: Array.isArray(row.topic_counts) ? row.topic_counts : [],
  };
}

export async function fetchDailyFeedFromDb(
  editionDate: string,
  timezone: string = "Asia/Kolkata"
): Promise<DailyFeedSnapshot | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from("daily_feeds")
      .select("*")
      .eq("edition_date", editionDate)
      .eq("timezone", timezone)
      .maybeSingle();

    if (error || !data) return null;
    return mapDailyFeedRowToModel(data);
  } catch {
    return null;
  }
}

export async function upsertDailyFeedInDb(feed: DailyFeedSnapshot): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase) return false;

  try {
    const row = {
      id: feed.id || `feed_${feed.date}`,
      edition_date: feed.date,
      timezone: feed.timezone || "Asia/Kolkata",
      generated_at: feed.generatedAt || new Date().toISOString(),
      published_at: new Date().toISOString(),
      status: feed.status || "active",
      title: feed.title,
      summary: feed.summary,
      synthesis: feed.synthesis,
      lead_story: feed.leadStory || null,
      stories: feed.stories || [],
      papers: feed.papers || [],
      paper_of_day: feed.paperOfDay || null,
      topic_counts: feed.topicCounts || [],
    };

    const { error } = await supabase.from("daily_feeds").upsert(row, {
      onConflict: "edition_date, timezone",
    });

    return !error;
  } catch {
    return false;
  }
}

export async function fetchDailyFeedsFromDb(
  limit: number = 10,
  timezone: string = "Asia/Kolkata"
): Promise<DailyFeedSnapshot[] | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from("daily_feeds")
      .select("*")
      .eq("timezone", timezone)
      .order("edition_date", { ascending: false })
      .limit(limit);

    if (error || !data || data.length === 0) return null;
    return data.map(mapDailyFeedRowToModel);
  } catch {
    return null;
  }
}

// -------------------------------------------------------------
// GENERATION JOBS AUDIT LOG
// -------------------------------------------------------------
export async function createGenerationJobInDb(job: {
  id: string;
  jobName?: string;
  editionDate: string;
  status?: string;
  attempt?: number;
  recordsFetched?: number;
  recordsInserted?: number;
  recordsUpdated?: number;
  duplicatesRemoved?: number;
  errorMessage?: string;
}): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase) return false;

  try {
    const row = {
      id: job.id,
      job_name: job.jobName || "daily_edition",
      edition_date: job.editionDate,
      started_at: new Date().toISOString(),
      status: job.status || "running",
      attempt: job.attempt || 1,
      records_fetched: job.recordsFetched || 0,
      records_inserted: job.recordsInserted || 0,
      records_updated: job.recordsUpdated || 0,
      duplicates_removed: job.duplicatesRemoved || 0,
      error_message: job.errorMessage || null,
    };

    const { error } = await supabase.from("generation_jobs").insert(row);
    return !error;
  } catch {
    return false;
  }
}

export async function updateGenerationJobInDb(
  id: string,
  updates: {
    status?: string;
    completedAt?: string;
    recordsFetched?: number;
    recordsInserted?: number;
    recordsUpdated?: number;
    duplicatesRemoved?: number;
    errorMessage?: string;
  }
): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase) return false;

  try {
    const rowUpdates: any = {};
    if (updates.status !== undefined) rowUpdates.status = updates.status;
    if (updates.completedAt !== undefined) rowUpdates.completed_at = updates.completedAt;
    if (updates.recordsFetched !== undefined) rowUpdates.records_fetched = updates.recordsFetched;
    if (updates.recordsInserted !== undefined) rowUpdates.records_inserted = updates.recordsInserted;
    if (updates.recordsUpdated !== undefined) rowUpdates.records_updated = updates.recordsUpdated;
    if (updates.duplicatesRemoved !== undefined) rowUpdates.duplicates_removed = updates.duplicatesRemoved;
    if (updates.errorMessage !== undefined) rowUpdates.error_message = updates.errorMessage;

    const { error } = await supabase.from("generation_jobs").update(rowUpdates).eq("id", id);
    return !error;
  } catch {
    return false;
  }
}

export async function fetchLatestGenerationJob(editionDate?: string): Promise<any | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  try {
    let query = supabase
      .from("generation_jobs")
      .select("*")
      .order("started_at", { ascending: false })
      .limit(1);

    if (editionDate) {
      query = query.eq("edition_date", editionDate);
    }

    const { data, error } = await query;
    if (error || !data || data.length === 0) return null;
    return data[0];
  } catch {
    return null;
  }
}
