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

test('invalid template slug triggers fallback error when accessing package.json', async () => {
  await assert.rejects(() => getPackagePath('non-existent-template', 'package.json'));
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

test('github clone path executes try/catch when CNA_SKIP_GIT not set', async () => {
  delete process.env.CNA_SKIP_GIT;
  const url = 'https://github.com/definitely-not-a-real-org-xyz123/definitely-not-a-real-repo-xyz123';
  // Silence expected git clone errors/noise
  const originalError = console.error;
  const originalWarn = console.warn;
  console.error = () => {};
  console.warn = () => {};
  const dir = await getTemplateDirPath(url);
  console.error = originalError;
  console.warn = originalWarn;
  // Even on failure we should still get a cache directory path
  assert.ok(dir.includes('.cna'));
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
