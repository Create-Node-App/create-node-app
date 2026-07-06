import os from "os";
import path from "path";
import fs from "fs";
import debug from "debug";
import { simpleGit, type SimpleGit, type CloneOptions } from "simple-git";
import * as fse from "fs-extra";
import { execFileSync } from "child_process";

const log = debug("cna:git");
const metaLog = debug("cna:git:meta");

const formatRepositoryDownloadError = (error: unknown, url: string): string => {
  const message = error instanceof Error ? error.message : String(error);

  if (/not found|404|repository not found/i.test(message)) {
    return [
      `Error: Could not fetch template from '${url}'.`,
      "  → The URL returned HTTP 404 or the repository was not found. Please verify the URL is correct.",
      "  → Run 'npx create-awesome-node-app --list-templates' to see available templates.",
    ].join("\n");
  }

  if (/403|authentication|permission denied|access denied/i.test(message)) {
    return [
      `Error: Could not fetch template from '${url}'.`,
      "  → Access denied (HTTP 403). Check that the repository is public or you have access.",
      "  → Run 'npx create-awesome-node-app --list-templates' to see available templates.",
    ].join("\n");
  }

  if (/ECONNREFUSED|ENOTFOUND|ETIMEDOUT|network/i.test(message)) {
    return [
      `Error: Could not fetch template from '${url}'.`,
      "  → Could not reach the repository. Please check your internet connection.",
      "  → Run 'npx create-awesome-node-app --list-templates' to see available templates.",
    ].join("\n");
  }

  return [
    `Error: Could not fetch template from '${url}'.`,
    `  → ${message}`,
    "  → Run 'npx create-awesome-node-app --list-templates' to see available templates.",
  ].join("\n");
};

/**
 * filter .git folder
 */
const filterGit = (src: string) => {
  return !/(\\|\/)\.git\b/.test(src);
};

export type RefreshMode = "always" | "stale" | "manual";

export type DownloadRepositoryOptions = {
  url?: string;
  target: string;
  cacheDir?: string;
  branch?: string | undefined;
  offline?: boolean;
  targetId?: string;
  refresh?: RefreshMode;
  refreshAfterHours?: number;
};

// Create a Map to store ongoing Git operations
const gitOperationMap = new Map<string, Promise<void>>();

// Create a Map to store completed targetIds
const completedTargetIds = new Map<string, boolean>();

/**
 * Resolve the cache root directory. Honors `CNA_CACHE_DIR` env var and the
 * `cacheDir` option, falling back to `~/.cache/cna/<id>`.
 */
export const resolveCacheDir = (id: string, optsCacheDir?: string): string => {
  let base: string;
  if (optsCacheDir) {
    base = optsCacheDir;
  } else if (process.env.CNA_CACHE_DIR) {
    base = process.env.CNA_CACHE_DIR;
  } else {
    base = path.join(os.homedir(), ".cache", "cna");
  }
  const resolved = path.isAbsolute(base) ? base : path.resolve(base);
  return path.join(resolved, id);
};

const metaSidecarPath = (cacheDir: string): string =>
  path.join(cacheDir, ".cna-meta.json");

export type CacheMeta = {
  lastFetchedAt: string;
  lastCommitSha?: string | undefined;
  lastRefreshReason:
    "clone" | "pull" | "stale-pull" | "manual-pull" | "skipped";
  branch?: string | undefined;
  url?: string | undefined;
};

export const readCacheMeta = (cacheDir: string): CacheMeta | null => {
  try {
    const raw = fs.readFileSync(metaSidecarPath(cacheDir), "utf8");
    const parsed = JSON.parse(raw) as CacheMeta;
    if (typeof parsed.lastFetchedAt !== "string") return null;
    return parsed;
  } catch {
    return null;
  }
};

export const writeCacheMeta = (cacheDir: string, meta: CacheMeta): void => {
  try {
    fs.mkdirSync(cacheDir, { recursive: true });
    fs.writeFileSync(metaSidecarPath(cacheDir), JSON.stringify(meta, null, 2));
    metaLog("wrote %s", metaSidecarPath(cacheDir));
  } catch (err) {
    metaLog("failed to write meta sidecar: %s", err);
  }
};

