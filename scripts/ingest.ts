import { runIngestionPipeline } from "../lib/ingestion/pipeline";

async function main() {
  console.log("=== Starting Lunor Live Ingestion ===");
  try {
    const res = await runIngestionPipeline();
    console.log("\nIngestion completed successfully!");
    console.log(`- Articles Fetched: ${res.articlesCount}`);
    console.log(`- Clustered Events: ${res.articleGroupsCount}`);
    console.log(`- Research Papers: ${res.papersCount}`);
    console.log(`- Duration: ${res.durationMs}ms`);
    if (res.errors.length > 0) {
      console.warn("Warnings:", res.errors);
    }
  } catch (err) {
    console.error("Pipeline failed:", err);
    process.exit(1);
  }
}

main();
