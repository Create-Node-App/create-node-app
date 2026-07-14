import { test } from 'node:test';
import assert from 'node:assert/strict';
import nock from 'nock';

import {
  getTemplateCategories,
  getTemplatesForCategory,
  getExtensionsGroupedByCategory,
  getAllTemplatesWithCategory,
  getAllExtensionsWithCategory,
} from '../src/templates.js';

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

const templatesHost = 'https://raw.githubusercontent.com';

nock(templatesHost)
  .get(/\/Create-Node-App\/cna-templates\/main\/templates.json/)
  .reply(200, mockData)
  .persist();

// Tests

test('getTemplateCategories returns category slugs', async () => {
  const categories = await getTemplateCategories();
  assert.ok(Array.isArray(categories));
  assert.ok(categories.includes('frontend'));
  assert.ok(categories.includes('backend'));
});

test('getTemplatesForCategory returns templates filtered by category', async () => {
  const templates = await getTemplatesForCategory('frontend');
  assert.equal(templates.length, 1);
  assert.ok(templates[0], 'first template exists');
  assert.equal(templates[0]!.slug, 'react-vite-boilerplate');
});

test('getExtensionsGroupedByCategory filters by type', async () => {
  const grouped = await getExtensionsGroupedByCategory(['react', 'all']);
  assert.ok(grouped.testing, 'testing category present');
  assert.ok(grouped.quality, 'quality category present');
});

test('getAllTemplatesWithCategory returns all templates sorted by catalog category order', async () => {
  const items = await getAllTemplatesWithCategory();
  assert.equal(items.length, 2);
  // Catalog order in the mock is frontend, backend — so frontend comes first.
  assert.equal(items[0]!.categorySlug, 'frontend');
  assert.equal(items[0]!.categoryName, 'Frontend');
  assert.equal(items[0]!.template.slug, 'react-vite-boilerplate');
  assert.equal(items[1]!.categorySlug, 'backend');
  assert.equal(items[1]!.categoryName, 'Backend');
});

test('getAllExtensionsWithCategory returns flat, category-tagged extensions for the given type', async () => {
  const items = await getAllExtensionsWithCategory(['react', 'all']);
  assert.ok(items.length >= 2, 'expected at least 2 extensions');
  // Each item should carry its category metadata.
  const eslint = items.find((i) => i.extension.slug === 'eslint');
  const jest = items.find((i) => i.extension.slug === 'jest');
  assert.ok(eslint, 'eslint extension present');
  assert.ok(jest, 'jest extension present');
  assert.equal(eslint!.categoryName, 'Quality');
  assert.equal(jest!.categoryName, 'Testing');
  // Sorted by catalog order (quality before testing in the mock).
  assert.ok(items.indexOf(eslint!) < items.indexOf(jest!));
});
