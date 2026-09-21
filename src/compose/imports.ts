import type { ImportSpec } from '../plan/types.js';

export function renderImports(specs: ImportSpec[]): string {
  const merged = new Map<string, { named: Set<string>; default?: string; sideEffect: boolean }>();

  for (const spec of specs) {
    const existing = merged.get(spec.from) ?? { named: new Set<string>(), sideEffect: false };
    for (const name of spec.named ?? []) existing.named.add(name);
    if (spec.default) existing.default = spec.default;
    if (spec.sideEffect) existing.sideEffect = true;
    merged.set(spec.from, existing);
  }

  const lines: string[] = [];
  for (const [from, entry] of merged) {
    const named = [...entry.named].sort((a, b) => a.localeCompare(b));
    if (!entry.default && named.length === 0) {
      lines.push(`import '${from}';`);
      continue;
    }
    const clauses: string[] = [];
    if (entry.default) clauses.push(entry.default);
    if (named.length > 0) clauses.push(`{ ${named.join(', ')} }`);
    lines.push(`import ${clauses.join(', ')} from '${from}';`);
  }

  return lines.join('\n');
}
