# ADR 0002: Commander as CLI framework

## Context

The CLI needs nested subcommands (`cache list`, `cache doctor`), many flags, and stable `--help` output while remaining a thin wrapper over `@create-node-app/core`.

## Decision

Use [Commander.js](https://github.com/tj/commander.js) for the `create-awesome-node-app` CLI entrypoint, subcommands, flags, and help text.

## Alternatives considered

- **yargs**: similar feature set; Commander’s declarative API and smaller surface won for this codebase.
- **oclif**: stronger plugin model than needed for a single scaffolding binary.
- **Hand-rolled argv parsing**: rejected to avoid maintenance cost for subcommands and help.

## Rationale

- Mature, widely adopted Node.js CLI framework with declarative option parsing.
- Supports nested subcommands without custom parsing code.
- Integrates cleanly with the bundled CJS/ESM dual build shipped to npm.

## Consequences

- Commander version must remain compatible with the CJS bundle (Commander 15+ is ESM-only; the published CLI pins a CJS-compatible release).
- New flags and subcommands follow Commander conventions (`--flag`, positional args, built-in `--help`).
