export type RouterChoice = 'none' | 'react-router' | 'tanstack';
export type LinterChoice = 'none' | 'oxlint' | 'eslint' | 'biome';
export type PackageManagerName = 'npm' | 'pnpm' | 'yarn' | 'bun';

export interface Selection {
  packageName: string;
  directoryName: string;
  router: RouterChoice;
  linter: LinterChoice;
  prettier: boolean;
  tailwind: boolean;
  shadcn: boolean;
  query: boolean;
  vitest: boolean;
  zustand: boolean;
  forms: boolean;
  husky: boolean;
  githubActions: boolean;
  git: boolean;
  install: boolean;
}

export type BaseTree = Record<string, string>;

export interface FileOp {
  path: string;
  contents: string;
}

export interface PackageJson {
  name?: string;
  private?: boolean;
  version?: string;
  type?: string;
  scripts?: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  [key: string]: unknown;
}

export interface Plan {
  files: FileOp[];
  removals: string[];
  packageJson: PackageJson;
}

export interface ImportSpec {
  from: string;
  named?: string[];
  default?: string;
  sideEffect?: boolean;
}

export interface FeatureContext {
  selection: Selection;
  base: BaseTree;
  basePackageJson: PackageJson;
}

export interface VitePluginContribution {
  order: number;
  imports: ImportSpec[];
  expression: string;
}

export interface ProviderContribution {
  order: number;
  imports: ImportSpec[];
  open: string;
  close: string;
}

export interface PreambleContribution {
  order: number;
  imports: ImportSpec[];
  code: string;
}

export interface RootElementContribution {
  imports: ImportSpec[];
  jsx: string;
}

export interface CssContribution {
  order: number;
  content: string;
}

export interface Feature {
  id: string;
  enabled(selection: Selection): boolean;
  dependencies?(context: FeatureContext): Record<string, string>;
  devDependencies?(context: FeatureContext): Record<string, string>;
  removeDependencies?(context: FeatureContext): string[];
  files?(context: FeatureContext): FileOp[];
  removeFiles?(context: FeatureContext): string[];
  scripts?(context: FeatureContext): Record<string, string>;
  removeScripts?(context: FeatureContext): string[];
  vitePlugins?(context: FeatureContext): VitePluginContribution[];
  providers?(context: FeatureContext): ProviderContribution[];
  preamble?(context: FeatureContext): PreambleContribution[];
  rootElement?(context: FeatureContext): RootElementContribution;
  cssBlocks?(context: FeatureContext): CssContribution[];
  gitignore?(context: FeatureContext): string[];
  viteTestBlock?(context: FeatureContext): string;
  tsconfigAppTypes?(context: FeatureContext): string[];
}
