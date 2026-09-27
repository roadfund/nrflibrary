import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'bg-muted/40 flex flex-col items-center justify-center rounded-lg px-6 py-16 text-center',
        className,
      )}
    >
      {Icon ? (
        <span className="bg-accent mb-4 flex size-12 items-center justify-center rounded-full">
          <Icon className="text-primary size-5" aria-hidden />
        </span>
      ) : null}
      <p className="text-foreground font-serif text-base font-semibold">{title}</p>
      {description ? (
        <p className="text-muted-foreground mt-1.5 max-w-sm text-sm">{description}</p>
      ) : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
