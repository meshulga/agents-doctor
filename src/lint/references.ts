import { existsSync } from "node:fs";
import { join } from "node:path";
import { Rule } from "../types.js";
import { LintIssue } from "./types.js";

// `@` preceded by start-of-line or whitespace, followed by a token that
// includes at least one '/' or '.' so we don't match @decorators or twitter
// handles. The path token uses [A-Za-z0-9._/-]+.
const REF_RE = /(^|\s)@([A-Za-z0-9._-]+(?:\/[A-Za-z0-9._-]+)+|[A-Za-z0-9_-]+\.[A-Za-z0-9._-]+)/g;

export function checkReferences(rules: Rule[], projectRoot: string): LintIssue[] {
  const out: LintIssue[] = [];
  for (const r of rules) {
    const lines = r.body.split("\n");
    let inFence = false;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i] ?? "";
      if (/^```/.test(line)) {
        inFence = !inFence;
        continue;
      }
      if (inFence) continue;
      for (const m of line.matchAll(REF_RE)) {
        const ref = m[2]!;
        if (!existsSync(join(projectRoot, ref))) {
          out.push({
            category: "dead_reference",
            bucket: "mechanical",
            location: { ruleFile: r.filename, line: i + 1 },
            message: `@${ref} does not resolve to a file in the project`,
            suggestion: `remove the reference or fix the path`,
          });
        }
      }
    }
  }
  return out;
}
