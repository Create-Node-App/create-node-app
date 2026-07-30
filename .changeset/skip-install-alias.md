---
"create-awesome-node-app": minor
---

feat(cli): add --skip-install as alias for --no-install (#290)

Adds `--skip-install` as an intuitive alias for `--no-install`. Commander
has no built-in alias support for negatable boolean options, so the CLI
normalizes the alias to `--no-install` before parsing argv. The rewrite
respects the `--` end-of-options boundary to avoid reinterpreting literal
values passed as positional arguments.

Contributed by @mynolog (Minho Lee).
