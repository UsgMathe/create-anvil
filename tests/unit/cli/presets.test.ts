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

  it('recusa --api sem --env, porque o cliente lê o schema validado', async () => {
    await expect(resolve(['app', '--api', '--no-env'])).rejects.toMatchObject({ exitCode: 2 });
  });
});
