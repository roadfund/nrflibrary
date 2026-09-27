import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[220px_1fr]">
        <div className="flex flex-col gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-full" />
          ))}
        </div>
        <div>
          <Skeleton className="h-8 w-64" />
          <div className="divide-border border-border mt-6 grid grid-cols-1 divide-y border sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="p-4">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="mt-2 h-7 w-16" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
