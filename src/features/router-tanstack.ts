import type { Feature, FeatureContext } from '../plan/types.js';
import { entries } from './versions.js';

function rootRouteTsx(withQuery: boolean): string {
  const imports = withQuery
    ? `import { Link, Outlet, createRootRouteWithContext } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';
import type { QueryClient } from '@tanstack/react-query';`
    : `import { Link, Outlet, createRootRoute } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';`;

  const routeDeclaration = withQuery
    ? `export const Route = createRootRouteWithContext<{
  queryClient: QueryClient;
}>()({
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});`
    : `export const Route = createRootRoute({
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});`;

  return `${imports}

${routeDeclaration}

function RootComponent() {
  return (
    <div className="min-h-svh">
      <header className="border-b">
        <nav className="mx-auto flex max-w-3xl gap-4 p-4">
          <Link to="/" activeProps={{ className: 'font-bold' }} activeOptions={{ exact: true }}>
            Home
          </Link>
        </nav>
      </header>
      <main className="mx-auto max-w-3xl p-4">
        <Outlet />
      </main>
      <TanStackRouterDevtools position="bottom-right" />
    </div>
  );
}

function NotFoundComponent() {
  return (
    <section>
      <h1 className="text-3xl font-semibold tracking-tight">404</h1>
      <p className="mt-2 text-neutral-500">Esta página não existe.</p>
      <Link to="/" className="mt-4 inline-block underline">
        Voltar para o início
      </Link>
    </section>
  );
}
`;
}

const INDEX_ROUTE_TSX = `import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/')({
  component: HomeRoute,
});

function HomeRoute() {
  return (
    <section>
      <h1 className="text-3xl font-semibold tracking-tight">Home</h1>
      <p className="mt-2 text-neutral-500">
        Edite <code className="rounded bg-neutral-100 px-1 py-0.5">src/routes/index.tsx</code>.
      </p>
    </section>
  );
}
`;

function routerTsx(withQuery: boolean): string {
  const queryImport = withQuery ? `\nimport { queryClient } from '@/lib/query-client';` : '';
  const contextOption = withQuery
    ? `
  context: { queryClient },
  defaultPreloadStaleTime: 0,`
    : '';

  return `import { createRouter } from '@tanstack/react-router';${queryImport}

import { routeTree } from './routeTree.gen';

export const router = createRouter({
  routeTree,${contextOption}
  defaultPreload: 'intent',
  scrollRestoration: true,
});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
`;
}

export const routerTanstack: Feature = {
  id: 'router-tanstack',
  enabled: (selection) => selection.router === 'tanstack',
  dependencies: () => entries(['@tanstack/react-router']),
  devDependencies: () => entries(['@tanstack/router-plugin', '@tanstack/react-router-devtools']),
  files: (context: FeatureContext) => [
    { path: 'src/router.tsx', contents: routerTsx(context.selection.query) },
    { path: 'src/routes/__root.tsx', contents: rootRouteTsx(context.selection.query) },
    { path: 'src/routes/index.tsx', contents: INDEX_ROUTE_TSX },
  ],
  scripts: () => ({
    build: 'vite build && tsc --noEmit',
  }),
  vitePlugins: () => [
    {
      order: 20,
      imports: [{ from: '@tanstack/router-plugin/vite', named: ['tanstackRouter'] }],
      expression: "tanstackRouter({ target: 'react', autoCodeSplitting: true })",
    },
  ],
  rootElement: () => ({
    imports: [
      { from: '@tanstack/react-router', named: ['RouterProvider'] },
      { from: '@/router', named: ['router'] },
    ],
    jsx: '<RouterProvider router={router} />',
  }),
};
