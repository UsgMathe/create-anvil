import type { Feature } from '../plan/types.js';
import { entries } from './versions.js';

const BIOME_JSON = `${JSON.stringify(
  {
    $schema: 'https://biomejs.dev/schemas/2.5.14/schema.json',
    vcs: { enabled: true, clientKind: 'git', useIgnoreFile: true },
    files: { ignoreUnknown: false, includes: ['**', '!dist', '!coverage', '!public'] },
    formatter: { enabled: true, indentStyle: 'space', indentWidth: 2, lineWidth: 100 },
    assist: { actions: { source: { organizeImports: 'on' } } },
    linter: { enabled: true, rules: { recommended: true } },
    javascript: {
      formatter: { quoteStyle: 'single', semicolons: 'always', trailingCommas: 'all' },
    },
  },
  null,
  2,
)}\n`;

export const lintBiome: Feature = {
  id: 'lint-biome',
  enabled: (selection) => selection.linter === 'biome',
  devDependencies: () => entries(['@biomejs/biome']),
  removeDependencies: () => ['oxlint'],
  removeFiles: () => ['.oxlintrc.json'],
  files: () => [{ path: 'biome.json', contents: BIOME_JSON }],
  scripts: () => ({
    lint: 'biome lint',
    'lint:fix': 'biome lint --write',
    format: 'biome format --write',
    'format:check': 'biome format',
    check: 'biome check --write',
  }),
};
