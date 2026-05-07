#!/usr/bin/env node
// Runs the full agents-doc demo loop end-to-end: reset → init → check →
// drift → sync → check. Intended to be invoked via `npm run demo`.

import { spawnSync, type SpawnSyncOptions } from "node:child_process";
import { readdirSync, readFileSync, writeFileSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { renderTree } from "../src/ui.ts";

const repoRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const demo = join(repoRoot, "examples/demo");

const BOLD = "[1m";
const DIM = "[2m";
const RESET = "[0m";

function step(n: number, label: string): void {
  console.log(`\n${BOLD}── step ${n}: ${label} ──${RESET}`);
}

interface RunOpts extends SpawnSyncOptions {
  allowFailure?: boolean;
}

function run(cmd: string, args: string[], opts: RunOpts = {}): number {
  const { allowFailure, ...spawnOpts } = opts;
  const r = spawnSync(cmd, args, { stdio: "inherit", ...spawnOpts });
  if (r.status !== 0 && !allowFailure) {
    console.error(`\ncommand failed: ${cmd} ${args.join(" ")}`);
    process.exit(r.status ?? 1);
  }
  return r.status ?? 0;
}

function tree(root: string): void {
  console.log(renderTree(filesUnder(root, root)));
}

function filesUnder(root: string, dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir).sort()) {
    const abs = join(dir, name);
    const rel = relative(root, abs).split(/\\/g).join("/");
    if (statSync(abs).isDirectory()) out.push(...filesUnder(root, abs));
    else out.push(rel);
  }
  return out;
}

step(1, "Reset examples/demo from the brownfield template");
run("node", [join(repoRoot, "scripts/demo-reset.mjs")]);

step(2, "Brownfield project tree (no .agents-doc/ yet)");
tree(demo);

step(3, "Run init — picks 'claude' as the priority agent (via env var)");
run("npm", ["--prefix", repoRoot, "run", "cli:demo", "--silent", "--", "init"], {
  env: { ...process.env, AGENTS_DOC_PRIORITY: "claude" },
});

step(4, "Project tree after init");
tree(demo);

step(5, "Generated rule files in .agents-doc/rules/");
for (const f of readdirSync(join(demo, ".agents-doc/rules")).sort()) {
  console.log(`${DIM}--- ${f} ---${RESET}`);
  console.log(readFileSync(join(demo, ".agents-doc/rules", f), "utf8"));
}

step(6, "Generated CLAUDE.md (root)");
console.log(readFileSync(join(demo, "CLAUDE.md"), "utf8"));

step(7, "Generated AGENTS.md (root) — note the codex-only rule, no claude-only");
console.log(readFileSync(join(demo, "AGENTS.md"), "utf8"));

step(8, "Run check — should be clean");
run("npm", ["--prefix", repoRoot, "run", "cli:demo", "--silent", "--", "check"]);

step(9, "Demonstrate drift: tamper with a rule body");
const stylePath = readdirSync(join(demo, ".agents-doc/rules"))
  .map((f) => join(demo, ".agents-doc/rules", f))
  .find((p) => p.endsWith("-code-style.md"));
if (!stylePath) {
  console.error("could not find code-style rule");
  process.exit(1);
}
const before = readFileSync(stylePath, "utf8");
writeFileSync(stylePath, before.replace("2-space", "4-space"));
console.log(`edited ${relative(demo, stylePath)} (2-space → 4-space)`);

step(10, "Run check again — should report mismatch");
run("npm", ["--prefix", repoRoot, "run", "cli:demo", "--silent", "--", "check"], {
  allowFailure: true,
});

step(11, "Run sync to recover");
run("npm", ["--prefix", repoRoot, "run", "cli:demo", "--silent", "--", "sync"]);

step(12, "Run check one more time — clean");
run("npm", ["--prefix", repoRoot, "run", "cli:demo", "--silent", "--", "check"]);

console.log(`\n${BOLD}done${RESET} — examples/demo is now in a synced state.`);
console.log(`${DIM}run 'npm run demo:reset' to start over.${RESET}`);
