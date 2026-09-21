import { intro, log, outro, spinner } from '@clack/prompts';
import { resolve } from 'node:path';
import pc from 'picocolors';

import { parseCliArgs } from './args.js';
import { HELP_TEXT } from './help.js';
import { clackPrompter } from './prompts.js';
import { resolveSelection } from './resolve.js';
import { commandsFor, createViteCommand, detectPackageManager } from '../env/package-manager.js';
import { CliError, PromptCancelledError } from '../errors.js';
import { buildPlan } from '../plan/build.js';
import { assertManifestCoherent } from '../plan/invariants.js';
import { applyPlan } from '../run/apply.js';
import type { Io } from '../run/io.js';

declare const __CLI_VERSION__: string;

function isInteractive(argv: { yes: boolean }, env: NodeJS.ProcessEnv): boolean {
  if (argv.yes) return false;
  if (env.CI !== undefined && env.CI !== 'false' && env.CI !== '0') return false;
  return process.stdin.isTTY === true;
}

async function runPipeline(argv: string[], env: NodeJS.ProcessEnv, io: Io): Promise<void> {
  const args = parseCliArgs(argv);

  if (args.help) {
    console.log(HELP_TEXT);
    return;
  }
  if (args.version) {
    console.log(__CLI_VERSION__);
    return;
  }

  intro(pc.cyan('create-anvil'));

  const interactive = isInteractive(args, env);
  const resolved = await resolveSelection({ args, interactive, prompter: clackPrompter });

  const detected = detectPackageManager(env.npm_config_user_agent, args.pm);
  const selection = { ...resolved, packageManager: detected.name };
  const pm = commandsFor(detected.name);
  log.info(`Gerenciador: ${pm.name}`);

  const root = resolve(process.cwd(), selection.directoryName);
  if (await io.exists(root)) {
    throw new CliError(`A pasta "${selection.directoryName}" já existe.`, { exitCode: 2 });
  }

  let createdRoot = false;

  try {
    const scaffold = createViteCommand(pm, selection.directoryName);
    const scaffoldSpinner = spinner();
    scaffoldSpinner.start('Criando a base com o create-vite');
    await io.run(scaffold.command, scaffold.args, { cwd: process.cwd() });
    createdRoot = true;
    scaffoldSpinner.stop('Base criada');

    const base = await io.readTree(root);
    const plan = buildPlan(selection, base);
    assertManifestCoherent(plan);

    if (args.dryRun) {
      log.info(
        `Arquivos que seriam escritos:\n  ${plan.files.map((file) => file.path).join('\n  ')}`,
      );
      log.info(`Removidos:\n  ${plan.removals.join('\n  ') || '(nenhum)'}`);
      await io.remove(root);
      outro('Simulação concluída (--dry-run).');
      return;
    }

    await applyPlan(plan, root, io);
    log.success('Arquivos do projeto gerados');

    if (selection.git) {
      await io.run('git', ['init', '-b', 'main'], { cwd: root });
    }

    if (selection.install) {
      const installSpinner = spinner();
      installSpinner.start('Instalando dependências');
      const install = pm.install();
      await io.run(install.command, install.args, { cwd: root });
      installSpinner.stop('Dependências instaladas');
    }

    const formatScript = plan.packageJson.scripts?.format;
    if (selection.install && formatScript !== undefined) {
      const format = pm.runScriptSpec('format');
      await io.run(format.command, format.args, { cwd: root });
      log.success('Projeto formatado');
    }

    if (selection.git) {
      await io.run('git', ['add', '-A'], { cwd: root });
      await io.run('git', ['commit', '-m', 'chore: commit inicial'], { cwd: root });
    }

    outro(`Pronto.\n\n  cd ${selection.directoryName}\n  ${pm.runScript('dev')}\n`);
  } catch (error) {
    if (createdRoot && !args.keepOnError) {
      await io.remove(root);
      log.warn(`Revertido: a pasta "${selection.directoryName}" foi removida.`);
    }
    throw error;
  }
}

export async function main(argv: string[], env: NodeJS.ProcessEnv, io: Io): Promise<number> {
  try {
    await runPipeline(argv, env, io);
    return 0;
  } catch (error) {
    if (error instanceof PromptCancelledError) {
      log.warn(error.message);
      return error.exitCode;
    }
    if (error instanceof CliError) {
      log.error(error.message);
      return error.exitCode;
    }
    log.error('Erro inesperado.');
    console.error(error);
    return 1;
  }
}
