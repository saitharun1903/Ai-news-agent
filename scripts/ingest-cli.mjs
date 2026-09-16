// CLI runner for Lunor ingestion
import { runIngestionPipeline } from "../lib/ingestion/pipeline.ts";

async function main() {
  console.log("=== Lunor Ingestion Runner ===");
  try {
    const res = await runIngestionPipeline();
    console.log("Ingestion completed successfully!");
    console.log(`- Articles: ${res.articlesCount}`);
    console.log(`- Clustered Events: ${res.articleGroupsCount}`);
    console.log(`- Papers: ${res.papersCount}`);
    console.log(`- Duration: ${res.durationMs}ms`);
    if (res.errors.length > 0) {
      console.warn("Warnings/Errors:", res.errors);
    }
  } catch (err) {
    console.error("Pipeline failed:", err);
    process.exit(1);
  }
}

main();
