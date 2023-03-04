import _ from "underscore";
import path from "path";
import fs from "fs-extra";
import chalk from "chalk";
import os from "os";
import semver from "semver";
import spawn from "cross-spawn";
import { execSync } from "child_process";

import {
  shouldUseYarn,
  checkThatNpmCanReadCwd,
  checkNpmVersion,
  checkIfOnline,
} from "./helpers";
import { loadAddonsPackages } from "./package";
import { Addon, loadFiles } from "./loaders";

const install = (
  root: string,
  useYarn = false,
  dependencies: string[] = [],
  verbose = false,
  isOnline = true,
  isDevDependencies = false
) => {
  return new Promise<void>((resolve, reject) => {
    let command: string;
    let args: string[];

    if (useYarn) {
      command = "yarnpkg";
      // args = ['add', '--exact']
      args = ["add"];
      if (!isOnline) {
        args.push("--offline");
      }
      if (isDevDependencies) {
        args.push("--dev");
      }
      args.push(...dependencies);
      args.push("--cwd");
      args.push(root);

      if (!isOnline) {
        console.log(chalk.yellow("You appear to be offline."));
        console.log(chalk.yellow("Falling back to the local Yarn cache."));
        console.log();
      }
    } else {
      command = "npm";
      args = ["install", "--loglevel", "error"];
      if (isDevDependencies) {
        args.push("--save-dev");
      } else {
        args.push("--save");
      }

      args.push(...dependencies);
    }

    if (verbose) {
      args.push("--verbose");
    }

    const child = spawn(command, args, { stdio: "inherit" });
    child.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(`${command} ${args.join(" ")}`));
        return;
      }
      resolve();
    });
  });
};

export type RunOptions = {
  root: string;
  appName: string;
  originalDirectory: string;
  verbose?: boolean;
  useYarn?: boolean;
  addons?: Addon[];
  dependencies?: string[];
  devDependencies?: string[];
  alias?: string;
  installDependencies?: boolean;
  srcDir?: string;
};

const run = async ({
  root,
  appName,
  originalDirectory,
  verbose = false,
  useYarn = false,
  addons = [],
  dependencies = [],
  devDependencies = [],
  alias = "",
  installDependencies = true,
  srcDir = "",
}: RunOptions) => {
  let isOnline = true;
  if (useYarn) {
    isOnline = await checkIfOnline(useYarn);
  }

  if (_.isEmpty(addons)) {
    console.log();
    console.log(chalk.yellow("No addons specified to bootstrap application."));
    console.log();
    process.exit(0);
  }

  const command = useYarn ? "yarn" : "npm run";

  if (installDependencies) {
    console.log(
      chalk.green("Installing packages. This might take a couple of minutes.")
    );
    console.log(chalk.green("Installing dependencies..."));
    console.log();
    // Install dependencies
    await install(root, useYarn, dependencies, verbose, isOnline, false);

    if (devDependencies.length > 0) {
      console.log();
      console.log(chalk.green("Installing devDependencies..."));
      console.log();
      // Install devDependencies
      await install(root, useYarn, devDependencies, verbose, isOnline, true);
    }
  } else {
    console.log(chalk.yellow("Skip package installation."));
    console.log(chalk.yellow("Run npm install/yarn in your project."));
    let packageJson = JSON.parse(
      fs.readFileSync(`${root}/package.json`, "utf8")
    );

    packageJson.dependencies = dependencies.reduce((dep, elem) => {
      let nextDep = dep;
      if (/.+@(\^|~)?[0-9a-zA-Z-.]+$/.test(elem)) {
        let [name, version] = elem.split("@");
        nextDep[name] = `${version}`;
      } else {
        nextDep[elem] = "*";
      }
      return nextDep;
    }, {} as { [key: string]: string });

    packageJson.devDependencies = devDependencies.reduce((dep, elem) => {
      let nextDep = dep;
      if (/.+@(\^|~)?[0-9a-zA-Z-.]+$/.test(elem)) {
        let [name, version] = elem.split("@");
        nextDep[name] = `${version}`;
      } else {
        nextDep[elem] = "*";
      }
      return nextDep;
    }, {} as { [key: string]: string });

    fs.writeFileSync(
      path.join(root, "package.json"),
      JSON.stringify(packageJson, null, 2) + os.EOL
    );
  }

  await loadFiles({
    root,
    addons,
    appName,
    originalDirectory,
    alias,
    verbose,
    srcDir,
  });

  spawn("git", ["init"]);
  if (installDependencies && isOnline) {
    const packageJson = JSON.parse(
      fs.readFileSync(`${root}/package.json`, "utf8")
    );
    if (packageJson.scripts && packageJson.scripts["lint:fix"]) {
      spawn(command, ["lint:fix"], { stdio: "inherit" });
    }
  }
};

