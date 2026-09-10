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

test("loadFiles preserves file permissions on copied files", { skip: process.platform === "win32" }, async () => {
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

type LoadFilesFn = (opts: Record<string, unknown>) => Promise<void>;

const loadFilesFrom = async (): Promise<LoadFilesFn> => {
  const loadersModule = await import("../loaders.js");
  return (loadersModule as { loadFiles: LoadFilesFn }).loadFiles;
};

const makeFixture = (files: Record<string, string | Buffer>): string => {
  const tmpDir = mkdtempSync(path.join(tmpdir(), "cna-loaders-"));
  for (const [rel, content] of Object.entries(files)) {
    const full = path.join(tmpDir, rel);
    mkdirSync(path.dirname(full), { recursive: true });
    writeFileSync(full, content);
  }
  return tmpDir;
};

const scaffold = async (
  templateDir: string,
  extra: Record<string, unknown> = {},
): Promise<string> => {
  const loadFiles = await loadFilesFrom();
  const destDir = mkdtempSync(path.join(tmpdir(), "cna-loaders-out-"));
  try {
    await loadFiles({
      root: destDir,
      templatesOrExtensions: [
        { url: pathToFileURL(templateDir).toString() },
      ],
      appName: "demo-app",
      originalDirectory: destDir,
      verbose: false,
      srcDir: "src",
      runCommand: "npm run",
      installCommand: "npm install",
      ...extra,
    });
  } catch (err) {
    safeRm(destDir);
    throw err;
  }
  return destDir;
};

test("copyLoader copies plain files as-is", async () => {
  const tpl = makeFixture({ "notes.txt": "just text\n" });
  const out = await scaffold(tpl);
  try {
    assert.equal(fs.readFileSync(path.join(out, "notes.txt"), "utf8"), "just text\n");
  } finally {
    safeRm(tpl);
    safeRm(out);
  }
});

test("copyLoader copies empty files", async () => {
  const tpl = makeFixture({ "empty.txt": "" });
  const out = await scaffold(tpl);
  try {
    const p = path.join(out, "empty.txt");
    assert.ok(fs.existsSync(p));
    assert.equal(fs.statSync(p).size, 0);
  } finally {
    safeRm(tpl);
    safeRm(out);
  }
});

test("copyLoader copies binary files byte-identical", async () => {
  const bytes = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x00, 0xff, 0xfe, 0x00, 0x01]);
  const tpl = makeFixture({ "logo.png": bytes });
  const out = await scaffold(tpl);
  try {
    assert.deepEqual(fs.readFileSync(path.join(out, "logo.png")), bytes);
  } finally {
    safeRm(tpl);
    safeRm(out);
  }
});

test("copyTemplate interpolates projectName, srcDir and custom options", async () => {
  const tpl = makeFixture({
    "greet.txt.template": "app=<%= projectName %> dir=<%= srcDir %> opt=<%= team %>",
  });
  const out = await scaffold(tpl, { team: "core" });
  try {
    assert.equal(
      fs.readFileSync(path.join(out, "greet.txt"), "utf8"),
      "app=demo-app dir=src opt=core",
    );
  } finally {
    safeRm(tpl);
    safeRm(out);
  }
});

test("copyTemplate renders unicode and special characters", async () => {
  const tpl = makeFixture({
    "i18n.txt.template": "héllo wörld <%= projectName %> — © ✓",
  });
  const out = await scaffold(tpl);
  try {
    assert.equal(
      fs.readFileSync(path.join(out, "i18n.txt"), "utf8"),
      "héllo wörld demo-app — © ✓",
    );
  } finally {
    safeRm(tpl);
    safeRm(out);
  }
});

test("copyTemplate with null custom option renders empty string", async () => {
  const tpl = makeFixture({ "n.txt.template": "v=<%= maybeNull %>" });
  const out = await scaffold(tpl, { maybeNull: null });
  try {
    assert.equal(fs.readFileSync(path.join(out, "n.txt"), "utf8"), "v=");
  } finally {
    safeRm(tpl);
    safeRm(out);
  }
});

test("copyTemplate with missing variable rejects", async () => {
  const tpl = makeFixture({ "bad.txt.template": "v=<%= noSuchVar %>" });
  let out = "";
  try {
    out = await scaffold(tpl);
    assert.fail("expected loadFiles to reject on missing template variable");
  } catch (err) {
    assert.ok(err instanceof Error);
  } finally {
    safeRm(tpl);
    if (out) safeRm(out);
  }
});

