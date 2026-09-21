export const VERSIONS = {
  '@biomejs/biome': '^2',
  'class-variance-authority': '^0.7',
  cn: '^0.3',
  'lucide-react': '^1',
  'radix-ui': '^1',
  shadcn: '^4',
  'tw-animate-css': '^1',
  '@eslint/js': '^10',
  '@hookform/resolvers': '^5',
  '@tailwindcss/vite': '^4',
  '@tanstack/eslint-plugin-query': '^5',
  '@tanstack/react-query': '^5',
  '@tanstack/react-query-devtools': '^5',
  '@tanstack/react-router': '^1',
  '@tanstack/react-router-devtools': '^1',
  '@tanstack/router-plugin': '^1',
  '@testing-library/dom': '^10',
  '@vitest/coverage-v8': '^5',
  axios: '^1',
  '@testing-library/jest-dom': '^7',
  '@testing-library/react': '^16',
  '@testing-library/user-event': '^14',
  'eslint-config-prettier': '^10',
  'eslint-plugin-react-hooks': '^7',
  'eslint-plugin-react-refresh': '^0.5',
  'prettier-plugin-tailwindcss': '^0.8',
  'react-hook-form': '^7',
  'react-router': '^8',
  'typescript-eslint': '^8',
  eslint: '^10',
  globals: '^17',
  husky: '^9',
  jsdom: '^30',
  'lint-staged': '^17',
  prettier: '^3',
  tailwindcss: '^4',
  vitest: '^5',
  zod: '^4',
  zustand: '^5',
} as const satisfies Record<string, string>;

export type KnownPackage = keyof typeof VERSIONS;

export function range(name: KnownPackage): string {
  return VERSIONS[name];
}

export function entries(names: KnownPackage[]): Record<string, string> {
  return Object.fromEntries(names.map((name) => [name, VERSIONS[name]]));
}
