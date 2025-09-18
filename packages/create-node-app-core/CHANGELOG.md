# @create-node-app/core

## 0.5.5

### Patch Changes

- Fix scaffolding so full template file tree is copied instead of producing an almost empty project.

  Highlights:
  - Repair file discovery: removed broken readdirp negative-only filter that yielded 0 matches; now enumerate all files then apply internal skip rules.
  - Correct handling of special `[src]/` token directories so template source files land in the configured `srcDir`.
  - Add missing runtime dependency `fs-extra` (previously only implicitly relied upon) to prevent potential runtime module resolution errors.
  - Fix `appendTemplate` mapping so templated append operations render correctly (was incorrectly using plain append loader).
  - Add verbose debug logs (behind `--verbose`) for template directory resolution, first discovered file, and total operations count to ease future diagnostics.
  - Strengthen smoke test to assert presence of critical scaffold artifacts (e.g. `README.md`, `tsconfig.json`, `index.html`, `eslint.config.mjs`, `src/App.tsx`, `src/main.tsx`).

  Result: Running the CLI now prepares and copies ~50 operations for the React Vite starter template (previously 0), restoring expected developer experience.

## 0.5.4

### Patch Changes

- Fix

## 0.5.2

### Patch Changes

- Fix deps

## 0.5.0

### Minor Changes

- Great refactor

## 0.4.0

### Minor Changes

- Added AI support

## 0.3.18

### Patch Changes

- Added new flags

## 0.3.17

### Patch Changes

- Updated version

## 0.3.16

### Patch Changes

- 0515e1d: Updated CLI options

## 0.3.15

### Patch Changes

- Updated run fallbacks

## 0.3.14

### Patch Changes

- Updated deps

## 0.3.13

### Patch Changes

- Keep permissions from original files when doing the scaffolding

## 0.3.12

### Patch Changes

- Updated pnpm flags

## 0.3.11

### Patch Changes

- Added CI mode

## 0.3.10

### Patch Changes

- Updated source code to be more performant

## 0.3.9

### Patch Changes

- Small fix

## 0.3.8

### Patch Changes

- Simple fix

## 0.3.7

### Patch Changes

- Updated package loader

## 0.3.6

### Patch Changes

- Added conditional installation for npm, yarn and pnpm

## 0.3.5

### Patch Changes

- Updated instructions

## 0.3.4

### Patch Changes

- Updated instructions

## 0.3.3

### Patch Changes

- Don't show content in stdout on some cases

## 0.3.2

### Patch Changes

- Updated fomatting to pass

## 0.3.1

### Patch Changes

- Little fix to handle new format

## 0.3.0

### Minor Changes

- Check for correct node version on runtime

## 0.2.6

### Patch Changes

- Updated package generation

## 0.2.5

### Patch Changes

- Added package managers and custom options

## 0.2.4

### Patch Changes

- Added flags for yarnpkg

## 0.2.3

### Patch Changes

- 25714c8: Updated extensions schema type
