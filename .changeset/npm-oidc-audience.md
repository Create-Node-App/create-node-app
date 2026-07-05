---
"@create-node-app/core": patch
"@create-node-app/eslint-config": patch
"@create-node-app/eslint-config-next": patch
"@create-node-app/eslint-config-react": patch
"@create-node-app/eslint-config-ts": patch
"create-awesome-node-app": patch
---

fix(ci): use correct OIDC audience and add exchange diagnostics

Adds `audience=registry.npmjs.org` to the GitHub id-token request, validates the npm access token is non-empty, and prints the npm error response on failure instead of silently falling through with an empty token.
