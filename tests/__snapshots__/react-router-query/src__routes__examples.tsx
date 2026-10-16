import { usePostsQuery } from '@/api/posts';

function PostsList() {
  const posts = usePostsQuery();

  if (posts.isPending) return <p className="text-neutral-500">Carregando posts…</p>;

  if (posts.isError) {
    return (
      <p role="alert" className="text-red-600">
        Não deu para carregar os posts: {posts.error.message}
      </p>
    );
  }

  if (posts.data.length === 0) return <p className="text-neutral-500">Nenhum post ainda.</p>;

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
      <p className="text-neutral-500">
        Lista vinda do TanStack Query, com as chamadas em <code className="rounded bg-neutral-100 px-1 py-0.5">src/api/posts/</code>. Os dados são simulados em memória: troque <code className="rounded bg-neutral-100 px-1 py-0.5">posts.api.ts</code> pela
          chamada à sua API.
      </p>
      <PostsList />
    </section>
  );
}

export function ExamplesRoute() {
  return (
    <div className="space-y-10">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">Exemplos</h1>
        <p className="mt-2 text-neutral-500">
          Cada seção usa uma peça da stack escolhida. Quando não precisar mais, apague <code className="rounded bg-neutral-100 px-1 py-0.5">src/routes/examples.tsx</code> e os links
          para <code className="rounded bg-neutral-100 px-1 py-0.5">/examples</code>.
        </p>
      </header>
      <PostsSection />
    </div>
  );
}
