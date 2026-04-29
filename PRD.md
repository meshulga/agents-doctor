# agents-doctor — Product Requirements Document

**Status:** Draft v0.1
**Owner:** TBD
**Last updated:** 2026-04-29

-----

## 1. Summary

`agents-doctor` is an open-source CLI + TUI tool that gives teams using multiple AI coding agents (Claude Code, Codex, Cursor, …) one place to author, validate, and synchronize the rules, skills, MCP servers, and slash commands those agents read.

It does three things no existing tool does together:

1. Compiles a single source of truth into every agent’s native config files.
1. Runs health checks against those configs (drift, anti-patterns, freshness vs. a curated registry).
1. Hands judgment-call fixes back to the user’s own AI agent through installed slash commands, closing the loop without the tool having to “understand” what’s wrong.

Distributed via `npm`. v1 targets Claude Code, Codex, and Cursor.

## 2. Problem

Every AI coding agent reads its own config file. Claude Code reads `CLAUDE.md`. Codex reads `AGENTS.md`. Cursor reads `.cursor/rules/*.mdc`. Copilot, Windsurf, Gemini CLI, Cline — each has its own format and discovery rules.

Teams using more than one agent face four compounding problems:

- **Manual duplication.** The same rule has to be written in 2–5 files, in slightly different shapes, every time it changes.
- **Silent drift.** “Don’t commit to main” in one file becomes “avoid direct pushes to main” in another. Same intent, different wording, no warning when they disagree.
- **No quality bar.** There is no linter for these files. Vague rules (“write good code”), conflicts between rules, dead `@references`, or rules that an actual code linter should be enforcing instead, all ship to production unchecked.
- **No coordinated update path.** When best practices for AI configs evolve (e.g., progressive disclosure, instruction-count budgets, new MCP standards), there is no mechanism to notice or adopt the change across an existing project.

Existing tools solve at most two of these. `rulesync` and `Ruler` solve compilation. `agnix` and `cclint` solve linting. None tightly integrate the two with a fix loop that uses the agent already in the developer’s workflow.

## 3. Goals and non-goals

### Goals (v1)

- Single source of truth for rules, skills, MCP servers, and slash commands across Claude Code, Codex, and Cursor.
- Health checks for drift, anti-patterns, and freshness, with severity levels and clear diagnostics.
- TUI with three tabs: coverage matrix, tree browser, health dashboard.
- AI-agent fix loop via installed slash commands (`/doctor-fix`, `/doctor-backport`).
- Wizard-driven onboarding for projects that already have AI config files.
- CI mode that fails builds on drift or critical issues.
- Pluggable best-practices registry hosted on GitHub, with project-local rule overrides.

### Non-goals (v1)

- Replacing or competing with code linters (ESLint, Prettier, Biome). agents-doctor flags rules that *should be* a linter’s job; it does not do that job.
- Editing or formatting the codebase itself. Only AI config files are managed.
- Hosting a central registry like npm. The registry is just a GitHub repo.
- Web dashboard, IDE plugin, or LSP. CLI + TUI only in v1.
- Supporting every AI agent on day one. Three agents, well-supported, beats twelve agents poorly supported.

## 4. Target users

- **Solo developer, multi-agent.** Uses Claude Code for big refactors, Codex for daily coding, Cursor for autocomplete. Tired of keeping three files in sync.
- **Tech lead, small team (3–15 engineers).** Wants a shared, versioned set of AI rules so the whole team gets consistent agent behavior. Cares about CI enforcement.
- **Open-source maintainer.** Wants contributors to get the same agent guidance regardless of which tool they use, without having to maintain N config files.
- **Platform / DX team at a larger company.** Wants to publish a curated set of org-wide rules that internal projects can pull and extend.

Not a target: developers who use exactly one AI agent. They have no sync problem; the linter alone may not justify adoption.

## 5. Competitive landscape

|Tool             |Sync   |Lint   |AI-fix loop|TUI    |Multi-agent|
|-----------------|-------|-------|-----------|-------|-----------|
|rulesync         |Yes    |No     |No         |No     |20+        |
|Ruler            |Yes    |No     |No         |No     |Many       |
|AI Rules Sync    |Yes    |No     |No         |No     |11+        |
|agnix            |No     |Yes    |No         |No     |12+        |
|AgentLinter      |No     |Yes    |No         |No     |Several    |
|cclint           |No     |Yes    |No         |No     |Claude only|
|**agents-doctor**|**Yes**|**Yes**|**Yes**    |**Yes**|**3 in v1**|

The matrix is the wedge. Each cell is filled by someone; no one fills the row.

## 6. Differentiation

Three mechanics make agents-doctor distinct:

