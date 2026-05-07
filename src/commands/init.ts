import { existsSync, readFileSync, mkdirSync, writeFileSync, cpSync } from "node:fs";
import { dirname, join } from "node:path";
import yaml from "js-yaml";
import { splitByH2 } from "../headings.js";
import { walkProject } from "../walk.js";
import { runSync } from "./sync.js";
import {
  interactiveSelectAgent,
  type AgentChoice,
  type SelectAgentFn,
} from "../prompt.js";
import { serializeMarkdown } from "../compiler/frontmatter.js";

export interface InitOptions {
  projectRoot: string;
  selectAgent?: SelectAgentFn;
}

export interface InitResult {
  rulesEmitted: number;
  filesWritten: string[];
}

export async function runInit(opts: InitOptions): Promise<InitResult> {
  const root = opts.projectRoot;
  const select = opts.selectAgent ?? interactiveSelectAgent;

  if (existsSync(join(root, ".agents-doc"))) {
    throw new Error(`.agents-doc/ already exists at ${root}; refusing to overwrite`);
  }

  // 1. discover. Skip .claude/ — its CLAUDE.md (e.g. inside a skill folder
  // shipped as docs) is not a rule, and skills/commands are picked up by the
  // dedicated cpSync below.
  const found: { path: string; agent: AgentChoice; absPath: string }[] = [];
  for (const rel of walkProject(root)) {
    if (rel.startsWith(".claude/")) continue;
    const base = rel.split("/").at(-1);
    if (base === "CLAUDE.md") {
      found.push({ path: relDirOf(rel), agent: "claude", absPath: join(root, rel) });
    } else if (base === "AGENTS.md") {
      found.push({ path: relDirOf(rel), agent: "codex", absPath: join(root, rel) });
    }
  }

  const hasClaude = found.some((f) => f.agent === "claude");
  const hasCodex = found.some((f) => f.agent === "codex");
  const hasSkills = existsSync(join(root, ".claude/skills"));
  const hasCommands = existsSync(join(root, ".claude/commands"));

  if (found.length === 0 && !hasSkills && !hasCommands) {
    throw new Error("no agent files found to seed from");
  }

  // 2. priority agent (only matters if both agents are present)
  const priority: AgentChoice = hasClaude && hasCodex
    ? await select("Which agent wins on conflicts?")
    : hasClaude ? "claude" : "codex";

  // 3. group by path
  const byPath = new Map<string, { claude?: string; codex?: string }>();
  for (const f of found) {
    const slot = byPath.get(f.path) ?? {};
    if (f.agent === "claude") slot.claude = readFileSync(f.absPath, "utf8");
    else slot.codex = readFileSync(f.absPath, "utf8");
    byPath.set(f.path, slot);
  }

  // 4. resolve into rule files
  const usedFilenames = new Set<string>();
  const rules: { filename: string; frontmatter: Record<string, unknown>; body: string }[] = [];
  let ordinal = 0;
  for (const [path, sources] of byPath) {
    const resolved = resolveDirectory(path, sources, priority, usedFilenames, ordinal);
    rules.push(...resolved.rules);
    ordinal = resolved.nextOrdinal;
  }

  // 5. write SOT
  mkdirSync(join(root, ".agents-doc/rules"), { recursive: true });
  for (const r of rules) {
    const body = r.body.replace(/\r\n/g, "\n");
    writeFileSync(
      join(root, ".agents-doc/rules", r.filename),
      serializeMarkdown(r.frontmatter, body),
    );
  }
  if (hasSkills) {
    cpSync(join(root, ".claude/skills"), join(root, ".agents-doc/skills"), { recursive: true });
  }
  if (hasCommands) {
    cpSync(join(root, ".claude/commands"), join(root, ".agents-doc/commands"), { recursive: true });
  }

  const enabledAgents: AgentChoice[] = [];
  if (hasClaude || hasSkills || hasCommands) enabledAgents.push("claude");
  if (hasCodex) enabledAgents.push("codex");
  // enabledAgents is guaranteed non-empty by the earlier `no agent files` throw.
  writeFileSync(
    join(root, ".agents-doc/config.yaml"),
    yaml.dump({ agents: enabledAgents }, { lineWidth: -1 }),
  );

  // 6. run sync
  const sync = await runSync({ projectRoot: root });
  return { rulesEmitted: rules.length, filesWritten: sync.written };
}

