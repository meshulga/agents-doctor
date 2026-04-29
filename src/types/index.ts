/**
 * Shared contract between the compile path (Dev A) and the TUI/quality path (Dev B).
 *
 * The TUI consumes `DoctorState`. The compile path is responsible for producing
 * every field on it. Mock data used by the TUI must conform to these shapes so
 * that integration is a merge, not a rewrite.
 *
 * Keep this file dependency-free. No imports from runtime modules.
 */

// ---------- Agents ----------

/** Agents supported in v1 (PRD §10). */
export type AgentId = "claude" | "codex";

/** A rule's `agents:` frontmatter value — either specific agents or all. */
export type AgentTarget = AgentId | "*";

// ---------- Rules ----------

/** Per-rule priority used by health checks to flag context-window bloat (PRD §9.2). */
export type RulePriority = "high" | "normal" | "low";

/** Frontmatter on a rule file under `.agents-doctor/rules/`. */
export interface RuleFrontmatter {
  /** Target agents. `["*"]` (default) means all supported agents. */
  agents: AgentTarget[];
  /** File-path patterns the rule applies to. Surfaced as a hint in CLAUDE.md / AGENTS.md. */
  globs?: string[];
  priority?: RulePriority;
  /** Free-form labels for filtering in the TUI tree tab. */
  tags?: string[];
}

export interface Rule {
  /** Stable identifier (e.g. slug derived from the source path). */
  id: string;
  /** Human-readable display name shown in the TUI. */
  name: string;
  /** Path to the source file under `.agents-doctor/rules/`. */
  source: string;
  frontmatter: RuleFrontmatter;
  /** Markdown body of the rule, frontmatter stripped. */
  body: string;
}

// ---------- Skills ----------

export interface Skill {
  id: string;
  name: string;
  /** Path to the SKILL.md folder under `.agents-doctor/skills/`. */
  source: string;
  description: string;
  agents: AgentTarget[];
}

// ---------- Slash commands ----------

export interface SlashCommand {
  id: string;
  name: string;
  /** Path to the source file under `.agents-doctor/commands/`. */
  source: string;
  agents: AgentTarget[];
  body: string;
}

// ---------- MCP servers ----------

export interface McpServer {
  id: string;
  name: string;
  /** Path to the entry in `.agents-doctor/mcp/servers.yaml`. */
  source: string;
  agents: AgentTarget[];
  /** Generic shape; per-agent compilers handle serialization quirks. */
  config: Record<string, unknown>;
}

// ---------- Overrides ----------

/** Free-form, agent-specific guidance that doesn't model cleanly as a scoped rule (PRD §7). */
export interface Override {
  agent: AgentId;
  /** Path under `.agents-doctor/overrides/`. */
  source: string;
  body: string;
}

// ---------- Coverage matrix (TUI matrix tab) ----------

/**
 * State of a single rule × agent cell in the matrix tab (PRD §9.5).
 * - `present`     — rule is rendered into the agent's output as expected.
 * - `absent`      — rule has explicit `agents:` scoping that excludes this agent.
 * - `drifted`     — generated file content no longer matches the lock file's hash.
 * - `overridden`  — rule is shadowed by an entry in `overrides/<agent>.md`.
 */
export type MatrixCellState = "present" | "absent" | "drifted" | "overridden";

export interface MatrixCell {
  ruleId: string;
  agent: AgentId;
  state: MatrixCellState;
  /** Path to the generated file containing this rule, when applicable. */
  generatedPath?: string;
}

// ---------- Health checks (TUI health tab) ----------

export type Severity = "error" | "warning" | "suggestion";

/**
 * Tells the user (and `/doctor-fix`) how the issue can be resolved (PRD §8.2).
 * - `mechanical` — fixable without judgment (formatting, dead links, drift).
 * - `decisive`   — needs a user decision (rule conflict, ambiguous target).
 * - `generative` — needs an AI agent's judgment (vague rule, missing description).
 */
export type FixCategory = "mechanical" | "decisive" | "generative";

export interface HealthIssue {
  /** Unique per check run. */
  id: string;
  /** Stable lint rule identifier (e.g. `drift/direct-edit`, `anti-pattern/vague-rule`). */
  ruleId: string;
  severity: Severity;
  category: FixCategory;
  /** Human-readable explanation. */
  message: string;
  /** What to do next. */
  fixHint: string;
  /** Offending file path. */
  file: string;
  /** 1-indexed line number, when applicable. */
  line?: number;
}

// ---------- Sync status (TUI footer) ----------

/**
 * Current sync state of the workspace (PRD §9.5 footer).
 * - `in-sync`   — generated files match the source of truth and the lock file.
 * - `drifted`   — generated files have been edited directly since the last sync.
 * - `unsynced`  — source of truth has changed and `sync` has not been run yet.
 */
export type SyncStatus = "in-sync" | "drifted" | "unsynced";

// ---------- Lock file ----------

export interface LockFileEntry {
  /** sha256 of the generated file's content at last sync. */
  hash: string;
  agent: AgentId;
  /** Source rule ids that contributed to this generated file. */
  ruleIds: string[];
  /** ISO-8601 timestamp of the sync that produced this entry. */
  syncedAt: string;
}

export interface LockFile {
  /** Schema version of the lock file itself, for forward compat. */
  version: string;
  /** Compiler version per agent that produced the current outputs. */
  compilerVersions: Record<AgentId, string>;
  /** Keyed by generated file path relative to repo root. */
  files: Record<string, LockFileEntry>;
}

// ---------- TUI input ----------

/**
 * Snapshot of everything the TUI needs to render. Produced by the compile path
 * after running `sync` + `check`. The TUI is a pure function of this state.
 */
export interface DoctorState {
  rules: Rule[];
  skills: Skill[];
  commands: SlashCommand[];
  mcpServers: McpServer[];
  overrides: Override[];
  matrix: MatrixCell[];
  issues: HealthIssue[];
  syncStatus: SyncStatus;
  /** Agents enabled in this project's `.agents-doctor/config.yaml`. */
  agents: AgentId[];
  lockFile: LockFile | null;
}
