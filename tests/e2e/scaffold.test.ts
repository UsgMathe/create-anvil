import { execa } from 'execa';
import { existsSync } from 'node:fs';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { beforeAll, describe, expect, it, onTestFinished } from 'vitest';

const REPO_ROOT = fileURLToPath(new URL('../..', import.meta.url));
const CLI = join(REPO_ROOT, 'dist', 'index.js');

const COMBINATIONS = [
  { name: 'tanstack', flags: ['--router=tanstack', '--query', '--linter=eslint', '--vitest'] },
  { name: 'react-router', flags: ['--router=react-router', '--query', '--linter=oxlint'] },
  { name: 'biome', flags: ['--router=none', '--linter=biome'] },
  { name: 'shadcn', flags: ['--router=none', '--linter=oxlint', '--shadcn'] },
];

async function scaffold(flags: string[]): Promise<string> {
  const workspace = await mkdtemp(join(tmpdir(), 'cvrtw-e2e-'));
  onTestFinished(async () => {
    await rm(workspace, { recursive: true, force: true, maxRetries: 3 });
  });

  await execa('node', [CLI, 'app', '--yes', ...flags, '--no-git'], {
    cwd: workspace,
    stdio: 'pipe',
  });

  return join(workspace, 'app');
}

describe('scaffold de verdade', () => {
  beforeAll(() => {
    if (!existsSync(CLI)) {
      throw new Error('dist/index.js não existe — rode `npm run build` antes do test:e2e.');
    }
  });

  it.each(COMBINATIONS)(
    '$name: o projeto gerado passa no próprio build e lint',
    async ({ flags }) => {
      const root = await scaffold(flags);

      const build = await execa('npm', ['run', 'build'], {
        cwd: root,
        reject: false,
        stdio: 'pipe',
      });
      expect(build.exitCode, build.stderr).toBe(0);

      const lint = await execa('npm', ['run', 'lint'], { cwd: root, reject: false, stdio: 'pipe' });
      expect(lint.exitCode, lint.stdout).toBe(0);
    },
  );

  it('o preset completo passa em build, lint e test', async () => {
    const root = await scaffold(['--preset=full']);

    for (const script of ['build', 'lint', 'test']) {
      const result = await execa('npm', ['run', script], {
        cwd: root,
        reject: false,
        stdio: 'pipe',
      });
      expect(result.exitCode, `${script}: ${result.stderr || result.stdout}`).toBe(0);
    }
  });

  it('remove a pasta quando o scaffold falha no meio', async () => {
    const workspace = await mkdtemp(join(tmpdir(), 'cvrtw-e2e-'));
    onTestFinished(async () => {
      await rm(workspace, { recursive: true, force: true, maxRetries: 3 });
    });

    const result = await execa('node', [CLI, 'app', '--yes', '--pm=bun', '--no-git'], {
      cwd: workspace,
      reject: false,
      stdio: 'pipe',
      env: { PATH: '' },
    });

    expect(result.exitCode).not.toBe(0);
    expect(existsSync(join(workspace, 'app'))).toBe(false);
  });
});
