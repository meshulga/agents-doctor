export type Agent = "claude" | "codex";

export interface RuleFrontmatter {
  agents: Agent[] | ["*"];
  globs?: string[];
  priority: "high" | "normal" | "low";
  path: string;
}

export interface Rule {
  filename: string;          // basename inside .agents-doc/rules/
  frontmatter: RuleFrontmatter;
  body: string;              // post-frontmatter content (no trailing trim)
}

export interface SkillFile {
  relativePath: string;      // path inside the skill folder, e.g. "SKILL.md", "scripts/run.sh"
  bytes: Buffer;             // raw bytes for non-SKILL.md, transformed bytes for SKILL.md
}

export interface Skill {
  name: string;              // folder name
  files: SkillFile[];        // includes a transformed SKILL.md and verbatim siblings
}

export interface Command {
  name: string;              // basename without .md
  frontmatter: Record<string, unknown>;
  body: string;
}

export interface SotConfig {
  agents: Agent[];
}

export interface Sot {
  config: SotConfig;
  rules: Rule[];
  skills: Skill[];
  commands: Command[];
}

export interface CompiledOutput {
  /**
   * Map of project-relative path → file bytes that would be written to disk by sync.
   * Keys use forward slashes regardless of host OS.
   * Values are LF-normalized for text files; binary skill assets are left untouched.
   */
  files: Map<string, Buffer>;
}
