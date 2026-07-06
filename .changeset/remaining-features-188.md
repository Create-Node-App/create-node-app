---
"create-awesome-node-app": minor
---

Remaining features from epic #179: `--pin`, `cache outdated`, `cache update`, `cache doctor`, docs update (closes #188)

- **`--pin <ref>`**: new CLI flag to pin templates to a specific commit SHA, tag, or branch. Equivalent to `?ref=<ref>` on the template URL.
- **`cna cache outdated`**: new subcommand that compares local commit SHAs against remote tips via `git ls-remote`. Shows which cached entries are behind.
- **`cna cache update [id]`**: new subcommand that force-refreshes one or all cached entries via `git fetch && git merge`.
- **`cna cache doctor`**: new subcommand that diagnoses cache health — checks git availability, network reachability, cache directory permissions, and entry integrity.
- **Docs**: added Security section linking to `SECURITY.md`, `--pin` flag reference, cache subcommand docs for outdated/update/doctor, pinning examples, and cache diagnostics examples.
- **Root AGENTS.md**: added `type-check` to key commands.
