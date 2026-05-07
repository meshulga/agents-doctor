import { describe, it, expect } from "vitest";
import { checkGlobs } from "../../src/lint/globs.js";
import { Rule } from "../../src/types.js";

function rule(filename: string, globs: string[] | undefined): Rule {
  return {
    filename,
    frontmatter: { agents: ["claude"], priority: "normal", path: ".", globs },
    body: "# T\nbody\n",
  };
}

describe("checkGlobs", () => {
  it("flags '**' as over-broad", () => {
    const issues = checkGlobs([rule("r.md", ["**"])]);
    expect(issues).toHaveLength(1);
    expect(issues[0]?.category).toBe("over_broad_glob");
    expect(issues[0]?.bucket).toBe("decisive");
    expect(issues[0]?.message).toContain("**");
  });

  it("flags '**/*' as over-broad", () => {
    expect(checkGlobs([rule("r.md", ["**/*"])])).toHaveLength(1);
  });

  it("flags '*' alone as over-broad", () => {
    expect(checkGlobs([rule("r.md", ["*"])])).toHaveLength(1);
  });

  it("flags '**/*.*' as over-broad", () => {
    expect(checkGlobs([rule("r.md", ["**/*.*"])])).toHaveLength(1);
  });

  it("does not flag scoped globs", () => {
    const issues = checkGlobs([rule("r.md", ["src/**/*.ts", "tests/**"])]);
    expect(issues).toEqual([]);
  });

  it("does not flag rules with no globs", () => {
    expect(checkGlobs([rule("r.md", undefined)])).toEqual([]);
  });

  it("flags each over-broad entry independently", () => {
    const issues = checkGlobs([rule("r.md", ["**", "**/*"])]);
    expect(issues).toHaveLength(2);
  });
});
