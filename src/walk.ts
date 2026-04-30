import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join, relative } from "node:path";
import ignore from "ignore";

const HEAVY_PATHS = new Set([
  ".git",
  "node_modules",
  "dist",
  "build",
  ".next",
  ".nuxt",
  "target",
  "vendor",
]);

export function* walkProject(root: string): Generator<string> {
  yield* walkDir(root, root, []);
}

function* walkDir(root: string, dir: string, inheritedPatterns: string[]): Generator<string> {
  const localGitignorePath = join(dir, ".gitignore");
  const patterns = inheritedPatterns.slice();
  if (existsSync(localGitignorePath)) {
    const text = readFileSync(localGitignorePath, "utf8");
    patterns.push(...text.split(/\r?\n/).filter((l) => l && !l.startsWith("#")));
  }
  const ig = ignore().add(patterns);

  const entries = readdirSync(dir, { withFileTypes: true });
  // Sort for deterministic iteration.
  entries.sort((a, b) => a.name.localeCompare(b.name));

  for (const entry of entries) {
    if (entry.isDirectory() && HEAVY_PATHS.has(entry.name)) continue;
    const full = join(dir, entry.name);
    const rel = relative(root, full).split(/\\/g).join("/");
    if (ig.ignores(entry.isDirectory() ? rel + "/" : rel)) continue;

    if (entry.isDirectory()) {
      yield* walkDir(root, full, patterns);
    } else if (entry.isFile()) {
      yield rel;
    }
  }
}
