import assert from "node:assert/strict";
import { test } from "node:test";

import { rewriteOptionAliases } from "../src/argv-aliases.js";

test("rewriteOptionAliases rewrites --skip-install before --", () => {
  assert.deepEqual(
    rewriteOptionAliases([
      "node",
      "create-awesome-node-app",
      "--skip-install",
      "my-app",
    ]),
    [
      "node",
      "create-awesome-node-app",
      "--no-install",
      "my-app",
    ],
  );
});

test("rewriteOptionAliases leaves --no-install untouched", () => {
  assert.deepEqual(
    rewriteOptionAliases([
      "node",
      "create-awesome-node-app",
      "--no-install",
      "my-app",
    ]),
    [
      "node",
      "create-awesome-node-app",
      "--no-install",
      "my-app",
    ],
  );
});

test("rewriteOptionAliases rewrites multiple --skip-install occurrences", () => {
  assert.deepEqual(
    rewriteOptionAliases([
      "node",
      "create-awesome-node-app",
      "--skip-install",
      "--verbose",
      "--skip-install",
    ]),
    [
      "node",
      "create-awesome-node-app",
      "--no-install",
      "--verbose",
      "--no-install",
    ],
  );
});

test("rewriteOptionAliases does not rewrite --skip-install after --", () => {
  // A literal `--skip-install` value after the end-of-options marker must
  // be preserved as a positional argument, not flipped to the boolean
  // option. See CodeRabbit review on PR #290.
  assert.deepEqual(
    rewriteOptionAliases([
      "node",
      "create-awesome-node-app",
      "--",
      "--skip-install",
    ]),
    [
      "node",
      "create-awesome-node-app",
      "--",
      "--skip-install",
    ],
  );
});

test("rewriteOptionAliases only stops at the first --", () => {
  assert.deepEqual(
    rewriteOptionAliases([
      "node",
      "create-awesome-node-app",
      "--",
      "--skip-install",
      "--",
      "--skip-install",
    ]),
    [
      "node",
      "create-awesome-node-app",
      "--",
      "--skip-install",
      "--",
      "--skip-install",
    ],
  );
});

test("rewriteOptionAliases handles argv with no aliases unchanged", () => {
  assert.deepEqual(
    rewriteOptionAliases([
      "node",
      "create-awesome-node-app",
      "--template",
      "react-vite-boilerplate",
      "my-app",
    ]),
    [
      "node",
      "create-awesome-node-app",
      "--template",
      "react-vite-boilerplate",
      "my-app",
    ],
  );
});

test("rewriteOptionAliases returns a new array (does not mutate input)", () => {
  const input = ["node", "--skip-install", "my-app"];
  const result = rewriteOptionAliases(input);
  assert.deepEqual(result, ["node", "--no-install", "my-app"]);
  assert.deepEqual(input, ["node", "--skip-install", "my-app"]);
});