export type CreateAppOptions = {
  name: string;
  verbose?: boolean;
  useNpm?: boolean;
  addons?: Addon[];
  alias?: string;
  installDependencies?: boolean;
  ignorePackage?: boolean;
  srcDir?: string;
};

/**
 * createApp bootstraps the node application based on user options
 *
 * @param opts.name - Project's name
 * @param opts.verbose - Specify if it is needed to use verbose mode or not
 * @param opts.useNpm - Use npm mandatorily
 * @param opts.addons - Official extensions to apply
 * @param opts.alias - Metadata to specify alias, usefull for backends using webpack
 * @param opts.installDependencies - Specify if it is needed to install dependencies
 * @param opts.ignorePackage - Specify if it is needed to ignore package.json on all templates
 * @param opts.srcDir - Metadata to specify where to put the source code
 */
export const createApp = async ({
  name,
  verbose = false,
  useNpm = false,
  addons = [],
  alias = "",
  installDependencies = true,
  ignorePackage = false,
  srcDir = "",
}: CreateAppOptions) => {
  const root = path.resolve(name);
  const appName = path.basename(root);

  fs.ensureDirSync(name);

  console.log(`Creating a new Node app in ${chalk.green(root)}.`);
  console.log();

  const useYarn = useNpm ? false : shouldUseYarn();
  const command = useYarn ? "yarn" : "npm run";

  const { packageJson, dependencies, devDependencies } =
    await loadAddonsPackages({
      addons,
      appName,
      command,
      ignorePackage,
      srcDir,
    });

  fs.writeFileSync(
    path.join(root, "package.json"),
    JSON.stringify(packageJson, null, 2) + os.EOL
  );

  const originalDirectory = process.cwd();
  process.chdir(root);
  if (!useYarn && !checkThatNpmCanReadCwd()) {
    process.exit(1);
  }

  if (!semver.satisfies(process.version, ">=16.0.0")) {
    console.log(
      chalk.yellow(
        `You are using Node ${process.version} so the project will be bootstrapped with an old unsupported version of tools.\n\n` +
          `Please update to Node 16 or higher for a better, fully supported experience.\n`
      )
    );
  }

  if (!useYarn) {
    const npmInfo = checkNpmVersion();
    if (!npmInfo.hasMinNpm) {
      if (npmInfo.npmVersion) {
        console.log(
          chalk.yellow(
            `You are using npm ${npmInfo.npmVersion} so the project will be bootstrapped with an old unsupported version of tools.\n\n` +
              `Please update to npm 3 or higher for a better, fully supported experience.\n`
          )
        );
      }
    }
  }

  if (useYarn) {
    let yarnUsesDefaultRegistry = true;
    try {
      yarnUsesDefaultRegistry =
        execSync("yarnpkg config get registry").toString().trim() ===
        "https://registry.yarnpkg.com";
    } catch (e) {
      // ignore
    }
    if (false && yarnUsesDefaultRegistry) {
      fs.copySync(
        require.resolve("./yarn.lock.cached"),
        path.join(root, "yarn.lock")
      );
    }
  }

  await run(
    root,
    appName,
    originalDirectory,
    verbose,
    useYarn,
    addons,
    dependencies,
    devDependencies,
    alias,
    installDependencies,
    srcDir
  );
};
