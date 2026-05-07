import { describe, it, expect } from "vitest";
import { checkContradictions } from "../../src/lint/contradictions.js";
import { Rule } from "../../src/types.js";

function rule(filename: string, body: string, path = "."): Rule {
  return {
    filename,
    frontmatter: { agents: ["*"], priority: "normal", path },
    body,
  };
}

describe("checkContradictions", () => {
  it("flags do X / don't X within the same path", () => {
    const issues = checkContradictions([
      rule("a.md", "- do mock the database\n"),
      rule("b.md", "- don't mock the database\n"),
    ]);
    expect(issues).toHaveLength(1);
    expect(issues[0]?.category).toBe("contradiction");
    expect(issues[0]?.bucket).toBe("generative");
    expect(issues[0]?.related?.[0]?.ruleFile).toBeDefined();
    expect(issues[0]?.message).toContain("do mock the database");
    expect(issues[0]?.message.toLowerCase()).toContain("don't");
  });

  it("flags always X / never X within the same path", () => {
    const issues = checkContradictions([
      rule("a.md", "- always log errors\n"),
      rule("b.md", "- never log errors\n"),
    ]);
    expect(issues).toHaveLength(1);
    expect(issues[0]?.message).toContain("always log errors");
    expect(issues[0]?.message).toContain("never log errors");
  });

  it("ignores contradictions across different paths", () => {
    const issues = checkContradictions([
      rule("a.md", "- always log errors\n", "src/api"),
      rule("b.md", "- never log errors\n", "src/web"),
    ]);
    expect(issues).toEqual([]);
  });

  it("matches case-insensitively and ignores trailing punctuation", () => {
    const issues = checkContradictions([
      rule("a.md", "- Do mock the DB.\n"),
      rule("b.md", "- don't mock the db\n"),
    ]);
    expect(issues).toHaveLength(1);
  });

  it("does not flag unrelated do/don't pairs", () => {
    const issues = checkContradictions([
      rule("a.md", "- do mock the database\n"),
      rule("b.md", "- don't commit secrets\n"),
    ]);
    expect(issues).toEqual([]);
  });

  it("ignores fenced code", () => {
    const issues = checkContradictions([
      rule("a.md", "```\n- do mock the database\n```\n"),
      rule("b.md", "- don't mock the database\n"),
    ]);
    expect(issues).toEqual([]);
  });
});
