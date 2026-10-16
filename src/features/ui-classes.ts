import type { Selection } from '../plan/types.js';

export interface UiClasses {
  muted: string;
  code: string;
  error: string;
}

export function uiClasses(selection: Selection): UiClasses {
  return selection.shadcn
    ? {
        muted: 'text-muted-foreground',
        code: 'rounded bg-muted px-1 py-0.5',
        error: 'text-destructive',
      }
    : {
        muted: 'text-neutral-500',
        code: 'rounded bg-neutral-100 px-1 py-0.5',
        error: 'text-red-600',
      };
}
