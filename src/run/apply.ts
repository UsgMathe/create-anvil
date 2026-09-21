import { join } from 'node:path';

import type { Plan } from '../plan/types.js';
import type { Io } from './io.js';

function toSystemPath(root: string, posixPath: string): string {
  return join(root, ...posixPath.split('/'));
}

export async function applyPlan(plan: Plan, root: string, io: Io): Promise<void> {
  for (const posixPath of plan.removals) {
    await io.remove(toSystemPath(root, posixPath));
  }

  for (const file of plan.files) {
    await io.writeFile(toSystemPath(root, file.path), file.contents);
  }
}
