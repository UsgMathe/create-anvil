import type { Feature } from '../plan/types.js';

export const REMOVED_BY_BASE = [
  'public/icons.svg',
  'src/App.tsx',
  'src/App.css',
  'src/assets/hero.png',
  'src/assets/react.svg',
  'src/assets/vite.svg',
];

const GITATTRIBUTES = `* text=auto eol=lf
`;

const EDITORCONFIG = `root = true

[*]
charset = utf-8
end_of_line = lf
indent_style = space
indent_size = 2
insert_final_newline = true
trim_trailing_whitespace = true

[*.md]
trim_trailing_whitespace = false
`;

export const base: Feature = {
  id: 'base',
  enabled: () => true,
  removeFiles: () => REMOVED_BY_BASE,
  files: () => [
    { path: '.gitattributes', contents: GITATTRIBUTES },
    { path: '.editorconfig', contents: EDITORCONFIG },
  ],
  scripts: () => ({ dev: 'vite --host', preview: 'vite preview --host', typecheck: 'tsc -b' }),
  vitePlugins: () => [
    {
      order: 30,
      imports: [{ from: '@vitejs/plugin-react', default: 'react' }],
      expression: 'react()',
    },
  ],
  gitignore: () => ['*.env', '*.local'],
};
