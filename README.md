# agents-doctor

Every AI coding agent reads its own config file. Claude Code reads `CLAUDE.md`. Codex reads `AGENTS.md`. If you use both, you end up writing the same rules twice and inevitably they drift. `agents-doctor` gives you one place to author rules, skills, and slash commands, compiles them into each agent's native format, and mechanically detects when the generated files have been edited directly.

## Install

```
npm install -g agents-doctor
```

## Commands

```
agents-doctor init    # bootstrap .agents-doctor/ from existing CLAUDE.md / AGENTS.md
agents-doctor sync    # regenerate all agent configs from .agents-doctor/
agents-doctor check   # verify on-disk agent files match .agents-doctor/
```

`init` is a one-time step for existing projects. After that the loop is: edit `.agents-doctor/` → `sync` → commit.

`check` exits non-zero on any drift or untracked extra, so it slots directly into CI.

## Source of truth layout

```
.agents-doctor/
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

## CI

```yaml
- name: Check agent config drift
  run: npx agents-doctor check
```

Any mismatch between `.agents-doctor/` and the committed generated files fails the step.

## Supported agents

| Agent | Rules | Skills | Commands |
|-------|-------|--------|----------|
| Claude Code | `CLAUDE.md` (root + nested) | `.claude/skills/` | `.claude/commands/` |
| Codex CLI | `AGENTS.md` (root + nested) | — | — |

## License

MIT
