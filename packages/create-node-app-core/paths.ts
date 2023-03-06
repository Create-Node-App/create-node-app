import fs from "fs-extra";
import os from "os";
import path from "path";
import { downloadRepository } from "./git";

/**
 * solveValuesFromAddonUrl solves values from addon url
 * @param addon - addon url
 *
 * @example
 * solveValuesFromAddonUrl("https://github.com/username/repo")
 * // => { branch: "", subdir: "", protocol: "https:", host: "github.com", pathname: "/username/repo", ignorePackageJson: false
 *
 * solveValuesFromAddonUrl("https://github.com/username/repo/tree/main/examples/express?ignorePackage=true")
 * // => { branch: "main", subdir: "examples/express", protocol: "https:", host: "github.com", pathname: "/username/repo", ignorePackageJson: true
 */
const solveValuesFromAddonUrl = (addon: string) => {
  const url = new URL(addon);
  const origin = `${url.protocol}//${url.host}`;
  // parse branch and subdir from pathname
  const [pathname, _, branch, ...subdir] = url.pathname.split("/");

  // parse ignorePackageJson from searchParams
  const ignorePackage = url.searchParams.get("ignorePackage") === "true";

  return {
    url: `${origin}/${pathname}`,
    branch,
    subdir: subdir.join("/"),
    protocol: url.protocol,
    host: url.host,
    pathname,
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
  const targetId = Buffer.from(`${url}#${branch}#${subdir}`).toString("base64");
  const target = path.join(os.homedir(), ".cna", targetId);
  try {
    await downloadRepository({
      git: url,
      branch,
      target,
      targetId,
    });
  } catch {
    // ignore git error
  }
  return { dir: target, subdir };
};

const solveAddonPath = async (addon: string) => {
  try {
    const { url, branch, subdir, protocol, host, pathname, ignorePackage } =
      solveValuesFromAddonUrl(addon);

    if (protocol === "file:") {
      return {
        dir: path.resolve(host, pathname),
        subdir,
      };
    }
    const gitData = await solveRepositoryPath({
      url,
      branch,
      subdir,
    });
    return { ...gitData, ignorePackage };
  } catch {
    // failed solving file/http/ssh/... url
    return {
      dir: path.resolve(__dirname, "..", "addons", addon),
      ignorePackage: undefined,
    };
  }
};

export const getAddonPackagePath = async (
  addon: string,
  name = "package",
  ignorePackage = false
) => {
  const {
    dir,
    subdir,
    ignorePackage: addonIgnorePackage,
  } = await solveAddonPath(addon);
  if (name === "package.json" && (ignorePackage || addonIgnorePackage)) {
    throw new Error("package.json should be ignored for file addon");
  }
  if (subdir) {
    return path.resolve(dir, subdir, name);
  }
  return path.resolve(dir, name);
};

export const getAddonTemplateDirPath = async (addonUrl: string) => {
  const { dir, subdir = "" } = await solveAddonPath(addonUrl);

  let templateDirPath = path.resolve(dir, subdir);

  // if `${templateDirPath}/template` is a directory, return it
  // otherwise, return `${templateDirPath}`
  const templateDirPathWithTemplate = path.resolve(templateDirPath, "template");
  if ((await fs.stat(templateDirPathWithTemplate)).isDirectory()) {
    templateDirPath = templateDirPathWithTemplate;
  }

  return templateDirPath;
};
