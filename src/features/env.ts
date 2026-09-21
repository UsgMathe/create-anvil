import type { Feature } from '../plan/types.js';
import { entries } from './versions.js';

const SAMPLE_ENV = `VITE_API_URL=http://localhost:3000\n`;

const ENV_TS = `import z from 'zod';

const envSchema = z.object({
  VITE_API_URL: z.url(),
});

const parsed = envSchema.safeParse(import.meta.env);

if (!parsed.success) {
  throw new Error(\`Variáveis de ambiente inválidas:\\n\${z.prettifyError(parsed.error)}\`);
}

export const env = parsed.data;
`;

export const env: Feature = {
  id: 'env',
  enabled: (selection) => selection.env,
  dependencies: () => entries(['zod']),
  files: () => [
    { path: 'sample.env', contents: SAMPLE_ENV },
    { path: '.env', contents: SAMPLE_ENV },
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
