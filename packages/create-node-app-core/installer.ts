import _ from "underscore";
import path from "path";
import fs from "fs";
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
  shouldUsePnpm,
} from "./helpers";
import { loadPackages } from "./package";
import { TemplateOrExtension, loadFiles } from "./loaders";

const install = (
  root: string,
  useYarn = false,
  usePnpm = false,
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
      args = ["add", "--ignore-workspace-root-check"];
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
    } else if (usePnpm) {
      command = "pnpm";
      args = ["add", "--save"];
      if (isDevDependencies) {
        args.push("--save-dev");
      }
      args.push(...dependencies);
      args.push("--cwd");
      args.push(root);
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

    const child = spawn(command, args, { stdio: "inherit", cwd: root });
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
  usePnpm?: boolean;
  templatesOrExtensions?: TemplateOrExtension[];
  dependencies?: string[];
  devDependencies?: string[];
  installDependencies?: boolean;
  runCommand: string;
  installCommand: string;
} & {
  [key: string]: unknown;
};

export const runCommandInProjectDir = async (
  root: string,
  command: string,
  args: string[] = [],
  successMessage = "Operation completed successfully.",
  errorMessage = "Operation failed."
) => {
  try {
    execSync(`${command} ${args.join(" ")}`, {
      cwd: root,
      // don't show output in console
      stdio: "ignore",
    });

    console.log(chalk.green(successMessage));
  } catch (error) {
    console.log();
    console.log(chalk.red(errorMessage));
    console.log();
  }
};

