import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import yaml from "js-yaml";
import matter from "gray-matter";
import { serializeMarkdown, whitelist } from "../compiler/frontmatter.js";
import {
  Agent,
  Command,
  Rule,
  RuleFrontmatter,
  Skill,
  SkillFile,
  Sot,
  SotConfig,
} from "../types.js";

const RULE_FM_DEFAULTS: RuleFrontmatter = {
  agents: ["*"],
  priority: "normal",
  path: ".",
};

const SKILL_WHITELIST = new Set(["name", "description"]);
const COMMAND_WHITELIST = new Set([
  "description",
  "allowed-tools",
  "argument-hint",
  "model",
]);

export function loadSot(projectRoot: string): Sot {
  const sotDir = join(projectRoot, ".agents-doctor");
  if (!existsSync(sotDir)) {
    throw new Error(`.agents-doctor/ not found at ${projectRoot}`);
  }

  const config = loadConfig(sotDir);
  const rules = loadRules(sotDir);
  const skills = loadSkills(sotDir);
  const commands = loadCommands(sotDir);

  return { config, rules, skills, commands };
}

function loadConfig(sotDir: string): SotConfig {
  const path = join(sotDir, "config.yaml");
  if (!existsSync(path)) throw new Error(`config.yaml missing at ${path}`);
  const parsed = yaml.load(readFileSync(path, "utf8")) as { agents?: Agent[] } | null;
  if (!parsed || !Array.isArray(parsed.agents) || parsed.agents.length === 0) {
    throw new Error(`config.yaml must define a non-empty agents list`);
  }
  for (const a of parsed.agents) {
    if (a !== "claude" && a !== "codex") {
      throw new Error(`unknown agent in config.yaml: ${a}`);
    }
  }
  return { agents: parsed.agents };
}

function loadRules(sotDir: string): Rule[] {
  const dir = join(sotDir, "rules");
  if (!existsSync(dir)) return [];
  const files = readdirSync(dir).filter((f) => f.endsWith(".md")).sort();
  return files.map((filename) => {
    const raw = readFileSync(join(dir, filename), "utf8");
    const parsed = matter(raw);
    const fm = mergeRuleFrontmatter(parsed.data, filename);
    return { filename, frontmatter: fm, body: parsed.content };
  });
}

function mergeRuleFrontmatter(
  raw: Record<string, unknown>,
  filename: string,
): RuleFrontmatter {
  const out: RuleFrontmatter = { ...RULE_FM_DEFAULTS };
  if (raw.agents !== undefined) {
    if (!Array.isArray(raw.agents)) {
      throw new Error(`${filename}: agents must be an array`);
    }
    if (raw.agents.length === 1 && raw.agents[0] === "*") {
      out.agents = ["*"];
    } else {
      for (const a of raw.agents) {
        if (a !== "claude" && a !== "codex") {
          throw new Error(`${filename}: unknown agent '${a}'`);
        }
      }
      out.agents = raw.agents as Agent[];
    }
  }
  if (raw.priority !== undefined) {
    if (raw.priority !== "high" && raw.priority !== "normal" && raw.priority !== "low") {
      throw new Error(`${filename}: priority must be high|normal|low`);
    }
    out.priority = raw.priority;
  }
  if (raw.path !== undefined) {
    if (typeof raw.path !== "string") throw new Error(`${filename}: path must be a string`);
    out.path = normalizePath(raw.path);
  }
  if (raw.globs !== undefined) {
    if (!Array.isArray(raw.globs)) throw new Error(`${filename}: globs must be an array`);
    out.globs = raw.globs as string[];
  }
  return out;
}

function normalizePath(input: string): string {
  const trimmed = input.trim().replace(/\\/g, "/").replace(/^\.\//, "").replace(/\/+$/, "");
  return trimmed === "" ? "." : trimmed;
}

function loadSkills(sotDir: string): Skill[] {
  const dir = join(sotDir, "skills");
  if (!existsSync(dir)) return [];
  const skillNames = readdirSync(dir).filter((n) =>
    statSync(join(dir, n)).isDirectory(),
  );
  return skillNames.sort().map((name) => loadSkill(join(dir, name), name));
}

function loadSkill(skillDir: string, name: string): Skill {
  const files: SkillFile[] = [];
  const skillMdPath = join(skillDir, "SKILL.md");
  if (!existsSync(skillMdPath)) {
    throw new Error(`skill '${name}' missing SKILL.md`);
  }

  for (const rel of allFilesUnder(skillDir)) {
    const abs = join(skillDir, rel);
    if (rel === "SKILL.md") {
      files.push({ relativePath: rel, bytes: Buffer.from(transformSkillMd(abs)) });
    } else {
      files.push({ relativePath: rel, bytes: readFileSync(abs) });
    }
  }
  return { name, files };
}

function transformSkillMd(absPath: string): string {
  const raw = readFileSync(absPath, "utf8");
  const parsed = matter(raw);
  const filtered = whitelist(parsed.data, SKILL_WHITELIST);
  filtered.generated_by = "agents-doctor";
  return serializeMarkdown(filtered, parsed.content);
}

function loadCommands(sotDir: string): Command[] {
  const dir = join(sotDir, "commands");
  if (!existsSync(dir)) return [];
  const files = readdirSync(dir).filter((f) => f.endsWith(".md")).sort();
  return files.map((filename) => {
    const raw = readFileSync(join(dir, filename), "utf8");
    const parsed = matter(raw);
    const filtered = whitelist(parsed.data, COMMAND_WHITELIST);
    return {
      name: filename.replace(/\.md$/, ""),
      frontmatter: filtered,
      body: parsed.content,
    };
  });
}

function allFilesUnder(dir: string): string[] {
  const out: string[] = [];
  const stack: string[] = [""];
  while (stack.length > 0) {
    const sub = stack.pop()!;
    const here = sub === "" ? dir : join(dir, sub);
    for (const entry of readdirSync(here, { withFileTypes: true })) {
      const childRel = sub === "" ? entry.name : `${sub}/${entry.name}`;
      if (entry.isDirectory()) stack.push(childRel);
      else if (entry.isFile()) out.push(childRel);
    }
  }
  return out.sort();
}
