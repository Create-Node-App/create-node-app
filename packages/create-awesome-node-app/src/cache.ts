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

export type WriteMetaOptions = {
  lastFetchedAt: string;
  lastCommitSha?: string;
  lastRefreshReason: string;
  branch?: string;
  url?: string;
};

/**
 * Write a .cna-meta.json sidecar for a cache entry.
 */
export const writeMetaSidecar = async (
  entryPath: string,
  meta: WriteMetaOptions,
): Promise<void> => {
  const metaPath = path.join(entryPath, ".cna-meta.json");
  await writeFile(metaPath, JSON.stringify(meta, null, 2), "utf8");
};

export type RemoteTipResult = {
  id: string;
  url?: string;
  branch?: string;
  localSha?: string;
  remoteSha?: string;
  behind: boolean;
  error?: string;
};

/**
 * Fetch the remote tip SHA for a cached entry via `git ls-remote`.
 * Returns the SHA on success, or undefined if the remote is unreachable.
 */
const getRemoteTipSha = (gitUrl: string, ref: string): string | undefined => {
  try {
    const out = execFileSync(
      "git",
      ["ls-remote", gitUrl, ref],
      { stdio: ["ignore", "pipe", "ignore"], timeout: 15_000 },
    );
    const firstLine = out.toString().trim().split("\n")[0];
    return firstLine ? firstLine.split(/\s+/)[0] : undefined;
  } catch {
    return undefined;
  }
};

/**
 * For each cached entry, compare local tip against the remote.
 */
export const checkOutdated = async (): Promise<RemoteTipResult[]> => {
  const entries = await listCacheEntries();
  const results: RemoteTipResult[] = [];

  for (const entry of entries) {
    if (!entry.url || !entry.branch) {
      results.push({
        id: entry.id,
        behind: false,
        error: !entry.url ? "no remote URL in meta" : "no branch in meta",
      } as RemoteTipResult);
      continue;
    }
    const remoteSha = getRemoteTipSha(entry.url, entry.branch);
    if (!remoteSha) {
      results.push({
        id: entry.id,
        behind: false,
        error: "unable to fetch remote tip",
      } as RemoteTipResult);
      continue;
    }
    results.push({
      id: entry.id,
      localSha: entry.lastCommitSha,
      remoteSha,
      behind: Boolean(
        entry.lastCommitSha &&
          remoteSha !== entry.lastCommitSha,
      ),
    } as RemoteTipResult);
  }

  return results;
};

/**
 * Results from `cache doctor`.
 */
export type DoctorResult = {
  check: string;
  ok: boolean;
  detail?: string;
};

/**
 * Run health checks: git availability, network, cache dir, registry.
 */
export const runDoctor = async (): Promise<DoctorResult[]> => {
  const results: DoctorResult[] = [];

  // 1) git availability
  try {
    const out = execFileSync("git", ["--version"], {
      stdio: ["ignore", "pipe", "ignore"],
    });
    results.push({
      check: "git",
      ok: true,
      detail: out.toString().trim(),
    });
  } catch {
    results.push({
      check: "git",
      ok: false,
      detail: "git not found on PATH",
    });
  }

  // 2) Network
  try {
    const resp = await fetch("https://registry.npmjs.org/", {
      signal: AbortSignal.timeout(10_000),
    });
    if (resp.ok) {
      results.push({ check: "network", ok: true, detail: "npm registry reachable" });
    } else {
      results.push({ check: "network", ok: false, detail: `HTTP ${resp.status}` });
    }
  } catch (err) {
    results.push({
      check: "network",
      ok: false,
      detail: err instanceof Error ? err.message : String(err),
    });
  }

  // 3) Cache dir writability
  const root = getCacheRoot();
  try {
    await mkdir(root, { recursive: true });
    const probe = path.join(root, ".doctor-probe");
    await writeFile(probe, "ok", "utf8");
    await rm(probe, { force: true });
    results.push({ check: "cache-dir", ok: true, detail: root });
  } catch (err) {
    results.push({
      check: "cache-dir",
      ok: false,
      detail: err instanceof Error ? err.message : String(err),
    });
  }

  // 4) Cache entries integrity
  const entries = await listCacheEntries();
  const corrupt = entries.filter((e) => !runGitFsck(e.path));
  if (corrupt.length === 0) {
    results.push({
      check: "cache-integrity",
      ok: true,
      detail: `${entries.length} entries, all clean`,
    });
  } else {
    results.push({
      check: "cache-integrity",
      ok: false,
      detail: `${corrupt.length}/${entries.length} entries failed git fsck: ${corrupt.map((e) => e.id).join(", ")}`,
    });
  }

  return results;
};
