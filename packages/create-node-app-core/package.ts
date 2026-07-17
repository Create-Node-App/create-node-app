// Removed unused eslint-disable (global-require) after migration to flat config
import { existsSync, readFileSync } from "fs";
import { createRequire } from "node:module";
import merge from "lodash.merge";
import type { TemplateOrExtension } from "./loaders.js";
import { getPackagePath } from "./paths.js";

// Type for setup options
type GetInstallableSetupOptions = {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  [key: string]: unknown;
};

// Helper function to prepare installable setup
const getInstallableSetup = ({
  dependencies,
  devDependencies,
  ...packageJson
}: GetInstallableSetupOptions) => {
  const getInstallableDeps = (deps = {}) =>
    Object.entries(deps).map(([dep, version]) => `${dep}@${version}`);

  return {
    packageJson,
    dependencies: getInstallableDeps(dependencies),
    devDependencies: getInstallableDeps(devDependencies),
  };
};

// Use createRequire to allow dynamic require() in this ESM module.
// createRequire uses the local module URL so the require graph stays
// scoped to this file.
const localRequire = createRequire(import.meta.url);

/**
 * Load a module from disk if it exists. Throws if missing.
 *
 * For `.json` files we read the file and `JSON.parse` it. We deliberately avoid
 * a dynamic `import()` with an import attribute (`with { type: "json" }`):
 * although valid at the source level, tsup/esbuild strips the attribute when
 * bundling, producing a bare `import("...json")` in the published `dist`. On
 * Node >= 20.10 that throws `ERR_IMPORT_ATTRIBUTE_MISSING`, which the callers
 * swallow — silently dropping every dependency declared in a template's or
 * extension's `package.json`. Reading + parsing is bundler- and Node-agnostic.
 *
 * For `.js`/`.cjs` files (e.g. `package/index.js`) we use `createRequire`.
 */
const importIfExists = async (filePath: string): Promise<unknown> => {
  if (!existsSync(filePath)) {
    throw new Error(`File ${filePath} does not exist`);
  }
  if (filePath.endsWith(".json")) {
    return JSON.parse(readFileSync(filePath, "utf8"));
  }
  // Fallback to createRequire for JS/CJS template modules.
  return localRequire(filePath);
};

// Options for loading packages
export type LoadPackagesOptions = {
  templatesOrExtensions?: TemplateOrExtension[];
  ignorePackage?: boolean;
  offline?: boolean;
  cacheDir?: string;
  refresh?: import("./git.js").RefreshMode;
  refreshAfterHours?: number;
  [key: string]: unknown;
};

/**
 * loadPackages loads the templatesOrExtensions packages and merge them into a single package.json
 * @param opts.templatesOrExtensions - templatesOrExtensions to load
 * @param opts.ignorePackage - ignore package.json file
 * @param opts.config - config to pass to the templatesOrExtensions package module
 * @returns
 */
export const loadPackages = async ({
  templatesOrExtensions = [],
  ignorePackage: globalIgnorePackage = false,
  offline,
  cacheDir,
  refresh,
  refreshAfterHours,
  ...config
}: LoadPackagesOptions) => {
  const pathOpts = {
    ...(offline !== undefined ? { offline } : {}),
    ...(cacheDir !== undefined ? { cacheDir } : {}),
    ...(refresh !== undefined ? { refresh } : {}),
    ...(refreshAfterHours !== undefined ? { refreshAfterHours } : {}),
  };

  // Load and merge template packages concurrently
  const setup = await Promise.all(
    templatesOrExtensions.map(async ({ url: templateOrExtension }) => {
      try {
        // Try to load and merge template package
        const template = (await importIfExists(
          await getPackagePath(
            templateOrExtension,
            "template.json",
            false,
            pathOpts,
          ),
        )) as { package?: unknown };
        return template.package || {}; // Use an empty object if template.json is not found
      } catch {
        return {}; // Ignore if template.json is not found
      }
    }),
  );

  // Merge all the setup results from templates
  const mergedSetup = merge(
    {
      name: config.appName,
      dependencies: {},
      devDependencies: {},
      scripts: {},
    },
    ...setup,
  );

  // Load and merge package.json files concurrently
  const finalSetup = await Promise.all(
    templatesOrExtensions.map(
      async ({ url: templateOrExtension, ignorePackage }) => {
        try {
          // Try to load and merge package.json
          const templateOrExtensionPackageJson = (await importIfExists(
            await getPackagePath(
              templateOrExtension,
              "package.json",
              globalIgnorePackage || ignorePackage,
              pathOpts,
            ),
          )) as Record<string, unknown>;
          return templateOrExtensionPackageJson; // Use an empty object if package.json is not found
        } catch {
          return {}; // Ignore if package.json is not found
        }
      },
    ),
  );

  // Resolve package updates using package module concurrently
  const resolvedSetup = await Promise.all(
    templatesOrExtensions.map(async ({ url: templateOrExtension }) => {
      try {
        // Try to resolve package updates using package module
        const resolveTemplateOrExtensionPackage = (await importIfExists(
          await getPackagePath(templateOrExtension, "package", false, pathOpts),
        )) as (
          setup: Record<string, unknown>,
          config: Record<string, unknown>,
        ) => Record<string, unknown>;
        return resolveTemplateOrExtensionPackage(mergedSetup, config); // Use an empty object if resolution fails
      } catch {
        return {}; // Ignore if the resolution function fails
      }
    }),
  );

  // Merge all setup results
  const packageJson = merge(mergedSetup, ...finalSetup, ...resolvedSetup);

  // Prepare the final installable setup
  return getInstallableSetup({
    ...packageJson,
    name: config.appName,
  });
};