1. **Semantic drift detection across already-diverged files.** Existing linters check files in isolation. agents-doctor compares rendered outputs across agents and flags semantically equivalent rules that differ in wording, plus rules that are present in one agent’s config and missing from another’s.
1. **AI-fix loop, not auto-fix.** When the linter finds an issue that needs judgment (rewriting a vague rule, resolving a conflict between two rules), it does not try to fix it. It writes the issue to a structured todo file and provides slash commands the user can run from inside their AI agent. The agent has full codebase context, so it can make better decisions than a static tool.
1. **Backport flow.** When an agent edits a generated file directly (which happens constantly), `/doctor-backport` extracts the diff, identifies which source-of-truth file should own it, and proposes the edit there before re-syncing. This is what keeps the canonical source actually canonical over time.

## 7. Core concepts

- **Source of truth.** A `.agents-doctor/` directory containing modular markdown for rules, skill folders, MCP server definitions, and slash commands. The only thing humans hand-edit.
- **Generated files.** Every agent-specific file (`CLAUDE.md`, `AGENTS.md`, `.cursor/rules/*.mdc`, `.mcp.json`, `.claude/commands/*.md`, etc.) is regenerated from the source of truth. Tracked in git but treated as derived.
- **Override.** A free-form escape hatch for cases that don’t model cleanly as scoped rules — e.g., an entire section of guidance specific to one agent.
- **Lock file.** Records the version of the registry pulled from, plus content hashes for each generated file. Used for drift detection and reproducible installs.
- **Registry.** A GitHub repository (canonical: `agents-doctor/registry`) containing a versioned set of best-practice rules, skill templates, and lint rules. Projects can also point at any other git URL or local folder.

## 8. User flows

### 8.1 First-time install in an existing project

1. User runs `npx agents-doctor init` in a repo that already has `CLAUDE.md`, `AGENTS.md`, `.claude/skills/`, `.claude/commands/`, `.mcp.json`.
1. Tool detects all existing config and reports counts.
1. Tool parses each file into atomic rules and classifies them as identical, similar (different wording), conflicting, or single-agent.
1. Conflict review TUI: side-by-side picker for each conflict and each “similar” pair, with sensible defaults.
1. Categorization proposal: rules clustered into suggested files (`general.md`, `style.md`, `testing.md`, …) with the option to rename, merge, or move.
1. Skills, commands, and MCP imported with one decision point each (e.g., flag commands that don’t translate cleanly to all targets).
1. Preview screen lists every file that will be created, modified (with `.bak` saved), or deleted. User confirms.
1. First sync runs automatically. First check runs automatically. Slash commands are installed in the appropriate agent directories.

Two confirmations plus the conflict picker. Should complete in under two minutes for a typical project.

### 8.2 Daily use: check → AI fix loop

1. User runs `agents-doctor check`. Issues classified into three buckets:
- **Mechanical** (missing frontmatter, dead links, formatting). Fixed silently.
- **Decisive** (rule conflict, deprecated pattern, ambiguous targeting). Written to `.agents-doctor/.todo.md` with options.
- **Generative** (vague rule, missing skill description, drift requiring rewrite). Flagged for the agent.
1. User opens their AI agent and runs `/doctor-fix`.
1. The slash command tells the agent: read `.agents-doctor/.todo.md`, edit the source-of-truth files, run `agents-doctor sync && agents-doctor check`, report what’s left.
1. User reviews the diff and commits.

### 8.3 Backport flow

When `agents-doctor check` detects that a generated file (e.g., `CLAUDE.md`) has been edited directly:

1. The drift is flagged in the health tab.
1. User runs `/doctor-backport` in their agent.
1. The agent extracts the diff, decides which `.agents-doctor/rules/*.md` (or `overrides/*.md`) should own the change, edits there, and re-syncs.
1. Source of truth stays canonical. Edits made directly to generated files are never lost.

### 8.4 Pull from registry

1. User runs `agents-doctor pull`.
1. Tool fetches latest from configured registry (default: official GitHub repo).
1. TUI shows per-rule diff: new, changed, deprecated.
1. User accepts or rejects each.
1. `agents-doctor sync` regenerates affected files.
1. Lock file records the new registry version.

### 8.5 CI / team

- `agents-doctor check --ci` exits non-zero on drift, conflicts, or any issue at or above a configured severity threshold.
- `agents-doctor sync --check` (no writes) verifies that committed generated files match what the source of truth would produce. Used to enforce that no one bypasses the tool.
- The lock file is committed, so the team is pinned to a known registry version.

## 9. Functional requirements

### 9.1 Source-of-truth structure

