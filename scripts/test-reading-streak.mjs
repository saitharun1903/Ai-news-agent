import assert from "node:assert/strict";
import {
  getLocalDateString,
  getDailyActivityMap,
  calculateStreaks,
  formatReadingDuration,
} from "../lib/analytics/streak.ts";

console.log("=================================================");
console.log(" RUNNING LUNOR READING STREAK VERIFICATION SUITE ");
console.log("=================================================\n");

let passed = 0;
let total = 0;

function runTest(name, fn) {
  total++;
  try {
    fn();
    console.log(`✅ PASS: [Case ${total}] ${name}`);
    passed++;
  } catch (err) {
    console.error(`❌ FAIL: [Case ${total}] ${name}`);
    console.error(err);
  }
}

// Case 1: User reads 0 minutes today -> streak does NOT increment.
runTest("User reads 0m today: streak does not increment, todayQualified=false", () => {
  const sessions = [];
  const tz = "Asia/Kolkata";
  const dailyGoal = 25;
  const map = getDailyActivityMap(sessions, dailyGoal, tz);
  const result = calculateStreaks(map, tz, dailyGoal);

  assert.equal(result.currentStreak, 0);
  assert.equal(result.todayQualified, false);
  assert.equal(result.todayMinutes, 0);
  assert.equal(result.todayRemainingMinutes, 25);
  assert.equal(result.todayProgressPct, 0);
});

// Case 2: Daily goal = 25m. User reads 10m today -> todayProgress = 40%, todayQualified = false, streak does NOT increment.
runTest("Daily goal 25m, reads 10m today: progress=40%, todayQualified=false, streak=0", () => {
  const tz = "Asia/Kolkata";
  const now = new Date();
  const sessions = [
    {
      id: "s1",
      userId: "u1",
      paperId: "p1",
      paperTitle: "Test",
      startedAt: now.toISOString(),
      lastHeartbeat: now.toISOString(),
      timeSpentSeconds: 10 * 60, // 10 minutes
      completed: false,
    },
  ];
  const map = getDailyActivityMap(sessions, 25, tz);
  const result = calculateStreaks(map, tz, 25);

  assert.equal(result.todayMinutes, 10);
  assert.equal(result.todayProgressPct, 40);
  assert.equal(result.todayQualified, false);
  assert.equal(result.todayRemainingMinutes, 15);
  assert.equal(result.currentStreak, 0);
});

// Case 3: Daily goal = 25m. User reads 15m session 1 + 10m session 2 = 25m today -> qualifies today, streak increments by 1.
runTest("Daily goal 25m, 15m + 10m = 25m today: qualifies today, streak=1", () => {
  const tz = "Asia/Kolkata";
  const now = new Date();
  const sessions = [
    {
      id: "s1",
      userId: "u1",
      paperId: "p1",
      paperTitle: "Paper 1",
      startedAt: now.toISOString(),
      lastHeartbeat: now.toISOString(),
      timeSpentSeconds: 15 * 60,
      completed: false,
    },
    {
      id: "s2",
      userId: "u1",
      paperId: "p2",
      paperTitle: "Paper 2",
      startedAt: now.toISOString(),
      lastHeartbeat: now.toISOString(),
      timeSpentSeconds: 10 * 60,
      completed: true,
    },
  ];
  const map = getDailyActivityMap(sessions, 25, tz);
  const result = calculateStreaks(map, tz, 25);

  assert.equal(result.todayMinutes, 25);
  assert.equal(result.todayProgressPct, 100);
  assert.equal(result.todayQualified, true);
  assert.equal(result.todayRemainingMinutes, 0);
  assert.equal(result.currentStreak, 1);
  assert.equal(result.longestStreak, 1);
});

// Case 4: User completed yesterday (25m), today has 0m -> streak from yesterday remains intact today as active.
runTest("User completed yesterday (25m), today 0m: yesterday streak remains active (1 day)", () => {
  const tz = "Asia/Kolkata";
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const sessions = [
    {
      id: "s-yest",
      userId: "u1",
      paperId: "p1",
      paperTitle: "Yesterday Paper",
      startedAt: yesterday.toISOString(),
      lastHeartbeat: yesterday.toISOString(),
      timeSpentSeconds: 25 * 60,
      completed: true,
    },
  ];
  const map = getDailyActivityMap(sessions, 25, tz);
  const result = calculateStreaks(map, tz, 25);

  assert.equal(result.todayQualified, false);
  assert.equal(result.todayMinutes, 0);
  assert.equal(result.currentStreak, 1); // Yesterday's streak preserved during today's active window
  assert.equal(result.longestStreak, 1);
});

