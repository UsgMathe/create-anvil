import { describe, expect, it } from 'vitest';

import {
  commandsFor,
  createViteCommand,
  detectPackageManager,
  packageManagerField,
} from '../../../src/env/package-manager.js';

describe('detectPackageManager', () => {
  it.each([
    ['npm/11.16.0 node/v24.12.0 win32 x64 workspaces/false', 'npm', '11.16.0'],
    ['pnpm/10.32.1 npm/? node/v24.12.0 win32 x64', 'pnpm', '10.32.1'],
    ['yarn/4.5.0 npm/? node/v22.4.0 linux x64', 'yarn', '4.5.0'],
    ['bun/1.2.0 npm/? node/v22.6.0 darwin arm64', 'bun', '1.2.0'],
  ])('lê %s', (userAgent, expectedName, expectedVersion) => {
    const detected = detectPackageManager(userAgent);
    expect(detected.name).toBe(expectedName);
    expect(detected.version).toBe(expectedVersion);
  });

  it('não confunde um user-agent do npm que mencione pnpm depois', () => {
    expect(detectPackageManager('npm/11 node/v24 win32 x64 pnpm/na').name).toBe('npm');
  });

  it('cai para npm quando o user-agent está ausente', () => {
    expect(detectPackageManager(undefined).name).toBe('npm');
    expect(detectPackageManager('').name).toBe('npm');
  });

  it('respeita o override explícito', () => {
    expect(detectPackageManager('npm/11', 'pnpm').name).toBe('pnpm');
  });
});

describe('packageManagerField', () => {
  it('só fixa o gerenciador quando a versão é conhecida e não é npm', () => {
    expect(packageManagerField('pnpm', '10.32.1')).toBe('pnpm@10.32.1');
    expect(packageManagerField('pnpm', undefined)).toBeUndefined();
    expect(packageManagerField('pnpm', '?')).toBeUndefined();
    expect(packageManagerField('npm', '11.0.0')).toBeUndefined();
  });
});

describe('createViteCommand', () => {
  it('nunca passa flags que o create-vite 9 não conhece', () => {
    for (const name of ['npm', 'pnpm', 'yarn', 'bun'] as const) {
      const { args } = createViteCommand(commandsFor(name), 'my-app');
      expect(args).toContain('--no-interactive');
      expect(args).toContain('--template');
      expect(args).toContain('react-ts');
      expect(args).not.toContain('--no-rolldown');
    }
  });
});

describe('commandsFor', () => {
  it.each([
    ['npm', 'npm run dev', 'npm ci', 'npx lint-staged'],
    ['pnpm', 'pnpm dev', 'pnpm install --frozen-lockfile', 'pnpm exec lint-staged'],
    ['yarn', 'yarn dev', 'yarn install --frozen-lockfile', 'yarn lint-staged'],
    ['bun', 'bun run dev', 'bun install --frozen-lockfile', 'bunx lint-staged'],
  ] as const)('monta os comandos do %s', (name, run, frozen, exec) => {
    const pm = commandsFor(name);
    expect(pm.runScript('dev')).toBe(run);
    expect(pm.installFrozen).toBe(frozen);
    expect(pm.exec('lint-staged')).toBe(exec);
  });

  it('usa a flag do Yarn Berry só quando a versão confirma o major 2+', () => {
    expect(commandsFor('yarn', '4.5.0').installFrozen).toBe('yarn install --immutable');
    expect(commandsFor('yarn', '1.22.22').installFrozen).toBe('yarn install --frozen-lockfile');
  });

  it('nunca chama o bun sem "run", que trocaria o script pelo comando nativo', () => {
    expect(commandsFor('bun').runScript('test')).toBe('bun run test');
    expect(commandsFor('bun').runScript('build')).toBe('bun run build');
  });
});
