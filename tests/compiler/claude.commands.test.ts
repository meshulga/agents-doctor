import { describe, expect, it } from "vitest";
import { compileClaude } from "../../src/compiler/claude.js";
import type { Sot } from "../../src/types.js";

function sot(): Sot {
  return {
    config: { agents: ["claude"] },
    rules: [],
    skills: [],
    commands: [
      {
        name: "review",
        frontmatter: { description: "Review a PR", "allowed-tools": ["Read"] },
        body: "/review body\n",
      },
    ],
  };
}

describe("compileClaude commands", () => {
  it("emits each command at .claude/commands/<name>.md with generated_by injected", () => {
    const out = compileClaude(sot());
    const file = out.files.get(".claude/commands/review.md")!.toString("utf8");
    expect(file).toMatch(/^---\n/);
    expect(file).toContain("description: Review a PR");
    expect(file).toContain("allowed-tools:");
    expect(file).toContain("generated_by: agents-doctor");
    expect(file).toContain("/review body");
  });
});
