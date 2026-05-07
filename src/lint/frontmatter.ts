import { Rule } from "../types.js";
import { LintIssue } from "./types.js";

export function checkFrontmatter(rules: Rule[]): LintIssue[] {
  const out: LintIssue[] = [];
  for (const r of rules) {
    if (!startsWithHeading(r.body)) {
      out.push({
        category: "missing_frontmatter",
        bucket: "decisive",
        location: { ruleFile: r.filename, line: 1 },
        message: "rule body does not start with a markdown heading",
        suggestion: "add a `# Title` line at the top of the rule body",
      });
    }
    if (
      r.frontmatter.agents.length === 1 &&
      r.frontmatter.agents[0] === "*" &&
      (r.frontmatter.globs === undefined || r.frontmatter.globs.length === 0)
    ) {
      // Informational only: this is what `init` emits for content shared
      // across all agents. Putting it in todo.md would force every fresh
      // project to "fix" a non-problem on day one.
      out.push({
        category: "missing_frontmatter",
        bucket: "mechanical",
        location: { ruleFile: r.filename },
        message: "agents: ['*'] with no globs — applies to every file in scope",
        suggestion:
          "narrow with explicit agents (['claude'] or ['codex']) or add globs:",
      });
    }
  }
  return out;
}

function startsWithHeading(body: string): boolean {
  const firstLine = body.split("\n").find((l) => l.trim() !== "") ?? "";
  return /^#{1,6}\s+\S/.test(firstLine);
}
