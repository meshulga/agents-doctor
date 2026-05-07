# agents-doc — Product Requirements Document

**Status:** v0.3.0 shipped (Codex skills + auto-installed `doc-fix` skill)
**Owner:** TBD
**Last updated:** 2026-05-07
**License:** MIT

-----

## 1. Summary

`agents-doc` is an open-source CLI that gives teams using multiple AI coding agents (Claude Code, Codex) one place to author and synchronize the rules, skills, and slash commands those agents read.

It does three things:

1. Compiles a single source of truth into every agent's native config files (`sync`).
2. Mechanically verifies that the agent files on disk match what the source of truth would produce, and flags untracked extras (`check`).
3. Bootstraps the source of truth from a project that already has agent config files (`init`).

Distributed via `npm`, written in TypeScript. v1 targets Claude Code and Codex.

v1 is the foundation. The headline feature for v2 is an **AI-fix loop**: a slash command (`/doc-fix`) that the user runs from inside their AI agent to resolve judgment-call issues — vague rules, conflicts, missing skill descriptions — that mechanical tools cannot fix. Sync and check exist to make that loop possible; they are infrastructure, not the product.

## 2. Problem

Every AI coding agent reads its own config file. Claude Code reads `CLAUDE.md`. Codex reads `AGENTS.md`. Each has its own discovery rules and conventions.

Teams using more than one agent face two problems:

- **Manual duplication.** The same rule has to be written in two files, in slightly different shapes, every time it changes.
- **Silent drift.** A rule edited directly in `CLAUDE.md` quietly diverges from `AGENTS.md`. No warning when they disagree.

Existing tools solve compilation (`rulesync`, `Ruler`) or linting (`agnix`, `cclint`), but none combine a single source of truth with mechanical verification across multiple agents in a single tool.

## 3. Goals and non-goals

### Goals (v1)

- Single source of truth for rules, skills, and slash commands across Claude Code and Codex.
- One-shot compilation of source of truth → agent config files (`sync`).
- Mechanical drift detection: agent files vs. recompiled source of truth, plus untracked extras (`check`).
- Brownfield onboarding: detect existing agent files anywhere in the repo and seed the SOT from them (`init`).
- Support for nested `CLAUDE.md` / `AGENTS.md` at arbitrary paths via per-rule `path:` frontmatter.

### Non-goals (v1)

- No MCP server management.
- No override / escape-hatch files.
- No anti-pattern lint (vague rules, dead `@references`, etc.). Drift only.
- No semantic drift detection. Drift is mechanical content comparison only.
- No TUI, no AI-fix loop, no slash command installation by the tool itself.
- No `diff`, `revert`, profiles, or `.bak` files. `git` is the safety net.
- No agents beyond Claude Code and Codex. Cursor, Windsurf, Gemini CLI, Copilot, Cline, Aider are post-v1.
- No web UI, IDE plugin, LSP, or hosted analytics.
- No automated backport of direct edits to generated files. Direct edits are flagged; the user resolves them by hand.

## 4. Target users

- **Solo developer, multi-agent.** Uses Claude Code and Codex, tired of keeping two files in sync.
- **Tech lead, small team (3–15 engineers).** Wants a shared, versioned set of AI rules. Cares about CI enforcement (`check` exits non-zero).
- **Open-source maintainer.** Wants contributors to get consistent agent guidance without maintaining N config files.

Not a target: developers who use exactly one AI agent. They have no sync problem.

## 5. Competitive landscape

|Tool             |Sync   |Drift check|Multi-agent|
|-----------------|-------|-----------|-----------|
|rulesync         |Yes    |No         |20+        |
|Ruler            |Yes    |No         |Many       |
|agnix            |No     |Lint only  |12+        |
|cclint           |No     |Lint only  |Claude only|
|**agents-doc**|**Yes**|**Yes**    |**2 in v1**|

Sync + drift check together is the wedge. v1 stays narrowly focused on two agents.

## 6. Core concepts

- **Source of truth (SOT).** A `.agents-doc/` directory containing `config.yaml`, modular markdown rules, skill folders, and slash commands. The only thing humans hand-edit.
- **Generated files.** Every agent-specific file (`CLAUDE.md`, `AGENTS.md`, `.claude/skills/*`, `.claude/commands/*`) is regenerated from the SOT. Tracked in git but treated as derived.
- **Drift.** A generated file's on-disk content does not match what compiling the SOT would produce, OR an agent directory contains a file that has no SOT origin (extra).

