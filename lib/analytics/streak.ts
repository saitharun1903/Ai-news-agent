import { ReadingSession } from "@/lib/db/types";

// Timezone-aware date string YYYY-MM-DD
export function getLocalDateString(
  dateInput: Date | string | number,
  timeZone: string = "Asia/Kolkata"
): string {
  const d =
    typeof dateInput === "string" || typeof dateInput === "number"
      ? new Date(dateInput)
      : dateInput;
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
  return remMins > 0 ? `${hours}h ${remMins}m` : `${hours}h`;
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

export interface StreakResult {
  currentStreak: number;
  longestStreak: number;
  todaySeconds: number;
  todayMinutes: number;
  todayQualified: boolean;
  todayRemainingMinutes: number;
  todayProgressPct: number;
  lastCompletedDate: string | null;
}

export function getDailyActivityMap(
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

  const qualifyingThresholdSeconds = dailyGoalMinutes * 60;
  for (const [dateStr, item] of map.entries()) {
    const [year, month, day] = dateStr.split("-").map(Number);
    const d = new Date(year, month - 1, day);
    item.dayOfWeek = d.getDay();
    item.day = dayNames[item.dayOfWeek];
    item.minutes = Math.round(item.seconds / 60);
    item.metGoal = item.seconds >= qualifyingThresholdSeconds;
    item.qualifiesForStreak = item.seconds >= qualifyingThresholdSeconds;
  }

  return map;
}

export function calculateStreaks(
  dailyMap: Map<string, DayReadingSummary>,
  timezone: string = "Asia/Kolkata",
  dailyGoalMinutes: number = 25
): StreakResult {
  const todayStr = getLocalDateString(new Date(), timezone);
  const todayItem = dailyMap.get(todayStr);
  const todaySeconds = todayItem?.seconds || 0;
  const todayMinutes = Math.floor(todaySeconds / 60);
  const goalSeconds = dailyGoalMinutes * 60;
  const todayQualified = todaySeconds >= goalSeconds;
  const todayRemainingMinutes = Math.max(0, Math.ceil((goalSeconds - todaySeconds) / 60));
  const todayProgressPct = Math.min(100, Math.round((todaySeconds / goalSeconds) * 100));

  const qualifyingDates = Array.from(dailyMap.values())
    .filter((d) => d.qualifiesForStreak)
    .map((d) => d.date)
    .sort();

  if (qualifyingDates.length === 0) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      todaySeconds,
      todayMinutes,
      todayQualified,
      todayRemainingMinutes,
      todayProgressPct,
      lastCompletedDate: null,
    };
  }

  const qualifyingSet = new Set(qualifyingDates);
  const lastCompletedDate = qualifyingDates[qualifyingDates.length - 1];

  // 1. Longest streak across history
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
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = getLocalDateString(yesterday, timezone);

  let currentStreak = 0;

  if (qualifyingSet.has(todayStr)) {
    // Today qualified! Count today + consecutive days before today
    currentStreak = 1;
    let checkDate = new Date();
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
    // Yesterday qualified, and today is still in progress (not yet qualified).
    // The streak from yesterday remains active!
    currentStreak = 1;
    let checkDate = new Date(yesterday);
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
    // Neither today nor yesterday qualified -> streak has broken
    currentStreak = 0;
  }

  return {
    currentStreak,
    longestStreak: Math.max(longest, currentStreak),
    todaySeconds,
    todayMinutes,
    todayQualified,
    todayRemainingMinutes,
    todayProgressPct,
    lastCompletedDate,
  };
}
