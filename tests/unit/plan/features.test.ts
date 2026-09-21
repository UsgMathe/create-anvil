import { describe, expect, it } from 'vitest';

import { buildPlan } from '../../../src/plan/build.js';
import { assertManifestCoherent } from '../../../src/plan/invariants.js';
import { loadBaseTree } from '../../fixtures/base-tree.js';
import { selectionOf } from '../../selection.js';

const base = loadBaseTree();

function plannedPaths(overrides: Parameters<typeof selectionOf>[0]): string[] {
  return buildPlan(selectionOf(overrides), base).files.map((file) => file.path);
}

function fileNamed(path: string, overrides: Parameters<typeof selectionOf>[0]): string {
  const file = buildPlan(selectionOf(overrides), base).files.find((entry) => entry.path === path);
  if (!file) throw new Error(`Arquivo ausente no plano: ${path}`);
  return file.contents;
}

describe('shadcn', () => {
  it('escreve components.json e o cn, e declara os pacotes atuais do registro', () => {
    const plan = buildPlan(selectionOf({ shadcn: true }), base);
    expect(plan.files.map((file) => file.path)).toEqual(
      expect.arrayContaining(['components.json', 'src/lib/utils.ts']),
    );
    expect(plan.packageJson.dependencies).toHaveProperty('cn');
    expect(plan.packageJson.dependencies).toHaveProperty('radix-ui');
    expect(plan.packageJson.devDependencies).toHaveProperty('tw-animate-css');
  });

  it('emite os tokens de cor no index.css — o shadcn/tailwind.css só traz animações', () => {
    const css = fileNamed('src/index.css', { shadcn: true });
    expect(css).toContain('--color-border: var(--border);');
    expect(css).toContain('--color-background: var(--background);');
    expect(css).toContain('@custom-variant dark');
    expect(css).toContain('.dark {');
  });

  it('põe o @import "tailwindcss" antes de tudo', () => {
    const css = fileNamed('src/index.css', { shadcn: true });
    expect(css.indexOf('@import "tailwindcss"')).toBe(0);
    expect(css.indexOf('@theme inline')).toBeGreaterThan(css.indexOf('.dark {'));
    expect(css.indexOf('@layer base')).toBeGreaterThan(css.indexOf('@theme inline'));
  });

  it('adiciona cn e cva ao tailwindFunctions do Prettier', () => {
    const config = JSON.parse(
      fileNamed('.prettierrc.json', { shadcn: true, prettier: true }),
    ) as Record<string, unknown>;
    expect(config.tailwindFunctions).toEqual(['cn', 'cva']);
  });
});

describe('features opcionais', () => {
  it('zustand só aparece quando selecionado', () => {
    expect(plannedPaths({ zustand: true })).toContain('src/stores/counter-store.ts');
    expect(plannedPaths({ zustand: false })).not.toContain('src/stores/counter-store.ts');
  });

  it('forms traz react-hook-form, zod e o resolver juntos', () => {
    const plan = buildPlan(selectionOf({ forms: true }), base);
    expect(plan.packageJson.dependencies).toHaveProperty('react-hook-form');
    expect(plan.packageJson.dependencies).toHaveProperty('zod');
    expect(plan.packageJson.dependencies).toHaveProperty('@hookform/resolvers');
  });

  it('vitest injeta o bloco test no vite.config e o script', () => {
    const config = fileNamed('vite.config.ts', { vitest: true });
    expect(config).toContain("environment: 'jsdom'");
    expect(config).toContain("setupFiles: ['./src/test/setup.ts']");
    expect(plannedPaths({ vitest: true })).toContain('src/test/setup.ts');

    expect(fileNamed('vite.config.ts', { vitest: false })).not.toContain('jsdom');
  });

  it('husky escreve o pre-commit e o lint-staged casa com o linter escolhido', () => {
    const eslintConfig = JSON.parse(
      fileNamed('.lintstagedrc.json', { husky: true, linter: 'eslint' }),
    ) as Record<string, string[]>;
    expect(eslintConfig['*.{ts,tsx}']?.[0]).toBe('eslint --fix');

    const biomeConfig = JSON.parse(
      fileNamed('.lintstagedrc.json', { husky: true, linter: 'biome' }),
    ) as Record<string, string[]>;
    expect(JSON.stringify(biomeConfig)).toContain('biome check');

    expect(plannedPaths({ husky: true })).toContain('.husky/pre-commit');
  });

  it('o CI gerado só cita scripts que existem', () => {
    const selection = { githubActions: true, vitest: false, linter: 'oxlint' } as const;
    const plan = buildPlan(selectionOf(selection), base);
    const workflow = fileNamed('.github/workflows/ci.yml', selection);
    const scripts = Object.keys(plan.packageJson.scripts ?? {});

    for (const match of workflow.matchAll(/npm run ([a-z:]+)/g)) {
      expect(scripts).toContain(match[1]);
    }
    expect(workflow).not.toContain('npm test');
  });

  it('o CI gerado inclui o passo de teste quando há vitest', () => {
    expect(fileNamed('.github/workflows/ci.yml', { githubActions: true, vitest: true })).toContain(
      'npm test',
    );
  });
});

