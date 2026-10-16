import type { Feature, FeatureContext, Selection } from '../plan/types.js';
import { hasExamples } from './examples.js';
import { uiClasses } from './ui-classes.js';
import { entries } from './versions.js';

function rootRouteTsx(selection: Selection): string {
  const { muted } = uiClasses(selection);

  const routerImport = selection.query
    ? `import { Link, Outlet, createRootRouteWithContext } from '@tanstack/react-router';`
    : `import { Link, Outlet, createRootRoute } from '@tanstack/react-router';`;
  const packageImports = [
    ...(selection.query ? [`import type { QueryClient } from '@tanstack/react-query';`] : []),
    routerImport,
    `import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';`,
  ];
  const localImports = selection.shadcn
    ? `\n\nimport { ModeToggle } from '@/components/mode-toggle';`
    : '';

  const routeDeclaration = selection.query
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

  const links = [
    `          <Link to="/" activeProps={{ className: 'font-bold' }} activeOptions={{ exact: true }}>
            Home
          </Link>`,
  ];
  if (hasExamples(selection)) {
    links.push(`          <Link to="/examples" activeProps={{ className: 'font-bold' }}>
            Exemplos
          </Link>`);
  }
  if (selection.shadcn) {
    links.push(`          <div className="ml-auto">
            <ModeToggle />
          </div>`);
  }

  return `${packageImports.join('\n')}${localImports}

${routeDeclaration}

function RootComponent() {
  return (
    <div className="min-h-svh">
      <header className="border-b">
        <nav className="mx-auto flex max-w-3xl items-center gap-4 p-4">
${links.join('\n')}
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
      <p className="mt-2 ${muted}">Esta página não existe.</p>
      <Link to="/" className="mt-4 inline-block underline">
        Voltar para o início
      </Link>
    </section>
  );
}
`;
}

function indexRouteTsx(selection: Selection): string {
  const { muted, code } = uiClasses(selection);
  const routerImports = hasExamples(selection) ? 'Link, createFileRoute' : 'createFileRoute';
  const examplesLink = hasExamples(selection)
    ? `
      <p className="mt-4">
        <Link to="/examples" className="underline">
          Veja os exemplos
        </Link>{' '}
        da stack escolhida.
      </p>`
    : '';

  return `import { ${routerImports} } from '@tanstack/react-router';

export const Route = createFileRoute('/')({
  component: HomeRoute,
});

function HomeRoute() {
  return (
    <section>
      <h1 className="text-3xl font-semibold tracking-tight">Home</h1>
      <p className="mt-2 ${muted}">
        Edite <code className="${code}">src/routes/index.tsx</code>.
      </p>${examplesLink}
    </section>
  );
}
`;
}

function routeFeedbackTsx(selection: Selection): string {
  const { muted } = uiClasses(selection);

  return `import { type ErrorComponentProps, useRouter } from '@tanstack/react-router';

export function RouteError({ error }: ErrorComponentProps) {
  const router = useRouter();

  return (
    <section role="alert">
      <h1 className="text-2xl font-semibold tracking-tight">Algo deu errado</h1>
      <p className="mt-2 ${muted}">
        {error instanceof Error ? error.message : 'Erro desconhecido'}
      </p>
      <button type="button" className="mt-4 underline" onClick={() => router.invalidate()}>
        Tentar de novo
      </button>
    </section>
  );
}

export function RoutePending() {
  return <p className="${muted}">Carregando…</p>;
}
`;
}

function routerTsx(withQuery: boolean): string {
  const queryImport = withQuery ? `\nimport { queryClient } from '@/lib/query-client';` : '';
  const contextOption = withQuery
    ? `
  context: { queryClient },
  defaultPreloadStaleTime: 0,`
    : '';

  return `import { createRouter } from '@tanstack/react-router';

import { RouteError, RoutePending } from '@/components/route-feedback';${queryImport}

import { routeTree } from './routeTree.gen';

export const router = createRouter({
  routeTree,${contextOption}
  defaultPreload: 'intent',
  defaultErrorComponent: RouteError,
  defaultPendingComponent: RoutePending,
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
  files: ({ selection }: FeatureContext) => [
    { path: 'src/router.tsx', contents: routerTsx(selection.query) },
    { path: 'src/routes/__root.tsx', contents: rootRouteTsx(selection) },
    { path: 'src/routes/index.tsx', contents: indexRouteTsx(selection) },
    { path: 'src/components/route-feedback.tsx', contents: routeFeedbackTsx(selection) },
  ],
  scripts: () => ({
    build: 'vite build && tsc -b',
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
