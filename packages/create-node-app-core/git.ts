import os from "os";
import path from "path";
import fs from "fs";
import debug from "debug";
import simpleGit, { SimpleGit, CloneOptions } from "simple-git";
import * as fse from "fs-extra"; // Import fs-extra for advanced file operations

const log = debug("cna:git");

/**
 * filter .git folder
 */
const filterGit = (src: string) => {
  return !/(\\|\/)\.git\b/.test(src);
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

  let git: SimpleGit = simpleGit();
  const cloneOptions: CloneOptions = {
    "--depth": 1,
    "--branch": branch,
    "--single-branch": null,
    "--no-tags": null,
  };

  try {
    const cached = fs.existsSync(cacheDir);

    if (!cached) {
      log("Cloning repository...");
      await git.clone(gitUrl, cacheDir, cloneOptions);
    }

    git = simpleGit(cacheDir);

    if (!offline) {
      log("Pulling repository...");
      await git.checkout(["-f", branch]);
      await git.pull();
    }

    // Use fs-extra's copy method with filter
    await fse.copy(cacheDir, absoluteTarget, {
      overwrite: true,
      filter: filterGit,
    });
  } catch (error) {
    console.error("Error during repository download:", error);
  }
};
