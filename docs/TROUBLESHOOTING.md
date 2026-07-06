# Troubleshooting

Common issues when scaffolding projects with `create-awesome-node-app`.

## Windows path issues ([#30](https://github.com/Create-Node-App/create-node-app/issues/30))

**Symptoms:** Scaffolding fails on Windows with path-related errors, or files are created in unexpected locations.

**Workarounds:**

- Run the CLI from PowerShell or Git Bash with administrator privileges if permission errors appear.
- Prefer short project paths without spaces (e.g. `C:\dev\my-app`).
- Use WSL2 for the most reliable experience on Windows.

**Status:** Under investigation. Track progress in issue #30.

## ESLint "Unexpected token" error ([#63](https://github.com/Create-Node-App/create-node-app/issues/63))

**Symptoms:** After scaffolding, `npm run lint` fails with `Unexpected token` in config or source files.

**Cause:** Usually ESLint flat config (v9+) compatibility — the parser may not match the file type being linted.

**Fix:**

1. Open `eslint.config.mjs` (or `.eslintrc`) in the generated project.
2. Confirm `@eslint/js` and `typescript-eslint` versions match the template's `package.json`.
3. Run `npm run lint:fix` if available, then `npm run lint` again.
4. If the error points at a specific file, check that the correct parser (`@typescript-eslint/parser`) is applied to `.ts`/`.tsx` files.

## Node.js version mismatch

**Symptoms:** The CLI exits immediately with a Node version error.

**Requirement:** Node.js **>= 22.0.0**

```bash
node --version
```

**Switch versions:**

- [nvm](https://github.com/nvm-sh/nvm): `nvm install 22 && nvm use 22`
- [fnm](https://github.com/Schniz/fnm): `fnm install 22 && fnm use 22`
- [Volta](https://volta.sh/): `volta install node@22`

## File permission errors ([#29](https://github.com/Create-Node-App/create-node-app/issues/29))

**Symptoms:** Generated files have incorrect permissions on macOS/Linux; scripts are not executable.

**Workaround:**

```bash
chmod -R u+rwX my-project
```

**Status:** Under investigation. Track progress in issue #29.

## Template URL not found

**Symptoms:** Scaffolding fails with a message about HTTP 404 or repository not found.

**Tips:**

- Registry templates use slugs: `npx create-awesome-node-app my-app -t nextjs-starter`
- Custom URLs must be valid GitHub URLs or `file://` paths for local development
- List official templates: `npx create-awesome-node-app --list-templates`
- Test a local template: `npx create-awesome-node-app my-app -t "file:///path/to/cna-templates?subdir=templates/react-vite-starter"`

## Package manager conflicts

**Symptoms:** Install fails, lockfile conflicts, or wrong package manager is used.

**Guidance:**

- The CLI supports `npm` (default), `yarn`, and `pnpm` via `--use-yarn` / `--use-pnpm`
- After generation, stick to one package manager — do not mix `package-lock.json` and `pnpm-lock.yaml`
- If you switch managers, delete `node_modules` and the other lockfile before reinstalling

## `--set` values with spaces

When passing custom options that contain spaces, quote the entire `key=value` pair:

```bash
npx create-awesome-node-app my-app -t nextjs-starter --set 'projectName=My Awesome Project'
```

## Cache location and inspection

By default, CNA caches the template catalog and the template git repos
under `~/.cache/cna`. The CLI exposes this via:

```bash
npx create-awesome-node-app cache dir    # print the cache root
npx create-awesome-node-app cache list   # show entries with id, url, branch, last fetched, sha, size
npx create-awesome-node-app cache verify # run git fsck on every entry
npx create-awesome-node-app cache clean  # remove all entries
npx create-awesome-node-app cache clean <id>   # remove one entry by id
npx create-awesome-node-app cache clean --catalog   # also clear the catalog cache
```

If a scaffold "looks weird" and you suspect a stale cache, the first
diagnostic step is `cache verify`. If any entry fails, `cache clean` and
re-run.

## Forcing a fresh fetch

```bash
# Force a re-fetch of templates.json on every run.
npx create-awesome-node-app my-app -t react-vite-boilerplate --no-cache

# Disable git pull on cache hit (use the local copy as-is).
npx create-awesome-node-app my-app -t react-vite-boilerplate --offline

# Pin the cache to a project-local directory (useful in CI).
CNA_CACHE_DIR="$PWD/.cna-cache" npx create-awesome-node-app my-app -t react-vite-boilerplate
```

See also: [MIGRATION.md](./MIGRATION.md) for keeping scaffolded projects up to date.
