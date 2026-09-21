import { applyEdits, modify } from 'jsonc-parser';

const FORMATTING = { formattingOptions: { tabSize: 2, insertSpaces: true, eol: '\n' } };

export interface TsconfigEdit {
  path: (string | number)[];
  value: unknown;
}

export function editJsonc(source: string, edits: TsconfigEdit[]): string {
  let result = source;
  for (const edit of edits) {
    result = applyEdits(result, modify(result, edit.path, edit.value, FORMATTING));
  }
  return result.endsWith('\n') ? result : `${result}\n`;
}

export function addPathAlias(source: string): string {
  return editJsonc(source, [{ path: ['compilerOptions', 'paths', '@/*'], value: ['./src/*'] }]);
}

export function addExplicitStrict(source: string): string {
  return editJsonc(source, [{ path: ['compilerOptions', 'strict'], value: true }]);
}

export function addCompilerTypes(source: string, types: string[]): string {
  if (types.length === 0) return source.endsWith('\n') ? source : `${source}\n`;
  return editJsonc(source, [{ path: ['compilerOptions', 'types'], value: types }]);
}
