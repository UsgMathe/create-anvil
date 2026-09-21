import validateNpmPackageName from 'validate-npm-package-name';

export interface ValidProjectName {
  ok: true;
  packageName: string;
  directoryName: string;
}

export interface InvalidProjectName {
  ok: false;
  problems: string[];
}

export type ProjectNameResult = ValidProjectName | InvalidProjectName;

const BACKSLASH = String.fromCharCode(92);

const WINDOWS_RESERVED = new Set([
  'con',
  'prn',
  'aux',
  'nul',
  ...Array.from({ length: 9 }, (_, index) => `com${index + 1}`),
  ...Array.from({ length: 9 }, (_, index) => `lpt${index + 1}`),
]);

function directoryNameFor(packageName: string): string {
  if (!packageName.startsWith('@')) return packageName;
  const slash = packageName.indexOf('/');
  return slash === -1 ? packageName : packageName.slice(slash + 1);
}

export function validateProjectName(raw: string | undefined): ProjectNameResult {
  const problems: string[] = [];
  const input = (raw ?? '').trim();

  if (input.length === 0) {
    return { ok: false, problems: ['Informe o nome do projeto.'] };
  }

  if (input.includes('/') && !input.startsWith('@')) {
    problems.push('O nome não pode conter barra.');
  }
  if (input.includes(BACKSLASH)) {
    problems.push('O nome não pode conter barra invertida.');
  }
  if (input === '.' || input === '..' || input.startsWith('../')) {
    problems.push('O nome não pode ser um caminho relativo.');
  }

  const unscoped = input.startsWith('@') ? input.slice(input.indexOf('/') + 1) : input;
  if (/^[-_]/.test(unscoped)) {
    problems.push('O nome não pode começar com hífen ou underscore.');
  }

  const npmCheck = validateNpmPackageName(input);
  if (!npmCheck.validForNewPackages) {
    for (const message of npmCheck.errors ?? []) problems.push(message);
    for (const message of npmCheck.warnings ?? []) problems.push(message);
  }

  const directoryName = directoryNameFor(input);

  if (WINDOWS_RESERVED.has(directoryName.toLowerCase())) {
    problems.push(`"${directoryName}" é um nome reservado no Windows.`);
  }
  if (/[. ]$/.test(directoryName)) {
    problems.push('O nome não pode terminar com ponto ou espaço.');
  }
  if (directoryName.length === 0) {
    problems.push('O nome do diretório ficou vazio.');
  }

  if (problems.length > 0) {
    return { ok: false, problems: [...new Set(problems)] };
  }

  return { ok: true, packageName: input, directoryName };
}
