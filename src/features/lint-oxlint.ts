import type { Feature, FeatureContext } from '../plan/types.js';

function exportOverrides(context: FeatureContext) {
  const paths: string[] = [];
  if (context.selection.router === 'tanstack') paths.push('src/routes/**');
  if (context.selection.shadcn) paths.push('src/components/ui/**');

  if (paths.length === 0) return [];
  return [{ files: paths, rules: { 'react/only-export-components': 'off' } }];
}

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
      'react/react-in-jsx-scope': 'off',
      'import/no-unassigned-import': 'off',
    },
    ignorePatterns,
    overrides: exportOverrides(context),
  };

  return `${JSON.stringify(config, null, 2)}\n`;
}

export const lintOxlint: Feature = {
  id: 'lint-oxlint',
  enabled: (selection) => selection.linter === 'oxlint',
  files: (context) => [{ path: '.oxlintrc.json', contents: oxlintrc(context) }],
  scripts: () => ({ lint: 'oxlint', 'lint:fix': 'oxlint --fix' }),
};
