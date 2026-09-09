import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import nock from 'nock';

import { getCnaOptions } from '../src/options.js';
import { loadFiles } from '@create-node-app/core';

nock('https://raw.githubusercontent.com')
  .get(/\/Create-Node-App\/cna-templates\/main\/templates.json/)
  .reply(200, { templates: [], extensions: [], categories: [] })
  .persist();

type Opts = Record<string, unknown>;

const makeTemplate = (initial: string): string => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cna-set-tpl-'));
  fs.writeFileSync(
    path.join(dir, 'cna.config.json'),
    JSON.stringify({
      customOptions: [{ name: 'srcDir', type: 'text', initial }],
    }),
  );
  return dir;
};

const resolveOpts = async (
  tplDir: string,
  setOverrides: Record<string, string> = {},
): Promise<Opts> =>
  (await getCnaOptions({
    projectName: 'x',
    interactive: false,
    template: `file://${tplDir}`,
    setOverrides,
  } as never)) as unknown as Opts;

test('--set srcDir=app overrides the template default', async () => {
  const tplDir = makeTemplate('src');
  try {
    const out = await resolveOpts(tplDir, { srcDir: 'app' });
    assert.equal(out.srcDir, 'app');
  } finally {
    fs.rmSync(tplDir, { recursive: true, force: true });
  }
});

test('template default applies when --set is absent', async () => {
  const tplDir = makeTemplate('src');
  try {
    const out = await resolveOpts(tplDir);
    assert.equal(out.srcDir, 'src');
  } finally {
    fs.rmSync(tplDir, { recursive: true, force: true });
  }
});

test('non-matching --set keys pass through into options', async () => {
  const tplDir = makeTemplate('src');
  try {
    const out = await resolveOpts(tplDir, { teamName: 'core' });
    assert.equal(out.teamName, 'core');
    assert.equal(out.srcDir, 'src');
  } finally {
    fs.rmSync(tplDir, { recursive: true, force: true });
  }
});

test('setOverrides do not leak as a nested object into options', async () => {
  const tplDir = makeTemplate('src');
  try {
    const out = await resolveOpts(tplDir, { srcDir: 'app' });
    assert.equal(out.setOverrides, undefined);
  } finally {
    fs.rmSync(tplDir, { recursive: true, force: true });
  }
});

test('--set srcDir flows through to [src] rendering', async () => {
  const tplDir = makeTemplate('src');
  const tplFiles = path.join(tplDir, 'template');
  fs.mkdirSync(path.join(tplFiles, '[src]'), { recursive: true });
  fs.writeFileSync(
    path.join(tplFiles, '[src]', 'main.ts.template'),
    'export const dir = "<%= srcDir %>";\n',
  );
  const destDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cna-set-out-'));
  try {
    const out = await resolveOpts(tplDir, { srcDir: 'app' });
    await loadFiles({
      root: destDir,
      templatesOrExtensions: [{ url: `file://${tplDir}` }],
      appName: 'demo',
      originalDirectory: destDir,
      verbose: false,
      srcDir: out.srcDir as string,
      runCommand: 'npm run',
      installCommand: 'npm install',
    });
    assert.equal(
      fs.readFileSync(path.join(destDir, 'app', 'main.ts'), 'utf8'),
      'export const dir = "app";\n',
    );
  } finally {
    fs.rmSync(tplDir, { recursive: true, force: true });
    fs.rmSync(destDir, { recursive: true, force: true });
  }
});
