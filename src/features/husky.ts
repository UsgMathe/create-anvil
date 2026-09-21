import type { Feature, FeatureContext } from '../plan/types.js';
import { entries } from './versions.js';

function lintStagedConfig(context: FeatureContext): string {
  const { linter } = context.selection;

  if (linter === 'biome') {
    return `${JSON.stringify(
      { '*.{ts,tsx,json,css}': ['biome check --write --no-errors-on-unmatched'] },
      null,
      2,
    )}\n`;
  }

  const linterCommand = linter === 'eslint' ? 'eslint --fix' : 'oxlint --fix';
  const commands = context.selection.prettier
    ? [linterCommand, 'prettier --write']
    : [linterCommand];

  const config: Record<string, string[]> = { '*.{ts,tsx}': commands };
  if (context.selection.prettier) {
    config['*.{json,css,md,yml,yaml}'] = ['prettier --write'];
  }

  return `${JSON.stringify(config, null, 2)}\n`;
}

export const husky: Feature = {
  id: 'husky',
  enabled: (selection) => selection.husky,
  devDependencies: () => entries(['husky', 'lint-staged']),
  files: (context) => [
    { path: '.lintstagedrc.json', contents: lintStagedConfig(context) },
    { path: '.husky/pre-commit', contents: `npx lint-staged${'\n'}` },
  ],
  scripts: () => ({ prepare: 'husky' }),
};
