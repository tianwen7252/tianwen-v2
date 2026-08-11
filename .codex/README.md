# Codex project configuration

This directory is the Codex-compatible counterpart of `.claude/`.

## Mapping

- `../AGENTS.md` is the project instruction file Codex discovers. `.codex/AGENTS.md` links to it.
- `config.toml` contains project-scoped Codex settings.
- `agents/*.toml` exposes Codex custom agents. Each adapter reads its authoritative instructions from `.claude/agents/*.md`.
- `docs/` and `plans/` are snapshots copied from `.claude/` when this setup was created.
- `skills` links to `../.claude/skills` and must not become a separate copy.
- `../.agents/skills` points to the same source because `.agents/skills` is the repository location Codex scans for standalone skills.

## Shared skills

The canonical skill source is `.claude/skills`. Edit skills there (or through either symlink); Claude Code and Codex will immediately see the same files.

## Intentionally not migrated

`.claude/settings.local.json` contains local Claude Code permissions and machine-specific commands. Codex does not consume that schema, so it is not copied. Claude-only environment keys from `.claude/settings.json` are also omitted from `config.toml`.
