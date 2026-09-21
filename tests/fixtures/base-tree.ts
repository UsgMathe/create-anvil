import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { BaseTree } from '../../src/plan/types.js';
import { toPosix } from '../../src/run/io.js';

const FIXTURE_ROOT = fileURLToPath(new URL('./create-vite@9.2.1', import.meta.url));

const RENAMES: Record<string, string> = {
  _gitignore: '.gitignore',
  '_oxlintrc.json': '.oxlintrc.json',
};

const BINARY_EXTENSIONS = ['.png', '.jpg', '.ico'];

function walk(directory: string, out: string[]): string[] {
  for (const entry of readdirSync(directory)) {
    const full = join(directory, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

export function loadBaseTree(): BaseTree {
  const tree: BaseTree = {};
  for (const absolute of walk(FIXTURE_ROOT, [])) {
    const posixPath = toPosix(relative(FIXTURE_ROOT, absolute));
    const segments = posixPath.split('/');
    const name = segments.at(-1) ?? '';
    const renamed = RENAMES[name];
    const finalPath = renamed ? [...segments.slice(0, -1), renamed].join('/') : posixPath;
    tree[finalPath] = BINARY_EXTENSIONS.some((extension) => name.endsWith(extension))
      ? '<binary>'
      : readFileSync(absolute, 'utf8');
  }
  return tree;
}
