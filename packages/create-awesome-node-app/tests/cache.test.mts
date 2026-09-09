import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "fs";
import os from "os";
import path from "path";
import { execFileSync } from "child_process";
import {
  checkOutdated,
  cleanCache,
  getCacheRoot,
  listCacheEntries,
  verifyCache,
  writeCatalogToCache,
  writeMetaSidecar,
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

test("listCacheEntries tolerates a corrupted meta sidecar", async () => {
  await withTempCnaCacheDir(async () => {
    const a = path.join(getCacheRoot(), "a");
    fs.mkdirSync(a, { recursive: true });
    fs.writeFileSync(path.join(a, ".cna-meta.json"), "{ not json");
    fs.writeFileSync(path.join(a, "file.txt"), "x\n");
    const entries = await listCacheEntries();
    assert.equal(entries.length, 1);
    assert.equal(entries[0]?.id, "a");
    assert.equal(entries[0]?.lastFetchedAt, undefined);
    assert.ok((entries[0]?.sizeBytes ?? 0) > 0);
  });
});

test("listCacheEntries ignores plain files in the cache root", async () => {
  await withTempCnaCacheDir(async (root) => {
    fs.writeFileSync(path.join(root, "stray.txt"), "stray\n");
    const entries = await listCacheEntries();
    assert.deepEqual(entries, []);
  });
});

test("verifyCache reports fsckOk=false for a non-git directory", async () => {
  await withTempCnaCacheDir(async (root) => {
    fs.mkdirSync(path.join(root, "plain"), { recursive: true });
    const results = await verifyCache("plain");
    assert.equal(results.length, 1);
    assert.equal(results[0]?.fsckOk, false);
  });
});

test("verifyCache with unknown id returns an empty list", async () => {
  await withTempCnaCacheDir(async () => {
    assert.deepEqual(await verifyCache("nope"), []);
  });
});

test("cleanCache on a missing root reports nothing removed", async () => {
  await withTempCnaCacheDir(async (root) => {
    fs.rmSync(root, { recursive: true, force: true });
    assert.deepEqual(await cleanCache(), { removed: [], notFound: [] });
  });
});

test(
  "listCacheEntries survives unreadable subdirectories",
  { skip: process.platform === "win32" },
  async () => {
    await withTempCnaCacheDir(async (root) => {
      const locked = path.join(root, "locked");
      fs.mkdirSync(locked, { recursive: true });
      fs.writeFileSync(path.join(locked, "secret.txt"), "s\n");
      fs.chmodSync(locked, 0o000);
      try {
        const entries = await listCacheEntries();
        assert.ok(
          entries.some((e) => e.id === "locked"),
          "entry still listed despite unreadable contents",
        );
      } finally {
        fs.chmodSync(locked, 0o755);
      }
    });
  },
);

test("concurrent list and catalog writes stay consistent", async () => {
  await withTempCnaCacheDir(async () => {
    const file = getCatalogCacheFilePath();
    const catalogWrite = writeCatalogToCache(
      { templates: [1], extensions: [] },
      file,
    );
    const lists = await Promise.all([
      listCacheEntries(),
      listCacheEntries(),
      listCacheEntries(),
      catalogWrite.then(() => listCacheEntries()),
    ]);
    for (const entries of lists) {
      assert.deepEqual(entries, []);
    }
    const read = JSON.parse(fs.readFileSync(file, "utf8"));
    assert.deepEqual(read, { templates: [1], extensions: [] });
  });
});

test("stale meta timestamps round-trip through the sidecar", async () => {
  await withTempCnaCacheDir(async () => {
    const a = path.join(getCacheRoot(), "a");
    fs.mkdirSync(a, { recursive: true });
    await writeMetaSidecar(a, {
      lastFetchedAt: "2020-01-01T00:00:00.000Z",
      lastCommitSha: "abc123",
      lastRefreshReason: "stale",
      branch: "main",
      url: "https://example.com/repo.git",
    });
    const entries = await listCacheEntries();
    assert.equal(entries[0]?.lastFetchedAt, "2020-01-01T00:00:00.000Z");
    assert.equal(entries[0]?.lastCommitSha, "abc123");
  });
});

test("checkOutdated reports missing remote metadata without network", async () => {
  await withTempCnaCacheDir(async () => {
    const a = path.join(getCacheRoot(), "a");
    fs.mkdirSync(a, { recursive: true });
    const results = await checkOutdated();
    assert.equal(results.length, 1);
    assert.equal(results[0]?.behind, false);
    assert.ok(results[0]?.error);
  });
});
