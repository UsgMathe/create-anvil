import type { Feature } from '../plan/types.js';

export const REMOVED_BY_BASE = [
  'public/icons.svg',
  'src/App.tsx',
  'src/App.css',
  'src/assets/hero.png',
  'src/assets/react.svg',
  'src/assets/vite.svg',
];

export const base: Feature = {
  id: 'base',
  enabled: () => true,
  removeFiles: () => REMOVED_BY_BASE,
  scripts: () => ({ dev: 'vite --host', preview: 'vite preview --host', typecheck: 'tsc -b' }),
  vitePlugins: () => [
    {
      order: 30,
      imports: [{ from: '@vitejs/plugin-react', default: 'react' }],
      expression: 'react()',
    },
  ],
  gitignore: () => ['*.env', '*.local'],
};
