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

export function isPackageManagerName(value: string): value is PackageManagerName {
  return KNOWN.has(value);
}

export function detectPackageManager(
  userAgent: string | undefined,
  override?: PackageManagerName,
): DetectedPackageManager {
  if (override) return { name: override };

  const firstToken = (userAgent ?? '').trim().split(/\s+/)[0] ?? '';
  const [rawName, rawVersion] = firstToken.split('/');

  if (rawName && KNOWN.has(rawName)) {
    return { name: rawName as PackageManagerName, version: rawVersion || undefined };
  }

  return { name: 'npm' };
}

export interface PackageManagerCommands {
  name: PackageManagerName;
  execute(packageSpec: string, args: string[]): CommandSpec;
  install(): CommandSpec;
  installFrozen: string;
  exec(bin: string): string;
  runScript(script: string): string;
  runScriptSpec(script: string): CommandSpec;
}

export function majorVersion(version: string | undefined): number | undefined {
  const match = /^(\d+)\.\d+\.\d+/.exec(version ?? '');
  return match ? Number(match[1]) : undefined;
}

export function packageManagerField(
  name: PackageManagerName,
  version: string | undefined,
): string | undefined {
  if (name === 'npm' || majorVersion(version) === undefined) return undefined;
  return `${name}@${version}`;
}

function frozenInstall(name: PackageManagerName, version: string | undefined): string {
  if (name === 'npm') return 'npm ci';
  if (name === 'yarn') {
    return (majorVersion(version) ?? 1) >= 2
      ? 'yarn install --immutable'
      : 'yarn install --frozen-lockfile';
  }
  return `${name} install --frozen-lockfile`;
}

const EXEC_PREFIX: Record<PackageManagerName, string> = {
  npm: 'npx',
  pnpm: 'pnpm exec',
  yarn: 'yarn',
  bun: 'bunx',
};

export function commandsFor(name: PackageManagerName, version?: string): PackageManagerCommands {
  const runScriptSpec = (script: string): CommandSpec =>
    name === 'npm' || name === 'bun'
      ? { command: name, args: ['run', script] }
      : { command: name, args: [script] };

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
    installFrozen: frozenInstall(name, version),
    exec(bin) {
      return `${EXEC_PREFIX[name]} ${bin}`;
    },
    runScript(script) {
      const { command, args } = runScriptSpec(script);
      return [command, ...args].join(' ');
    },
    runScriptSpec,
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
