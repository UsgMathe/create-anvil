# CLAUDE.md

Guia para trabalhar neste repositório. **Mantenha este arquivo atualizado**: quando uma mudança
introduzir ou invalidar algo aqui, ajuste na mesma tarefa.

## Visão geral

CLI publicado no npm (`npm create vrtw-usgmathe@latest`) que gera um SPA Vite + React + TypeScript.
Escrito em TypeScript, empacotado com `tsup` num único `dist/index.js` **sem dependências de
runtime** — o pacote é baixado a cada invocação, então cada dependência seria latência para o
usuário.

**Idiomas:** prompts, mensagens de erro e documentação em português; identificadores de código em
inglês. Indentação de 2 espaços.

## Comandos

```sh
npm install
npm test           # projetos "unit" + "gen" — rápidos, sem rede
npm run build && npm run test:e2e   # e2e: gera projetos de verdade (lento, com rede)
npm run typecheck
npm run lint
npm run build      # tsup -> dist/index.js
```

## A regra que sustenta o projeto

**`src/plan/` é puro. `src/run/` é o único lugar com efeito colateral.**

O ESLint impõe isso: `no-restricted-imports` proíbe `execa` e `node:fs` fora de `src/run/`,
`src/index.ts`, testes e arquivos de config. Não relaxe essa regra — é ela que mantém a geração
testável sem rede e sem disco.

O fluxo é `Selection + BaseTree → buildPlan() → Plan → applyPlan()`. `BaseTree` é a saída do
`create-vite` lida como dados (`Record<caminho, conteúdo>`), o que transforma "testar um scaffolder"
em "chamar uma função pura".

`src/index.ts` é só o bin: três linhas que chamam `main()` de `src/cli/main.ts`. **Nada pode rodar
no escopo de módulo** — quando `main` morava no `index.ts`, importá-lo nos testes executava o CLI.

## Arquitetura

| Pasta           | Papel                                                                                            |
| --------------- | ------------------------------------------------------------------------------------------------ |
| `src/cli/`      | args (`node:util parseArgs`), prompts (`@clack/prompts`), presets, resolução de opções, `main()` |
| `src/features/` | uma feature por arquivo + `registry.ts` + `versions.ts`                                          |
| `src/compose/`  | funções puras que montam os arquivos co-possuídos                                                |
| `src/plan/`     | `buildPlan()` e `assertManifestCoherent()`                                                       |
| `src/run/`      | a porta `Io` e `applyPlan()`                                                                     |

### Como adicionar uma feature

Crie um arquivo em `src/features/` exportando um `Feature` e registre-o em `registry.ts`. O tipo
`Feature` (em `src/plan/types.ts`) cobre dependências, arquivos, scripts, **remoções** e as
contribuições para arquivos compartilhados.

**Remoção é contribuição de primeira classe.** Escolher ESLint ou Biome precisa remover o `oxlint`,
o `.oxlintrc.json` e reescrever o script `lint` — por isso existem `removeDependencies`,
`removeFiles` e `removeScripts`.

### Arquivos co-possuídos e o campo `order`

`main.tsx`, `vite.config.ts`, `package.json#scripts` e `index.css` pertencem a várias features ao
mesmo tempo. Cada uma contribui um objeto com `order`, e o compositor ordena. **A ordem é
carga-de-trabalho real, não estética:**

- `vite.config.ts`: tailwind (10) → `tanstackRouter` (20) → `react` (30). O plugin do TanStack
  **precisa** vir antes do `@vitejs/plugin-react` com `autoCodeSplitting`, senão ele lança.
- `main.tsx`: `QueryClientProvider` (10) por fora, `RouterProvider` por dentro. O `RouterProvider`
  é terminal nas duas bibliotecas de rota, então só pode ser a folha.

`buildPlan` lança se duas features escreverem o mesmo arquivo, definirem o mesmo script com valores
diferentes, ou definirem o elemento raiz do `main.tsx` — os conflitos aparecem no teste da matriz,
não no usuário.

### `assertManifestCoherent`

Invariante única sobre o plano: todo binário citado em `scripts` e toda ferramenta com arquivo de
config **precisa estar nas dependências**, e vice-versa. É o que impede a classe inteira de bugs do
tipo "escreveu `.prettierrc.json` mas nunca instalou o `prettier`". Roda sobre toda a matriz de
combinações em milissegundos.

## Decisões com motivo

- **O `create-vite` é o oráculo de versões.** Só um arquivo dele sobrevive (`public/favicon.svg`),
  mas o `package.json` gerado herda as faixas de `react`, `vite`, `typescript` e `@types/*` dele.
  Nunca fixe essas versões aqui.
- **Nós fixamos major (`^5`, `^8`) do que adicionamos**, em `src/features/versions.ts`. Geramos
  código contra a API de um major específico; `@latest` produziria projetos que não compilam quando
  sair um major novo.
