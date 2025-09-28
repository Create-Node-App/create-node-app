import pc from "picocolors";
import envinfo from "envinfo";
import semver from "semver";
import { execSync } from "child_process";
import type { TemplateOrExtension } from "./loaders.js";
export type { TemplateOrExtension } from "./loaders.js";
import { createApp } from "./installer.js";
export { getPackagePath, getTemplateDirPath } from "./paths.js";
export { downloadRepository } from "./git.js";

export const checkNodeVersion = (
  requiredVersion: string,
  packageName: string,
) => {
  if (!semver.satisfies(process.version, requiredVersion)) {
    console.error(
      pc.red(
        `You are running Node ${process.version}.\n` +
          `${packageName} requires Node ${requiredVersion}.\n` +
          "Please update your version of Node.",
      ),
    );
    process.exit(1);
  }
};

export const checkForLatestVersion = async (packageName: string) => {
  try {
    const response = await fetch(
      `https://registry.npmjs.org/-/package/${packageName}/dist-tags`,
    );
    if (!response.ok) {
      throw new Error("Registry request failed");
    }
    const json = (await response.json()) as unknown;
    if (json && typeof json === "object" && "latest" in json) {
      return String((json as Record<string, unknown>)["latest"]);
    }
    return null;
  } catch {
    try {
      return execSync(`npm view ${packageName} version`).toString().trim();
    } catch {
      // ignore
    }
  }
  return null;
};

export const printEnvInfo = async () => {
  console.log(pc.bold("\nEnvironment Info:"));
  const info = await envinfo.run(
    {
      System: ["OS", "CPU", "Memory", "Shell"],
      Binaries: ["Node", "npm", "pnpm", "Yarn", "Watchman"],
      Browsers: ["Chrome", "Edge", "Internet Explorer", "Firefox", "Safari"],
    },
    {
      duplicates: true,
      showNotFound: true,
    },
  );
  console.log(info);
  process.exit(0);
};

export type CnaOptions = {
  projectName: string;
  info?: boolean;
  verbose?: boolean;
  packageManager?: string;
  install?: boolean;
  template?: string;
  templatesOrExtensions?: TemplateOrExtension[];
} & {
  [key: string]: unknown;
};

export type CnaOptionsTransform = (options: CnaOptions) => Promise<CnaOptions>;

export const createNodeApp = async (
  programName: string,
  options: CnaOptions,
  transformOptions: CnaOptionsTransform,
) => {
  if (options.info) {
    await printEnvInfo();
  }

  if (typeof options.projectName === "undefined") {
    console.error("Please specify the project directory:");
    console.log(`  ${pc.cyan(programName)} ${pc.green("[project-directory]")}`);
    console.log();
    console.log("For example:");
    console.log(`  ${pc.cyan(programName)} ${pc.green("my-app")}`);
    console.log();
    console.log(`Run ${pc.cyan(`${programName} --help`)} to see all options.`);
    process.exit(1);
  }

  const appOptions = await transformOptions(options);
  await createApp({
    ...appOptions,
    name: appOptions.projectName,
    installDependencies: options.install ?? true,
  });
};
