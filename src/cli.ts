import { runCheck } from "./commands/check.js";
import { runInit } from "./commands/init.js";
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
    case "check": {
      const result = await runCheck({ projectRoot: process.cwd() });
      if (result.ok) {
        console.log("ok");
        return;
      }
      for (const i of result.issues) {
        console.log(`${i.kind}: ${i.path}`);
      }
      process.exit(1);
    }
    case "init": {
      const result = await runInit({ projectRoot: process.cwd() });
      // After an interactive prompt the user's answer doesn't end with a
      // newline, so lead with one to keep the summary on its own line.
      console.log(
        `\nInitialized .agents-doctor/ with ${result.rulesEmitted} rule(s).`,
      );
      console.log(`Wrote ${result.filesWritten.length} file(s):`);
      for (const f of [...result.filesWritten].sort()) console.log(`  ${f}`);
      return;
    }
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
