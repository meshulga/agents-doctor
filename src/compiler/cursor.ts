import { CompiledOutput, Rule, Sot } from "../types.js";
import { serializeMarkdown } from "./frontmatter.js";
import { GEN_HEADER, concatBodies, rulesForAgent } from "./rules.js";

export function compileCursor(sot: Sot): CompiledOutput {
  const files = new Map<string, Buffer>();
  const rules = rulesForAgent(sot.rules, "cursor");
  for (const rule of rules) {
    const fm = buildCursorFrontmatter(rule);
    const body = GEN_HEADER + concatBodies([rule]);
    const content = serializeMarkdown(fm, body);
    const mdcName = rule.filename.replace(/\.md$/, ".mdc");
    files.set(`.cursor/rules/${mdcName}`, Buffer.from(content, "utf8"));
  }
  return { files };
}

function buildCursorFrontmatter(rule: Rule): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (rule.frontmatter.description !== undefined) {
    out.description = rule.frontmatter.description;
  }
  if (rule.frontmatter.globs !== undefined) {
    out.globs = rule.frontmatter.globs;
    out.alwaysApply = false;
  } else if (rule.frontmatter.path !== ".") {
    out.globs = [`${rule.frontmatter.path}/**`];
    out.alwaysApply = false;
  } else {
    out.alwaysApply = true;
  }
  return out;
}
