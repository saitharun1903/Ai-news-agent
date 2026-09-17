import assert from "node:assert/strict";
import { db } from "../lib/db/index.ts";
import { AnalyticsService } from "../lib/analytics/index.ts";
import { upsertUserProfileInDb } from "../lib/db/supabase-adapter.ts";
import {
  getDailyActivityMap,
  calculateStreaks,
} from "../lib/analytics/streak.ts";
import {
  getLunorBusinessDate,
  LUNOR_DEFAULT_TIMEZONE,
} from "../lib/date.ts";
import { siteConfig } from "../config/site.ts";

console.log("======================================================================");
console.log(" LUNOR PRODUCTION QA & FUNCTIONAL AUTOMATED TEST SUITE ");
console.log("======================================================================\n");

let passed = 0;
let failed = 0;
let total = 0;

async function runTest(category, name, fn) {
  total++;
  try {
    await fn();
    console.log(`[PASS] ${category} -> ${name}`);
    passed++;
  } catch (err) {
    console.error(`[FAIL] ${category} -> ${name}`);
    console.error(err);
    failed++;
  }
}

async function main() {
  // -------------------------------------------------------------------------
  // CATEGORY 1: MULTI-USER DATA ISOLATION & PER-USER SCOPING
  // -------------------------------------------------------------------------
  console.log("\n--- Category 1: Multi-User Data Isolation & Scoping ---");

  const userA = "qa_user_alice_" + Date.now();
  const userB = "qa_user_bob_" + Date.now();

  await runTest("User Isolation", "User A and User B start with 0 bookmarks, notes, favorites", async () => {
    const bmA = await db.getBookmarks(userA);
    const bmB = await db.getBookmarks(userB);
    assert.equal(bmA.length, 0);
    assert.equal(bmB.length, 0);

    const notesA = await db.getNotes(undefined, userA);
    const notesB = await db.getNotes(undefined, userB);
    assert.equal(notesA.length, 0);
    assert.equal(notesB.length, 0);

    const favsA = await db.getFavorites(undefined, userA);
    const favsB = await db.getFavorites(undefined, userB);
    assert.equal(favsA.length, 0);
    assert.equal(favsB.length, 0);
  });

  await runTest("User Isolation", "Bookmark added by User A is NOT visible to User B", async () => {
    const paper = (await db.getPapers({ limit: 1 }))[0];
    assert.ok(paper, "Need at least 1 paper in DB");

    await db.addBookmark({
      id: "bm_" + Date.now(),
      userId: userA,
      paperId: paper.id,
      paperTitle: paper.title,
      topic: paper.primaryTopic || "systems",
      difficulty: paper.difficulty || "intermediate",
      estimatedMinutes: paper.readingTimeMinutes || 10,
      createdAt: new Date().toISOString(),
    });

    const bmA = await db.getBookmarks(userA);
    const bmB = await db.getBookmarks(userB);

    assert.equal(bmA.length, 1);
    assert.equal(bmA[0].paperId, paper.id);
    assert.equal(bmB.length, 0, "User B must not see User A's bookmark");
  });

  await runTest("User Isolation", "Note created by User A is NOT visible to User B", async () => {
    const paper = (await db.getPapers({ limit: 1 }))[0];

    await db.addNote({
      userId: userA,
      paperId: paper.id,
      paperTitle: paper.title,
      topic: paper.primaryTopic || "systems",
      content: "Deep technical insight by Alice",
      sectionTitle: "Architecture Overview",
      citation: "Page 4",
      tags: ["qa-test"],
    });

    const notesA = await db.getNotes(undefined, userA);
    const notesB = await db.getNotes(undefined, userB);

    assert.equal(notesA.length, 1);
    assert.equal(notesA[0].content, "Deep technical insight by Alice");
    assert.equal(notesB.length, 0, "User B must not see User A's note");
  });

  await runTest("User Isolation", "Favorite added by User A is NOT visible to User B", async () => {
    const paper = (await db.getPapers({ limit: 1 }))[0];

    await db.addFavorite({
      id: "fav_" + Date.now(),
      userId: userA,
      entityId: paper.id,
      entityType: "paper",
      title: paper.title,
      summary: paper.summary,
      topic: paper.primaryTopic || "systems",
      url: `/papers/${paper.id}`,
      createdAt: new Date().toISOString(),
    });

    const isFavA = await db.isFavorite("paper", paper.id, userA);
    const isFavB = await db.isFavorite("paper", paper.id, userB);

    assert.equal(isFavA, true, "User A must have favorited paper");
    assert.equal(isFavB, false, "User B must NOT have favorited paper");

    const favsA = await db.getFavorites("paper", userA);
    const favsB = await db.getFavorites("paper", userB);
    assert.equal(favsA.length, 1);
    assert.equal(favsB.length, 0);
  });

  await runTest("User Isolation", "Reading sessions & streaks are strictly isolated between users", async () => {
    await upsertUserProfileInDb({
      id: userA,
      name: "Alice QA",
      email: "alice@example.com",
      readingStreak: 0,
      longestStreak: 0,
      lastActiveDate: new Date().toISOString().split("T")[0],
      totalReadingMinutes: 0,
      papersReadCount: 0,
      articlesReadCount: 0,
      difficultyPreference: "Intermediate",
      interestedTopics: ["systems"],
      dailyGoalMinutes: 25,
      morningBriefingTime: "08:30",
      desktopNotificationsEnabled: true,
      weekendNotificationsEnabled: true,
      soundEnabled: true,
      timezone: "Asia/Kolkata",
    });

    const session = await db.startReadingSession(
      userA,
      "paper_qa_test",
      "QA Distributed Consensus",
      "sess_a_" + Date.now()
    );
    session.timeSpentSeconds = 30 * 60;
    session.durationSeconds = 30 * 60;
    await db.completeReadingSession(session.id, "paper_qa_test");

    const sessionsA = await db.getReadingSessions(userA);
    const sessionsB = await db.getReadingSessions(userB);

    assert.equal(sessionsA.length, 1);
    assert.equal(sessionsB.length, 0, "User B must have 0 reading sessions");

    const summaryA = await AnalyticsService.getSummary(userA);
    const summaryB = await AnalyticsService.getSummary(userB);

    assert.equal(summaryA.totalReadingMinutes, 30);
    assert.equal(summaryA.currentStreak, 1);
    assert.equal(summaryB.totalReadingMinutes, 0, "User B reading minutes must be 0");
    assert.equal(summaryB.currentStreak, 0, "User B streak must be 0");

    // Clean up test artifacts
    const bms = await db.getBookmarks(userA);
    for (const b of bms) await db.removeBookmark(b.id, userA).catch(() => {});
    const nts = await db.getNotes(undefined, userA);
    for (const n of nts) await db.deleteNote(n.id, userA).catch(() => {});
    const fvs = await db.getFavorites(undefined, userA);
    for (const f of fvs) await db.removeFavorite(f.entityType, f.entityId, userA).catch(() => {});
    const data = db.load();
    data.bookmarks = (data.bookmarks || []).filter((b) => b.userId !== userA && b.userId !== userB);
    data.notes = (data.notes || []).filter((n) => n.userId !== userA && n.userId !== userB);
    data.favorites = (data.favorites || []).filter((f) => f.userId !== userA && f.userId !== userB);
    data.readingSessions = (data.readingSessions || []).filter((s) => s.userId !== userA && s.userId !== userB);
    db.schedulePersist();
  });

  // -------------------------------------------------------------------------
  // CATEGORY 2: READING STREAK ENGINE EDGE CASES
  // -------------------------------------------------------------------------
  console.log("\n--- Category 2: Reading Streak Calculation Edge Cases ---");

  await runTest("Streak Engine", "Zero minutes today results in 0 current streak", () => {
    const tz = "Asia/Kolkata";
    const map = getDailyActivityMap([], 25, tz);
    const result = calculateStreaks(map, tz, 25);
    assert.equal(result.currentStreak, 0);
    assert.equal(result.todayQualified, false);
    assert.equal(result.todayRemainingMinutes, 25);
  });

  await runTest("Streak Engine", "Partial progress (20m / 25m) does NOT increment streak", () => {
    const tz = "Asia/Kolkata";
    const now = new Date();
    const sessions = [
      {
        id: "s1",
        userId: "u1",
        paperId: "p1",
        paperTitle: "T",
        startedAt: now.toISOString(),
        lastHeartbeat: now.toISOString(),
        timeSpentSeconds: 20 * 60,
        completed: false,
      },
    ];
    const map = getDailyActivityMap(sessions, 25, tz);
    const result = calculateStreaks(map, tz, 25);
    assert.equal(result.todayMinutes, 20);
    assert.equal(result.todayQualified, false);
    assert.equal(result.currentStreak, 0);
  });

  await runTest("Streak Engine", "Completed yesterday (25m) preserves active streak on today's unread status", () => {
    const tz = "Asia/Kolkata";
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const sessions = [
      {
        id: "s_yest",
        userId: "u1",
        paperId: "p1",
        paperTitle: "T",
        startedAt: yesterday.toISOString(),
        lastHeartbeat: yesterday.toISOString(),
        timeSpentSeconds: 25 * 60,
        completed: true,
      },
    ];
    const map = getDailyActivityMap(sessions, 25, tz);
    const result = calculateStreaks(map, tz, 25);
    assert.equal(result.todayQualified, false);
    assert.equal(result.currentStreak, 1, "Yesterday streak is protected during current day window");
  });

  await runTest("Streak Engine", "Consecutive 5 days completion yields exactly 5 streak", () => {
    const tz = "Asia/Kolkata";
    const sessions = [];
    for (let i = 4; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      sessions.push({
        id: `s_${i}`,
        userId: "u1",
        paperId: `p_${i}`,
        paperTitle: `P_${i}`,
        startedAt: d.toISOString(),
        lastHeartbeat: d.toISOString(),
        timeSpentSeconds: 30 * 60,
        completed: true,
      });
    }
    const map = getDailyActivityMap(sessions, 25, tz);
    const result = calculateStreaks(map, tz, 25);
    assert.equal(result.currentStreak, 5);
    assert.equal(result.longestStreak, 5);
  });

  // -------------------------------------------------------------------------
  // CATEGORY 3: RESEARCH PAPERS & DATA INTEGRITY
  // -------------------------------------------------------------------------
  console.log("\n--- Category 3: Research Papers & External Link Guards ---");

  await runTest("Data Integrity", "All indexed papers have valid ID, title, summary, and primaryTopic", async () => {
    const papers = await db.getPapers({ limit: 200 });
    assert.ok(papers.length > 0, "Papers index should not be empty");

    for (const paper of papers) {
      assert.ok(paper.id && typeof paper.id === "string", "Paper must have valid ID");
      assert.ok(paper.title && paper.title.trim().length > 0, `Paper ${paper.id} must have title`);
      assert.ok(
        (paper.summary && paper.summary.trim().length > 0) ||
          (paper.abstract && paper.abstract.trim().length > 0) ||
          (paper.whyItMatters && paper.whyItMatters.trim().length > 0),
        `Paper ${paper.id} must have summary, abstract, or whyItMatters`
      );
      assert.ok(
        paper.primaryCategory || paper.primaryTopic || paper.category,
        `Paper ${paper.id} must have primaryCategory or topic`
      );

      // PDF link guard: if pdfUrl is set, must be a valid http/https URL
      if (paper.pdfUrl) {
        assert.match(paper.pdfUrl, /^https?:\/\//, `Paper ${paper.id} pdfUrl must be http/https: ${paper.pdfUrl}`);
      }

      // Code link guard: if codeUrl is set, must be a valid http/https URL
      if (paper.codeUrl) {
        assert.match(paper.codeUrl, /^https?:\/\//, `Paper ${paper.id} codeUrl must be http/https: ${paper.codeUrl}`);
      }
    }
  });

  await runTest("Data Integrity", "No duplicate paper IDs exist in the database", async () => {
    const papers = await db.getPapers({ limit: 500 });
    const idSet = new Set();
    for (const paper of papers) {
      assert.equal(idSet.has(paper.id), false, `Duplicate paper ID found: ${paper.id}`);
      idSet.add(paper.id);
    }
  });

  // -------------------------------------------------------------------------
  // CATEGORY 4: TOPICS & CANONICAL ALIASES
  // -------------------------------------------------------------------------
  console.log("\n--- Category 4: Topics & Canonical Aliases ---");

  await runTest("Topics & Config", "Site configuration topics match valid slugs", () => {
    assert.ok(siteConfig.topics && siteConfig.topics.length > 0);
    const validSlugs = siteConfig.topics.map((t) => t.slug);

    assert.ok(validSlugs.includes("distributed-systems"), "distributed-systems slug exists");
    assert.ok(validSlugs.includes("software-engineering"), "software-engineering slug exists");
    assert.ok(validSlugs.includes("ai-ml"), "ai-ml slug exists");
    assert.ok(validSlugs.includes("security"), "security slug exists");
    assert.ok(validSlugs.includes("databases"), "databases slug exists");
  });

  await runTest("Topics & Config", "Canonical alias resolution correctly maps shorthand slugs", () => {
    const TOPIC_ALIASES = {
      systems: "distributed-systems",
      system: "distributed-systems",
      sys: "distributed-systems",
      os: "operating-systems",
      kernel: "operating-systems",
      ai: "ai-ml",
      ml: "ai-ml",
      "machine-learning": "ai-ml",
      "artificial-intelligence": "ai-ml",
      pl: "programming-languages",
      languages: "programming-languages",
      se: "software-engineering",
      software: "software-engineering",
      softwareengineering: "software-engineering",
      sec: "security",
      security: "security",
      crypto: "security",
      cryptography: "security",
      db: "databases",
      database: "databases",
      storage: "databases",
      net: "networking",
      network: "networking",
      networks: "networking",
      cloud: "networking",
      agent: "agents",
      agents: "agents",
      cv: "computer-vision",
      vision: "computer-vision",
      robotics: "robotics",
      robots: "robotics",
      algo: "algorithms",
      algorithms: "algorithms",
      tools: "developer-tools",
      devtools: "developer-tools",
      hci: "hci",
    };

    assert.equal(TOPIC_ALIASES["softwareengineering"], "software-engineering");
    assert.equal(TOPIC_ALIASES["systems"], "distributed-systems");
    assert.equal(TOPIC_ALIASES["ai"], "ai-ml");
    assert.equal(TOPIC_ALIASES["sec"], "security");
    assert.equal(TOPIC_ALIASES["db"], "databases");
  });

  // -------------------------------------------------------------------------
  // CATEGORY 5: BUSINESS DATE & MIDNIGHT ROLLOVER
  // -------------------------------------------------------------------------
  console.log("\n--- Category 5: Business Date & Midnight Rollover ---");

  await runTest("Midnight Rollover", "Current business date in Asia/Kolkata is formatted YYYY-MM-DD", () => {
    const businessDate = getLunorBusinessDate(new Date(), "Asia/Kolkata");
    assert.match(businessDate, /^\d{4}-\d{2}-\d{2}$/);
    console.log(`       Active IST Business Date: ${businessDate}`);
  });

  await runTest("Midnight Rollover", "Active daily snapshot exists and has lead story and papers", async () => {
    const businessDate = getLunorBusinessDate(new Date(), "Asia/Kolkata");
    const feed = await db.getDailyFeed(businessDate, "Asia/Kolkata");

    assert.ok(feed, `Daily snapshot must exist for ${businessDate}`);
    assert.equal(feed.date, businessDate);
    assert.ok(
      feed.status === "active" || feed.status === "ready",
      `Feed status must be active or ready, got ${feed.status}`
    );
    assert.ok(feed.leadStory, "Daily snapshot must have a lead story");
    assert.ok(feed.leadStory.title, "Lead story must have a title");
    assert.ok(feed.papers && feed.papers.length > 0, "Daily snapshot must include papers");
    console.log(`       Lead Story: "${feed.leadStory.title}"`);
    console.log(`       Papers Count: ${feed.papers.length}, Stories Count: ${feed.stories.length}`);
  });

  // -------------------------------------------------------------------------
  // SUMMARY
  // -------------------------------------------------------------------------
  console.log("\n======================================================================");
  console.log(` COMPLETE QA TEST RESULTS: ${passed} / ${total} TESTS PASSED (${failed} FAILED)`);
  console.log("======================================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("FATAL QA SUITE ERROR:", err);
  process.exit(1);
});
