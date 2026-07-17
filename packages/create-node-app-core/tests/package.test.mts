import assert from "node:assert/strict";
import { test } from "node:test";
import { pathToFileURL } from "node:url";
import { tmpdir } from "node:os";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import path from "node:path";

import { loadPackages } from "../package.js";

const safeRm = (d: string) => {
  try {
    rmSync(d, { recursive: true, force: true });
  } catch {
    // ignore
  }
};

/**
 * Regression test for the bundler-stripped JSON import attribute.
 *
 * `importIfExists` used to load `package.json` via a dynamic `import()` with a
 * `with { type: "json" }` attribute. tsup/esbuild stripped the attribute in the
 * published `dist`, so on Node >= 20.10 the import threw and the surrounding
 * `try/catch` swallowed it — silently dropping every dependency declared in a
 * template's or extension's `package.json`.
 *
 * This test asserts that dependencies coming from a static `package.json`
 * (extension) and from a `package/index.js` module (template) are both present
 * in the merged, installable result.
 */
test("loadPackages merges dependencies from package.json and package/index.js", async () => {
  const root = mkdtempSync(path.join(tmpdir(), "cna-loadpkg-"));
  try {
    // Template exposes its manifest through package/index.js (resolved via require).
    const templateDir = path.join(root, "template");
    mkdirSync(path.join(templateDir, "package"), { recursive: true });
    writeFileSync(
      path.join(templateDir, "package", "index.js"),
      `module.exports = function resolvePackage(_setup, { appName }) {
        return {
          name: appName,
          scripts: { build: "tsc" },
          dependencies: { react: "^19.0.0" },
          devDependencies: { typescript: "^5.0.0" },
        };
      };\n`,
    );

    // Extension declares its dependencies through a static package.json.
    const extensionDir = path.join(root, "extension");
    mkdirSync(extensionDir, { recursive: true });
    writeFileSync(
      path.join(extensionDir, "package.json"),
      JSON.stringify({
        name: "example-extension",
        dependencies: { "@tanstack/react-query": "^5.0.0" },
        devDependencies: { vitest: "^3.0.0" },
      }),
    );

    const result = (await loadPackages({
      appName: "my-app",
      templatesOrExtensions: [
        { url: pathToFileURL(templateDir).toString() },
        { url: pathToFileURL(extensionDir).toString() },
      ],
    })) as { dependencies: string[]; devDependencies: string[] };

    assert.ok(
      result.dependencies.includes("react@^19.0.0"),
      "template dependency should be present",
    );
    assert.ok(
      result.dependencies.includes("@tanstack/react-query@^5.0.0"),
      "extension dependency from package.json should be merged (regression)",
    );
    assert.ok(
      result.devDependencies.includes("typescript@^5.0.0"),
      "template devDependency should be present",
    );
    assert.ok(
      result.devDependencies.includes("vitest@^3.0.0"),
      "extension devDependency from package.json should be merged (regression)",
    );
  } finally {
    safeRm(root);
  }
});
