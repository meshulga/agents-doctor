import { Sot } from "../types.js";
import { LintIssue } from "./types.js";
import { checkFrontmatter } from "./frontmatter.js";
import { checkReferences } from "./references.js";
import { checkGlobs } from "./globs.js";
import { checkVague } from "./vague.js";
import { checkSize } from "./size.js";
import { checkContradictions } from "./contradictions.js";

export interface LintOptions {
  projectRoot: string;
}

export function runLint(sot: Sot, opts: LintOptions): LintIssue[] {
  const out: LintIssue[] = [];
  out.push(...checkFrontmatter(sot.rules));
  out.push(...checkReferences(sot.rules, opts.projectRoot));
  out.push(...checkGlobs(sot.rules));
  out.push(...checkVague(sot.rules));
  out.push(...checkSize(sot.rules));
  out.push(...checkContradictions(sot.rules));
  return out;
}

export type { LintIssue, LintBucket, LintCategory } from "./types.js";
