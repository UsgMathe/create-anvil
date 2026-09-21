import { composeIndexCss } from '../compose/index-css.js';
import { composeMainTsx } from '../compose/main-tsx.js';
import { composePackageJson, renderPackageJson } from '../compose/package-json.js';
import { addPathAlias } from '../compose/tsconfig.js';
import { composeViteConfig } from '../compose/vite-config.js';
import { FEATURES } from '../features/registry.js';
import { CliError } from '../errors.js';
import type {
  BaseTree,
  CssContribution,
  FeatureContext,
  FileOp,
  PackageJson,
  Plan,
  PreambleContribution,
  ProviderContribution,
  RootElementContribution,
  Selection,
  VitePluginContribution,
} from './types.js';

function readBasePackageJson(base: BaseTree): PackageJson {
  const raw = base['package.json'];
  if (raw === undefined) {
    throw new CliError('O create-vite não gerou um package.json — abortando.');
  }
  try {
    return JSON.parse(raw) as PackageJson;
  } catch (cause) {
    throw new CliError('O package.json gerado pelo create-vite não é JSON válido.', { cause });
  }
}

export function replaceOrThrow(source: string, pattern: RegExp, replacement: string): string {
  if (!pattern.test(source)) {
    throw new CliError(`Padrão esperado não encontrado no arquivo base: ${pattern.source}`);
  }
  return source.replace(pattern, replacement);
}

function appendGitignore(base: BaseTree, lines: string[]): string {
  const current = base['.gitignore'] ?? '';
  const missing = lines.filter((line) => !current.split(/\r?\n/).includes(line));
  if (missing.length === 0) return current.endsWith('\n') ? current : `${current}\n`;
  const prefix = current.endsWith('\n') || current === '' ? current : `${current}\n`;
  return `${prefix}${missing.join('\n')}\n`;
}

export function buildPlan(selection: Selection, base: BaseTree): Plan {
  const basePackageJson = readBasePackageJson(base);
  const context: FeatureContext = { selection, base, basePackageJson };
  const active = FEATURES.filter((feature) => feature.enabled(selection));

  const dependencies: Record<string, string> = {};
  const devDependencies: Record<string, string> = {};
  const removeDependencies: string[] = [];
  const scripts: Record<string, string> = {};
  const scriptOwner: Record<string, string> = {};
  const removeScripts: string[] = [];
  const files: FileOp[] = [];
  const fileOwner: Record<string, string> = {};
  const removals = new Set<string>();
  const vitePlugins: VitePluginContribution[] = [];
  const providers: ProviderContribution[] = [];
  const preamble: PreambleContribution[] = [];
  const cssBlocks: CssContribution[] = [];
  const gitignore: string[] = [];
  let rootElement: RootElementContribution | undefined;
  let rootElementOwner: string | undefined;

  for (const feature of active) {
    Object.assign(dependencies, feature.dependencies?.(context) ?? {});
    Object.assign(devDependencies, feature.devDependencies?.(context) ?? {});
    removeDependencies.push(...(feature.removeDependencies?.(context) ?? []));
    removeScripts.push(...(feature.removeScripts?.(context) ?? []));
    for (const path of feature.removeFiles?.(context) ?? []) removals.add(path);
    vitePlugins.push(...(feature.vitePlugins?.(context) ?? []));
    providers.push(...(feature.providers?.(context) ?? []));
    preamble.push(...(feature.preamble?.(context) ?? []));
    cssBlocks.push(...(feature.cssBlocks?.(context) ?? []));
    gitignore.push(...(feature.gitignore?.(context) ?? []));

    for (const [name, value] of Object.entries(feature.scripts?.(context) ?? {})) {
      const previous = scriptOwner[name];
      if (previous !== undefined && scripts[name] !== value) {
        throw new CliError(
          `Conflito: "${previous}" e "${feature.id}" definem o script "${name}" com valores diferentes.`,
        );
      }
      scripts[name] = value;
      scriptOwner[name] = feature.id;
    }

    for (const file of feature.files?.(context) ?? []) {
      const previous = fileOwner[file.path];
      if (previous !== undefined) {
        throw new CliError(
          `Conflito: "${previous}" e "${feature.id}" escrevem o mesmo arquivo "${file.path}".`,
        );
      }
      fileOwner[file.path] = feature.id;
      files.push(file);
    }

    const contributedRoot = feature.rootElement?.(context);
    if (contributedRoot) {
      if (rootElement) {
        throw new CliError(
          `Conflito: "${rootElementOwner}" e "${feature.id}" definem o elemento raiz do main.tsx.`,
        );
      }
      rootElement = contributedRoot;
      rootElementOwner = feature.id;
    }
  }

  if (!rootElement) {
    throw new CliError('Nenhuma feature definiu o elemento raiz do main.tsx.');
  }

  const testBlock = active
    .map((feature) => feature.viteTestBlock?.(context))
    .find((block): block is string => Boolean(block));

  files.push({
    path: 'src/main.tsx',
    contents: composeMainTsx({ providers, preamble, rootElement }),
  });
  files.push({
    path: 'vite.config.ts',
    contents: composeViteConfig({ plugins: vitePlugins, testBlock }),
  });

  if (cssBlocks.length > 0) {
    files.push({ path: 'src/index.css', contents: composeIndexCss(cssBlocks) });
  }

  for (const tsconfigPath of ['tsconfig.json', 'tsconfig.app.json']) {
    const source = base[tsconfigPath];
    if (source !== undefined) {
      files.push({ path: tsconfigPath, contents: addPathAlias(source) });
    }
  }

  const indexHtml = base['index.html'];
  if (indexHtml !== undefined) {
    files.push({
      path: 'index.html',
      contents: replaceOrThrow(
        indexHtml,
        /<title>[\s\S]*?<\/title>/,
        `<title>${selection.packageName}</title>`,
      ),
    });
  }

  files.push({ path: '.gitignore', contents: appendGitignore(base, gitignore) });

  const packageJson = composePackageJson({
    base: basePackageJson,
    name: selection.packageName,
    scripts,
    removeScripts,
    removeDependencies,
    addDependencies: dependencies,
    addDevDependencies: devDependencies,
  });

  files.push({ path: 'package.json', contents: renderPackageJson(packageJson) });

  return { files, removals: [...removals], packageJson };
}
