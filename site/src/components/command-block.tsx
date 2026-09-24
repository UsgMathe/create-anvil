import { cn } from 'cn';
import { Check, Copy, SquareTerminal } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PACKAGE_MANAGERS, type PackageManager } from '@/lib/package-managers';

export function CommandBlock({
  packageManager,
  onSelect,
  commandFor,
  className,
}: {
  packageManager: PackageManager;
  onSelect: (value: PackageManager) => void;
  commandFor: (packageManager: PackageManager) => string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);
  const command = commandFor(packageManager);

  async function copy() {
    await navigator.clipboard.writeText(command);
    setCopied(true);
    window.setTimeout(() => {
      setCopied(false);
    }, 2000);
  }

  return (
    <Tabs
      value={packageManager}
      onValueChange={(value) => {
        onSelect(value as PackageManager);
      }}
      className={cn('gap-0 overflow-hidden rounded-xl glass shadow-sm', className)}
    >
      <div className="flex items-center gap-1 border-b px-2 py-1">
        <SquareTerminal className="mx-1.5 size-4 shrink-0 text-muted-foreground" />
        <TabsList className="bg-transparent p-0">
          {PACKAGE_MANAGERS.map((name) => (
            <TabsTrigger
              key={name}
              value={name}
              className="px-3 font-mono text-xs text-muted-foreground"
            >
              {name}
            </TabsTrigger>
          ))}
        </TabsList>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => void copy()}
          aria-label="Copiar o comando"
          title="Copiar o comando"
          className="ml-auto"
        >
          {copied ? <Check className="size-4 text-primary" /> : <Copy className="size-4" />}
        </Button>
        <output className="sr-only">{copied ? 'Comando copiado' : ''}</output>
      </div>

      {PACKAGE_MANAGERS.map((name) => (
        <TabsContent key={name} value={name} className="px-4 py-3.5">
          <code className="block font-mono text-sm leading-6 break-words whitespace-pre-wrap">
            <span className="text-primary select-none">$ </span>
            {commandFor(name)}
          </code>
        </TabsContent>
      ))}
    </Tabs>
  );
}
