---
"@create-node-app/core": patch
"create-awesome-node-app": patch
---

Windows compatibility fixes (closes #184)

- **executable.ts**: Pass bare command name without `.cmd` suffix — lets Node.js resolve via PATH + PATHEXT, fixing `bun` and `node` on Windows.
- **paths.ts**: Broaden file URL normalization to handle UNC paths (`file:////server/share`), drive-relative paths (`file:///C:path`), plus existing `file:///C:/path`.
- **paths.ts**: Export `solveValuesFromTemplateOrExtensionUrl` for testing.
- **installer.ts**: Prepend `\\?\` prefix when project path exceeds 200 chars to bypass MAX_PATH on Windows.
- **loaders.ts**: Case-insensitive file skip matching (`toLowerCase()`) to handle Windows case-insensitive filesystem.
- **README.md**: Add "Platform Notes" section documenting Windows behaviors.
- **CI**: Add `unit-tests-windows` job; add `windows-latest` + `bun` to cross-platform scaffold matrix.
