/**
 * Central Timezone & Date Helper for Lunor.
 * The authoritative business publishing boundary for Lunor is Asia/Kolkata (IST, UTC+05:30).
 */

export const LUNOR_DEFAULT_TIMEZONE = "Asia/Kolkata";

/**
 * Returns the current business date in YYYY-MM-DD for the given timezone.
 * Uses Intl.DateTimeFormat to prevent any server-timezone or UTC skew.
 *
 * Example:
 * Sept 16, 2026, 11:59 PM IST -> "2026-09-16"
 * Sept 17, 2026, 12:00 AM IST -> "2026-09-17"
 */
export function getLunorBusinessDate(
  input?: Date | string | number,
  timeZone: string = LUNOR_DEFAULT_TIMEZONE
): string {
  const d = input ? (input instanceof Date ? input : new Date(input)) : new Date();
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatter.format(d); // Returns "YYYY-MM-DD"
}

/**
 * Formats a date string (e.g. "2026-09-17") or Date object into human-readable full date.
 * Example: "Thursday, September 17, 2026"
 */
export function formatLunorDate(
  dateInput: Date | string,
  timeZone: string = LUNOR_DEFAULT_TIMEZONE
): string {
  let d: Date;
  if (typeof dateInput === "string" && /^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
    // Parse YYYY-MM-DD in UTC noon to avoid any date-shifting
    const [y, m, day] = dateInput.split("-").map(Number);
    d = new Date(Date.UTC(y, m - 1, day, 12, 0, 0));
  } else {
    d = dateInput instanceof Date ? dateInput : new Date(dateInput);
  }

  return new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(d);
}

/**
 * Formats an ISO timestamp into a human-friendly IST recency / publication timestamp.
 * Avoids vague "Updated 10h ago" when a snapshot is active for the current day.
 *
 * Example:
 * Same day: "Updated today at 12:00 AM IST"
 * Previous day: "Last updated September 16 at 11:42 PM IST"
 */
export function formatLunorTime(
  isoString?: string,
  timeZone: string = LUNOR_DEFAULT_TIMEZONE
): string {
  if (!isoString) return "Updated at 12:00 AM IST";

  const d = new Date(isoString);
  const now = new Date();
  const todayStr = getLunorBusinessDate(now, timeZone);
  const eventDateStr = getLunorBusinessDate(d, timeZone);

  const timeFormatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  const timeStr = timeFormatter.format(d);

  if (todayStr === eventDateStr) {
    return `Updated today at ${timeStr} IST`;
  }

  const monthDayFormatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    month: "short",
    day: "numeric",
  });
  const monthDayStr = monthDayFormatter.format(d);

  return `Last updated ${monthDayStr} at ${timeStr} IST`;
}

/**
 * Returns the next scheduled generation time in IST (next 12:00 AM IST).
 */
export function getNextScheduledGenerationIST(): string {
  const now = new Date();
  const todayStr = getLunorBusinessDate(now, LUNOR_DEFAULT_TIMEZONE);
  const [y, m, d] = todayStr.split("-").map(Number);

  // Tomorrow's date
  const tomorrow = new Date(Date.UTC(y, m - 1, d + 1, 12, 0, 0));
  const tomorrowStr = getLunorBusinessDate(tomorrow, LUNOR_DEFAULT_TIMEZONE);

  return `${formatLunorDate(tomorrowStr, LUNOR_DEFAULT_TIMEZONE)} 12:00 AM IST`;
}
