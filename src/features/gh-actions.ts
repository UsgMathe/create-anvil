import { commandsFor, packageManagerField } from '../env/package-manager.js';
import type { Feature, FeatureContext, Selection } from '../plan/types.js';

const PNPM_FALLBACK_VERSION = '10';

function setupSteps(selection: Selection): string[] {
  const { packageManager, packageManagerVersion } = selection;
  const pinned = packageManagerField(packageManager, packageManagerVersion) !== undefined;

  const setupNode = (cache?: string) =>
    [
      '      - uses: actions/setup-node@v5',
      '        with:',
      '          node-version: 22',
      ...(cache ? [`          cache: ${cache}`] : []),
    ].join('\n');

  if (packageManager === 'pnpm') {
    const pnpmSetup = pinned
      ? '      - uses: pnpm/action-setup@v4'
      : `      - uses: pnpm/action-setup@v4\n        with:\n          version: ${PNPM_FALLBACK_VERSION}`;
    return [pnpmSetup, setupNode('pnpm')];
  }

  if (packageManager === 'yarn') return ['      - run: corepack enable', setupNode('yarn')];

  if (packageManager === 'bun') return [setupNode(), '      - uses: oven-sh/setup-bun@v2'];

  return [setupNode('npm')];
}

function checkSteps(selection: Selection): string[] {
  const pm = commandsFor(selection.packageManager, selection.packageManagerVersion);
  const scripts: string[] = [];

  if (selection.linter !== 'none') scripts.push('lint');
  if (selection.prettier || selection.linter === 'biome') scripts.push('format:check');
  scripts.push('build');
  if (selection.vitest) scripts.push('test');

  return [
    `      - run: ${pm.installFrozen}`,
    ...(selection.env ? ['      - run: cp sample.env .env'] : []),
    ...scripts.map((script) => `      - run: ${pm.runScript(script)}`),
  ];
}

function workflow(context: FeatureContext): string {
  const { selection } = context;

  return `name: CI

on:
  push:
    branches: [main]
  pull_request:

permissions:
  contents: read

jobs:
  ci:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5
${setupSteps(selection).join('\n')}
${checkSteps(selection).join('\n')}
`;
}

export const githubActions: Feature = {
  id: 'gh-actions',
  enabled: (selection) => selection.githubActions,
  files: (context) => [{ path: '.github/workflows/ci.yml', contents: workflow(context) }],
};
