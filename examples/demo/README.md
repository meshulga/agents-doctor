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

From the agents-doctor repo root, no `cd` needed:

```bash
npm run cli:demo -- check
```

You should see `ok`. The `cli:demo` script always targets this fixture.

The flows below use `cli:demo` for brevity. They mutate files inside
this directory, so `git checkout examples/demo` will reset everything
when you're done.

## Try these flows

The flows below mutate files inside this directory, so `cd examples/demo`
before running them. The `cli:demo` script itself doesn't care where you
run it from.

### 1. Edit a rule, see drift, re-sync

```bash
# break the synced output
sed -i.bak 's/2-space/4-space/' .agents-doctor/rules/001-style.md && rm -f .agents-doctor/rules/001-style.md.bak
npm run cli:demo -- check        # mismatch on CLAUDE.md and AGENTS.md
npm run cli:demo -- sync         # re-emits both files
npm run cli:demo -- check        # ok again
```

### 2. Edit a generated file directly, see check catch the drift

```bash
echo '# tampered' > CLAUDE.md
npm run cli:demo -- check        # mismatch on CLAUDE.md
npm run cli:demo -- sync         # restore
```

### 3. Add a stray agent file, see it flagged as extra

```bash
mkdir -p docs && echo 'stray' > docs/CLAUDE.md
npm run cli:demo -- check        # extra: docs/CLAUDE.md
rm -rf docs
```

### 4. Drop a stray file in `.claude/commands/`, see it flagged

```bash
echo 'stray' > .claude/commands/stray.md
npm run cli:demo -- check        # extra: .claude/commands/stray.md
rm .claude/commands/stray.md
```

### 5. Try init from scratch

`init` refuses to run when `.agents-doctor/` already exists. To try it,
copy the project elsewhere and delete the SOT first, then use `cli:dev`
(which honors `INIT_CWD`) from the copied dir:

```bash
cp -r examples/demo /tmp/demo-init && rm -rf /tmp/demo-init/.agents-doctor
cd /tmp/demo-init
echo claude | npm --prefix /home/ivan_semin/workspace/agents-doctor run cli:dev -- init
```

You'll get a freshly seeded `.agents-doctor/` and synced output. The
priority answer (`claude`) only matters if there are conflicting `## …`
sections between `CLAUDE.md` and `AGENTS.md`.

## Notes

- `cli:demo` pins `INIT_CWD` to this fixture, so it works from any cwd.
  Use `cli:dev` instead for arbitrary projects.
- `priority: high` on `000-overview.md` makes that rule sort first
  inside the compiled `CLAUDE.md` / `AGENTS.md`, ahead of `001-style.md`
  even though the filename ordinal would normally come second.
