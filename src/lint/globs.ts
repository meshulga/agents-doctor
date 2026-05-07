import { Rule } from "../types.js";
import { LintIssue } from "./types.js";

const OVER_BROAD = new Set(["*", "**", "**/*", "**/*.*", "**/**"]);

export function checkGlobs(rules: Rule[]): LintIssue[] {
  const out: LintIssue[] = [];
  for (const r of rules) {
    const globs = r.frontmatter.globs;
    if (!globs) continue;
    for (const g of globs) {
      if (OVER_BROAD.has(g.trim()) || isAllWildcards(g)) {
        out.push({
          category: "over_broad_glob",
          bucket: "decisive",
          location: { ruleFile: r.filename },
          message: `globs entry '${g}' is over-broad`,
          suggestion: "narrow to a directory or file extension, e.g. src/**/*.ts",
        });
      }
    }
  }
  return out;
}

function isAllWildcards(glob: string): boolean {
  // True when every segment is '*', '**', or empty after stripping wildcards.
  const segments = glob.split("/").filter((s) => s !== "");
  if (segments.length === 0) return true;
  return segments.every((s) => /^[*]+$/.test(s));
}
