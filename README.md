# agents-doctor

Single source of truth and drift check for AI coding agent configs (Claude Code + Codex CLI in v1).

## Install

    npm install -g agents-doctor

## Usage

    agents-doctor init    # bootstrap .agents-doctor/ from existing CLAUDE.md / AGENTS.md
    agents-doctor sync    # regenerate agent configs from .agents-doctor/
    agents-doctor check   # verify on-disk agent files match .agents-doctor/

`check` exits non-zero on drift, so it slots into CI directly.

See [PRD.md](./PRD.md) for the full spec.
