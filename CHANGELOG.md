# Changelog

All notable changes to `agents-doc` are recorded here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project
adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.3.0] — 2026-05-07

### Added
- Codex skill compilation. `agents-doc sync` now emits each SOT skill to
  `.agents/skills/<name>/` for Codex, mirroring the existing
  `.claude/skills/<name>/` output for Claude.
- `agents-doc check` tracks `.agents/skills/` for stray files, just as
  it already did for `.claude/skills/` and `.claude/commands/`.
- `agents-doc init` imports existing `.agents/skills/` into the SOT
  alongside `.claude/skills/`. On a name collision, init refuses unless
  the file trees are byte-identical — the user consolidates by hand.
- Built-in `doc-fix` Codex skill auto-installed at
  `.agents/skills/doc-fix/SKILL.md` whenever Codex is enabled. Same
  workflow body as the Claude `/doc-fix` slash command, wrapped in
  skill frontmatter (`name`, `description`).
- The reserved-name guard now also rejects
  `.agents-doc/skills/doc-fix/` in addition to
  `.agents-doc/commands/doc-fix.md`.

### Changed
- `Supported agents` table in README updated: Codex skills are now
  `.agents/skills/` (incl. auto-installed `doc-fix`).

## [0.2.0] — 2026-05-07

### Added
- `agents-doc doctor` command. Runs `check` (drift) and the rule-quality
  lint together, classifies every issue into `mechanical`, `decisive`, or
  `generative` buckets, and writes the latter two to
  `.agents-doc/todo.md` as a checklist for human/AI follow-up.
- Rule-quality lint: vague phrasing, cross-rule contradictions, dead
  `@references`, missing required frontmatter (heading, scoping),
  instruction-count blowouts, over-broad globs.
- Built-in `/doc-fix` slash command auto-installed into
  `.claude/commands/doc-fix.md` on every `sync`. It reads
  `.agents-doc/todo.md`, edits the SOT, ticks each item as it resolves,
  and re-runs `sync` + `check`.
- `doc-fix` is a reserved command name. Authoring
  `.agents-doc/commands/doc-fix.md` in the SOT now throws a clear error
  from the loader.
- `todo.md` preserves user-ticked checkboxes across re-runs of `doctor`:
  the file is parsed before regeneration and `[x]` state is re-applied to
  items whose signature still matches a current bucket.

### Changed
- `agents: ['*']` rules with no globs are now reported in the
  `mechanical` bucket (informational on the CLI) instead of `decisive`.
  This is the canonical output of `init` for shared content; flagging it
  as a judgment item forced every fresh project to "fix" a non-problem
  on day one.
- Published tarball now includes `dist/builtin`, `dist/doctor`, and
  `dist/lint` directories (added to `package.json` `files`).

## [0.1.0] — 2026-04

### Added
- Initial public release.
- `agents-doc init` — bootstrap `.agents-doc/` from existing
  `CLAUDE.md` / `AGENTS.md`.
- `agents-doc sync` — compile the SOT into `CLAUDE.md`, `AGENTS.md`,
  Claude skills, and Claude commands.
- `agents-doc check` — verify on-disk agent files match what `sync`
  would produce; non-zero exit on drift or untracked extras.
