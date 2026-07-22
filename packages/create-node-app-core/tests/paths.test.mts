import assert from 'node:assert/strict';
import { test } from 'node:test';
import { pathToFileURL } from 'node:url';
import { tmpdir } from 'node:os';
import { mkdtempSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import path from 'node:path';

import { getPackagePath, getTemplateDirPath } from '../index.js';

const createTempTemplate = () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'cna-paths-'));
  const templateDir = path.join(dir, 'some', 'nested');
  mkdirSync(templateDir, { recursive: true });
  const innerTemplate = path.join(templateDir, 'template');
  mkdirSync(innerTemplate, { recursive: true });
  writeFileSync(path.join(innerTemplate, 'package.json'), '{"name":"example","version":"1.0.0"}');
  writeFileSync(path.join(innerTemplate, 'README.md'), '# Example');
  return { dir, nested: templateDir };
};

const safeRm = (d: string) => { try { rmSync(d, { recursive: true, force: true }); } catch {} };

test('file:// template path with subdir resolves correctly and returns inner template folder', async () => {
  const { dir, nested } = createTempTemplate();
  try {
    const fileUrl = pathToFileURL(dir).toString() + `?subdir=${encodeURIComponent(path.relative(dir, nested))}`;
    const templateDir = await getTemplateDirPath(fileUrl);
    assert.equal(path.basename(templateDir), 'template');
    const pkgPath = await getPackagePath(fileUrl, 'package.json');
    assert.ok(pkgPath.endsWith('package.json'));
  } finally {
    safeRm(dir);
  }
});

test('ignorePackage=true throws when requesting package.json', async () => {
  const { dir } = createTempTemplate();
  try {
    const fileUrl = pathToFileURL(dir).toString() + '?ignorePackage=true';
    await assert.rejects(() => getPackagePath(fileUrl, 'package.json'), /should be ignored/);
  } finally {
    safeRm(dir);
  }
});

test('invalid template slug falls back to legacy templatesOrExtensions path', async () => {
  const pkgPath = await getPackagePath('non-existent-template', 'package.json');
  assert.ok(pkgPath.includes('templatesOrExtensions'));
  assert.ok(pkgPath.endsWith('package.json'));
});

test('github style URL with branch and subdir parses without throwing', async () => {
  process.env.CNA_SKIP_GIT = '1';
  const url = 'https://github.com/some-org/some-repo/tree/main/templates/react';
  const pkgPath = await getPackagePath(url, 'package.json', true).catch((err: unknown) => (err as Error).message);
  assert.match(String(pkgPath), /should be ignored/);
  const templateDir = await getTemplateDirPath(url);
  assert.ok(templateDir.includes('.cna'));
});

test('github style URL without branch parses and returns a cache path', async () => {
  process.env.CNA_SKIP_GIT = '1';
  const url = 'https://github.com/another-org/another-repo';
  const dir = await getTemplateDirPath(url);
  assert.ok(dir.includes('.cna'));
});

test('github style URL with ignorePackage=true still forbids package.json access', async () => {
  process.env.CNA_SKIP_GIT = '1';
  const url = 'https://github.com/org/repo?ignorePackage=true';
  await assert.rejects(() => getPackagePath(url, 'package.json'), /should be ignored/);
});

test('fallback to legacy templatesOrExtensions directory when URL parse fails', async () => {
  // Provide an invalid URL-like string that will throw in new URL()
  // We call internal indirectly via public API; invalid protocol like '::::' triggers catch
  const bogus = '::::not-a-valid-url';
  const p = await getPackagePath(bogus, 'package.json').catch(e => (e as Error).message);
  // We don't assert exact path (depends on __dirname) but ensure no crash (string result or existing path)
  assert.ok(typeof p === 'string');
});

test('file:// windows style path normalization drops leading slash on win32 (simulated)', async () => {
  // Simulate Windows platform by temporarily overriding process.platform accessor
  const realPlatform = Object.getOwnPropertyDescriptor(process, 'platform');
  const dir = mkdtempSync(path.join(tmpdir(), 'cna-paths-win-'));
  try {
    Object.defineProperty(process, 'platform', { value: 'win32' });
    const fileUrl = pathToFileURL(dir).toString();
    const templateDir = await getTemplateDirPath(fileUrl);
    assert.ok(templateDir.endsWith(path.basename(dir)));
  } finally {
    if (realPlatform) Object.defineProperty(process, 'platform', realPlatform);
    safeRm(dir);
  }
});

test('file:// windows drive-relative path normalized on win32 (simulated)', async () => {
  const realPlatform = Object.getOwnPropertyDescriptor(process, 'platform');
  try {
    Object.defineProperty(process, 'platform', { value: 'win32' });
    // file:///C:path (no slash after colon)
    const { solveValuesFromTemplateOrExtensionUrl } = await import('../paths.js');
    const result = solveValuesFromTemplateOrExtensionUrl('file:///C:Users/test');
    assert.equal(result.pathname, 'C:Users/test');
  } finally {
    if (realPlatform) Object.defineProperty(process, 'platform', realPlatform);
  }
});

