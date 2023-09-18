/* eslint-disable global-require */
import { existsSync } from "fs";
import merge from "lodash.merge";
import { TemplateOrExtension } from "./loaders";
import { getPackagePath } from "./paths";

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

// Helper function to require a module if it exists, or throw an error
const requireIfExists = (path: string) => {
  if (existsSync(path)) {
    return require(path);
  }

  throw new Error(`File ${path} does not exist`);
};

// Options for loading packages
export type LoadPackagesOptions = {
  templatesOrExtensions?: TemplateOrExtension[];
  ignorePackage?: boolean;
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
  ...config
}: LoadPackagesOptions) => {
  // Load and merge template packages concurrently
  const setup = await Promise.all(
    templatesOrExtensions.map(async ({ url: templateOrExtension }) => {
      try {
        // Try to load and merge template package
        const template = requireIfExists(
          await getPackagePath(templateOrExtension, "template.json")
        );
        return template.package || {}; // Use an empty object if template.json is not found
      } catch {
        return {}; // Ignore if template.json is not found
      }
    })
  );

  // Merge all the setup results from templates
  const mergedSetup = merge(
    {
      name: config.appName,
      dependencies: {},
      devDependencies: {},
      scripts: {},
    },
    ...setup
  );

  // Load and merge package.json files concurrently
  const finalSetup = await Promise.all(
    templatesOrExtensions.map(
      async ({ url: templateOrExtension, ignorePackage }) => {
        try {
          // Try to load and merge package.json
          const templateOrExtensionPackageJson = requireIfExists(
            await getPackagePath(
              templateOrExtension,
              "package.json",
              globalIgnorePackage || ignorePackage
            )
          );
          return templateOrExtensionPackageJson; // Use an empty object if package.json is not found
        } catch {
          return {}; // Ignore if package.json is not found
        }
      }
    )
  );

  // Resolve package updates using package module concurrently
  const resolvedSetup = await Promise.all(
    templatesOrExtensions.map(async ({ url: templateOrExtension }) => {
      try {
        // Try to resolve package updates using package module
        const resolveTemplateOrExtensionPackage = requireIfExists(
          await getPackagePath(templateOrExtension)
        );
        return resolveTemplateOrExtensionPackage(mergedSetup, config); // Use an empty object if resolution fails
      } catch {
        return {}; // Ignore if the resolution function fails
      }
    })
  );

  // Merge all setup results
  const packageJson = merge(mergedSetup, ...finalSetup, ...resolvedSetup);

  // Prepare the final installable setup
  return getInstallableSetup({
    ...packageJson,
    name: config.appName,
  });
};
