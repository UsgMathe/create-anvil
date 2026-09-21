# create-anvil

> Scaffold de **Vite + React + TypeScript + TailwindCSS**, com roteamento, TanStack Query e shadcn/ui opcionais.

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

| Opção                                     | Descrição                                                                                 |
| ----------------------------------------- | ----------------------------------------------------------------------------------------- |
| `--router <none\|react-router\|tanstack>` | Roteamento. `react-router` usa a v8 em modo biblioteca; `tanstack` usa rotas por arquivo. |
| `--linter <oxlint\|eslint\|biome>`        | Padrão `oxlint` (o que o create-vite já entrega) + Prettier.                              |
| `--preset <minimal\|full>`                | Conjunto pronto de escolhas.                                                              |
| `--pm <npm\|pnpm\|yarn\|bun>`             | Força o gerenciador de pacotes.                                                           |
| `--query` / `--no-query`                  | TanStack Query.                                                                           |
| `--tailwind` / `--no-tailwind`            | TailwindCSS v4.                                                                           |
| `--shadcn` / `--no-shadcn`                | shadcn/ui.                                                                                |
| `--prettier` / `--no-prettier`            | Prettier.                                                                                 |
| `--vitest` / `--no-vitest`                | Vitest + Testing Library.                                                                 |
| `--zustand` / `--no-zustand`              | Zustand.                                                                                  |
| `--forms` / `--no-forms`                  | react-hook-form + zod.                                                                    |
| `--husky` / `--no-husky`                  | husky + lint-staged.                                                                      |
| `--gh-actions` / `--no-gh-actions`        | Workflow de CI no projeto gerado.                                                         |
| `--git` / `--no-git`                      | `git init` + commit inicial.                                                              |
| `--install` / `--no-install`              | Instalar dependências.                                                                    |
| `-y, --yes`                               | Aceita os padrões, sem perguntar.                                                         |
| `--dry-run`                               | Mostra o que seria feito e sai.                                                           |
| `--keep-on-error`                         | Não apaga a pasta se algo falhar.                                                         |

Toda escolha tem flag, e **uma flag presente suprime o prompt correspondente** — o CLI é usável em
script e em CI sem nenhuma interação. Se algo falhar no meio, a pasta criada é removida.

## Escolha do linter

O `create-vite` hoje entrega **Oxlint**, não ESLint. Por isso o padrão é **Oxlint + Prettier**:
o Oxlint só faz lint e o Prettier só formata, então não há sobreposição e não é preciso
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
npm test          # unitários + geração, sem rede
npm run typecheck
npm run lint
npm run build
```

Veja [CLAUDE.md](CLAUDE.md) para a arquitetura e as convenções do projeto.

## Licença

MIT
