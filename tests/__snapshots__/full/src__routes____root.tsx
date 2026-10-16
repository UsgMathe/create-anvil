import type { QueryClient } from '@tanstack/react-query';
import { Link, Outlet, createRootRouteWithContext } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';

import { ModeToggle } from '@/components/mode-toggle';

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient;
}>()({
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootComponent() {
  return (
    <div className="min-h-svh">
      <header className="border-b">
        <nav className="mx-auto flex max-w-3xl items-center gap-4 p-4">
          <Link to="/" activeProps={{ className: 'font-bold' }} activeOptions={{ exact: true }}>
            Home
          </Link>
          <Link to="/examples" activeProps={{ className: 'font-bold' }}>
            Exemplos
          </Link>
          <div className="ml-auto">
            <ModeToggle />
          </div>
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
      <p className="mt-2 text-muted-foreground">Esta página não existe.</p>
      <Link to="/" className="mt-4 inline-block underline">
        Voltar para o início
      </Link>
    </section>
  );
}
