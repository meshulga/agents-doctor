import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { main } from "./cli.js";

// Pin the project root to examples/demo regardless of the user's cwd, so
// `npm run cli:demo -- check` always targets the bundled demo fixture.
const here = dirname(fileURLToPath(import.meta.url));
const demoRoot = join(here, "..", "examples", "demo");
process.env.INIT_CWD = demoRoot;

console.log(`[demo mode: examples/demo]`);

main(process.argv.slice(2)).catch((err) => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});
