---
"@create-node-app/core": patch
---

Fix dependencies declared in a template's or extension's `package.json` being
silently dropped during scaffolding.

`importIfExists` loaded `.json` files via a dynamic `import()` with a
`with { type: "json" }` attribute. Although valid at the source level,
tsup/esbuild strips the attribute when bundling, so the published `dist`
contained a bare `import("…json")`. On Node >= 20.10 that throws
`ERR_IMPORT_ATTRIBUTE_MISSING`, and the surrounding `try/catch` swallowed it —
so every dependency coming from a static `package.json` (i.e. almost every
extension) vanished from the generated project, breaking type-check/build.

JSON manifests are now read with `readFileSync` + `JSON.parse`, which is immune
to bundler transforms and works across Node versions. Added a regression test
that asserts dependencies from both `package.json` and `package/index.js` are
merged into the installable result.
