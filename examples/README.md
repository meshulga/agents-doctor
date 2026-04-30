# Demo workflow

A small fixture you can drive end-to-end without setting anything up.

## Layout

- `demo.template/` — the **committed** brownfield project. Contains
  `CLAUDE.md.tpl` / `AGENTS.md.tpl` (and nested copies) plus a
  `.claude/skills/` folder and a `.claude/commands/` folder. The `.tpl`
  suffix keeps real `CLAUDE.md` files out of the source tree so the
  parent Claude Code session won't accidentally interpret them as
  instructions.
- `demo/` — the **gitignored** working copy. Populated by
  `npm run demo:reset`, which copies from the template and strips the
  `.tpl` suffixes.

The CLI commands `demo:check`, `demo:sync`, `demo:init`, etc. always
target `examples/demo/` regardless of where you invoke them from. They
print `[demo mode: examples/demo]` to make it obvious you're in the
fixture, not your real project.

## Commands

```
npm run demo            # full loop: reset → init → check → drift → sync → check
npm run demo:start      # alias of demo:reset; copy template → working
npm run demo:reset      # restore working copy from template
npm run demo:init       # bootstrap .agents-doctor/ from agent files
npm run demo:sync       # regenerate agent configs from .agents-doctor/
npm run demo:check      # verify on-disk agent files match .agents-doctor/
```

`demo:start` is an alias of `demo:reset`. Use whichever name reads
better in context.

## What the template covers

- Universal rule (`agents: ["*"]`) — pre-h2 intro identical in both files.
- Conflict resolution — `## Code style` differs between CLAUDE.md and
  AGENTS.md (spaces vs tabs); the priority agent wins on init.
- Claude-only rule — `## Claude-specific guidance` only in CLAUDE.md.
- Codex-only rule — `## Codex-specific guidance` only in AGENTS.md.
- Nested path scope — `src/components/CLAUDE.md` + matching AGENTS.md.
- Skill with helper sub-file — `.claude/skills/refactor-py/SKILL.md`
  plus a `scripts/lint.sh` to prove the recursive copy.
- Slash command — `.claude/commands/review.md`.

## Try these flows

`cd examples/demo` first for the flows that touch files directly. The
`npm run demo:*` commands themselves don't care about cwd.

### Edit a rule and re-sync

```bash
sed -i.bak 's/2-space/4-space/' .agents-doctor/rules/001-code-style.md && rm -f .agents-doctor/rules/001-code-style.md.bak
npm run demo:check        # mismatch on CLAUDE.md
npm run demo:sync         # re-emits both files
npm run demo:check        # ok again
```

### Tamper with a generated file

```bash
echo '# tampered' > CLAUDE.md
npm run demo:check        # mismatch on CLAUDE.md
npm run demo:sync         # restore
```

### Drop a stray agent file

```bash
mkdir -p docs && echo 'stray' > docs/CLAUDE.md
npm run demo:check        # extra: docs/CLAUDE.md
rm -rf docs
```

### Drop a stray file inside .claude/commands/

```bash
echo 'stray' > .claude/commands/stray.md
npm run demo:check        # extra: .claude/commands/stray.md
rm .claude/commands/stray.md
```

### Reset everything

```bash
npm run demo:reset
```

Wipes `examples/demo/` and recopies from the template.
