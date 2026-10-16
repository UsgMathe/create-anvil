import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';

import { postsListOptions, usePostsQuery } from '@/api/posts';
import { ContactForm, type ContactValues } from '@/components/contact-form';
import { Button } from '@/components/ui/button';
import { useCounterStore } from '@/stores/counter-store';

export const Route = createFileRoute('/examples')({
  loader: ({ context }) => context.queryClient.ensureQueryData(postsListOptions()),
  component: ExamplesRoute,
});

function PostsList() {
  const posts = usePostsQuery();

  if (posts.isPending) return <p className="text-muted-foreground">Carregando posts…</p>;

  if (posts.isError) {
    return (
      <p role="alert" className="text-destructive">
        Não deu para carregar os posts: {posts.error.message}
      </p>
    );
  }

  if (posts.data.length === 0) return <p className="text-muted-foreground">Nenhum post ainda.</p>;

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
      <p className="text-muted-foreground">
        Lista vinda do TanStack Query, com as chamadas em <code className="rounded bg-muted px-1 py-0.5">src/api/posts/</code>. Em desenvolvimento, o <code className="rounded bg-muted px-1 py-0.5">http</code> passa pelo proxy <code className="rounded bg-muted px-1 py-0.5">/api</code>,
          que aponta para <code className="rounded bg-muted px-1 py-0.5">VITE_API_URL</code>.
      </p>
      <PostsList />
    </section>
  );
}

function ContactSection() {
  const [sent, setSent] = useState<ContactValues | null>(null);

  const handleSubmit = async (values: ContactValues) => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    setSent(values);
  };

  return (
    <section className="space-y-3">
      <h2 className="text-xl font-semibold tracking-tight">Formulário</h2>
      <p className="text-muted-foreground">
        react-hook-form validando com zod, em <code className="rounded bg-muted px-1 py-0.5">src/components/contact-form.tsx</code>.
      </p>
      <ContactForm onSubmit={handleSubmit} />
      {sent ? (
        <p aria-live="polite" className="text-muted-foreground">
          Recebido: {sent.email}
        </p>
      ) : null}
    </section>
  );
}

function CounterSection() {
  const count = useCounterStore((state) => state.count);
  const increment = useCounterStore((state) => state.increment);
  const reset = useCounterStore((state) => state.reset);

  return (
    <section className="space-y-3">
      <h2 className="text-xl font-semibold tracking-tight">Estado global</h2>
      <p className="text-muted-foreground">
        Store do Zustand em <code className="rounded bg-muted px-1 py-0.5">src/stores/counter-store.ts</code>: o valor sobrevive à troca de
        página.
      </p>
      <div className="flex items-center gap-3">
        <span className="tabular-nums">Contagem: {count}</span>
        <Button onClick={increment}>+1</Button>
        <Button variant="outline" onClick={reset}>
          Zerar
        </Button>
      </div>
    </section>
  );
}

function ExamplesRoute() {
  return (
    <div className="space-y-10">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">Exemplos</h1>
        <p className="mt-2 text-muted-foreground">
          Cada seção usa uma peça da stack escolhida. Quando não precisar mais, apague <code className="rounded bg-muted px-1 py-0.5">src/routes/examples.tsx</code> e os links
          para <code className="rounded bg-muted px-1 py-0.5">/examples</code>.
        </p>
      </header>
      <PostsSection />
      <ContactSection />
      <CounterSection />
    </div>
  );
}
