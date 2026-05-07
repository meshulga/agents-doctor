import { describe, expect, it } from "vitest";
import { runCheck } from "../../src/commands/check.js";
import { runSync } from "../../src/commands/sync.js";
import { writeFileSync, mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { makeTmpDir, writeFile } from "../helpers/tmp.js";

async function setupSyncedProject(): Promise<string> {
  const root = makeTmpDir();
  writeFile(root, ".agents-doc/config.yaml", "agents: [claude, codex]\n");
  writeFile(root, ".agents-doc/rules/general.md", "---\n---\nbody\n");
  await runSync({ projectRoot: root });
  return root;
}

describe("runCheck", () => {
  it("returns clean when SOT and disk agree", async () => {
    const root = await setupSyncedProject();
    const r = await runCheck({ projectRoot: root });
    expect(r.ok).toBe(true);
    expect(r.issues).toEqual([]);
  });

  it("flags content mismatch", async () => {
    const root = await setupSyncedProject();
    writeFileSync(join(root, "CLAUDE.md"), "tampered\n");
    const r = await runCheck({ projectRoot: root });
    expect(r.ok).toBe(false);
    expect(r.issues.some((i) => i.kind === "mismatch" && i.path === "CLAUDE.md")).toBe(true);
  });

  it("flags missing generated file", async () => {
    const root = await setupSyncedProject();
    rmSync(join(root, "AGENTS.md"));
    const r = await runCheck({ projectRoot: root });
    expect(r.issues.some((i) => i.kind === "missing" && i.path === "AGENTS.md")).toBe(true);
  });

  it("flags an untracked nested CLAUDE.md as extra", async () => {
    const root = await setupSyncedProject();
    writeFile(root, "src/app/CLAUDE.md", "stray\n");
    const r = await runCheck({ projectRoot: root });
    expect(r.issues.some((i) => i.kind === "extra" && i.path === "src/app/CLAUDE.md")).toBe(true);
  });

  it("flags untracked file inside .claude/commands/ as extra", async () => {
    const root = makeTmpDir();
    writeFile(root, ".agents-doc/config.yaml", "agents: [claude]\n");
    writeFile(root, ".agents-doc/commands/review.md", "---\ndescription: r\n---\nbody\n");
    await runSync({ projectRoot: root });
    writeFile(root, ".claude/commands/stray.md", "stray\n");
    const r = await runCheck({ projectRoot: root });
    expect(r.issues.some((i) => i.kind === "extra" && i.path === ".claude/commands/stray.md")).toBe(true);
  });

  it("treats CRLF on disk as equivalent to LF (no spurious drift)", async () => {
    const root = await setupSyncedProject();
    const path = join(root, "CLAUDE.md");
    const lf = (await import("node:fs")).readFileSync(path, "utf8");
    writeFileSync(path, lf.replace(/\n/g, "\r\n"));
    const r = await runCheck({ projectRoot: root });
    expect(r.ok).toBe(true);
  });

  it("does not flag missing AGENTS.md when only claude rules exist at that path", async () => {
    const root = makeTmpDir();
    writeFile(root, ".agents-doc/config.yaml", "agents: [claude, codex]\n");
    writeFile(
      root,
      ".agents-doc/rules/c.md",
      "---\nagents: [claude]\n---\nclaude\n",
    );
    await runSync({ projectRoot: root });
    const r = await runCheck({ projectRoot: root });
    expect(r.ok).toBe(true);
  });

  it("flags a stray CLAUDE.md inside .claude/skills/ exactly once", async () => {
    const root = makeTmpDir();
    writeFile(root, ".agents-doc/config.yaml", "agents: [claude]\n");
    writeFile(root, ".agents-doc/rules/r.md", "---\n---\nbody\n");
    await runSync({ projectRoot: root });
    // Stray file matches BOTH the basename branch and the `.claude/skills/`
    // prefix branch. Without the dedupe it would emit two `extra` issues.
    writeFile(root, ".claude/skills/foo/CLAUDE.md", "stray\n");
    const r = await runCheck({ projectRoot: root });
    const matches = r.issues.filter(
      (i) => i.kind === "extra" && i.path === ".claude/skills/foo/CLAUDE.md",
    );
    expect(matches).toHaveLength(1);
  });

  it("round-trips clean when rule path uses ./ prefix or trailing slash", async () => {
    const root = makeTmpDir();
    writeFile(root, ".agents-doc/config.yaml", "agents: [claude]\n");
    writeFile(
      root,
      ".agents-doc/rules/nested.md",
      "---\npath: ./src/app/\n---\nbody\n",
    );
    await runSync({ projectRoot: root });
    const r = await runCheck({ projectRoot: root });
    expect(r.ok).toBe(true);
    expect(r.issues).toEqual([]);
  });
});
