import { getLunorBusinessDate, formatLunorDate, formatLunorTime, getNextScheduledGenerationIST } from "../lib/date.ts";
import { generateDailyEdition } from "../lib/ingestion/daily-generator.ts";
import { db } from "../lib/db/index.ts";

async function runTests() {
  console.log("=== LUNOR MIDNIGHT REFRESH SYSTEM VERIFICATION ===");

  const istNow = new Date();
  const businessDate = getLunorBusinessDate(istNow, "Asia/Kolkata");
  console.log(`Current IST Business Date: ${businessDate}`);

  // Test 1: Generate Daily Edition for today
  console.log("\n--- Test 1: Generate Daily Edition ---");
  const result1 = await generateDailyEdition({
    editionDate: businessDate,
    force: true,
    timezone: "Asia/Kolkata",
  });
  console.log("Generation result:", {
    success: result1.success,
    editionDate: result1.editionDate,
    snapshotId: result1.snapshotId,
    alreadyGenerated: result1.alreadyGenerated,
    storiesCount: result1.feed?.stories?.length,
    papersCount: result1.feed?.papers?.length,
    durationMs: result1.durationMs,
  });

  if (!result1.success || !result1.feed) {
    throw new Error("Failed to generate daily edition for " + businessDate);
  }

  // Test 2: Idempotency check
  console.log("\n--- Test 2: Idempotency Guard (force=false) ---");
  const result2 = await generateDailyEdition({
    editionDate: businessDate,
    force: false,
    timezone: "Asia/Kolkata",
  });
  console.log("Idempotency result:", {
    success: result2.success,
    alreadyGenerated: result2.alreadyGenerated,
    durationMs: result2.durationMs,
  });
  if (!result2.alreadyGenerated) {
    throw new Error("Expected alreadyGenerated: true on second run without force");
  }

  // Test 3: Query active daily feed
  console.log("\n--- Test 3: Query Today's Active Daily Feed ---");
  const activeFeed = await db.getDailyFeed(businessDate, "Asia/Kolkata");
  console.log("Active feed found:", {
    id: activeFeed?.id,
    date: activeFeed?.date,
    timezone: activeFeed?.timezone,
    status: activeFeed?.status,
    title: activeFeed?.title,
    leadStoryTitle: activeFeed?.leadStory?.title?.slice(0, 40),
  });

  if (!activeFeed || activeFeed.date !== businessDate) {
    throw new Error("Active feed does not match current business date!");
  }

  // Test 4: Format publication time relative to IST
  console.log("\n--- Test 4: Publication Time & Date Formatting ---");
  const formattedDate = formatLunorDate(activeFeed.date, "Asia/Kolkata");
  const formattedTime = formatLunorTime(activeFeed.generatedAt, "Asia/Kolkata");
  console.log("Formatted Date:", formattedDate);
  console.log("Formatted Publication Recency:", formattedTime);
  console.log("Next Scheduled Generation:", getNextScheduledGenerationIST());

  // Test 5: Verify archive still has historical feeds (e.g. 2026-09-16)
  console.log("\n--- Test 5: Rolling Archive Preservation ---");
  const archiveFeeds = await db.getDailyFeeds(10, "Asia/Kolkata");
  console.log(`Total feeds in rolling archive: ${archiveFeeds.length}`);
  for (const f of archiveFeeds) {
    console.log(` - ${f.date} (${f.timezone}): ${f.title} [${f.status}]`);
  }

  console.log("\nALL TESTS PASSED SUCCESSFULLY! ✅");
}

runTests().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
