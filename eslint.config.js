import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['bin', 'dist', 'coverage', 'site', 'tests/__snapshots__', 'tests/fixtures'] },
  js.configs.recommended,
  tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: { allowDefaultProject: ['eslint.config.js'] },
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      'no-process-exit': 'error',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/consistent-type-imports': 'error',
      'no-restricted-imports': [
        'error',
        {
          paths: [
            { name: 'execa', message: 'Side effects belong in src/run/. Keep src/plan/ pure.' },
            { name: 'fs', message: 'Side effects belong in src/run/. Keep src/plan/ pure.' },
            { name: 'node:fs', message: 'Side effects belong in src/run/. Keep src/plan/ pure.' },
            {
              name: 'node:fs/promises',
              message: 'Side effects belong in src/run/. Keep src/plan/ pure.',
            },
          ],
        },
      ],
    },
  },
  {
    files: [
      'src/run/**/*.ts',
      'src/index.ts',
      'tests/**/*.ts',
      'scripts/**/*.ts',
      'tsup.config.ts',
      'vitest.config.ts',
    ],
    rules: { 'no-restricted-imports': 'off' },
  },
  {
    files: ['src/index.ts'],
    rules: { 'no-process-exit': 'off' },
  },
  {
    files: ['tests/**/*.ts'],
    rules: {
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/require-await': 'off',
    },
  },
);
