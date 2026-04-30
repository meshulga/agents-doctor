import { describe, expect, it } from "vitest";
import { walkProject } from "../src/walk.js";
import { makeTmpDir, writeFile } from "./helpers/tmp.js";

describe("walkProject", () => {
  it("yields all files relative to root", () => {
    const root = makeTmpDir();
    writeFile(root, "a.md", "");
    writeFile(root, "sub/b.md", "");
    const out = [...walkProject(root)].sort();
    expect(out).toEqual(["a.md", "sub/b.md"]);
  });

  it("skips heavy paths by default", () => {
    const root = makeTmpDir();
    writeFile(root, "a.md", "");
    writeFile(root, "node_modules/x.md", "");
    writeFile(root, ".git/HEAD", "");
    writeFile(root, "dist/y.md", "");
    expect([...walkProject(root)]).toEqual(["a.md"]);
  });

  it("respects .gitignore", () => {
    const root = makeTmpDir();
    writeFile(root, ".gitignore", "ignored/\n*.tmp\n");
    writeFile(root, "a.md", "");
    writeFile(root, "ignored/b.md", "");
    writeFile(root, "c.tmp", "");
    expect([...walkProject(root)].sort()).toEqual([".gitignore", "a.md"]);
  });

  it("respects nested .gitignore inheritance", () => {
    const root = makeTmpDir();
    writeFile(root, ".gitignore", "*.log\n");
    writeFile(root, "sub/.gitignore", "local-skip/\n");
    writeFile(root, "sub/keep.md", "");
    writeFile(root, "sub/skip.log", "");
    writeFile(root, "sub/local-skip/x.md", "");
    expect([...walkProject(root)].sort()).toEqual([
      ".gitignore",
      "sub/.gitignore",
      "sub/keep.md",
    ]);
  });
});
