import type { CssContribution } from '../plan/types.js';

export function composeIndexCss(blocks: CssContribution[]): string {
  const sorted = [...blocks].sort((a, b) => a.order - b.order);
  const contents = sorted.map((block) => block.content.trim()).filter(Boolean);
  return `${contents.join('\n\n')}\n`;
}
