import { describe, it, expect } from "vitest";
import { checkSize } from "../../src/lint/size.js";
import { Rule } from "../../src/types.js";

function rule(body: string): Rule {
  return {
    filename: "r.md",
    frontmatter: { agents: ["*"], priority: "normal", path: "." },
    body,
  };
}

describe("checkSize", () => {
  it("does not flag short rules", () => {
    const body = "# T\n\n- one\n- two\n- three\n";
    expect(checkSize([rule(body)])).toEqual([]);
  });

  it("flags rules over the bullet threshold", () => {
    const bullets = Array.from({ length: 41 }, (_, i) => `- bullet ${i}`).join("\n");
    const issues = checkSize([rule(`# T\n\n${bullets}\n`)]);
    expect(issues).toHaveLength(1);
    expect(issues[0]?.category).toBe("instruction_count");
    expect(issues[0]?.bucket).toBe("decisive");
    expect(issues[0]?.message).toMatch(/41 instructions/);
  });

  it("counts sentence-terminated prose lines as instructions", () => {
    const sentences = Array.from({ length: 41 }, () => "Do the thing.").join(" ");
    const issues = checkSize([rule(`# T\n\n${sentences}\n`)]);
    expect(issues).toHaveLength(1);
  });

  it("ignores instructions inside fenced code blocks", () => {
    const code = Array.from({ length: 50 }, (_, i) => `- item ${i}`).join("\n");
    const body = `# T\n\n\`\`\`\n${code}\n\`\`\`\n- one\n`;
    expect(checkSize([rule(body)])).toEqual([]);
  });
});