// Case 5: User completed 2 days ago (25m), missed yesterday (0m), reads 25m today -> broken yesterday means streak resets to 1 today.
runTest("User completed 2 days ago, missed yesterday, completed today: resets to 1", () => {
  const tz = "Asia/Kolkata";
  const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
  const today = new Date();
  const sessions = [
    {
      id: "s-2days",
      userId: "u1",
      paperId: "p1",
      paperTitle: "Older Paper",
      startedAt: twoDaysAgo.toISOString(),
      lastHeartbeat: twoDaysAgo.toISOString(),
      timeSpentSeconds: 30 * 60,
      completed: true,
    },
    {
      id: "s-today",
      userId: "u1",
      paperId: "p2",
      paperTitle: "Today Paper",
      startedAt: today.toISOString(),
      lastHeartbeat: today.toISOString(),
      timeSpentSeconds: 25 * 60,
      completed: true,
    },
  ];
  const map = getDailyActivityMap(sessions, 25, tz);
  const result = calculateStreaks(map, tz, 25);

  assert.equal(result.todayQualified, true);
  assert.equal(result.currentStreak, 1); // Reset because yesterday was missed
  assert.equal(result.longestStreak, 1);
});

// Case 6: User completed 3 consecutive days prior (Mon, Tue, Wed) and today is Thu with 25m -> streak = 4.
runTest("User completed 3 consecutive days prior + completed today: streak=4", () => {
  const tz = "Asia/Kolkata";
  const sessions = [];
  for (let i = 3; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    sessions.push({
      id: `s-${i}`,
      userId: "u1",
      paperId: `p-${i}`,
      paperTitle: `Paper Day ${i}`,
      startedAt: d.toISOString(),
      lastHeartbeat: d.toISOString(),
      timeSpentSeconds: 25 * 60,
      completed: true,
    });
  }
  const map = getDailyActivityMap(sessions, 25, tz);
  const result = calculateStreaks(map, tz, 25);

  assert.equal(result.todayQualified, true);
  assert.equal(result.currentStreak, 4);
  assert.equal(result.longestStreak, 4);
});

// Case 7: User changes daily goal from 25m to 45m. User has 30m today -> does not qualify under 45m.
runTest("Goal changed to 45m, user has 30m: todayQualified=false, remaining=15m", () => {
  const tz = "Asia/Kolkata";
  const now = new Date();
  const sessions = [
    {
      id: "s1",
      userId: "u1",
      paperId: "p1",
      paperTitle: "Test",
      startedAt: now.toISOString(),
      lastHeartbeat: now.toISOString(),
      timeSpentSeconds: 30 * 60, // 30 mins
      completed: true,
    },
  ];
  // With 45m daily goal
  const map = getDailyActivityMap(sessions, 45, tz);
  const result = calculateStreaks(map, tz, 45);

  assert.equal(result.todayMinutes, 30);
  assert.equal(result.todayQualified, false);
  assert.equal(result.todayRemainingMinutes, 15);
  assert.equal(result.currentStreak, 0);
});

// Case 8: User in Asia/Kolkata (UTC+5:30) reads at 11:45 PM local time (18:15 UTC) -> attributed strictly to local calendar date.
runTest("Asia/Kolkata timezone: 18:15 UTC is 23:45 IST on same date", () => {
  // 2026-09-16 18:15:00 UTC = 2026-09-16 23:45:00 in Asia/Kolkata
  const dateUtc = "2026-09-16T18:15:00.000Z";
  const kolkataDate = getLocalDateString(dateUtc, "Asia/Kolkata");
  assert.equal(kolkataDate, "2026-09-16");
});

// Case 9: User in America/Los_Angeles (UTC-8) reads at 9:00 PM local time (05:00 UTC next day) -> attributed strictly to local calendar date in America/Los_Angeles.
runTest("America/Los_Angeles timezone: 05:00 UTC next day is 21:00 previous day locally", () => {
  // 2026-09-17 05:00:00 UTC = 2026-09-16 22:00:00 (PDT UTC-7) or 21:00 (PST UTC-8)
  const dateUtc = "2026-09-17T05:00:00.000Z";
  const laDate = getLocalDateString(dateUtc, "America/Los_Angeles");
  assert.equal(laDate, "2026-09-16");
});

// Case 10: Longest streak is preserved even if current streak is reset to 0 after inactivity.
runTest("Longest streak is preserved after inactivity gap resets current streak to 0", () => {
  const tz = "Asia/Kolkata";
  const sessions = [];
  // User had a 5-day streak 10 days ago
  for (let i = 14; i >= 10; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    sessions.push({
      id: `s-${i}`,
      userId: "u1",
      paperId: `p-${i}`,
      paperTitle: `Old Streak Paper ${i}`,
      startedAt: d.toISOString(),
      lastHeartbeat: d.toISOString(),
      timeSpentSeconds: 30 * 60,
      completed: true,
    });
  }
  // Then no activity for 9 days until today (0 mins today)
  const map = getDailyActivityMap(sessions, 25, tz);
  const result = calculateStreaks(map, tz, 25);

  assert.equal(result.currentStreak, 0); // Broken due to 9-day gap
  assert.equal(result.longestStreak, 5); // 5-day best preserved
});

console.log("\n=================================================");
console.log(` RESULT: ${passed} / ${total} TESTS PASSED`);
console.log("=================================================\n");

if (passed !== total) {
  process.exit(1);
}
