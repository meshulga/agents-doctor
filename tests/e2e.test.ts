import { describe, expect, it } from "vitest";
import { writeFileSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { runInit } from "../src/commands/init.js";
import { runSync } from "../src/commands/sync.js";
import { runCheck } from "../src/commands/check.js";
import { makeTmpDir, writeFile } from "./helpers/tmp.js";

describe("init → sync → check round trip", () => {
  it("round-trips cleanly", async () => {
    const root = makeTmpDir();
    writeFile(root, "CLAUDE.md", "intro\n## Style\nuse spaces\n");
    writeFile(root, "AGENTS.md", "intro\n## Style\nuse spaces\n");
    await runInit({ projectRoot: root, selectAgent: async () => "claude" });
    const r1 = await runCheck({ projectRoot: root });
    expect(r1.ok).toBe(true);

    // edit a rule
    const rulesDir = join(root, ".agents-doc/rules");
    const styleName = readdirSync(rulesDir).find((f) => f.endsWith("-style.md"))!;
    const stylePath = join(rulesDir, styleName);
    const before = readFileSync(stylePath, "utf8");
    writeFileSync(stylePath, before.replace("use spaces", "use 2 spaces"));

    const r2 = await runCheck({ projectRoot: root });
    expect(r2.ok).toBe(false);
    expect(r2.issues.some((i) => i.kind === "mismatch")).toBe(true);

    await runSync({ projectRoot: root });
    const r3 = await runCheck({ projectRoot: root });
    expect(r3.ok).toBe(true);
  });
});
