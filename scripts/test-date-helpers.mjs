import assert from "assert";
import {
  getLunorBusinessDate,
  formatLunorDate,
  formatLunorTime,
  getNextScheduledGenerationIST,
  LUNOR_DEFAULT_TIMEZONE,
} from "../lib/date.ts";

console.log("=================================================");
console.log(" TESTING LUNOR DATE & TIMEZONE HELPERS           ");
console.log("=================================================");

// Case 1: Exactly 11:59 PM IST on September 16, 2026
// In UTC: 11:59 PM IST = 18:29:00 UTC
const sept16Night = new Date("2026-09-16T18:29:00.000Z");
const date1 = getLunorBusinessDate(sept16Night);
assert.strictEqual(date1, "2026-09-16", "11:59 PM IST must be 2026-09-16");
console.log("✅ PASS: [1] Sept 16 11:59 PM IST correctly returns 2026-09-16");

// Case 2: Exactly 12:00 AM IST on September 17, 2026
// In UTC: 12:00 AM IST = 18:30:00 UTC on Sept 16
const sept17Midnight = new Date("2026-09-16T18:30:00.000Z");
const date2 = getLunorBusinessDate(sept17Midnight);
assert.strictEqual(date2, "2026-09-17", "12:00 AM IST must be 2026-09-17");
console.log("✅ PASS: [2] Sept 17 12:00 AM IST correctly rolls over to 2026-09-17");

// Case 3: Exactly 1:00 AM IST on September 17, 2026
// In UTC: 1:00 AM IST = 19:30:00 UTC on Sept 16
const sept17OneAm = new Date("2026-09-16T19:30:00.000Z");
const date3 = getLunorBusinessDate(sept17OneAm);
assert.strictEqual(date3, "2026-09-17", "1:00 AM IST must be 2026-09-17");
console.log("✅ PASS: [3] Sept 17 1:00 AM IST (current time) correctly returns 2026-09-17");

// Case 4: Formatting 2026-09-17
const formattedDate = formatLunorDate("2026-09-17");
assert.strictEqual(formattedDate, "Thursday, September 17, 2026");
console.log(`✅ PASS: [4] formatLunorDate('2026-09-17') -> "${formattedDate}"`);

// Case 5: Formatting publication time
const timeText = formatLunorTime(sept17Midnight.toISOString());
assert.ok(timeText.includes("IST"), "Time text must include IST");
console.log(`✅ PASS: [5] formatLunorTime -> "${timeText}"`);

// Case 6: Next scheduled run
const nextRun = getNextScheduledGenerationIST();
assert.ok(nextRun.includes("12:00 AM IST"), "Next run must be at 12:00 AM IST");
console.log(`✅ PASS: [6] getNextScheduledGenerationIST -> "${nextRun}"`);

console.log("\nALL 6 DATE HELPER TESTS PASSED!\n");
