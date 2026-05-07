import { describe, it, expect, vi } from "vitest";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { main } from "../src/cli.js";
import { runInit } from "../src/commands/init.js";
import { runDoctor } from "../src/commands/doctor.js";

import { makeTmpDir, writeFile } from "./helpers/tmp.js";

describe("agents-doc doctor end-to-end", () => {
  it("classifies drift and lint issues and writes the todo file", async () => {
    const root = makeTmpDir();
    // Seed a single-agent project so the only decisive lint is the vague phrase.
    writeFile(
      root,
      "CLAUDE.md",
      "# Project\n\n## Style\n\n- use appropriate indentation\n",
    );
    await runInit({ projectRoot: root, selectAgent: async () => "claude" });

    // Introduce drift: hand-edit the generated CLAUDE.md.
    const claudePath = join(root, "CLAUDE.md");
    const original = readFileSync(claudePath, "utf8");
    writeFileSync(claudePath, original + "\nhand-added line\n");

    const result = await runDoctor({ projectRoot: root });

    // 1 drift mismatch on CLAUDE.md -> mechanical bucket.
    expect(result.buckets.mechanical).toHaveLength(1);
    expect(result.buckets.mechanical[0]).toMatchObject({
      kind: "drift",
      source: { kind: "mismatch", path: "CLAUDE.md" },
    });

    // "appropriate" -> the only decisive lint issue.
    expect(
      result.buckets.decisive.map((i) =>
        i.kind === "lint" ? i.source.category : i.kind
      ),
    ).toEqual(["vague_phrasing"]);
    expect(result.buckets.generative).toEqual([]);

    // Todo file written with the decisive entry; not the mechanical drift.
    expect(existsSync(result.todoPath)).toBe(true);
    const todo = readFileSync(result.todoPath, "utf8");
    expect(todo).toContain("## Decisive");
    expect(todo).toContain("vague_phrasing");
    expect(todo).not.toContain("CLAUDE.md"); // drift never appears in todo
    expect(todo).not.toContain("**drift**");

    const originalInitCwd = process.env.INIT_CWD;
    process.env.INIT_CWD = root;
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    const exit = vi.spyOn(process, "exit").mockImplementation(((code) => {
      throw new Error(`exit ${code}`);
    }) as never);
    try {
      await expect(main(["doctor"])).rejects.toThrow("exit 1");
      const out = log.mock.calls.map((c) => String(c[0])).join("\n");
      expect(out).toContain("run /doc-fix in your agent");
    } finally {
      log.mockRestore();
      exit.mockRestore();
      if (originalInitCwd === undefined) delete process.env.INIT_CWD;
      else process.env.INIT_CWD = originalInitCwd;
    }
  });

  it("returns ok when SOT is clean and in sync", async () => {
    const root = makeTmpDir();
    // Keep this single-agent so init emits explicit `agents: [claude]` rules,
    // avoiding wildcard/no-globs lint that is intentionally not part of this case.
    writeFile(
      root,
      "CLAUDE.md",
      "# Project\n\n## Style\n\n- use 4-space indentation.\n",
    );
    await runInit({ projectRoot: root, selectAgent: async () => "claude" });

    const result = await runDoctor({ projectRoot: root });
    expect(result.buckets.mechanical.filter((i) => i.kind === "drift")).toEqual(
      [],
    );
    expect(result.buckets.decisive).toEqual([]);
    expect(result.buckets.generative).toEqual([]);
  });
});
