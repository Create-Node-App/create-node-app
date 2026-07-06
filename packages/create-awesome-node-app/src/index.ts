import { Command } from "commander";
import pc from "picocolors";
import semver from "semver";
import {
  createNodeApp,
  checkForLatestVersion,
  checkNodeVersion,
  NON_EMPTY_DIR_ERROR_CODE,
  type TemplateOrExtension,
} from "@create-node-app/core";
import { getCnaOptions } from "./options.js";
import { parseSetOverrides } from "./set-overrides.js";
// NodeNext JSON import with import attributes
import packageJson from "../package.json" with { type: "json" };
import { listTemplates, listAddons } from "./list.js";
import { cacheClean, cacheDir, cacheList, cacheVerify } from "./cache-cli.js";
// Re-export template helpers for testing / programmatic use
export {
  getTemplateCategories,
  getTemplatesForCategory,
  getExtensionsGroupedByCategory,
} from "./templates.js";

const program = new Command();

const main = async () => {
  let projectName = "my-project";
  let cacheSubcommand: string | undefined;
  let cacheSubcommandArg: string | undefined;
  let cacheCatalogFlag = false;

  const cacheCommand = program
    .command("cache")
    .description("Inspect and manage the local template/extension cache");

  cacheCommand
    .command("dir")
    .description("Print the cache root directory")
    .action(() => {
      cacheSubcommand = "dir";
    });

  cacheCommand
    .command("list")
    .description("List cached templates and extensions")
    .action(() => {
      cacheSubcommand = "list";
    });

  cacheCommand
    .command("clean [id]")
    .description(
      "Remove one or all cached entries (pass --catalog to also clear the template catalog cache)",
    )
    .option("--catalog", "Also clear the on-disk template catalog cache")
    .action((id: string | undefined, options: { catalog?: boolean }) => {
      cacheSubcommand = "clean";
      cacheSubcommandArg = id;
      cacheCatalogFlag = Boolean(options.catalog);
    });

  cacheCommand
    .command("verify [id]")
    .description("Run git fsck on one or all cached entries")
    .action((id: string | undefined) => {
      cacheSubcommand = "verify";
      cacheSubcommandArg = id;
    });

  program
    .version(packageJson.version)
    .arguments("[project-directory]")
    .usage(`${pc.green("[project-directory]")} [options]`)
    .option("-v, --verbose", "print additional logs")
    .option("-i, --info", "print environment debug info")
    .option(
      "--no-install",
      "Generate package.json without installing dependencies",
    )
    .option(
      "-t, --template <template>",
      "specify a template for the created project",
    )
    .option(
      "--addons [extensions...]",
      "specify extensions to apply for the boilerplate generation",
    )
    .option(
      "--extend [extensions...]",
      "specify extra extension URLs to layer on top of the selected template and addons",
    )
    .option("--use-yarn", "use yarn instead of npm or pnpm or bun")
    .option("--use-pnpm", "use pnpm instead of yarn, npm, or bun")
    .option("--use-bun", "use bun instead of npm, yarn, or pnpm")
    .option("-f, --force", "allow scaffolding into a non-empty directory")
    .option(
      "--interactive",
      "force interactive mode (default outside CI unless --no-interactive)",
      undefined,
    )
    .option(
      "--no-interactive",
      "disable interactive mode (use only flags / non-interactive flow)",
    )
    .option("--list-templates", "list all available templates")
    .option("--list-addons", "list all available addons")
    .option(
      "--set <assignments...>",
      "set a custom template option (format: key=value; quote values with spaces: --set 'projectName=My App' or --set 'projectName=My App' --set 'author=Jane Doe')",
    )
    .option(
      "--keep-on-failure",
      "debug: keep partially-scaffolded files when a copy operation fails (default: clean up)",
    )
    .option(
      "--offline",
      "use the local cache only; do not refresh templates from the network",
    )
    .option(
      "--no-cache",
      "disable the on-disk cache and always re-download templates (sets CNA_NO_CATALOG_CACHE=1 and forces refresh=always)",
    )
    .option(
      "--cache-dir <path>",
      "override the cache root (defaults to ~/.cache/cna; also CNA_CACHE_DIR)",
    )
    .option(
      "--refresh <mode>",
      "when to refresh the cached template: always | stale | manual (default: stale)",
      (value: string) => {
        if (!["always", "stale", "manual"].includes(value)) {
          throw new Error(
            `Invalid --refresh mode: '${value}'. Use one of: always, stale, manual.`,
          );
        }
        return value as "always" | "stale" | "manual";
      },
    )
    .action((providedProjectName: string | undefined) => {
      projectName = providedProjectName || projectName;
    });

  program.parse(process.argv);

  // Handle cache subcommands before the regular flow.
  if (cacheSubcommand) {
    switch (cacheSubcommand) {
      case "dir":
        cacheDir();
        return;
      case "list":
        await cacheList();
        return;
      case "clean":
        await cacheClean(cacheSubcommandArg, { catalog: cacheCatalogFlag });
        return;
      case "verify": {
        const code = await cacheVerify(cacheSubcommandArg);
        if (code !== 0) process.exit(code);
        return;
      }
    }
  }

  const opts = program.opts();
  checkNodeVersion(packageJson.engines.node, packageJson.name);

  const latestVersion = await checkForLatestVersion("create-awesome-node-app");
  if (latestVersion && semver.lt(packageJson.version, latestVersion)) {
    console.log();
    console.warn(
      pc.yellow(
        `You are running \`create-awesome-node-app\` ${packageJson.version}, which is behind the latest release (${latestVersion}).\n\n` +
          "We recommend always using the latest version of create-awesome-node-app if possible.\n",
      ),
    );
  }

  // Handle list templates flag
  if (opts.listTemplates) {
    await listTemplates();
    return;
  }

  // Handle list addons flag
  if (opts.listAddons) {
    await listAddons({
      templateSlug: opts.template,
    });
    return;
  }

  // Translate --no-cache into the two env vars that downstream code reads.
  if (opts.noCache) {
    process.env.CNA_NO_CATALOG_CACHE = "1";
    if (!opts.refresh) {
      opts.refresh = "always";
    }
  }
  if (opts.cacheDir) {
    process.env.CNA_CACHE_DIR = opts.cacheDir;
  }

  // Extract package manager options directly from opts
  const { useYarn, usePnpm, useBun, set, noCache, ...restOpts } = opts;
  const packageManager = useYarn
    ? "yarn"
    : usePnpm
      ? "pnpm"
      : useBun
        ? "bun"
        : "npm";

  // Parse --set key=value assignments into an overrides map.
  const setOverrides = parseSetOverrides(set as string[] | undefined);

  const templatesOrExtensions: TemplateOrExtension[] = [restOpts.template]
    .concat(Array.isArray(restOpts.extend) ? restOpts.extend : [])
    .filter(Boolean)
    .reduce((acc, templateOrExtension) => {
      if (!templateOrExtension) return acc;
      return acc.concat({ url: templateOrExtension });
    }, [] as TemplateOrExtension[]);

  // `noCache` is consumed above (translates to env + refresh=always);
  // `cacheDir` similarly. Strip both from the rest spread so they don't
  // leak into the EJS context via the catch-all object.
  const { cacheDir: _cacheDirFlag, ...scaffoldOpts } = restOpts;
  void noCache;
  void _cacheDirFlag;

  return createNodeApp(
    projectName,
    {
      ...scaffoldOpts,
      packageManager,
      templatesOrExtensions,
      projectName,
      setOverrides,
    },
    getCnaOptions,
  );
};

/**
 * Print an error to stderr and exit with code 1. Exposed for tests so
 * they can invoke the real handler instead of asserting on a manual
 * `console.error` reproduction.
 */
export const handleMainError = (err: unknown, verbose: boolean): never => {
  if (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code?: string }).code === NON_EMPTY_DIR_ERROR_CODE
  ) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(pc.red(message));
    process.exit(1);
  }

  if (err instanceof Error) {
    console.error(pc.red(err.message));
    if (verbose && err.stack) {
      console.error(err.stack);
    }
  } else {
    console.error(err);
  }
  process.exit(1);
};

main().catch((err) => {
  handleMainError(err, Boolean(program.opts()?.verbose));
});
