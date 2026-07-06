import fs from "fs";
import os from "os";
import path from "path";
import { execFileSync } from "child_process";
import { readFile, writeFile, mkdir, rm } from "fs/promises";

/**
 * Resolve the cache root directory. Honors `CNA_CACHE_DIR` env var.
 */
export const getCacheRoot = (): string => {
  const override = process.env.CNA_CACHE_DIR;
  if (override && override.length > 0) {
    return path.isAbsolute(override) ? override : path.resolve(override);
  }
  return path.join(os.homedir(), ".cache", "cna");
};

export type CacheEntryMeta = {
  /** base64-of-<gitUrl>@<branch> (targetId from downloadRepository) */
  id: string;
  /** absolute path to the cache directory on disk */
  path: string;
  /** last fetch timestamp (ISO), if .cna-meta.json is present */
  lastFetchedAt?: string | undefined;
  /** last commit SHA, if recorded */
  lastCommitSha?: string | undefined;
  /** reason for the last refresh */
  lastRefreshReason?: string | undefined;
  /** branch recorded in the meta sidecar */
  branch?: string | undefined;
  /** upstream URL recorded in the meta sidecar */
  url?: string | undefined;
  /** approximate size of the entry in bytes (sum of file sizes) */
  sizeBytes?: number | undefined;
  /** whether `git fsck` reports the entry as clean */
  fsckOk?: boolean | undefined;
};

type ReadMetaResult = {
  lastFetchedAt?: string | undefined;
  lastCommitSha?: string | undefined;
  lastRefreshReason?: string | undefined;
  branch?: string | undefined;
  url?: string | undefined;
};

const readMetaSidecar = async (entryPath: string): Promise<ReadMetaResult> => {
  const metaPath = path.join(entryPath, ".cna-meta.json");
  try {
    const raw = await readFile(metaPath, "utf8");
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    return {
      lastFetchedAt:
        typeof parsed.lastFetchedAt === "string"
          ? parsed.lastFetchedAt
          : undefined,
      lastCommitSha:
        typeof parsed.lastCommitSha === "string"
          ? parsed.lastCommitSha
          : undefined,
      lastRefreshReason:
        typeof parsed.lastRefreshReason === "string"
          ? parsed.lastRefreshReason
          : undefined,
      branch: typeof parsed.branch === "string" ? parsed.branch : undefined,
      url: typeof parsed.url === "string" ? parsed.url : undefined,
    };
  } catch {
    return {};
  }
};

const dirSize = (dir: string): number => {
  let total = 0;
  const stack: string[] = [dir];
  while (stack.length > 0) {
    const current = stack.pop() as string;
    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(current, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const entry of entries) {
      const entryPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(entryPath);
      } else if (entry.isFile()) {
        try {
          total += fs.statSync(entryPath).size;
        } catch {
          // ignore unreadable
        }
      }
    }
  }
  return total;
};

const runGitFsck = (entryPath: string): boolean => {
  try {
    execFileSync("git", ["fsck", "--no-progress"], {
      cwd: entryPath,
      stdio: ["ignore", "ignore", "ignore"],
    });
    return true;
  } catch {
    return false;
  }
};

export const listCacheEntries = async (): Promise<CacheEntryMeta[]> => {
  const root = getCacheRoot();
  if (!fs.existsSync(root)) return [];
  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(root, { withFileTypes: true });
  } catch {
    return [];
  }
  const out: CacheEntryMeta[] = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const entryPath = path.join(root, entry.name);
    // Skip the catalog subdirectory (managed by templates.ts).
    if (entry.name === "catalog") continue;
    const meta = await readMetaSidecar(entryPath);
    out.push({
      id: entry.name,
      path: entryPath,
      ...meta,
      sizeBytes: dirSize(entryPath),
    });
  }
  return out;
};

export const cleanCache = async (
  id?: string,
): Promise<{
  removed: string[];
  notFound: string[];
}> => {
  const root = getCacheRoot();
  if (id) {
    const target = path.join(root, id);
    if (!fs.existsSync(target)) {
      return { removed: [], notFound: [id] };
    }
    await rm(target, { recursive: true, force: true });
    return { removed: [target], notFound: [] };
  }
  if (!fs.existsSync(root)) {
    return { removed: [], notFound: [] };
  }
  const removed: string[] = [];
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const target = path.join(root, entry.name);
    await rm(target, { recursive: true, force: true });
    removed.push(target);
  }
  return { removed, notFound: [] };
};

export const verifyCache = async (id?: string): Promise<CacheEntryMeta[]> => {
  const entries = await listCacheEntries();
  const target = id ? entries.filter((e) => e.id === id) : entries;
  return target.map((entry) => ({
    ...entry,
    fsckOk: runGitFsck(entry.path),
  }));
};

/**
 * Persist the template catalog to the on-disk cache. Used by templates.ts
 * so that a `cache list` shows the catalog timestamp too.
 */
export const writeCatalogToCache = async (
  data: unknown,
  cacheFile: string,
): Promise<void> => {
  await mkdir(path.dirname(cacheFile), { recursive: true });
  await writeFile(cacheFile, JSON.stringify(data), "utf8");
};

/**
 * Remove the on-disk catalog cache. Used by `cna cache clean --catalog`
 * and by tests.
 */
export const removeCatalogCache = async (cacheFile: string): Promise<void> => {
  await rm(cacheFile, { force: true });
};
