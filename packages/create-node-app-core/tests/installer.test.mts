import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { extractNameAndVersion } from "../installer.js";

describe("extractNameAndVersion", () => {
  it("splits simple package with version", () => {
    const result = extractNameAndVersion("react@^16.8.0");
    assert.equal(result.name, "react");
    assert.equal(result.version, "^16.8.0");
  });

  it("splits scoped package with version", () => {
    const result = extractNameAndVersion("@types/react@^16");
    assert.equal(result.name, "@types/react");
    assert.equal(result.version, "^16");
  });

  it("returns empty version when no @ present", () => {
    const result = extractNameAndVersion("express");
    assert.equal(result.name, "express");
    assert.equal(result.version, "");
  });

  it("handles package with exact version", () => {
    const result = extractNameAndVersion("lodash@4.17.21");
    assert.equal(result.name, "lodash");
    assert.equal(result.version, "4.17.21");
  });

  it("handles package with tilde version", () => {
    const result = extractNameAndVersion("chalk@~5.0.0");
    assert.equal(result.name, "chalk");
    assert.equal(result.version, "~5.0.0");
  });

  it("scoped package without version returns empty name (edge case)", () => {
    const result = extractNameAndVersion("@scope/package");
    // lastIndexOf('@') finds the scope @, not a version separator
    assert.equal(result.name, "");
    assert.equal(result.version, "scope/package");
  });
});
