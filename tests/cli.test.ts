import { afterEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { main } from "../src/cli.js";
import { makeTmpDir, writeFile } from "./helpers/tmp.js";

const pkgVersion = (
  JSON.parse(readFileSync(join(process.cwd(), "package.json"), "utf8")) as {
    version: string;
  }
).version;

describe("CLI argv dispatch", () => {
  it("prints package.json version on --version", async () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    await main(["--version"]);
    expect(log).toHaveBeenCalledWith(pkgVersion);
    log.mockRestore();
  });

  it("prints package.json version on -v", async () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    await main(["-v"]);
    expect(log).toHaveBeenCalledWith(pkgVersion);
    log.mockRestore();
  });

  it("prints help on --help with no error", async () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    await main(["--help"]);
    const out = log.mock.calls.map((c) => c[0]).join("\n");
    expect(out).toContain("agents-doc");
    expect(out).toContain("init");
    expect(out).toContain("sync");
    expect(out).toContain("check");
    log.mockRestore();
  });

  describe("INIT_CWD targeting", () => {
    const originalInitCwd = process.env.INIT_CWD;

    afterEach(() => {
      if (originalInitCwd === undefined) delete process.env.INIT_CWD;
      else process.env.INIT_CWD = originalInitCwd;
    });

    it("sync targets INIT_CWD instead of process.cwd() when set", async () => {
      // Project lives in tmp; cwd stays in the agents-doc repo (where
      // there is no .agents-doc/), so a successful sync proves we did
      // pick up INIT_CWD.
      const fixture = makeTmpDir();
      writeFile(fixture, ".agents-doc/config.yaml", "agents: [claude]\n");
      writeFile(fixture, ".agents-doc/rules/r.md", "---\n---\nbody\n");
      process.env.INIT_CWD = fixture;

      const log = vi.spyOn(console, "log").mockImplementation(() => {});
      await main(["sync"]);
      log.mockRestore();

      const claude = readFileSync(join(fixture, "CLAUDE.md"), "utf8");
      expect(claude).toContain("body");
    });
  });
});
