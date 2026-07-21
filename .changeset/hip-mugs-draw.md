---
"create-awesome-node-app": patch
---

fix(cli): bump @create-node-app/core dependency to ^0.7.5

The underlying fix in `@create-node-app/core@0.7.5` reads `package.json`
with `readFileSync`+`JSON.parse` instead of `import()` with `{ type: "json" }`,
which tsup strips when bundling, causing `ERR_IMPORT_ATTRIBUTE_MISSING` on
Node >= 20.10. The error was silently caught, producing empty `package.json`
data for every template and extension addon — meaning extension addon
dependencies were silently dropped from the scaffolded project.

The dependency range was pinned to `^0.7.4`, so npm/npx could resolve
`0.7.4` (the buggy version) instead of `0.7.5` (the fixed version).
Bumping to `^0.7.5` ensures users always get the fixed core package.

fix(cli): carry --pin ref through to non-interactive option resolution

The `--pin <ref>` value was stripped from the options object in `index.ts`
before reaching `processNonInteractiveOptions`. The initial
`templatesOrExtensions` array had pin applied, but `processNonInteractiveOptions`
rebuilt the array from scratch using the raw (unpinned) option values,
discarding the pin. This meant `--pin` had no effect in non-interactive mode.

Now the pin value is carried through to the option resolver, which applies
`?ref=<sha>` to template, addon, and extend URLs. `file://` URLs are still
skipped (no git involved).
