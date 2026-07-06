import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "fs";
import os from "os";
import path from "path";
import { execFileSync } from "child_process";
import {
  cleanCache,
  getCacheRoot,
  listCacheEntries,
  verifyCache,
  writeCatalogToCache,
} from "../src/cache.js";
import { writeCacheMeta } from "@create-node-app/core";
import { getCatalogCacheFilePath } from "../src/templates.js";

const makeTempDir = (): string => {
  return fs.mkdtempSync(path.join(os.tmpdir(), "cna-cache-test-"));
};

const initGitRepo = (dir: string): void => {
  execFileSync("git", ["init", "--initial-branch=main", dir], {
    stdio: "ignore",
  });
  execFileSync("git", ["config", "user.email", "test@example.com"], {
    cwd: dir,
    stdio: "ignore",
  });
  execFileSync("git", ["config", "user.name", "Test"], {
    cwd: dir,
    stdio: "ignore",
  });
  fs.writeFileSync(path.join(dir, "README.md"), "hi\n");
  execFileSync("git", ["add", "."], { cwd: dir, stdio: "ignore" });
  execFileSync("git", ["commit", "-m", "init"], {
    cwd: dir,
    stdio: "ignore",
  });
};

const cleanup = (dir: string): void => {
  try {
    fs.rmSync(dir, { recursive: true, force: true });
  } catch {
    // ignore
  }
};

async function withTempCnaCacheDir<T>(
  fn: (cacheRoot: string) => Promise<T> | void,
): Promise<T | void> {
  const dir = makeTempDir();
  process.env.CNA_CACHE_DIR = dir;
  try {
    return await fn(dir);
  } finally {
    delete process.env.CNA_CACHE_DIR;
    cleanup(dir);
  }
}

test("getCacheRoot honors CNA_CACHE_DIR", async () => {
  await withTempCnaCacheDir((root) => {
    assert.equal(getCacheRoot(), root);
  });
});

test("listCacheEntries returns empty for a fresh cache root", async () => {
  await withTempCnaCacheDir(async () => {
    const entries = await listCacheEntries();
    assert.deepEqual(entries, []);
  });
});

test("listCacheEntries returns one entry per real cache directory", async () => {
  await withTempCnaCacheDir(async (root) => {
    const entryId = "test-entry";
    const entryDir = path.join(root, entryId);
    fs.mkdirSync(entryDir, { recursive: true });
    initGitRepo(entryDir);
    writeCacheMeta(entryDir, {
      lastFetchedAt: "2026-01-01T00:00:00.000Z",
      lastCommitSha: "deadbeef",
      lastRefreshReason: "clone",
      branch: "main",
      url: "https://example.com/repo",
    });
    const entries = await listCacheEntries();
    assert.equal(entries.length, 1);
    assert.equal(entries[0]?.id, entryId);
    assert.equal(entries[0]?.url, "https://example.com/repo");
    assert.equal(entries[0]?.branch, "main");
    assert.equal(entries[0]?.lastCommitSha, "deadbeef");
    assert.ok(entries[0]?.sizeBytes && entries[0].sizeBytes > 0);
  });
});

test("listCacheEntries skips the catalog subdirectory", async () => {
  await withTempCnaCacheDir(async (root) => {
    fs.mkdirSync(path.join(root, "catalog"), { recursive: true });
    const entries = await listCacheEntries();
    assert.deepEqual(entries, []);
  });
});

test("cleanCache with no id removes everything in the cache root", async () => {
  await withTempCnaCacheDir(async (root) => {
    const a = path.join(root, "a");
    const b = path.join(root, "b");
    fs.mkdirSync(a, { recursive: true });
    fs.mkdirSync(b, { recursive: true });
    initGitRepo(a);
    initGitRepo(b);
    const result = await cleanCache();
    assert.equal(result.removed.length, 2);
    assert.equal(result.notFound.length, 0);
    assert.ok(!fs.existsSync(a));
    assert.ok(!fs.existsSync(b));
  });
});

test("cleanCache with id removes only that entry", async () => {
  await withTempCnaCacheDir(async (root) => {
    const a = path.join(root, "a");
    const b = path.join(root, "b");
    fs.mkdirSync(a, { recursive: true });
    fs.mkdirSync(b, { recursive: true });
    initGitRepo(a);
    initGitRepo(b);
    const result = await cleanCache("a");
    assert.deepEqual(result.removed, [a]);
    assert.equal(result.notFound.length, 0);
    assert.ok(!fs.existsSync(a));
    assert.ok(fs.existsSync(b));
  });
});

test("cleanCache with unknown id reports notFound", async () => {
  await withTempCnaCacheDir(async () => {
    const result = await cleanCache("does-not-exist");
    assert.equal(result.removed.length, 0);
    assert.deepEqual(result.notFound, ["does-not-exist"]);
  });
});

test("verifyCache runs git fsck and returns ok=true for a clean repo", async () => {
  await withTempCnaCacheDir(async (root) => {
    const a = path.join(root, "a");
    fs.mkdirSync(a, { recursive: true });
    initGitRepo(a);
    const results = await verifyCache("a");
    assert.equal(results.length, 1);
    assert.equal(results[0]?.id, "a");
    assert.equal(results[0]?.fsckOk, true);
  });
});

test("writeCatalogToCache and getCatalogCacheFilePath integrate", async () => {
  await withTempCnaCacheDir(async () => {
    const file = getCatalogCacheFilePath();
    await writeCatalogToCache({ templates: [], extensions: [] }, file);
    const read = JSON.parse(fs.readFileSync(file, "utf8"));
    assert.deepEqual(read, { templates: [], extensions: [] });
  });
});
