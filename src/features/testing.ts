import type { Feature, Selection } from '../plan/types.js';
import { hasExamples } from './examples.js';
import { entries } from './versions.js';

const MOCK_POST_TITLE = 'Post vindo do MSW';

function usesMsw(selection: Selection): boolean {
  return selection.query && selection.api;
}

function setupTs(selection: Selection): string {
  const vitestImports = ['afterEach'];
  if (usesMsw(selection)) vitestImports.unshift('afterAll', 'beforeAll');
  if (selection.shadcn) vitestImports.push('vi');

  const localImport = usesMsw(selection) ? `\n\nimport { server } from '@/test/server';` : '';

  const blocks: string[] = [];

  if (selection.shadcn) {
    blocks.push(`Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string): MediaQueryList => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }),
});`);
  }

  if (usesMsw(selection)) {
    blocks.push(`beforeAll(() => {
  server.listen({ onUnhandledFrame: 'error' });
});

afterAll(() => {
  server.close();
});`);
  }

  blocks.push(`afterEach(() => {
  cleanup();${usesMsw(selection) ? '\n  server.resetHandlers();' : ''}
});`);

  return `import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { ${vitestImports.join(', ')} } from 'vitest';${localImport}

${blocks.join('\n\n')}
`;
}

function renderTsx(selection: Selection): string {
  const packageImports: string[] = [];
  if (selection.query) {
    packageImports.push(
      "import { QueryClient, QueryClientProvider } from '@tanstack/react-query';",
    );
  }
  packageImports.push(
    "import { type RenderOptions, render } from '@testing-library/react';",
    "import userEvent from '@testing-library/user-event';",
  );
  if (selection.query || selection.shadcn) {
    packageImports.push("import type { ReactElement, ReactNode } from 'react';");
  } else {
    packageImports.push("import type { ReactElement } from 'react';");
  }

  const localImports = selection.shadcn
    ? `\n\nimport { ThemeProvider } from '@/components/theme-provider';`
    : '';

  if (!selection.query && !selection.shadcn) {
    return `${packageImports.join('\n')}

export function renderWithProviders(ui: ReactElement, options?: RenderOptions) {
  return { user: userEvent.setup(), ...render(ui, options) };
}
`;
  }

  const wrappers: [string, string][] = [];
  if (selection.shadcn) wrappers.push(['<ThemeProvider>', '</ThemeProvider>']);
  if (selection.query) {
    wrappers.push(['<QueryClientProvider client={queryClient}>', '</QueryClientProvider>']);
  }
  const depth = wrappers.length;
  const tree = [
    ...wrappers.map(([open], index) => `${'  '.repeat(index + 2)}${open}`),
    `${'  '.repeat(depth + 2)}{children}`,
    ...wrappers.map(([, close], index) => `${'  '.repeat(index + 2)}${close}`).reverse(),
  ].join('\n');

  if (!selection.query) {
    return `${packageImports.join('\n')}${localImports}

export function createWrapper() {
  return ({ children }: { children: ReactNode }) => (
${tree}
  );
}

export function renderWithProviders(ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) {
  return { user: userEvent.setup(), ...render(ui, { wrapper: createWrapper(), ...options }) };
}
`;
  }

  return `${packageImports.join('\n')}${localImports}

export function createTestQueryClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

export function createWrapper(queryClient = createTestQueryClient()) {
  return ({ children }: { children: ReactNode }) => (
${tree}
  );
}

interface RenderWithProvidersOptions extends Omit<RenderOptions, 'wrapper'> {
  queryClient?: QueryClient;
}

export function renderWithProviders(
  ui: ReactElement,
  { queryClient = createTestQueryClient(), ...options }: RenderWithProvidersOptions = {},
) {
  return {
    user: userEvent.setup(),
    queryClient,
    ...render(ui, { wrapper: createWrapper(queryClient), ...options }),
  };
}
`;
}

const SERVER_TS = `import { HttpResponse, http } from 'msw';
import { setupServer } from 'msw/node';

export const handlers = [
  http.get('*/api/posts', () => HttpResponse.json([{ id: 1, title: '${MOCK_POST_TITLE}' }])),
];

export const server = setupServer(...handlers);
`;

