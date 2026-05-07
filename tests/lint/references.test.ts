import { describe, it, expect } from "vitest";
import { checkReferences } from "../../src/lint/references.js";
import { Rule } from "../../src/types.js";
import { makeTmpDir, writeFile } from "../helpers/tmp.js";

function rule(filename: string, body: string): Rule {
  return {
    filename,
    frontmatter: { agents: ["*"], priority: "normal", path: "." },
    body,
  };
}

describe("checkReferences", () => {
  it("flags references that don't resolve to a file", () => {
    const root = makeTmpDir();
    const issues = checkReferences(
      [rule("r.md", "see @docs/missing.md for details\n")],
      root,
    );
    expect(issues).toHaveLength(1);
    expect(issues[0]?.category).toBe("dead_reference");
    expect(issues[0]?.bucket).toBe("mechanical");
    expect(issues[0]?.message).toContain("@docs/missing.md");
    expect(issues[0]?.location.line).toBe(1);
  });

  it("does not flag references that resolve", () => {
    const root = makeTmpDir();
    writeFile(root, "docs/style.md", "# style\n");
    const issues = checkReferences([rule("r.md", "see @docs/style.md\n")], root);
    expect(issues).toEqual([]);
  });

  it("ignores references inside fenced code blocks", () => {
    const root = makeTmpDir();
    const body = "before\n```\n@docs/missing.md\n```\nafter\n";
    const issues = checkReferences([rule("r.md", body)], root);
    expect(issues).toEqual([]);
  });

  it("reports each occurrence with its body line number", () => {
    const root = makeTmpDir();
    const body = "intro\n\nsee @a/missing.md\nand @b/missing.md\n";
    const issues = checkReferences([rule("r.md", body)], root);
    expect(issues).toHaveLength(2);
    expect(issues[0]?.location.line).toBe(3);
    expect(issues[1]?.location.line).toBe(4);
  });

  it("does not match @ inside an email or @decorator", () => {
    const root = makeTmpDir();
    const body = "ping me at me@example.com\nuse @decorator(x)\n";
    const issues = checkReferences([rule("r.md", body)], root);
    expect(issues).toEqual([]);
  });
});
