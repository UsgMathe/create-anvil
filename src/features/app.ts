import type { Feature } from '../plan/types.js';

const APP_TSX = `export function App() {
  return (
    <main className="mx-auto max-w-3xl p-8">
      <h1 className="text-3xl font-semibold tracking-tight">Hello World!</h1>
      <p className="mt-2 text-neutral-500">
        Edit <code className="rounded bg-neutral-100 px-1 py-0.5">src/app.tsx</code> to get started.
      </p>
    </main>
  );
}
`;

export const app: Feature = {
  id: 'app',
  enabled: (selection) => selection.router === 'none',
  files: () => [{ path: 'src/app.tsx', contents: APP_TSX }],
  rootElement: () => ({
    imports: [{ from: '@/app', named: ['App'] }],
    jsx: '<App />',
  }),
};