function postsQueriesTest(selection: Selection): string {
  if (!usesMsw(selection)) {
    return `import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { usePostsQuery } from '@/api/posts';
import { createWrapper } from '@/test/render';

describe('usePostsQuery', () => {
  it('lista os posts', async () => {
    const { result } = renderHook(() => usePostsQuery(), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
    expect(result.current.data?.length).toBeGreaterThan(0);
  });
});
`;
  }

  return `import { renderHook, waitFor } from '@testing-library/react';
import { HttpResponse, http } from 'msw';
import { describe, expect, it } from 'vitest';

import { usePostsQuery } from '@/api/posts';
import { ApiError } from '@/lib/http';
import { createWrapper } from '@/test/render';
import { server } from '@/test/server';

describe('usePostsQuery', () => {
  it('lista os posts da API', async () => {
    const { result } = renderHook(() => usePostsQuery(), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
    expect(result.current.data?.[0]?.title).toBe('${MOCK_POST_TITLE}');
  });

  it('entrega o erro da API como ApiError', async () => {
    server.use(
      http.get('*/api/posts', () => HttpResponse.json({ message: 'Fora do ar' }, { status: 500 })),
    );
    const { result } = renderHook(() => usePostsQuery(), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
    expect(result.current.error).toBeInstanceOf(ApiError);
    expect(result.current.error?.message).toBe('Fora do ar');
  });
});
`;
}

function contactFormTest(selection: Selection): string {
  const fillName = selection.shadcn
    ? `\n    await user.type(screen.getByLabelText('Nome'), 'Ana');`
    : '';
  const expected = selection.shadcn
    ? `{ name: 'Ana', email: 'ana@exemplo.com' }`
    : `{ email: 'ana@exemplo.com' }`;

  return `import { screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ContactForm } from '@/components/contact-form';
import { renderWithProviders } from '@/test/render';

describe('ContactForm', () => {
  it('mostra o erro do schema e não envia um e-mail inválido', async () => {
    const onSubmit = vi.fn();
    const { user } = renderWithProviders(<ContactForm onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText('E-mail'), 'isso-não-é-email');
    await user.click(screen.getByRole('button', { name: 'Enviar' }));

    expect(await screen.findByText('Informe um e-mail válido')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('envia os valores validados', async () => {
    const onSubmit = vi.fn();
    const { user } = renderWithProviders(<ContactForm onSubmit={onSubmit} />);
${fillName}
    await user.type(screen.getByLabelText('E-mail'), 'ana@exemplo.com');
    await user.click(screen.getByRole('button', { name: 'Enviar' }));

    await waitFor(() => {
      expect(onSubmit.mock.calls[0]?.[0]).toEqual(${expected});
    });
  });
});
`;
}

