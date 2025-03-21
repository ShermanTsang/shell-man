// Re-export types and functions from modular files
import { fileURLToPath } from "url";
import { cli } from "./cli";

// Public API exports
export type { EnvironmentInfo } from "./types";
export { getEnvironmentInfo } from "./environment";
export { cli } from "./cli";

// Run the program if this file is executed directly
if (
  import.meta.url === `file://${process.argv[1]}` ||
  process.argv[1] === fileURLToPath(import.meta.url)
) {
  const isDebug =
    process.argv.includes("--debug") || process.argv.includes("-d");
  if (isDebug) console.log("Running CLI from direct execution");
  cli().catch((err) => {
    console.error("Unhandled error:", err);
    process.exit(1);
  });
}
