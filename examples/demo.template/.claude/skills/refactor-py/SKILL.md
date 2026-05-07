---
name: refactor-py
description: Apply standard Python refactoring patterns and re-run pytest.
---
# Refactor Python

Walk through the target file, apply rope-based renames where safe, and run
`pytest -q` after every refactor batch. The `scripts/lint.sh` helper is
shipped alongside this skill — agents-doc copies it byte-for-byte.
