import { Skeleton } from '@/components/ui/skeleton';

export default function CatalogueLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="mt-3 h-4 w-96 max-w-full" />
      <div className="border-border mt-8 border-b pb-4">
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="mt-6 flex flex-col gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="border-border flex items-center justify-between border-b py-4">
            <div className="flex-1">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="mt-2 h-5 w-3/4 max-w-md" />
              <Skeleton className="mt-2 h-4 w-1/2 max-w-sm" />
            </div>
            <Skeleton className="h-4 w-20 shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}
