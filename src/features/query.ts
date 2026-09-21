import type { Feature } from '../plan/types.js';
import { entries } from './versions.js';

const QUERY_CLIENT_TS = `import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});
`;

export const query: Feature = {
  id: 'query',
  enabled: (selection) => selection.query,
  dependencies: () => entries(['@tanstack/react-query']),
  devDependencies: () => entries(['@tanstack/react-query-devtools']),
  files: () => [{ path: 'src/lib/query-client.ts', contents: QUERY_CLIENT_TS }],
  providers: () => [
    {
      order: 10,
      imports: [
        { from: '@tanstack/react-query', named: ['QueryClientProvider'] },
        { from: '@/lib/query-client', named: ['queryClient'] },
      ],
      open: '<QueryClientProvider client={queryClient}>',
      close: '</QueryClientProvider>',
    },
  ],
};
