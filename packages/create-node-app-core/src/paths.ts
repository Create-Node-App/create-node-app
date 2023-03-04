import os from "os";
import path from "path";
import { downloadRepository } from "./git";

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
    const url = new URL(addon);
    const branch = url.searchParams.get("branch") ?? "";
    const subdir = url.searchParams.get("subdir") ?? "";
    const templateDirName = url.searchParams.get("templatedir");
    const ignorePackage = url.searchParams.get("ignorePackage") === "true";
    if (url.protocol === "file:") {
      return {
        dir: path.resolve(url.host, url.pathname),
        subdir,
        templateDirName,
      };
    }
    const urlWithoutParams = `${url.origin}${url.pathname}`;
    const gitData = await solveRepositoryPath({
      url: urlWithoutParams,
      branch,
      subdir,
    });
    return { ...gitData, templateDirName, ignorePackage };
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

export const getAddonTemplateDirPath = async (
  addon: string,
  templateDirName = ""
) => {
  const {
    dir,
    subdir,
    templateDirName: addonTemplateDirName,
  } = await solveAddonPath(addon);
  const safeDirName = addonTemplateDirName ?? (templateDirName || "");
  if (subdir) {
    return path.resolve(dir, subdir, safeDirName);
  }
  return path.resolve(dir, safeDirName);
};
