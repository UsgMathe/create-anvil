import type { Feature } from '../plan/types.js';
import { entries } from './versions.js';

const CONTACT_FORM = `import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

const contactSchema = z.object({
  email: z.email('Informe um e-mail válido'),
});

type ContactValues = z.infer<typeof contactSchema>;

interface ContactFormProps {
  onSubmit: (values: ContactValues) => void;
}

export function ContactForm({ onSubmit }: ContactFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ContactValues>({ resolver: zodResolver(contactSchema) });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-2">
      <label htmlFor="email" className="font-medium">
        E-mail
      </label>
      <input id="email" type="text" {...register('email')} className="rounded border p-2" />
      {errors.email ? <p role="alert">{errors.email.message}</p> : null}
      <button type="submit" className="rounded bg-neutral-900 p-2 text-white">
        Enviar
      </button>
    </form>
  );
}
`;

const SHADCN_CONTACT_FORM = `import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';

const contactSchema = z.object({
  name: z.string().trim().min(2, 'Informe pelo menos 2 caracteres'),
  email: z.email('Informe um e-mail válido'),
});

type ContactValues = z.infer<typeof contactSchema>;

interface ContactFormProps {
  onSubmit: (values: ContactValues) => void;
}

export function ContactForm({ onSubmit }: ContactFormProps) {
  const form = useForm<ContactValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: { name: '', email: '' },
  });

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="w-full max-w-sm">
      <FieldGroup>
        <Controller
          name="name"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="contact-name">Nome</FieldLabel>
              <Input
                {...field}
                id="contact-name"
                autoComplete="name"
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Controller
          name="email"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="contact-email">E-mail</FieldLabel>
              <Input
                {...field}
                id="contact-email"
                type="email"
                autoComplete="email"
                aria-invalid={fieldState.invalid}
              />
              <FieldDescription>Usado só para responder a sua mensagem.</FieldDescription>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Field orientation="horizontal">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              form.reset();
            }}
          >
            Limpar
          </Button>
          <Button type="submit">Enviar</Button>
        </Field>
      </FieldGroup>
    </form>
  );
}
`;

export const forms: Feature = {
  id: 'forms',
  enabled: (selection) => selection.forms,
  dependencies: () => entries(['react-hook-form', 'zod', '@hookform/resolvers']),
  files: ({ selection }) => [
    {
      path: 'src/components/contact-form.tsx',
      contents: selection.shadcn ? SHADCN_CONTACT_FORM : CONTACT_FORM,
    },
  ],
};
