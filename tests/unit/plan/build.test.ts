import { describe, expect, it } from 'vitest';

import { buildPlan } from '../../../src/plan/build.js';
import { assertManifestCoherent } from '../../../src/plan/invariants.js';
import type { LinterChoice, RouterChoice } from '../../../src/plan/types.js';
import { loadBaseTree } from '../../fixtures/base-tree.js';
import { selectionOf } from '../../selection.js';

const base = loadBaseTree();

function fileNamed(path: string, plan: ReturnType<typeof buildPlan>): string {
  const file = plan.files.find((entry) => entry.path === path);
  if (!file) throw new Error(`Arquivo ausente no plano: ${path}`);
  return file.contents;
}

const ROUTERS: RouterChoice[] = ['none', 'react-router', 'tanstack'];
const LINTERS: LinterChoice[] = ['oxlint', 'eslint', 'biome'];

describe('buildPlan — invariantes sobre toda a matriz', () => {
  const combinations = ROUTERS.flatMap((router) =>
    LINTERS.flatMap((linter) =>
      [false, true].flatMap((query) =>
        [false, true].map((tailwind) => ({ router, linter, query, tailwind })),
      ),
    ),
  );

  it.each(combinations)('manifesto coerente: %o', (overrides) => {
    const plan = buildPlan(selectionOf(overrides), base);
    expect(() => assertManifestCoherent(plan)).not.toThrow();
  });

  it('é determinístico', () => {
    const selection = selectionOf({ router: 'tanstack', query: true });
    expect(buildPlan(selection, base)).toEqual(buildPlan(selection, base));
  });
});

describe('ordem dos plugins do Vite', () => {
  it('coloca tanstackRouter antes do plugin react', () => {
    const plan = buildPlan(selectionOf({ router: 'tanstack' }), base);
    const config = fileNamed('vite.config.ts', plan);
    expect(config.indexOf('tanstackRouter(')).toBeLessThan(config.indexOf('react()'));
  });

  it('injeta o tailwind mesmo com o array de plugins em várias linhas', () => {
    const config = fileNamed('vite.config.ts', buildPlan(selectionOf(), base));
    expect(config).toContain('tailwindcss()');
    expect(config.split('\n').filter((line) => line.includes('(),')).length).toBeGreaterThan(0);
  });
});

describe('main.tsx composto', () => {
  it('aninha o QueryClientProvider por fora do RouterProvider', () => {
    const plan = buildPlan(selectionOf({ router: 'tanstack', query: true }), base);
    const main = fileNamed('src/main.tsx', plan);
    expect(main.indexOf('<QueryClientProvider')).toBeLessThan(main.indexOf('<RouterProvider'));
  });

  it('usa react-router/dom para o RouterProvider do react-router v8', () => {
    const plan = buildPlan(selectionOf({ router: 'react-router' }), base);
    expect(fileNamed('src/main.tsx', plan)).toContain("from 'react-router/dom'");
  });

  it('não deixa resquício do App.tsx do create-vite', () => {
    const plan = buildPlan(selectionOf({ router: 'tanstack' }), base);
    expect(fileNamed('src/main.tsx', plan)).not.toContain('./App');
    expect(plan.files.some((file) => file.path === 'src/app.tsx')).toBe(false);
  });
});

describe('tsconfig', () => {
  it('adiciona paths sem baseUrl (deprecado no TypeScript 6)', () => {
    const plan = buildPlan(selectionOf(), base);
    const tsconfig = fileNamed('tsconfig.app.json', plan);
    expect(tsconfig).toContain('"@/*"');
    expect(tsconfig).not.toContain('baseUrl');
  });

  it('preserva os comentários do tsconfig original', () => {
    const plan = buildPlan(selectionOf(), base);
    expect(fileNamed('tsconfig.app.json', plan)).toContain('/*');
  });

  it('não corrompe uma URL dentro de string', () => {
    const withSchema = {
      ...base,
      'tsconfig.app.json':
        '{\n  "$schema": "https://www.schemastore.org/tsconfig",\n  "compilerOptions": { "strict": true }\n}\n',
    };
    const plan = buildPlan(selectionOf(), withSchema);
    expect(fileNamed('tsconfig.app.json', plan)).toContain('https://www.schemastore.org/tsconfig');
  });
});

