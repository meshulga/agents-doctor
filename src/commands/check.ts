import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { compile } from "../compiler/index.js";
import { loadSot } from "../sot/loader.js";
import { walkProject } from "../walk.js";
import { normalizeLf } from "../compiler/rules.js";

export interface CheckIssue {
  kind: "missing" | "mismatch" | "extra";
  path: string;
}

export interface CheckResult {
  ok: boolean;
  issues: CheckIssue[];
}

export interface CheckOptions {
  projectRoot: string;
}

export async function runCheck(opts: CheckOptions): Promise<CheckResult> {
  const sot = loadSot(opts.projectRoot);
  const compiled = compile(sot);
  const issues: CheckIssue[] = [];

  // 1. compare every compiled file against disk
  for (const [rel, bytes] of compiled.files) {
    const abs = join(opts.projectRoot, rel);
    if (!existsSync(abs)) {
      issues.push({ kind: "missing", path: rel });
      continue;
    }
    const onDisk = readFileSync(abs);
    if (!buffersMatchLf(onDisk, bytes)) {
      issues.push({ kind: "mismatch", path: rel });
    }
  }

  // 2. walk for stray CLAUDE.md / AGENTS.md and stray .claude/skills,.claude/commands
  const expected = new Set(compiled.files.keys());
  for (const rel of walkProject(opts.projectRoot)) {
    const base = rel.split("/").at(-1);
    if (base === "CLAUDE.md" || base === "AGENTS.md") {
      if (!expected.has(rel)) issues.push({ kind: "extra", path: rel });
    }
    if (rel.startsWith(".claude/skills/") || rel.startsWith(".claude/commands/")) {
      if (!expected.has(rel)) issues.push({ kind: "extra", path: rel });
    }
  }

  return { ok: issues.length === 0, issues };
}

function buffersMatchLf(a: Buffer, b: Buffer): boolean {
  // Binary safety: if either contains a NUL byte we treat both as binary and compare byte-for-byte.
  if (a.includes(0) || b.includes(0)) return a.equals(b);
  const aLf = normalizeLf(a.toString("utf8"));
  const bLf = normalizeLf(b.toString("utf8"));
  return aLf === bLf;
}
