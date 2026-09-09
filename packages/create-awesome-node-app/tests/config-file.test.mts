import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import nock from 'nock';

import { getCnaOptions } from '../src/options.js';

nock('https://raw.githubusercontent.com')
  .get(/\/Create-Node-App\/cna-templates\/main\/templates.json/)
  .reply(200, { templates: [], extensions: [], categories: [] })
  .persist();

const makeTemplateDir = (initial: string): string => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cna-tpl-'));
  fs.writeFileSync(
    path.join(dir, 'cna.config.json'),
    JSON.stringify({
      customOptions: [{ name: 'srcDir', type: 'text', initial }],
    }),
  );
  return dir;
};

const makeExternalConfig = (initial: string): string => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cna-ext-'));
  const file = path.join(dir, 'team-cna.json');
  fs.writeFileSync(
    file,
    JSON.stringify({
      customOptions: [{ name: 'srcDir', type: 'text', initial }],
    }),
  );
  return file;
};

test('--config overrides template cna.config.json initials', async () => {
  const tplDir = makeTemplateDir('from-template');
  const extFile = makeExternalConfig('from-external');
  try {
    const out = (await getCnaOptions({
      projectName: 'x',
      interactive: false,
      template: `file://${tplDir}`,
      config: extFile,
    } as never)) as unknown as Record<string, unknown>;
    assert.equal(out.srcDir, 'from-external');
    assert.equal(out.config, undefined);
  } finally {
    fs.rmSync(tplDir, { recursive: true, force: true });
    fs.rmSync(path.dirname(extFile), { recursive: true, force: true });
  }
});

test('--set still wins over --config', async () => {
  const tplDir = makeTemplateDir('from-template');
  const extFile = makeExternalConfig('from-external');
  try {
    const out = (await getCnaOptions({
      projectName: 'x',
      interactive: false,
      template: `file://${tplDir}`,
      config: extFile,
      setOverrides: { srcDir: 'from-set' },
    } as never)) as unknown as Record<string, unknown>;
    assert.equal(out.srcDir, 'from-set');
  } finally {
    fs.rmSync(tplDir, { recursive: true, force: true });
    fs.rmSync(path.dirname(extFile), { recursive: true, force: true });
  }
});

test('missing --config path fails fast with an actionable error', async () => {
  const tplDir = makeTemplateDir('from-template');
  try {
    await assert.rejects(
      () =>
        getCnaOptions({
          projectName: 'x',
          interactive: false,
          template: `file://${tplDir}`,
          config: '/tmp/definitely-not-here-cna/config.json',
        } as never),
      /does not exist/,
    );
  } finally {
    fs.rmSync(tplDir, { recursive: true, force: true });
  }
});
