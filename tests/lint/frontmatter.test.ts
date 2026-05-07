import { describe, it, expect } from "vitest";
import { checkFrontmatter } from "../../src/lint/frontmatter.js";
import { Rule } from "../../src/types.js";

function rule(filename: string, body: string, fm: Partial<Rule["frontmatter"]> = {}): Rule {
  return {
    filename,
    frontmatter: { agents: ["claude"], priority: "normal", path: ".", ...fm },
    body,
  };
}

describe("checkFrontmatter", () => {
  it("flags rules whose body does not start with a heading", () => {
    const issues = checkFrontmatter([rule("001.md", "just prose, no heading\n")]);
    expect(issues).toHaveLength(1);
    expect(issues[0]?.category).toBe("missing_frontmatter");
    expect(issues[0]?.bucket).toBe("decisive");
    expect(issues[0]?.location.ruleFile).toBe("001.md");
  });

  it("does not flag rules with a leading # heading", () => {
    const issues = checkFrontmatter([rule("002.md", "# Title\n\nbody\n")]);
    expect(issues).toEqual([]);
  });

  it("does not flag rules with a leading ## heading", () => {
    const issues = checkFrontmatter([rule("003.md", "## Title\n\nbody\n")]);
    expect(issues).toEqual([]);
  });

  it("flags ['*'] rules with no globs as over-scoped", () => {
    const issues = checkFrontmatter([
      rule("004.md", "# T\nbody\n", { agents: ["*"] }),
    ]);
    expect(issues.some((i) => i.message.includes("agents: ['*']"))).toBe(true);
  });

  it("classifies ['*']+no-globs as mechanical, not decisive", () => {
    // This is the canonical output of `init` for shared content; flagging it
    // as decisive would force a fresh project to immediately resolve a
    // judgment item on day one. It is informational, not a todo.
    const issues = checkFrontmatter([
      rule("004.md", "# T\nbody\n", { agents: ["*"] }),
    ]);
    const overScope = issues.find((i) => i.message.includes("agents: ['*']"));
    expect(overScope?.bucket).toBe("mechanical");
  });

  it("does not flag agent-scoped rules even without globs", () => {
    const issues = checkFrontmatter([
      rule("005.md", "# T\nbody\n", { agents: ["claude"] }),
    ]);
    expect(issues).toEqual([]);
  });
});
