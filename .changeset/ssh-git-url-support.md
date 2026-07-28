---
"@create-node-app/core": minor
---

feat(core): support SSH git@ template URLs (#277)

Adds `git@host:org/repo` URL parsing to `paths.ts` so template and
extension URLs can be specified with the SSH scheme alongside existing
HTTPS URLs.
