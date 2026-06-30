import assert from "node:assert/strict";
import { test } from "node:test";
import fs from "node:fs";
import path from "node:path";
import { tmpdir } from "node:os";
import { pathToFileURL } from "node:url";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";

const safeRm = (d: string) => {
  try {
    rmSync(d, { recursive: true, force: true });
  } catch {
    // ignore
  }
};

test("loadFiles preserves file permissions on copied files", async () => {
  const tmpDir = mkdtempSync(path.join(tmpdir(), "cna-loaders-perm-"));
  const destDir = path.join(tmpDir, "output");
  mkdirSync(destDir, { recursive: true });
  const templateDir = path.join(tmpDir, "template");
  mkdirSync(templateDir, { recursive: true });

  // Create a file with executable bit
  writeFileSync(
    path.join(templateDir, "script.sh"),
    "#!/bin/sh\necho hello\n",
    { mode: 0o755 },
  );
  // Create a non-executable file
  writeFileSync(path.join(templateDir, "readme.md"), "# Readme\n", {
    mode: 0o644,
  });

  const loadersModule = await import("../loaders.js");
  const { loadFiles } = loadersModule as {
    loadFiles: (opts: Record<string, unknown>) => Promise<void>;
  };

  const fileUrl = pathToFileURL(templateDir).toString();
  await loadFiles({
    root: destDir,
    templatesOrExtensions: [{ url: fileUrl }],
    appName: "test-app",
    originalDirectory: tmpDir,
    verbose: false,
    runCommand: "npm run",
    installCommand: "npm install",
  });

  const destScript = path.join(destDir, "script.sh");
  const destReadme = path.join(destDir, "readme.md");

  if (fs.existsSync(destScript)) {
    const destMode = fs.statSync(destScript).mode;
    assert.ok(
      !!(destMode & 0o111),
      "executable bit should be preserved on script.sh",
    );
  }

  if (fs.existsSync(destReadme)) {
    const destMode = fs.statSync(destReadme).mode;
    assert.ok(
      !(destMode & 0o111),
      "non-executable file should not have executable bit",
    );
  }

  safeRm(tmpDir);
});
