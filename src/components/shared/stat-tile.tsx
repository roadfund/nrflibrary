import { cn } from '@/lib/utils';

export function StatTile({
  label,
  value,
  hint,
  className,
}: {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('p-4', className)}>
      <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">{label}</p>
      <p className="text-foreground mt-1.5 font-serif text-2xl font-semibold">{value}</p>
      {hint ? <p className="text-muted-foreground mt-1 text-xs">{hint}</p> : null}
    </div>
  );
}

export function StatTileGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="divide-border border-border grid grid-cols-1 divide-y border sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-4">
      {children}
    </div>
  );
}
