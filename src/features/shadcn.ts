import type { Feature, Selection } from '../plan/types.js';
import { SHADCN_THEME_CSS } from './shadcn-theme.js';
import { SHADCN_UI, type ShadcnComponent } from './shadcn-ui.js';
import { entries } from './versions.js';

const FORM_COMPONENTS: ShadcnComponent[] = ['button', 'input', 'label', 'separator', 'field'];

function componentsFor(selection: Selection): ShadcnComponent[] {
  return selection.forms ? FORM_COMPONENTS : [];
}

const COMPONENTS_JSON = `${JSON.stringify(
  {
    $schema: 'https://ui.shadcn.com/schema.json',
    style: 'new-york',
    rsc: false,
    tsx: true,
    tailwind: {
      config: '',
      css: 'src/index.css',
      baseColor: 'neutral',
      cssVariables: true,
      prefix: '',
    },
    iconLibrary: 'lucide',
    aliases: {
      components: '@/components',
      ui: '@/components/ui',
      lib: '@/lib',
      hooks: '@/hooks',
      utils: '@/lib/utils',
    },
  },
  null,
  2,
)}\n`;

const UTILS_TS = `export { cn } from 'cn';\n`;

const BASE_LAYER = `@layer base {
  * {
    @apply border-border outline-ring/50;
  }
  body {
    @apply bg-background text-foreground;
  }
}`;

export const shadcn: Feature = {
  id: 'shadcn',
  enabled: (selection) => selection.shadcn,
  dependencies: () => entries(['class-variance-authority', 'cn', 'lucide-react', 'radix-ui']),
  devDependencies: () => entries(['tw-animate-css', 'shadcn']),
  files: ({ selection }) => [
    { path: 'components.json', contents: COMPONENTS_JSON },
    { path: 'src/lib/utils.ts', contents: UTILS_TS },
    ...componentsFor(selection).map((name) => ({
      path: `src/components/ui/${name}.tsx`,
      contents: SHADCN_UI[name],
    })),
  ],
  cssBlocks: () => [
    { order: 10, content: '@import "tw-animate-css";' },
    { order: 20, content: '@import "shadcn/tailwind.css";' },
    { order: 30, content: SHADCN_THEME_CSS },
    { order: 40, content: BASE_LAYER },
  ],
};
