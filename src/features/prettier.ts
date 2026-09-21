import type { Feature, FeatureContext } from '../plan/types.js';
import { entries } from './versions.js';

function prettierrc(context: FeatureContext): string {
  const config: Record<string, unknown> = {
    $schema: 'https://json.schemastore.org/prettierrc',
    semi: true,
    singleQuote: true,
    trailingComma: 'all',
    printWidth: 100,
    tabWidth: 2,
    endOfLine: 'lf',
  };

  if (context.selection.tailwind) {
    config.plugins = ['prettier-plugin-tailwindcss'];
    config.tailwindStylesheet = './src/index.css';
    if (context.selection.shadcn) config.tailwindFunctions = ['cn', 'cva'];
  }

  return `${JSON.stringify(config, null, 2)}\n`;
}

function prettierignore(context: FeatureContext): string {
  const lines = ['dist', 'coverage', 'node_modules', 'package-lock.json', 'pnpm-lock.yaml'];
  if (context.selection.router === 'tanstack') lines.push('src/routeTree.gen.ts');
  return `${lines.join('\n')}\n`;
}

export const prettier: Feature = {
  id: 'prettier',
  enabled: (selection) => selection.prettier && selection.linter !== 'biome',
  devDependencies: (context) =>
    context.selection.tailwind
      ? entries(['prettier', 'prettier-plugin-tailwindcss'])
      : entries(['prettier']),
  files: (context) => [
    { path: '.prettierrc.json', contents: prettierrc(context) },
    { path: '.prettierignore', contents: prettierignore(context) },
  ],
  scripts: () => ({ format: 'prettier --write .', 'format:check': 'prettier --check .' }),
};
