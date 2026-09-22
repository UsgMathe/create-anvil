<div align="center">

<img src="site/public/og.png" alt="create-anvil — escolha a stack, o resto já está resolvido" width="820">

[![npm](https://img.shields.io/npm/v/create-anvil?color=f5a524&labelColor=14181e)](https://www.npmjs.com/package/create-anvil)
[![CI](https://github.com/UsgMathe/create-anvil/actions/workflows/ci.yml/badge.svg)](https://github.com/UsgMathe/create-anvil/actions/workflows/ci.yml)
[![node](https://img.shields.io/node/v/create-anvil?color=f5a524&labelColor=14181e)](https://nodejs.org)
[![license](https://img.shields.io/npm/l/create-anvil?color=f5a524&labelColor=14181e)](LICENSE)

**[usgmathe.github.io/create-anvil](https://usgmathe.github.io/create-anvil/)**

</div>

## Instalação

**pnpm**

```bash
pnpm create anvil@latest meu-app
```

**npm**

```bash
npm create anvil@latest meu-app
```

**yarn**

```bash
yarn create anvil meu-app
```

**bun**

```bash
bun create anvil meu-app
```

O gerenciador que você usar é o que o CLI adota: ele instala as dependências com ele e escreve os
comandos do README gerado na sintaxe dele.

```
$ pnpm create anvil@latest loja

●  Gerenciador: pnpm
◇  Base criada
◇  Arquivos do projeto gerados
◇  Dependências instaladas
◇  Projeto formatado

└  Pronto.

   cd loja
   pnpm dev
```

## O que você escolhe

|                          |                                                                     |
| ------------------------ | ------------------------------------------------------------------- |
| **Roteamento**           | Nenhum, React Router v8 ou TanStack Router com rotas por arquivo    |
| **Dados**                | TanStack Query, com um módulo de exemplo já no padrão de query-keys |
| **Lint e formato**       | Oxlint, ESLint ou Biome, com Prettier quando faz sentido            |
| **Interface**            | TailwindCSS v4 e shadcn/ui, configurado sem rodar o `shadcn init`   |
| **Ambiente**             | Variáveis validadas com zod e cliente HTTP com proxy no dev         |
| **Testes**               | Vitest e Testing Library, com cobertura e typecheck dos testes      |
| **Estado e formulários** | Zustand, react-hook-form e zod                                      |
| **Repositório**          | `git init` com commit inicial, husky e workflow de CI               |

Dois presets cobrem os extremos:

```bash
pnpm create anvil@latest meu-app --preset=minimal   # Vite, React, TS, Tailwind, Oxlint, Prettier
pnpm create anvil@latest meu-app --preset=full      # tudo ligado, com ESLint no lugar do Oxlint
```

Uma flag explícita vence o preset, então `--preset=full --router=none` faz o que parece. Só o `npm`
exige separar as flags com `--`: `npm create anvil@latest meu-app -- --preset=full`.

<details>
<summary><b>Todas as opções</b></summary>

<br>

| Opção                                     | Descrição                                                                                     |
| ----------------------------------------- | --------------------------------------------------------------------------------------------- |
| `--router <none\|react-router\|tanstack>` | Roteamento. `react-router` usa a v8 em modo biblioteca; `tanstack` usa rotas por arquivo.     |
| `--linter <oxlint\|eslint\|biome>`        | Padrão `oxlint`, que é o que o create-vite já entrega.                                        |
| `--preset <minimal\|full>`                | Conjunto pronto de escolhas.                                                                  |
| `--pm <pnpm\|npm\|yarn\|bun>`             | Força o gerenciador. Sem a flag, vale o que você usou para invocar o CLI.                     |
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

</details>

## Não é um template

Templates envelhecem. Este CLI roda o `create-vite` oficial e, a partir dele, **escreve do zero**
cada arquivo que controla — `main.tsx`, `vite.config.ts`, rotas, providers e configurações. Não há
remendo de texto: os arquivos compartilhados são compostos a partir de contribuições ordenadas,
então adicionar uma feature não quebra outra.

O `package.json` gerado herda do `create-vite` as versões de `react`, `vite`, `typescript` e
companhia — quem manda nessas faixas é o time do Vite, não este CLI.

## O que o projeto gerado recebe

- `@/` como atalho para `src/`, em sincronia no `vite.config.ts` e nos tsconfigs.
- Um **README escrito a partir das escolhas** — a stack real, os comandos que existem, e as
  convenções que não são óbvias, entre elas que `enum` não compila porque o create-vite liga o
  `erasableSyntaxOnly`.
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
