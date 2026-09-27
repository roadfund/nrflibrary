import { Skeleton } from '@/components/ui/skeleton';

export default function PublicationLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <Skeleton className="h-4 w-72" />
      <div className="mt-6 grid grid-cols-1 gap-10 lg:grid-cols-[1fr_320px]">
        <div>
          <div className="flex gap-2">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-5 w-28" />
          </div>
          <Skeleton className="mt-3 h-9 w-3/4" />
          <Skeleton className="mt-3 h-4 w-full max-w-xl" />
          <Skeleton className="mt-1 h-4 w-2/3 max-w-lg" />
          <div className="border-border mt-8 flex flex-col gap-3 border-t pt-8">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </div>
        <Skeleton className="h-40 w-full" />
      </div>
    </div>
  );
}
