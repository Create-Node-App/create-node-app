---
"@create-node-app/core": patch
"create-awesome-node-app": patch
---

Fix broken CJS bundle — `commander@15` and `readdirp@5` are ESM-only and broke `require()` in the bundled `dist/index.cjs` shipped to npm. Downgraded to `commander@14.0.2` and `readdirp@4.1.2`, both of which support CJS. The CLI was unusable when installed via `npm i -g create-awesome-node-app` (only worked via `npx`, which uses the ESM entry).
