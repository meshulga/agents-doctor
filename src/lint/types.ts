export type LintBucket = "mechanical" | "decisive" | "generative";

export type LintCategory =
  | "missing_frontmatter"
  | "dead_reference"
  | "over_broad_glob"
  | "vague_phrasing"
  | "instruction_count"
  | "contradiction";

export interface LintLocation {
  /** Basename inside .agents-doc/rules/, e.g. "001-style.md". */
  ruleFile: string;
  /** 1-based line number inside the rule body (post-frontmatter). Optional for whole-file issues. */
  line?: number;
}

export interface LintIssue {
  category: LintCategory;
  bucket: LintBucket;
  /** Primary location of the offence. */
  location: LintLocation;
  /** Human-readable summary. Keep under one line. */
  message: string;
  /** Optional concrete suggestion (used by /doc-fix to scaffold the edit). */
  suggestion?: string;
  /** For cross-rule issues like contradictions; primary location stays in `location`. */
  related?: LintLocation[];
}
