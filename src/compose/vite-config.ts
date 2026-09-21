import type { ImportSpec, VitePluginContribution } from '../plan/types.js';
import { renderImports } from './imports.js';

export interface ViteConfigInput {
  plugins: VitePluginContribution[];
  testBlock?: string;
  serverBlock?: string;
}

function indent(block: string): string {
  return block
    .split('\n')
    .map((line) => (line.length > 0 ? `  ${line}` : line))
    .join('\n');
}

export function composeViteConfig(input: ViteConfigInput): string {
  const plugins = [...input.plugins].sort((a, b) => a.order - b.order);
  const usesEnv = Boolean(input.serverBlock);

  const imports: ImportSpec[] = [
    { from: 'node:url', named: ['fileURLToPath'] },
    { from: 'vite', named: usesEnv ? ['defineConfig', 'loadEnv'] : ['defineConfig'] },
    ...plugins.flatMap((plugin) => plugin.imports),
  ];

  const pluginList = plugins.map((plugin) => `    ${plugin.expression},`).join('\n');

  const sections = [
    `  plugins: [\n${pluginList}\n  ],`,
    `  resolve: {\n    alias: {\n      '@': fileURLToPath(new URL('./src', import.meta.url)),\n    },\n  },`,
  ];

  if (input.serverBlock) sections.push(input.serverBlock);
  if (input.testBlock) sections.push(input.testBlock);

  const header = input.testBlock ? '/// <reference types="vitest/config" />\n' : '';
  const body = sections.join('\n');

  if (!usesEnv) {
    return `${header}${renderImports(imports)}

export default defineConfig({
${body}
});
`;
  }

  return `${header}${renderImports(imports)}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
${indent(body)}
  };
});
`;
}
