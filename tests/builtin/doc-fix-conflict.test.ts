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
    expect(() => loadSot(root)).not.toThrow();
  });
});
