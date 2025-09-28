# create-awesome-node-app

## 0.6.7

### Patch Changes

- Updated docs
- Updated dependencies
  - @create-node-app/core@0.5.6

## 0.6.6

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

- Updated dependencies
  - @create-node-app/core@0.5.5

## 0.6.5

### Patch Changes

- Fix
- Updated dependencies
  - @create-node-app/core@0.5.4

## 0.6.2

### Patch Changes

- Fix deps
- Updated dependencies
  - @create-node-app/core@0.5.2

## 0.6.0

### Minor Changes

- Great refactor

### Patch Changes

- Updated dependencies
  - @create-node-app/core@0.5.0

## 0.5.0

### Minor Changes

- Added AI support

### Patch Changes

- Updated dependencies
  - @create-node-app/core@0.4.0

## 0.4.27

### Patch Changes

- Added new flags
- Updated dependencies
  - @create-node-app/core@0.3.18

## 0.4.26

### Patch Changes

- Updated version
- Updated dependencies
  - @create-node-app/core@0.3.17

## 0.4.25

### Patch Changes

- 0515e1d: Updated CLI options
- Updated dependencies [0515e1d]
  - @create-node-app/core@0.3.16

## 0.4.24

### Patch Changes

- Updated run fallbacks
- Updated dependencies
  - @create-node-app/core@0.3.15

## 0.4.23

### Patch Changes

- Updated deps
- Updated dependencies
  - @create-node-app/core@0.3.14

## 0.4.22

### Patch Changes

- Keep permissions from original files when doing the scaffolding
- Updated dependencies
  - @create-node-app/core@0.3.13

## 0.4.21

### Patch Changes

- Updated pnpm flags
- Updated dependencies
  - @create-node-app/core@0.3.12

## 0.4.20

### Patch Changes

- Mentioned in awesome

## 0.4.19

### Patch Changes

- Added CI mode
- Updated dependencies
  - @create-node-app/core@0.3.11

## 0.4.18

### Patch Changes

- Updated source code to be more performant
- Updated dependencies
  - @create-node-app/core@0.3.10

## 0.4.17

### Patch Changes

- Updated changelog

## 0.4.16

### Patch Changes

- Updated docs

## 0.4.15

### Patch Changes

- Small fix
- Updated dependencies
  - @create-node-app/core@0.3.9

## 0.4.14

### Patch Changes

- Simple fix
- Updated dependencies
  - @create-node-app/core@0.3.8

## 0.4.13

### Patch Changes

- Updated package loader
- Updated dependencies
  - @create-node-app/core@0.3.7

## 0.4.12

### Patch Changes

- Added conditional installation for npm, yarn and pnpm
- Updated dependencies
  - @create-node-app/core@0.3.6

## 0.4.11

### Patch Changes

- Rollback

## 0.4.10

### Patch Changes

- Updated type match

## 0.4.9

### Patch Changes

- Removed language option

## 0.4.8

### Patch Changes

- Updated usage instructions

## 0.4.7

### Patch Changes

- Updated docs with small demo

## 0.4.6

### Patch Changes

- Updated instructions
- Updated dependencies
  - @create-node-app/core@0.3.5

## 0.4.5

### Patch Changes

- Updated instructions
- Updated dependencies
  - @create-node-app/core@0.3.4

## 0.4.4

### Patch Changes

- Don't show content in stdout on some cases
- Updated dependencies
  - @create-node-app/core@0.3.3

## 0.4.3

### Patch Changes

- Updated fomatting to pass
- Updated dependencies
  - @create-node-app/core@0.3.2

## 0.4.2

### Patch Changes

- Little fix to handle new format
- Updated dependencies
  - @create-node-app/core@0.3.1

## 0.4.1

### Patch Changes

- Updated documentation

## 0.4.0

### Minor Changes

- Check for correct node version on runtime

### Patch Changes

- Updated dependencies
  - @create-node-app/core@0.3.0

## 0.3.8

### Patch Changes

- Updated package generation
- Updated dependencies
  - @create-node-app/core@0.2.6

## 0.3.7

### Patch Changes

- Simple fix to check for latest version

## 0.3.6

### Patch Changes

- Added package managers and custom options
- Updated dependencies
  - @create-node-app/core@0.2.5

## 0.3.5

### Patch Changes

- Added flags for yarnpkg
- Updated dependencies
  - @create-node-app/core@0.2.4

## 0.3.4

### Patch Changes

- Stop execution if the version is not latest

## 0.3.3

### Patch Changes

- Added language as an option
- 25714c8: Updated extensions schema type
- Updated dependencies [25714c8]
  - @create-node-app/core@0.2.3
