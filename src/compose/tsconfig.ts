import { applyEdits, modify } from 'jsonc-parser';

const FORMATTING = { formattingOptions: { tabSize: 2, insertSpaces: true, eol: '\n' } };

export interface TsconfigEdit {
  path: (string | number)[];
  value: unknown;
  insert?: boolean;
}

export function editJsonc(source: string, edits: TsconfigEdit[]): string {
  let result = source;
  for (const edit of edits) {
    const options = { ...FORMATTING, isArrayInsertion: edit.insert ?? false };
    result = applyEdits(result, modify(result, edit.path, edit.value, options));
  }
  return result.endsWith('\n') ? result : `${result}\n`;
}

export function addReference(source: string, path: string): string {
  return editJsonc(source, [{ path: ['references', -1], value: { path }, insert: true }]);
}

export function addPathAlias(source: string): string {
  return editJsonc(source, [{ path: ['compilerOptions', 'paths', '@/*'], value: ['./src/*'] }]);
}

export function addExcludes(source: string, globs: string[]): string {
  if (globs.length === 0) return source;
  return editJsonc(source, [{ path: ['exclude'], value: globs }]);
}

export function addExplicitStrict(source: string): string {
  return editJsonc(source, [{ path: ['compilerOptions', 'strict'], value: true }]);
}

export function addCompilerTypes(source: string, types: string[]): string {
  if (types.length === 0) return source.endsWith('\n') ? source : `${source}\n`;
  return editJsonc(source, [{ path: ['compilerOptions', 'types'], value: types }]);
}
