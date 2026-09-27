import { cn } from '@/lib/utils';

export interface MetadataItem {
  label: string;
  value: React.ReactNode;
}

export function MetadataList({
  items,
  columns = 2,
  className,
}: {
  items: MetadataItem[];
  columns?: 1 | 2 | 3;
  className?: string;
}) {
  return (
    <dl
      className={cn(
        'grid grid-cols-1 gap-x-8 gap-y-4 text-sm',
        columns === 2 && 'sm:grid-cols-2',
        columns === 3 && 'sm:grid-cols-3',
        className,
      )}
    >
      {items.map((item) => (
        <div
          key={item.label}
          className="border-border border-t pt-3 first:border-t-0 first:pt-0 sm:border-t sm:pt-3"
        >
          <dt className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
            {item.label}
          </dt>
          <dd className="text-foreground mt-1">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}
