import type { Feature, FeatureContext } from '../plan/types.js';

function workflow(context: FeatureContext): string {
  const steps = ['      - run: npm run build'];
  if (context.selection.linter !== 'none') steps.unshift('      - run: npm run lint');
  if (context.selection.vitest) steps.push('      - run: npm test');

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
      - uses: actions/setup-node@v5
        with:
          node-version: 22
          cache: npm
      - run: npm ci
${steps.join('\n')}
`;
}

export const githubActions: Feature = {
  id: 'gh-actions',
  enabled: (selection) => selection.githubActions,
  files: (context) => [{ path: '.github/workflows/ci.yml', contents: workflow(context) }],
};