test("appendLoader appends to an existing file", async () => {
  const tpl = makeFixture({ "data.txt.append": "second\n" });
  const loadFiles = await loadFilesFrom();
  const destDir = mkdtempSync(path.join(tmpdir(), "cna-loaders-out-"));
  try {
    writeFileSync(path.join(destDir, "data.txt"), "first\n");
    await loadFiles({
      root: destDir,
      templatesOrExtensions: [{ url: pathToFileURL(tpl).toString() }],
      appName: "demo-app",
      originalDirectory: destDir,
      verbose: false,
      srcDir: "src",
      runCommand: "npm run",
      installCommand: "npm install",
    });
    await loadFiles({
      root: destDir,
      templatesOrExtensions: [{ url: pathToFileURL(tpl).toString() }],
      appName: "demo-app",
      originalDirectory: destDir,
      verbose: false,
      srcDir: "src",
      runCommand: "npm run",
      installCommand: "npm install",
    });
    assert.equal(
      fs.readFileSync(path.join(destDir, "data.txt"), "utf8"),
      "first\nsecond\nsecond\n",
    );
  } finally {
    safeRm(tpl);
    safeRm(destDir);
  }
});

test("appendLoader creates the destination file when missing", async () => {
  const tpl = makeFixture({ "fresh.txt.append": "created\n" });
  const out = await scaffold(tpl);
  try {
    assert.equal(fs.readFileSync(path.join(out, "fresh.txt"), "utf8"), "created\n");
  } finally {
    safeRm(tpl);
    safeRm(out);
  }
});

test("appendTemplate renders variables then appends", async () => {
  const tpl = makeFixture({ "log.txt.append.template": "[<%= projectName %>]\n" });
  const loadFiles = await loadFilesFrom();
  const destDir = mkdtempSync(path.join(tmpdir(), "cna-loaders-out-"));
  const url = pathToFileURL(tpl).toString();
  const opts = {
    root: destDir,
    templatesOrExtensions: [{ url }],
    appName: "demo-app",
    originalDirectory: destDir,
    verbose: false,
    srcDir: "src",
    runCommand: "npm run",
    installCommand: "npm install",
  };
  try {
    await loadFiles(opts);
    await loadFiles(opts);
    assert.equal(
      fs.readFileSync(path.join(destDir, "log.txt"), "utf8"),
      "[demo-app]\n[demo-app]\n",
    );
  } finally {
    safeRm(tpl);
    safeRm(destDir);
  }
});

test("[src] token resolves to the configured srcDir", async () => {
  const tpl = makeFixture({ "[src]/app.ts": "export const x = 1;\n" });
  const out = await scaffold(tpl, { srcDir: "app" });
  try {
    assert.equal(
      fs.readFileSync(path.join(out, "app", "app.ts"), "utf8"),
      "export const x = 1;\n",
    );
    assert.ok(!fs.existsSync(path.join(out, "[src]")));
  } finally {
    safeRm(tpl);
    safeRm(out);
  }
});

test("[src] token with srcDir '.' lands in the project root", async () => {
  const tpl = makeFixture({ "[src]/root.ts": "export const y = 2;\n" });
  const out = await scaffold(tpl, { srcDir: "." });
  try {
    assert.equal(
      fs.readFileSync(path.join(out, "root.ts"), "utf8"),
      "export const y = 2;\n",
    );
  } finally {
    safeRm(tpl);
    safeRm(out);
  }
});

test("package-manager suffix files are filtered per manager", async () => {
  const tpl = makeFixture({
    "tool.if-npm": "npm tool\n",
    "tool.if-yarn": "yarn tool\n",
    "plain.txt": "plain\n",
  });
  const npmOut = await scaffold(tpl);
  try {
    assert.equal(fs.readFileSync(path.join(npmOut, "tool"), "utf8"), "npm tool\n");
    assert.ok(!fs.existsSync(path.join(npmOut, "tool.if-yarn")));
    assert.equal(fs.readFileSync(path.join(npmOut, "plain.txt"), "utf8"), "plain\n");
  } finally {
    safeRm(npmOut);
  }
  const yarnOut = await scaffold(tpl, { useYarn: true });
  try {
    assert.equal(fs.readFileSync(path.join(yarnOut, "tool"), "utf8"), "yarn tool\n");
    assert.ok(!fs.existsSync(path.join(yarnOut, "tool.if-npm")));
  } finally {
    safeRm(tpl);
    safeRm(yarnOut);
  }
});

test("empty template directory scaffolds nothing and does not throw", async () => {
  const tpl = makeFixture({});
  const out = await scaffold(tpl);
  try {
    assert.deepEqual(fs.readdirSync(out), []);
  } finally {
    safeRm(tpl);
    safeRm(out);
  }
});

