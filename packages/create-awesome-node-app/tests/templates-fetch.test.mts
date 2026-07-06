import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "fs";
import os from "os";
import path from "path";
import nock from "nock";
import {
  __resetTemplateDataCacheForTests,
  getTemplateData,
  getCatalogCacheFilePath,
  CNA_FETCH_TIMEOUT_MS,
  CNA_USER_AGENT,
} from "../src/templates.js";

const makeTempDir = (): string => {
  return fs.mkdtempSync(path.join(os.tmpdir(), "cna-templates-test-"));
};

const cleanup = (dir: string): void => {
  try {
    fs.rmSync(dir, { recursive: true, force: true });
  } catch {
    // ignore
  }
};

async function withTempCnaCacheDir<T>(
  fn: () => Promise<T> | void,
): Promise<T | void> {
  const dir = makeTempDir();
  process.env.CNA_CACHE_DIR = dir;
  try {
    return await fn();
  } finally {
    delete process.env.CNA_CACHE_DIR;
    cleanup(dir);
  }
}

const mockCatalog = {
  templates: [
    {
      name: "Test",
      slug: "test",
      description: "Test template",
      url: "https://example.com/test",
      category: "test",
      labels: ["test"],
      type: "test",
    },
  ],
  extensions: [],
  categories: [
    {
      slug: "test",
      name: "Test",
      description: "Test category",
      details: "",
      labels: [],
    },
  ],
};

const setupNock = (): nock.Scope => {
  return nock("https://raw.githubusercontent.com")
    .get("/Create-Node-App/cna-templates/main/templates.json")
    .reply(200, mockCatalog, {
      "content-type": "application/json",
    });
};

test("getTemplateData fetches and caches on first call", async () => {
  await withTempCnaCacheDir(async () => {
    __resetTemplateDataCacheForTests();
    const scope = setupNock();
    const data = await getTemplateData();
    assert.equal(data.templates.length, 1);
    assert.equal(data.templates[0]?.slug, "test");
    assert.ok(scope.isDone());
  });
});

test("getTemplateData persists to disk cache", async () => {
  await withTempCnaCacheDir(async () => {
    __resetTemplateDataCacheForTests();
    setupNock();
    await getTemplateData();
    const file = getCatalogCacheFilePath();
    assert.ok(fs.existsSync(file), "expected catalog cache file to exist");
    const read = JSON.parse(fs.readFileSync(file, "utf8"));
    assert.deepEqual(read, mockCatalog);
  });
});

test("getTemplateData falls back to disk cache on network failure", async () => {
  await withTempCnaCacheDir(async () => {
    __resetTemplateDataCacheForTests();
    // First call: prime the disk cache.
    setupNock();
    await getTemplateData();
    // Second call: clear the in-memory cache, force a network failure
    // (nock returns 500), and verify the disk cache is used.
    __resetTemplateDataCacheForTests();
    nock.cleanAll();
    nock("https://raw.githubusercontent.com")
      .get("/Create-Node-App/cna-templates/main/templates.json")
      .reply(500, "boom");
    const data = await getTemplateData();
    assert.equal(data.templates.length, 1);
    assert.equal(data.templates[0]?.slug, "test");
  });
});

test("getTemplateData throws when network fails and no disk cache exists", async () => {
  await withTempCnaCacheDir(async () => {
    __resetTemplateDataCacheForTests();
    // Force a 500 from nock so the call fails without doing real network.
    nock.cleanAll();
    nock("https://raw.githubusercontent.com")
      .get("/Create-Node-App/cna-templates/main/templates.json")
      .reply(500, "boom");
    await assert.rejects(
      () => getTemplateData(),
      /Failed to fetch template data/,
    );
  });
});

test("constants are exported", () => {
  assert.equal(typeof CNA_FETCH_TIMEOUT_MS, "number");
  assert.equal(typeof CNA_USER_AGENT, "string");
  assert.ok(CNA_USER_AGENT.includes("create-awesome-node-app"));
});
