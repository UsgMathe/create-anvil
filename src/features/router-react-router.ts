import type { Feature, Selection } from '../plan/types.js';
import { hasExamples } from './examples.js';
import { uiClasses } from './ui-classes.js';
import { entries } from './versions.js';

function routerTsx(selection: Selection): string {
  const examples = hasExamples(selection);
  const localImports = [
    ...(examples && selection.query ? ["import { postsListOptions } from '@/api/posts';"] : []),
    ...(examples && selection.query ? ["import { queryClient } from '@/lib/query-client';"] : []),
    ...(examples ? ["import { ExamplesRoute } from '@/routes/examples';"] : []),
    "import { HomeRoute } from '@/routes/home';",
    "import { NotFoundRoute } from '@/routes/not-found';",
    "import { RootErrorBoundary, RootLayout } from '@/routes/root-layout';",
  ];

  const loader = selection.query
    ? `
        loader: () => queryClient.ensureQueryData(postsListOptions()),`
    : '';
  const examplesRoute = examples
    ? `
      {
        path: 'examples',
        Component: ExamplesRoute,${loader}
      },`
    : '';

  return `import { createBrowserRouter } from 'react-router';

${localImports.join('\n')}

export const routes = [
  {
    path: '/',
    Component: RootLayout,
    ErrorBoundary: RootErrorBoundary,
    children: [
      { index: true, Component: HomeRoute },${examplesRoute}
      { path: '*', Component: NotFoundRoute },
    ],
  },
];

export const router = createBrowserRouter(routes);
`;
}

function rootLayoutTsx(selection: Selection): string {
  const { muted } = uiClasses(selection);
  const localImports = selection.shadcn
    ? `\n\nimport { ModeToggle } from '@/components/mode-toggle';`
    : '';

  const links = [
    `          <Link to="/" className="font-medium hover:underline">
            Home
          </Link>`,
  ];
  if (hasExamples(selection)) {
    links.push(`          <Link to="/examples" className="font-medium hover:underline">
            Exemplos
          </Link>`);
  }
  if (selection.shadcn) {
    links.push(`          <div className="ml-auto">
            <ModeToggle />
          </div>`);
  }

  return `import {
  Link,
  Outlet,
  isRouteErrorResponse,
  useNavigation,
  useRouteError,
} from 'react-router';${localImports}

export function RootLayout() {
  const navigation = useNavigation();

  return (
    <div className="min-h-svh">
      <header className="border-b">
        <nav className="mx-auto flex max-w-3xl items-center gap-4 p-4">
${links.join('\n')}
        </nav>
      </header>
      <main
        aria-busy={navigation.state === 'loading'}
        className="mx-auto max-w-3xl p-4 transition-opacity aria-busy:opacity-50"
      >
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
      <p className="mt-2 ${muted}">{message}</p>
    </main>
  );
}
`;
}

function homeTsx(selection: Selection): string {
  const { muted, code } = uiClasses(selection);
  const examples = hasExamples(selection);
  const routerImport = examples ? `import { Link } from 'react-router';\n\n` : '';
  const examplesLink = examples
    ? `
      <p className="mt-4">
        <Link to="/examples" className="underline">
          Veja os exemplos
        </Link>{' '}
        da stack escolhida.
      </p>`
    : '';

  return `${routerImport}export function HomeRoute() {
  return (
    <section>
      <h1 className="text-3xl font-semibold tracking-tight">Home</h1>
      <p className="mt-2 ${muted}">
        Edite <code className="${code}">src/routes/home.tsx</code>.
      </p>${examplesLink}
    </section>
  );
}
`;
}

function notFoundTsx(selection: Selection): string {
  const { muted } = uiClasses(selection);

  return `import { Link } from 'react-router';

export function NotFoundRoute() {
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

export const routerReactRouter: Feature = {
  id: 'router-react-router',
  enabled: (selection) => selection.router === 'react-router',
  dependencies: () => entries(['react-router']),
  files: ({ selection }) => [
    { path: 'src/router.tsx', contents: routerTsx(selection) },
    { path: 'src/routes/root-layout.tsx', contents: rootLayoutTsx(selection) },
    { path: 'src/routes/home.tsx', contents: homeTsx(selection) },
    { path: 'src/routes/not-found.tsx', contents: notFoundTsx(selection) },
  ],
  rootElement: () => ({
    imports: [
      { from: 'react-router/dom', named: ['RouterProvider'] },
      { from: '@/router', named: ['router'] },
    ],
    jsx: '<RouterProvider router={router} />',
  }),
};
