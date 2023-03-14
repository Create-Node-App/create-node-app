import fs from "fs";
import os from "os";
import path from "path";
import { downloadRepository } from "./git";

/**
 * solveValuesFromTemplateOrExtensionUrl solves values from templateorextension url
 * @param templateorextension - templateorextension url
 *
 * @example
 * solveValuesFromTemplateOrExtensionUrl("https://github.com/username/repo")
 * // => { branch: "", subdir: "", protocol: "https:", host: "github.com", pathname: "/username/repo", ignorePackageJson: false
 *
 * solveValuesFromTemplateOrExtensionUrl("https://github.com/username/repo/tree/main/examples/express?ignorePackage=true")
 * // => { branch: "main", subdir: "examples/express", protocol: "https:", host: "github.com", pathname: "/username/repo", ignorePackageJson: true
 */
const solveValuesFromTemplateOrExtensionUrl = (templateorextension: string) => {
  const url = new URL(templateorextension);
  const origin = `${url.protocol}//${url.host}`;
  const [org, repo, , branch = "", ...subdir] = url.pathname
    .slice(1)
    .split("/");

  // parse ignorePackageJson from searchParams
  const ignorePackage = url.searchParams.get("ignorePackage") === "true";

  return {
    url: `${origin}/${org}/${repo}`,
    branch,
    subdir: subdir.join("/"),
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

const solveTemplateOrExtensionPath = async (templateorextension: string) => {
  try {
    const { url, branch, subdir, protocol, host, pathname, ignorePackage } =
      solveValuesFromTemplateOrExtensionUrl(templateorextension);

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
      dir: path.resolve(
        __dirname,
        "..",
        "templatesorextensions",
        templateorextension
      ),
      ignorePackage: undefined,
    };
  }
};

export const getPackagePath = async (
  templateorextension: string,
  name = "package",
  ignorePackage = false
) => {
  const {
    dir,
    subdir,
    ignorePackage: templateorextensionIgnorePackage,
  } = await solveTemplateOrExtensionPath(templateorextension);
  if (
    name === "package.json" &&
    (ignorePackage || templateorextensionIgnorePackage)
  ) {
    throw new Error(
      "package.json should be ignored for file templateorextension"
    );
  }
  if (subdir) {
    return path.resolve(dir, subdir, name);
  }
  return path.resolve(dir, name);
};

export const getTemplateDirPath = async (templateorextensionUrl: string) => {
  const { dir, subdir = "" } = await solveTemplateOrExtensionPath(
    templateorextensionUrl
  );

  let templateDirPath = path.resolve(dir, subdir);

  // if `${templateDirPath}/template` is a directory, return it
  // otherwise, return `${templateDirPath}`
  const templateDirPathWithTemplate = path.resolve(templateDirPath, "template");

  return new Promise<string>((resolve, reject) => {
    fs.stat(templateDirPathWithTemplate, (err, stats) => {
      if (err) {
        return reject(err);
      }
      if (stats.isDirectory()) {
        templateDirPath = templateDirPathWithTemplate;
      }
      resolve(templateDirPath);
    });
  });
};
