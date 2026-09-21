import type { Selection } from '../plan/types.js';

export type PresetName = 'minimal' | 'full';

export type PresetValues = Partial<
  Omit<Selection, 'packageName' | 'directoryName' | 'git' | 'install'>
>;

export const PRESETS: Record<PresetName, PresetValues> = {
  minimal: {
    router: 'none',
    linter: 'oxlint',
    prettier: true,
    tailwind: true,
    shadcn: false,
    query: false,
    vitest: false,
    zustand: false,
    forms: false,
    husky: false,
    githubActions: false,
    env: false,
  },
  full: {
    router: 'tanstack',
    linter: 'eslint',
    prettier: true,
    tailwind: true,
    shadcn: true,
    query: true,
    vitest: true,
    zustand: true,
    forms: true,
    husky: true,
    githubActions: true,
    env: true,
  },
};

export function isPresetName(value: string): value is PresetName {
  return Object.hasOwn(PRESETS, value);
}
