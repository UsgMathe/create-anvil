import { createRouter } from '@tanstack/react-router';

import { RouteError, RoutePending } from '@/components/route-feedback';
import { queryClient } from '@/lib/query-client';

import { routeTree } from './routeTree.gen';

export const router = createRouter({
  routeTree,
  context: { queryClient },
  defaultPreloadStaleTime: 0,
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
