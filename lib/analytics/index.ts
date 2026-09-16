import { db } from "@/lib/db";
import { ReadingSession, Paper, Note, UserFavorite, Bookmark, UserProfile } from "@/lib/db/types";

// Standard canonical topic taxonomy
export const CANONICAL_TOPICS: { id: string; name: string; matchers: string[] }[] = [
  {
    id: "llms-transformers",
    name: "LLMs & Transformers",
    matchers: ["llm", "foundation models", "language model", "transformer", "gpt", "cs.cl", "computation and language"],
  },
  {
    id: "ai-agents",
    name: "AI Agents & Systems",
    matchers: ["agent", "multi-agent", "autonomous", "cs.ma", "tool use", "planning"],
  },
  {
    id: "rag-retrieval",
    name: "RAG & Knowledge Retrieval",
    matchers: ["rag", "retrieval", "vector", "embedding", "search", "dense retrieval"],
  },
  {
    id: "vision-multimodal",
    name: "Computer Vision & Multimodal",
    matchers: ["vision", "multimodal", "cs.cv", "diffusion", "image", "video", "visual"],
  },
  {
    id: "ai-infrastructure",
    name: "AI Infrastructure & Efficiency",
    matchers: ["infrastructure", "quantization", "inference", "hardware", "efficiency", "distributed", "serving"],
  },
  {
    id: "robotics-embodied",
    name: "Robotics & Embodied AI",
    matchers: ["robot", "embodied", "manipulation", "cs.ro", "locomotion"],
  },
  {
    id: "ml-reasoning",
    name: "Machine Learning & Reasoning",
    matchers: ["machine learning", "cs.ai", "cs.lg", "reasoning", "math.oc", "artificial intelligence", "theory"],
  },
  {
    id: "speech-audio",
    name: "Speech & Audio AI",
    matchers: ["speech", "audio", "cs.sd", "voice", "sound", "acoustic"],
  },
];

export function normalizeTopic(rawCategory?: string): { id: string; name: string } {
  if (!rawCategory) return { id: "ml-reasoning", name: "Machine Learning & Reasoning" };
  const lower = rawCategory.toLowerCase();
  for (const t of CANONICAL_TOPICS) {
    if (t.matchers.some((m) => lower.includes(m))) {
      return { id: t.id, name: t.name };
    }
  }
  return { id: "ml-reasoning", name: "Machine Learning & Reasoning" };
}

// Timezone-aware date string YYYY-MM-DD
export function getLocalDateString(dateInput: Date | string | number, timeZone: string = "Asia/Kolkata"): string {
  const d = typeof dateInput === "string" || typeof dateInput === "number" ? new Date(dateInput) : dateInput;
  try {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(d);
  } catch {
    return d.toISOString().split("T")[0];
  }
}

export function formatReadingDuration(totalSeconds: number): string {
  if (!totalSeconds || totalSeconds <= 0) return "0m";
  if (totalSeconds < 60) return "< 1 min";
  const mins = Math.round(totalSeconds / 60);
  if (mins < 60) return mins + " min";
  const hours = Math.floor(mins / 60);
  const remMins = mins % 60;
  return remMins > 0 ? (hours + "h " + remMins + "m") : (hours + "h");
}

export interface DayReadingSummary {
  date: string;
  day: string;
  dayOfWeek: number;
  minutes: number;
  seconds: number;
  papersCompleted: number;
  metGoal: boolean;
  qualifiesForStreak: boolean;
}

export interface AnalyticsSummary {
  currentStreak: number;
  longestStreak: number;
  papersRead: number;
  totalReadingMinutes: number;
  totalReadingSeconds: number;
  totalReadingFormatted: string;
  notesCount: number;
  favoritesCount: number;
  queuedPapersCount: number;
  dailyGoalMinutes: number;
  weeklyChangeMinutes: number;
  weeklyChangePapers: number;
  userTimezone: string;
  isNewUser: boolean;
  observations: string[];
}

