import type { ImportSpec, VitePluginContribution } from '../plan/types.js';
import { renderImports } from './imports.js';

export interface ViteConfigInput {
  plugins: VitePluginContribution[];
  testBlock?: string;
  serverBlock?: string;
  envSchemaPath?: string;
}

function indent(block: string): string {
  return block
    .split('\n')
    .map((line) => (line.length > 0 ? `  ${line}` : line))
    .join('\n');
}

export function composeViteConfig(input: ViteConfigInput): string {
  const plugins = [...input.plugins].sort((a, b) => a.order - b.order);
  const usesEnv = Boolean(input.serverBlock) || Boolean(input.envSchemaPath);

  const imports: ImportSpec[] = [
    { from: 'node:url', named: ['fileURLToPath'] },
    { from: 'vite', named: usesEnv ? ['defineConfig', 'loadEnv'] : ['defineConfig'] },
    ...plugins.flatMap((plugin) => plugin.imports),
    ...(input.envSchemaPath ? [{ from: `./${input.envSchemaPath}`, named: ['parseEnv'] }] : []),
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

  const loadsEnv = "loadEnv(mode, process.cwd(), 'VITE_')";
  const envSetup = input.serverBlock
    ? [
        `  const env = ${loadsEnv};`,
        ...(input.envSchemaPath ? ["  if (mode !== 'test') parseEnv(env);"] : []),
      ]
    : [`  if (mode !== 'test') parseEnv(${loadsEnv});`];

  return `${header}${renderImports(imports)}

export default defineConfig(({ mode }) => {
${envSetup.join('\n')}

  return {
${indent(body)}
  };
});
`;
}
