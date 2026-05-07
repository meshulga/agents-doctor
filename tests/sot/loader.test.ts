import { describe, expect, it } from "vitest";
import { loadSot } from "../../src/sot/loader.js";
import { makeTmpDir, writeFile } from "../helpers/tmp.js";

describe("loadSot", () => {
  it("loads config + rules with defaults applied", () => {
    const root = makeTmpDir();
    writeFile(root, ".agents-doc/config.yaml", "agents: [claude, codex]\n");
    writeFile(
      root,
      ".agents-doc/rules/general.md",
      "---\n---\nbody\n",
    );
    writeFile(
      root,
      ".agents-doc/rules/claude-only.md",
      "---\nagents: [claude]\npriority: high\npath: src/app\n---\nclaude body\n",
    );

    const sot = loadSot(root);
    expect(sot.config.agents).toEqual(["claude", "codex"]);
    expect(sot.rules).toHaveLength(2);

    const general = sot.rules.find((r) => r.filename === "general.md")!;
    expect(general.frontmatter).toEqual({ agents: ["*"], priority: "normal", path: "." });
    expect(general.body).toBe("body\n");

    const claudeOnly = sot.rules.find((r) => r.filename === "claude-only.md")!;
    expect(claudeOnly.frontmatter.agents).toEqual(["claude"]);
    expect(claudeOnly.frontmatter.priority).toBe("high");
    expect(claudeOnly.frontmatter.path).toBe("src/app");
  });

  it("loads skills recursively, transforming SKILL.md frontmatter", () => {
    const root = makeTmpDir();
    writeFile(root, ".agents-doc/config.yaml", "agents: [claude]\n");
    writeFile(
      root,
      ".agents-doc/skills/refactor-py/SKILL.md",
      "---\nname: refactor-py\ndescription: Refactor python\nsecret: drop-me\n---\n# Refactor\n",
    );
    writeFile(root, ".agents-doc/skills/refactor-py/scripts/run.sh", "echo hi\n");

    const sot = loadSot(root);
    expect(sot.skills).toHaveLength(1);
    const skill = sot.skills[0]!;
    expect(skill.name).toBe("refactor-py");
    expect(skill.files.map((f) => f.relativePath).sort()).toEqual([
      "SKILL.md",
      "scripts/run.sh",
    ]);

    const skillMd = skill.files.find((f) => f.relativePath === "SKILL.md")!;
    const text = skillMd.bytes.toString("utf8");
    expect(text).toMatch(/^---\n/);
    expect(text).toContain("name: refactor-py");
    expect(text).toContain("description: Refactor python");
    expect(text).toContain("generated_by: agents-doc");
    expect(text).not.toContain("secret");
    expect(text).toContain("# Refactor");
  });

  it("loads slash commands with whitelisted frontmatter", () => {
    const root = makeTmpDir();
    writeFile(root, ".agents-doc/config.yaml", "agents: [claude]\n");
    writeFile(
      root,
      ".agents-doc/commands/review.md",
      "---\ndescription: Review PR\nallowed-tools: [Read]\nsecret: drop\n---\n/review body\n",
    );

    const sot = loadSot(root);
    expect(sot.commands).toHaveLength(1);
    const cmd = sot.commands[0]!;
    expect(cmd.name).toBe("review");
    expect(cmd.frontmatter).toEqual({
      description: "Review PR",
      "allowed-tools": ["Read"],
    });
    expect(cmd.body).toBe("/review body\n");
  });

  it("throws if .agents-doc/ is missing", () => {
    const root = makeTmpDir();
    expect(() => loadSot(root)).toThrow(/\.agents-doc/);
  });

  it("rejects empty config.yaml agents list", () => {
    const root = makeTmpDir();
    writeFile(root, ".agents-doc/config.yaml", "agents: []\n");
    expect(() => loadSot(root)).toThrow(/non-empty agents/);
  });

  it("rejects unknown agent in config.yaml", () => {
    const root = makeTmpDir();
    writeFile(root, ".agents-doc/config.yaml", "agents: [gemini]\n");
    expect(() => loadSot(root)).toThrow(/unknown agent/);
  });

  it("rejects rule with non-array agents field", () => {
    const root = makeTmpDir();
    writeFile(root, ".agents-doc/config.yaml", "agents: [claude]\n");
    writeFile(root, ".agents-doc/rules/bad.md", "---\nagents: claude\n---\nbody\n");
    expect(() => loadSot(root)).toThrow(/agents must be an array/);
  });

  it("rejects rule with unknown priority value", () => {
    const root = makeTmpDir();
    writeFile(root, ".agents-doc/config.yaml", "agents: [claude]\n");
    writeFile(root, ".agents-doc/rules/bad.md", "---\npriority: medium\n---\nbody\n");
    expect(() => loadSot(root)).toThrow(/priority must be high\|normal\|low/);
  });

  it("rejects rule with non-array globs", () => {
    const root = makeTmpDir();
    writeFile(root, ".agents-doc/config.yaml", "agents: [claude]\n");
    writeFile(root, ".agents-doc/rules/bad.md", "---\nglobs: '*.ts'\n---\nbody\n");
    expect(() => loadSot(root)).toThrow(/globs must be an array/);
  });

  it("normalizes rule path frontmatter (strips leading ./, trailing /, blank → .)", () => {
    const root = makeTmpDir();
    writeFile(root, ".agents-doc/config.yaml", "agents: [claude]\n");
    writeFile(root, ".agents-doc/rules/a.md", "---\npath: ./src/app/\n---\nbody\n");
    writeFile(root, ".agents-doc/rules/b.md", "---\npath: src/app\n---\nbody\n");
    writeFile(root, ".agents-doc/rules/c.md", "---\npath: ./\n---\nbody\n");

    const sot = loadSot(root);
    const a = sot.rules.find((r) => r.filename === "a.md")!;
    const b = sot.rules.find((r) => r.filename === "b.md")!;
    const c = sot.rules.find((r) => r.filename === "c.md")!;
    expect(a.frontmatter.path).toBe("src/app");
    expect(b.frontmatter.path).toBe("src/app");
    expect(c.frontmatter.path).toBe(".");
  });
});
