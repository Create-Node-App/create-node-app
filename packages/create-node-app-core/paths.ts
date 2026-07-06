import fs from "fs";
import os from "os";
import path from "path";
import { fileURLToPath } from "url";
import debug from "debug";
import { downloadRepository } from "./git.js";

const log = debug("cna:paths");

const moduleDir =
  typeof __dirname !== "undefined"
    ? __dirname
    : path.dirname(fileURLToPath(import.meta.url));

/**
 * Parse a template / extension URL (supports GitHub style and file:// URLs).
 * For GitHub style URLs we accept:
 *   https://github.com/<org>/<repo>
 *   https://github.com/<org>/<repo>/tree/<branch>/<subdir?>?ignorePackage=true
 * For local file templates:
 *   file:///absolute/path/to/template
 *   file:///absolute/path/to/repo?subdir=templates/react-vite-starter
 * Query params:
 *   - ignorePackage=true  -> ignore package.json from template
 *   - subdir=<relativePath> (only for file://) -> pick subdirectory
 *   - ref=<sha>           -> pin to a specific commit SHA (overrides branch)
 */
const solveValuesFromTemplateOrExtensionUrl = (templateOrExtension: string) => {
  const url = new URL(templateOrExtension);
  const ignorePackage = url.searchParams.get("ignorePackage") === "true";
  const refParam = url.searchParams.get("ref") || "";
  const strictRepro = process.env.CNA_STRICT_REPRO === "1";

  if (refParam && strictRepro && !/^[0-9a-f]{40}$/i.test(refParam)) {
    throw new Error(
      `Invalid ref parameter '${refParam}' with CNA_STRICT_REPRO=1: expected a full 40-character commit SHA.`,
    );
  }

  if (url.protocol === "file:") {
    // Handle platform specific absolute paths
    let pathname = decodeURIComponent(url.pathname);
    // On Windows a file URL looks like file:///C:/path -> pathname /C:/path
    if (process.platform === "win32" && /^\/[A-Za-z]:\//.test(pathname)) {
      pathname = pathname.slice(1); // drop leading slash
    }
    const subdirParam = url.searchParams.get("subdir") || "";
    return {
      url: templateOrExtension, // not used for git cloning when file://
      branch: refParam, // use ref even for file:// (carried but unused)
      subdir: subdirParam,
      protocol: url.protocol,
      host: "", // host is unused for file
      pathname,
      ignorePackage,
    };
  }

  const origin = `${url.protocol}//${url.host}`;
  // GitHub style path splitting: /org/repo[/tree/<branch>/<subdir...>]
  const parts = url.pathname.slice(1).split("/");
  const [org, repo] = parts;
  let branch = "";
  let subdir = "";
  if (parts[2] === "tree") {
    branch = parts[3] || "";
    subdir = parts.slice(4).join("/");
  }
  // ref query param overrides the branch from the URL path
  if (refParam) {
    branch = refParam;
  }
  return {
    url: `${origin}/${org}/${repo}`,
    branch,
    subdir,
    protocol: url.protocol,
    host: url.host,
    pathname: url.pathname,
    ignorePackage,
  };
};

type SolveRepositoryPathOptions = {
  url: string;
  branch?: string;
  subdir?: string;
  offline?: boolean;
  cacheDir?: string;
  refresh?: import("./git.js").RefreshMode;
  refreshAfterHours?: number;
};

const solveRepositoryPath = async ({
  url,
  branch,
  subdir,
  offline,
  cacheDir,
  refresh,
  refreshAfterHours,
}: SolveRepositoryPathOptions) => {
  // targetId includes branch but not subdir, so multiple addons that share a
  // base template (e.g. react-tailwindcss and react-shadcn) deduplicate the
  // git cache directory.
  const targetId = Buffer.from(`${url}#${branch}`).toString("base64");
  const targetWithSubdir = Buffer.from(`${url}#${branch}#${subdir}`).toString(
    "base64",
  );
  const target = path.join(os.homedir(), ".cna", targetWithSubdir);

  // Test helper: allow skipping actual git clone to prevent network / credential prompts
  if (process.env.CNA_SKIP_GIT === "1") {
    return { dir: target, subdir };
  }

  await downloadRepository({
    url,
    branch: branch || "",
    target,
    targetId,
    ...(offline !== undefined ? { offline } : {}),
    ...(cacheDir !== undefined ? { cacheDir } : {}),
    ...(refresh !== undefined ? { refresh } : {}),
    ...(refreshAfterHours !== undefined ? { refreshAfterHours } : {}),
  });

  return { dir: target, subdir };
};

