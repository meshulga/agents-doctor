import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { compile } from "../compiler/index.js";
import { loadSot } from "../sot/loader.js";

export interface SyncOptions {
  projectRoot: string;
}

export interface SyncResult {
  written: string[];
}

export async function runSync(opts: SyncOptions): Promise<SyncResult> {
  const sot = loadSot(opts.projectRoot);
  const compiled = compile(sot);
  const written: string[] = [];
  for (const [rel, bytes] of compiled.files) {
    const abs = join(opts.projectRoot, rel);
    mkdirSync(dirname(abs), { recursive: true });
    writeFileSync(abs, bytes);
    written.push(rel);
  }
  return { written };
}
