import { parseArgs } from 'node:util';

import { CliError } from '../errors.js';

export const BOOLEAN_FLAGS = [
  'tailwind',
  'shadcn',
  'query',
  'prettier',
  'vitest',
  'zustand',
  'forms',
  'husky',
  'gh-actions',
  'env',
  'api',
  'git',
  'install',
] as const;

export type BooleanFlag = (typeof BOOLEAN_FLAGS)[number];

export interface RawArgs {
  projectName?: string;
  help: boolean;
  version: boolean;
  yes: boolean;
  dryRun: boolean;
  keepOnError: boolean;
  router?: string;
  linter?: string;
  preset?: string;
  pm?: string;
  booleans: Partial<Record<BooleanFlag, boolean>>;
}

function buildOptions() {
  const options: Record<string, { type: 'boolean' | 'string'; short?: string }> = {
    help: { type: 'boolean', short: 'h' },
    version: { type: 'boolean', short: 'v' },
    yes: { type: 'boolean', short: 'y' },
    'dry-run': { type: 'boolean' },
    'keep-on-error': { type: 'boolean' },
    router: { type: 'string' },
    linter: { type: 'string' },
    preset: { type: 'string' },
    pm: { type: 'string' },
  };

  for (const flag of BOOLEAN_FLAGS) {
    options[flag] = { type: 'boolean' };
    options[`no-${flag}`] = { type: 'boolean' };
  }

  return options;
}

export function parseCliArgs(argv: string[]): RawArgs {
  let parsed;
  try {
    parsed = parseArgs({
      args: argv,
      options: buildOptions(),
      allowPositionals: true,
      strict: true,
    });
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : String(cause);
    throw new CliError(`${message}\nUse --help para ver as opções disponíveis.`, {
      exitCode: 2,
      cause,
    });
  }

  if (parsed.positionals.length > 1) {
    throw new CliError(
      `Informe apenas um nome de projeto (recebi: ${parsed.positionals.join(', ')}).`,
      { exitCode: 2 },
    );
  }

  const values = parsed.values as Record<string, boolean | string | undefined>;
  const booleans: Partial<Record<BooleanFlag, boolean>> = {};

  for (const flag of BOOLEAN_FLAGS) {
    const positive = values[flag];
    const negative = values[`no-${flag}`];
    if (positive === true && negative === true) {
      throw new CliError(`--${flag} e --no-${flag} são contraditórios.`, { exitCode: 2 });
    }
    if (positive === true) booleans[flag] = true;
    else if (negative === true) booleans[flag] = false;
  }

  return {
    projectName: parsed.positionals[0],
    help: values.help === true,
    version: values.version === true,
    yes: values.yes === true,
    dryRun: values['dry-run'] === true,
    keepOnError: values['keep-on-error'] === true,
    router: values.router as string | undefined,
    linter: values.linter as string | undefined,
    preset: values.preset as string | undefined,
    pm: values.pm as string | undefined,
    booleans,
  };
}
