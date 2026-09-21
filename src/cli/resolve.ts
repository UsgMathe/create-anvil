import { CliError } from '../errors.js';
import type { LinterChoice, RouterChoice, Selection } from '../plan/types.js';
import { validateProjectName } from '../validate/project-name.js';
import type { BooleanFlag, RawArgs } from './args.js';
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

  const FLAG_FOR: Partial<Record<string, BooleanFlag>> = {
    githubActions: 'gh-actions',
  };

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
    message: string,
  ): Promise<boolean> => {
    const flagged = args.booleans[FLAG_FOR[key] ?? (key as BooleanFlag)];
    if (typeof flagged === 'boolean') return flagged;
    const fallback = (preset?.[key] ?? DEFAULTS[key]) as boolean;
    if (!interactive) return fallback;
    return prompter.confirm({ message, initial: fallback });
  };

  let router: RouterChoice;
  if (args.router !== undefined) {
    router = assertChoice(args.router, ROUTERS, 'router');
  } else if (preset?.router !== undefined && !interactive) {
    router = preset.router;
  } else if (interactive) {
    router = await prompter.select<RouterChoice>({
      message: 'Roteamento',
      initial: (preset?.router ?? DEFAULTS.router) as RouterChoice,
      choices: [
        { value: 'none', label: 'Nenhum', hint: 'app de página única' },
        { value: 'react-router', label: 'React Router', hint: 'v8, modo biblioteca' },
        { value: 'tanstack', label: 'TanStack Router', hint: 'rotas por arquivo, tipado' },
      ],
    });
  } else {
    router = (preset?.router ?? DEFAULTS.router) as RouterChoice;
  }

  let linter: LinterChoice;
  if (args.linter !== undefined) {
    linter = assertChoice(args.linter, LINTERS, 'linter');
  } else if (interactive) {
    linter = await prompter.select<LinterChoice>({
      message: 'Lint e formatação',
      initial: (preset?.linter ?? DEFAULTS.linter) as LinterChoice,
      choices: [
        { value: 'oxlint', label: 'Oxlint + Prettier', hint: 'o padrão do create-vite' },
        { value: 'eslint', label: 'ESLint + Prettier', hint: 'ecossistema de plugins' },
        { value: 'biome', label: 'Biome', hint: 'sem ordenação de classes Tailwind' },
      ],
    });
  } else {
    linter = (preset?.linter ?? DEFAULTS.linter) as LinterChoice;
  }

  const tailwind = await askBoolean('tailwind', 'TailwindCSS v4?');
  const query = await askBoolean('query', 'TanStack Query?');
  const shadcn = await askBoolean('shadcn', 'shadcn/ui?');
  const vitest = await askBoolean('vitest', 'Vitest + Testing Library?');
  const zustand = await askBoolean('zustand', 'Zustand?');
  const forms = await askBoolean('forms', 'react-hook-form + zod?');
  const husky = await askBoolean('husky', 'husky + lint-staged?');
  const githubActions = await askBoolean('githubActions', 'Workflow de CI no projeto gerado?');
  const envValidation = await askBoolean('env', 'Validação de variáveis de ambiente com zod?');
  const api = await askBoolean('api', 'Cliente HTTP com proxy de /api no dev?');

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
