import { mkdtempSync, rmSync, writeFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { afterEach } from "vitest";

const created: string[] = [];

afterEach(() => {
  while (created.length > 0) {
    const dir = created.pop()!;
    rmSync(dir, { recursive: true, force: true });
  }
});

export function makeTmpDir(): string {
  const dir = mkdtempSync(join(tmpdir(), "agents-doc-"));
  created.push(dir);
  return dir;
}

export function writeFile(root: string, relPath: string, content: string | Buffer): void {
  const full = join(root, relPath);
  mkdirSync(dirname(full), { recursive: true });
  writeFileSync(full, content);
}
