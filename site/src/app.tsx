import { Check, Copy, Moon, RotateCcw, Sun } from 'lucide-react';
import { useState } from 'react';

import { Logo } from '@/components/logo';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/lib/theme';

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

function Ambience() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div
        className="absolute -top-64 left-1/2 h-[44rem] w-[44rem] -translate-x-1/2 drift rounded-full blur-3xl"
        style={{ background: 'radial-gradient(circle, var(--glow-warm), transparent 68%)' }}
      />
      <div
        className="absolute top-[42%] -right-56 h-[36rem] w-[36rem] drift rounded-full blur-3xl"
        style={{
          background: 'radial-gradient(circle, var(--glow-cool), transparent 68%)',
          animationDelay: '-9s',
        }}
      />
      <div
        className="absolute bottom-[-18rem] -left-40 h-[32rem] w-[32rem] drift rounded-full blur-3xl"
        style={{
          background: 'radial-gradient(circle, var(--glow-warm), transparent 70%)',
          animationDelay: '-15s',
        }}
      />
    </div>
  );
}

function ThemeToggle() {
  const { toggle } = useTheme();

  return (
    <Button variant="ghost" size="icon" onClick={toggle} aria-label="Alternar tema claro e escuro">
      <Sun className="hidden size-4 dark:block" />
      <Moon className="size-4 dark:hidden" />
    </Button>
  );
}

function InstallCommand() {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(INSTALL_COMMAND);
    setCopied(true);
    window.setTimeout(() => {
      setCopied(false);
    }, 2000);
  }

  return (
    <div className="flex max-w-xl items-center gap-2 rounded-xl glass p-2 pl-4 shadow-sm">
      <span className="font-mono text-sm text-primary select-none">$</span>
      <code className="flex-1 truncate font-mono text-sm">{INSTALL_COMMAND}</code>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => void copy()}
        aria-label="Copiar o comando de instalação"
      >
        {copied ? <Check className="size-4 text-primary" /> : <Copy className="size-4" />}
        {copied ? 'Copiado' : 'Copiar'}
      </Button>
    </div>
  );
}

function TerminalLine({ kind, text }: { kind: string; text: string }) {
  if (kind === 'blank') return <div className="h-4" aria-hidden="true" />;

  if (kind === 'command') {
    return (
      <div className="text-slab-foreground">
        <span className="text-slab-accent">$ </span>
        {text}
      </div>
    );
  }

  if (kind === 'step') {
    return (
      <div className="text-slab-muted">
        <span className="text-slab-accent">◇ </span>
        {text}
      </div>
    );
  }

  if (kind === 'done') {
    return (
      <div className="text-slab-foreground">
        <span className="text-slab-muted">└ </span>
        {text}
      </div>
    );
  }

  return <div className="pl-4 text-slab-muted">{text}</div>;
}

const FIRST_LINE_DELAY = 420;
const LINE_STEP = 230;

function Terminal() {
  const [run, setRun] = useState(0);

  return (
    <div className="relative overflow-hidden rounded-xl border border-slab-border bg-slab shadow-xl">
      <div className="flex items-center gap-2 border-b border-slab-border/70 px-5 py-2.5">
        <Logo className="h-3 w-auto text-slab-accent" />
        <span className="font-mono text-xs text-slab-muted">create-anvil</span>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            setRun((value) => value + 1);
          }}
          aria-label="Rodar de novo"
          className="ml-auto size-7 text-slab-muted hover:bg-white/10 hover:text-slab-foreground"
        >
          <RotateCcw className="size-3.5" />
        </Button>
      </div>

      <div key={run} className="overflow-x-auto p-6 font-mono text-sm leading-7 sm:p-8">
        <div className="min-w-max">
          {SESSION.map((line, index) => (
            <div
              key={index}
              className="line-in"
              style={{ animationDelay: `${FIRST_LINE_DELAY + index * LINE_STEP}ms` }}
            >
              <TerminalLine kind={line.kind} text={line.text} />
            </div>
          ))}
          <span
            className="inline-block h-4 w-2 blink line-in bg-slab-accent align-middle"
            style={{ animationDelay: `${FIRST_LINE_DELAY + SESSION.length * LINE_STEP}ms` }}
          />
        </div>
      </div>
    </div>
  );
}

