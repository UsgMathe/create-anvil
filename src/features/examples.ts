import { composeExamplePage } from '../compose/example-page.js';
import type { Feature, Selection } from '../plan/types.js';

export function hasExamples(selection: Selection): boolean {
  return selection.query || selection.forms || selection.zustand;
}

export function examplePagePath(selection: Selection): string {
  return selection.router === 'none' ? 'src/examples.tsx' : 'src/routes/examples.tsx';
}

export const examples: Feature = {
  id: 'examples',
  enabled: hasExamples,
  files: ({ selection }) => [
    { path: examplePagePath(selection), contents: composeExamplePage(selection) },
  ],
};
