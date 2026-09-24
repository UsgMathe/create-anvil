import { cn } from 'cn';
import { ChevronRight } from 'lucide-react';
import { useState } from 'react';

import { CommandBlock } from '@/components/command-block';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { buildCommand } from '@/lib/command';
import {
  OPTION_GROUPS,
  PRESET_NAMES,
  defaultsFor,
  effectiveState,
  forcedOff,
  forcingLabel,
  matchesPreset,
  optionsOfGroup,
  setOption,
  type BooleanOption,
  type ChoiceOption,
  type Option,
  type OptionGroup,
  type OptionValue,
  type SelectionState,
} from '@/lib/options';
import type { PackageManager } from '@/lib/package-managers';

const ROW = 'grid gap-x-8 gap-y-3 border-t py-6 sm:grid-cols-[9rem_minmax(0,1fr)]';
const ROW_TITLE = 'text-sm font-semibold sm:pt-2';

type ChangeHandler = (key: string, value: OptionValue) => void;

function ChoiceControl({
  option,
  value,
  onChange,
}: {
  option: ChoiceOption;
  value: string;
  onChange: (next: string) => void;
}) {
  const active = option.choices.find((choice) => choice.value === value);

  return (
    <div>
      <ToggleGroup
        type="single"
        variant="outline"
        value={value}
        onValueChange={(next) => {
          if (next) onChange(next);
        }}
        className="w-full items-stretch"
        aria-label={option.label}
      >
        {option.choices.map((choice) => (
          <ToggleGroupItem
            key={choice.value}
            value={choice.value}
            className="h-auto min-h-9 flex-1 shrink px-2 py-1.5 text-xs leading-tight whitespace-normal sm:text-sm"
          >
            {choice.label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
      <p className="mt-2 text-sm text-muted-foreground">{active?.hint}</p>
    </div>
  );
}

function SwitchRow({
  option,
  checked,
  disabled,
  onChange,
}: {
  option: BooleanOption;
  checked: boolean;
  disabled: boolean;
  onChange: (next: boolean) => void;
}) {
  const id = `option-${option.key}`;
  const description = disabled
    ? `Desligado enquanto o ${forcingLabel(option)} estiver selecionado.`
    : option.hint;

  return (
    <label
      htmlFor={id}
      className={cn(
        '-mx-3 flex items-start gap-4 rounded-lg px-3 py-2.5 transition-colors',
        disabled ? 'cursor-not-allowed' : 'cursor-pointer hover:bg-muted/50',
      )}
    >
      <span className="min-w-0 flex-1">
        <span id={`${id}-label`} className="block text-sm font-medium">
          {option.label}
        </span>
        <span id={`${id}-hint`} className="mt-0.5 block text-sm text-muted-foreground">
          {description}
        </span>
      </span>
      <Switch
        id={id}
        aria-labelledby={`${id}-label`}
        aria-describedby={`${id}-hint`}
        checked={checked}
        disabled={disabled}
        onCheckedChange={onChange}
        className="mt-0.5"
      />
    </label>
  );
}

function GroupControls({
  options,
  state,
  effective,
  onChange,
}: {
  options: Option[];
  state: SelectionState;
  effective: SelectionState;
  onChange: ChangeHandler;
}) {
  const choices = options.filter((option): option is ChoiceOption => option.kind === 'choice');
  const switches = options.filter((option): option is BooleanOption => option.kind === 'boolean');

  return (
    <div className="min-w-0">
      {choices.map((option) => (
        <ChoiceControl
          key={option.key}
          option={option}
          value={String(state[option.key])}
          onChange={(next) => {
            onChange(option.key, next);
          }}
        />
      ))}

      {switches.length > 0 && (
        <div className={choices.length > 0 ? 'mt-3' : undefined}>
          {switches.map((option) => (
            <SwitchRow
              key={option.key}
              option={option}
              checked={effective[option.key] === true}
              disabled={forcedOff(state, option)}
              onChange={(next) => {
                onChange(option.key, next);
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function GroupRow({
  group,
  state,
  effective,
  onChange,
}: {
  group: OptionGroup;
  state: SelectionState;
  effective: SelectionState;
  onChange: ChangeHandler;
}) {
  return (
    <div className={ROW}>
      <h3 className={ROW_TITLE}>{group.label}</h3>
      <GroupControls
        options={optionsOfGroup(group.id)}
        state={state}
        effective={effective}
        onChange={onChange}
      />
    </div>
  );
}

function AdvancedGroup({
  group,
  state,
  effective,
  onChange,
}: {
  group: OptionGroup;
  state: SelectionState;
  effective: SelectionState;
  onChange: ChangeHandler;
}) {
  const options = optionsOfGroup(group.id);
  const changed = options.some((option) => state[option.key] !== option.default);

  return (
    <details className="group/advanced border-t py-6">
      <summary
        aria-label={changed ? `${group.label}, alterado` : group.label}
        className="-mx-2 cursor-pointer list-none rounded-md px-2 py-1 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 [&::-webkit-details-marker]:hidden"
      >
        <span className="grid items-center gap-x-8 sm:grid-cols-[9rem_minmax(0,1fr)]">
          <span className="flex items-center gap-1.5 text-sm font-semibold">
            <ChevronRight
              aria-hidden="true"
              className="-ml-1 size-4 text-muted-foreground transition-transform group-open/advanced:rotate-90"
            />
            {group.label}
            {changed && <span aria-hidden="true" className="size-1.5 rounded-full bg-primary" />}
          </span>
          <span className="hidden truncate text-sm text-muted-foreground group-open/advanced:invisible sm:block">
            {options.map((option) => option.label).join(' · ')}
          </span>
        </span>
      </summary>

      <div className="mt-3 sm:pl-[11rem]">
        <GroupControls options={options} state={state} effective={effective} onChange={onChange} />
      </div>
    </details>
  );
}

export function PresetBuilder({
  packageManager,
  onSelectPackageManager,
}: {
  packageManager: PackageManager;
  onSelectPackageManager: (value: PackageManager) => void;
}) {
  const [state, setState] = useState<SelectionState>(() => defaultsFor(null));
  const effective = effectiveState(state);
  const customized = !PRESET_NAMES.some((name) => matchesPreset(state, name));

  const change: ChangeHandler = (key, value) => {
    setState((current) => setOption(current, key, value));
  };

  return (
    <section id="monte-o-seu-comando" className="mt-28 scroll-mt-24">
      <h2 className="text-2xl font-semibold tracking-tight">Monte o seu comando</h2>
      <p className="mt-4 max-w-xl leading-relaxed text-muted-foreground">
        Escolha a stack aqui e copie o comando pronto. Com as flags na linha, o CLI não faz nenhuma
        pergunta — dá para usar em script e em CI.
      </p>

      <div className="mt-10 max-w-3xl">
        <div className="border-b">
          <div className={ROW}>
            <h3 className={cn(ROW_TITLE, 'sm:pt-1.5')}>Ponto de partida</h3>
            <div className="flex flex-wrap items-center gap-2">
              {PRESET_NAMES.map((name) => (
                <Button
                  key={name}
                  size="sm"
                  variant={matchesPreset(state, name) ? 'default' : 'outline'}
                  aria-pressed={matchesPreset(state, name)}
                  onClick={() => {
                    setState(defaultsFor(name));
                  }}
                  className="font-mono"
                >
                  {name}
                </Button>
              ))}
              {customized && (
                <span className="ml-1 text-sm text-muted-foreground">personalizado</span>
              )}
            </div>
          </div>

          {OPTION_GROUPS.map((group) =>
            group.advanced ? (
              <AdvancedGroup
                key={group.id}
                group={group}
                state={state}
                effective={effective}
                onChange={change}
              />
            ) : (
              <GroupRow
                key={group.id}
                group={group}
                state={state}
                effective={effective}
                onChange={change}
              />
            ),
          )}
        </div>

        <div className="sticky bottom-[max(1rem,env(safe-area-inset-bottom))] z-10 mt-8">
          <CommandBlock
            packageManager={packageManager}
            onSelect={onSelectPackageManager}
            commandFor={(manager) => buildCommand(state, manager)}
            className="shadow-lg"
          />
        </div>
      </div>
    </section>
  );
}