export function App() {
  return (
    <div className="min-h-svh">
      <Ambience />

      <header className="sticky top-0 z-20 border-x-0 border-t-0 glass">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-6 py-3 sm:px-10">
          <Logo className="h-5 w-auto text-primary" />
          <span className="flex-1 font-mono text-sm font-bold tracking-tight">create-anvil</span>
          <nav className="flex items-center gap-1 text-sm">
            <Button variant="ghost" size="sm" asChild>
              <a href={REPO_URL}>GitHub</a>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <a href={NPM_URL}>npm</a>
            </Button>
            <ThemeToggle />
          </nav>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-6 pb-24 sm:px-10">
        <div className="border-l pl-6 sm:pl-10">
          <main>
            <h1
              className="mt-20 max-w-2xl rise text-4xl leading-[1.05] font-extrabold tracking-[-0.03em] text-balance sm:mt-28 sm:text-6xl"
              style={{ animationDelay: '60ms' }}
            >
              Escolha a stack. <span className="text-primary">O resto já está resolvido.</span>
            </h1>

            <p
              className="mt-7 max-w-xl rise text-lg leading-relaxed text-muted-foreground"
              style={{ animationDelay: '160ms' }}
            >
              Gera um projeto Vite, React e TypeScript com as ferramentas reconciliadas entre si: o
              linter não briga com o formatador, o tsconfig está correto e o roteador já está
              ligado.
            </p>

            <div className="mt-10 rise" style={{ animationDelay: '260ms' }}>
              <InstallCommand />
            </div>

            <div className="mt-16 rise" style={{ animationDelay: '360ms' }}>
              <Terminal />
            </div>

            <section className="mt-28">
              <h2 className="text-2xl font-semibold tracking-tight">O que você escolhe</h2>
              <dl className="mt-8 border-t">
                {CHOICES.map((choice) => (
                  <div
                    key={choice.label}
                    className="grid gap-1 border-b px-2 py-4 transition-colors hover:bg-card/60 sm:grid-cols-[13rem_1fr] sm:gap-6"
                  >
                    <dt className="font-medium">{choice.label}</dt>
                    <dd className="text-muted-foreground">{choice.value}</dd>
                  </div>
                ))}
              </dl>
              <p className="mt-6 max-w-xl text-sm text-muted-foreground">
                Cada escolha também é uma flag, então dá para rodar sem nenhuma pergunta em script
                ou em integração contínua.
              </p>
            </section>

            <section className="mt-28">
              <div className="max-w-2xl rounded-2xl glass p-8 shadow-sm sm:p-10">
                <h2 className="text-2xl font-semibold tracking-tight">Não é um template</h2>
                <p className="mt-6 leading-relaxed text-muted-foreground">
                  Templates envelhecem. Este CLI roda o{' '}
                  <code className="font-mono text-foreground">create-vite</code> oficial e, a partir
                  dele, escreve do zero cada arquivo que controla, em vez de remendar texto. As
                  versões de React, Vite e TypeScript vêm do próprio create-vite — quem manda nessas
                  faixas é o time do Vite.
                </p>
                <p className="mt-5 leading-relaxed text-muted-foreground">
                  O projeto gerado sai com um README escrito a partir das suas escolhas, descrevendo
                  a stack real e os comandos que existem de fato.
                </p>
                <div className="mt-8">
                  <Button asChild>
                    <a href={REPO_URL}>Ver no GitHub</a>
                  </Button>
                </div>
              </div>
            </section>
          </main>

          <footer className="mt-28 flex flex-wrap items-center justify-between gap-4 border-t pt-6 text-sm text-muted-foreground">
            <span>MIT</span>
            <span className="font-mono">Node 20.19+</span>
          </footer>
        </div>
      </div>
    </div>
  );
}
