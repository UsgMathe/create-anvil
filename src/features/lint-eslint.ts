import type { Feature, FeatureContext } from '../plan/types.js';
import { entries } from './versions.js';

function eslintConfig(context: FeatureContext): string {
  const { selection } = context;
  const ignores = ["'dist'", "'coverage'"];
  if (selection.router === 'tanstack') ignores.push("'src/routeTree.gen.ts'");

  const imports = [
    "import js from '@eslint/js';",
    selection.query ? "import pluginQuery from '@tanstack/eslint-plugin-query';" : null,
    selection.prettier ? "import prettier from 'eslint-config-prettier/flat';" : null,
    "import reactHooks from 'eslint-plugin-react-hooks';",
    "import reactRefresh from 'eslint-plugin-react-refresh';",
    "import { defineConfig, globalIgnores } from 'eslint/config';",
    "import globals from 'globals';",
    "import tseslint from 'typescript-eslint';",
  ].filter(Boolean);

  const extendsList = [
    'js.configs.recommended',
    'tseslint.configs.recommended',
    'reactHooks.configs.flat.recommended',
    'reactRefresh.configs.vite',
    selection.query ? "pluginQuery.configs['flat/recommended']" : null,
  ].filter(Boolean);

  const exportOverridePaths = [
    selection.router === 'tanstack' ? "'src/routes/**/*.tsx'" : null,
    selection.shadcn ? "'src/components/ui/**/*.tsx'" : null,
  ].filter(Boolean);

  const routeOverride =
    exportOverridePaths.length > 0
      ? `
  {
    files: [${exportOverridePaths.join(', ')}],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },`
      : '';

  const tail = selection.prettier
    ? '\n  // Precisa ficar por último: desliga as regras que conflitam com o Prettier.\n  prettier,'
    : '';

  return `${imports.join('\n')}

export default defineConfig([
  globalIgnores([${ignores.join(', ')}]),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
${extendsList.map((entry) => `      ${entry},`).join('\n')}
    ],
    languageOptions: {
      globals: globals.browser,
    },
  },${routeOverride}${tail}
]);
`;
}

export const lintEslint: Feature = {
  id: 'lint-eslint',
  enabled: (selection) => selection.linter === 'eslint',
  devDependencies: (context) => {
    const packages = entries([
      'eslint',
      '@eslint/js',
      'typescript-eslint',
      'globals',
      'eslint-plugin-react-hooks',
      'eslint-plugin-react-refresh',
    ]);
    if (context.selection.prettier) Object.assign(packages, entries(['eslint-config-prettier']));
    if (context.selection.query) {
      Object.assign(packages, entries(['@tanstack/eslint-plugin-query']));
    }
    return packages;
  },
  removeDependencies: () => ['oxlint'],
  removeFiles: () => ['.oxlintrc.json'],
  files: (context) => [{ path: 'eslint.config.js', contents: eslintConfig(context) }],
  scripts: () => ({ lint: 'eslint .', 'lint:fix': 'eslint . --fix' }),
};
