---
description: Review the current branch against main
allowed-tools:
  - Bash
  - Read
  - Grep
generated_by: agents-doctor
---
Review the diff between the current branch and `main`. Focus on:

- Behavior changes and missing tests.
- Public API breakage.
- Anything that needs a migration note in the PR description.
