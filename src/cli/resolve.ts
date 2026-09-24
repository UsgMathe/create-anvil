import { CliError } from '../errors.js';
import type { LinterChoice, RouterChoice, Selection } from '../plan/types.js';
import { validateProjectName } from '../validate/project-name.js';
import type { BooleanFlag, RawArgs } from './args.js';
import { LINTER_OPTION, ROUTER_OPTION, optionByKey, promptMessage } from './options.js';
import { PRESETS, isPresetName } from './presets.js';
import type { Prompter } from './prompts.js';

const ROUTERS: RouterChoice[] = ['none', 'react-router', 'tanstack'];
const LINTERS: LinterChoice[] = ['none', 'oxlint', 'eslint', 'biome'];

const DEFAULTS = PRESETS.minimal;

function assertChoice<T extends string>(value: string, allowed: T[], flag: string): T {
  if (!allowed.includes(value as T)) {
    throw new CliError(`Valor inválido para --${flag}: "${value}". Use: ${allowed.join(', ')}.`, {
      exitCode: 2,
    });
  }
  return value as T;
}

export interface ResolveInput {
  args: RawArgs;
  interactive: boolean;
  prompter: Prompter;
}

export type ResolvedSelection = Omit<Selection, 'packageManager'>;

export async function resolveSelection(input: ResolveInput): Promise<ResolvedSelection> {
  const { args, interactive, prompter } = input;

  if (args.preset !== undefined && !isPresetName(args.preset)) {
    throw new CliError(`Preset desconhecido: "${args.preset}". Use minimal ou full.`, {
      exitCode: 2,
    });
  }
  const preset = args.preset ? PRESETS[args.preset] : undefined;

  let rawName = args.projectName;
  if (rawName === undefined) {
    if (!interactive) {
      throw new CliError('Informe o nome do projeto. Ex.: npm create anvil@latest meu-app', {
        exitCode: 2,
      });
    }
    rawName = await prompter.text({
      message: 'Nome do projeto',
      validate: (value) => {
        const result = validateProjectName(value);
        return result.ok ? undefined : result.problems.join(' ');
      },
    });
  }

  const name = validateProjectName(rawName);
  if (!name.ok) {
    throw new CliError(`Nome de projeto inválido:\n  - ${name.problems.join('\n  - ')}`, {
      exitCode: 2,
    });
  }

  const askBoolean = async (
    key:
      | 'tailwind'
      | 'query'
      | 'shadcn'
      | 'vitest'
      | 'zustand'
      | 'forms'
      | 'husky'
      | 'githubActions'
      | 'env'
      | 'api',
  ): Promise<boolean> => {
    const flagged = args.booleans[optionByKey(key).flag as BooleanFlag];
    if (typeof flagged === 'boolean') return flagged;
    const fallback = (preset?.[key] ?? DEFAULTS[key]) as boolean;
    if (!interactive) return fallback;
    return prompter.confirm({ message: promptMessage(key), initial: fallback });
  };

  let router: RouterChoice;
  if (args.router !== undefined) {
    router = assertChoice(args.router, ROUTERS, 'router');
  } else if (preset?.router !== undefined && !interactive) {
    router = preset.router;
  } else if (interactive) {
    router = await prompter.select<RouterChoice>({
      message: ROUTER_OPTION.label,
      initial: (preset?.router ?? DEFAULTS.router) as RouterChoice,
      choices: ROUTER_OPTION.choices.map((choice) => ({
        value: choice.value as RouterChoice,
        label: choice.label,
        hint: choice.hint,
      })),
    });
  } else {
    router = (preset?.router ?? DEFAULTS.router) as RouterChoice;
  }

  let linter: LinterChoice;
  if (args.linter !== undefined) {
    linter = assertChoice(args.linter, LINTERS, 'linter');
  } else if (interactive) {
    linter = await prompter.select<LinterChoice>({
      message: LINTER_OPTION.label,
      initial: (preset?.linter ?? DEFAULTS.linter) as LinterChoice,
      choices: LINTER_OPTION.choices.map((choice) => ({
        value: choice.value as LinterChoice,
        label: choice.label,
        hint: choice.hint,
      })),
    });
  } else {
    linter = (preset?.linter ?? DEFAULTS.linter) as LinterChoice;
  }

  const tailwind = await askBoolean('tailwind');
  const query = await askBoolean('query');
  const shadcn = await askBoolean('shadcn');
  const vitest = await askBoolean('vitest');
  const zustand = await askBoolean('zustand');
  const forms = await askBoolean('forms');
  const husky = await askBoolean('husky');
  const githubActions = await askBoolean('githubActions');
  const envValidation = await askBoolean('env');
  const api = await askBoolean('api');

  const prettier = linter === 'biome' ? false : (args.booleans.prettier ?? true);

  if (api && !envValidation) {
    throw new CliError('O cliente HTTP lê VITE_API_URL de @/config/env, então --api exige --env.', {
      exitCode: 2,
    });
  }

  if (shadcn && !tailwind) {
    throw new CliError('shadcn/ui exige o Tailwind. Remova --no-tailwind ou --shadcn.', {
      exitCode: 2,
    });
  }

  return {
    packageName: name.packageName,
    directoryName: name.directoryName,
    router,
    linter,
    prettier,
    tailwind,
    shadcn,
    query,
    vitest,
    zustand,
    forms,
    husky,
    githubActions,
    env: envValidation,
    api,
    git: args.booleans.git ?? true,
    install: args.booleans.install ?? true,
  };
}
