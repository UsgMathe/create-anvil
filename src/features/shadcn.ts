import type { Feature, Selection } from '../plan/types.js';
import { SHADCN_THEME_CSS } from './shadcn-theme.js';
import { SHADCN_UI, type ShadcnComponent } from './shadcn-ui.js';
import { entries } from './versions.js';

const FORM_COMPONENTS: ShadcnComponent[] = ['button', 'input', 'label', 'separator', 'field'];

function componentsFor(selection: Selection): ShadcnComponent[] {
  return selection.forms ? FORM_COMPONENTS : ['button'];
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

const THEME_TS = `import { createContext, useContext } from 'react';

export type Theme = 'light' | 'dark' | 'system';

export interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

export const ThemeContext = createContext<ThemeState | null>(null);

export function useTheme(): ThemeState {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme precisa estar dentro do <ThemeProvider>');
  return context;
}
`;

const THEME_PROVIDER_TSX = `import { type ReactNode, useEffect, useState } from 'react';

import { type Theme, ThemeContext } from '@/lib/theme';

const STORAGE_KEY = 'theme';

function storedTheme(): Theme {
  const value = localStorage.getItem(STORAGE_KEY);
  return value === 'light' || value === 'dark' ? value : 'system';
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(storedTheme);

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = () => {
      const dark = theme === 'dark' || (theme === 'system' && media.matches);
      document.documentElement.classList.toggle('dark', dark);
    };

    apply();
    media.addEventListener('change', apply);
    return () => {
      media.removeEventListener('change', apply);
    };
  }, [theme]);

  const changeTheme = (next: Theme) => {
    localStorage.setItem(STORAGE_KEY, next);
    setTheme(next);
  };

  return <ThemeContext value={{ theme, setTheme: changeTheme }}>{children}</ThemeContext>;
}
`;

const MODE_TOGGLE_TSX = `import { Monitor, Moon, Sun } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { type Theme, useTheme } from '@/lib/theme';

const NEXT_THEME: Record<Theme, Theme> = { light: 'dark', dark: 'system', system: 'light' };

const THEME_LABEL: Record<Theme, string> = {
  light: 'Tema claro',
  dark: 'Tema escuro',
  system: 'Tema do sistema',
};

export function ModeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      title={THEME_LABEL[theme]}
      aria-label={\`\${THEME_LABEL[theme]}. Clique para trocar.\`}
      onClick={() => {
        setTheme(NEXT_THEME[theme]);
      }}
    >
      {theme === 'light' && <Sun />}
      {theme === 'dark' && <Moon />}
      {theme === 'system' && <Monitor />}
    </Button>
  );
}
`;

export const shadcn: Feature = {
  id: 'shadcn',
  enabled: (selection) => selection.shadcn,
  dependencies: () => entries(['class-variance-authority', 'cn', 'lucide-react', 'radix-ui']),
  devDependencies: () => entries(['tw-animate-css', 'shadcn']),
  files: ({ selection }) => [
    { path: 'components.json', contents: COMPONENTS_JSON },
    { path: 'src/lib/utils.ts', contents: UTILS_TS },
    { path: 'src/lib/theme.ts', contents: THEME_TS },
    { path: 'src/components/theme-provider.tsx', contents: THEME_PROVIDER_TSX },
    { path: 'src/components/mode-toggle.tsx', contents: MODE_TOGGLE_TSX },
    ...componentsFor(selection).map((name) => ({
      path: `src/components/ui/${name}.tsx`,
      contents: SHADCN_UI[name],
    })),
  ],
  providers: () => [
    {
      order: 5,
      imports: [{ from: '@/components/theme-provider', named: ['ThemeProvider'] }],
      open: '<ThemeProvider>',
      close: '</ThemeProvider>',
    },
  ],
  cssBlocks: () => [
    { order: 10, content: '@import "tw-animate-css";' },
    { order: 20, content: '@import "shadcn/tailwind.css";' },
    { order: 30, content: SHADCN_THEME_CSS },
    { order: 40, content: BASE_LAYER },
  ],
};
