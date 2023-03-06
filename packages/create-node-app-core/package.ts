/* eslint-disable global-require */
import { existsSync } from "fs";
import merge from "lodash.merge";
import { Addon } from "./loaders";
import { getAddonPackagePath } from "./paths";

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

export type LoadAddonsPackagesOptions = {
  addons?: Addon[];
  ignorePackage?: boolean;
  [key: string]: unknown;
};

/**
 * loadAddonsPackages loads the addons packages and merge them into a single package.json
 * @param opts.addons - addons to load
 * @param opts.ignorePackage - ignore package.json file
 * @param opts.config - config to pass to the addons package module
 * @returns
 */
export const loadAddonsPackages = async ({
  addons = [],
  ignorePackage: globalIgnorePackage = false,
  ...config
}: LoadAddonsPackagesOptions) => {
  const setup = await addons.reduce(
    async (setupPromise, { url: addon, ignorePackage }) => {
      let packageJson = await setupPromise;

      try {
        const template = requireIfExists(
          await getAddonPackagePath(addon, "template.json")
        );
        packageJson = merge(packageJson, template.package || {});
      } catch {
        // ignore this case since it failed executing the require of the `template.json`
      }

      try {
        const addonPackageJson = requireIfExists(
          await getAddonPackagePath(
            addon,
            "package.json",
            globalIgnorePackage || ignorePackage
          )
        );
        return merge(packageJson, addonPackageJson);
      } catch {
        // ignore this case since it failed executing the require of the `package.json`
      }

      try {
        // apply updates using package module
        const resolveAddonPackage = requireIfExists(
          await getAddonPackagePath(addon)
        );
        packageJson = resolveAddonPackage(packageJson, config);
      } catch {
        // ignore this case since it failed executing `resolveAddonPackage(...)`
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

  return getInstallableSetup(setup);
};
