import { describe, expect, it } from 'vitest';

import { parseCliArgs } from '../../../src/cli/args.js';
import type { Prompter } from '../../../src/cli/prompts.js';
import { resolveSelection } from '../../../src/cli/resolve.js';

const refusingPrompter: Prompter = {
  text: () => Promise.reject(new Error('não deveria perguntar')),
  confirm: () => Promise.reject(new Error('não deveria perguntar')),
  select: () => Promise.reject(new Error('não deveria perguntar')),
};

function resolve(argv: string[]) {
  return resolveSelection({
    args: parseCliArgs(argv),
    interactive: false,
    prompter: refusingPrompter,
  });
}

describe('presets', () => {
  it('full liga tudo', async () => {
    const selection = await resolve(['app', '--preset=full']);
    expect(selection.router).toBe('tanstack');
    expect(selection.query).toBe(true);
    expect(selection.shadcn).toBe(true);
    expect(selection.api).toBe(true);
  });

  it('minimal deixa só o básico', async () => {
    const selection = await resolve(['app', '--preset=minimal']);
    expect(selection.router).toBe('none');
    expect(selection.query).toBe(false);
    expect(selection.shadcn).toBe(false);
    expect(selection.tailwind).toBe(true);
  });

  it('uma flag explícita vence o preset, sem afetar o resto', async () => {
    const selection = await resolve(['app', '--preset=full', '--router=none', '--no-query']);
    expect(selection.router).toBe('none');
    expect(selection.query).toBe(false);
    expect(selection.shadcn).toBe(true);
    expect(selection.zustand).toBe(true);
  });

  it('recusa preset desconhecido com código 2', async () => {
    await expect(resolve(['app', '--preset=turbo'])).rejects.toMatchObject({ exitCode: 2 });
  });

  it('recusa gerenciador desconhecido com código 2, antes de qualquer prompt', () => {
    expect(() => parseCliArgs(['app', '--pm=deno'])).toThrow(
      expect.objectContaining({ exitCode: 2 }),
    );
  });

  it('recusa pasta existente antes de qualquer outra pergunta', async () => {
    const asked: string[] = [];
    const recording: Prompter = {
      text: () => Promise.reject(new Error('não deveria perguntar')),
      confirm: (options) => {
        asked.push(options.message);
        return Promise.resolve(false);
      },
      select: (options) => {
        asked.push(options.message);
        return Promise.resolve(options.initial);
      },
    };

    await expect(
      resolveSelection({
        args: parseCliArgs(['app']),
        interactive: true,
        prompter: recording,
        isDirectoryTaken: (directoryName) => Promise.resolve(directoryName === 'app'),
      }),
    ).rejects.toMatchObject({ exitCode: 2 });
    expect(asked).toEqual([]);
  });

  it('no modo interativo, pede outro nome quando a pasta já existe', async () => {
    const answers = ['app', 'app-2'];
    const messages: string[] = [];
    const prompter: Prompter = {
      text: (options) => {
        messages.push(options.message);
        return Promise.resolve(answers.shift() ?? '');
      },
      confirm: (options) => Promise.resolve(options.initial),
      select: (options) => Promise.resolve(options.initial),
    };

    const selection = await resolveSelection({
      args: parseCliArgs([]),
      interactive: true,
      prompter,
      isDirectoryTaken: (directoryName) => Promise.resolve(directoryName === 'app'),
    });

    expect(selection.directoryName).toBe('app-2');
    expect(messages[1]).toContain('já existe');
  });

  it('recusa --api sem --env, porque o cliente lê o schema validado', async () => {
    await expect(resolve(['app', '--api', '--no-env'])).rejects.toMatchObject({ exitCode: 2 });
  });
});
