import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "fs";
import os from "os";
import path from "path";
import { execFileSync } from "child_process";
import {
  __resetGitStateForTests,
  downloadRepository,
  readCacheMeta,
  resolveCacheDir,
  writeCacheMeta,
  type RefreshMode,
} from "../git.js";

const makeTempDir = (): string => {
  return fs.mkdtempSync(path.join(os.tmpdir(), "cna-test-"));
};

const initWorkingRepo = (dir: string): void => {
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
  fs.writeFileSync(path.join(dir, "README.md"), "hello\n");
  execFileSync("git", ["add", "."], { cwd: dir, stdio: "ignore" });
  execFileSync("git", ["commit", "-m", "initial"], {
    cwd: dir,
    stdio: "ignore",
  });
};

/**
 * Create a local bare git repository that can be cloned via the file://
 * protocol. Returns the absolute path to the bare repo.
 */
const makeLocalBareGitRepo = (): string => {
  const bare = makeTempDir();
  execFileSync("git", ["init", "--bare", "--initial-branch=main", bare], {
    stdio: "ignore",
  });
  // Create a working repo with one commit, push to bare, then return bare.
  const work = makeTempDir();
  initWorkingRepo(work);
  execFileSync("git", ["remote", "add", "origin", bare], {
    cwd: work,
    stdio: "ignore",
  });
  execFileSync("git", ["push", "origin", "main"], {
    cwd: work,
    stdio: "ignore",
  });
  cleanup(work);
  return bare;
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

test("resolveCacheDir honors CNA_CACHE_DIR", async () => {
  await withTempCnaCacheDir((cacheRoot) => {
    const resolved = resolveCacheDir("abc123");
    assert.equal(resolved, path.join(cacheRoot, "abc123"));
  });
});

test("resolveCacheDir defaults to ~/.cache/cna", () => {
  delete process.env.CNA_CACHE_DIR;
  const resolved = resolveCacheDir("abc123");
  assert.equal(resolved, path.join(os.homedir(), ".cache", "cna", "abc123"));
});

test("writeCacheMeta and readCacheMeta round-trip", async () => {
  const cacheDir = makeTempDir();
  try {
    writeCacheMeta(cacheDir, {
      lastFetchedAt: "2026-01-01T00:00:00.000Z",
      lastCommitSha: "abc1234",
      lastRefreshReason: "clone",
      branch: "main",
      url: "https://github.com/foo/bar",
    });
    const meta = readCacheMeta(cacheDir);
    assert.ok(meta);
    assert.equal(meta.lastCommitSha, "abc1234");
    assert.equal(meta.branch, "main");
    assert.equal(meta.lastRefreshReason, "clone");
  } finally {
    cleanup(cacheDir);
  }
});

test("readCacheMeta returns null when missing", () => {
  const dir = makeTempDir();
  try {
    assert.equal(readCacheMeta(dir), null);
  } finally {
    cleanup(dir);
  }
});

test("readCacheMeta returns null on malformed JSON", () => {
  const dir = makeTempDir();
  try {
    fs.writeFileSync(path.join(dir, ".cna-meta.json"), "{ not json");
    assert.equal(readCacheMeta(dir), null);
  } finally {
    cleanup(dir);
  }
});

test("downloadRepository: clone writes meta sidecar and copies to target", async () => {
  await withTempCnaCacheDir(async (cacheRoot) => {
    __resetGitStateForTests();
    const source = makeLocalBareGitRepo();
    const target = makeTempDir();
    try {
      await downloadRepository({
        url: source,
        target,
        branch: "main",
        refresh: "always" as RefreshMode,
      });
      // Files copied
      assert.ok(fs.existsSync(path.join(target, "README.md")));
      // Meta written in the cache entry (keyed by base64 of "<source>@main")
      const entry = resolveCacheDir(
        Buffer.from(`${source}@main`).toString("base64"),
        cacheRoot,
      );
      const meta = readCacheMeta(entry);
      assert.ok(meta);
      assert.equal(meta.lastRefreshReason, "clone");
      assert.equal(meta.branch, "main");
      assert.ok(meta.lastCommitSha);
    } finally {
      cleanup(source);
      cleanup(target);
    }
  });
});

test("downloadRepository: offline + fresh cache skips pull (meta unchanged)", async () => {
  await withTempCnaCacheDir(async (cacheRoot) => {
    __resetGitStateForTests();
    const source = makeLocalBareGitRepo();
    const target = makeTempDir();
    try {
      // First run: clone
      await downloadRepository({
        url: source,
        target,
        branch: "main",
        refresh: "always" as RefreshMode,
      });
      const entry = resolveCacheDir(
        Buffer.from(`${source}@main`).toString("base64"),
        cacheRoot,
      );
      const metaBefore = readCacheMeta(entry);
      assert.ok(metaBefore);
      const firstSha = metaBefore.lastCommitSha;

      // Reset completion cache so the next call actually runs.
      __resetGitStateForTests();
      // Now run again with manual refresh + offline. Should NOT pull.
      await downloadRepository({
        url: source,
        target: makeTempDir(),
        branch: "main",
        offline: true,
        refresh: "manual" as RefreshMode,
      });
      const metaAfter = readCacheMeta(entry);
      assert.ok(metaAfter);
      // Manual + offline should preserve the original SHA and not update
      // lastFetchedAt.
      assert.equal(metaAfter.lastCommitSha, firstSha);
    } finally {
      cleanup(source);
      cleanup(target);
    }
  });
});

test("downloadRepository: refresh=always forces pull on cache hit", async () => {
  await withTempCnaCacheDir(async () => {
    __resetGitStateForTests();
    const source = makeLocalBareGitRepo();
    const target = makeTempDir();
    try {
      await downloadRepository({
        url: source,
        target,
        branch: "main",
        refresh: "always" as RefreshMode,
      });
      // Push a new commit to the source.
      const work = makeTempDir();
      execFileSync("git", ["clone", source, work], { stdio: "ignore" });
      execFileSync("git", ["config", "user.email", "test@example.com"], {
        cwd: work,
        stdio: "ignore",
      });
      execFileSync("git", ["config", "user.name", "Test"], {
        cwd: work,
        stdio: "ignore",
      });
      fs.writeFileSync(path.join(work, "second.txt"), "two\n");
      execFileSync("git", ["add", "."], { cwd: work, stdio: "ignore" });
      execFileSync("git", ["commit", "-m", "second"], {
        cwd: work,
        stdio: "ignore",
      });
      execFileSync("git", ["push", "origin", "main"], {
        cwd: work,
        stdio: "ignore",
      });
      cleanup(work);

      const newTarget = makeTempDir();
      __resetGitStateForTests();
      await downloadRepository({
        url: source,
        target: newTarget,
        branch: "main",
        refresh: "always" as RefreshMode,
      });
      assert.ok(fs.existsSync(path.join(newTarget, "second.txt")));
    } finally {
      cleanup(source);
      cleanup(target);
    }
  });
});
