import assert from "node:assert/strict";
import { test } from "node:test";

import { parseSetOverrides } from "../src/set-overrides.js";

test("parseSetOverrides handles simple key=value pairs", () => {
  assert.deepEqual(parseSetOverrides(["projectName=my-app", "author=Jane"]), {
    projectName: "my-app",
    author: "Jane",
  });
});

test("parseSetOverrides rejoins values split across argv tokens", () => {
  assert.deepEqual(
    parseSetOverrides(["projectName=My", "Awesome", "Project"]),
    { projectName: "My Awesome Project" },
  );
});

test("parseSetOverrides strips surrounding quotes", () => {
  assert.deepEqual(parseSetOverrides(['projectName="My Awesome Project"']), {
    projectName: "My Awesome Project",
  });
});

test("parseSetOverrides handles single-token value with spaces (unquoted)", () => {
  assert.deepEqual(
    parseSetOverrides(["projectName=My Awesome Project"]),
    { projectName: "My Awesome Project" },
  );
});

test("parseSetOverrides returns empty object for undefined input", () => {
  assert.deepEqual(parseSetOverrides(undefined), {});
});