export interface TopicAffinityItem {
  topicId: string;
  topicName: string;
  interactionCount: number;
  percentage: number;
}

export interface HeatmapDay {
  date: string;
  dayOfWeek: number;
  minutes: number;
  papersCompleted: number;
  level: 0 | 1 | 2 | 3;
}

export class AnalyticsService {
  static getDailyActivityMap(
    sessions: ReadingSession[],
    dailyGoalMinutes: number = 25,
    timezone: string = "Asia/Kolkata"
  ): Map<string, DayReadingSummary> {
    const map = new Map<string, DayReadingSummary>();
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    for (const session of sessions) {
      const localDate = getLocalDateString(session.startedAt || session.lastUpdatedAt, timezone);
      const existing = map.get(localDate) || {
        date: localDate,
        day: "",
        dayOfWeek: 0,
        minutes: 0,
        seconds: 0,
        papersCompleted: 0,
        metGoal: false,
        qualifiesForStreak: false,
      };

      existing.seconds += session.timeSpentSeconds || 0;
      if (session.completed) {
        existing.papersCompleted += 1;
      }
      map.set(localDate, existing);
    }

    for (const [dateStr, item] of map.entries()) {
      const [year, month, day] = dateStr.split("-").map(Number);
      const d = new Date(year, month - 1, day);
      item.dayOfWeek = d.getDay();
      item.day = dayNames[item.dayOfWeek];
      item.minutes = Math.round(item.seconds / 60);
      item.metGoal = item.minutes >= dailyGoalMinutes;
      item.qualifiesForStreak = item.seconds >= 60 || item.papersCompleted > 0;
    }

    return map;
  }

  static calculateStreaks(
    dailyMap: Map<string, DayReadingSummary>,
    timezone: string = "Asia/Kolkata"
  ): { currentStreak: number; longestStreak: number } {
    const qualifyingDates = Array.from(dailyMap.values())
      .filter((d) => d.qualifiesForStreak)
      .map((d) => d.date)
      .sort();

    if (qualifyingDates.length === 0) {
      return { currentStreak: 0, longestStreak: 0 };
    }

    const qualifyingSet = new Set(qualifyingDates);

    // 1. Longest streak
    let longest = 0;
    let currentRun = 0;
    let prevDate: Date | null = null;

    for (const dateStr of qualifyingDates) {
      const [y, m, d] = dateStr.split("-").map(Number);
      const curr = new Date(Date.UTC(y, m - 1, d));

      if (prevDate) {
        const diffDays = Math.round((curr.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays === 1) {
          currentRun += 1;
        } else {
          currentRun = 1;
        }
      } else {
        currentRun = 1;
      }

      if (currentRun > longest) {
        longest = currentRun;
      }
      prevDate = curr;
    }

    // 2. Current streak in user timezone
    const todayStr = getLocalDateString(new Date(), timezone);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = getLocalDateString(yesterday, timezone);

    let currentStreak = 0;
    let checkDate = new Date();

    if (qualifyingSet.has(todayStr)) {
      currentStreak = 1;
      while (true) {
        checkDate.setDate(checkDate.getDate() - 1);
        const checkStr = getLocalDateString(checkDate, timezone);
        if (qualifyingSet.has(checkStr)) {
          currentStreak += 1;
        } else {
          break;
        }
      }
    } else if (qualifyingSet.has(yesterdayStr)) {
      currentStreak = 1;
      checkDate = new Date(yesterday);
      while (true) {
        checkDate.setDate(checkDate.getDate() - 1);
        const checkStr = getLocalDateString(checkDate, timezone);
        if (qualifyingSet.has(checkStr)) {
          currentStreak += 1;
        } else {
          break;
        }
      }
    } else {
      currentStreak = 0;
    }

    return {
      currentStreak,
      longestStreak: Math.max(longest, currentStreak),
    };
  }

  static getWeeklyActivity(
    sessions: ReadingSession[],
    dailyGoalMinutes: number = 25,
    timezone: string = "Asia/Kolkata"
  ): DayReadingSummary[] {
    const dailyMap = this.getDailyActivityMap(sessions, dailyGoalMinutes, timezone);
    const result: DayReadingSummary[] = [];
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = getLocalDateString(d, timezone);
      const [year, month, day] = dateStr.split("-").map(Number);
      const dayDate = new Date(year, month - 1, day);
      const dayOfWeek = dayDate.getDay();

      const existing = dailyMap.get(dateStr);
      if (existing) {
        result.push(existing);
      } else {
        result.push({
          date: dateStr,
          day: dayNames[dayOfWeek],
          dayOfWeek,
          minutes: 0,
          seconds: 0,
          papersCompleted: 0,
          metGoal: false,
          qualifiesForStreak: false,
        });
      }
    }

    return result;
  }

