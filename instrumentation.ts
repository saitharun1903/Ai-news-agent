export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    console.log("[ResearchPulse] Background ingestion scheduler initialized.");

    // Hourly background synchronization job
    const SYNC_INTERVAL_MS = 60 * 60 * 1000;

    setInterval(async () => {
      try {
        console.log("[Scheduler] Executing scheduled background sync of AI news and papers...");
        const { runIngestionPipeline } = await import("@/lib/ingestion/pipeline");
        await runIngestionPipeline();
        console.log("[Scheduler] Ingestion and briefing generation complete.");
      } catch (err) {
        console.error("[Scheduler] Background job error:", err);
      }
    }, SYNC_INTERVAL_MS);
  }
}
