import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import {
  CnaError,
  ConfigParseError,
  ManifestLoadError,
  PackageManagerFallback,
  ScaffoldAbortedError,
} from "../errors.js";

describe("CnaError", () => {
  it("sets code, message, and name", () => {
    const err = new CnaError("CNA_TEST", "test message");
    assert.equal(err.code, "CNA_TEST");
    assert.equal(err.message, "test message");
    assert.equal(err.name, "CnaError");
  });

  it("carries optional suggestions and cause", () => {
    const cause = new Error("root cause");
    const err = new CnaError("CNA_TEST", "test", {
      suggestions: ["try this"],
      cause,
    });
    assert.deepEqual(err.suggestions, ["try this"]);
    assert.equal(err.cause, cause);
  });

  it("has empty suggestions and undefined cause by default", () => {
    const err = new CnaError("CNA_TEST", "test");
    assert.deepEqual(err.suggestions, []);
    assert.equal(err.cause, undefined);
  });
});

describe("ConfigParseError", () => {
  it("includes file path in message", () => {
    const err = new ConfigParseError(
      "/templates/my-app/cna.config.json",
      new SyntaxError("Unexpected token '}'"),
    );
    assert.match(err.message, /cna\.config\.json/);
    assert.match(err.message, /Unexpected token/);
    assert.equal(err.code, "CNA_CONFIG_PARSE");
    assert.equal(err.name, "ConfigParseError");
    assert.match(
      (err.cause as Error)?.message ?? "",
      /Unexpected token/,
    );
  });

  it("stringifies non-Error parse errors", () => {
    const err = new ConfigParseError(
      "/templates/x/cna.config.json",
      "not a valid JSON",
    );
    assert.match(err.message, /not a valid JSON/);
    assert.equal(err.cause, undefined);
  });
});

describe("ManifestLoadError", () => {
  it("includes template URL and manifest type", () => {
    const err = new ManifestLoadError(
      "github:user/repo",
      "template.json",
      new Error("ENOENT"),
    );
    assert.match(err.message, /template\.json/);
    assert.match(err.message, /ENOENT/);
    assert.equal(err.code, "CNA_MANIFEST_LOAD");
    assert.ok(err.suggestions.length > 0);
  });
});

describe("PackageManagerFallback", () => {
  it("explains fallback reason", () => {
    const err = new PackageManagerFallback("pnpm", "npm", "version < 5");
    assert.match(err.message, /pnpm/);
    assert.match(err.message, /npm/);
    assert.match(err.message, /version < 5/);
    assert.equal(err.code, "CNA_PM_FALLBACK");
    assert.ok(err.suggestions.length > 0);
  });
});

describe("ScaffoldAbortedError", () => {
  it("cleanup removes the scaffold directory", () => {
    const tmpDir = fs.mkdtempSync(
      path.join(os.tmpdir(), "cna-abort-test-"),
    );
    const err = new ScaffoldAbortedError(tmpDir);
    assert.equal(err.code, "CNA_ABORTED");
    assert.ok(err.message.includes(tmpDir));

    assert.ok(fs.existsSync(tmpDir));
    err.cleanup();
    assert.ok(!fs.existsSync(tmpDir));
  });

  it("cleanup does not throw for non-existent directory", () => {
    const err = new ScaffoldAbortedError("/tmp/nonexistent-cna-test-dir");
    assert.doesNotThrow(() => err.cleanup());
  });
});
