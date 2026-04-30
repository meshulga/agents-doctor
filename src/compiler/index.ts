import { CompiledOutput, Sot } from "../types.js";
import { compileClaude } from "./claude.js";
import { compileCodex } from "./codex.js";

export function compile(sot: Sot): CompiledOutput {
  const merged = new Map<string, Buffer>();
  if (sot.config.agents.includes("claude")) {
    for (const [k, v] of compileClaude(sot).files) merged.set(k, v);
  }
  if (sot.config.agents.includes("codex")) {
    for (const [k, v] of compileCodex(sot).files) merged.set(k, v);
  }
  return { files: merged };
}

export { GEN_HEADER, normalizeLf } from "./rules.js";
