import pc from "picocolors";
import envinfo from "envinfo";
import semver from "semver";
import { execFileSync } from "child_process";
import corePackageJson from "./package.json" with { type: "json" };
import type { TemplateOrExtension } from "./loaders.js";
export type { TemplateOrExtension } from "./loaders.js";
import { createApp } from "./installer.js";
import { resolveExecutable } from "./executable.js";

const CNA_CORE_VERSION = (corePackageJson as { version: string }).version;
export {
  getPackagePath,
  getTemplateDirPath,
  getTemplateBaseDirPath,
} from "./paths.js";
export {
  downloadRepository,
  writeCacheMeta,
  readCacheMeta,
  resolveCacheDir,
} from "./git.js";
export type { CacheMeta, RefreshMode } from "./git.js";
export { loadTemplateCnaConfig } from "./config.js";
export type { CnaConfig, CnaCustomOption } from "./config.js";
export {
  assertDirectoryIsEmpty,
  NonEmptyTargetDirectoryError,
  NON_EMPTY_DIR_ERROR_CODE,
} from "./config.js";
export { CnaError, ConfigParseError, ScaffoldAbortedError } from "./errors.js";

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

const CNA_USER_AGENT = `create-node-app-core/${CNA_CORE_VERSION} (https://github.com/Create-Node-App/create-node-app)`;

export { CNA_USER_AGENT };

export const checkForLatestVersion = async (packageName: string) => {
  try {
    const response = await fetch(
      `https://registry.npmjs.org/-/package/${packageName}/dist-tags`,
      {
        signal: AbortSignal.timeout(10_000),
        headers: { "User-Agent": CNA_USER_AGENT },
      },
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
      return execFileSync(resolveExecutable("npm"), [
        "view",
        packageName,
        "version",
      ])
        .toString()
        .trim();
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
      Binaries: ["Node", "npm", "pnpm", "Yarn", "Bun", "Watchman"],
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
  force?: boolean;
  packageManager?: string;
  install?: boolean;
  template?: string;
  templatesOrExtensions?: TemplateOrExtension[];
  offline?: boolean;
  cacheDir?: string;
  refresh?: import("./git.js").RefreshMode;
  refreshAfterHours?: number;
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
