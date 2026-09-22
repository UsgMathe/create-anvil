import type { PackageManagerName } from '../plan/types.js';

export interface DetectedPackageManager {
  name: PackageManagerName;
  version?: string;
}

export interface CommandSpec {
  command: string;
  args: string[];
}

const KNOWN: ReadonlySet<string> = new Set(['npm', 'pnpm', 'yarn', 'bun']);

export function detectPackageManager(
  userAgent: string | undefined,
  override?: string,
): DetectedPackageManager {
  if (override) {
    if (!KNOWN.has(override)) {
      throw new Error(`Gerenciador desconhecido: "${override}". Use pnpm, npm, yarn ou bun.`);
    }
    return { name: override as PackageManagerName };
  }

  const firstToken = (userAgent ?? '').trim().split(/\s+/)[0] ?? '';
  const [rawName, rawVersion] = firstToken.split('/');

  if (rawName && KNOWN.has(rawName)) {
    return { name: rawName as PackageManagerName, version: rawVersion || undefined };
  }

  return { name: 'npm' };
}

export function majorVersion(version: string | undefined): number | undefined {
  const major = Number.parseInt((version ?? '').split('.')[0] ?? '', 10);
  return Number.isNaN(major) ? undefined : major;
}

export interface PackageManagerCommands {
  name: PackageManagerName;
  execute(packageSpec: string, args: string[]): CommandSpec;
  install(): CommandSpec;
  runScript(script: string): string;
  runScriptSpec(script: string): CommandSpec;
  lockfile: string;
}

export function commandsFor(name: PackageManagerName): PackageManagerCommands {
  return {
    name,
    execute(packageSpec, args) {
      if (name === 'npm') return { command: 'npx', args: ['--yes', packageSpec, ...args] };
      if (name === 'yarn') return { command: 'yarn', args: ['dlx', packageSpec, ...args] };
      if (name === 'bun') return { command: 'bunx', args: [packageSpec, ...args] };
      return { command: 'pnpm', args: ['dlx', packageSpec, ...args] };
    },
    install() {
      return { command: name, args: ['install'] };
    },
    runScript(script) {
      return name === 'npm' ? `npm run ${script}` : `${name} ${script}`;
    },
    runScriptSpec(script) {
      if (name === 'npm' || name === 'bun') return { command: name, args: ['run', script] };
      return { command: name, args: [script] };
    },
    lockfile:
      name === 'npm'
        ? 'package-lock.json'
        : name === 'pnpm'
          ? 'pnpm-lock.yaml'
          : name === 'yarn'
            ? 'yarn.lock'
            : 'bun.lock',
  };
}

export const CREATE_VITE_SPEC = 'create-vite@^9';

export function createViteCommand(pm: PackageManagerCommands, directoryName: string): CommandSpec {
  return pm.execute(CREATE_VITE_SPEC, [
    directoryName,
    '--template',
    'react-ts',
    '--no-interactive',
    '--no-eslint',
  ]);
}
