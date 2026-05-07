import { describe, it, expect } from "vitest";
import { classify } from "../../src/doctor/classify.js";
import type { CheckIssue } from "../../src/commands/check.js";
import type { LintIssue } from "../../src/lint/types.js";

const drift: CheckIssue = { kind: "missing", path: "CLAUDE.md" };
const decisive: LintIssue = {
  category: "vague_phrasing",
  bucket: "decisive",
  location: { ruleFile: "r.md", line: 1 },
  message: "vague",
};
const generative: LintIssue = {
  category: "contradiction",
  bucket: "generative",
  location: { ruleFile: "a.md" },
  message: "conflict",
};
const mechanicalLint: LintIssue = {
  category: "dead_reference",
  bucket: "mechanical",
  location: { ruleFile: "r.md", line: 1 },
  message: "dead",
};

describe("classify", () => {
  it("routes drift issues to mechanical", () => {
    const buckets = classify([drift], []);
    expect(buckets.mechanical).toHaveLength(1);
    expect(buckets.mechanical[0]?.kind).toBe("drift");
    expect(buckets.decisive).toEqual([]);
    expect(buckets.generative).toEqual([]);
  });

  it("routes lint issues by bucket", () => {
    const buckets = classify([], [decisive, generative, mechanicalLint]);
    expect(buckets.mechanical).toHaveLength(1);
    expect(buckets.decisive).toHaveLength(1);
    expect(buckets.generative).toHaveLength(1);
  });

  it("preserves the original issue under the .source field", () => {
    const buckets = classify([], [decisive]);
    expect(buckets.decisive[0]?.kind).toBe("lint");
    expect(buckets.decisive[0]?.kind === "lint" && buckets.decisive[0]?.source).toBe(decisive);
  });
});
