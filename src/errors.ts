export class CliError extends Error {
  readonly exitCode: number;

  constructor(message: string, options: { exitCode?: number; cause?: unknown } = {}) {
    super(message, { cause: options.cause });
    this.name = 'CliError';
    this.exitCode = options.exitCode ?? 1;
  }
}

export class PromptCancelledError extends CliError {
  constructor() {
    super('Operação cancelada.', { exitCode: 130 });
    this.name = 'PromptCancelledError';
  }
}

export class FeatureConflictError extends CliError {
  constructor(message: string) {
    super(message);
    this.name = 'FeatureConflictError';
  }
}
