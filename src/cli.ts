import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { runCheck, type CheckIssue } from "./commands/check.js";
import { runInit } from "./commands/init.js";
import { runSync } from "./commands/sync.js";
import { renderDiff, renderTree, ui } from "./ui.js";

export async function main(argv: string[]): Promise<void> {
  const [cmd, ..._rest] = argv;
  switch (cmd) {
    case "-v":
    case "--version":
      console.log(readPackageVersion());
      return;
    case "sync": {
      const result = await runSync({ projectRoot: resolveProjectRoot() });
      printWritten(`Wrote ${result.written.length} file(s)`, result.written);
      return;
    }
    case "check": {
      const result = await runCheck({ projectRoot: resolveProjectRoot() });
      if (result.ok) {
        console.log(ui.ok("ok"));
        return;
      }
      printIssues(result.issues);
      process.exit(1);
    }
    case "init": {
      const result = await runInit({ projectRoot: resolveProjectRoot() });
      // After an interactive prompt the user's answer doesn't end with a
      // newline, so lead with one to keep the summary on its own line.
      console.log(
        `\n${ui.ok(`Initialized .agents-doc/ with ${result.rulesEmitted} rule(s).`)}`,
      );
      printWritten(`Wrote ${result.filesWritten.length} file(s)`, result.filesWritten);
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

function printWritten(header: string, files: string[]): void {
  console.log(ui.ok(`${header}:`));
  if (files.length > 0) console.log(renderTree(files));
}

function printIssues(issues: CheckIssue[]): void {
  // Group by kind so a long list of mismatches doesn't drown out the
  // (usually rarer) missing/extra entries.
  const buckets: Record<CheckIssue["kind"], CheckIssue[]> = {
    missing: [],
    mismatch: [],
    extra: [],
  };
  for (const i of issues) buckets[i.kind].push(i);

  for (const kind of ["missing", "mismatch", "extra"] as const) {
    const list = buckets[kind];
    if (list.length === 0) continue;
    console.log(ui.fail(`${list.length} ${kind}`));
    for (const i of list) {
      console.log(`  ${ui.dim("·")} ${i.path}`);
      if (kind === "mismatch" && i.expected && i.actual) {
        console.log(renderDiff(i.expected, i.actual));
      }
    }
  }
}

function resolveProjectRoot(): string {
  // npm sets INIT_CWD to the directory the user was in before npm changed
  // dirs to run a script. Prefer it so `npm --prefix /path/to/repo run
  // cli:dev -- check` targets the user's fixture, not the repo. Falls back
  // to process.cwd() for direct bin/global invocations.
  return process.env.INIT_CWD ?? process.cwd();
}

function readPackageVersion(): string {
  // dist/cli.js sits one level deep inside the published package; package.json
  // is at the package root.
  const here = dirname(fileURLToPath(import.meta.url));
  const pkg = JSON.parse(readFileSync(join(here, "..", "package.json"), "utf8")) as {
    version?: string;
  };
  return pkg.version ?? "unknown";
}

function printHelp(): void {
  console.log(
    [
      "agents-doc — sync and verify AI coding agent configs",
      "",
      "Usage:",
      "  agents-doc init    Bootstrap .agents-doc/ from existing agent files",
      "  agents-doc sync    Regenerate all agent configs from .agents-doc/",
      "  agents-doc check   Verify on-disk agent files match .agents-doc/",
    ].join("\n"),
  );
}
