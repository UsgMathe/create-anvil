export const PACKAGE_MANAGERS = ['pnpm', 'npm', 'yarn', 'bun'] as const;

export type PackageManager = (typeof PACKAGE_MANAGERS)[number];

export const DEFAULT_PACKAGE_MANAGER: PackageManager = 'pnpm';

export function createCommand(packageManager: PackageManager, directory: string): string {
  if (packageManager === 'yarn') return `yarn create anvil ${directory}`;
  if (packageManager === 'bun') return `bun create anvil ${directory}`;
  return `${packageManager} create anvil@latest ${directory}`;
}

export function runCommand(packageManager: PackageManager, script: string): string {
  return packageManager === 'npm' || packageManager === 'bun'
    ? `${packageManager} run ${script}`
    : `${packageManager} ${script}`;
}