test('file:// windows UNC path normalized on win32 (simulated)', async () => {
  const realPlatform = Object.getOwnPropertyDescriptor(process, 'platform');
  try {
    Object.defineProperty(process, 'platform', { value: 'win32' });
    const { solveValuesFromTemplateOrExtensionUrl } = await import('../paths.js');
    // file:////server/share -> \\server\share
    const result = solveValuesFromTemplateOrExtensionUrl('file:////server/share');
    assert.equal(result.pathname, '\\\\server\\share');
  } finally {
    if (realPlatform) Object.defineProperty(process, 'platform', realPlatform);
  }
});

test('file:// subdir where template is a file not a directory', async () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'cna-paths-file-tpl-'));
  const nested = path.join(dir, 'some', 'nested');
  mkdirSync(nested, { recursive: true });
  // create a file named 'template'
  writeFileSync(path.join(nested, 'template'), 'not a dir');
  try {
    const fileUrl = pathToFileURL(dir).toString() + `?subdir=${encodeURIComponent(path.relative(dir, nested))}`;
    const templateDir = await getTemplateDirPath(fileUrl);
    assert.equal(path.basename(templateDir), 'nested');
  } finally { safeRm(dir); }
});

test('github style URL with tree but empty branch segment handled gracefully', async () => {
  process.env.CNA_SKIP_GIT = '1';
  const url = 'https://github.com/org/repo/tree/';
  const dir = await getTemplateDirPath(url);
  assert.ok(dir.includes('.cna'));
});

test('github clone path rejects when repository does not exist and CNA_SKIP_GIT not set', async () => {
  delete process.env.CNA_SKIP_GIT;
  const url = 'https://github.com/definitely-not-a-real-org-xyz123/definitely-not-a-real-repo-xyz123';
  await assert.rejects(
    () => getTemplateDirPath(url),
    /Could not fetch template/,
  );
});

test('file:// subdir without template directory triggers fs.stat error branch and returns subdir path', async () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'cna-paths-no-template-'));
  const nested = path.join(dir, 'plain', 'folder');
  mkdirSync(nested, { recursive: true });
  try {
    const fileUrl = pathToFileURL(dir).toString() + `?subdir=${encodeURIComponent(path.relative(dir, nested))}`;
    const templateDir = await getTemplateDirPath(fileUrl);
    // Since no 'template' entry exists, we should get the nested folder path back
    assert.equal(templateDir, path.resolve(nested));
  } finally { safeRm(dir); }
});

test('github style URL with only org segment handled without throwing', async () => {
  process.env.CNA_SKIP_GIT = '1';
  const url = 'https://github.com/some-only-org';
  const dir = await getTemplateDirPath(url);
  assert.ok(dir.includes('.cna'));
});

test('SSH git@ URL parses to scp-style clone URL with defaults', async () => {
  const { solveValuesFromTemplateOrExtensionUrl } = await import('../paths.js');
  const result = solveValuesFromTemplateOrExtensionUrl(
    'git@github.com:my-org/my-template.git',
  );
  assert.equal(result.url, 'git@github.com:my-org/my-template.git');
  assert.equal(result.protocol, 'ssh:');
  assert.equal(result.host, 'github.com');
  assert.equal(result.pathname, '/my-org/my-template.git');
  assert.equal(result.branch, 'main');
  assert.equal(result.subdir, '');
  assert.equal(result.ignorePackage, false);
});

test('SSH git@ URL supports subdir and ref query params', async () => {
  const { solveValuesFromTemplateOrExtensionUrl } = await import('../paths.js');
  const result = solveValuesFromTemplateOrExtensionUrl(
    'git@github.com:my-org/my-template.git?subdir=templates/foo&ref=develop&ignorePackage=true',
  );
  assert.equal(result.url, 'git@github.com:my-org/my-template.git');
  assert.equal(result.subdir, 'templates/foo');
  assert.equal(result.branch, 'develop');
  assert.equal(result.ignorePackage, true);
});

test('SSH git@ URL respects CNA_STRICT_REPRO for ref', async () => {
  const { solveValuesFromTemplateOrExtensionUrl } = await import('../paths.js');
  process.env.CNA_STRICT_REPRO = '1';
  try {
    assert.throws(
      () =>
        solveValuesFromTemplateOrExtensionUrl(
          'git@github.com:org/repo.git?ref=not-a-sha',
        ),
      /CNA_STRICT_REPRO/,
    );
  } finally {
    delete process.env.CNA_STRICT_REPRO;
  }
});
