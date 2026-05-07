import type { CheckIssue } from "../commands/check.js";
import type { LintIssue } from "../lint/types.js";

export type ClassifiedIssue =
  | { kind: "drift"; source: CheckIssue }
  | { kind: "lint"; source: LintIssue };

export interface BucketMap {
  mechanical: ClassifiedIssue[];
  decisive: ClassifiedIssue[];
  generative: ClassifiedIssue[];
}

export function classify(drift: CheckIssue[], lint: LintIssue[]): BucketMap {
  const buckets: BucketMap = { mechanical: [], decisive: [], generative: [] };
  for (const d of drift) {
    buckets.mechanical.push({ kind: "drift", source: d });
  }
  for (const l of lint) {
    buckets[l.bucket].push({ kind: "lint", source: l });
  }
  return buckets;
}