  static getHeatmap(
    sessions: ReadingSession[],
    timezone: string = "Asia/Kolkata"
  ): HeatmapDay[] {
    const dailyMap = this.getDailyActivityMap(sessions, 25, timezone);
    const days: HeatmapDay[] = [];

    // Past 91 days (13 full weeks)
    for (let i = 90; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = getLocalDateString(d, timezone);
      const [year, month, day] = dateStr.split("-").map(Number);
      const dayOfWeek = new Date(year, month - 1, day).getDay();

      const item = dailyMap.get(dateStr);
      const minutes = item ? item.minutes : 0;
      const completed = item ? item.papersCompleted : 0;

      let level: 0 | 1 | 2 | 3 = 0;
      if (minutes > 30) level = 3;
      else if (minutes >= 15) level = 2;
      else if (minutes > 0 || completed > 0) level = 1;

      days.push({
        date: dateStr,
        dayOfWeek,
        minutes,
        papersCompleted: completed,
        level,
      });
    }

    return days;
  }

  static async getTopicAffinity(userId: string): Promise<TopicAffinityItem[]> {
    const [sessions, notes, favorites, bookmarks, papers] = await Promise.all([
      db.getReadingSessions(userId),
      db.getNotes(),
      db.getFavorites(),
      db.getBookmarks(),
      db.getPapers(),
    ]);

    const paperMap = new Map<string, Paper>();
    for (const p of papers) paperMap.set(p.id, p);

    const scores = new Map<string, { name: string; score: number }>();

    for (const s of sessions) {
      const paper = paperMap.get(s.paperId);
      const norm = normalizeTopic(paper?.primaryCategory || (paper?.categories && paper.categories[0]));
      const pts = 1 + (s.completed ? 2 : 0) + Math.floor((s.timeSpentSeconds || 0) / 300);
      const prev = scores.get(norm.id) || { name: norm.name, score: 0 };
      prev.score += pts;
      scores.set(norm.id, prev);
    }

    for (const note of notes) {
      const norm = normalizeTopic(note.topic);
      const prev = scores.get(norm.id) || { name: norm.name, score: 0 };
      prev.score += 2;
      scores.set(norm.id, prev);
    }

    for (const f of favorites) {
      if (f.entityType === "paper" || f.entityType === "topic") {
        const norm = normalizeTopic(f.category);
        const prev = scores.get(norm.id) || { name: norm.name, score: 0 };
        prev.score += 2;
        scores.set(norm.id, prev);
      }
    }

    for (const b of bookmarks) {
      if (b.itemType === "paper") {
        const norm = normalizeTopic(b.category);
        const prev = scores.get(norm.id) || { name: norm.name, score: 0 };
        prev.score += 1;
        scores.set(norm.id, prev);
      }
    }

    const totalScore = Array.from(scores.values()).reduce((sum, item) => sum + item.score, 0);
    if (totalScore === 0) return [];

    return Array.from(scores.entries())
      .map(([topicId, item]) => ({
        topicId,
        topicName: item.name,
        interactionCount: item.score,
        percentage: Math.round((item.score / totalScore) * 100),
      }))
      .sort((a, b) => b.interactionCount - a.interactionCount);
  }

