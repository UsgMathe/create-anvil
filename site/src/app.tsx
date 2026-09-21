import { useState } from 'react';

const INSTALL_COMMAND = 'npm create anvil@latest meu-app';

const REPO_URL = 'https://github.com/UsgMathe/create-anvil';
const NPM_URL = 'https://www.npmjs.com/package/create-anvil';

const SESSION = [
  { kind: 'command', text: 'npm create anvil@latest loja' },
  { kind: 'blank', text: '' },
  { kind: 'step', text: 'Base criada' },
  { kind: 'step', text: 'Arquivos do projeto gerados' },
  { kind: 'step', text: 'Dependências instaladas' },
  { kind: 'step', text: 'Projeto formatado' },
  { kind: 'blank', text: '' },
  { kind: 'done', text: 'Pronto.' },
  { kind: 'blank', text: '' },
  { kind: 'hint', text: 'cd loja' },
  { kind: 'hint', text: 'npm run dev' },
];

const CHOICES = [
  {
    label: 'Roteamento',
    value: 'Nenhum, React Router v8 ou TanStack Router com rotas por arquivo',
  },
  { label: 'Dados', value: 'TanStack Query, com um módulo de exemplo já no padrão de query-keys' },
  { label: 'Lint e formato', value: 'Oxlint, ESLint ou Biome, com Prettier quando faz sentido' },
  { label: 'Interface', value: 'TailwindCSS v4 e shadcn/ui configurado sem prompt' },
  { label: 'Ambiente', value: 'Variáveis validadas com zod e cliente HTTP com proxy no dev' },
  { label: 'Testes', value: 'Vitest e Testing Library, com cobertura e typecheck dos testes' },
  { label: 'Estado e formulários', value: 'Zustand, react-hook-form e zod' },
  { label: 'Repositório', value: 'git init com commit inicial, husky e workflow de CI' },
];

function CopyButton() {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(INSTALL_COMMAND);
    setCopied(true);
    window.setTimeout(() => {
      setCopied(false);
    }, 2000);
  }

  return (
    <button
      type="button"
      onClick={() => void copy()}
      className="shrink-0 cursor-pointer rounded-sm border border-rule px-3 py-1.5 font-sans text-xs font-medium text-steel transition-colors hover:border-ink hover:text-ink"
    >
      {copied ? 'Copiado' : 'Copiar'}
    </button>
  );
}

function TerminalLine({ kind, text }: { kind: string; text: string }) {
  if (kind === 'blank') return <div className="h-4" aria-hidden="true" />;

  if (kind === 'command') {
    return (
      <div className="text-slab-cmd">
        <span className="text-slab-dim">$ </span>
        {text}
      </div>
    );
  }

  if (kind === 'step') {
    return (
      <div className="text-slab-dim">
        <span className="text-slab-step">◇ </span>
        {text}
      </div>
    );
  }

  if (kind === 'done') {
    return (
      <div className="text-slab-cmd">
        <span className="text-slab-dim">└ </span>
        {text}
      </div>
    );
  }

  return <div className="pl-4 text-slab-dim">{text}</div>;
}

export function App() {
  return (
    <div className="min-h-svh px-6 py-10 sm:px-10 lg:px-16">
      <div className="mx-auto max-w-4xl border-l border-rule pl-6 sm:pl-10">
        <header className="flex flex-wrap items-baseline justify-between gap-4">
          <span className="font-mono text-sm font-bold tracking-tight">create-anvil</span>
          <nav className="flex gap-5 text-sm text-steel">
            <a className="hover:text-ink hover:underline" href={REPO_URL}>
              GitHub
            </a>
            <a className="hover:text-ink hover:underline" href={NPM_URL}>
              npm
            </a>
          </nav>
        </header>

        <main>
          <h1 className="mt-20 max-w-2xl text-4xl leading-[1.05] font-extrabold tracking-[-0.03em] text-balance sm:mt-28 sm:text-6xl">
            Escolha a stack. O resto já está resolvido.
          </h1>

          <p className="mt-7 max-w-xl text-lg leading-relaxed text-steel">
            Gera um projeto Vite, React e TypeScript com as ferramentas reconciliadas entre si: o
            linter não briga com o formatador, o tsconfig está correto e o roteador já está ligado.
          </p>

          <div className="mt-10 flex max-w-xl items-center gap-3 border border-rule bg-white/50 px-4 py-3">
            <code className="flex-1 truncate font-mono text-sm">{INSTALL_COMMAND}</code>
            <CopyButton />
          </div>

          <div className="mt-16 overflow-x-auto rounded-sm bg-slab p-6 font-mono text-sm leading-7 sm:p-8">
            <div className="min-w-max">
              {SESSION.map((line, index) => (
                <TerminalLine key={index} kind={line.kind} text={line.text} />
              ))}
            </div>
          </div>

          <section className="mt-28">
            <h2 className="text-2xl font-semibold tracking-tight">O que você escolhe</h2>
            <dl className="mt-8 border-t border-rule">
              {CHOICES.map((choice) => (
                <div
                  key={choice.label}
                  className="grid gap-1 border-b border-rule py-4 sm:grid-cols-[13rem_1fr] sm:gap-6"
                >
                  <dt className="font-medium">{choice.label}</dt>
                  <dd className="text-steel">{choice.value}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-6 max-w-xl text-sm text-steel">
              Cada escolha também é uma flag, então dá para rodar sem nenhuma pergunta em script ou
              em integração contínua.
            </p>
          </section>

          <section className="mt-28 max-w-xl">
            <h2 className="text-2xl font-semibold tracking-tight">Não é um template</h2>
            <p className="mt-6 leading-relaxed text-steel">
              Templates envelhecem. Este CLI roda o{' '}
              <code className="font-mono text-ink">create-vite</code> oficial e, a partir dele,
              escreve do zero cada arquivo que controla, em vez de remendar texto. As versões de
              React, Vite e TypeScript vêm do próprio create-vite — quem manda nessas faixas é o
              time do Vite.
            </p>
            <p className="mt-5 leading-relaxed text-steel">
              O projeto gerado sai com um README escrito a partir das suas escolhas, descrevendo a
              stack real e os comandos que existem de fato.
            </p>
          </section>
        </main>

        <footer className="mt-28 flex flex-wrap items-center justify-between gap-4 border-t border-rule pt-6 text-sm text-steel">
          <span>MIT</span>
          <span className="font-mono">Node 20.19+</span>
        </footer>
      </div>
    </div>
  );
}
