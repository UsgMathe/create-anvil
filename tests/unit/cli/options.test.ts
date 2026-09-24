import { describe, expect, it } from 'vitest';

import { BOOLEAN_FLAGS, parseCliArgs } from '../../../src/cli/args.js';
import {
  BOOLEAN_OPTIONS,
  LINTER_OPTION,
  OPTIONS,
  OPTION_GROUPS,
  ROUTER_OPTION,
  optionByKey,
} from '../../../src/cli/options.js';
import { PRESETS } from '../../../src/cli/presets.js';
import type { Prompter } from '../../../src/cli/prompts.js';
import { resolveSelection } from '../../../src/cli/resolve.js';
import { selectionOf } from '../../selection.js';

const refusingPrompter: Prompter = {
  text: () => Promise.reject(new Error('não deveria perguntar')),
  confirm: () => Promise.reject(new Error('não deveria perguntar')),
  select: () => Promise.reject(new Error('não deveria perguntar')),
};

async function resolve(argv: string[]): Promise<Record<string, unknown>> {
  const selection = await resolveSelection({
    args: parseCliArgs(argv),
    interactive: false,
    prompter: refusingPrompter,
  });
  return selection;
}

describe('manifesto de opções', () => {
  it('cobre exatamente as flags booleanas que o parser aceita', () => {
    const declared = BOOLEAN_OPTIONS.map((option) => option.flag).sort();
    expect(declared).toEqual([...BOOLEAN_FLAGS].sort());
  });

  it('só descreve chaves que existem na Selection', () => {
    const selection = selectionOf();
    for (const option of OPTIONS) {
      expect(Object.hasOwn(selection, option.key), option.key).toBe(true);
    }
  });

  it('aponta para grupos declarados', () => {
    const groups = new Set(OPTION_GROUPS.map((group) => group.id));
    for (const option of OPTIONS) {
      expect(groups.has(option.group), option.key).toBe(true);
    }
  });

  it('só referencia opções que existem nas dependências', () => {
    const keys = new Set(OPTIONS.map((option) => option.key));
    for (const option of BOOLEAN_OPTIONS) {
      if (option.requires) expect(keys.has(option.requires), option.key).toBe(true);
      if (option.forcedOffWhen) expect(keys.has(option.forcedOffWhen.key), option.key).toBe(true);
    }
  });

  it('o padrão das opções sensíveis a preset é o preset minimal', () => {
    const minimal = PRESETS.minimal as Record<string, unknown>;
    for (const option of OPTIONS) {
      if (!option.presetAware) continue;
      expect(option.default, option.key).toBe(minimal[option.key]);
    }
  });

  it('o padrão das opções fora do preset é o que o resolve aplica', async () => {
    const selection = await resolve(['app']);
    for (const option of OPTIONS) {
      if (option.presetAware) continue;
      expect(selection[option.key], option.key).toBe(option.default);
    }
  });

  it('todo valor oferecido é aceito pelo CLI', async () => {
    for (const choice of ROUTER_OPTION.choices) {
      expect((await resolve(['app', `--router=${choice.value}`])).router).toBe(choice.value);
    }
    for (const choice of LINTER_OPTION.choices) {
      expect((await resolve(['app', `--linter=${choice.value}`])).linter).toBe(choice.value);
    }
  });

  it('toda flag booleana liga e desliga', async () => {
    for (const option of BOOLEAN_OPTIONS) {
      const required = option.requires ? [`--${optionByKey(option.requires).flag}`] : [];
      const on = await resolve(['app', ...required, `--${option.flag}`]);
      expect(on[option.key], `--${option.flag}`).toBe(true);

      const off = await resolve(['app', `--no-${option.flag}`]);
      expect(off[option.key], `--no-${option.flag}`).toBe(false);
    }
  });

  it('o Biome ignora a flag do Prettier, como o manifesto declara', async () => {
    const selection = await resolve(['app', '--linter=biome', '--prettier']);
    expect(selection.prettier).toBe(false);
    expect(optionByKey('prettier')).toMatchObject({
      forcedOffWhen: { key: 'linter', value: 'biome' },
    });
  });

  it('publica o manifesto que o site consome', async () => {
    const manifest = { groups: OPTION_GROUPS, options: OPTIONS, presets: PRESETS };
    await expect(`${JSON.stringify(manifest, null, 2)}\n`).toMatchFileSnapshot(
      '../../../site/src/data/options.json',
    );
  });
});
