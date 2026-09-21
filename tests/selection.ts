import type { Selection } from '../src/plan/types.js';

export function selectionOf(overrides: Partial<Selection> = {}): Selection {
  return {
    packageName: 'my-app',
    directoryName: 'my-app',
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
    git: true,
    install: true,
    ...overrides,
  };
}
