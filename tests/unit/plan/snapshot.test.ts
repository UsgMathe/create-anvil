import { describe, expect, it } from 'vitest';

import { buildPlan } from '../../../src/plan/build.js';
import type { Selection } from '../../../src/plan/types.js';
import { loadBaseTree } from '../../fixtures/base-tree.js';
import { selectionOf } from '../../selection.js';

const base = loadBaseTree();

const FULL: Partial<Selection> = {
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
  api: true,
  packageManager: 'pnpm',
  packageManagerVersion: '10.32.1',
};

const COMBINATIONS: Record<string, { selection: Partial<Selection>; files: string[] }> = {
  minimal: {
    selection: { router: 'none', linter: 'oxlint', prettier: true },
    files: ['src/app.tsx'],
  },
  'react-router-query': {
    selection: { router: 'react-router', query: true, linter: 'oxlint' },
    files: ['src/router.tsx', 'src/routes/root-layout.tsx', 'src/routes/examples.tsx'],
  },
  'tanstack-query': {
    selection: { router: 'tanstack', query: true, linter: 'eslint' },
    files: ['src/router.tsx', 'src/routes/__root.tsx', 'src/routes/examples.tsx'],
  },
  biome: { selection: { router: 'none', linter: 'biome', prettier: false }, files: [] },
  full: {
    selection: FULL,
    files: [
      'src/routes/__root.tsx',
      'src/routes/examples.tsx',
      'src/lib/http.ts',
      'src/test/render.tsx',
      '.github/workflows/ci.yml',
    ],
  },
};

const SNAPSHOT_FILES = ['src/main.tsx', 'vite.config.ts', 'package.json'];

describe('snapshots de composição', () => {
  for (const [name, combination] of Object.entries(COMBINATIONS)) {
    describe(name, () => {
      const plan = buildPlan(selectionOf(combination.selection), base);

      for (const path of [...SNAPSHOT_FILES, ...combination.files]) {
        it(path, async () => {
          const file = plan.files.find((entry) => entry.path === path);
          expect(file, `${path} ausente no plano`).toBeDefined();
          await expect(file?.contents).toMatchFileSnapshot(
            `../../__snapshots__/${name}/${path.replace(/\//g, '__')}`,
          );
        });
      }

      it('árvore de arquivos', () => {
        expect(plan.files.map((file) => file.path).sort()).toMatchSnapshot();
      });
    });
  }
});
