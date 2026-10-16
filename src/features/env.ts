import type { Feature, Selection } from '../plan/types.js';
import { entries } from './versions.js';

export const EXAMPLE_API_URL = 'https://jsonplaceholder.typicode.com';

export const ENV_SCHEMA_PATH = 'src/config/env.schema.ts';

function sampleEnv(selection: Selection): string {
  return selection.api
    ? `VITE_API_URL=${EXAMPLE_API_URL}\n`
    : `VITE_APP_NAME=${selection.packageName}\n`;
}

function envSchemaTs(selection: Selection): string {
  const field = selection.api ? 'VITE_API_URL: z.url(),' : 'VITE_APP_NAME: z.string().min(1),';

  return `import { z } from 'zod';

export const envSchema = z.object({
  ${field}
});

export type Env = z.infer<typeof envSchema>;

export function parseEnv(source: Record<string, unknown>): Env {
  const parsed = envSchema.safeParse(source);

  if (!parsed.success) {
    throw new Error(\`Variáveis de ambiente inválidas:\\n\${z.prettifyError(parsed.error)}\`);
  }

  return parsed.data;
}
`;
}

const ENV_TS = `import { parseEnv } from '@/config/env.schema';

export const env = parseEnv(import.meta.env);
`;

export const env: Feature = {
  id: 'env',
  enabled: (selection) => selection.env,
  dependencies: () => entries(['zod']),
  files: ({ selection }) => [
    { path: 'sample.env', contents: sampleEnv(selection) },
    { path: '.env', contents: sampleEnv(selection) },
    { path: ENV_SCHEMA_PATH, contents: envSchemaTs(selection) },
    { path: 'src/config/env.ts', contents: ENV_TS },
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
