# ADR 0002: Commander as CLI framework

## Decision

Use [Commander.js](https://github.com/tj/commander.js) for the `create-awesome-node-app` CLI entrypoint, subcommands, flags, and help text.

## Rationale

- Mature, widely adopted Node.js CLI framework with declarative option parsing.
- Supports nested subcommands (`cna cache list`, `cna cache doctor`, etc.) without custom parsing code.
- Integrates cleanly with the bundled CJS/ESM dual build shipped to npm.

## Consequences

- Commander version must remain compatible with the CJS bundle (Commander 15+ is ESM-only; the published CLI pins a CJS-compatible release).
- New flags and subcommands follow Commander conventions (`--flag`, positional args, built-in `--help`).
- Alternative frameworks (yargs, oclif) were not adopted to keep the CLI dependency surface small.
