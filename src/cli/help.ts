export const HELP_TEXT = `
create-anvil — scaffold de Vite + React + TypeScript

Uso:
  npm create anvil@latest <nome-do-projeto> [opções]

Opções:
  --router <none|react-router|tanstack>  Roteador do projeto (padrão: pergunta)
  --linter <oxlint|eslint|biome>         Linter (padrão: oxlint, o do create-vite)
  --preset <minimal|full>                Conjunto pronto de escolhas
  --pm <npm|pnpm|yarn|bun>               Força o gerenciador de pacotes

  --query / --no-query                   TanStack Query
  --tailwind / --no-tailwind             TailwindCSS v4
  --shadcn / --no-shadcn                 shadcn/ui
  --prettier / --no-prettier             Prettier
  --vitest / --no-vitest                 Vitest + Testing Library
  --zustand / --no-zustand               Zustand
  --forms / --no-forms                   react-hook-form + zod
  --husky / --no-husky                   husky + lint-staged
  --gh-actions / --no-gh-actions         Workflow de CI no projeto gerado
  --env / --no-env                       Valida .env com zod (sample.env + config/env.ts)
  --git / --no-git                       git init + commit inicial
  --install / --no-install               Instalar dependências

  -y, --yes                              Aceita os padrões, sem perguntar
  --dry-run                              Mostra o que seria feito e sai
  --keep-on-error                        Não apaga a pasta se algo falhar
  -h, --help                             Esta ajuda
  -v, --version                          Versão
`.trim();
