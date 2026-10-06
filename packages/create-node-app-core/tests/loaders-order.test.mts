import assert from "node:assert/strict";
import { test } from "node:test";
import fs from "node:fs";
import path from "node:path";
import { tmpdir } from "node:os";
import { pathToFileURL } from "node:url";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";

const safeRm = (directory: string) => {
  try {
    rmSync(directory, { recursive: true, force: true });
  } catch {
    // ignore
  }
};

let delayedCopySource: string | undefined;
const originalCopyFile = fs.copyFile.bind(fs);
fs.copyFile = ((
  source: string | URL,
  destination: string | URL,
  modeOrCallback: number | ((error?: NodeJS.ErrnoException | null) => void),
  maybeCallback?: (error?: NodeJS.ErrnoException | null) => void,
) => {
  const mode = typeof modeOrCallback === "number" ? modeOrCallback : undefined;
  const callback =
    typeof modeOrCallback === "function" ? modeOrCallback : maybeCallback;

  if (source !== delayedCopySource || !callback) {
    if (!callback) {
      throw new Error("missing fs.copyFile callback");
    }
    if (mode === undefined) {
      originalCopyFile(source, destination, callback);
    } else {
      originalCopyFile(source, destination, mode, callback);
    }
    return;
  }

  setTimeout(() => {
    if (mode === undefined) {
      originalCopyFile(source, destination, callback);
    } else {
      originalCopyFile(source, destination, mode, callback);
    }
  }, 50);
}) as typeof fs.copyFile;

const { loadFiles } = await import("../loaders.js");

test("extension append runs after the template copies the same destination", async () => {
  const temporaryDirectory = mkdtempSync(
    path.join(tmpdir(), "cna-loaders-order-"),
  );
  const templateDirectory = path.join(temporaryDirectory, "template");
  const extensionDirectory = path.join(temporaryDirectory, "extension");
  const outputDirectory = path.join(temporaryDirectory, "output");
  mkdirSync(templateDirectory);
  mkdirSync(extensionDirectory);
  mkdirSync(outputDirectory);

  const templateFile = path.join(templateDirectory, "postcss.config.mjs");
  writeFileSync(templateFile, "TAILWIND_BASE\n");
  writeFileSync(
    path.join(extensionDirectory, "postcss.config.mjs.append"),
    "STYLEX_APPEND\n",
  );

  delayedCopySource = templateFile;
  try {
    await loadFiles({
      root: outputDirectory,
      templatesOrExtensions: [
        { url: pathToFileURL(templateDirectory).toString() },
        { url: pathToFileURL(extensionDirectory).toString() },
      ],
      appName: "demo-app",
      originalDirectory: temporaryDirectory,
      verbose: false,
      runCommand: "npm run",
      installCommand: "npm install",
    });

    assert.equal(
      fs.readFileSync(path.join(outputDirectory, "postcss.config.mjs"), "utf8"),
      "TAILWIND_BASE\nSTYLEX_APPEND\n",
    );
  } finally {
    delayedCopySource = undefined;
    fs.copyFile = originalCopyFile;
    safeRm(temporaryDirectory);
  }
});
