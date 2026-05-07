import { CompiledOutput, Sot } from "../types.js";
import { DOC_FIX_BODY, DOC_FIX_SKILL_FRONTMATTER } from "../builtin/doc-fix.js";
import { serializeMarkdown } from "./frontmatter.js";
import {
  GEN_HEADER,
  concatBodies,
  groupByPath,
  joinPath,
  rulesForAgent,
} from "./rules.js";

export function compileCodex(sot: Sot): CompiledOutput {
  const files = new Map<string, Buffer>();
  const rules = rulesForAgent(sot.rules, "codex");
  const grouped = groupByPath(rules);
  for (const [path, group] of grouped) {
    const out = GEN_HEADER + concatBodies(group);
    files.set(joinPath(path, "AGENTS.md"), Buffer.from(out, "utf8"));
  }

  for (const skill of sot.skills) {
    for (const file of skill.files) {
      files.set(`.agents/skills/${skill.name}/${file.relativePath}`, file.bytes);
    }
  }

  // Auto-install the built-in doc-fix skill. Codex equivalent of Claude's
  // /doc-fix slash command: no slash-command surface here, so the workflow
  // ships as a skill that the agent can pattern-match on the description.
  const skillFm = { ...DOC_FIX_SKILL_FRONTMATTER, generated_by: "agents-doc" };
  const skillMd = serializeMarkdown(skillFm, DOC_FIX_BODY);
  files.set(
    ".agents/skills/doc-fix/SKILL.md",
    Buffer.from(skillMd, "utf8"),
  );

  return { files };
}
