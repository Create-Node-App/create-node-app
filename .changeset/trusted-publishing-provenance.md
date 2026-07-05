---
"@create-node-app/core": patch
"@create-node-app/eslint-config": patch
"@create-node-app/eslint-config-next": patch
"@create-node-app/eslint-config-react": patch
"@create-node-app/eslint-config-ts": patch
"create-awesome-node-app": patch
---

fix(ci): enable npm Trusted Publishing with provenance

Configures the publish workflow to use npm Trusted Publishing (OIDC) by removing the legacy registry-url setup and enabling `--provenance` on `changeset publish`. Also switches `.changeset/config.json` access from `restricted` to `public` soscoped packages can be published via OIDC.
