import { execa } from 'execa';
import { existsSync } from 'node:fs';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { beforeAll, describe, expect, it, onTestFinished } from 'vitest';

const REPO_ROOT = fileURLToPath(new URL('../..', import.meta.url));
const CLI = join(REPO_ROOT, 'dist', 'index.js');

type PackageManager = 'npm' | 'pnpm';

const COMBINATIONS: { name: string; pm: PackageManager; flags: string[] }[] = [
  {
    name: 'tanstack',
    pm: 'npm',
    flags: ['--router=tanstack', '--query', '--forms', '--zustand', '--linter=eslint', '--vitest'],
  },
  {
    name: 'react-router',
    pm: 'npm',
    flags: ['--router=react-router', '--query', '--forms', '--zustand', '--vitest'],
  },
  {
    name: 'biome',
    pm: 'npm',
    flags: ['--router=tanstack', '--linter=biome', '--shadcn', '--forms', '--query', '--vitest'],
  },
  { name: 'shadcn', pm: 'npm', flags: ['--router=none', '--shadcn', '--forms', '--vitest'] },
  { name: 'full', pm: 'npm', flags: ['--preset=full'] },
  { name: 'pnpm-full', pm: 'pnpm', flags: ['--pm=pnpm', '--preset=full'] },
];

function scriptsFor(flags: string[]): string[] {
  const scripts = ['build', 'lint', 'format:check'];
  if (flags.includes('--vitest') || flags.includes('--preset=full')) scripts.push('test');
  return scripts;
}

function runScript(pm: PackageManager, script: string, cwd: string) {
  const args = pm === 'npm' ? ['run', '--silent', script] : ['--silent', script];
  return execa(pm, args, { cwd, reject: false, stdio: 'pipe' });
}

async function scaffold(flags: string[]): Promise<string> {
  const workspace = await mkdtemp(join(tmpdir(), 'anvil-e2e-'));
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
    '$name: o projeto gerado passa no próprio build, lint, formatação e testes',
    async ({ pm, flags }) => {
      const root = await scaffold(flags);

      for (const script of scriptsFor(flags)) {
        const result = await runScript(pm, script, root);
        expect(result.exitCode, `${script}:\n${result.stdout}\n${result.stderr}`).toBe(0);

        if (script === 'lint') {
          const complaints = [result.stdout, result.stderr]
            .flatMap((output) => output.split(/\r?\n/))
            .filter((line) => /\b(warning|error)\b/i.test(line));
          expect(complaints, 'o linter não deve reclamar do código gerado').toEqual([]);
        }
      }
    },
  );

  it('remove a pasta quando o scaffold falha no meio', async () => {
    const workspace = await mkdtemp(join(tmpdir(), 'anvil-e2e-'));
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
