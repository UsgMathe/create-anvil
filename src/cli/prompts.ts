import { confirm, isCancel, select, text } from '@clack/prompts';

import { PromptCancelledError } from '../errors.js';

export interface Prompter {
  text(options: {
    message: string;
    validate?: (value: string) => string | undefined;
  }): Promise<string>;
  confirm(options: { message: string; initial: boolean }): Promise<boolean>;
  select<T extends string>(options: {
    message: string;
    initial: T;
    choices: { value: T; label: string; hint?: string }[];
  }): Promise<T>;
}

function unwrap<T>(value: T | symbol): T {
  if (isCancel(value)) throw new PromptCancelledError();
  return value;
}

export const clackPrompter: Prompter = {
  async text(options) {
    return unwrap(await text({ message: options.message, validate: options.validate }));
  },
  async confirm(options) {
    return unwrap(await confirm({ message: options.message, initialValue: options.initial }));
  },
  async select<T extends string>(options: {
    message: string;
    initial: T;
    choices: { value: T; label: string; hint?: string }[];
  }): Promise<T> {
    const choices: { value: string; label: string; hint?: string }[] = options.choices;
    const value = await select({
      message: options.message,
      initialValue: options.initial,
      options: choices,
    });
    return unwrap(value) as T;
  },
};
