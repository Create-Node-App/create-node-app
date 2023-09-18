import _ from "underscore";
import path from "path";
import fs from "fs";
import chalk from "chalk";
import os from "os";
import semver from "semver";
import { execSync } from "child_process";
import simpleGit from "simple-git";

import {
  shouldUseYarn,
  checkThatNpmCanReadCwd,
  checkNpmVersion,
  checkIfOnline,
  shouldUsePnpm,
} from "./helpers";
import { loadPackages } from "./package";
import { TemplateOrExtension, loadFiles } from "./loaders";

const install = async (
  root: string,
  useYarn = false,
  usePnpm = false,
  dependencies: string[] = [],
  verbose = false,
  isOnline = true,
  isDevDependencies = false
) => {
  let command: string;
  let args: string[];

  if (useYarn) {
    command = "yarnpkg";
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
    args = ["install", "--ignore-workspace-root-check", "--loglevel", "error"];
    if (isDevDependencies) {
      args.push("--save-dev");
    } else {
      args.push("--save");
    }

    args.push(...dependencies);
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

  try {
    execSync(`${command} ${args.join(" ")}`, {
      cwd: root,
      stdio: "inherit",
    });
  } catch (error) {
    throw new Error(`${command} ${args.join(" ")}`);
  }
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

const runCommandInProjectDir = async (
  root: string,
  command: string,
  args: string[] = [],
  successMessage = "Operation completed successfully.",
  errorMessage = "Operation failed."
) => {
  try {
    execSync(`${command} ${args.join(" ")}`, {
      cwd: root,
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
  const isOnline = useYarn ? await checkIfOnline(useYarn) : true;

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
    useYarn,
    usePnpm,
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

    const updateDependencies = (deps: string[]) => {
      return deps.reduce((dep, elem) => {
        const nextDep = dep;
        if (/.+@(\^|~)?[0-9a-zA-Z-.]+$/.test(elem)) {
          const [name, version] = elem.split("@");
          nextDep[name] = `${version}`;
        } else {
          nextDep[elem] = "*";
        }
        return nextDep;
      }, {} as { [key: string]: string });
    };

    packageJson.dependencies = updateDependencies(dependencies);
    packageJson.devDependencies = updateDependencies(devDependencies);

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

  try {
    const git = simpleGit(root);
    await git.init();
    console.log(chalk.green("Successfully initialized git repository."));
  } catch (error) {
    console.log();
    console.log(
      chalk.red(
        "Failed to initialize git repository. Run `git init` to initialize git repository after the process is completed."
      )
    );
    console.log();
  }

  if (installDependencies && isOnline) {
    const packageJson = JSON.parse(
      fs.readFileSync(`${root}/package.json`, "utf8")
    );

    const runFormat = async () => {
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
    };

    const runLintFix = async () => {
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
    };

    if (packageJson.scripts && packageJson.scripts["format"]) {
      await runFormat();
    }
    if (packageJson.scripts && packageJson.scripts["lint:fix"]) {
      await runLintFix();
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
    usePnpm,
    useYarn,
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

  if (!semver.satisfies(process.version, ">=18.0.0")) {
    console.log(
      chalk.yellow(
        `You are using Node ${process.version} so the project will be bootstrapped with an old unsupported version of tools.\n\n` +
          `Please update to Node 18 or higher for a better, fully supported experience.\n`
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
