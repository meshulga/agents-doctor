import { describe, it, expect } from "vitest";
import { checkVague } from "../../src/lint/vague.js";
import { Rule } from "../../src/types.js";

function rule(body: string): Rule {
  return {
    filename: "r.md",
    frontmatter: { agents: ["*"], priority: "normal", path: "." },
    body,
  };
}

describe("checkVague", () => {
  it.each([
    ["use appropriate indentation", "appropriate"],
    ["validate as needed", "as needed"],
    ["throw if necessary", "if necessary"],
    ["apply where applicable", "where applicable"],
    ["log when relevant", "when relevant"],
    ["handle as appropriate", "as appropriate"],
    ["foo, bar, etc.", "etc."],
    ["one, two, and so on", "and so on"],
    ["write clean code", "clean code"],
    ["follow best practices", "best practices"],
  ])("flags %p as vague (%s)", (body, phrase) => {
    const issues = checkVague([rule(body + "\n")]);
    expect(issues).toHaveLength(1);
    expect(issues[0]?.category).toBe("vague_phrasing");
    expect(issues[0]?.bucket).toBe("decisive");
    expect(issues[0]?.message.toLowerCase()).toContain(phrase.toLowerCase());
  });

  it("matches case-insensitively", () => {
    const issues = checkVague([rule("Use APPROPRIATE indentation\n")]);
    expect(issues).toHaveLength(1);
  });

  it("does not match inside fenced code blocks", () => {
    const issues = checkVague([
      rule("intro\n```\nuse appropriate indentation\n```\nafter\n"),
    ]);
    expect(issues).toEqual([]);
  });

  it("reports the body-relative line", () => {
    const issues = checkVague([rule("line 1\nline 2\nas needed here\n")]);
    expect(issues[0]?.location.line).toBe(3);
  });

  it("emits one issue per occurrence on different lines", () => {
    const issues = checkVague([rule("as needed\nas needed\n")]);
    expect(issues).toHaveLength(2);
  });

  it("does not match concrete prose", () => {
    const issues = checkVague([
      rule("# Style\n\n- Use 4-space indentation.\n- Run tests before commit.\n"),
    ]);
    expect(issues).toEqual([]);
  });
});
