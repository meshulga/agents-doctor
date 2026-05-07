import { Rule } from "../types.js";
import { LintIssue } from "./types.js";

// Order matters: longer phrases first, so "as appropriate" wins over "appropriate".
const VAGUE_PHRASES: string[] = [
  "as appropriate",
  "where applicable",
  "when relevant",
  "and so on",
  "best practices",
  "clean code",
  "as needed",
  "if necessary",
  "appropriately",
  "appropriate",
  "etc.",
  "etc,",
];

export function checkVague(rules: Rule[]): LintIssue[] {
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
      const lower = line.toLowerCase();
      const consumed = new Array<boolean>(line.length).fill(false);
      for (const phrase of VAGUE_PHRASES) {
        let from = 0;
        while (true) {
          const idx = lower.indexOf(phrase, from);
          if (idx < 0) break;
          if (!hasWordBoundary(line, idx, phrase.length)) {
            from = idx + 1;
            continue;
          }
          if (anyConsumed(consumed, idx, phrase.length)) {
            from = idx + phrase.length;
            continue;
          }
          markConsumed(consumed, idx, phrase.length);
          out.push({
            category: "vague_phrasing",
            bucket: "decisive",
            location: { ruleFile: r.filename, line: i + 1 },
            message: `vague phrase "${line.slice(idx, idx + phrase.length)}"`,
            suggestion: "replace with a concrete value or rule",
          });
          from = idx + phrase.length;
        }
      }
    }
  }
  return out;
}

function hasWordBoundary(line: string, idx: number, len: number): boolean {
  const before = idx === 0 ? "" : line[idx - 1] ?? "";
  const after = idx + len >= line.length ? "" : line[idx + len] ?? "";
  // Phrases that end in punctuation (etc. / etc,) are self-bounded on the right.
  const phraseEnd = line.slice(idx + len - 1, idx + len);
  const rightOk = after === "" || /[\s.,;:!?)\]]/.test(after) || /[.,]/.test(phraseEnd);
  const leftOk = before === "" || /[\s(\[]/.test(before);
  return leftOk && rightOk;
}

function anyConsumed(consumed: boolean[], idx: number, len: number): boolean {
  for (let i = idx; i < idx + len; i++) if (consumed[i]) return true;
  return false;
}

function markConsumed(consumed: boolean[], idx: number, len: number): void {
  for (let i = idx; i < idx + len; i++) consumed[i] = true;
}