## 7. User flows

### 7.1 Init (brownfield onboarding)

1. User runs `agents-doc init` in a repo that already has `CLAUDE.md`, `AGENTS.md`, `.claude/skills/`, and/or `.claude/commands/`.
2. If `.agents-doc/` already exists, the command aborts with a non-zero exit and a clear error. (No `--force` in v1.)
3. Tool walks the project tree, respecting `.gitignore`, and discovers every `CLAUDE.md` and `AGENTS.md` (root and nested), plus `.claude/skills/` and `.claude/commands/` at the project root.
4. Tool prompts the user for a **priority agent** (`claude` or `codex`). The priority agent wins all conflicts.
5. For each `(path, CLAUDE.md, AGENTS.md)` triple discovered:
    - Both files are split into chunks by top-level markdown headings (`## …`). Pre-heading content is treated as a leading chunk.
    - Chunks identical across both files are emitted as a single rule with `agents: ["*"]`.
    - Chunks present in only one file are emitted as a rule with `agents: [<that-agent>]`.
    - Chunks present in both but with different content are resolved in favor of the priority agent. The losing chunk is dropped.
    - All resulting rules carry `path:` matching the directory they were discovered in.
6. Skills (each `.claude/skills/<name>/`) and commands (each `.claude/commands/<name>.md`) are copied into `.agents-doc/skills/` and `.agents-doc/commands/` verbatim. (These have no Codex equivalent, so no conflict resolution applies.)
7. Tool writes `.agents-doc/config.yaml` with both agents enabled.
8. Tool runs `sync` automatically. The existing on-disk agent files are overwritten with the compiled output. The user reviews the resulting `git diff` and commits.

The existing agent files are not deleted or backed up by `init` itself; sync's overwrite is the next step, and git is the safety net.

### 7.2 Sync

1. User edits files in `.agents-doc/`.
2. User runs `agents-doc sync`.
3. Tool compiles the SOT and writes every agent file to disk, overwriting existing content. Each generated file starts with a header comment marking it as generated.
4. User reviews `git diff` and commits.

### 7.3 Check

1. User runs `agents-doc check` (locally or in CI).
2. Tool compiles the SOT in memory and compares against on-disk agent files.
3. For each tracked agent path: missing, content mismatch, or matched.
4. For each agent directory (`.claude/skills/`, `.claude/commands/`): file present on disk with no SOT origin → flagged as extra.
5. Any issue → exit non-zero with a list of problems and the affected paths. Clean → exit 0.

### 7.4 Direct edits to generated files

Direct edits are detected by `check` as drift. The user must either re-run `sync` (discarding the direct edit) or port the change into the SOT and re-sync. The tool does not automatically route the edit back to source.

## 8. Functional requirements

### 8.1 Source-of-truth structure

```
.agents-doc/
├── config.yaml           # agents: [claude, codex]
├── rules/                # flat directory of .md files w/ frontmatter
│   ├── general.md        #   path defaults to "."
│   ├── style.md
│   └── todo-components.md #  path: src/apps/todo/components
├── skills/               # SKILL.md format (Claude only)
│   └── refactor-py/
│       └── SKILL.md
└── commands/             # slash commands as .md (Claude only)
    └── review.md
```

`config.yaml` for v1 contains a single key:

```yaml
agents: [claude, codex]
```

### 8.2 Rule frontmatter

Every file in `rules/` carries YAML frontmatter:

- `agents`: list of target agents (`claude`, `codex`), or `["*"]` for all. Default `["*"]`.
- `globs`: file-path patterns the rule applies to. Optional metadata recorded in the SOT but not surfaced in v1's compiled output (rule frontmatter is stripped entirely per §8.3). Reserved for use by the v2 anti-pattern lint and AI-fix loop.
- `priority`: `high` / `normal` / `low`. Used as an ordering hint inside the compiled output (high first). Default `normal`.
- `path`: project-relative directory where this rule's compiled output should be placed. Default `.` (project root). Multiple rules with the same `path` are merged into a single `CLAUDE.md` / `AGENTS.md` at that location.

Example:

