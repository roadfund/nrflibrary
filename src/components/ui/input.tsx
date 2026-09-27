'use client';

import * as React from 'react';
import { Input as InputPrimitive } from '@base-ui/react/input';
import { Eye, EyeOff, type LucideIcon } from 'lucide-react';

import { cn } from '@/lib/utils';

function Input({
  className,
  type,
  icon: Icon,
  ...props
}: React.ComponentProps<'input'> & { icon?: LucideIcon }) {
  const [visible, setVisible] = React.useState(false);
  const isPassword = type === 'password';

  const input = (
    <InputPrimitive
      type={isPassword ? (visible ? 'text' : 'password') : type}
      data-slot="input"
      className={cn(
        'border-input file:text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 disabled:bg-input/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 h-8 w-full min-w-0 rounded-lg border bg-transparent px-2.5 py-1 text-base transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-3 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:ring-3 md:text-sm',
        Icon && 'pl-8',
        isPassword && 'pr-8',
        className,
      )}
      {...props}
    />
  );

  if (!Icon && !isPassword) return input;

  return (
    <div className="relative">
      {Icon ? (
        <Icon className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
      ) : null}
      {input}
      {isPassword ? (
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setVisible((v) => !v)}
          className="text-muted-foreground hover:text-foreground absolute top-1/2 right-2.5 -translate-y-1/2"
        >
          {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          <span className="sr-only">{visible ? 'Hide password' : 'Show password'}</span>
        </button>
      ) : null}
    </div>
  );
}

export { Input };
