---
"@create-node-app/core": patch
"@create-node-app/eslint-config": patch
"@create-node-app/eslint-config-next": patch
"@create-node-app/eslint-config-react": patch
"@create-node-app/eslint-config-ts": patch
"create-awesome-node-app": patch
---

fix(packages): add repository.url to all publishable package.json files

The npm Trusted Publishing provenance check requires package.json repository.url to match the GitHub repository exactly. Adds the missing repository field to all scoped packages and normalizes create-awesome-node-app's URL to the bare HTTPS form.
