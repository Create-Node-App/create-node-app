import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { resolveInteractiveMode } from "../src/options.js";

describe("resolveInteractiveMode", () => {
  it("explicit --interactive wins even in CI", () => {
    assert.equal(resolveInteractiveMode({ interactive: true }, true), true);
  });
  it("explicit --no-interactive wins outside CI", () => {
    assert.equal(resolveInteractiveMode({ interactive: false }, false), false);
  });
  it("defaults to interactive when not CI and flag omitted", () => {
    assert.equal(resolveInteractiveMode({}, false), true);
  });
  it("defaults to non-interactive in CI when flag omitted", () => {
    assert.equal(resolveInteractiveMode({}, true), false);
  });
});
