import type { Feature } from '../plan/types.js';
import { entries } from './versions.js';

const HTTP_TS = `import axios, { type AxiosError } from 'axios';

import { env } from '@/config/env';

export class ApiError extends Error {
  readonly status: number | undefined;
  readonly data: unknown;

  constructor(message: string, status: number | undefined, data: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

function messageFrom(error: AxiosError): string {
  const data: unknown = error.response?.data;
  if (
    typeof data === 'object' &&
    data !== null &&
    'message' in data &&
    typeof data.message === 'string'
  ) {
    return data.message;
  }
  if (error.response) return \`Erro \${error.response.status} ao chamar a API.\`;
  return 'Sem resposta do servidor. Verifique sua conexão.';
}

export const http = axios.create({
  baseURL: import.meta.env.DEV ? '/api' : env.VITE_API_URL,
  withCredentials: true,
});

http.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (axios.isAxiosError(error)) {
      return Promise.reject(
        new ApiError(messageFrom(error), error.response?.status, error.response?.data),
      );
    }
    return Promise.reject(error);
  },
);
`;

const SERVER_BLOCK = `  server: {
    proxy: {
      '/api': {
        target: env.VITE_API_URL,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\\/api/, ''),
      },
    },
  },`;

export const api: Feature = {
  id: 'api',
  enabled: (selection) => selection.api,
  dependencies: () => entries(['axios']),
  files: () => [{ path: 'src/lib/http.ts', contents: HTTP_TS }],
  viteServerBlock: () => SERVER_BLOCK,
};
