import { describe, it, expect } from "vitest";
import { loadSot } from "../../src/sot/loader.js";
import { makeTmpDir, writeFile } from "../helpers/tmp.js";

describe("loader rejects user-authored doc-fix command", () => {
  it("throws a clear error when .agents-doc/commands/doc-fix.md exists", () => {
    const root = makeTmpDir();
    writeFile(root, ".agents-doc/config.yaml", "agents: [claude]\n");
    writeFile(
      root,
      ".agents-doc/commands/doc-fix.md",
      "# user's own doc-fix\n",
    );
    expect(() => loadSot(root)).toThrowError(/reserved.*doc-fix/i);
  });

  it("allows other command names", () => {
    const root = makeTmpDir();
    writeFile(root, ".agents-doc/config.yaml", "agents: [claude]\n");
    writeFile(root, ".agents-doc/commands/review.md", "# review\n");
    const sot = loadSot(root);
    expect(sot.commands).toHaveLength(1);
    expect(sot.commands[0]?.name).toBe("review");
    expect(sot.commands[0]?.body).toBe("# review\n");
  });

  it("throws a clear error when .agents-doc/skills/doc-fix/ exists", () => {
    const root = makeTmpDir();
    writeFile(root, ".agents-doc/config.yaml", "agents: [codex]\n");
    writeFile(
      root,
      ".agents-doc/skills/doc-fix/SKILL.md",
      "---\nname: doc-fix\ndescription: my own\n---\n# body\n",
    );
    expect(() => loadSot(root)).toThrowError(/reserved.*doc-fix/i);
  });

  it("allows other skill names", () => {
    const root = makeTmpDir();
    writeFile(root, ".agents-doc/config.yaml", "agents: [codex]\n");
    writeFile(
      root,
      ".agents-doc/skills/refactor-py/SKILL.md",
      "---\nname: refactor-py\ndescription: rp\n---\n# body\n",
    );
    const sot = loadSot(root);
    expect(sot.skills).toHaveLength(1);
    expect(sot.skills[0]?.name).toBe("refactor-py");
  });
});
