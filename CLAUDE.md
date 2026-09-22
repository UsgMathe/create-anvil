# CLAUDE.md

Guia para trabalhar neste repositório. **Mantenha este arquivo atualizado**: quando uma mudança
introduzir ou invalidar algo aqui, ajuste na mesma tarefa.

## Visão geral

CLI publicado no npm (`pnpm create anvil@latest`, ou npm, yarn e bun) que gera um SPA Vite + React +
TypeScript.
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
- **`"strict": true` é declarado explicitamente** no `tsconfig.app.json`, mesmo sendo o padrão do
  TS 6. O create-vite removeu a linha justamente porque virou padrão, mas aí o projeto passa a
  depender de um default novo: o TypeScript que roda no editor costuma ser o 5.x, onde `strict` é
  `false`, e o `createRouter` do TanStack tem uma guarda de tipo que vira a mensagem
  _"strictNullChecks must be enabled"_. Passa no `tsc` e falha no editor do usuário.
- **O script `build` usa `tsc -b`, nunca `tsc --noEmit`.** O `tsconfig.json` do create-vite é
  solution-style (`"files": []` + references), então `tsc --noEmit` **não encontra arquivo nenhum
  e sai 0** — um typecheck que não checa nada. Há teste travando isso para os três roteadores.
- **`vite.config.ts` leva `/// <reference types="vitest/config" />`** quando há bloco `test`. Sem
  isso o `defineConfig` do `vite` não conhece o campo e o `tsc -b` acusa `TS2769`.
- **`build` invertido com TanStack Router**: `vite build && tsc -b`, em vez do
  `tsc -b && vite build` do create-vite. O `routeTree.gen.ts` é gerado pelo plugin do Vite, então
  a ordem original falha num projeto recém-criado, antes de o `vite` ter rodado uma vez.
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
- **A feature `env` depende da ordem no `.gitignore`.** O `base` contribui `*.env` e o `env`
  contribui `!sample.env`; a negação só funciona **depois** do padrão que ela nega. A ordem vem da
  posição no `FEATURES` de `registry.ts` (base primeiro), e há teste garantindo isso — reordenar o
  registry sem olhar faria o `sample.env` sumir do versionamento em silêncio.
- **O README do projeto gerado é escrito por nós** (`src/compose/readme.ts`), substituindo o do
  create-vite — que ensina a configurar Oxlint mesmo quando o usuário escolheu ESLint ou Biome e
  sugere trocar para `plugin-react-swc`, o que quebraria a config gerada. Há teste garantindo que
  ele só documenta scripts que existem de fato no `package.json`.
- **O `vite.config.ts` muda de forma quando há proxy.** Sem proxy sai
  `defineConfig({ ... })`; com proxy sai `defineConfig(({ mode }) => ...)` mais `loadEnv`, porque o
  alvo do proxy vem de `VITE_API_URL` e só existe em tempo de config. O compositor cuida das duas
  formas e da indentação.
- **A feature `api` exige a `env`**, porque `src/lib/http.ts` importa `@/config/env`. O `baseURL` é
  `import.meta.env.DEV ? '/api' : env.VITE_API_URL`: em dev passa pelo proxy (sem CORS, cookie de
  sessão preservado), em produção vai direto.
- **Com vitest, os testes saem do `tsconfig.app.json`** e ganham um `tsconfig.vitest.json` próprio,
  rodado pelo script `test:types`. O build de produção deixa de typecheckar teste. O `test:types`
  entra no CI do projeto gerado — script que ninguém roda é script que mente.

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
- **`e2e`** — gera projetos de verdade e roda `build`/`lint`/`test` neles, com **npm e pnpm** (o
  pnpm é o ambiente do mantenedor, e o job de e2e no CI instala o `pnpm/action-setup` por isso).
  **Exige `npm run build`
  antes**, porque invoca `dist/index.js`; o teste falha com uma mensagem clara se o bundle não
  existir. Leva alguns minutos (um `npm install` por combinação), então roda só no CI.

A fixture em `tests/fixtures/create-vite@9.2.1/` é a saída real do create-vite, com os renomes
(`_gitignore` → `.gitignore`) aplicados no carregamento. O nome da pasta tem a versão de propósito:
uma mudança upstream aparece como pasta nova no diff, não como sobrescrita silenciosa.

## Site

`site/` é a landing page publicada em <https://usgmathe.github.io/create-anvil/> pelo workflow
_Site_, a cada push em `master` que toque `site/**`. Tem `package.json` e lockfile próprios; não é
workspace do CLI.

- **O `build` pré-renderiza** (`vite build --ssr` mais `scripts/prerender.mjs`), então tudo na
  página precisa renderizar no servidor — nada de `window` ou `localStorage` durante o render. O
  tema resolve isso com o script inline do `index.html`, antes da hidratação.
- **Os comandos por gerenciador saem de `site/src/lib/package-managers.ts`** e precisam bater com o
  `runScript` de `src/env/package-manager.ts`: a página mostra a saída real do CLI, então `bun` é
  `bun run dev` e `pnpm` é `pnpm dev`. A ordem das abas — pnpm, npm, yarn, bun — é a mesma do README.
- Os componentes de `site/src/components/ui/` vêm do registro do shadcn sem edição.

## Publicação

Publica pelo GitHub Actions com **trusted publishing (OIDC)**: Actions → _Release_ → _Run
workflow_, escolhendo a dist-tag. Não existe token npm no repositório, nem secret, nem `.npmrc`.

**O OIDC não cobre a primeira publicação de um pacote novo.** O npm exige que o pacote já exista
para aceitar um trusted publisher — não há "pending publisher". Então o bootstrap é manual e
autenticado, uma única vez por pacote:

```sh
npm login                 # ou um token, se o 2FA estiver acessível
npm publish --tag next
npm trust github create-anvil --file release.yml --repo UsgMathe/create-anvil --allow-publish
```

Feito isso, o workflow assume e nenhuma publicação seguinte pede credencial.

O `npm trust` também aceita configuração pela página do pacote em npmjs.com. Os campos são
**case-sensitive e precisam bater exatamente**: usuário `UsgMathe`, repositório `create-anvil`,
workflow `release.yml`.

Três armadilhas que já custaram tempo:

- **Não passe `registry-url` no `actions/setup-node`.** Ele escreve
  `_authToken=${NODE_AUTH_TOKEN}` no `.npmrc`; sem token a variável expande para vazio, o npm cai
  na autenticação clássica e falha com `ENEEDAUTH`. O OIDC dispensa `.npmrc`.
- **`setup-node` precisa ser v6+** (usamos v7). Versões anteriores injetam o token fantasma acima.
- **O npm do runner precisa ser ≥ 11.5.1 e o Node ≥ 22.14**, porque é o próprio npm que faz a
  troca OIDC. O Node 22 ainda vem com npm 10.x, então o workflow roda `npm install -g npm@latest`
  antes de publicar.

Renomear `release.yml` quebra a publicação em silêncio — o npm casa o publisher pelo nome do
arquivo.

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
