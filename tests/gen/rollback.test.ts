import { describe, expect, it, vi } from 'vitest';

import { main } from '../../src/cli/main.js';
import type { BaseTree } from '../../src/plan/types.js';
import type { Io } from '../../src/run/io.js';
import { loadBaseTree } from '../fixtures/base-tree.js';

interface Recorder {
  io: Io;
  removed: string[];
  written: string[];
  commands: { command: string; args: string[] }[];
}

function fakeIo(options: { failOnCommand?: string; tree?: BaseTree } = {}): Recorder {
  const removed: string[] = [];
  const written: string[] = [];
  const commands: { command: string; args: string[] }[] = [];

  const io: Io = {
    async run(command, args) {
      commands.push({ command, args });
      if (options.failOnCommand && args.join(' ').includes(options.failOnCommand)) {
        throw new Error(`falha simulada em ${command} ${args.join(' ')}`);
      }
      return { exitCode: 0 };
    },
    async exists() {
      return false;
    },
    async writeFile(path) {
      written.push(path);
    },
    async remove(path) {
      removed.push(path);
    },
    async readTree() {
      return options.tree ?? loadBaseTree();
    },
  };

  return { io, removed, written, commands };
}

const ENV = { CI: 'true' } as NodeJS.ProcessEnv;

describe('rollback', () => {
  it('apaga a pasta criada quando um passo falha', async () => {
    const recorder = fakeIo({ failOnCommand: 'install' });

    const exitCode = await main(['demo', '--yes', '--no-git'], ENV, recorder.io);

    expect(exitCode).toBe(1);
    expect(recorder.removed.some((path) => path.endsWith('demo'))).toBe(true);
  });

  it('preserva a pasta com --keep-on-error', async () => {
    const recorder = fakeIo({ failOnCommand: 'install' });

    const exitCode = await main(['demo', '--yes', '--no-git', '--keep-on-error'], ENV, recorder.io);

    expect(exitCode).toBe(1);
    expect(recorder.removed.some((path) => path.endsWith('demo'))).toBe(false);
  });

  it('não apaga nada quando a falha acontece antes de criar a pasta', async () => {
    const recorder = fakeIo({ failOnCommand: 'create-vite' });

    const exitCode = await main(['demo', '--yes', '--no-git'], ENV, recorder.io);

    expect(exitCode).toBe(1);
    expect(recorder.removed).toEqual([]);
  });

  it('recusa nome inválido com código 2 e sem tocar no disco', async () => {
    const recorder = fakeIo();

    const exitCode = await main(['-invalido', '--yes'], ENV, recorder.io);

    expect(exitCode).toBe(2);
    expect(recorder.written).toEqual([]);
    expect(recorder.commands).toEqual([]);
  });

  it('recusa flag desconhecida com código 2', async () => {
    const recorder = fakeIo();

    const exitCode = await main(['demo', '--tailwing'], ENV, recorder.io);

    expect(exitCode).toBe(2);
    expect(recorder.commands).toEqual([]);
  });
});

describe('ordem do pipeline', () => {
  it('roda git init antes do install, senão o husky falha', async () => {
    const recorder = fakeIo();

    await main(['demo', '--yes', '--husky'], ENV, recorder.io);

    const gitInit = recorder.commands.findIndex(
      (entry) => entry.command === 'git' && entry.args[0] === 'init',
    );
    const install = recorder.commands.findIndex((entry) => entry.args.includes('install'));

    expect(gitInit).toBeGreaterThanOrEqual(0);
    expect(install).toBeGreaterThan(gitInit);
  });

  it('nunca passa flags inexistentes para o create-vite', async () => {
    const recorder = fakeIo();

    await main(['demo', '--yes', '--no-git', '--no-install'], ENV, recorder.io);

    const scaffold = recorder.commands[0];
    expect(scaffold?.args).toContain('--no-interactive');
    expect(scaffold?.args).not.toContain('--no-rolldown');
  });
});

vi.stubGlobal('console', { ...console, log: () => {} });
