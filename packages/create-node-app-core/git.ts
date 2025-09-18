import os from "os";
import path from "path";
import fs from "fs";
import debug from "debug";
import { simpleGit, type SimpleGit, type CloneOptions } from "simple-git";
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
  branch?: string | undefined;
  offline?: boolean;
  targetId?: string;
};

// Create a Map to store ongoing Git operations
const gitOperationMap = new Map<string, Promise<void>>();

// Create a Map to store completed targetIds
const completedTargetIds = new Map<string, boolean>();

/**
 * @param opts options
 * @param opts.url The git repository url.
 * @param opts.targetId The target id. Default is `Buffer.from(`${gitUrl}@${branch}`).toString("base64")`
 * @param opts.target The target folder.
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

  // Check if the targetId has already been completed (checkout done)
  if (completedTargetIds.has(id)) {
    log(
      `Git checkout for target ID '${id}' has already been completed. Skipping.`,
    );
    // Use fs-extra's copy method with filter
    await fse.copy(cacheDir, absoluteTarget, {
      overwrite: true,
      filter: filterGit,
    });
    return;
  }

  // Check if there is an ongoing Git operation with the same target ID
  if (gitOperationMap.has(id)) {
    log(
      `Git operation for target ID '${id}' is already in progress. Waiting...`,
    );
    await gitOperationMap.get(id);
    log(`Git operation for target ID '${id}' has completed.`);
    return;
  }

  // Create a new promise for the Git operation and store it in the map
  const gitOperationPromise = (async () => {
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

      // Mark the targetId as completed
      completedTargetIds.set(id, true);
    } catch (error) {
      console.error("Error during repository download:", error);
    } finally {
      // Remove the promise from the map when the operation is complete
      gitOperationMap.delete(id);
    }
  })();

  gitOperationMap.set(id, gitOperationPromise);

  // Wait for the Git operation to complete
  await gitOperationPromise;
};
