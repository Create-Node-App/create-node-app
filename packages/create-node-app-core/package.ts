/* eslint-disable global-require */
import { existsSync } from "fs";
import merge from "lodash.merge";
import { TemplateOrExtension } from "./loaders";
import { getPackagePath } from "./paths";

type GetInstallableSetupOptions = {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  [key: string]: unknown;
};

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

const requireIfExists = (path: string) => {
  if (existsSync(path)) {
    return require(path);
  }

  throw new Error(`file ${path} not exists`);
};

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
  const setup = await templatesOrExtensions.reduce(
    async (setupPromise, { url: templateOrExtension, ignorePackage }) => {
      let packageJson = await setupPromise;

      try {
        const template = requireIfExists(
          await getPackagePath(templateOrExtension, "template.json")
        );
        packageJson = merge(packageJson, template.package || {});
      } catch {
        // ignore this case since it failed executing the require of the `template.json`
      }

      try {
        const templateOrExtensionPackageJson = requireIfExists(
          await getPackagePath(
            templateOrExtension,
            "package.json",
            globalIgnorePackage || ignorePackage
          )
        );
        return merge(packageJson, templateOrExtensionPackageJson);
      } catch {
        // ignore this case since it failed executing the require of the `package.json`
      }

      try {
        // apply updates using package module
        const resolveTemplateOrExtensionPackage = requireIfExists(
          await getPackagePath(templateOrExtension)
        );
        packageJson = resolveTemplateOrExtensionPackage(packageJson, config);
      } catch {
        // ignore this case since it failed executing `resolveTemplateOrExtensionPackage(...)`
      }
      return packageJson;
    },
    Promise.resolve({
      name: config.appName,
      dependencies: {},
      devDependencies: {},
      scripts: {},
    })
  );

  return getInstallableSetup({
    ...setup,
    name: config.appName,
  });
};
