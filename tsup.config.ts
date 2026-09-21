import { readFileSync } from 'node:fs';

import { defineConfig } from 'tsup';

const { version } = JSON.parse(readFileSync('./package.json', 'utf8')) as { version: string };

export default defineConfig({
  entry: { index: 'src/index.ts' },
  format: ['esm'],
  platform: 'node',
  target: 'node20.19',
  outDir: 'dist',
  clean: true,
  minify: false,
  sourcemap: false,
  dts: false,
  splitting: false,
  treeshake: true,
  noExternal: [/.*/],
  banner: {
    js: `#!/usr/bin/env node
import { createRequire as __createRequire } from 'node:module';
const require = __createRequire(import.meta.url);`,
  },
  define: { __CLI_VERSION__: JSON.stringify(version) },
});
