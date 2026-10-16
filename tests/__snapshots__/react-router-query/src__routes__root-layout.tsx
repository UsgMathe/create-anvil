import {
  Link,
  Outlet,
  isRouteErrorResponse,
  useNavigation,
  useRouteError,
} from 'react-router';

export function RootLayout() {
  const navigation = useNavigation();

  return (
    <div className="min-h-svh">
      <header className="border-b">
        <nav className="mx-auto flex max-w-3xl items-center gap-4 p-4">
          <Link to="/" className="font-medium hover:underline">
            Home
          </Link>
          <Link to="/examples" className="font-medium hover:underline">
            Exemplos
          </Link>
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
    ? `${error.status} ${error.statusText}`
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
