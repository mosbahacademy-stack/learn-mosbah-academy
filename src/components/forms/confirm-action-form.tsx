'use client';

import type { ReactNode } from 'react';

import { Button } from '@/components/ui/button';

export function ConfirmActionForm({
  action,
  fields,
  confirmMessage,
  label,
  className,
  variant = 'ghost'
}: {
  action: (formData: FormData) => void | Promise<void>;
  fields: Array<{ name: string; value: string }>;
  confirmMessage: string;
  label: ReactNode;
  className?: string;
  variant?: 'default' | 'secondary' | 'outline' | 'ghost';
}) {
  return (
    <form
      action={action}
      onSubmit={(event) => {
        if (!window.confirm(confirmMessage)) {
          event.preventDefault();
        }
      }}
    >
      {fields.map((field) => (
        <input key={field.name} type="hidden" name={field.name} value={field.value} />
      ))}
      <Button type="submit" variant={variant} className={className}>
        {label}
      </Button>
    </form>
  );
}