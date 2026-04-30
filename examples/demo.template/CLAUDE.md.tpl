# Project: Demo

A sample project used to demonstrate `agents-doctor`. The pre-`##` content
above is identical between CLAUDE.md and AGENTS.md, so init merges it into
a single rule scoped to all agents.

## Code style

- Use 2-space indentation.
- Prefer pure functions over classes for stateless logic.
- Run the linter before committing.

## Claude-specific guidance

When invoking long-running shell commands, prefer the background runner
and stream output through the Monitor tool.