  static async getSummary(userId: string): Promise<AnalyticsSummary> {
    const [profile, sessions, notes, favorites, bookmarks] = await Promise.all([
      db.getUserProfile(),
      db.getReadingSessions(userId),
      db.getNotes(),
      db.getFavorites(),
      db.getBookmarks(),
    ]);

    const tz = profile.timezone || "Asia/Kolkata";
    const dailyGoal = profile.dailyGoalMinutes || 25;

    const dailyMap = this.getDailyActivityMap(sessions, dailyGoal, tz);
    const { currentStreak, longestStreak } = this.calculateStreaks(dailyMap, tz);

    const completedPaperIds = new Set(
      sessions.filter((s) => s.completed).map((s) => s.paperId)
    );
    const papersRead = completedPaperIds.size;

    const totalReadingSeconds = sessions.reduce((sum, s) => sum + (s.timeSpentSeconds || 0), 0);
    const totalReadingMinutes = Math.round(totalReadingSeconds / 60);
    const totalReadingFormatted = formatReadingDuration(totalReadingSeconds);

    const thisWeekCutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const priorWeekCutoff = Date.now() - 14 * 24 * 60 * 60 * 1000;

    let thisWeekSecs = 0;
    let priorWeekSecs = 0;
    let thisWeekPapers = 0;
    let priorWeekPapers = 0;

    for (const s of sessions) {
      const ts = new Date(s.startedAt || s.lastUpdatedAt).getTime();
      if (ts >= thisWeekCutoff) {
        thisWeekSecs += s.timeSpentSeconds || 0;
        if (s.completed) thisWeekPapers += 1;
      } else if (ts >= priorWeekCutoff) {
        priorWeekSecs += s.timeSpentSeconds || 0;
        if (s.completed) priorWeekPapers += 1;
      }
    }

    const weeklyChangeMinutes = Math.round((thisWeekSecs - priorWeekSecs) / 60);
    const weeklyChangePapers = thisWeekPapers - priorWeekPapers;

    const isNewUser = sessions.length === 0 && notes.length === 0 && favorites.length === 0;

    const observations: string[] = [];
    if (isNewUser) {
      observations.push("Your reading analytics will appear after your first research session.");
    } else {
      if (currentStreak >= 3) {
        observations.push("You have maintained a " + currentStreak + "-day consecutive research habit.");
      } else if (currentStreak > 0) {
        observations.push("Active reading habit started today.");
      }

      if (weeklyChangeMinutes > 0 && priorWeekSecs > 0) {
        const pct = Math.round((weeklyChangeMinutes / Math.round(priorWeekSecs / 60)) * 100);
        observations.push("You dedicated " + pct + "% more time to research reading this week.");
      }

      if (papersRead > 0) {
        observations.push("You have completed " + papersRead + " research preprint" + (papersRead === 1 ? "" : "s") + ".");
      }

      const longestSession = sessions.reduce((max, s) => Math.max(max, s.timeSpentSeconds || 0), 0);
      if (longestSession >= 600) {
        const maxMins = Math.round(longestSession / 60);
        observations.push("Your longest focused reading session was " + maxMins + " minutes.");
      }
    }

    return {
      currentStreak,
      longestStreak,
      papersRead,
      totalReadingMinutes,
      totalReadingSeconds,
      totalReadingFormatted,
      notesCount: notes.length,
      favoritesCount: favorites.length,
      queuedPapersCount: bookmarks.length,
      dailyGoalMinutes: dailyGoal,
      weeklyChangeMinutes,
      weeklyChangePapers,
      userTimezone: tz,
      isNewUser,
      observations,
    };
  }
}
