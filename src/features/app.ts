import type { Feature, Selection } from '../plan/types.js';
import { hasExamples } from './examples.js';
import { uiClasses } from './ui-classes.js';

function appTsx(selection: Selection): string {
  const { muted, code } = uiClasses(selection);
  const examples = hasExamples(selection);

  const imports = [
    ...(selection.shadcn ? ["import { ModeToggle } from '@/components/mode-toggle';"] : []),
    ...(examples ? ["import { ExamplesPage } from '@/examples';"] : []),
  ];
  const toggle = selection.shadcn
    ? `
      <div className="flex justify-end">
        <ModeToggle />
      </div>`
    : '';
  const examplesBlock = examples
    ? `
      <div className="mt-12 border-t pt-8">
        <ExamplesPage />
      </div>`
    : '';

  return `${imports.length > 0 ? `${imports.join('\n')}\n\n` : ''}export function App() {
  return (
    <main className="mx-auto max-w-3xl p-8">${toggle}
      <h1 className="text-3xl font-semibold tracking-tight">Olá, mundo!</h1>
      <p className="mt-2 ${muted}">
        Edite <code className="${code}">src/app.tsx</code> para começar.
      </p>${examplesBlock}
    </main>
  );
}
`;
}

const ERROR_BOUNDARY_TSX = `import { Component, type ErrorInfo, type ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  override state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(error, info.componentStack);
  }

  override render() {
    if (!this.state.error) return this.props.children;

    return (
      <main role="alert" className="mx-auto max-w-3xl p-8">
        <h1 className="text-2xl font-semibold tracking-tight">Algo deu errado</h1>
        <p className="mt-2">{this.state.error.message}</p>
        <button
          type="button"
          className="mt-4 underline"
          onClick={() => {
            this.setState({ error: null });
          }}
        >
          Tentar de novo
        </button>
      </main>
    );
  }
}
`;

export const app: Feature = {
  id: 'app',
  enabled: (selection) => selection.router === 'none',
  files: ({ selection }) => [
    { path: 'src/app.tsx', contents: appTsx(selection) },
    { path: 'src/components/error-boundary.tsx', contents: ERROR_BOUNDARY_TSX },
  ],
  providers: () => [
    {
      order: 0,
      imports: [{ from: '@/components/error-boundary', named: ['ErrorBoundary'] }],
      open: '<ErrorBoundary>',
      close: '</ErrorBoundary>',
    },
  ],
  rootElement: () => ({
    imports: [{ from: '@/app', named: ['App'] }],
    jsx: '<App />',
  }),
};
