import { test } from 'node:test';
import assert from 'node:assert/strict';
import nock from 'nock';

import { listTemplates, listAddons } from '../src/list.js';

const mockData = {
  templates: [
    { name: 'React Vite', slug: 'react-vite-boilerplate', description: 'React + Vite starter', url: 'https://example.com/react', category: 'frontend', labels: ['react'], type: 'react' },
    { name: 'Nest API', slug: 'nest-api', description: 'Nest starter', url: 'https://example.com/nest', category: 'backend', labels: ['nest'], type: 'nest' }
  ],
  extensions: [
    { name: 'ESLint', slug: 'eslint', description: 'ESLint preset', url: 'https://example.com/eslint', category: 'quality', labels: ['lint'], type: ['all'] },
    { name: 'Jest', slug: 'jest', description: 'Jest setup', url: 'https://example.com/jest', category: 'testing', labels: ['test'], type: ['react', 'all'] }
  ],
  categories: [
    { slug: 'frontend', name: 'Frontend', description: 'Frontend templates', details: '', labels: [] },
    { slug: 'backend', name: 'Backend', description: 'Backend templates', details: '', labels: [] },
    { slug: 'quality', name: 'Quality', description: 'Quality addons', details: '', labels: [] },
    { slug: 'testing', name: 'Testing', description: 'Testing addons', details: '', labels: [] }
  ]
};

nock('https://raw.githubusercontent.com')
  .get(/\/Create-Node-App\/cna-templates\/main\/templates.json/)
  .reply(200, mockData)
  .persist();

const captureLog = async (fn: () => Promise<void>): Promise<string[]> => {
  const lines: string[] = [];
  const original = console.log;
  console.log = (...args: unknown[]) => {
    lines.push(args.map(String).join(' '));
  };
  try {
    await fn();
  } finally {
    console.log = original;
  }
  return lines;
};

test('listTemplates --json prints parseable JSON grouped by category', async () => {
  const lines = await captureLog(() => listTemplates({ json: true }));
  const parsed = JSON.parse(lines.join('\n')) as {
    templates: Array<{ slug: string; templates: Array<{ slug: string }> }>;
  };
  assert.ok(Array.isArray(parsed.templates));
  const frontend = parsed.templates.find((g) => g.slug === 'frontend');
  assert.ok(frontend, 'frontend group present');
  assert.equal(frontend!.templates[0]!.slug, 'react-vite-boilerplate');
});

test('listTemplates human output still lists templates', async () => {
  const lines = await captureLog(() => listTemplates());
  assert.ok(lines.join('\n').includes('Available Templates'));
  assert.ok(lines.join('\n').includes('react-vite-boilerplate'));
});

test('listAddons --json prints parseable JSON with extensions', async () => {
  const lines = await captureLog(() => listAddons({ json: true }));
  const parsed = JSON.parse(lines.join('\n')) as {
    addons: Array<{ slug: string; extensions: Array<{ slug: string }> }>;
  };
  assert.ok(Array.isArray(parsed.addons));
  const slugs = parsed.addons.flatMap((g) => g.extensions.map((e) => e.slug));
  assert.ok(slugs.includes('eslint'));
  assert.ok(slugs.includes('jest'));
});

test('listAddons --json echoes the template filter slug', async () => {
  const lines = await captureLog(() =>
    listAddons({ templateSlug: 'react-vite-boilerplate', json: true }),
  );
  const parsed = JSON.parse(lines.join('\n')) as { templateSlug?: string };
  assert.equal(parsed.templateSlug, 'react-vite-boilerplate');
});
