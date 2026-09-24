import { describe, expect, it } from 'vitest';

import { parseCliArgs } from '../../../src/cli/args.js';
import type { Prompter } from '../../../src/cli/prompts.js';
import { resolveSelection } from '../../../src/cli/resolve.js';
import { commandFlags } from '../../../site/src/lib/command';
import {
  OPTIONS,
  defaultsFor,
  effectiveState,
  setOption,
  type SelectionState,
} from '../../../site/src/lib/options';

const refusingPrompter: Prompter = {
  text: () => Promise.reject(new Error('não deveria perguntar')),
  confirm: () => Promise.reject(new Error('não deveria perguntar')),
  select: () => Promise.reject(new Error('não deveria perguntar')),
};

async function roundTrip(state: SelectionState): Promise<void> {
  const flags = commandFlags(state);
  const resolved = (await resolveSelection({
    args: parseCliArgs(['meu-app', ...flags]),
    interactive: false,
    prompter: refusingPrompter,
  })) as unknown as Record<string, unknown>;

  const expected = effectiveState(state);
  for (const option of OPTIONS) {
    expect(resolved[option.key], `${option.key} em "${flags.join(' ')}"`).toBe(
      expected[option.key],
    );
  }
}

function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function randomState(random: () => number): SelectionState {
  let state = defaultsFor(random() < 0.5 ? null : 'full');

  for (const option of OPTIONS) {
    if (random() < 0.5) continue;
    const value =
      option.kind === 'choice'
        ? (option.choices[Math.floor(random() * option.choices.length)]?.value ?? option.default)
        : random() < 0.5;
    state = setOption(state, option.key, value);
  }

  return state;
}

describe('o comando montado no site reproduz a seleção', () => {
  it('nos padrões e nos dois presets', async () => {
    await roundTrip(defaultsFor(null));
    await roundTrip(defaultsFor('minimal'));
    await roundTrip(defaultsFor('full'));
  });

  it('com cada opção invertida a partir de cada preset', async () => {
    for (const base of [null, 'full'] as const) {
      for (const option of OPTIONS) {
        const start = defaultsFor(base);
        if (option.kind === 'choice') {
          for (const choice of option.choices) {
            await roundTrip(setOption(start, option.key, choice.value));
          }
        } else {
          await roundTrip(setOption(start, option.key, start[option.key] !== true));
        }
      }
    }
  });

  it('com tudo ligado e tudo desligado', async () => {
    let allOn = defaultsFor(null);
    let allOff = defaultsFor(null);
    for (const option of OPTIONS) {
      if (option.kind !== 'boolean') continue;
      allOn = setOption(allOn, option.key, true);
      allOff = setOption(allOff, option.key, false);
    }
    await roundTrip(allOn);
    await roundTrip(allOff);
  });

  it('em 300 combinações pseudoaleatórias', async () => {
    const random = mulberry32(20260924);
    for (let index = 0; index < 300; index += 1) {
      await roundTrip(randomState(random));
    }
  });

  it('nunca emite a flag do Prettier junto do Biome', () => {
    const state = setOption(defaultsFor(null), 'linter', 'biome');
    expect(commandFlags(state)).not.toContain('--prettier');
    expect(commandFlags(state)).not.toContain('--no-prettier');
  });

  it('usa o preset quando ele encurta o comando', () => {
    expect(commandFlags(defaultsFor('full'))).toEqual(['--preset=full', '--yes']);
  });
});
