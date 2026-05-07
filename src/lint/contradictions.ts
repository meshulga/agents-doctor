import { Rule } from "../types.js";
import { LintIssue, LintLocation } from "./types.js";

interface Directive {
  verb: "do" | "always";
  negated: boolean;
  object: string; // normalized
  loc: LintLocation;
}

const DIRECTIVE_RE =
  /^\s*(?:-\s+)?(do not|don'?t|do|always|never)\s+(.+?)\s*[.!?]?\s*$/i;

export function checkContradictions(rules: Rule[]): LintIssue[] {
  const byPath = new Map<string, Rule[]>();
  for (const r of rules) {
    const list = byPath.get(r.frontmatter.path) ?? [];
    list.push(r);
    byPath.set(r.frontmatter.path, list);
  }

  const out: LintIssue[] = [];
  for (const group of byPath.values()) {
    const directives = collectDirectives(group);
    out.push(...findOpposites(directives));
  }
  return out;
}

function collectDirectives(rules: Rule[]): Directive[] {
  const out: Directive[] = [];
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
      const m = DIRECTIVE_RE.exec(line);
      if (!m) continue;
      const head = m[1]!.toLowerCase();
      const tail = (m[2] ?? "").toLowerCase().trim();
      const verb = head.startsWith("do") ? "do" : ("always" as const);
      const negated =
        head === "don't" ||
        head === "dont" ||
        head === "do not" ||
        head === "never";
      out.push({
        verb,
        negated,
        object: tail,
        loc: { ruleFile: r.filename, line: i + 1 },
      });
    }
  }
  return out;
}

function findOpposites(directives: Directive[]): LintIssue[] {
  const out: LintIssue[] = [];
  const seen = new Set<string>(); // dedupe (a,b) pairs
  for (let i = 0; i < directives.length; i++) {
    for (let j = i + 1; j < directives.length; j++) {
      const a = directives[i]!;
      const b = directives[j]!;
      if (a.verb !== b.verb) continue;
      if (a.object !== b.object) continue;
      if (a.negated === b.negated) continue;
      const key = pairKey(a.loc, b.loc);
      if (seen.has(key)) continue;
      seen.add(key);
      const aWord = headWord(a.verb, a.negated);
      const bWord = headWord(b.verb, b.negated);
      out.push({
        category: "contradiction",
        bucket: "generative",
        location: a.loc,
        related: [b.loc],
        message: `"${aWord} ${a.object}" vs "${bWord} ${a.object}"`,
        suggestion: "consolidate into a single rule with one direction",
      });
    }
  }
  return out;
}

function headWord(verb: "do" | "always", negated: boolean): string {
  if (verb === "always") return negated ? "never" : "always";
  return negated ? "don't" : "do";
}

function pairKey(a: LintLocation, b: LintLocation): string {
  const x = `${a.ruleFile}:${a.line ?? 0}`;
  const y = `${b.ruleFile}:${b.line ?? 0}`;
  return x < y ? `${x}|${y}` : `${y}|${x}`;
}
