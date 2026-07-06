import { test, describe } from "node:test";
import assert from "node:assert/strict";
import fs from "fs";
import os from "os";
import path from "path";
import { execFileSync } from "child_process";
import {
  checkOutdated,
  cleanCache,
  listCacheEntries,
  runDoctor,
  verifyCache,
  writeMetaSidecar,
  type WriteMetaOptions,
} from "../src/cache.js";

const SKIP_ON_WINDOWS = process.platform === "win32";
const skip = SKIP_ON_WINDOWS
  ? { skip: "covered by cross-platform-scaffold job on windows" }
  : undefined;

const makeTempDir = (): string => {
  return fs.mkdtempSync(path.join(os.tmpdir(), "cna-cache-integration-"));
};

const initGitRepo = (dir: string, file?: string, content?: string): void => {
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
  const targetFile = file ?? "README.md";
  fs.writeFileSync(path.join(dir, targetFile), content ?? "hi\n");
  execFileSync("git", ["add", "."], { cwd: dir, stdio: "ignore" });
  execFileSync("git", ["commit", "-m", "init"], {
    cwd: dir,
    stdio: "ignore",
  });
};

const addCommit = (dir: string, msg: string): void => {
  fs.writeFileSync(path.join(dir, `commit-${msg}.txt`), msg);
  execFileSync("git", ["add", "."], { cwd: dir, stdio: "ignore" });
  execFileSync("git", ["commit", "-m", msg], {
    cwd: dir,
    stdio: "ignore",
  });
};

const getHeadSha = (dir: string): string => {
  return execFileSync("git", ["rev-parse", "HEAD"], {
    cwd: dir,
    stdio: ["ignore", "pipe", "ignore"],
  })
    .toString()
    .trim();
};

const cleanup = (dir: string): void => {
  try {
    fs.rmSync(dir, { recursive: true, force: true });
  } catch {
    // ignore
  }
};

async function withTempCnaCacheDir<T>(
  fn: (cacheRoot: string) => Promise<T>,
): Promise<T> {
  const dir = makeTempDir();
  process.env.CNA_CACHE_DIR = dir;
  try {
    return await fn(dir);
  } finally {
    delete process.env.CNA_CACHE_DIR;
    cleanup(dir);
  }
}

describe("checkOutdated", () => {
  test("returns empty array when no cached entries", skip, async () => {
    await withTempCnaCacheDir(async () => {
      const results = await checkOutdated();
      assert.deepEqual(results, []);
    });
  });

  test("reports behind=true when local SHA differs from remote", skip, async () => {
    await withTempCnaCacheDir(async (root) => {
      const remoteDir = makeTempDir();
      try {
        initGitRepo(remoteDir);

        const entryId = "test-entry";
        const entryDir = path.join(root, entryId);
        fs.mkdirSync(entryDir, { recursive: true });
        execFileSync("git", ["clone", remoteDir, entryDir], {
          stdio: "ignore",
        });

        const oldSha = getHeadSha(entryDir);

        // Add a commit to the remote to make local behind
        addCommit(remoteDir, "new-commit");
        const newSha = getHeadSha(remoteDir);
        assert.notEqual(oldSha, newSha);

        // Write meta with the OLD sha (behind remote)
        await writeMetaSidecar(entryDir, {
          lastFetchedAt: new Date().toISOString(),
          lastCommitSha: oldSha,
          lastRefreshReason: "clone",
          branch: "main",
          url: remoteDir,
        });

        const results = await checkOutdated();
        assert.equal(results.length, 1);
        assert.equal(results[0]?.id, entryId);
        assert.equal(results[0]?.localSha, oldSha);
        assert.equal(results[0]?.remoteSha, newSha);
        assert.equal(results[0]?.behind, true);
      } finally {
        cleanup(remoteDir);
      }
    });
  });

  test("reports behind=false when local SHA matches remote", skip, async () => {
    await withTempCnaCacheDir(async (root) => {
      const remoteDir = makeTempDir();
      try {
        initGitRepo(remoteDir);

        const entryId = "test-entry";
        const entryDir = path.join(root, entryId);
        fs.mkdirSync(entryDir, { recursive: true });
        execFileSync("git", ["clone", remoteDir, entryDir], {
          stdio: "ignore",
        });

        const sha = getHeadSha(entryDir);

        await writeMetaSidecar(entryDir, {
          lastFetchedAt: new Date().toISOString(),
          lastCommitSha: sha,
          lastRefreshReason: "clone",
          branch: "main",
          url: remoteDir,
        });

        const results = await checkOutdated();
        assert.equal(results.length, 1);
        assert.equal(results[0]?.behind, false);
      } finally {
        cleanup(remoteDir);
      }
    });
  });
});

describe("writeMetaSidecar", skip, () => {
  test("writes and can be read back via listCacheEntries", async () => {
    await withTempCnaCacheDir(async (root) => {
      const entryId = "meta-test";
      const entryDir = path.join(root, entryId);
      fs.mkdirSync(entryDir, { recursive: true });

      const meta: WriteMetaOptions = {
        lastFetchedAt: "2026-06-01T12:00:00.000Z",
        lastCommitSha: "abc123def456abc123def456abc123def456abc1",
        lastRefreshReason: "manual-pull",
        branch: "main",
        url: "https://github.com/owner/repo",
      };
      await writeMetaSidecar(entryDir, meta);

      const entries = await listCacheEntries();
      assert.equal(entries.length, 1);
      assert.equal(entries[0]?.lastFetchedAt, meta.lastFetchedAt);
      assert.equal(entries[0]?.lastCommitSha, meta.lastCommitSha);
      assert.equal(entries[0]?.lastRefreshReason, meta.lastRefreshReason);
      assert.equal(entries[0]?.branch, meta.branch);
      assert.equal(entries[0]?.url, meta.url);
    });
  });
});

describe("runDoctor", () => {
  test("git check passes when git is available", skip, async () => {
    const results = await runDoctor();
    const gitCheck = results.find((r) => r.check === "git");
    assert.ok(gitCheck, "git check should be present");
    assert.equal(gitCheck?.ok, true);
    assert.ok(gitCheck?.detail?.startsWith("git version"));
  });

  test("cache-dir check passes in a temp dir", skip, async () => {
    await withTempCnaCacheDir(async () => {
      const results = await runDoctor();
      const cacheCheck = results.find((r) => r.check === "cache-dir");
      assert.ok(cacheCheck, "cache-dir check should be present");
      assert.equal(cacheCheck?.ok, true);
    });
  });

  test("cache-integrity reports ok for empty cache", skip, async () => {
    await withTempCnaCacheDir(async () => {
      const results = await runDoctor();
      const integrity = results.find((r) => r.check === "cache-integrity");
      assert.ok(integrity, "cache-integrity check should be present");
      assert.equal(integrity?.ok, true);
    });
  });
});

describe("verifyCache", skip, () => {
  test("returns empty for unknown id", async () => {
    await withTempCnaCacheDir(async () => {
      const results = await verifyCache("nonexistent");
      assert.deepEqual(results, []);
    });
  });
});

describe("cleanCache", skip, () => {
  test("cleaning all entries removes everything", async () => {
    await withTempCnaCacheDir(async (root) => {
      const a = path.join(root, "a");
      fs.mkdirSync(a, { recursive: true });
      const result = await cleanCache();
      assert.equal(result.removed.length, 1);
      assert.ok(!fs.existsSync(a));
    });
  });
});