```markdown
---
agents: ["*"]
globs: ["src/apps/todo/components/**"]
priority: normal
path: src/apps/todo/components
---

# Component conventions

…rule body…
```

### 8.3 Compilation (sync)

- Each agent has a pluggable compiler module.
- **Rules → CLAUDE.md / AGENTS.md.** For each unique `path` value in scope for an agent, the compiler concatenates matching rules (ordered by `priority` then filename) and writes a single output file at `<path>/<AGENT_FILE>` (`CLAUDE.md` for Claude, `AGENTS.md` for Codex). Each rule's frontmatter is **stripped entirely** before concatenation; only the rule body reaches the compiled output. The compiled file starts with the literal header:
  ```
  <!-- Generated by agents-doc; do not edit. Source: .agents-doc/ -->
  ```
- **Skills (Claude only).** Each skill folder under `.agents-doc/skills/<name>/` is copied **recursively, verbatim** to `.claude/skills/<name>/`. Helper scripts, references, and supporting files travel with the skill. The skill's `SKILL.md` frontmatter passes through a whitelist (`name`, `description`) plus an injected `generated_by: agents-doc` field; non-whitelisted keys are dropped. Other files in the skill folder are copied byte-for-byte.
- **Commands (Claude only).** Each `.agents-doc/commands/<name>.md` is copied to `.claude/commands/<name>.md`. Frontmatter passes through a whitelist (`description`, `allowed-tools`, `argument-hint`, `model`) plus the injected `generated_by` field; non-whitelisted keys are dropped.
- **Line endings.** All compiled output is written with LF line endings regardless of host OS, so `check` does not flag spurious drift on mixed-OS teams.
- **Overwrite.** Sync overwrites existing files unconditionally. No `.bak`. Git is the safety net.

### 8.4 Check

- Compiles the SOT in memory (no writes).
- For each generated path the compiler would produce, compares the in-memory bytes against the on-disk bytes (LF-normalized, gen header included). Mismatches and missing files are reported.
- **Walk scope.** Discovers nested `CLAUDE.md` and `AGENTS.md` at any depth by walking the project tree, respecting `.gitignore` and skipping a default heavy-path list (`.git`, `node_modules`, `dist`, `build`, `.next`, `.nuxt`, `target`, `vendor`). The same walk rules are used by `init`. `.claude/skills/` and `.claude/commands/` are checked at the project root only.
- **Extras.** Any `CLAUDE.md` / `AGENTS.md` discovered on disk that has no corresponding SOT origin (no rule with that `path:`), or any file inside `.claude/skills/` or `.claude/commands/` not produced by sync, is reported as an extra.
- **Per-agent scoping.** `agents: [claude]` is honored — a rule scoped to one agent is not flagged as missing from the other. Likewise, a directory containing only Claude-scoped rules will not be flagged for a missing `AGENTS.md`.
- Any reported issue → process exits non-zero. Clean → exits 0.

### 8.5 Init

- Aborts non-zero if `.agents-doc/` exists.
- Walks the project tree, honoring `.gitignore` and skipping common heavy paths (`.git/`, `node_modules/`, etc.) by default.
- Discovers every `CLAUDE.md` and `AGENTS.md` at any depth, plus `.claude/skills/` and `.claude/commands/` at the project root.
- Prompts interactively for a priority agent (`claude` | `codex`) used to resolve conflicts.
- Splits each discovered `CLAUDE.md` / `AGENTS.md` into chunks by top-level headings; merges identical chunks under `agents: ["*"]`, scopes single-side chunks to the originating agent, and drops the loser of any conflicting chunk.
- Writes the seeded SOT and runs `sync` immediately.

### 8.6 CLI surface

|Command               |Purpose                                                          |
|----------------------|-----------------------------------------------------------------|
|`agents-doc init`  |Bootstrap `.agents-doc/` from existing agent files.            |
|`agents-doc sync`  |Regenerate all agent configs from the source of truth.            |
|`agents-doc check` |Verify on-disk agent files match the source of truth.             |

No flags in v1. No `--ci`, `--profile`, `--force`, `--check`. CI integration is just `agents-doc check` in a job step.

## 9. Supported agents (v1)

- **Claude Code** — full support: `CLAUDE.md` (root + nested), `.claude/skills/`, `.claude/commands/`.
- **Codex CLI** — rules only: `AGENTS.md` (root + nested). Codex has no native skills or slash commands; SOT skills and commands are not compiled for Codex and not flagged as missing from it.

