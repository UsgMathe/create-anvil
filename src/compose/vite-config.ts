import type { ImportSpec, VitePluginContribution } from '../plan/types.js';
import { renderImports } from './imports.js';

export interface ViteConfigInput {
  plugins: VitePluginContribution[];
  testBlock?: string;
}

export function composeViteConfig(input: ViteConfigInput): string {
  const plugins = [...input.plugins].sort((a, b) => a.order - b.order);

  const imports: ImportSpec[] = [
    { from: 'node:url', named: ['fileURLToPath'] },
    { from: 'vite', named: ['defineConfig'] },
    ...plugins.flatMap((plugin) => plugin.imports),
  ];

  const pluginList = plugins.map((plugin) => `    ${plugin.expression},`).join('\n');

  const sections = [
    `  plugins: [\n${pluginList}\n  ],`,
    `  resolve: {\n    alias: {\n      '@': fileURLToPath(new URL('./src', import.meta.url)),\n    },\n  },`,
  ];

  if (input.testBlock) sections.push(input.testBlock);

  return `${renderImports(imports)}

export default defineConfig({
${sections.join('\n')}
});
`;
}
