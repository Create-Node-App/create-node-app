import os from "os";
import childProcess from "child_process";
import path from "path";
import { promisify } from "util";
import fs from "fs";
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
  url?: string;
  target: string;
  cacheDir?: string;
  branch?: string;
  offline?: boolean;
  targetId?: string;
};

/**
 * @todo add options.filter
 *
 * @param opts options
 * @param opts.url The git repository url.
 * @param opts.target The folder of generating to.
 * @param opts.cacheDir? Default `~/.cache/cna/${name}`, the folder
 * @param opts.branch? Default 'main'. Git branch.
 * @param opts.offline? use cached files, and don't update.
 */
export const downloadRepository = async ({
  url = "",
  offline = false,
  target = "./",
  branch = "main",
  targetId,
  cacheDir: optsCacheDir,
}: DownloadRepositoryOptions) => {
  const absoluteTarget = path.isAbsolute(target)
    ? target
    : path.resolve(target);

  const isGithub = /^[^/]+\/[^/]+$/.test(url);
  const gitUrl = isGithub ? `https://github.com/${url}` : url;
  const id = targetId || Buffer.from(`${gitUrl}@${branch}`).toString("base64");
  let cacheDir = optsCacheDir || path.join(os.homedir(), ".cache", "cna", id);

  cacheDir = path.isAbsolute(cacheDir) ? cacheDir : path.resolve(cacheDir);

  log("cache folder: %s", cacheDir);

  const cached = fs.existsSync(cacheDir);

  if (!cached) {
    await clone(gitUrl, cacheDir, branch);
  }

  if (offline) {
    fs.cpSync(cacheDir, absoluteTarget, {
      force: true,
      filter: filterGit,
      recursive: true,
    });
    return;
  }

  await pull(cacheDir);
  setTimeout(() => {
    fs.cpSync(cacheDir, absoluteTarget, {
      force: true,
      filter: filterGit,
      recursive: true,
    });
  }, 400);
};