function appTest(selection: Selection): string {
  const examples = hasExamples(selection);

  if (selection.router === 'none') {
    const examplesAssertion = examples
      ? `\n    expect(screen.getByRole('heading', { level: 1, name: 'Exemplos' })).toBeInTheDocument();`
      : '';
    return `import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { App } from '@/app';
import { renderWithProviders } from '@/test/render';

describe('App', () => {
  it('renderiza a página inicial', () => {
    renderWithProviders(<App />);

    expect(screen.getByRole('heading', { level: 1, name: 'Olá, mundo!' })).toBeInTheDocument();${examplesAssertion}
  });
});
`;
  }

  const navigationTest = examples
    ? `

  it('navega da home até os exemplos', async () => {
    const { user } = renderAt('/');

    await user.click(await screen.findByRole('link', { name: 'Veja os exemplos' }));

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Exemplos' }),
    ).toBeInTheDocument();
  });`
    : '';

  const body = `describe('App', () => {
  it('renderiza a home', async () => {
    renderAt('/');

    expect(await screen.findByRole('heading', { level: 1, name: 'Home' })).toBeInTheDocument();
  });${navigationTest}
});
`;

  if (selection.router === 'react-router') {
    const queryImport = selection.query
      ? `\nimport { queryClient } from '@/lib/query-client';`
      : '';
    const renderOptions = selection.query ? ', { queryClient }' : '';
    return `import { screen } from '@testing-library/react';
import { RouterProvider, createMemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
${queryImport}
import { routes } from '@/router';
import { renderWithProviders } from '@/test/render';

function renderAt(path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  return renderWithProviders(<RouterProvider router={router} />${renderOptions});
}

${body}`;
  }

  const renderImport = selection.query
    ? `import { createTestQueryClient, renderWithProviders } from '@/test/render';`
    : `import { renderWithProviders } from '@/test/render';`;
  const createRouterCall = selection.query
    ? `  const queryClient = createTestQueryClient();
  const router = createRouter({
    routeTree,
    context: { queryClient },
    history: createMemoryHistory({ initialEntries: [path] }),
  });
  return renderWithProviders(<RouterProvider router={router} />, { queryClient });`
    : `  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [path] }),
  });
  return renderWithProviders(<RouterProvider router={router} />);`;

  return `import { RouterProvider, createMemoryHistory, createRouter } from '@tanstack/react-router';
import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { routeTree } from '@/routeTree.gen';
${renderImport}

function renderAt(path: string) {
${createRouterCall}
}

${body}`;
}

const TSCONFIG_VITEST = `${JSON.stringify(
  {
    extends: './tsconfig.app.json',
    compilerOptions: {
      tsBuildInfoFile: './node_modules/.tmp/tsconfig.vitest.tsbuildinfo',
      types: ['vite/client', 'node'],
      noEmit: true,
    },
    include: ['src', 'vite.config.ts'],
    exclude: [],
  },
  null,
  2,
)}\n`;

function testEnv(selection: Selection): string {
  if (!selection.env) return '';
  const variable = selection.api
    ? `VITE_API_URL: 'http://localhost:3000'`
    : `VITE_APP_NAME: '${selection.packageName}'`;
  return `\n    env: { ${variable} },`;
}

function testBlock(selection: Selection): string {
  return `  test: {
    environment: 'jsdom',
    globals: false,
    restoreMocks: true,${testEnv(selection)}
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.{test,spec}.{ts,tsx}',
        'src/test/**',
        'src/**/*.d.ts',
        'src/main.tsx',
        'src/routeTree.gen.ts',
      ],
    },
  },`;
}

export const VITEST_TSCONFIG = 'tsconfig.vitest.json';

export const TEST_FILE_GLOBS = [
  'src/**/*.test.ts',
  'src/**/*.test.tsx',
  'src/**/*.spec.ts',
  'src/**/*.spec.tsx',
  'src/test',
];

export const testing: Feature = {
  id: 'testing',
  enabled: (selection) => selection.vitest,
  devDependencies: ({ selection }) =>
    entries([
      'vitest',
      '@vitest/coverage-v8',
      'jsdom',
      '@testing-library/react',
      '@testing-library/dom',
      '@testing-library/jest-dom',
      '@testing-library/user-event',
      ...(usesMsw(selection) ? (['msw'] as const) : []),
    ]),
  files: ({ selection }) => [
    { path: 'src/test/setup.ts', contents: setupTs(selection) },
    { path: 'src/test/render.tsx', contents: renderTsx(selection) },
    { path: 'src/app.test.tsx', contents: appTest(selection) },
    ...(usesMsw(selection) ? [{ path: 'src/test/server.ts', contents: SERVER_TS }] : []),
    ...(selection.query
      ? [{ path: 'src/api/posts/posts.queries.test.ts', contents: postsQueriesTest(selection) }]
      : []),
    ...(selection.forms
      ? [{ path: 'src/components/contact-form.test.tsx', contents: contactFormTest(selection) }]
      : []),
    { path: VITEST_TSCONFIG, contents: TSCONFIG_VITEST },
  ],
  scripts: () => ({
    test: 'vitest run',
    'test:watch': 'vitest',
    'test:coverage': 'vitest run --coverage',
  }),
  viteTestBlock: ({ selection }) => testBlock(selection),
};
