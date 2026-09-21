import type { Feature } from '../plan/types.js';
import { entries } from './versions.js';

export const tailwind: Feature = {
  id: 'tailwind',
  enabled: (selection) => selection.tailwind,
  devDependencies: () => entries(['tailwindcss', '@tailwindcss/vite']),
  vitePlugins: () => [
    {
      order: 10,
      imports: [{ from: '@tailwindcss/vite', default: 'tailwindcss' }],
      expression: 'tailwindcss()',
    },
  ],
  cssBlocks: () => [{ order: 0, content: '@import "tailwindcss";' }],
};
