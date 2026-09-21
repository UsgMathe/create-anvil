import type { Feature } from '../plan/types.js';
import { app } from './app.js';
import { base } from './base.js';
import { forms } from './forms.js';
import { githubActions } from './gh-actions.js';
import { husky } from './husky.js';
import { lintBiome } from './lint-biome.js';
import { lintEslint } from './lint-eslint.js';
import { lintOxlint } from './lint-oxlint.js';
import { prettier } from './prettier.js';
import { query } from './query.js';
import { routerReactRouter } from './router-react-router.js';
import { routerTanstack } from './router-tanstack.js';
import { shadcn } from './shadcn.js';
import { tailwind } from './tailwind.js';
import { testing } from './testing.js';
import { zustand } from './zustand.js';

export const FEATURES: readonly Feature[] = [
  base,
  app,
  tailwind,
  shadcn,
  routerReactRouter,
  routerTanstack,
  query,
  lintOxlint,
  lintEslint,
  lintBiome,
  prettier,
  testing,
  zustand,
  forms,
  husky,
  githubActions,
];
