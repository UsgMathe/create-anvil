import { execa } from 'execa';
import { mkdir, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises';
import { dirname, join, relative, resolve, sep } from 'node:path';

import type { BaseTree } from '../plan/types.js';

export function toPosix(systemPath: string): string {
  return systemPath.split(sep).join('/');
}

export interface CommandResult {
  exitCode: number;
}

export interface Io {
  run(command: string, args: string[], options: { cwd?: string }): Promise<CommandResult>;
  exists(path: string): Promise<boolean>;
  writeFile(path: string, contents: string): Promise<void>;
  remove(path: string): Promise<void>;
  readTree(root: string): Promise<BaseTree>;
}

const BINARY_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.ico', '.woff', '.woff2'];

async function walk(directory: string, out: string[]): Promise<string[]> {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === '.git') continue;
    const full = join(directory, entry.name);
    if (entry.isDirectory()) await walk(full, out);
    else out.push(full);
  }
  return out;
}

export function createIo(): Io {
  return {
    async run(command, args, options) {
      const result = await execa(command, args, {
        cwd: options.cwd,
        stdio: ['ignore', 'inherit', 'inherit'],
        reject: true,
      });
      return { exitCode: result.exitCode ?? 0 };
    },
    async exists(path) {
      try {
        await stat(path);
        return true;
      } catch {
        return false;
      }
    },
    async writeFile(path, contents) {
      await mkdir(dirname(path), { recursive: true });
      await writeFile(path, contents, 'utf8');
    },
    async remove(path) {
      await rm(path, { recursive: true, force: true });
    },
    async readTree(root) {
      const tree: BaseTree = {};
      for (const absolute of await walk(resolve(root), [])) {
        const posixPath = toPosix(relative(root, absolute));
        if (BINARY_EXTENSIONS.some((extension) => posixPath.endsWith(extension))) continue;
        tree[posixPath] = await readFile(absolute, 'utf8');
      }
      return tree;
    },
  };
}
