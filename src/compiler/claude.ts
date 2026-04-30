import { CompiledOutput, Sot } from "../types.js";
import {
  GEN_HEADER,
  concatBodies,
  groupByPath,
  joinPath,
  rulesForAgent,
} from "./rules.js";

export function compileClaude(sot: Sot): CompiledOutput {
  const files = new Map<string, Buffer>();

  const rules = rulesForAgent(sot.rules, "claude");
  const grouped = groupByPath(rules);
  for (const [path, group] of grouped) {
    const out = GEN_HEADER + concatBodies(group);
    files.set(joinPath(path, "CLAUDE.md"), Buffer.from(out, "utf8"));
  }

  return { files };
}
