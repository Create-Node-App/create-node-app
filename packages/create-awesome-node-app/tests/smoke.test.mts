import { execSync } from 'node:child_process';
import { mkdtempSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const packageRoot = join(__dirname, '..');
const cliBin = join(packageRoot, 'index.js');

// Allow CI coverage runs to skip the smoke test when real git/template downloads are disabled
if (process.env.CNA_SKIP_GIT === '1' || process.env.SKIP_SMOKE === '1') {
  console.log('[smoke] Skipping smoke test because CNA_SKIP_GIT or SKIP_SMOKE is set');
  process.exit(0);
}

try {
  if (!existsSync(join(packageRoot, 'dist', 'index.cjs'))) {
    execSync('npm run build', { cwd: packageRoot, stdio: 'inherit' });
  }
} catch (e) {
  console.error('Failed to build package before smoke test:', (e as Error).message);
  process.exit(1);
}

function run(cmd: string, opts: Record<string, unknown> = {}) { return execSync(cmd, { stdio: 'pipe', encoding: 'utf8', ...opts }); }

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
  console.error('Smoke test failed:', (err as Error).message);
  process.exitCode = 1;
} finally {
  rmSync(tmp, { recursive: true, force: true });
}
