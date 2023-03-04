import os from "os";
import childProcess from "child_process";
import path from "path";
import { promisify } from "util";
import fs from "fs-extra";
import download from "download";
import debug from "debug";

const log = debug("cna:git");

const exec = promisify(childProcess.exec);

/**
 * filter .git folder
 */
const filterGit = (src: string) => {
  return !/(\\|\/)\.git\b/.test(src);
};

/**
 *
 * @param git - git repository src
 * @param target - the target git clone to
 * @param branch - git branch
 */
const clone = (git: string, target: string, branch: string) => {
  const command = ["git", "clone", "--depth=1", "-b", branch, git, target];
  return exec(command.join(" "));
};

/**
 * git pull
 *
 * @param cwd - the target git pull to
 */
const pull = async (cwd: string) => {
  await exec("git checkout -f", { cwd });
  await exec("git pull", { cwd });
};

export type DownloadRepositoryOptions = {
  git: string;
  target: string;
  cacheDir?: string;
  branch?: string;
  way?: "git" | "zip";
  zip?: string;
  offline?: boolean;
  targetId?: string;
};

/**
 * @todo add options.filter
 *
 * @param opts options
 * @param opts.git Git repository url. If it is a github repo, only
 * type '<username>/<repo>'.
 * @param opts.target The folder of generating to.
 * @param opts.cacheDir? Default `~/.cache/cna/${name}`, the folder
 * @param opts.branch? Default 'main'. Git branch.
 * @param opts.way? The way of install git, only 'git' or 'zip'.
 * to keep cache.
 * @param opts.zip? Zip downloading url. If opt.git is a github
 * repository, this option is unnecessary.
 * @param opts.offline? use cached files, and don't update.
 */
export const downloadRepository = async ({
  git,
  zip,
  offline = false,
  target = "./",
  branch = "main",
  way = "git",
  targetId,
  cacheDir: optsCacheDir,
}: DownloadRepositoryOptions) => {
  const absoluteTarget = path.isAbsolute(target)
    ? target
    : path.resolve(target);
  const isGithub = /^[^/]+\/[^/]+$/.test(git);
  const gitUrl = isGithub ? `https://github.com/${git}` : git;
  const zipUrl = isGithub
    ? `https://github.com/${git}/archive/${branch}.zip`
    : zip;
  const id = targetId || Buffer.from(`${git}@${branch}`).toString("base64");
  let cacheDir = optsCacheDir || path.join(os.homedir(), ".cache", "cna", id);

  cacheDir = path.isAbsolute(cacheDir) ? cacheDir : path.resolve(cacheDir);

  log("cache folder: %s", cacheDir);
  log("git url: %s", gitUrl);
  log("zip url: %s", zipUrl);

  const cached = fs.existsSync(cacheDir);

  /**
   * opts.way === 'git'
   */
  const createByGit = async () => {
    log("git mode");

    if (!cached) {
      await clone(gitUrl, cacheDir, branch);
    }

    if (offline) {
      fs.copySync(cacheDir, absoluteTarget, { filter: filterGit });
      return;
    }

    await pull(cacheDir);
    setTimeout(() => {}, 400);
    fs.copySync(cacheDir, absoluteTarget, { filter: filterGit });
  };

  /**
   * opts.way === 'zip'
   * It will never use cached files, opts.cached & opts.offline will be Invalid.
   */
  const createByZip = async () => {
    log("zip mode");
    await download(zipUrl, target, { extract: true });
  };

  switch (way) {
    case "git":
      return createByGit();
    case "zip":
      return createByZip();
    default:
      throw new Error(`Expect parameter opts.way is 'git' or 'zip'`);
  }
};