const removeCacheMeta = (cacheDir: string): void => {
  try {
    fs.unlinkSync(metaSidecarPath(cacheDir));
  } catch {
    // ignore
  }
};

const getCurrentCommitSha = (cacheDir: string): string | undefined => {
  try {
    const out = execFileSync("git", ["rev-parse", "HEAD"], {
      cwd: cacheDir,
      stdio: ["ignore", "pipe", "ignore"],
    });
    return out.toString().trim();
  } catch {
    return undefined;
  }
};

const DEFAULT_REFRESH_AFTER_HOURS = 24;

const resolveRefreshMode = (
  refresh: RefreshMode | undefined,
  offline: boolean,
): RefreshMode => {
  if (offline) return "manual"; // offline implies no network calls
  if (refresh) return refresh;
  // Default: `stale` (was always). This is the new default.
  if (process.env.CNA_REFRESH === "always") return "always";
  if (process.env.CNA_REFRESH === "manual") return "manual";
  return "stale";
};

const resolveRefreshAfterHours = (override?: number): number => {
  if (typeof override === "number" && Number.isFinite(override)) {
    return override;
  }
  const fromEnv = Number.parseFloat(process.env.CNA_REFRESH_AFTER_HOURS ?? "");
  if (Number.isFinite(fromEnv) && fromEnv > 0) {
    return fromEnv;
  }
  return DEFAULT_REFRESH_AFTER_HOURS;
};

const isStale = (meta: CacheMeta | null, thresholdHours: number): boolean => {
  if (!meta) return true;
  const lastFetched = Date.parse(meta.lastFetchedAt);
  if (Number.isNaN(lastFetched)) return true;
  const ageMs = Date.now() - lastFetched;
  return ageMs > thresholdHours * 3600 * 1000;
};

/**
 * Tree-clone with optional reflink/hardlink fallback. The `dest` directory
 * is treated as a target: its existing contents are replaced with the
 * contents of `source`. We achieve that by emptying `dest` first, then
 * copying into it.
 */
const copyTree = async (
  source: string,
  dest: string,
): Promise<"reflink" | "hardlink" | "copy"> => {
  if (path.resolve(source) === path.resolve(dest)) {
    return "copy";
  }
  // Empty the destination first. fs-extra's emptyDir exists but we use
  // a manual implementation to keep dependencies tight.
  if (fs.existsSync(dest)) {
    for (const entry of fs.readdirSync(dest)) {
      fs.rmSync(path.join(dest, entry), { recursive: true, force: true });
    }
  } else {
    fs.mkdirSync(dest, { recursive: true });
  }
  // 1) Try reflink (cp -c) — only on Linux/macOS with FS support.
  if (process.platform !== "win32") {
    try {
      // --no-target-directory treats `dest` as the target itself, not a
      // parent — contents of `source` are copied INTO `dest`.
      execFileSync(
        "cp",
        ["-c", "-R", "--reflink=auto", "--no-target-directory", source, dest],
        { stdio: "ignore" },
      );
      log("copy: reflink ok");
      return "reflink";
    } catch (err) {
      log("reflink failed (%s) — falling back to hardlink", err);
    }
    // 2) Try hardlink (cp -l) — only useful for files; for directories it
    //    creates a tree where leaf files are hardlinks. Falls back to copy.
    try {
      execFileSync("cp", ["-R", "-l", "--no-target-directory", source, dest], {
        stdio: "ignore",
      });
      log("copy: hardlink ok");
      return "hardlink";
    } catch (err) {
      log("hardlink failed (%s) — falling back to recursive copy", err);
    }
  }
  // 3) Fallback: full recursive copy (fse.copy handles nested dirs and
  // overwrites in place).
  await fse.copy(source, dest, { overwrite: true, filter: filterGit });
  log("copy: recursive ok");
  return "copy";
};

/**
 * @param opts options
 * @param opts.url The git repository url.
 * @param opts.targetId The target id. Default is `Buffer.from(`${gitUrl}@${branch}`).toString("base64")`
 * @param opts.target The target folder.
 * @param opts.cacheDir? Default `~/.cache/cna/${name}`, the folder
 * @param opts.branch? Default 'main'. Git branch.
 * @param opts.offline? use cached files, and don't update.
 * @param opts.refresh? one of "always" | "stale" | "manual". Default: "stale".
 * @param opts.refreshAfterHours? override the staleness threshold (default 24).
 */
