import { describe, expect, it } from 'vitest';

import {
  commandsFor,
  createViteCommand,
  detectPackageManager,
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

  it('respeita o override explícito e rejeita desconhecidos', () => {
    expect(detectPackageManager('npm/11', 'pnpm').name).toBe('pnpm');
    expect(() => detectPackageManager('npm/11', 'deno')).toThrow(/desconhecido/);
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
