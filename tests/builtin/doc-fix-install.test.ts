import { describe, it, expect } from "vitest";
import { compile } from "../../src/compiler/index.js";
import type { Sot } from "../../src/types.js";

const claudeOnlySot: Sot = {
  config: { agents: ["claude"] },
  rules: [],
  skills: [],
  commands: [],
};

const codexOnlySot: Sot = {
  config: { agents: ["codex"] },
  rules: [],
  skills: [],
  commands: [],
};

describe("compile injects /doc-fix for Claude", () => {
  it("emits .claude/commands/doc-fix.md when claude is enabled", () => {
    const out = compile(claudeOnlySot);
    expect(out.files.has(".claude/commands/doc-fix.md")).toBe(true);
  });

  it("doc-fix.md frontmatter contains description and generated_by", () => {
    const out = compile(claudeOnlySot);
    const bytes = out.files.get(".claude/commands/doc-fix.md")!;
    const text = bytes.toString("utf8");
    expect(text).toContain("description: ");
    expect(text).toContain("generated_by: agents-doc");
  });

  it("doc-fix body contains the workflow heading", () => {
    const out = compile(claudeOnlySot);
    const text = out.files.get(".claude/commands/doc-fix.md")!.toString("utf8");
    expect(text).toContain("/doc-fix");
    expect(text).toContain("agents-doc sync");
  });

  it("does not emit doc-fix when only codex is enabled", () => {
    const out = compile(codexOnlySot);
    expect(out.files.has(".claude/commands/doc-fix.md")).toBe(false);
  });
});
