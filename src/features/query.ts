import type { Feature, FeatureContext } from '../plan/types.js';
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

const POSTS_TYPES = `export interface Post {
  id: number;
  title: string;
}

export interface ListPostsParams {
  page?: number;
}
`;

function postsApi(usesHttpClient: boolean): string {
  if (usesHttpClient) {
    return `import { http } from '@/lib/http';

${POSTS_TYPES}
export async function listPosts(params: ListPostsParams): Promise<Post[]> {
  const response = await http.get<Post[]>('/posts', { params });
  return response.data;
}
`;
  }

  return `${POSTS_TYPES}
export async function listPosts(params: ListPostsParams): Promise<Post[]> {
  const query = new URLSearchParams();
  if (params.page !== undefined) query.set('page', String(params.page));

  const response = await fetch(\`/posts?\${query.toString()}\`);

  if (!response.ok) {
    throw new Error(\`Falha ao buscar posts (\${response.status})\`);
  }

  return (await response.json()) as Post[];
}
`;
}

const POSTS_KEYS_TS = `import type { ListPostsParams } from './posts.api';

export const postsKeys = {
  all: ['posts'] as const,
  lists: () => [...postsKeys.all, 'list'] as const,
  list: (params: ListPostsParams) => [...postsKeys.lists(), params] as const,
};
`;

const POSTS_QUERIES_TS = `import { queryOptions, useQuery } from '@tanstack/react-query';

import { listPosts, type ListPostsParams } from './posts.api';
import { postsKeys } from './posts.keys';

export function postsListOptions(params: ListPostsParams = {}) {
  return queryOptions({
    queryKey: postsKeys.list(params),
    queryFn: () => listPosts(params),
  });
}

export function usePostsQuery(params: ListPostsParams = {}) {
  return useQuery(postsListOptions(params));
}
`;

const POSTS_INDEX_TS = `export * from './posts.api';
export * from './posts.keys';
export * from './posts.queries';
`;

export const query: Feature = {
  id: 'query',
  enabled: (selection) => selection.query,
  dependencies: () => entries(['@tanstack/react-query']),
  devDependencies: () => entries(['@tanstack/react-query-devtools']),
  files: (context: FeatureContext) => [
    { path: 'src/lib/query-client.ts', contents: QUERY_CLIENT_TS },
    { path: 'src/api/posts/posts.api.ts', contents: postsApi(context.selection.api) },
    { path: 'src/api/posts/posts.keys.ts', contents: POSTS_KEYS_TS },
    { path: 'src/api/posts/posts.queries.ts', contents: POSTS_QUERIES_TS },
    { path: 'src/api/posts/index.ts', contents: POSTS_INDEX_TS },
  ],
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
