# @create-node-app/eslint-config-react

## 0.2.7

### Patch Changes

- 226af9c: fix(ci): rely on npm CLI OIDC auto-detection for trusted publishing

  Removes the manual OIDC token exchange because npm CLI >= 11.5.1 automatically detects GitHub Actions OIDC and authenticates during `npm publish`. Drops `NODE_AUTH_TOKEN` and `NPM_CONFIG_PROVENANCE` overrides so the CLI can manage both auth and provenance by itself.

- Updated dependencies [226af9c]
  - @create-node-app/eslint-config-ts@0.2.7

## 0.2.6

### Patch Changes

- f03b4c5: fix(ci): use correct OIDC audience and add exchange diagnostics

  Adds `audience=registry.npmjs.org` to the GitHub id-token request, validates the npm access token is non-empty, and prints the npm error response on failure instead of silently falling through with an empty token.

- Updated dependencies [f03b4c5]
  - @create-node-app/eslint-config-ts@0.2.6

## 0.2.5

### Patch Changes

- 8f5de37: fix(ci): exchange GitHub OIDC token for npm access token

  Adds the explicit OIDC-to-npm token exchange required by npm Trusted Publishing. npm does not perform this exchange automatically from `NPM_CONFIG_PROVENANCE` alone; we call the npm `/security/oidc-token` endpoint with the GitHub id-token and use the returned short-lived access token for publish.

- Updated dependencies [8f5de37]
  - @create-node-app/eslint-config-ts@0.2.5

## 0.2.4

### Patch Changes

- d00fa9f: fix(ci): enable npm Trusted Publishing with provenance

  Configures the publish workflow to use npm Trusted Publishing (OIDC) by removing the legacy registry-url setup and enabling `--provenance` on `changeset publish`. Also switches `.changeset/config.json` access from `restricted` to `public` soscoped packages can be published via OIDC.

- Updated dependencies [d00fa9f]
  - @create-node-app/eslint-config-ts@0.2.4

## 0.2.3

### Patch Changes

- 7783da4: fix(ci): switch to npm trusted publishing via OIDC with protected npm-publish environment
- Updated dependencies [7783da4]
  - @create-node-app/eslint-config-ts@0.2.3

## 0.2.2

### Patch Changes

- Fixed warnings in create-node-app core
- Updated dependencies
  - @create-node-app/eslint-config-ts@0.2.2

## 0.2.1

### Patch Changes

- docs: add comprehensive READMEs for all workspace packages
- Updated dependencies
  - @create-node-app/eslint-config-ts@0.2.1

## 0.2.0

### Minor Changes

- Local first flags for testing

### Patch Changes

- Updated dependencies
  - @create-node-app/eslint-config-ts@0.2.0

## 0.1.1

### Patch Changes

- Some improvements and fixes
- Updated dependencies
  - @create-node-app/eslint-config-ts@0.1.1

## 0.1.0

### Minor Changes

- Great refactor

### Patch Changes

- Updated dependencies
  - @create-node-app/eslint-config-ts@0.1.0

## 0.0.3

### Patch Changes

- Added new flags
- Updated dependencies
  - @create-node-app/eslint-config-ts@0.0.3

## 0.0.2

### Patch Changes

- Updated version
- Updated dependencies
  - @create-node-app/eslint-config-ts@0.0.2

## 0.0.1

### Patch Changes

- 0515e1d: Updated CLI options
- Updated dependencies [0515e1d]
  - @create-node-app/eslint-config-ts@0.0.1
