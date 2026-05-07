import { describe, expect, it } from "vitest";
import { compileClaude } from "../../src/compiler/claude.js";
import type { Sot } from "../../src/types.js";

function sot(): Sot {
  return {
    config: { agents: ["claude"] },
    rules: [],
    skills: [
      {
        name: "refactor-py",
        files: [
          { relativePath: "SKILL.md", bytes: Buffer.from("---\nname: refactor-py\ngenerated_by: agents-doc\n---\n# body\n") },
          { relativePath: "scripts/run.sh", bytes: Buffer.from("echo hi\n") },
          { relativePath: "assets/img.bin", bytes: Buffer.from([0, 1, 2, 3]) },
        ],
      },
    ],
    commands: [],
  };
}

describe("compileClaude skills", () => {
  it("emits each skill file under .claude/skills/<name>/", () => {
    const out = compileClaude(sot());
    expect(out.files.has(".claude/skills/refactor-py/SKILL.md")).toBe(true);
    expect(out.files.has(".claude/skills/refactor-py/scripts/run.sh")).toBe(true);
    expect(out.files.has(".claude/skills/refactor-py/assets/img.bin")).toBe(true);
  });

  it("preserves binary bytes verbatim", () => {
    const out = compileClaude(sot());
    const bin = out.files.get(".claude/skills/refactor-py/assets/img.bin")!;
    expect([...bin]).toEqual([0, 1, 2, 3]);
  });
});
