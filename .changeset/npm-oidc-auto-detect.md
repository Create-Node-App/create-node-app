---
"@create-node-app/core": patch
"@create-node-app/eslint-config": patch
"@create-node-app/eslint-config-next": patch
"@create-node-app/eslint-config-react": patch
"@create-node-app/eslint-config-ts": patch
"create-awesome-node-app": patch
---

fix(ci): rely on npm CLI OIDC auto-detection for trusted publishing

Removes the manual OIDC token exchange because npm CLI >= 11.5.1 automatically detects GitHub Actions OIDC and authenticates during `npm publish`. Drops `NODE_AUTH_TOKEN` and `NPM_CONFIG_PROVENANCE` overrides so the CLI can manage both auth and provenance by itself.