test("verbose mode logs discovery without changing output", async () => {
  const tpl = makeFixture({ "v.txt": "v\n" });
  const loadFiles = await loadFilesFrom();
  const destDir = mkdtempSync(path.join(tmpdir(), "cna-loaders-out-"));
  const lines: string[] = [];
  const original = console.log;
  console.log = (...args: unknown[]) => {
    lines.push(args.map(String).join(" "));
  };
  try {
    await loadFiles({
      root: destDir,
      templatesOrExtensions: [{ url: pathToFileURL(tpl).toString() }],
      appName: "demo-app",
      originalDirectory: destDir,
      verbose: true,
      srcDir: "src",
      runCommand: "npm run",
      installCommand: "npm install",
    });
  } finally {
    console.log = original;
  }
  try {
    assert.equal(fs.readFileSync(path.join(destDir, "v.txt"), "utf8"), "v\n");
    assert.ok(lines.some((l) => l.includes("file operations")));
  } finally {
    safeRm(tpl);
    safeRm(destDir);
  }
});

test("pnpm and bun suffix filtering", async () => {
  const tpl = makeFixture({
    "tool.if-pnpm": "pnpm tool\n",
    "tool.if-bun": "bun tool\n",
  });
  const pnpmOut = await scaffold(tpl, { usePnpm: true });
  try {
    assert.equal(fs.readFileSync(path.join(pnpmOut, "tool"), "utf8"), "pnpm tool\n");
    assert.ok(!fs.existsSync(path.join(pnpmOut, "tool.if-bun")));
  } finally {
    safeRm(pnpmOut);
  }
  const bunOut = await scaffold(tpl, { useBun: true });
  try {
    assert.equal(fs.readFileSync(path.join(bunOut, "tool"), "utf8"), "bun tool\n");
    assert.ok(!fs.existsSync(path.join(bunOut, "tool.if-pnpm")));
  } finally {
    safeRm(tpl);
    safeRm(bunOut);
  }
});

test("offline/cache/refresh options pass through for file URLs", async () => {
  const tpl = makeFixture({ "o.txt": "o\n" });
  const cacheDir = mkdtempSync(path.join(tmpdir(), "cna-loaders-cache-"));
  const out = await scaffold(tpl, {
    offline: true,
    cacheDir,
    refresh: "manual",
    refreshAfterHours: 1,
  });
  try {
    assert.equal(fs.readFileSync(path.join(out, "o.txt"), "utf8"), "o\n");
  } finally {
    safeRm(tpl);
    safeRm(out);
    safeRm(cacheDir);
  }
});

test(
  "unreadable source file rejects with an aggregated error",
  { skip: process.platform === "win32" },
  async () => {
    const tpl = makeFixture({ "locked.txt": "nope\n" });
    const locked = path.join(tpl, "locked.txt");
    fs.chmodSync(tpl, 0o555);
    fs.chmodSync(locked, 0o000);
    let out = "";
    try {
      out = await scaffold(tpl);
      assert.fail("expected loadFiles to reject on unreadable source");
    } catch (err) {
      assert.match(String((err as Error).message), /Failed to copy/);
    } finally {
      fs.chmodSync(locked, 0o644);
      fs.chmodSync(tpl, 0o755);
      safeRm(tpl);
      if (out) safeRm(out);
    }
  },
);

test("default srcDir applies when omitted", async () => {
  const tpl = makeFixture({ "[src]/d.ts": "export const d = 1;\n" });
  const loadFiles = await loadFilesFrom();
  const destDir = mkdtempSync(path.join(tmpdir(), "cna-loaders-out-"));
  try {
    await loadFiles({
      root: destDir,
      templatesOrExtensions: [{ url: pathToFileURL(tpl).toString() }],
      appName: "demo-app",
      originalDirectory: destDir,
      verbose: false,
      runCommand: "npm run",
      installCommand: "npm install",
    });
    assert.equal(
      fs.readFileSync(path.join(destDir, "src", "d.ts"), "utf8"),
      "export const d = 1;\n",
    );
  } finally {
    safeRm(tpl);
    safeRm(destDir);
  }
});

test("extension bank-only root files never overwrite the template README", async () => {
  const tpl = makeFixture({ "README.md": "# Template\n" });
  const ext = makeFixture({
    "README.md": "# Bank docs (must not leak)\n",
    "LICENSE.md": "bank license\n",
    "docs/notes.md": "keep me\n",
  });
  const loadFiles = await loadFilesFrom();
  const destDir = mkdtempSync(path.join(tmpdir(), "cna-loaders-out-"));
  try {
    await loadFiles({
      root: destDir,
      templatesOrExtensions: [
        { url: pathToFileURL(tpl).toString() },
        { url: pathToFileURL(ext).toString() },
      ],
      appName: "demo-app",
      originalDirectory: destDir,
      verbose: false,
      runCommand: "npm run",
      installCommand: "npm install",
    });
    assert.equal(
      fs.readFileSync(path.join(destDir, "README.md"), "utf8"),
      "# Template\n",
    );
    assert.equal(
      fs.readFileSync(path.join(destDir, "docs", "notes.md"), "utf8"),
      "keep me\n",
    );
    assert.ok(!fs.existsSync(path.join(destDir, "LICENSE.md")));
  } finally {
    safeRm(tpl);
    safeRm(ext);
    safeRm(destDir);
  }
});
