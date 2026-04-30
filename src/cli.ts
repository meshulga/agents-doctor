import { runSync } from "./commands/sync.js";

export async function main(argv: string[]): Promise<void> {
  const [cmd, ..._rest] = argv;
  switch (cmd) {
    case "sync": {
      const result = await runSync({ projectRoot: process.cwd() });
      console.log(`Wrote ${result.written.length} file(s):`);
      for (const f of result.written.sort()) console.log(`  ${f}`);
      return;
    }
    case "check":
      throw new Error("not implemented");
    case "init":
      throw new Error("not implemented");
    case undefined:
    case "-h":
    case "--help":
      printHelp();
      return;
    default:
      console.error(`unknown command: ${cmd}`);
      printHelp();
      process.exit(2);
  }
}

function printHelp(): void {
  console.log(
    [
      "agents-doctor — sync and verify AI coding agent configs",
      "",
      "Usage:",
      "  agents-doctor init    Bootstrap .agents-doctor/ from existing agent files",
      "  agents-doctor sync    Regenerate all agent configs from .agents-doctor/",
      "  agents-doctor check   Verify on-disk agent files match .agents-doctor/",
    ].join("\n"),
  );
}
