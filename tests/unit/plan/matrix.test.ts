import { posix } from 'node:path';

import { describe, expect, it } from 'vitest';

import { buildPlan } from '../../../src/plan/build.js';
import { assertManifestCoherent } from '../../../src/plan/invariants.js';
import type { LinterChoice, Plan, RouterChoice, Selection } from '../../../src/plan/types.js';
import { loadBaseTree } from '../../fixtures/base-tree.js';
import { selectionOf } from '../../selection.js';

const base = loadBaseTree();

const ROUTERS: RouterChoice[] = ['none', 'react-router', 'tanstack'];
const LINTERS: LinterChoice[] = ['oxlint', 'eslint', 'biome'];
const TOGGLES = [
  'tailwind',
  'shadcn',
  'query',
  'vitest',
  'zustand',
  'forms',
  'env',
  'api',
] as const;

const GENERATED_AT_BUILD = new Set(['src/routeTree.gen']);

function validCombinations(): Partial<Selection>[] {
  const combinations: Partial<Selection>[] = [];

  for (const router of ROUTERS) {
    for (const linter of LINTERS) {
      for (let mask = 0; mask < 2 ** TOGGLES.length; mask++) {
        const toggles = Object.fromEntries(
          TOGGLES.map((toggle, index) => [toggle, (mask & (1 << index)) !== 0]),
        ) as Record<(typeof TOGGLES)[number], boolean>;

        if (toggles.shadcn && !toggles.tailwind) continue;
        if (toggles.api && !toggles.env) continue;

        combinations.push({
          router,
          linter,
          prettier: linter !== 'biome',
          husky: true,
          githubActions: true,
          ...toggles,
        });
      }
    }
  }

  return combinations;
}

function specifiersIn(source: string): string[] {
  const fromClauses = [...source.matchAll(/\bfrom\s+['"]([^'"]+)['"]/g)];
  const sideEffects = [...source.matchAll(/^import\s+['"]([^'"]+)['"]/gm)];
  return [...fromClauses, ...sideEffects].map((match) => match[1] ?? '');
}

function packageNameOf(specifier: string): string {
  const parts = specifier.split('/');
  return specifier.startsWith('@') ? parts.slice(0, 2).join('/') : (parts[0] ?? specifier);
}

function brokenImports(plan: Plan): string[] {
  const removed = new Set(plan.removals);
  const paths = new Set([
    ...plan.files.map((file) => file.path),
    ...Object.keys(base).filter((path) => !removed.has(path)),
  ]);
  const resolves = (target: string) =>
    GENERATED_AT_BUILD.has(target) ||
    [target, `${target}.ts`, `${target}.tsx`, `${target}/index.ts`].some((path) => paths.has(path));
  const declared = new Set([
    ...Object.keys(plan.packageJson.dependencies ?? {}),
    ...Object.keys(plan.packageJson.devDependencies ?? {}),
  ]);
  const problems: string[] = [];

  for (const file of plan.files.filter((entry) => /\.tsx?$/.test(entry.path))) {
    for (const specifier of specifiersIn(file.contents)) {
      if (specifier.startsWith('node:')) continue;

      if (specifier.startsWith('.')) {
        if (!resolves(posix.join(posix.dirname(file.path), specifier))) {
          problems.push(`${file.path} importa ${specifier}, que não existe no plano`);
        }
        continue;
      }

      if (specifier.startsWith('@/')) {
        if (!resolves(`src/${specifier.slice(2)}`)) {
          problems.push(`${file.path} importa ${specifier}, que não existe no plano`);
        }
        continue;
      }

      if (!declared.has(packageNameOf(specifier))) {
        problems.push(`${file.path} importa ${specifier}, que não está nas dependências`);
      }
    }
  }

  return problems;
}

describe('toda combinação válida de opções', () => {
  const combinations = validCombinations();

  it('cobre a matriz inteira', () => {
    expect(combinations.length).toBeGreaterThan(1000);
  });

  it('gera um manifesto coerente e imports que resolvem', () => {
    const failures = new Set<string>();

    for (const overrides of combinations) {
      const plan = buildPlan(selectionOf(overrides), base);
      try {
        assertManifestCoherent(plan);
      } catch (error) {
        failures.add(String(error));
      }
      for (const problem of brokenImports(plan)) failures.add(problem);
    }

    expect([...failures]).toEqual([]);
  });
});
