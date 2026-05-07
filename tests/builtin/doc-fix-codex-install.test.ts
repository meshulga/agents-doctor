import { describe, it, expect } from "vitest";
import { compile } from "../../src/compiler/index.js";
import type { Sot } from "../../src/types.js";

const codexOnlySot: Sot = {
  config: { agents: ["codex"] },
  rules: [],
  skills: [],
  commands: [],
};

const claudeOnlySot: Sot = {
  config: { agents: ["claude"] },
  rules: [],
  skills: [],
  commands: [],
};

describe("compile injects /doc-fix as a skill for Codex", () => {
  it("emits .agents/skills/doc-fix/SKILL.md when codex is enabled", () => {
    const out = compile(codexOnlySot);
    expect(out.files.has(".agents/skills/doc-fix/SKILL.md")).toBe(true);
  });

  it("doc-fix SKILL.md frontmatter contains name, description, generated_by", () => {
    const out = compile(codexOnlySot);
    const text = out.files
      .get(".agents/skills/doc-fix/SKILL.md")!
      .toString("utf8");
    expect(text).toContain("name: doc-fix");
    expect(text).toContain("description: ");
    expect(text).toContain("generated_by: agents-doc");
  });

  it("doc-fix SKILL.md body contains the workflow heading and todo path", () => {
    const out = compile(codexOnlySot);
    const text = out.files
      .get(".agents/skills/doc-fix/SKILL.md")!
      .toString("utf8");
    expect(text).toContain(".agents-doc/todo.md");
    expect(text).toContain("agents-doc sync");
  });

  it("does not emit a Codex doc-fix skill when only claude is enabled", () => {
    const out = compile(claudeOnlySot);
    expect(out.files.has(".agents/skills/doc-fix/SKILL.md")).toBe(false);
  });
});