describe('preset completo', () => {
  it('mantém o manifesto coerente com tudo ligado', () => {
    const plan = buildPlan(
      selectionOf({
        router: 'tanstack',
        linter: 'eslint',
        query: true,
        shadcn: true,
        vitest: true,
        zustand: true,
        forms: true,
        husky: true,
        githubActions: true,
      }),
      base,
    );
    expect(() => {
      assertManifestCoherent(plan);
    }).not.toThrow();
  });
});

describe('validação de env', () => {
  it('escreve sample.env, .env e o schema', () => {
    const paths = plannedPaths({ env: true });
    expect(paths).toEqual(expect.arrayContaining(['sample.env', '.env', 'src/config/env.ts']));
  });

  it('não escreve nada quando desligada', () => {
    const paths = plannedPaths({ env: false });
    expect(paths).not.toContain('sample.env');
    expect(paths).not.toContain('src/config/env.ts');
  });

  it('declara o zod como dependência', () => {
    const plan = buildPlan(selectionOf({ env: true }), base);
    expect(plan.packageJson.dependencies).toHaveProperty('zod');
  });

  it('o sample.env cobre exatamente as chaves do schema', () => {
    const schema = fileNamed('src/config/env.ts', { env: true });
    const sample = fileNamed('sample.env', { env: true });

    const schemaKeys = [...schema.matchAll(/^\s+(VITE_[A-Z0-9_]+):/gm)].map((m) => m[1]);
    const sampleKeys = [...sample.matchAll(/^([A-Z0-9_]+)=/gm)].map((m) => m[1]);

    expect(schemaKeys.length).toBeGreaterThan(0);
    expect(sampleKeys.sort()).toEqual(schemaKeys.sort());
  });

  it('o .env nasce igual ao sample, para o projeto rodar de imediato', () => {
    expect(fileNamed('.env', { env: true })).toBe(fileNamed('sample.env', { env: true }));
  });

  it('desversiona .env mas preserva o sample, e nessa ordem', () => {
    const gitignore = fileNamed('.gitignore', { env: true });
    const lines = gitignore.split('\n');
    const ignoreAll = lines.indexOf('*.env');
    const keepSample = lines.indexOf('!sample.env');

    expect(ignoreAll).toBeGreaterThanOrEqual(0);
    expect(keepSample).toBeGreaterThan(ignoreAll);
  });

  it('importa o schema no main.tsx, senão a validação nunca roda', () => {
    expect(fileNamed('src/main.tsx', { env: true })).toContain("import '@/config/env';");
    expect(fileNamed('src/main.tsx', { env: false })).not.toContain('@/config/env');
  });
});