type SolvedTemplatePath = {
  dir: string;
  // subdir can be empty string or undefined
  subdir: string | undefined;
  ignorePackage: boolean | undefined;
};

const solveTemplateOrExtensionPath = async (
  templateOrExtension: string,
  opts?: {
    offline?: boolean;
    cacheDir?: string;
    refresh?: import("./git.js").RefreshMode;
    refreshAfterHours?: number;
  },
): Promise<SolvedTemplatePath> => {
  let parsed: ReturnType<typeof solveValuesFromTemplateOrExtensionUrl>;
  try {
    parsed = solveValuesFromTemplateOrExtensionUrl(templateOrExtension);
  } catch {
    // Fallback to an internal templatesOrExtensions directory (legacy behavior)
    log("Falling back to legacy template path for: %s", templateOrExtension);
    return {
      dir: path.resolve(
        moduleDir,
        "..",
        "templatesOrExtensions",
        templateOrExtension,
      ),
      subdir: undefined,
      ignorePackage: undefined,
    };
  }

  const { url, branch, subdir, protocol, pathname, ignorePackage } = parsed;

  if (protocol === "file:") {
    return { dir: pathname, subdir, ignorePackage };
  }

  const gitData = await solveRepositoryPath({
    url,
    branch,
    subdir,
    ...(opts?.offline !== undefined ? { offline: opts.offline } : {}),
    ...(opts?.cacheDir !== undefined ? { cacheDir: opts.cacheDir } : {}),
    ...(opts?.refresh !== undefined ? { refresh: opts.refresh } : {}),
    ...(opts?.refreshAfterHours !== undefined
      ? { refreshAfterHours: opts.refreshAfterHours }
      : {}),
  });
  return { dir: gitData.dir, subdir: gitData.subdir, ignorePackage };
};

export const getPackagePath = async (
  templateOrExtension: string,
  name = "package",
  ignorePackage = false,
  opts?: {
    offline?: boolean;
    cacheDir?: string;
    refresh?: import("./git.js").RefreshMode;
    refreshAfterHours?: number;
  },
) => {
  const {
    dir,
    subdir,
    ignorePackage: templateOrExtensionIgnorePackage,
  } = await solveTemplateOrExtensionPath(templateOrExtension, opts);

  if (
    name === "package.json" &&
    (ignorePackage || templateOrExtensionIgnorePackage)
  ) {
    throw new Error(
      "package.json should be ignored for file templateOrExtension",
    );
  }

  if (subdir) {
    return path.resolve(dir, subdir, name);
  }

  return path.resolve(dir, name);
};

export type GetTemplatePathOptions = {
  offline?: boolean;
  cacheDir?: string;
  refresh?: import("./git.js").RefreshMode;
  refreshAfterHours?: number;
};

/**
 * Returns the base directory for a template URL — i.e. the directory that
 * CONTAINS the optional `template/` subdirectory. This is where cna.config.json
 * should be placed by template authors.
 */
export const getTemplateBaseDirPath = async (
  templateOrExtensionUrl: string,
  opts?: GetTemplatePathOptions,
): Promise<string> => {
  try {
    const { dir, subdir = "" } = await solveTemplateOrExtensionPath(
      templateOrExtensionUrl,
      opts,
    );
    return path.resolve(dir, subdir);
  } catch {
    return "";
  }
};

export const getTemplateDirPath = async (
  templateOrExtensionUrl: string,
  opts?: GetTemplatePathOptions,
) => {
  const { dir, subdir = "" } = await solveTemplateOrExtensionPath(
    templateOrExtensionUrl,
    opts,
  );
  let templateDirPath = path.resolve(dir, subdir);

  // If `${templateDirPath}/template` is a directory, return it. Otherwise, return `${templateDirPath}`
  const templateDirPathWithTemplate = path.resolve(templateDirPath, "template");

  return new Promise<string>((resolve) => {
    fs.stat(templateDirPathWithTemplate, (_err, stats) => {
      if (_err) {
        resolve(templateDirPath);
        return;
      }

      if (stats.isDirectory()) {
        templateDirPath = templateDirPathWithTemplate;
      }

      resolve(templateDirPath);
    });
  });
};
