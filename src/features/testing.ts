import type { Feature } from '../plan/types.js';
import { entries } from './versions.js';

const SETUP_TS = `import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

afterEach(() => {
  cleanup();
});
`;

const SMOKE_TEST = `import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

describe('ambiente de testes', () => {
  it('renderiza um componente', () => {
    render(<p>ok</p>);
    expect(screen.getByText('ok')).toBeInTheDocument();
  });
});
`;

const TSCONFIG_VITEST = `${JSON.stringify(
  {
    extends: './tsconfig.app.json',
    compilerOptions: {
      tsBuildInfoFile: './node_modules/.tmp/tsconfig.vitest.tsbuildinfo',
      types: ['vite/client', 'node'],
      noEmit: true,
    },
    include: ['src', 'vite.config.ts'],
    exclude: [],
  },
  null,
  2,
)}\n`;

const TEST_BLOCK = `  test: {
    environment: 'jsdom',
    globals: false,
    restoreMocks: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.{test,spec}.{ts,tsx}',
        'src/test/**',
        'src/**/*.d.ts',
        'src/main.tsx',
        'src/routeTree.gen.ts',
      ],
    },
  },`;

export const TEST_FILE_GLOBS = [
  'src/**/*.test.ts',
  'src/**/*.test.tsx',
  'src/**/*.spec.ts',
  'src/**/*.spec.tsx',
  'src/test',
];

export const testing: Feature = {
  id: 'testing',
  enabled: (selection) => selection.vitest,
  devDependencies: () =>
    entries([
      'vitest',
      '@vitest/coverage-v8',
      'jsdom',
      '@testing-library/react',
      '@testing-library/dom',
      '@testing-library/jest-dom',
      '@testing-library/user-event',
    ]),
  files: () => [
    { path: 'src/test/setup.ts', contents: SETUP_TS },
    { path: 'src/test/smoke.test.tsx', contents: SMOKE_TEST },
    { path: 'tsconfig.vitest.json', contents: TSCONFIG_VITEST },
  ],
  scripts: () => ({
    test: 'vitest run',
    'test:watch': 'vitest',
    'test:coverage': 'vitest run --coverage',
    'test:types': 'tsc -p tsconfig.vitest.json --noEmit',
  }),
  viteTestBlock: () => TEST_BLOCK,
};
