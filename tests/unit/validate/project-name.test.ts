import { describe, expect, it } from 'vitest';

import { validateProjectName } from '../../../src/validate/project-name.js';

describe('validateProjectName', () => {
  it.each([
    ['my-app', 'my-app'],
    ['my_app', 'my_app'],
    ['a', 'a'],
    ['@usgmathe/my-app', 'my-app'],
  ])('aceita %s', (input, expectedDirectory) => {
    const result = validateProjectName(input);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.directoryName).toBe(expectedDirectory);
  });

  it.each([
    ['-app', 'hífen inicial'],
    ['_app', 'underscore inicial'],
    ['MyApp', 'maiúsculas'],
    ['..', 'caminho relativo'],
    ['../evil', 'traversal'],
    ['a/b', 'barra'],
    ['con', 'nome reservado do Windows'],
    ['my-app.', 'ponto final'],
    ['node_modules', 'nome bloqueado pelo npm'],
    ['excited!', 'caractere inválido'],
    ['my app', 'espaço'],
    ['', 'vazio'],
    ['a'.repeat(215), 'comprimento máximo'],
  ])('rejeita %s (%s)', (input) => {
    expect(validateProjectName(input).ok).toBe(false);
  });
});
