import type { ReadingSession } from "../db/types.ts";

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
  goalMinutes?: number;
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
  timezone: string = "Asia/Kolkata",
  historicalGoalsMap?: Map<string, number> | Record<string, number>
): Map<string, DayReadingSummary> {
  const map = new Map<string, DayReadingSummary>();
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const todayStr = getLocalDateString(new Date(), timezone);

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
      goalMinutes: dailyGoalMinutes,
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

    // Determine goal for this specific date:
    // Today always evaluates against user's active dailyGoalMinutes.
    // Historical dates use their recorded goal if present; otherwise fallback to dailyGoalMinutes.
    let applicableGoal = dailyGoalMinutes;
    if (dateStr !== todayStr && historicalGoalsMap) {
      const hist =
        historicalGoalsMap instanceof Map
          ? historicalGoalsMap.get(dateStr)
          : historicalGoalsMap[dateStr];
      if (typeof hist === "number" && hist > 0) {
        applicableGoal = hist;
      }
    }
    item.goalMinutes = applicableGoal;

    const qualifyingThresholdSeconds = applicableGoal * 60;
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

  // Calculate longest streak across history
  let longest = 0;
  let tempStreak = 0;
  let prevTimestamp: number | null = null;

  for (const dateStr of qualifyingDates) {
    const [y, m, d] = dateStr.split("-").map(Number);
    const ts = Date.UTC(y, m - 1, d);
    if (prevTimestamp === null) {
      tempStreak = 1;
    } else {
      const diffDays = Math.round((ts - prevTimestamp) / (24 * 60 * 60 * 1000));
      if (diffDays === 1) {
        tempStreak += 1;
      } else if (diffDays > 1) {
        tempStreak = 1;
      }
    }
    prevTimestamp = ts;
    if (tempStreak > longest) longest = tempStreak;
  }

  // Calculate current active streak evaluated against today's local date
  const [ty, tm, td] = todayStr.split("-").map(Number);
  const todayMidnight = new Date(Date.UTC(ty, tm - 1, td));

  let currentStreak = 0;
  const dateSet = new Set(qualifyingDates);

  let checkDate = new Date(todayMidnight);
  if (!todayQualified) {
    // If today is not yet qualified, check if yesterday was qualified to preserve streak window
    checkDate.setUTCDate(checkDate.getUTCDate() - 1);
  }

  while (true) {
    const checkStr = checkDate.toISOString().split("T")[0];
    if (dateSet.has(checkStr)) {
      currentStreak += 1;
      checkDate.setUTCDate(checkDate.getUTCDate() - 1);
    } else {
      break;
    }
  }

  const lastCompletedDate = qualifyingDates[qualifyingDates.length - 1] || null;

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
