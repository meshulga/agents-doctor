# agents-doc

Every AI coding agent reads its own config file. Claude Code reads `CLAUDE.md`. Codex reads `AGENTS.md`. If you use both, you end up writing the same rules twice and inevitably they drift. `agents-doc` gives you one place to author rules, skills, and slash commands, compiles them into each agent's native format, and mechanically detects when the generated files have been edited directly.

## Install

```
npm install -g agents-doc
```

## Commands

```
agents-doc init    # bootstrap .agents-doc/ from existing CLAUDE.md / AGENTS.md
agents-doc sync    # regenerate all agent configs from .agents-doc/
agents-doc check   # verify on-disk agent files match .agents-doc/
agents-doc doctor  # run drift + rule-quality checks; hand off judgment items
```

`init` is a one-time step for existing projects. After that the loop is: edit `.agents-doc/` → `sync` → commit.

`check` exits non-zero on any drift or untracked extra, so it slots directly into CI. `doctor` adds rule-quality lint on top (vague phrasing, over-broad globs, cross-rule contradictions) and writes anything that needs human judgment to `.agents-doc/.todo.md`.

## Source of truth layout

```
.agents-doc/
├── config.yaml           # agents: [claude, codex]
├── rules/                # one .md file per rule
│   ├── 000-intro.md
│   ├── 001-code-style.md
│   └── 002-components.md
├── skills/               # Claude Code only — copied to .claude/skills/
│   └── refactor-py/
│       └── SKILL.md
└── commands/             # Claude Code only — copied to .claude/commands/
    └── review.md
```

Each file in `rules/` carries YAML frontmatter:

```markdown
---
agents: ["*"]        # "*" = all agents, or ["claude"], ["codex"]
path: src/components # project-relative dir; omit for root
priority: high       # high | normal | low — controls ordering in output
---

## Component conventions

Always co-locate the test file with the component.
```

Rules with the same `path` are merged into a single `CLAUDE.md` / `AGENTS.md` at that location. Frontmatter is stripped from the compiled output. Generated files are marked with a header so direct edits are detectable.

## Resolving judgment items

Mechanical issues (drift, broken references) are fixed by `agents-doc sync`. Everything that requires judgment — vague phrasing, over-broad globs, contradictions between rules — is collected by `agents-doc doctor` into `.agents-doc/.todo.md` as a checklist.

For Claude Code users, `agents-doc sync` auto-installs a `/doc-fix` slash command. Inside Claude Code, run:

```
/doc-fix
```

It reads `.todo.md`, edits the SOT under `.agents-doc/rules/` (never the generated `CLAUDE.md` / `AGENTS.md`), ticks each item as it resolves them, and re-runs `sync` + `check` at the end. `doc-fix` is a reserved command name — authoring `.agents-doc/commands/doc-fix.md` is rejected by the loader.

Codex CLI users get the same `.todo.md` artifact and can work through it directly; there is no native slash-command equivalent yet.

## CI

```yaml
- name: Check agent config drift
  run: npx agents-doc check
```

Any mismatch between `.agents-doc/` and the committed generated files fails the step.

## Supported agents

| Agent | Rules | Skills | Commands |
|-------|-------|--------|----------|
| Claude Code | `CLAUDE.md` (root + nested) | `.claude/skills/` | `.claude/commands/` (incl. auto-installed `/doc-fix`) |
| Codex CLI | `AGENTS.md` (root + nested) | — | — |

## License

MIT