```
.agents-doctor/
├── config.yaml          # target agents, registry sources, profile
├── rules/               # modular .md files w/ frontmatter
│   ├── general.md       #   (frontmatter: agents, globs, priority)
│   ├── style.md
│   └── testing.md
├── skills/              # SKILL.md format (Claude-native, portable)
│   └── refactor-py/
│       └── SKILL.md
├── commands/            # slash commands as .md
│   └── review.md
├── mcp/
│   └── servers.yaml     # one MCP definition, fan out to each agent
└── overrides/           # escape hatch for agent-specific quirks
    ├── claude.md
    ├── cursor.md
    └── codex.md
```

### 9.2 Per-agent scoping

Frontmatter on each rule file controls how it is rendered:

- `agents`: list of target agents, or `["*"]` for all (default).
- `globs`: file-path patterns the rule applies to (renders into Cursor’s path scoping; surfaces as a hint in CLAUDE.md and AGENTS.md).
- `priority`: high / normal / low. Used by health checks to flag low-priority rules that bloat the context window.
- `tags`: free-form labels for filtering in the TUI.

Same intent across agents → write once with `agents: [*]`. Different rule per agent → write multiple files with explicit `agents:` lists. Drift detector treats those as intentional, not a bug. Identical wording with no scoping is the default.

### 9.3 Compilation / sync

- One canonical input → many outputs. Each agent’s compiler is a pluggable module.
- Generated files always include a header comment indicating they were produced by agents-doctor and should not be edited directly.
- Compilers handle agent-specific quirks (Cursor’s `.mdc` frontmatter, Claude Code’s `@import` syntax, AGENTS.md’s section conventions) without leaking those quirks back into the source.
- A `.bak` of any modified file is kept on every sync; can be restored via `agents-doctor revert`.

### 9.4 Health checks

Three categories, all on by default, individually toggleable:

- **Drift.** Cross-agent comparison after rendering. Flags rules with the same intent and different wording, rules present in one agent and absent from another (without explicit scoping), and edits made directly to generated files.
- **Anti-patterns.** Rule-level static analysis. Catches vague phrasing, contradicting rules, dead `@references`, rules a real linter should handle, missing required frontmatter, instruction-count blowouts, and over-broad globs.
- **Freshness.** Comparison against the configured registry. Flags rules that have a newer canonical version, rules marked deprecated upstream, and missing rules that are recommended for the project’s detected stack.

Each issue carries a severity (`error`, `warning`, `suggestion`), a stable rule ID, a human-readable explanation, and a fix hint that says whether it is mechanical, decisive, or generative.

### 9.5 Best-practices registry

- Default registry is a public GitHub repository owned by the project.
- Projects configure additional registries (other git URLs, or local folders) in `config.yaml`.
- Registry items are versioned. Lock file records the exact resolved version.
- Each registry item carries metadata: applies-to (stacks, agents, project types), deprecated-by, supersedes, source citation.
- Registry items are themselves checked by the same lint rules they introduce, dogfooding the tool.

### 9.6 TUI

Three tabs, all keyboard-navigable:

- **Matrix.** Rules × agents grid. Cells indicate present / absent / drifted / overridden. Drill into any cell to see the rendered output.
- **Tree.** Hierarchical browser of rules, skills, commands, MCP servers, and overrides. Search and filter by tag, agent, or text.
- **Health.** Issues grouped by severity, then by category. Each issue is expandable to show the offending file, the explanation, and the fix hint.

A persistent footer shows the current sync status (in sync / drifted / unsynced) and a hint for the next useful command.

### 9.7 CLI surface

|Command                     |Purpose                                          |
|----------------------------|-------------------------------------------------|
|`agents-doctor init`        |Wizard onboarding for new or existing projects   |
|`agents-doctor sync`        |Regenerate all agent configs from source of truth|
|`agents-doctor sync --check`|Verify generated files match source (no writes)  |
|`agents-doctor check`       |Run health checks                                |
|`agents-doctor check --ci`  |Health checks with non-zero exit on issues       |
|`agents-doctor diff`        |Preview changes a sync would make                |
|`agents-doctor pull`        |Fetch updates from the registry                  |
|`agents-doctor revert`      |Restore from `.bak` files                        |
|`agents-doctor tui`         |Launch the TUI                                   |

All commands respect a `--profile` flag for switching between configurations (e.g., `personal` vs. `work`).

### 9.8 AI-fix loop

Two slash commands, installed during `init` into each supported agent’s commands directory:

- `/doctor-fix` — Reads the todo file, edits source-of-truth files, runs sync and check, reports remaining issues.
- `/doctor-backport` — Extracts the diff between a generated file and its expected output, identifies the right source file to receive the edit, applies it, and re-syncs.

