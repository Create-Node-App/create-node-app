import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { loadTemplateCnaConfig, NON_EMPTY_DIR_ERROR_CODE } from "../index.js";

describe("loadTemplateCnaConfig", () => {
  it("returns null for non-existent template URL", async () => {
    const result = await loadTemplateCnaConfig(
      "file:///tmp/nonexistent-cna-config-test",
    );
    assert.equal(result, null);
  });

  it("returns parsed config for a valid cna.config.json", async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "cna-config-valid-"));
    try {
      const config = { customOptions: [{ name: "projectName", type: "text", initial: "my-app" }] };
      fs.writeFileSync(
        path.join(tmpDir, "cna.config.json"),
        JSON.stringify(config),
      );
      const result = await loadTemplateCnaConfig(
        `file://${tmpDir}`,
      );
      assert.notEqual(result, null);
      assert.deepEqual(result?.customOptions, config.customOptions);
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it("returns null when cna.config.json does not exist", async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "cna-config-missing-"));
    try {
      // Create the directory but no config file
      const result = await loadTemplateCnaConfig(
        `file://${tmpDir}`,
      );
      assert.equal(result, null);
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });
});

describe("NON_EMPTY_DIR_ERROR_CODE", () => {
  it("is a string constant", () => {
    assert.equal(typeof NON_EMPTY_DIR_ERROR_CODE, "string");
    assert.ok(NON_EMPTY_DIR_ERROR_CODE.length > 0);
  });
});
