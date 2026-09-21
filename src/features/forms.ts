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

export const forms: Feature = {
  id: 'forms',
  enabled: (selection) => selection.forms,
  dependencies: () => entries(['react-hook-form', 'zod', '@hookform/resolvers']),
  files: () => [{ path: 'src/components/contact-form.tsx', contents: CONTACT_FORM }],
};
