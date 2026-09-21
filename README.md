# create-anvil

> Scaffold de **Vite + React + TypeScript**, com roteamento, TanStack Query, validação de ambiente,
> testes e shadcn/ui opcionais.

**[usgmathe.github.io/create-anvil](https://usgmathe.github.io/create-anvil/)**

```bash
npm create anvil@latest meu-app
cd meu-app
npm run dev
```

## O que ele faz

Roda o `create-vite` para obter a base oficial e, a partir dela, **escreve do zero** cada arquivo
que controla — `main.tsx`, `vite.config.ts`, rotas, providers e configurações. Não há remendo de
texto: os arquivos compartilhados são compostos a partir de contribuições ordenadas, então
adicionar uma feature não quebra outra.

O `package.json` gerado herda do `create-vite` as versões de `react`, `vite`, `typescript` e
companhia — quem manda nessas faixas é o time do Vite, não este CLI.

## Opções

```bash
npm create anvil@latest meu-app -- [opções]
```

| Opção                                     | Descrição                                                                                     |
| ----------------------------------------- | --------------------------------------------------------------------------------------------- |
| `--router <none\|react-router\|tanstack>` | Roteamento. `react-router` usa a v8 em modo biblioteca; `tanstack` usa rotas por arquivo.     |
| `--linter <oxlint\|eslint\|biome>`        | Padrão `oxlint`, que é o que o create-vite já entrega. Veja a seção abaixo.                   |
| `--preset <minimal\|full>`                | Conjunto pronto de escolhas.                                                                  |
| `--pm <npm\|pnpm\|yarn\|bun>`             | Força o gerenciador de pacotes.                                                               |
| `--query` / `--no-query`                  | TanStack Query, com um módulo de exemplo em `src/api/posts/`.                                 |
| `--tailwind` / `--no-tailwind`            | TailwindCSS v4.                                                                               |
| `--shadcn` / `--no-shadcn`                | shadcn/ui, configurado sem rodar o `shadcn init`.                                             |
| `--prettier` / `--no-prettier`            | Prettier.                                                                                     |
| `--vitest` / `--no-vitest`                | Vitest + Testing Library, com cobertura e typecheck dos testes.                               |
| `--zustand` / `--no-zustand`              | Zustand.                                                                                      |
| `--forms` / `--no-forms`                  | react-hook-form + zod.                                                                        |
| `--husky` / `--no-husky`                  | husky + lint-staged.                                                                          |
| `--gh-actions` / `--no-gh-actions`        | Workflow de CI no projeto gerado.                                                             |
| `--env` / `--no-env`                      | Valida as variáveis de ambiente com zod: `sample.env`, `.env` e `src/config/env.ts`.          |
| `--api` / `--no-api`                      | Cliente HTTP (axios) e proxy de `/api` para `VITE_API_URL` no desenvolvimento. Exige `--env`. |
| `--git` / `--no-git`                      | `git init` + commit inicial.                                                                  |
| `--install` / `--no-install`              | Instalar dependências.                                                                        |
| `-y, --yes`                               | Aceita os padrões, sem perguntar.                                                             |
| `--dry-run`                               | Mostra o que seria feito e sai.                                                               |
| `--keep-on-error`                         | Não apaga a pasta se algo falhar.                                                             |
| `-h, --help` · `-v, --version`            | Ajuda e versão.                                                                               |

Toda escolha tem flag, e **uma flag presente suprime o prompt correspondente** — o CLI é usável em
script e em CI sem nenhuma interação. Se algo falhar no meio, a pasta criada é removida.

### Presets

- `minimal` — Vite + React + TS + Tailwind, com Oxlint e Prettier. Nada além disso.
- `full` — tudo ligado: TanStack Router e Query, shadcn/ui, env + cliente HTTP, Vitest, Zustand,
  formulários, husky e workflow de CI, com ESLint no lugar do Oxlint.

Uma flag explícita vence o preset, então `--preset=full --router=none` faz o que parece.

## O que o projeto gerado recebe

- `@/` como atalho para `src/`, em sincronia no `vite.config.ts` e nos tsconfigs.
- Um **README escrito a partir das escolhas** — a stack real, os comandos que existem, e as
  convenções que não são óbvias (entre elas que `enum` não compila, porque o create-vite liga o
  `erasableSyntaxOnly`).
- Scripts coerentes com o que foi instalado: `dev` e `preview` sobem com `--host`; `typecheck`;
  `lint`/`lint:fix`; `format`/`format:check`; e, com Vitest, `test`, `test:watch`, `test:coverage`
  e `test:types`.
- Com `--env` e `--api`, o `http` aponta para `/api` em desenvolvimento e o Vite encaminha para a
  `VITE_API_URL` — sem CORS e preservando o cookie de sessão. Em produção ele vai direto.

## Escolha do linter

O `create-vite` hoje entrega **Oxlint**, não ESLint. Por isso o padrão é **Oxlint + Prettier**: o
Oxlint só faz lint e o Prettier só formata, então não há sobreposição e não é preciso
`eslint-config-prettier`. As alternativas removem o Oxlint por completo:

- **ESLint + Prettier** — escolha quando precisar do ecossistema de plugins. Com TanStack Query
  selecionado entra também o `@tanstack/eslint-plugin-query`, que não tem equivalente no Oxlint.
- **Biome** — uma ferramenta só. Note que a ordenação de classes do Tailwind (`useSortedClasses`)
  ainda é _nursery_ no Biome, então você perde o `prettier-plugin-tailwindcss`.

## Requisitos

Node.js `^20.19.0 || >=22.12.0` — o mesmo piso do create-vite 9 e do Vite 8.

## Desenvolvimento

```bash
npm install
npm test            # unitários + geração, rápidos e sem rede
npm run typecheck
npm run lint
npm run format
npm run build
```

Os testes ponta a ponta geram projetos de verdade e rodam `build`/`lint`/`test` neles, com npm e
pnpm. Levam alguns minutos e exigem um build antes:

```bash
npm run build && npm run test:e2e
```

Veja [CLAUDE.md](CLAUDE.md) para a arquitetura, as convenções e o processo de publicação.

## Licença

MIT
