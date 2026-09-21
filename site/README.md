# site

```sh
npm run dev
```

## Stack

- **Vite** + **React** + **TypeScript**
- **TailwindCSS v4**
- **Oxlint**
- **Prettier**

## Comandos

| Comando                | O que faz                              |
| ---------------------- | -------------------------------------- |
| `npm run dev`          | Sobe o servidor de desenvolvimento.    |
| `npm run build`        | Typecheck e build de produção.         |
| `npm run lint`         | Roda o linter.                         |
| `npm run preview`      | Serve o build de produção localmente.  |
| `npm run typecheck`    | Só o typecheck, sem gerar bundle.      |
| `npm run lint:fix`     | Roda o linter corrigindo o que der.    |
| `npm run format`       | Formata o projeto.                     |
| `npm run format:check` | Falha se algo estiver fora do formato. |

## Convenções

- `@/` é atalho para `src/` — configurado no `vite.config.ts` e nos tsconfigs.
- `enum` **não compila**: o `erasableSyntaxOnly` está ligado. Use um objeto `as const` mais uma union:

  ```ts
  export const Status = { ativo: 'ativo', inativo: 'inativo' } as const;
  export type Status = (typeof Status)[keyof typeof Status];
  ```

- Use `import type { ... }` para importar apenas tipos — o `verbatimModuleSyntax` exige.
- Tailwind v4 **não tem `tailwind.config.js`**: a configuração é CSS-first, em `src/index.css`.
- O Prettier ordena as classes do Tailwind sozinho — não ordene à mão contra o formatador.

---

Gerado com [create-anvil](https://github.com/UsgMathe/create-anvil).
