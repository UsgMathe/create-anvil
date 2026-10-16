import { createBrowserRouter } from 'react-router';

import { postsListOptions } from '@/api/posts';
import { queryClient } from '@/lib/query-client';
import { ExamplesRoute } from '@/routes/examples';
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
      {
        path: 'examples',
        Component: ExamplesRoute,
        loader: () => queryClient.ensureQueryData(postsListOptions()),
      },
      { path: '*', Component: NotFoundRoute },
    ],
  },
];

export const router = createBrowserRouter(routes);
