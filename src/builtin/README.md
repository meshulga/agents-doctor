# src/builtin

Templates shipped with agents-doc and injected into the user's agent
directories at sync time. Currently:

- `doc-fix.ts` — the `/doc-fix` slash command body for Claude Code.

These are _not_ part of the source-of-truth model. They are derived assets
the tool installs automatically. Authoring an SOT command with the same
name (`doc-fix`) is rejected by the loader.