- **`--no-interactive` no create-vite.** As flags reais do create-vite 9 são `help`, `overwrite`,
  `immediate`, `interactive`, `eslint`. **Não existe `--no-rolldown`** — passar flag inexistente é
  no-op silencioso no `mri`. Passamos sempre `--template react-ts` explícito, porque sem ele o
  padrão não-interativo cai em `vanilla-ts`.
- **`paths` sem `baseUrl` no tsconfig.** O TypeScript 6 emite erro `TS5101` em `baseUrl`, e o
  template fixa `typescript ~6.0.2`. O tsconfig é editado com `jsonc-parser` (`modify`/`applyEdits`),
  que preserva os comentários — nunca com regex.
- **`build` invertido com TanStack Router**: `vite build && tsc --noEmit`. O `routeTree.gen.ts` é
  gerado pelo plugin do Vite, então `tsc -b && vite build` falha num projeto recém-criado.
- **`react-refresh/only-export-components` desligado em `src/routes/**`.** Arquivos de rota do
  TanStack exportam `Route` e nenhum componente; `allowExportNames` não resolve esse caso.
- **O shadcn é gerado por nós, sem rodar `shadcn init`.** Escrevemos `components.json` e
  `src/lib/utils.ts`. O registro atual usa o pacote **`cn`** (não mais `clsx` + `tailwind-merge`) e
  o **`radix-ui`** unificado — confira em `r/styles/new-york-v4/index.json` antes de mexer.
- **`@import "shadcn/tailwind.css"` NÃO traz os tokens de cor.** Esse arquivo só tem `@keyframes`.
  Sem `src/features/shadcn-theme.ts`, `@apply border-border` falha com _"Cannot apply unknown
  utility class"_ e o build inteiro quebra. As variáveis vêm de `r/colors/neutral.json` (campo
  `cssVarsV4`), e o `@theme inline` que as transforma em utilitários é gerado a partir delas.
  Para atualizar o tema, regenere `shadcn-theme.ts` a partir desse endpoint — não edite à mão.
- **`git init` antes do install.** O `prepare` do husky roda durante o install e exige `.git`.
- **Formatação depois do install**, rodando o `format` do próprio projeto gerado. Templates escritos
  à mão não batem com a config do Prettier que nós mesmos escrevemos.
- **Bundle com `noExternal: [/.*/]`** e banner de `createRequire`: o `validate-npm-package-name` é
  CJS e faz `require` dinâmico, que quebra em ESM sem o shim.

## Testes

Três projetos do vitest, definidos em `vitest.config.ts`:

- **`unit`** — validação, detecção de gerenciador e **todos os compositores**, mais a matriz de
  combinações passando por `assertManifestCoherent`. Sem I/O.
- **`gen`** — `main()` com um `Io` falso: rollback, ordem do pipeline, códigos de saída.
- **`e2e`** — gera projetos de verdade e roda `build`/`lint`/`test` neles. **Exige `npm run build`
  antes**, porque invoca `dist/index.js`; o teste falha com uma mensagem clara se o bundle não
  existir. Leva alguns minutos (um `npm install` por combinação), então roda só no CI.

A fixture em `tests/fixtures/create-vite@9.2.1/` é a saída real do create-vite, com os renomes
(`_gitignore` → `.gitignore`) aplicados no carregamento. O nome da pasta tem a versão de propósito:
uma mudança upstream aparece como pasta nova no diff, não como sobrescrita silenciosa.

## Pitfalls

- **O `.gitattributes` com `eol=lf` é obrigatório.** Windows + CRLF + snapshots = tudo vermelho no
  CI do Linux.
- **Nunca use `split` com classe de caractere para separar caminhos.** Use `toPosix()` de
  `src/run/io.ts`, que usa `path.sep`. No Windows `relative()` devolve `\`.
- **`io.run` usa `stdio: ['ignore', 'inherit', 'inherit']` — não troque por `'inherit'`.** Todo
  processo filho roda com `--no-interactive` e nenhum deve ler stdin. Com `'inherit'`, quem
  invocar o CLI programaticamente (execa com `stdio: 'pipe'`, um runner de CI) entrega ao
  `create-vite` um stdin que é um pipe aberto que ninguém escreve nem fecha, e ele **trava para
  sempre** no passo de scaffold. Com `ignore` a leitura recebe EOF na hora. O teste e2e cobre isso
  porque spawna o CLI com `stdio: 'pipe'`.
- `tsconfig.json` exclui `tests/fixtures/**` e `tests/__snapshots__/**`: os snapshots têm extensão
  real (`.tsx`) para serem revisáveis, e sem o exclude o `tsc` tenta compilá-los.
- Os testes `gen` importam de `src/cli/main.js`, **nunca** de `src/index.js`.
