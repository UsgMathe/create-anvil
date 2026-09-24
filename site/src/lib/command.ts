import { OPTIONS, defaultsFor, forcedOff, type PresetName, type SelectionState } from './options';
import { createCommand, type PackageManager } from './package-managers';

export const PROJECT_NAME = 'meu-app';

function flagsFor(state: SelectionState, preset: PresetName | null): string[] {
  const defaults = defaultsFor(preset);
  const flags = preset ? [`--preset=${preset}`, '--yes'] : ['--yes'];

  for (const option of OPTIONS) {
    if (forcedOff(state, option)) continue;

    const value = state[option.key];
    if (value === defaults[option.key]) continue;

    if (option.kind === 'choice') flags.push(`--${option.flag}=${String(value)}`);
    else flags.push(value === true ? `--${option.flag}` : `--no-${option.flag}`);
  }

  return flags;
}

export function commandFlags(state: SelectionState): string[] {
  const plain = flagsFor(state, null);
  const fromFull = flagsFor(state, 'full');
  return fromFull.length < plain.length ? fromFull : plain;
}

export function buildCommand(state: SelectionState, packageManager: PackageManager): string {
  const separator = packageManager === 'npm' ? '--' : '';
  const parts = [createCommand(packageManager, PROJECT_NAME), separator, ...commandFlags(state)];
  return parts.filter(Boolean).join(' ');
}
