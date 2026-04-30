import { describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { main } from "../src/cli.js";

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
    expect(out).toContain("agents-doctor");
    expect(out).toContain("init");
    expect(out).toContain("sync");
    expect(out).toContain("check");
    log.mockRestore();
  });
});