Both commands are deterministic at the agents-doctor level (the tool produces structured todo and diff data); the agent provides the judgment. The user is always in the loop via the resulting git diff.

### 9.9 Onboarding wizard

Detection covers existing files known across the supported agents. The wizard never modifies a file without showing a preview and getting confirmation. `.bak` files are saved for everything modified during init. Aborting at any step leaves the project in its original state.

## 10. Supported agents (v1)

- **Claude Code** — full support: `CLAUDE.md`, `.claude/skills/`, `.claude/commands/`, `.mcp.json`.
- **Codex CLI** — full support: `AGENTS.md`, MCP via `~/.codex/config.toml` references, slash command equivalents surfaced as documented sections.
- **Cursor** — full support: `.cursor/rules/*.mdc` with glob scoping, skills via shared `.claude/skills/` (per current Cursor behavior), MCP config.

Expansion roadmap (post-v1, in order of likely demand): Windsurf, Gemini CLI, GitHub Copilot, Cline, Aider.

## 11. Non-goals (v1, restated for clarity)

- No web UI, no IDE extension, no LSP server.
- No automatic editing of source-of-truth files by agents-doctor itself. That responsibility lives with the user’s AI agent via slash commands.
- No central package registry. GitHub-hosted only.
- No per-rule access control or signing in v1.
- No hosted analytics or telemetry. The tool is fully local-first.

## 12. Success metrics

- **Activation:** % of installs that complete `init` and run a first `sync`.
- **Retention:** % of projects that run `check` or `sync` again within 30 days.
- **Loop usage:** % of `check` runs followed by a `/doctor-fix` invocation within 24 hours.
- **CI adoption:** % of projects that wire `check --ci` into their pipeline.
- **Drift caught:** average drift issues per repo at install vs. after one month of use.
- **Community:** registered registries and externally-contributed lint rules.

## 13. Risks and mitigations

|Risk                                                 |Mitigation                                                                                                                                                |
|-----------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------|
|agnix or rulesync ships the same combined feature set|Move fast on the AI-fix loop and TUI, where they are weakest. Stay narrowly focused on three agents until the wedge is proven.                            |
|Agent vendors change config formats                  |Pluggable compiler-per-agent architecture isolates churn to one module. Lock file records compiler versions.                                              |
|Registry quality erodes                              |Treat the registry as a real product. Rules go through PR review, are version-pinned, and carry source citations. Dogfood the lint on the registry itself.|
|Users distrust automatic edits to their config       |Every change is previewed, every modified file gets a `.bak`, every command has a `--check` / dry-run variant. Backport flow is explicit, not silent.     |
|Slash commands behave inconsistently across agents   |Limit `/doctor-fix` and `/doctor-backport` to operations that work via plain file edits and shell. No agent-specific tool calls in the slash command body.|
|The “everyone makes a config sync tool” narrative    |Lead the README with the lint and fix-loop story. Position sync as table-stakes, not the value proposition.                                               |

## 14. Milestones

- **M0 — Spec frozen.** This document accepted, naming and license confirmed.
- **M1 — Compiler skeleton.** Source-of-truth schema defined, Claude Code compiler working end-to-end, `sync` and `diff` commands operational.
- **M2 — Multi-agent.** Codex and Cursor compilers complete. `init` wizard handles existing projects.
- **M3 — Health checks.** Drift and anti-pattern checks shipped. Severity levels, stable rule IDs.
- **M4 — Registry & freshness.** Default registry repo populated. `pull` command, lock file, freshness checks.
- **M5 — TUI.** Matrix, tree, and health tabs.
- **M6 — AI-fix loop.** `/doctor-fix` and `/doctor-backport` slash commands installed and validated against all three agents.
- **M7 — CI mode.** `check --ci`, `sync --check`, GitHub Action template.
- **v1.0 — Public release.**

## 15. Open questions

- Should `agents-doctor` ship a compatibility layer that reads `rulesync` or `Ruler` source-of-truth directories, to ease migration?
- How aggressive should the default freshness check be? Always-warn vs. only-on-pull?
- Should slash commands be customizable per project, or is the canonical pair enough?
- How do we handle skills that are agent-specific in capability (e.g., Claude’s tool affordances) vs. portable?
- License: MIT vs. Apache 2.0. (Leaning MIT for adoption.)
- Naming of the source-of-truth folder: `.agents-doctor/` vs. shorter `.agents/`. Latter is cleaner but may conflict with `.claude/agents/` conventions.

-----

*This PRD intentionally omits implementation specifics. Architecture, file formats, schema definitions, and module breakdowns are deferred to a separate technical design document.*