describe('lint e format', () => {
  it('instala o prettier de verdade quando escreve .prettierrc.json', () => {
    const plan = buildPlan(selectionOf({ linter: 'oxlint', prettier: true }), base);
    expect(plan.files.some((file) => file.path === '.prettierrc.json')).toBe(true);
    expect(plan.packageJson.devDependencies).toHaveProperty('prettier');
    expect(plan.packageJson.scripts).toHaveProperty('format');
  });

  it('define tailwindStylesheet, senão o plugin do tailwind degrada em silêncio', () => {
    const plan = buildPlan(selectionOf({ tailwind: true, prettier: true }), base);
    const config = JSON.parse(fileNamed('.prettierrc.json', plan)) as Record<string, unknown>;
    expect(config.tailwindStylesheet).toBe('./src/index.css');
  });

  it('remove o oxlint por completo ao escolher eslint', () => {
    const plan = buildPlan(selectionOf({ linter: 'eslint' }), base);
    expect(plan.packageJson.devDependencies).not.toHaveProperty('oxlint');
    expect(plan.removals).toContain('.oxlintrc.json');
    expect(plan.packageJson.scripts?.lint).toBe('eslint .');
  });

  it('remove o oxlint e o prettier ao escolher biome', () => {
    const plan = buildPlan(selectionOf({ linter: 'biome' }), base);
    expect(plan.packageJson.devDependencies).not.toHaveProperty('oxlint');
    expect(plan.packageJson.devDependencies).not.toHaveProperty('prettier');
    expect(plan.files.some((file) => file.path === '.prettierrc.json')).toBe(false);
  });
});

describe('limpeza da base', () => {
  it('mantém o favicon que o index.html referencia', () => {
    const plan = buildPlan(selectionOf(), base);
    expect(plan.removals).not.toContain('public/favicon.svg');
    expect(plan.removals).toContain('public/icons.svg');
    expect(fileNamed('index.html', plan)).toContain('favicon.svg');
  });

  it('usa o nome do projeto no título', () => {
    const plan = buildPlan(selectionOf({ packageName: 'loja-virtual' }), base);
    expect(fileNamed('index.html', plan)).toContain('<title>loja-virtual</title>');
  });
});

describe('ordem do build com TanStack Router', () => {
  it('roda o vite antes do tsc, senão routeTree.gen.ts ainda não existe', () => {
    const plan = buildPlan(selectionOf({ router: 'tanstack' }), base);
    const build = plan.packageJson.scripts?.build ?? '';
    expect(build.indexOf('vite build')).toBeLessThan(build.indexOf('tsc'));
  });

  it('mantém a ordem padrão do create-vite sem TanStack Router', () => {
    const plan = buildPlan(selectionOf({ router: 'react-router' }), base);
    expect(plan.packageJson.scripts?.build).toBe('tsc -b && vite build');
  });
});

describe('o typecheck precisa realmente checar', () => {
  it.each(['none', 'react-router', 'tanstack'] as const)(
    'router=%s: o build usa tsc -b, nunca tsc --noEmit',
    (router) => {
      const plan = buildPlan(selectionOf({ router }), base);
      const build = plan.packageJson.scripts?.build ?? '';
      expect(build).toContain('tsc -b');
      expect(build).not.toContain('--noEmit');
    },
  );

  it('o tsconfig raiz continua solution-style, por isso --noEmit não veria arquivo nenhum', () => {
    const root = fileNamed('tsconfig.json', buildPlan(selectionOf(), base));
    expect(root).toContain('"files": []');
    expect(root).toContain('references');
  });
});

describe('strict explícito', () => {
  it('declara strict no tsconfig.app.json em vez de depender do default do TS 6', () => {
    const tsconfig = fileNamed('tsconfig.app.json', buildPlan(selectionOf(), base));
    expect(tsconfig).toMatch(/"strict":\s*true/);
  });

  it('não declara strict no tsconfig raiz, que não compila nada', () => {
    const root = fileNamed('tsconfig.json', buildPlan(selectionOf(), base));
    expect(root).not.toMatch(/"strict":\s*true/);
  });
});

describe('bloco de teste no vite.config', () => {
  it('inclui a referência de tipos do vitest, senão o campo test não typechecka', () => {
    const config = fileNamed('vite.config.ts', buildPlan(selectionOf({ vitest: true }), base));
    expect(config.startsWith('/// <reference types="vitest/config" />')).toBe(true);
  });

  it('não inclui a referência quando não há vitest', () => {
    const config = fileNamed('vite.config.ts', buildPlan(selectionOf({ vitest: false }), base));
    expect(config).not.toContain('vitest/config');
  });
});
