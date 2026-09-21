import { describe, expect, it } from 'vitest';

import { buildPlan } from '../../../src/plan/build.js';
import type { Selection } from '../../../src/plan/types.js';
import { loadBaseTree } from '../../fixtures/base-tree.js';
import { selectionOf } from '../../selection.js';

const base = loadBaseTree();

const COMBINATIONS: Record<string, Partial<Selection>> = {
  minimal: { router: 'none', linter: 'oxlint', prettier: true },
  'react-router-query': { router: 'react-router', query: true, linter: 'oxlint' },
  'tanstack-query': { router: 'tanstack', query: true, linter: 'eslint' },
  biome: { router: 'none', linter: 'biome', prettier: false },
};

const SNAPSHOT_FILES = ['src/main.tsx', 'vite.config.ts', 'package.json'];

describe('snapshots de composição', () => {
  for (const [name, overrides] of Object.entries(COMBINATIONS)) {
    describe(name, () => {
      const plan = buildPlan(selectionOf(overrides), base);

      for (const path of SNAPSHOT_FILES) {
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
