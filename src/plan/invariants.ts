import { type ParseError, parse as parseJsonc } from 'jsonc-parser';

import { CliError } from '../errors.js';
import type { Plan } from './types.js';

const BACKSLASH = String.fromCharCode(92);

const BIN_PROVIDERS: Record<string, string> = {
  biome: '@biomejs/biome',
  eslint: 'eslint',
  husky: 'husky',
  'lint-staged': 'lint-staged',
  oxlint: 'oxlint',
  prettier: 'prettier',
  tsc: 'typescript',
  vite: 'vite',
  vitest: 'vitest',
};

const CONFIG_OWNERS: Record<string, string> = {
  '.oxlintrc.json': 'oxlint',
  '.prettierrc.json': 'prettier',
  'biome.json': '@biomejs/biome',
  'eslint.config.js': 'eslint',
};

function declaredPackages(plan: Plan): Set<string> {
  return new Set([
    ...Object.keys(plan.packageJson.dependencies ?? {}),
    ...Object.keys(plan.packageJson.devDependencies ?? {}),
  ]);
}

function binariesIn(script: string): string[] {
  return script
    .split(/&&|\|\||;/)
    .map((segment) => segment.trim().split(/\s+/))
    .map((tokens) => {
      const filtered = tokens.filter(
        (token) => token !== 'npx' && token !== 'exec' && token !== '--yes',
      );
      return filtered[0] ?? '';
    })
    .filter(Boolean);
}

export function assertManifestCoherent(plan: Plan): void {
  const declared = declaredPackages(plan);
  const problems: string[] = [];
  const writtenPaths = new Set(plan.files.map((file) => file.path));

  for (const [name, script] of Object.entries(plan.packageJson.scripts ?? {})) {
    for (const binary of binariesIn(script)) {
      const provider = BIN_PROVIDERS[binary];
      if (provider && !declared.has(provider)) {
        problems.push(
          `script "${name}" chama "${binary}", mas "${provider}" não está nas dependências`,
        );
      }
    }
  }

  for (const [configPath, owner] of Object.entries(CONFIG_OWNERS)) {
    const hasConfig = writtenPaths.has(configPath);
    const hasOwner = declared.has(owner);
    if (hasConfig && !hasOwner) {
      problems.push(`"${configPath}" foi escrito, mas "${owner}" não está nas dependências`);
    }
    if (hasOwner && !hasConfig && !plan.removals.includes(configPath)) {
      problems.push(`"${owner}" está nas dependências, mas "${configPath}" não foi escrito`);
    }
  }

  const overlap = Object.keys(plan.packageJson.dependencies ?? {}).filter((name) =>
    Object.hasOwn(plan.packageJson.devDependencies ?? {}, name),
  );
  for (const name of overlap) {
    problems.push(`"${name}" aparece em dependencies e devDependencies`);
  }

  const seen = new Set<string>();
  for (const file of plan.files) {
    if (seen.has(file.path)) problems.push(`arquivo duplicado no plano: "${file.path}"`);
    seen.add(file.path);
    if (file.path.startsWith('/') || file.path.includes('..') || file.path.includes(BACKSLASH)) {
      problems.push(`caminho inseguro no plano: "${file.path}"`);
    }
  }

  for (const file of plan.files) {
    if (!file.path.endsWith('.json')) continue;
    const errors: ParseError[] = [];
    parseJsonc(file.contents, errors, { allowTrailingComma: false });
    if (errors.length > 0) {
      problems.push(`"${file.path}" não é JSON(C) válido`);
    }
  }

  const packageJsonFile = plan.files.find((file) => file.path === 'package.json');
  if (packageJsonFile) {
    try {
      JSON.parse(packageJsonFile.contents);
    } catch {
      problems.push('"package.json" precisa ser JSON estrito, sem comentários');
    }
  }

  if (problems.length > 0) {
    throw new CliError(`Plano incoerente:\n  - ${problems.join('\n  - ')}`);
  }
}