export const downloadRepository = async ({
  url = "",
  offline = false,
  target = "./",
  branch = "main",
  targetId,
  cacheDir: optsCacheDir,
  refresh,
  refreshAfterHours,
}: DownloadRepositoryOptions) => {
  const absoluteTarget = path.isAbsolute(target)
    ? target
    : path.resolve(target);
  const targetExistedBefore = fs.existsSync(absoluteTarget);

  const isGithub = /^[^/]+\/[^/]+$/.test(url);
  const gitUrl = isGithub ? `https://github.com/${url}` : url;
  const id = targetId || Buffer.from(`${gitUrl}@${branch}`).toString("base64");
  const cacheDir = resolveCacheDir(id, optsCacheDir);

  log("cache folder: %s", cacheDir);

  const refreshMode = resolveRefreshMode(refresh, offline);
  const thresholdHours = resolveRefreshAfterHours(refreshAfterHours);

  // Check if the targetId has already been completed (checkout done)
  if (completedTargetIds.has(id)) {
    log(
      `Git checkout for target ID '${id}' has already been completed. Skipping.`,
    );
    await copyTree(cacheDir, absoluteTarget);
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
      const cached =
        fs.existsSync(cacheDir) && fs.existsSync(path.join(cacheDir, ".git"));
      let didRefresh = false;
      let refreshReason: CacheMeta["lastRefreshReason"] = "clone";

      if (!cached) {
        if (offline) {
          throw new Error(
            `Cache miss and --offline: no cached copy of '${gitUrl}@${branch}' at ${cacheDir}.`,
          );
        }
        log("Cloning repository...");
        await git.clone(gitUrl, cacheDir, cloneOptions);
        refreshReason = "clone";
        didRefresh = true;
      } else {
        // Cache hit: decide whether to pull.
        const meta = readCacheMeta(cacheDir);
        const shouldPull =
          refreshMode === "always" ||
          (refreshMode === "stale" && isStale(meta, thresholdHours));

        if (offline) {
          log("cache hit (offline) — skipping pull");
          refreshReason = "skipped";
        } else if (!shouldPull) {
          log("cache hit (fresh) — skipping pull");
          refreshReason = "skipped";
        } else {
          log("Refreshing repository (mode=%s)...", refreshMode);
          git = simpleGit(cacheDir);
          await git.checkout(["-f", branch]);
          await git.pull();
          refreshReason =
            refreshMode === "stale" ? "stale-pull" : "manual-pull";
          didRefresh = true;
        }
      }

      await copyTree(cacheDir, absoluteTarget);

      if (didRefresh) {
        const sha = getCurrentCommitSha(cacheDir);
        const meta: CacheMeta = {
          lastFetchedAt: new Date().toISOString(),
          lastRefreshReason: refreshReason,
          branch,
          url: gitUrl,
        };
        if (sha) meta.lastCommitSha = sha;
        writeCacheMeta(cacheDir, meta);
      }

      // Mark the targetId as completed
      completedTargetIds.set(id, true);
    } catch (error) {
      if (!targetExistedBefore && fs.existsSync(absoluteTarget)) {
        try {
          fse.removeSync(absoluteTarget);
          log("Cleaned up partially created directory: %s", absoluteTarget);
        } catch (cleanupErr) {
          log("Failed to clean up directory: %s", cleanupErr);
        }
      }
      // If the cache itself is corrupt, drop the meta sidecar so the next
      // run can recover cleanly.
      if (
        error instanceof Error &&
        /not a git repository|fatal: not/.test(error.message)
      ) {
        removeCacheMeta(cacheDir);
      }
      throw new Error(formatRepositoryDownloadError(error, gitUrl));
    } finally {
      // Remove the promise from the map when the operation is complete
      gitOperationMap.delete(id);
    }
  })();

  gitOperationMap.set(id, gitOperationPromise);

  // Wait for the Git operation to complete
  await gitOperationPromise;
};

// Test-only: reset the in-process maps.
export const __resetGitStateForTests = () => {
  gitOperationMap.clear();
  completedTargetIds.clear();
};
