import manifest from '../data/options.json';

export interface OptionGroup {
  id: string;
  label: string;
  advanced?: boolean;
}

export interface OptionChoice {
  value: string;
  label: string;
  hint: string;
}

interface OptionBase {
  key: string;
  flag: string;
  label: string;
  hint: string;
  group: string;
  presetAware: boolean;
}

export interface ChoiceOption extends OptionBase {
  kind: 'choice';
  default: string;
  choices: OptionChoice[];
}

export interface BooleanOption extends OptionBase {
  kind: 'boolean';
  default: boolean;
  requires?: string;
  forcedOffWhen?: { key: string; value: string };
}

export type Option = ChoiceOption | BooleanOption;

export type PresetName = 'minimal' | 'full';
export type OptionValue = string | boolean;
export type SelectionState = Record<string, OptionValue>;

const data = manifest as unknown as {
  groups: OptionGroup[];
  options: Option[];
  presets: Record<PresetName, Record<string, OptionValue>>;
};

export const OPTION_GROUPS = data.groups;
export const OPTIONS = data.options;
export const PRESETS = data.presets;
export const PRESET_NAMES: PresetName[] = ['minimal', 'full'];

export function optionsOfGroup(groupId: string): Option[] {
  return OPTIONS.filter((option) => option.group === groupId);
}

export function defaultsFor(preset: PresetName | null): SelectionState {
  const base = preset ? PRESETS[preset] : null;
  const state: SelectionState = {};

  for (const option of OPTIONS) {
    state[option.key] =
      option.presetAware && base ? (base[option.key] ?? option.default) : option.default;
  }

  return state;
}

export function matchesPreset(state: SelectionState, preset: PresetName): boolean {
  const target = defaultsFor(preset);
  return OPTIONS.every((option) => state[option.key] === target[option.key]);
}

export function forcedOff(state: SelectionState, option: Option): boolean {
  return (
    option.kind === 'boolean' &&
    option.forcedOffWhen !== undefined &&
    state[option.forcedOffWhen.key] === option.forcedOffWhen.value
  );
}

export function forcingLabel(option: BooleanOption): string {
  const rule = option.forcedOffWhen;
  if (!rule) return '';
  const owner = OPTIONS.find((entry) => entry.key === rule.key);
  if (owner?.kind !== 'choice') return '';
  return owner.choices.find((entry) => entry.value === rule.value)?.label ?? '';
}

export function effectiveState(state: SelectionState): SelectionState {
  const next = { ...state };
  for (const option of OPTIONS) {
    if (forcedOff(state, option)) next[option.key] = false;
  }
  return next;
}

function enableRequirements(state: SelectionState, key: string): void {
  const option = OPTIONS.find((entry) => entry.key === key);
  if (option?.kind !== 'boolean' || !option.requires) return;
  if (state[option.requires] === true) return;
  state[option.requires] = true;
  enableRequirements(state, option.requires);
}

function disableDependents(state: SelectionState, key: string): void {
  for (const option of OPTIONS) {
    if (option.kind !== 'boolean' || option.requires !== key) continue;
    if (state[option.key] === false) continue;
    state[option.key] = false;
    disableDependents(state, option.key);
  }
}

export function setOption(state: SelectionState, key: string, value: OptionValue): SelectionState {
  const next = { ...state, [key]: value };
  if (value === true) enableRequirements(next, key);
  if (value === false) disableDependents(next, key);
  return next;
}
