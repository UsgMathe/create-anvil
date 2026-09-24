export type OptionGroupId = 'router' | 'lint' | 'ui' | 'data' | 'env' | 'quality' | 'run';

export interface OptionGroup {
  id: OptionGroupId;
  label: string;
  advanced?: boolean;
}

export const OPTION_GROUPS: OptionGroup[] = [
  { id: 'router', label: 'Roteamento' },
  { id: 'ui', label: 'Interface' },
  { id: 'data', label: 'Dados e estado' },
  { id: 'env', label: 'Ambiente e API' },
  { id: 'lint', label: 'Lint e formato' },
  { id: 'quality', label: 'Qualidade' },
  { id: 'run', label: 'Execução', advanced: true },
];

interface OptionBase {
  key: string;
  flag: string;
  label: string;
  hint: string;
  group: OptionGroupId;
  presetAware: boolean;
}

export interface OptionChoice {
  value: string;
  label: string;
  hint: string;
}

export interface ChoiceOptionSpec extends OptionBase {
  kind: 'choice';
  default: string;
  choices: OptionChoice[];
}

export interface BooleanOptionSpec extends OptionBase {
  kind: 'boolean';
  default: boolean;
  requires?: string;
  forcedOffWhen?: { key: string; value: string };
}

export type OptionSpec = ChoiceOptionSpec | BooleanOptionSpec;

export const ROUTER_OPTION: ChoiceOptionSpec = {
  kind: 'choice',
  key: 'router',
  flag: 'router',
  label: 'Roteamento',
  hint: 'Nenhum, React Router v8 ou TanStack Router com rotas por arquivo.',
  group: 'router',
  presetAware: true,
  default: 'none',
  choices: [
    { value: 'none', label: 'Nenhum', hint: 'app de página única' },
    { value: 'react-router', label: 'React Router', hint: 'v8, modo biblioteca' },
    { value: 'tanstack', label: 'TanStack Router', hint: 'rotas por arquivo, tipado' },
  ],
};

export const LINTER_OPTION: ChoiceOptionSpec = {
  kind: 'choice',
  key: 'linter',
  flag: 'linter',
  label: 'Lint e formatação',
  hint: 'O Oxlint é o que o create-vite já entrega.',
  group: 'lint',
  presetAware: true,
  default: 'oxlint',
  choices: [
    { value: 'oxlint', label: 'Oxlint', hint: 'o padrão do create-vite' },
    { value: 'eslint', label: 'ESLint', hint: 'ecossistema de plugins' },
    {
      value: 'biome',
      label: 'Biome',
      hint: 'lint e formatação numa ferramenta só, sem o Prettier',
    },
  ],
};

export const BOOLEAN_OPTIONS: BooleanOptionSpec[] = [
  {
    kind: 'boolean',
    key: 'prettier',
    flag: 'prettier',
    label: 'Prettier',
    hint: 'Formatador dedicado, com ordenação de classes do Tailwind.',
    group: 'lint',
    presetAware: false,
    default: true,
    forcedOffWhen: { key: 'linter', value: 'biome' },
  },
  {
    kind: 'boolean',
    key: 'tailwind',
    flag: 'tailwind',
    label: 'TailwindCSS v4',
    hint: 'CSS utilitário com configuração CSS-first, sem tailwind.config.js.',
    group: 'ui',
    presetAware: true,
    default: true,
  },
  {
    kind: 'boolean',
    key: 'shadcn',
    flag: 'shadcn',
    label: 'shadcn/ui',
    hint: 'components.json e src/lib/utils.ts prontos, sem rodar o init.',
    group: 'ui',
    presetAware: true,
    default: false,
    requires: 'tailwind',
  },
  {
    kind: 'boolean',
    key: 'query',
    flag: 'query',
    label: 'TanStack Query',
    hint: 'Cache de servidor, com um módulo de exemplo em src/api/posts/.',
    group: 'data',
    presetAware: true,
    default: false,
  },
  {
    kind: 'boolean',
    key: 'zustand',
    flag: 'zustand',
    label: 'Zustand',
    hint: 'Estado global sem boilerplate.',
    group: 'data',
    presetAware: true,
    default: false,
  },
  {
    kind: 'boolean',
    key: 'forms',
    flag: 'forms',
    label: 'react-hook-form + zod',
    hint: 'Formulário de exemplo validado por zod, em shadcn/ui quando ele estiver ligado.',
    group: 'data',
    presetAware: true,
    default: false,
  },
  {
    kind: 'boolean',
    key: 'env',
    flag: 'env',
    label: 'Validação de variáveis de ambiente com zod',
    hint: 'sample.env, .env e um src/config/env.ts que falha cedo.',
    group: 'env',
    presetAware: true,
    default: false,
  },
  {
    kind: 'boolean',
    key: 'api',
    flag: 'api',
    label: 'Cliente HTTP com proxy de /api no dev',
    hint: 'axios apontando para VITE_API_URL, sem CORS em desenvolvimento.',
    group: 'env',
    presetAware: true,
    default: false,
    requires: 'env',
  },
  {
    kind: 'boolean',
    key: 'vitest',
    flag: 'vitest',
    label: 'Vitest + Testing Library',
    hint: 'Testes ao lado do código, com cobertura e typecheck próprio.',
    group: 'quality',
    presetAware: true,
    default: false,
  },
  {
    kind: 'boolean',
    key: 'husky',
    flag: 'husky',
    label: 'husky + lint-staged',
    hint: 'Lint e formatação no pre-commit.',
    group: 'quality',
    presetAware: true,
    default: false,
  },
  {
    kind: 'boolean',
    key: 'githubActions',
    flag: 'gh-actions',
    label: 'Workflow de CI no projeto gerado',
    hint: 'Roda lint, typecheck, testes e build a cada push.',
    group: 'quality',
    presetAware: true,
    default: false,
  },
  {
    kind: 'boolean',
    key: 'git',
    flag: 'git',
    label: 'git init e commit inicial',
    hint: 'O husky precisa de um repositório para instalar os hooks.',
    group: 'run',
    presetAware: false,
    default: true,
  },
  {
    kind: 'boolean',
    key: 'install',
    flag: 'install',
    label: 'Instalar as dependências',
    hint: 'Sem isso o projeto sai escrito, mas sem node_modules.',
    group: 'run',
    presetAware: false,
    default: true,
  },
];

export const OPTIONS: OptionSpec[] = [ROUTER_OPTION, LINTER_OPTION, ...BOOLEAN_OPTIONS];

export function optionByKey(key: string): OptionSpec {
  const option = OPTIONS.find((entry) => entry.key === key);
  if (!option) throw new Error(`Opção desconhecida: ${key}`);
  return option;
}

export function promptMessage(key: string): string {
  return `${optionByKey(key).label}?`;
}
