import fs from "fs";
import os from "os";
import path from "path";
import { downloadRepository } from "./git.js";

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
 */
const solveValuesFromTemplateOrExtensionUrl = (templateOrExtension: string) => {
  const url = new URL(templateOrExtension);
  const ignorePackage = url.searchParams.get("ignorePackage") === "true";

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
      branch: "",
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
};

const solveRepositoryPath = async ({
  url,
  branch,
  subdir,
}: SolveRepositoryPathOptions) => {
  const targetId = Buffer.from(`${url}#${branch}`).toString("base64");
  const targetWithSubdir = Buffer.from(`${url}#${branch}#${subdir}`).toString(
    "base64",
  );
  const target = path.join(os.homedir(), ".cna", targetWithSubdir);

  // Test helper: allow skipping actual git clone to prevent network / credential prompts
  if (process.env.CNA_SKIP_GIT === "1") {
    return { dir: target, subdir };
  }

  try {
    await downloadRepository({
      url,
      branch: branch || "",
      target,
      targetId,
    });
  } catch {
    // Ignore git error
  }

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
): Promise<SolvedTemplatePath> => {
  try {
    const { url, branch, subdir, protocol, pathname, ignorePackage } =
      solveValuesFromTemplateOrExtensionUrl(templateOrExtension);

    if (protocol === "file:") {
      // Already parsed absolute path in pathname
      const baseDir = pathname;
      return { dir: baseDir, subdir, ignorePackage };
    }

    const gitData = await solveRepositoryPath({ url, branch, subdir });
    return { dir: gitData.dir, subdir: gitData.subdir, ignorePackage };
  } catch {
    // Fallback to an internal templatesOrExtensions directory (legacy behaviour)
    return {
      dir: path.resolve(
        __dirname,
        "..",
        "templatesOrExtensions",
        templateOrExtension,
      ),
      subdir: undefined,
      ignorePackage: undefined,
    };
  }
};

export const getPackagePath = async (
  templateOrExtension: string,
  name = "package",
  ignorePackage = false,
) => {
  const {
    dir,
    subdir,
    ignorePackage: templateOrExtensionIgnorePackage,
  } = await solveTemplateOrExtensionPath(templateOrExtension);

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

export const getTemplateDirPath = async (templateOrExtensionUrl: string) => {
  const { dir, subdir = "" } = await solveTemplateOrExtensionPath(
    templateOrExtensionUrl,
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
