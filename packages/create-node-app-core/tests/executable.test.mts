import assert from 'node:assert/strict';
import { test } from 'node:test';

import { resolveExecutable } from '../executable.js';

test('resolveExecutable appends .cmd on Windows', () => {
  const realPlatform = Object.getOwnPropertyDescriptor(process, 'platform');
  try {
    Object.defineProperty(process, 'platform', { value: 'win32' });
    assert.equal(resolveExecutable('npm'), 'npm.cmd');
  } finally {
    if (realPlatform) Object.defineProperty(process, 'platform', realPlatform);
  }
});

test('resolveExecutable keeps executable name on non-Windows platforms', () => {
  const realPlatform = Object.getOwnPropertyDescriptor(process, 'platform');
  try {
    Object.defineProperty(process, 'platform', { value: 'linux' });
    assert.equal(resolveExecutable('pnpm'), 'pnpm');
  } finally {
    if (realPlatform) Object.defineProperty(process, 'platform', realPlatform);
  }
});
