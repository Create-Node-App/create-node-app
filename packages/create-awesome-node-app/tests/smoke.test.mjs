import { execSync } from 'node:child_process';
import { mkdtempSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

// Resolve CLI bin relative to this test file, not the repository root
const __dirname = dirname(fileURLToPath(import.meta.url));
const packageRoot = join(__dirname, '..');
const cliBin = join(packageRoot, 'index.js');

// Ensure build output exists; build on-the-fly if missing
try {
  if (!existsSync(join(packageRoot, 'dist', 'index.cjs'))) {
    execSync('npm run build', { cwd: packageRoot, stdio: 'inherit' });
  }
} catch (e) {
  console.error('Failed to build package before smoke test:', e);
  process.exit(1);
}

function run(cmd, opts = {}) {
  return execSync(cmd, { stdio: 'pipe', encoding: 'utf8', ...opts });
}

const tmp = mkdtempSync(join(tmpdir(), 'cna-smoke-'));

try {
  const projectDir = join(tmp, 'example-app');
  const out = run(
    `node ${cliBin} ${projectDir} --no-install --template react-vite-boilerplate --verbose`,
    { cwd: packageRoot }
  );
  console.log(out);
  if (!existsSync(projectDir)) {
    throw new Error('Project directory was not created');
  }
  // Assert key scaffolded files exist
  const expectedFiles = [
    'README.md',
    'tsconfig.json',
    'index.html',
    'eslint.config.mjs',
    'src/App.tsx',
    'src/main.tsx'
  ];
  const missing = expectedFiles.filter(f => !existsSync(join(projectDir, f)));
  if (missing.length) {
    throw new Error('Missing expected scaffold files: ' + missing.join(', '));
  }
  console.log('Smoke test passed');
} catch (err) {
  console.error('Smoke test failed:', err.message);
  process.exitCode = 1;
} finally {
  rmSync(tmp, { recursive: true, force: true });
}
