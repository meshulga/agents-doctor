#!/usr/bin/env node
// Wipes examples/demo/ and re-populates it from examples/demo.template/.
// Files in the template that end with `.tpl` (e.g. CLAUDE.md.tpl) are
// renamed to drop the suffix on copy. The .tpl rename keeps real
// CLAUDE.md/AGENTS.md files out of the committed tree so the parent
// Claude Code session doesn't accidentally treat them as instructions.
// Used by `npm run demo:start` / `npm run demo:reset`.

import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  rmSync,
  statSync,
} from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const template = join(repoRoot, "examples/demo.template");
const working = join(repoRoot, "examples/demo");

if (!existsSync(template)) {
  console.error(`template missing: ${template}`);
  process.exit(1);
}

if (existsSync(working)) {
  rmSync(working, { recursive: true, force: true });
}
mkdirSync(working, { recursive: true });

for (const abs of allFilesUnder(template)) {
  const rel = relative(template, abs);
  const target = join(working, rel.endsWith(".tpl") ? rel.slice(0, -4) : rel);
  mkdirSync(dirname(target), { recursive: true });
  copyFileSync(abs, target);
}

console.log(`reset examples/demo from examples/demo.template`);

function allFilesUnder(dir) {
  const out = [];
  for (const name of readdirSync(dir).sort()) {
    const abs = join(dir, name);
    if (statSync(abs).isDirectory()) out.push(...allFilesUnder(abs));
    else out.push(abs);
  }
  return out;
}