const run = async ({
  root,
  appName,
  originalDirectory,
  verbose = false,
  useYarn = false,
  usePnpm = false,
  templatesOrExtensions = [],
  dependencies = [],
  devDependencies = [],
  installDependencies = true,
  runCommand = "",
  installCommand = "",
  ...customOptions
}: RunOptions) => {
  let isOnline = true;
  if (useYarn) {
    isOnline = await checkIfOnline(useYarn);
  }

  if (_.isEmpty(templatesOrExtensions)) {
    console.log();
    console.log(
      chalk.yellow(
        "No templates or extensions specified to bootstrap application."
      )
    );
    console.log();
    process.exit(0);
  }

  console.log();
  console.log("Scaffolding project in " + root + "...");

  await loadFiles({
    root,
    templatesOrExtensions,
    appName,
    originalDirectory,
    verbose,
    runCommand,
    installCommand,
    ...customOptions,
  });

  console.log();
  console.log(chalk.green("Successfully scaffolded project."));
  console.log();

  if (installDependencies) {
    console.log(
      chalk.green("Installing packages. This might take a couple of minutes.")
    );
    console.log(chalk.green("Installing dependencies..."));
    console.log();
    // Install dependencies
    await install(
      root,
      useYarn,
      usePnpm,
      dependencies,
      verbose,
      isOnline,
      false
    );

    if (devDependencies.length > 0) {
      console.log();
      console.log(chalk.green("Installing devDependencies..."));
      console.log();
      // Install devDependencies
      await install(
        root,
        useYarn,
        usePnpm,
        devDependencies,
        verbose,
        isOnline,
        true
      );
    }
  } else {
    console.log(chalk.yellow("Skip package installation."));
    const packageJson = JSON.parse(
      fs.readFileSync(`${root}/package.json`, "utf8")
    );

    packageJson.dependencies = dependencies.reduce((dep, elem) => {
      const nextDep = dep;
      if (/.+@(\^|~)?[0-9a-zA-Z-.]+$/.test(elem)) {
        const [name, version] = elem.split("@");
        nextDep[name] = `${version}`;
      } else {
        nextDep[elem] = "*";
      }
      return nextDep;
    }, {} as { [key: string]: string });

    packageJson.devDependencies = devDependencies.reduce((dep, elem) => {
      const nextDep = dep;
      if (/.+@(\^|~)?[0-9a-zA-Z-.]+$/.test(elem)) {
        const [name, version] = elem.split("@");
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

    console.log();
    console.log(chalk.green("Successfully updated package.json."));
    console.log(chalk.yellow(`Run ${chalk.cyan(installCommand)} to install.`));
  }

  console.log();
  console.log("Initializing git repository...");

  await runCommandInProjectDir(
    root,
    "git",
    ["init"],
    "Successfully initialized git repository.",
    "Failed to initialize git repository. Run `git init` to initialize git repository after the process is completed."
  );

  if (installDependencies && isOnline) {
    const packageJson = JSON.parse(
      fs.readFileSync(`${root}/package.json`, "utf8")
    );
    if (packageJson.scripts && packageJson.scripts["format"]) {
      try {
        await runCommandInProjectDir(
          root,
          runCommand,
          ["format"],
          "Successfully formatted code.",
          `Failed to format code. Run \`${runCommand} format\` to format code after the process is completed.`
        );
      } catch {
        // ignore
      }
    }
    if (packageJson.scripts && packageJson.scripts["lint:fix"]) {
      try {
        await runCommandInProjectDir(
          root,
          runCommand,
          ["lint:fix"],
          "Successfully fixed linting errors.",
          `Failed to fix linting errors. Run \`${runCommand} lint:fix\` to fix linting errors after the process is completed.`
        );
      } catch {
        // ignore
      }
    }
  }

  // Print out instructions
  console.log();
  console.log(chalk.green("Successfully created project " + appName + "."));

  console.log();
  console.log("Done! Now run:");
  console.log();
  console.log(chalk.cyan(`  cd ${appName}`));
  console.log(chalk.cyan(`  ${installCommand}`));

  const packageJson = JSON.parse(
    fs.readFileSync(`${root}/package.json`, "utf8")
  );

  const lookForScripts = ["sls:offline", "dev", "start"];

  for (const script of lookForScripts) {
    if (packageJson.scripts && packageJson.scripts[script]) {
      console.log(chalk.cyan(`  ${runCommand} ${script}`));
      break;
    }
  }

  console.log();
  console.log(chalk.green("Happy hacking!"));
};

export type CreateAppOptions = {
  name: string;
  verbose?: boolean;
  packageManager?: string;
  templatesOrExtensions?: TemplateOrExtension[];
  installDependencies?: boolean;
  ignorePackage?: boolean;
} & {
  [key: string]: unknown;
};

/**
 * createApp bootstraps the node application based on user options
 *
 * @param opts.name - Project's name
 * @param opts.verbose - Specify if it is needed to use verbose mode or not
 * @param opts.packageManager - Package manager to use
 * @param opts.templatesOrExtensions - Official extensions to apply
 * @param opts.installDependencies - Specify if it is needed to install dependencies
 * @param opts.ignorePackage - Specify if it is needed to ignore package.json on all templates
 */
export const createApp = async ({
  name,
  verbose = false,
  templatesOrExtensions = [],
  installDependencies = true,
  ignorePackage = false,
  ...customOptions
}: CreateAppOptions) => {
  const root = path.resolve(name);
  const appName = path.basename(root);

  fs.mkdirSync(name, {
    recursive: true,
  });

  console.log(`Creating a new Node app in ${chalk.green(root)}.`);
  console.log();

  const useYarn = customOptions.packageManager === "yarn" && shouldUseYarn();
  const usePnpm = customOptions.packageManager === "pnpm" && shouldUsePnpm();
  const runCommand = useYarn ? "yarn" : "npm run";
  const installCommand = useYarn
    ? "yarn"
    : usePnpm
    ? "pnpm install"
    : "npm install";

  const { packageJson, dependencies, devDependencies } = await loadPackages({
    templatesOrExtensions,
    appName,
    runCommand,
    ignorePackage,
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
      fs.cpSync(
        require.resolve("./yarn.lock.cached"),
        path.join(root, "yarn.lock"),
        { force: true }
      );
    }
  }

  return run({
    root,
    appName,
    originalDirectory,
    verbose,
    useYarn,
    usePnpm,
    templatesOrExtensions,
    dependencies,
    devDependencies,
    installDependencies,
    runCommand,
    installCommand,
    ...customOptions,
  });
};
