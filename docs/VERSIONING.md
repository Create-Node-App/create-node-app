# Versioning

CNA uses **Changesets** (`@changesets/cli`) for version management and automated publishing.

## How changesets work

Each PR that changes user-facing behavior must include a changeset — a markdown
file in `.changeset/` that describes the version bump type and the change.

Changesets are created with:

```bash
npx changeset
```

Follow the prompts to select the packages and bump type (major/minor/patch).
This creates a file like `.changeset/rare-trees-lie.md`.

Changesets accumulate on `main`. When a release is ready, the
[Changesets GitHub Action](https://github.com/changesets/action) opens or
updates a **Version Packages** PR that:

- Consumes all pending `.changeset/*.md` files
- Bumps each package's version in `package.json`
- Updates inter-package dependency pins
- Updates `CHANGELOG.md` entries
- Removes the consumed changeset files
- Merging the Version Packages PR triggers automated npm publish

## Release workflow

### 1. Merge feature PRs

Merge feature and fix PRs as usual. Each should carry a `.changeset/*.md` file
describing the change. When a changeset lands on `main`, the Changesets Action
creates or updates the **Version Packages** PR.

### 2. Approve the Version Packages PR

The Version Packages PR is opened automatically. Review it to confirm:

- Version bumps are correct (major for breaking, minor for features, patch for fixes)
- Changelog entries are accurate
- All pending changesets are consumed

Merge the Version Packages PR to `main`.

### 3. Automated publish

Merging the Version Packages PR triggers the `publish` job in
`.github/workflows/publish.yml`:

1. `npm run publish-packages` — builds and publishes each package to npm
2. `changeset tag` — creates local git tags for published versions
3. Pushes tags to GitHub — triggers downstream workflows:
   - **Docker**: `publish-docker.yml` builds and pushes Docker image
   - **AUR**: `publish-aur.yml` updates the Arch User Repository package
   - **Homebrew**: `notify-homebrew.yml` opens a PR to the Homebrew tap

### 4. Verify the release

After the publish workflow completes:

```bash
npx create-awesome-node-app@latest --version
npx --yes create-awesome-node-app@latest my-test --no-install --no-interactive
```

The `smoke-distribution.yml` workflow (scheduled nightly) also verifies npm,
Docker, Homebrew, and AUR channels.

## Hotfix releases

For urgent fixes that cannot wait for the normal release cycle:

1. Create a PR with the fix and a changeset marked as `patch`
2. Merge to `main`
3. The Changesets Action creates/updates a Version Packages PR
4. Merge the Version Packages PR — publish proceeds automatically

To skip the changeset wait time, manually trigger the `publish` workflow from
the GitHub Actions UI, or run locally:

```bash
git checkout main
git pull
npm ci
npm run build
npx changeset version
npm run publish-packages
npx changeset tag
git push origin --tags
```

## Who can trigger releases

- Merging to `main` triggers the Version Packages PR (automatic)
- Merging the Version Packages PR triggers npm publish (automatic)
- Manual publish requires npm OIDC credentials via the `npm-publish`
  environment (`secrets.GITHUB_TOKEN` + trusted publisher)

## Changeset conventions

| Bump    | When                                                      |
| ------- | --------------------------------------------------------- |
| `major` | Breaking API change, CLI flag removal, Node version bump  |
| `minor` | New feature, new template/extension field, new subcommand |
| `patch` | Bug fix, dependency bump, documentation, refactor         |

Each changeset should mention the issue number: `feat: ... (#123)`.

## Local testing before release

```bash
# Dry-run version bump (no publish)
npx changeset version --snapshot

# Build all packages
npm run build

# Run full test suite
npm run test:all

# Reset after snapshot
git checkout -- packages/*/package.json packages/*/CHANGELOG.md
```