function relDirOf(rel: string): string {
  const dir = dirname(rel).replace(/\\/g, "/");
  return dir === "." ? "." : dir;
}

interface ResolvedRule {
  filename: string;
  frontmatter: Record<string, unknown>;
  body: string;
}

function resolveDirectory(
  path: string,
  sources: { claude?: string; codex?: string },
  priority: AgentChoice,
  usedFilenames: Set<string>,
  startOrdinal: number,
): { rules: ResolvedRule[]; nextOrdinal: number } {
  const claudeChunks = sources.claude ? splitByH2(sources.claude) : [];
  const codexChunks = sources.codex ? splitByH2(sources.codex) : [];

  // Build a key→chunk map per side, where key is the heading text or `__intro__`.
  // Duplicate keys would silently drop one chunk's content, so abort with a clear
  // message instead — the user can consolidate the duplicates and re-run.
  const claudeMap = chunksToMap(claudeChunks, path, "CLAUDE.md");
  const codexMap = chunksToMap(codexChunks, path, "AGENTS.md");

  // Preserve original ordering: walk claude then codex chunks in their original order, dedup.
  const orderedKeys: string[] = [];
  for (const c of claudeChunks) {
    const k = c.heading ?? "__intro__";
    if (!orderedKeys.includes(k)) orderedKeys.push(k);
  }
  for (const c of codexChunks) {
    const k = c.heading ?? "__intro__";
    if (!orderedKeys.includes(k)) orderedKeys.push(k);
  }

  const out: ResolvedRule[] = [];
  let ordinal = startOrdinal;
  for (const key of orderedKeys) {
    const claudeBody = claudeMap.get(key);
    const codexBody = codexMap.get(key);

    let body: string;
    let agents: AgentChoice[] | ["*"];
    if (claudeBody !== undefined && codexBody !== undefined) {
      if (claudeBody === codexBody) {
        body = claudeBody;
        agents = ["*"];
      } else {
        body = priority === "claude" ? claudeBody : codexBody;
        agents = [priority];
      }
    } else if (claudeBody !== undefined) {
      body = claudeBody;
      agents = ["claude"];
    } else {
      body = codexBody!;
      agents = ["codex"];
    }

    const filename = uniqueFilename(path, key, usedFilenames, ordinal);
    ordinal++;
    const frontmatter: Record<string, unknown> = { agents };
    if (path !== ".") frontmatter.path = path;
    out.push({ filename, frontmatter, body });
  }
  return { rules: out, nextOrdinal: ordinal };
}

function chunksToMap(
  chunks: { heading: string | null; body: string }[],
  path: string,
  filename: string,
): Map<string, string> {
  const map = new Map<string, string>();
  for (const c of chunks) {
    const key = c.heading ?? "__intro__";
    if (map.has(key)) {
      const where = path === "." ? filename : `${path}/${filename}`;
      const label = c.heading === null ? "intro chunk (pre-heading)" : `'## ${c.heading}'`;
      throw new Error(
        `${where} has duplicate ${label}; consolidate before running init`,
      );
    }
    map.set(key, c.body);
  }
  return map;
}

function slugify(input: string): string {
  return (
    input
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "section"
  );
}

function uniqueFilename(
  path: string,
  key: string,
  used: Set<string>,
  ordinal: number,
): string {
  const headingSlug = key === "__intro__" ? "intro" : slugify(key);
  const pathSlug = path === "." ? "" : slugify(path) + "--";
  const ord = String(ordinal).padStart(3, "0");
  const base = `${ord}-${pathSlug}${headingSlug}`;
  let candidate = `${base}.md`;
  let n = 2;
  while (used.has(candidate)) {
    candidate = `${base}-${n}.md`;
    n++;
  }
  used.add(candidate);
  return candidate;
}
