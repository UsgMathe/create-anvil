import type { PackageJson } from '../plan/types.js';

export interface PackageJsonInput {
  base: PackageJson;
  name: string;
  scripts: Record<string, string>;
  removeScripts: string[];
  removeDependencies: string[];
  addDependencies: Record<string, string>;
  addDevDependencies: Record<string, string>;
}

function sortKeys(record: Record<string, string>): Record<string, string> {
  return Object.fromEntries(Object.entries(record).sort(([a], [b]) => a.localeCompare(b)));
}

function omit(record: Record<string, string>, keys: string[]): Record<string, string> {
  return Object.fromEntries(Object.entries(record).filter(([key]) => !keys.includes(key)));
}

export function composePackageJson(input: PackageJsonInput): PackageJson {
  const result: PackageJson = { ...input.base, name: input.name };

  result.scripts = omit({ ...(input.base.scripts ?? {}), ...input.scripts }, input.removeScripts);

  const dependencies = sortKeys(
    omit(
      { ...(input.base.dependencies ?? {}), ...input.addDependencies },
      input.removeDependencies,
    ),
  );

  const devDependencies = sortKeys(
    omit({ ...(input.base.devDependencies ?? {}), ...input.addDevDependencies }, [
      ...input.removeDependencies,
      ...Object.keys(input.addDependencies),
    ]),
  );

  result.dependencies = dependencies;
  result.devDependencies = devDependencies;

  return result;
}

export function renderPackageJson(packageJson: PackageJson): string {
  return `${JSON.stringify(packageJson, null, 2)}\n`;
}
