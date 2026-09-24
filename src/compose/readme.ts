import type { PackageManagerName, Selection } from '../plan/types.js';

export interface ReadmeInput {
  selection: Selection;
  scripts: Record<string, string>;
  packageManager: PackageManagerName;
}

const SCRIPT_DESCRIPTIONS: Record<string, string> = {
  dev: 'Sobe o servidor de desenvolvimento.',
  build: 'Typecheck e build de produção.',
  preview: 'Serve o build de produção localmente.',
  typecheck: 'Só o typecheck, sem gerar bundle.',
  lint: 'Roda o linter.',
  'lint:fix': 'Roda o linter corrigindo o que der.',
  format: 'Formata o projeto.',
  'format:check': 'Falha se algo estiver fora do formato.',
  check: 'Lint e formatação numa passada só.',
  test: 'Roda os testes uma vez.',
  'test:watch': 'Roda os testes em watch.',
  'test:coverage': 'Testes com relatório de cobertura.',
  prepare: 'Instala os hooks de git (roda sozinho no install).',
};

function runCommand(packageManager: PackageManagerName, script: string): string {
  return packageManager === 'npm' || packageManager === 'bun'
    ? `${packageManager} run ${script}`
    : `${packageManager} ${script}`;
}

function stackList(selection: Selection): string[] {
  const items = ['**Vite** + **React** + **TypeScript**'];

  if (selection.tailwind) items.push('**TailwindCSS v4**');
  if (selection.shadcn) items.push('**shadcn/ui**');
  if (selection.router === 'react-router') items.push('**React Router** (modo biblioteca)');
  if (selection.router === 'tanstack') items.push('**TanStack Router** (rotas por arquivo)');
  if (selection.query) items.push('**TanStack Query**');
  if (selection.api) items.push('**axios**, com proxy de `/api` no desenvolvimento');
  if (selection.env) items.push('**zod** validando as variáveis de ambiente');
  if (selection.zustand) items.push('**Zustand**');
  if (selection.forms) items.push('**react-hook-form** + **zod**');
  if (selection.vitest) items.push('**Vitest** + **Testing Library**');

  if (selection.linter === 'oxlint') items.push('**Oxlint**');
  if (selection.linter === 'eslint') items.push('**ESLint**');
  if (selection.linter === 'biome') items.push('**Biome**');
  if (selection.prettier) items.push('**Prettier**');
  if (selection.husky) items.push('**husky** + **lint-staged**');

  return items;
}

function conventions(selection: Selection): string[] {
  const items = [
    '`@/` é atalho para `src/` — configurado no `vite.config.ts` e nos tsconfigs.',
    '`enum` **não compila**: o `erasableSyntaxOnly` está ligado. Use um objeto `as const` mais uma' +
      ' union:\n\n  ```ts\n  export const Status = { ativo: "ativo", inativo: "inativo" } as const;\n' +
      '  export type Status = (typeof Status)[keyof typeof Status];\n  ```',
    'Use `import type { ... }` para importar apenas tipos — o `verbatimModuleSyntax` exige.',
  ];

  if (selection.tailwind) {
    items.push(
      'Tailwind v4 **não tem `tailwind.config.js`**: a configuração é CSS-first, em `src/index.css`.',
    );
  }

  if (selection.prettier && selection.tailwind) {
    items.push(
      'O Prettier ordena as classes do Tailwind sozinho — não ordene à mão contra o formatador.',
    );
  }

  if (selection.env) {
    items.push(
      'Toda variável `VITE_*` nova precisa entrar no schema de `src/config/env.ts`, senão a' +
        ' aplicação lança na inicialização. Copie `sample.env` para `.env` ao clonar o projeto.',
    );
  }

  if (selection.api) {
    items.push(
      'Em desenvolvimento o `http` aponta para `/api`, que o Vite encaminha para `VITE_API_URL` —' +
        ' isso evita CORS e preserva o cookie de sessão. Em produção ele vai direto na `VITE_API_URL`.',
    );
  }

  if (selection.query) {
    items.push(
      'Cada recurso vive em `src/api/<recurso>/` com a chave de cache em `<recurso>.keys.ts`' +
        ' (`all` → `lists()` → `list(params)`), as chamadas em `<recurso>.api.ts` e os hooks em' +
        ' `<recurso>.queries.ts`. Importe pelo barrel. Veja `src/api/posts/` como referência.',
    );
  }

  if (selection.router === 'tanstack') {
    items.push(
      '`src/routeTree.gen.ts` é gerado pelo plugin do Vite. Por isso o `build` roda o `vite` antes' +
        ' do `tsc`: num clone novo o arquivo ainda não existe.',
    );
  }

  if (selection.vitest) {
    items.push(
      'Os testes ficam ao lado do código (`*.test.ts`/`*.test.tsx`), sem pasta `__tests__`, e' +
        ' usam o `tsconfig.vitest.json`. Ele é referenciado pelo `tsconfig.json`, então o editor' +
        ' enxerga os matchers do jest-dom e o `typecheck` cobre os testes — sem que os tipos de' +
        ' teste vazem para o código do app, que continua no `tsconfig.app.json`.',
    );
  }

  return items;
}

export function composeReadme(input: ReadmeInput): string {
  const { selection, scripts, packageManager } = input;

  const stack = stackList(selection)
    .map((item) => `- ${item}`)
    .join('\n');

  const scriptRows = Object.keys(scripts)
    .filter((name) => name in SCRIPT_DESCRIPTIONS)
    .map((name) => `| \`${runCommand(packageManager, name)}\` | ${SCRIPT_DESCRIPTIONS[name]} |`)
    .join('\n');

  const conventionList = conventions(selection)
    .map((item) => `- ${item}`)
    .join('\n');

  const setup = selection.env
    ? `\`\`\`sh\ncp sample.env .env\n${runCommand(packageManager, 'dev')}\n\`\`\``
    : `\`\`\`sh\n${runCommand(packageManager, 'dev')}\n\`\`\``;

  return `# ${selection.packageName}

${setup}

## Stack

${stack}

## Comandos

| Comando | O que faz |
| --- | --- |
${scriptRows}

## Convenções

${conventionList}

---

Gerado com [create-anvil](https://github.com/UsgMathe/create-anvil).
`;
}
