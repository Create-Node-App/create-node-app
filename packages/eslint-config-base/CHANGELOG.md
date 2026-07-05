# @create-node-app/eslint-config

## 0.2.5

### Patch Changes

- 8f5de37: fix(ci): exchange GitHub OIDC token for npm access token

  Adds the explicit OIDC-to-npm token exchange required by npm Trusted Publishing. npm does not perform this exchange automatically from `NPM_CONFIG_PROVENANCE` alone; we call the npm `/security/oidc-token` endpoint with the GitHub id-token and use the returned short-lived access token for publish.

## 0.2.4

### Patch Changes

- d00fa9f: fix(ci): enable npm Trusted Publishing with provenance

  Configures the publish workflow to use npm Trusted Publishing (OIDC) by removing the legacy registry-url setup and enabling `--provenance` on `changeset publish`. Also switches `.changeset/config.json` access from `restricted` to `public` soscoped packages can be published via OIDC.

## 0.2.3

### Patch Changes

- 7783da4: fix(ci): switch to npm trusted publishing via OIDC with protected npm-publish environment

## 0.2.2

### Patch Changes

- Fixed warnings in create-node-app core

## 0.2.1

### Patch Changes

- docs: add comprehensive READMEs for all workspace packages

## 0.2.0

### Minor Changes

- Local first flags for testing

## 0.1.1

### Patch Changes

- Some improvements and fixes

## 0.1.0

### Minor Changes

- Great refactor

## 0.0.3

### Patch Changes

- Added new flags

## 0.0.2

### Patch Changes

- Updated version

## 0.0.1

### Patch Changes

- 0515e1d: Updated CLI options
