import _ from "underscore";
import path from "path";
import fs from "fs";
import pc from "picocolors";
import os from "os";
import semver from "semver";
import { execSync } from "child_process";
// Use dynamic import for simple-git to avoid bundlers injecting unsupported dynamic requires in ESM
import type { SimpleGit, SimpleGitOptions } from "simple-git";

import {
  shouldUseYarn,
  checkThatNpmCanReadCwd,
  checkNpmVersion,
  checkIfOnline,
  shouldUsePnpm,
} from "./helpers.js";
import { loadPackages } from "./package.js";
import type { TemplateOrExtension } from "./loaders.js";
import { loadFiles } from "./loaders.js";

const install = async (
  root: string,
  useYarn = false,
  usePnpm = false,
  dependencies: string[] = [],
  verbose = false,
  isOnline = true,
  isDevDependencies = false,
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
      console.log(pc.yellow("You appear to be offline."));
      console.log(pc.yellow("Falling back to the local Yarn cache."));
      console.log();
    }
  } else if (usePnpm) {
    command = "pnpm";
    args = ["install", "--ignore-workspace", "--loglevel", "error"];
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
  errorMessage = "Operation failed.",
) => {
  try {
    execSync(`${command} ${args.join(" ")}`, {
      cwd: root,
      stdio: "ignore",
    });
    console.log(pc.green(successMessage));
  } catch (error) {
    console.log();
    console.log(pc.red(errorMessage));
    console.log();
  }
};

function extractNameAndVersion(dependencyString: string) {
  // extract the name and version from the dependency string separated by @
  // e.g. @types/react@^16
  // => name: @types/react
  // => version: ^16
  // e.g. react@^16
  // => name: react
  // => version: ^16

  // Find the last "@" symbol to split the string
  const lastIndex = dependencyString.lastIndexOf("@");

  if (lastIndex !== -1) {
    // Split the string into name and version parts
    const name = dependencyString.substring(0, lastIndex); // Name
    const version = dependencyString.substring(lastIndex + 1); // Version

    return { name, version };
  } else {
    // If "@" is not present, treat the whole string as the name
    return { name: dependencyString, version: "" };
  }
}

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
      pc.yellow(
        "No templates or extensions specified to bootstrap application.",
      ),
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
  console.log(pc.green("Successfully scaffolded project."));
  console.log();

  if (installDependencies) {
    console.log(
      pc.green("Installing packages. This might take a couple of minutes."),
    );
    console.log(pc.green("Installing dependencies..."));
    console.log();
    // Install dependencies
    await install(
      root,
      useYarn,
      usePnpm,
      dependencies,
      verbose,
      isOnline,
      false,
    );

    if (devDependencies.length > 0) {
      console.log();
      console.log(pc.green("Installing devDependencies..."));
      console.log();
      // Install devDependencies
      await install(
        root,
        useYarn,
        usePnpm,
        devDependencies,
        verbose,
        isOnline,
        true,
      );
    }
  } else {
    console.log(pc.yellow("Skip package installation."));
    const packageJson = JSON.parse(
      fs.readFileSync(`${root}/package.json`, "utf8"),
    );

    const updateDependencies = (deps: string[]) => {
      return deps.reduce(
        (dep, elem) => {
          const nextDep = dep;
          if (/.+@(\^|~)?[0-9a-zA-Z-.]+$/.test(elem)) {
            const { name, version } = extractNameAndVersion(elem);
            nextDep[name] = version;
          } else {
            nextDep[elem] = "*";
          }
          return nextDep;
        },
        {} as { [key: string]: string },
      );
    };

    packageJson.dependencies = updateDependencies(dependencies);
    packageJson.devDependencies = updateDependencies(devDependencies);

    fs.writeFileSync(
      path.join(root, "package.json"),
      JSON.stringify(packageJson, null, 2) + os.EOL,
    );

    console.log();
    console.log(pc.green("Successfully updated package.json."));
    console.log(pc.yellow(`Run ${pc.cyan(installCommand)} to install.`));
  }

  console.log();
  console.log("Initializing git repository...");

  try {
    const { simpleGit } = (await import("simple-git")) as unknown as {
      simpleGit: (
        baseDir?: string,
        options?: Partial<SimpleGitOptions>,
      ) => SimpleGit;
    };
    const git = simpleGit(root);
    await git.init();
    console.log(pc.green("Successfully initialized git repository."));
  } catch (error) {
    console.log();
    console.log(
      pc.red(
        "Failed to initialize git repository. Run `git init` to initialize git repository after the process is completed.",
      ),
    );
    console.log();
  }

  if (installDependencies && isOnline) {
    const packageJson = JSON.parse(
      fs.readFileSync(`${root}/package.json`, "utf8"),
    );

    const runFormat = async () => {
      try {
        await runCommandInProjectDir(
          root,
          runCommand,
          ["format"],
          "Successfully formatted code.",
          `Failed to format code. Run \`${runCommand} format\` to format code after the process is completed.`,
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
          `Failed to fix linting errors. Run \`${runCommand} lint:fix\` to fix linting errors after the process is completed.`,
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
  console.log(pc.green("Successfully created project " + appName + "."));
  console.log();
  console.log("Done! Now run:");
  console.log();
  console.log(pc.cyan(`  cd ${appName}`));
  console.log(pc.cyan(`  ${installCommand}`));

  const packageJson = JSON.parse(
    fs.readFileSync(`${root}/package.json`, "utf8"),
  );

  const lookForScripts = ["compose:up", "sls:offline", "dev", "start"];

  for (const script of lookForScripts) {
    if (packageJson.scripts && packageJson.scripts[script]) {
      console.log(pc.cyan(`  ${runCommand} ${script}`));
      break;
    }
  }

  console.log();
  console.log(pc.green("Happy hacking!"));
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

  console.log(`Creating a new Node app in ${pc.green(root)}.`);
  console.log();

  const useYarn = customOptions.packageManager === "yarn" && shouldUseYarn();
  const usePnpm = customOptions.packageManager === "pnpm" && shouldUsePnpm();
  const runCommand = useYarn ? "yarn" : usePnpm ? "pnpm run" : "npm run";
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
    JSON.stringify(packageJson, null, 2) + os.EOL,
  );

  const originalDirectory = process.cwd();
  process.chdir(root);
  if (!useYarn && !checkThatNpmCanReadCwd()) {
    process.exit(1);
  }

  if (!semver.satisfies(process.version, ">=18.0.0")) {
    console.log(
      pc.yellow(
        `You are using Node ${process.version} so the project will be bootstrapped with an old unsupported version of tools.\n\n` +
          `Please update to Node 18 or higher for a better, fully supported experience.\n`,
      ),
    );
  }

  if (!useYarn) {
    const npmInfo = checkNpmVersion();
    if (!npmInfo.hasMinNpm) {
      if (npmInfo.npmVersion) {
        console.log(
          pc.yellow(
            `You are using npm ${npmInfo.npmVersion} so the project will be bootstrapped with an old unsupported version of tools.\n\n` +
              `Please update to npm 3 or higher for a better, fully supported experience.\n`,
          ),
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
        { force: true },
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
