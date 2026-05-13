# Changelog

All notable changes to `agents-doc` are recorded here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project
adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.4.0] — 2026-05-13

### Added
- Cursor as a third supported agent. `agents-doc sync` emits each SOT
  rule to `.cursor/rules/<name>.mdc` when `cursor` is listed in
  `config.yaml`. `agents-doc check` tracks `.cursor/rules/` for stray
  files; `agents-doc init` imports root-level `.cursor/rules/*.mdc`
  during brownfield onboarding.
- Optional `description:` field on rule frontmatter. Used by the Cursor
  compiler to populate the `.mdc` `description` field. Ignored by the
  Claude and Codex compilers (frontmatter is stripped from their
  output).
- Init merges a Cursor `.mdc` into an existing rule when its body
  matches a `CLAUDE.md` / `AGENTS.md` chunk after normalizing line
  endings, stripping leading/trailing whitespace, and ignoring a
  leading `## Heading` line on either side (Claude/Codex chunks
  carry their H2 in the body; `.mdc` files don't). The merged
  rule's `agents:` is collapsed to `["*"]` when all three agents
  match.

### Notes
- Cursor has no native skills or slash-command surface; SOT skills and
  commands are silently skipped when emitting for Cursor.
- Only the modern `.cursor/rules/*.mdc` format is supported. The
  legacy single-file `.cursorrules` is not read or written.
- Nested `.cursor/rules/` directories (e.g.,
  `subproject/.cursor/rules/`) are not imported by `init` and not
  emitted by `sync`. Per-rule scoping is expressed via Cursor's
  native `globs:`.
- Cursor's "Agent Requested" rule type (description-only, no globs,
  no `alwaysApply`) is not expressible in the SOT in this release;
  the mapping always emits `alwaysApply: true` or `globs:` plus
  `alwaysApply: false`. A future SOT field can opt rules into the
  Agent Requested shape.

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
