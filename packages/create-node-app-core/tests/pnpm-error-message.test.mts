import assert from "node:assert/strict";
import { test } from "node:test";

import { buildInstallFailureMessage } from "../installer.js";

test("pnpm failure message includes ignored builds guidance", () => {
  const message = buildInstallFailureMessage(
    "pnpm",
    ["install", "--ignore-workspace"],
    true,
  );

  assert.match(message, /pnpm install --ignore-workspace/);
  assert.match(message, /ERR_PNPM_IGNORED_BUILDS/);
  assert.match(message, /pnpm approve-builds/);
});

test("non-pnpm failure message remains unchanged", () => {
  const message = buildInstallFailureMessage("npm", ["install"], false);
  assert.equal(message, "npm install");
});
