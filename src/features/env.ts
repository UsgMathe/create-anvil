import type { Feature, Selection } from '../plan/types.js';
import { entries } from './versions.js';

export const EXAMPLE_API_URL = 'https://jsonplaceholder.typicode.com';

function sampleEnv(selection: Selection): string {
  return selection.api
    ? `VITE_API_URL=${EXAMPLE_API_URL}\n`
    : `VITE_APP_NAME=${selection.packageName}\n`;
}

function envTs(selection: Selection): string {
  const field = selection.api ? 'VITE_API_URL: z.url(),' : 'VITE_APP_NAME: z.string().min(1),';

  return `import { z } from 'zod';

const envSchema = z.object({
  ${field}
});

const parsed = envSchema.safeParse(import.meta.env);

if (!parsed.success) {
  throw new Error(\`Variáveis de ambiente inválidas:\n\${z.prettifyError(parsed.error)}\`);
}

export const env = parsed.data;
`;
}

export const env: Feature = {
  id: 'env',
  enabled: (selection) => selection.env,
  dependencies: () => entries(['zod']),
  files: ({ selection }) => [
    { path: 'sample.env', contents: sampleEnv(selection) },
    { path: '.env', contents: sampleEnv(selection) },
    { path: 'src/config/env.ts', contents: envTs(selection) },
  ],
  gitignore: () => ['!sample.env'],
  preamble: () => [
    {
      order: 0,
      imports: [{ from: '@/config/env', sideEffect: true }],
      code: '',
    },
  ],
};
