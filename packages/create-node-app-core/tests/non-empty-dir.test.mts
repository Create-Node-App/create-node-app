import assert from "node:assert/strict";
import { test } from "node:test";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { tmpdir } from "node:os";

import {
  assertDirectoryIsEmpty,
  NON_EMPTY_DIR_ERROR_CODE,
  NonEmptyTargetDirectoryError,
} from "../config.js";

test("assertDirectoryIsEmpty allows missing directory", () => {
  const dir = path.join(tmpdir(), "cna-non-empty-missing-do-not-create");
  assert.doesNotThrow(() => assertDirectoryIsEmpty(dir));
});

test("assertDirectoryIsEmpty allows empty directory", () => {
  const tmp = mkdtempSync(path.join(tmpdir(), "cna-empty-"));
  const emptyDir = path.join(tmp, "empty");
  mkdirSync(emptyDir, { recursive: true });

  assert.doesNotThrow(() => assertDirectoryIsEmpty(emptyDir));

  rmSync(tmp, { recursive: true, force: true });
});

test("assertDirectoryIsEmpty throws on non-empty directory", () => {
  const tmp = mkdtempSync(path.join(tmpdir(), "cna-non-empty-"));
  const nonEmptyDir = path.join(tmp, "target");
  mkdirSync(nonEmptyDir, { recursive: true });
  writeFileSync(path.join(nonEmptyDir, "existing.txt"), "keep");

  assert.throws(
    () => assertDirectoryIsEmpty(nonEmptyDir),
    (error: unknown) => {
      assert.ok(error instanceof NonEmptyTargetDirectoryError);
      assert.equal(error.code, NON_EMPTY_DIR_ERROR_CODE);
      assert.match(error.message, /Use --force to continue\./);
      return true;
    },
  );

  rmSync(tmp, { recursive: true, force: true });
});
