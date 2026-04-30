# Demo project

A small project pre-populated with a `.agents-doctor/` source of truth and
its synced output, so you can poke at the CLI without setting anything up.

The shape:

```
examples/demo/
├── .agents-doctor/        # source of truth (the only thing humans edit)
│   ├── config.yaml
│   ├── rules/             # 4 rules: overview (high), style, claude-only, components (path-scoped)
│   ├── skills/refactor-py/
│   └── commands/review.md
├── CLAUDE.md              # generated
├── AGENTS.md              # generated (no claude-only rule)
├── src/components/        # nested path scope
│   ├── CLAUDE.md          # generated
│   └── AGENTS.md          # generated
└── .claude/
    ├── skills/refactor-py/SKILL.md   # generated
    └── commands/review.md            # generated
```

## Run it

From this directory:

```bash
cd examples/demo
npm --prefix ../.. run cli:dev -- check
```

You should see `ok`.

## Try these flows

### 1. Edit a rule, see drift, re-sync

```bash
# break the synced output
sed -i.bak 's/2-space/4-space/' .agents-doctor/rules/001-style.md && rm -f .agents-doctor/rules/001-style.md.bak
npm --prefix ../.. run cli:dev -- check        # mismatch on CLAUDE.md and AGENTS.md
npm --prefix ../.. run cli:dev -- sync         # re-emits both files
npm --prefix ../.. run cli:dev -- check        # ok again
```

### 2. Edit a generated file directly, see check catch the drift

```bash
echo '# tampered' > CLAUDE.md
npm --prefix ../.. run cli:dev -- check        # mismatch on CLAUDE.md
npm --prefix ../.. run cli:dev -- sync         # restore
```

### 3. Add a stray agent file, see it flagged as extra

```bash
mkdir -p docs && echo 'stray' > docs/CLAUDE.md
npm --prefix ../.. run cli:dev -- check        # extra: docs/CLAUDE.md
rm -rf docs
```

### 4. Drop a stray file in `.claude/commands/`, see it flagged

```bash
echo 'stray' > .claude/commands/stray.md
npm --prefix ../.. run cli:dev -- check        # extra: .claude/commands/stray.md
rm .claude/commands/stray.md
```

### 5. Try init from scratch

`init` refuses to run when `.agents-doctor/` already exists. To try it,
copy the project elsewhere and delete the SOT first:

```bash
cp -r examples/demo /tmp/demo-init && rm -rf /tmp/demo-init/.agents-doctor
cd /tmp/demo-init
echo claude | npm --prefix /home/ivan_semin/workspace/agents-doctor run cli:dev -- init
```

You'll get a freshly seeded `.agents-doctor/` and synced output. The
priority answer (`claude`) only matters if there are conflicting `## …`
sections between `CLAUDE.md` and `AGENTS.md`.

## Notes

- `npm --prefix ../..` makes npm find the agents-doctor scripts even
  though we're running from this fixture. Inside the script, `INIT_CWD`
  carries the demo dir, so the CLI operates here, not on the source repo.
- `priority: high` on `000-overview.md` makes that rule sort first
  inside the compiled `CLAUDE.md` / `AGENTS.md`, ahead of `001-style.md`
  even though the filename ordinal would normally come second.
