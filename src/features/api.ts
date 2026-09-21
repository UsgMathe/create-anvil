import type { Feature } from '../plan/types.js';
import { entries } from './versions.js';

const HTTP_TS = `import axios from 'axios';

import { env } from '@/config/env';

export const http = axios.create({
  baseURL: import.meta.env.DEV ? '/api' : env.VITE_API_URL,
  withCredentials: true,
});
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
