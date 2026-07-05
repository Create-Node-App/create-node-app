---
"@create-node-app/core": patch
"@create-node-app/eslint-config": patch
"@create-node-app/eslint-config-next": patch
"@create-node-app/eslint-config-react": patch
"@create-node-app/eslint-config-ts": patch
"create-awesome-node-app": patch
---

fix(ci): exchange GitHub OIDC token for npm access token

Adds the explicit OIDC-to-npm token exchange required by npm Trusted Publishing. npm does not perform this exchange automatically from `NPM_CONFIG_PROVENANCE` alone; we call the npm `/security/oidc-token` endpoint with the GitHub id-token and use the returned short-lived access token for publish.
