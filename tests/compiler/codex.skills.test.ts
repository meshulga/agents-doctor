import { describe, expect, it } from "vitest";
import { compileCodex } from "../../src/compiler/codex.js";
import type { Sot } from "../../src/types.js";

function sot(): Sot {
  return {
    config: { agents: ["codex"] },
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

describe("compileCodex skills", () => {
  it("emits each skill file under .agents/skills/<name>/", () => {
    const out = compileCodex(sot());
    expect(out.files.has(".agents/skills/refactor-py/SKILL.md")).toBe(true);
    expect(out.files.has(".agents/skills/refactor-py/scripts/run.sh")).toBe(true);
    expect(out.files.has(".agents/skills/refactor-py/assets/img.bin")).toBe(true);
  });

  it("preserves binary bytes verbatim", () => {
    const out = compileCodex(sot());
    const bin = out.files.get(".agents/skills/refactor-py/assets/img.bin")!;
    expect([...bin]).toEqual([0, 1, 2, 3]);
  });
});
