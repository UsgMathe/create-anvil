import type {
  ImportSpec,
  PreambleContribution,
  ProviderContribution,
  RootElementContribution,
} from '../plan/types.js';
import { renderImports } from './imports.js';

export interface MainTsxInput {
  providers: ProviderContribution[];
  preamble: PreambleContribution[];
  rootElement: RootElementContribution;
}

function indent(level: number, line: string): string {
  return `${'  '.repeat(level)}${line}`;
}

export function composeMainTsx(input: MainTsxInput): string {
  const providers = [...input.providers].sort((a, b) => a.order - b.order);
  const preamble = [...input.preamble].sort((a, b) => a.order - b.order);

  const imports: ImportSpec[] = [
    { from: 'react', named: ['StrictMode'] },
    { from: 'react-dom/client', named: ['createRoot'] },
    ...preamble.flatMap((entry) => entry.imports),
    ...providers.flatMap((provider) => provider.imports),
    ...input.rootElement.imports,
    { from: './index.css', sideEffect: true },
  ];

  const openTags = ['<StrictMode>', ...providers.map((provider) => provider.open)];
  const closeTags = [...providers.map((provider) => provider.close).reverse(), '</StrictMode>'];

  const body: string[] = [];
  openTags.forEach((tag, index) => body.push(indent(index + 1, tag)));
  body.push(indent(openTags.length + 1, input.rootElement.jsx));
  closeTags.forEach((tag, index) => body.push(indent(openTags.length - index, tag)));

  const preambleCode = preamble.map((entry) => entry.code).filter(Boolean);
  const blocks = [renderImports(imports)];
  if (preambleCode.length > 0) blocks.push(preambleCode.join('\n\n'));

  blocks.push(
    [
      "const rootElement = document.getElementById('root');",
      '',
      'if (!rootElement) {',
      "  throw new Error('Elemento #root não encontrado no index.html');",
      '}',
    ].join('\n'),
  );

  blocks.push(`createRoot(rootElement).render(\n${body.join('\n')},\n);`);

  return `${blocks.join('\n\n')}\n`;
}
