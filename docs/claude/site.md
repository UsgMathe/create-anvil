# Site

`site/` é a landing page publicada em <https://usgmathe.github.io/create-anvil/> pelo workflow
_Site_, a cada push em `master` que toque `site/**`. Tem `package.json` e lockfile próprios; não é
workspace do CLI.

- **O `build` pré-renderiza** (`vite build --ssr` mais `scripts/prerender.mjs`), então tudo na
  página precisa renderizar no servidor — nada de `window` ou `localStorage` durante o render. O
  tema resolve isso com o script inline do `index.html`, antes da hidratação.
- **Os comandos por gerenciador saem de `site/src/lib/package-managers.ts`** e precisam bater com o
  `runScript` de `src/env/package-manager.ts`: a página mostra a saída real do CLI, então `bun` é
  `bun run dev` e `pnpm` é `pnpm dev`. A ordem das abas — pnpm, npm, yarn, bun — é a mesma do README.
- **O construtor de comando lê `site/src/data/options.json`**, que é _gerado_ a partir de
  `src/cli/options.ts` pelo snapshot de `tests/unit/cli/options.test.ts`. Mexeu nas opções do CLI,
  rode `npm run options:sync`; sem isso o `npm test` falha apontando o arquivo velho. Nunca edite o
  JSON à mão.
- **`site/src/lib/options.ts` e `site/src/lib/command.ts` são importados pelos testes do CLI**
  (`tests/unit/cli/site-command.test.ts`), que fecham o ciclo: pegam o comando que o site monta e
  conferem no `resolveSelection` de verdade que ele reproduz a seleção. Por isso esses dois usam
  import relativo em vez de `@/` e **não podem depender do `node_modules` do site** — o CI do CLI
  roda sem ele.
- A ordem de precedência que o site replica é a do `resolve.ts`: flag explícita > preset >
  `PRESETS.minimal`. **O `prettier`, o `git` e o `install` ignoram o preset** (`presetAware: false`
  no manifesto), e o Biome zera o `prettier` seja qual for a flag.
- **O comando do construtor gruda no rodapé com `sticky bottom-…` e precisa ser o último filho do
  wrapper que contém a lista.** O sticky só se desloca dentro do próprio container: com `bottom`, o
  espaço que conta é o que está acima (a lista inteira); com `top`, é o que está abaixo — que no
  último filho não existe, e o sticky vira no-op sem aviso nenhum.
- Os rótulos do manifesto aparecem nos dois lugares, no site e nos prompts do CLI — escreva-os para
  funcionar nos dois. O linter se chama só `Oxlint`, por exemplo: o Prettier tem switch próprio no
  site, e um `Oxlint + Prettier` mentiria quando ele fosse desligado.
- Os componentes de `site/src/components/ui/` vêm do registro do shadcn sem edição.