Expansion roadmap (post-v1, in order of likely demand): Cursor, Windsurf, Gemini CLI, GitHub Copilot, Cline, Aider.

## 10. Success metrics

- **Activation:** % of installs that run `sync` at least once.
- **Retention:** % of projects that run `check` or `sync` again within 30 days.
- **CI adoption:** % of projects that wire `check` into their pipeline.

## 11. Risks and mitigations

|Risk                                            |Mitigation                                                                                                       |
|------------------------------------------------|------------------------------------------------------------------------------------------------------------------|
|rulesync or Ruler ships drift detection         |Stay narrowly focused on the two-agent + drift wedge. Ship fast.                                                  |
|Agent vendors change config formats             |Pluggable compiler-per-agent isolates churn to one module.                                                        |
|Users distrust automatic edits to their config  |Every change is visible via `git diff`. The gen header marks files as derived.                                    |
|Drift detection misses semantic divergence      |v1 is mechanical only by design. Document this clearly. Semantic checks are a v1.x consideration.                 |

## 12. Milestones

- **M0 — Spec frozen.** This document accepted.
- **M1 — TS scaffold + Claude compiler.** SOT schema defined, Claude compiler working end-to-end, `sync` operational for rules at root.
- **M2 — Codex compiler.** `AGENTS.md` compilation, including nested paths.
- **M3 — Skills + commands.** Claude skills and commands sync.
- **M4 — Check.** Drift + extras detection. Non-zero exit on issues.
- **M5 — Init.** Brownfield onboarding, including nested file walk and priority-agent conflict resolution.
- **v1.0 — Public release.**

## 13. Shipped in v0.2.0

The features that make agents-doc distinct from `rulesync` and `Ruler` shipped in v0.2.0 (May 2026):

- **AI-fix loop (headline feature).** `agents-doc doctor` runs drift + rule-quality checks, classifies issues into mechanical, decisive, and generative buckets, and writes judgment items to `.agents-doc/todo.md`. A built-in `/doc-fix` slash command is auto-installed for Claude Code on every `sync`; the agent reads the todo file, edits the SOT, ticks resolved items, and re-runs `sync` + `check`. Tick state is preserved across re-runs of `doctor`. The slash command name is reserved — authoring `.agents-doc/commands/doc-fix.md` is rejected by the loader. Codex CLI users get the same `todo.md` artifact and can work through it directly; no native slash command yet.
- **Anti-pattern lint.** Rule-level static analysis: vague phrasing, cross-rule contradictions, dead `@references`, missing required frontmatter (heading, scoping), instruction-count blowouts, over-broad globs.

## 14. Shipped in v0.3.0

- **Codex skill compilation.** `agents-doc sync` now emits each SOT skill to `.agents/skills/<name>/` for Codex, mirroring the existing `.claude/skills/<name>/` output for Claude. `check` tracks the directory; `init` imports existing `.agents/skills/` (and refuses init when the same skill name exists in both `.claude/skills/` and `.agents/skills/` with different content — user consolidates by hand).
- **Codex parity for `/doc-fix`.** Auto-installed at `.agents/skills/doc-fix/SKILL.md` whenever Codex is enabled. Same body as the Claude `/doc-fix` slash command; reserved name in both surfaces.

## 15. Roadmap

- **v3 — TUI.** Three tabs: rules × agents matrix, hierarchical browser, health dashboard. Read-only browse over the SOT and check results.
- **Later.** More agents (Cursor, Windsurf, Gemini CLI, Copilot, Cline, Aider). MCP server management. Override files. Profiles. Semantic drift detection. Best-practices registry.

## 16. Open questions

- How should the compiler order multiple rules at the same `path` beyond `priority` then filename? Should `priority` be the only ordering signal, or do we need an explicit `order:` field?
- For nested `<path>/CLAUDE.md` files: do we also emit a marker in the root `CLAUDE.md` so the agent can discover them, or rely on Claude Code's native nested-file discovery?
- Should `check` ever auto-fix safe mechanical issues (e.g., re-emit a missing gen header) or always defer to `sync`?

-----

*This PRD intentionally omits implementation specifics. Architecture, file formats, and module breakdowns are deferred to a separate technical design document.*
