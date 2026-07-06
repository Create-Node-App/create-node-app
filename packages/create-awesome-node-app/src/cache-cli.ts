import pc from "picocolors";
import {
  checkOutdated,
  cleanCache,
  getCacheRoot,
  listCacheEntries,
  runDoctor,
  verifyCache,
  writeMetaSidecar,
  type RemoteTipResult,
} from "./cache.js";
import { getCatalogCacheFilePath } from "./templates.js";
import { simpleGit } from "simple-git";
import { existsSync, rmSync } from "fs";

const formatBytes = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024)
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
};

const formatAge = (iso: string | undefined): string => {
  if (!iso) return pc.dim("—");
  const ms = Date.now() - Date.parse(iso);
  if (Number.isNaN(ms)) return pc.dim("?");
  const minutes = Math.floor(ms / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

const shortSha = (sha: string | undefined): string => {
  if (!sha) return pc.dim("—");
  return sha.slice(0, 7);
};

export const cacheDir = (): void => {
  console.log(getCacheRoot());
};

export const cacheList = async (): Promise<void> => {
  const entries = await listCacheEntries();
  if (entries.length === 0) {
    console.log(pc.dim("No cached templates or extensions."));
    console.log(
      pc.dim(
        `Cache root: ${getCacheRoot()}\nRun 'npx create-awesome-node-app my-app -t <template>' to populate it.`,
      ),
    );
    return;
  }
  const idWidth = Math.max(2, ...entries.map((e) => e.id.length));
  console.log(
    [
      "ID".padEnd(idWidth),
      pc.dim("URL".padEnd(50)),
      pc.dim("BRANCH".padEnd(8)),
      pc.dim("LAST FETCHED".padEnd(14)),
      pc.dim("SHA".padEnd(8)),
      pc.dim("SIZE"),
    ].join("  "),
  );
  for (const entry of entries) {
    console.log(
      [
        pc.cyan(entry.id),
        pc.dim((entry.url ?? "—").padEnd(50).slice(0, 50)),
        pc.dim((entry.branch ?? "—").padEnd(8)),
        pc.dim(formatAge(entry.lastFetchedAt).padEnd(14)),
        pc.dim(shortSha(entry.lastCommitSha)),
        pc.dim(formatBytes(entry.sizeBytes ?? 0)),
      ].join("  "),
    );
  }
  console.log(pc.dim(`\nCache root: ${getCacheRoot()}`));
};

export const cacheClean = async (
  id?: string,
  options: { catalog?: boolean } = {},
): Promise<void> => {
  if (options.catalog) {
    const file = getCatalogCacheFilePath();
    if (existsSync(file)) {
      rmSync(file);
      console.log(pc.green(`✓ Removed catalog cache: ${file}`));
    } else {
      console.log(pc.dim("No catalog cache to remove."));
    }
    return;
  }
  if (id) {
    const result = await cleanCache(id);
    if (result.notFound.length > 0) {
      console.log(pc.yellow(`No cache entry found for id: ${id}`));
      return;
    }
    for (const p of result.removed) {
      console.log(pc.green(`✓ Removed ${p}`));
    }
    return;
  }
  const result = await cleanCache();
  if (result.removed.length === 0) {
    console.log(pc.dim("Nothing to remove."));
  } else {
    for (const p of result.removed) {
      console.log(pc.green(`✓ Removed ${p}`));
    }
  }
};

export const cacheVerify = async (id?: string): Promise<number> => {
  const results = await verifyCache(id);
  if (results.length === 0) {
    console.log(pc.dim("No cached entries."));
    return 0;
  }
  let allOk = true;
  for (const entry of results) {
    const ok = entry.fsckOk;
    if (!ok) allOk = false;
    console.log(
      `${ok ? pc.green("✓") : pc.red("✗")} ${pc.cyan(entry.id)}  ${pc.dim(entry.url ?? "—")}`,
    );
  }
  if (!allOk) {
    console.log();
    console.log(
      pc.red(
        "Some entries failed git fsck. Consider 'cna cache clean' and re-run.",
      ),
    );
    return 1;
  }
  return 0;
};

const renderOutdatedRow = (r: RemoteTipResult, idWidth: number): void => {
  if (r.error) {
    console.log(
      `${pc.dim("?")} ${pc.cyan(r.id.padEnd(idWidth))}  ${pc.dim(r.error)}`,
    );
    return;
  }
  const icon = r.behind ? pc.yellow("▼") : pc.green("✓");
  const local = r.localSha ? r.localSha.slice(0, 7) : pc.dim("—");
  const remote = r.remoteSha ? r.remoteSha.slice(0, 7) : pc.dim("—");
  console.log(
    `${icon} ${pc.cyan(r.id.padEnd(idWidth))}  local=${local}  remote=${remote}`,
  );
};

export const cacheOutdated = async (): Promise<void> => {
  const results = await checkOutdated();
  if (results.length === 0) {
    console.log(pc.dim("No cached entries to check."));
    return;
  }
  const idWidth = Math.max(2, ...results.map((r) => r.id.length));
  for (const r of results) {
    renderOutdatedRow(r, idWidth);
  }
  const behind = results.filter((r) => r.behind).length;
  if (behind > 0) {
    console.log(
      pc.yellow(`\n${behind} entr${behind === 1 ? "y is" : "ies are"} behind remote. Run 'cna cache update [id]' to refresh.`),
    );
  }
};

export const cacheUpdate = async (id?: string): Promise<number> => {
  const entries = await listCacheEntries();
  const target = id ? entries.filter((e) => e.id === id) : entries;
  if (target.length === 0) {
    console.log(pc.dim(`No cached entr${id ? `y matching '${id}'` : "ies"} found.`));
    return 0;
  }
  let ok = true;
  for (const entry of target) {
    if (!entry.url || !entry.branch) {
      console.log(
        `${pc.red("✗")} ${pc.cyan(entry.id)}  ${pc.dim("missing url or branch in meta")}`,
      );
      ok = false;
      continue;
    }
    try {
      const git = simpleGit(entry.path);
      await git.fetch();
      const branchRef = entry.branch.startsWith("refs/")
        ? entry.branch
        : `origin/${entry.branch}`;
      const mergeResult = await git.merge([branchRef]);
      console.log(
        `${pc.green("✓")} ${pc.cyan(entry.id)}  ${pc.dim(entry.url)}  [${mergeResult.summary.changes ?? 0} changes]`,
      );
      // Update meta sidecar
      const sha = (await git.revparse(["HEAD"])).trim();
      await writeMetaSidecar(entry.path, {
        lastFetchedAt: new Date().toISOString(),
        lastCommitSha: sha,
        lastRefreshReason: "manual-pull",
        branch: entry.branch,
        url: entry.url,
      });
    } catch (err) {
      console.log(
        `${pc.red("✗")} ${pc.cyan(entry.id)}  ${pc.dim(err instanceof Error ? err.message : String(err))}`,
      );
      ok = false;
    }
  }
  return ok ? 0 : 1;
};

export const cacheDoctor = async (): Promise<number> => {
  const results = await runDoctor();
  let allOk = true;
  for (const r of results) {
    const icon = r.ok ? pc.green("✓") : pc.red("✗");
    console.log(`${icon} ${r.check}: ${r.detail ?? ""}`);
    if (!r.ok) allOk = false;
  }
  return allOk ? 0 : 1;
};
