import { uiClasses, type UiClasses } from '../features/ui-classes.js';
import type { Selection } from '../plan/types.js';

interface Section {
  component: string;
  source: string;
}

function code(classes: UiClasses, text: string): string {
  return `<code className="${classes.code}">${text}</code>`;
}

function postsSection(selection: Selection, classes: UiClasses): Section {
  const origin = selection.api
    ? `Em desenvolvimento, o ${code(classes, 'http')} passa pelo proxy ${code(classes, '/api')},
          que aponta para ${code(classes, 'VITE_API_URL')}.`
    : `Os dados são simulados em memória: troque ${code(classes, 'posts.api.ts')} pela
          chamada à sua API.`;

  return {
    component: 'PostsSection',
    source: `function PostsList() {
  const posts = usePostsQuery();

  if (posts.isPending) return <p className="${classes.muted}">Carregando posts…</p>;

  if (posts.isError) {
    return (
      <p role="alert" className="${classes.error}">
        Não deu para carregar os posts: {posts.error.message}
      </p>
    );
  }

  if (posts.data.length === 0) return <p className="${classes.muted}">Nenhum post ainda.</p>;

  return (
    <ul className="list-disc space-y-1 pl-5">
      {posts.data.slice(0, 5).map((post) => (
        <li key={post.id}>{post.title}</li>
      ))}
    </ul>
  );
}

function PostsSection() {
  return (
    <section className="space-y-3">
      <h2 className="text-xl font-semibold tracking-tight">Posts</h2>
      <p className="${classes.muted}">
        Lista vinda do TanStack Query, com as chamadas em ${code(classes, 'src/api/posts/')}. ${origin}
      </p>
      <PostsList />
    </section>
  );
}`,
  };
}

function contactSection(classes: UiClasses): Section {
  return {
    component: 'ContactSection',
    source: `function ContactSection() {
  const [sent, setSent] = useState<ContactValues | null>(null);

  const handleSubmit = async (values: ContactValues) => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    setSent(values);
  };

  return (
    <section className="space-y-3">
      <h2 className="text-xl font-semibold tracking-tight">Formulário</h2>
      <p className="${classes.muted}">
        react-hook-form validando com zod, em ${code(classes, 'src/components/contact-form.tsx')}.
      </p>
      <ContactForm onSubmit={handleSubmit} />
      {sent ? (
        <p aria-live="polite" className="${classes.muted}">
          Recebido: {sent.email}
        </p>
      ) : null}
    </section>
  );
}`,
  };
}

function counterSection(selection: Selection, classes: UiClasses): Section {
  const buttons = selection.shadcn
    ? `<Button onClick={increment}>+1</Button>
        <Button variant="outline" onClick={reset}>
          Zerar
        </Button>`
    : `<button type="button" onClick={increment} className="rounded border px-3 py-1">
          +1
        </button>
        <button type="button" onClick={reset} className="rounded border px-3 py-1">
          Zerar
        </button>`;

  return {
    component: 'CounterSection',
    source: `function CounterSection() {
  const count = useCounterStore((state) => state.count);
  const increment = useCounterStore((state) => state.increment);
  const reset = useCounterStore((state) => state.reset);

  return (
    <section className="space-y-3">
      <h2 className="text-xl font-semibold tracking-tight">Estado global</h2>
      <p className="${classes.muted}">
        Store do Zustand em ${code(classes, 'src/stores/counter-store.ts')}: o valor sobrevive à troca de
        página.
      </p>
      <div className="flex items-center gap-3">
        <span className="tabular-nums">Contagem: {count}</span>
        ${buttons}
      </div>
    </section>
  );
}`,
  };
}

function imports(selection: Selection): string {
  const packages: string[] = [];
  if (selection.router === 'tanstack') {
    packages.push("import { createFileRoute } from '@tanstack/react-router';");
  }
  if (selection.forms) packages.push("import { useState } from 'react';");

  const local: string[] = [];
  if (selection.query) {
    const named =
      selection.router === 'tanstack' ? 'postsListOptions, usePostsQuery' : 'usePostsQuery';
    local.push(`import { ${named} } from '@/api/posts';`);
  }
  if (selection.forms) {
    local.push("import { ContactForm, type ContactValues } from '@/components/contact-form';");
  }
  if (selection.zustand && selection.shadcn) {
    local.push("import { Button } from '@/components/ui/button';");
  }
  if (selection.zustand) local.push("import { useCounterStore } from '@/stores/counter-store';");

  return [packages.join('\n'), local.join('\n')].filter(Boolean).join('\n\n');
}

function removalHint(selection: Selection, classes: UiClasses): string {
  if (selection.router === 'none') {
    return `Quando não precisar mais, apague ${code(classes, 'src/examples.tsx')} e o uso dele em
          ${code(classes, 'src/app.tsx')}.`;
  }
  return `Quando não precisar mais, apague ${code(classes, 'src/routes/examples.tsx')} e os links
          para ${code(classes, '/examples')}.`;
}

export function composeExamplePage(selection: Selection): string {
  const classes = uiClasses(selection);
  const sections: Section[] = [];
  if (selection.query) sections.push(postsSection(selection, classes));
  if (selection.forms) sections.push(contactSection(classes));
  if (selection.zustand) sections.push(counterSection(selection, classes));

  const componentName = selection.router === 'none' ? 'ExamplesPage' : 'ExamplesRoute';
  const exported = selection.router === 'tanstack' ? '' : 'export ';

  const page = `${exported}function ${componentName}() {
  return (
    <div className="space-y-10">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">Exemplos</h1>
        <p className="mt-2 ${classes.muted}">
          Cada seção usa uma peça da stack escolhida. ${removalHint(selection, classes)}
        </p>
      </header>
${sections.map((section) => `      <${section.component} />`).join('\n')}
    </div>
  );
}`;

  const blocks = [imports(selection)];

  if (selection.router === 'tanstack') {
    const loader = selection.query
      ? '\n  loader: ({ context }) => context.queryClient.ensureQueryData(postsListOptions()),'
      : '';
    blocks.push(`export const Route = createFileRoute('/examples')({${loader}
  component: ${componentName},
});`);
  }

  blocks.push(...sections.map((section) => section.source), page);

  return `${blocks.join('\n\n')}\n`;
}
