import type { Feature } from '../plan/types.js';
import { entries } from './versions.js';

const ROUTER_TSX = `import { createBrowserRouter } from 'react-router';

import { HomeRoute } from '@/routes/home';
import { NotFoundRoute } from '@/routes/not-found';
import { RootErrorBoundary, RootLayout } from '@/routes/root-layout';

export const routes = [
  {
    path: '/',
    Component: RootLayout,
    ErrorBoundary: RootErrorBoundary,
    children: [
      { index: true, Component: HomeRoute },
      { path: '*', Component: NotFoundRoute },
    ],
  },
];

export const router = createBrowserRouter(routes);
`;

const ROOT_LAYOUT_TSX = `import { Link, Outlet, isRouteErrorResponse, useRouteError } from 'react-router';

export function RootLayout() {
  return (
    <div className="min-h-svh">
      <header className="border-b">
        <nav className="mx-auto flex max-w-3xl gap-4 p-4">
          <Link to="/" className="font-medium hover:underline">
            Home
          </Link>
        </nav>
      </header>
      <main className="mx-auto max-w-3xl p-4">
        <Outlet />
      </main>
    </div>
  );
}

export function RootErrorBoundary() {
  const error = useRouteError();

  const message = isRouteErrorResponse(error)
    ? \`\${error.status} \${error.statusText}\`
    : error instanceof Error
      ? error.message
      : 'Erro desconhecido';

  return (
    <main className="mx-auto max-w-3xl p-4">
      <h1 className="text-2xl font-semibold">Algo deu errado</h1>
      <p className="mt-2 text-neutral-500">{message}</p>
    </main>
  );
}
`;

const HOME_TSX = `export function HomeRoute() {
  return (
    <section>
      <h1 className="text-3xl font-semibold tracking-tight">Home</h1>
      <p className="mt-2 text-neutral-500">
        Edite <code className="rounded bg-neutral-100 px-1 py-0.5">src/routes/home.tsx</code>.
      </p>
    </section>
  );
}
`;

const NOT_FOUND_TSX = `import { Link } from 'react-router';

export function NotFoundRoute() {
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

export const routerReactRouter: Feature = {
  id: 'router-react-router',
  enabled: (selection) => selection.router === 'react-router',
  dependencies: () => entries(['react-router']),
  files: () => [
    { path: 'src/router.tsx', contents: ROUTER_TSX },
    { path: 'src/routes/root-layout.tsx', contents: ROOT_LAYOUT_TSX },
    { path: 'src/routes/home.tsx', contents: HOME_TSX },
    { path: 'src/routes/not-found.tsx', contents: NOT_FOUND_TSX },
  ],
  rootElement: () => ({
    imports: [
      { from: 'react-router/dom', named: ['RouterProvider'] },
      { from: '@/router', named: ['router'] },
    ],
    jsx: '<RouterProvider router={router} />',
  }),
};
