import { Rule } from "../types.js";
import { LintIssue } from "./types.js";

const THRESHOLD = 40;

export function checkSize(rules: Rule[]): LintIssue[] {
  const out: LintIssue[] = [];
  for (const r of rules) {
    const count = countInstructions(r.body);
    if (count > THRESHOLD) {
      out.push({
        category: "instruction_count",
        bucket: "decisive",
        location: { ruleFile: r.filename },
        message: `${count} instructions in one rule (threshold ${THRESHOLD})`,
        suggestion: "split into smaller rules grouped by topic",
      });
    }
  }
  return out;
}

function countInstructions(body: string): number {
  const lines = body.split("\n");
  let inFence = false;
  let count = 0;
  for (const line of lines) {
    if (/^```/.test(line)) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;
    if (/^\s*-\s+\S/.test(line)) {
      count++;
      continue;
    }
    // Count sentence terminators in prose lines.
    const sentenceEnds = (line.match(/[.!?](\s|$)/g) ?? []).length;
    count += sentenceEnds;
  }
  return count;
}
