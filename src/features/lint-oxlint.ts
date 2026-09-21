import type { Feature, FeatureContext } from '../plan/types.js';

function oxlintrc(context: FeatureContext): string {
  const ignorePatterns = ['dist', 'coverage'];
  if (context.selection.router === 'tanstack') ignorePatterns.push('src/routeTree.gen.ts');

  const config = {
    $schema: './node_modules/oxlint/configuration_schema.json',
    plugins: ['react', 'typescript', 'oxc', 'import', 'jsx-a11y'],
    categories: { correctness: 'error', suspicious: 'warn' },
    rules: {
      'react/rules-of-hooks': 'error',
      'react/only-export-components': ['warn', { allowConstantExport: true }],
    },
    ignorePatterns,
    overrides:
      context.selection.router === 'tanstack'
        ? [{ files: ['src/routes/**'], rules: { 'react/only-export-components': 'off' } }]
        : [],
  };

  return `${JSON.stringify(config, null, 2)}\n`;
}

export const lintOxlint: Feature = {
  id: 'lint-oxlint',
  enabled: (selection) => selection.linter === 'oxlint',
  files: (context) => [{ path: '.oxlintrc.json', contents: oxlintrc(context) }],
  scripts: () => ({ lint: 'oxlint', 'lint:fix': 'oxlint --fix' }),
};
