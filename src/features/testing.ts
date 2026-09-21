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

const TEST_BLOCK = `  test: {
    environment: 'jsdom',
    globals: false,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
  },`;

export const testing: Feature = {
  id: 'testing',
  enabled: (selection) => selection.vitest,
  devDependencies: () =>
    entries([
      'vitest',
      'jsdom',
      '@testing-library/react',
      '@testing-library/dom',
      '@testing-library/jest-dom',
      '@testing-library/user-event',
    ]),
  files: () => [
    { path: 'src/test/setup.ts', contents: SETUP_TS },
    { path: 'src/test/smoke.test.tsx', contents: SMOKE_TEST },
  ],
  scripts: () => ({ test: 'vitest run', 'test:watch': 'vitest' }),
  viteTestBlock: () => TEST_BLOCK,
};
