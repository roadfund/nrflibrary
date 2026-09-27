import type { Metadata } from 'next';
import { Suspense } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/shared/page-header';
import { PublicationRow } from '@/components/publication/publication-row';
import { EmptyState } from '@/components/shared/empty-state';
import { CatalogueFilters } from '@/components/catalogue/catalogue-filters';
import { CataloguePagination } from '@/components/catalogue/catalogue-pagination';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { SearchX } from 'lucide-react';
import {
  getPublications,
  type CatalogueFilters as Filters,
  type CatalogueSort,
} from '@/lib/mock-data/queries';
import { CATEGORIES } from '@/lib/mock-data/content';
import type { AccessLevel, ContentType, FileFormat } from '@/lib/types';

export const metadata: Metadata = {
  title: 'Browse catalogue',
  description: 'Search Road Fund datasets, reports, and research publications.',
};

function parseFilters(params: Record<string, string | string[] | undefined>): Filters {
  const toArray = (value: string | string[] | undefined) =>
    value === undefined ? [] : Array.isArray(value) ? value : [value];

  return {
    q: typeof params.q === 'string' && params.q.length > 0 ? params.q : undefined,
    contentType: toArray(params.contentType) as ContentType[],
    category: toArray(params.category),
    accessLevel: toArray(params.accessLevel) as AccessLevel[],
    fileFormat: toArray(params.fileFormat) as FileFormat[],
    geographicCoverage:
      typeof params.geographicCoverage === 'string' && params.geographicCoverage.length > 0
        ? params.geographicCoverage
        : undefined,
    dateFrom:
      typeof params.dateFrom === 'string' && params.dateFrom.length > 0
        ? params.dateFrom
        : undefined,
    dateTo:
      typeof params.dateTo === 'string' && params.dateTo.length > 0 ? params.dateTo : undefined,
    sort: (typeof params.sort === 'string' ? params.sort : 'newest') as CatalogueSort,
    page: typeof params.page === 'string' ? Number(params.page) || 1 : 1,
  };
}

export default async function CataloguePage({ searchParams }: PageProps<'/catalogue'>) {
  const resolvedParams = await searchParams;
  const filters = parseFilters(resolvedParams);
  const result = await getPublications(filters);

  const urlSearchParams = new URLSearchParams();
  Object.entries(resolvedParams).forEach(([key, value]) => {
    if (value === undefined) return;
    if (Array.isArray(value)) value.forEach((v) => urlSearchParams.append(key, v));
    else urlSearchParams.append(key, value);
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <PageHeader title="Browse catalogue" />
      <div className="mt-8">
        <div className="border-border bg-background sticky top-16 z-10 -mx-4 border-b px-4 py-4 sm:mx-0 sm:px-0">
          <Suspense fallback={<Skeleton className="h-10 w-full" />}>
            <CatalogueFilters categories={CATEGORIES} />
          </Suspense>
        </div>
        <div className="mt-6">
          <p className="text-muted-foreground mb-4 text-sm">
            {result.total} {result.total === 1 ? 'result' : 'results'}
          </p>
          {result.items.length === 0 ? (
            <EmptyState
              icon={SearchX}
              title="No publications match these filters"
              description="Try removing a filter, widening the date range, or searching a different term."
              action={
                <Button variant="outline" render={<Link href="/catalogue" />}>
                  Clear all filters
                </Button>
              }
            />
          ) : (
            <div className="border-border border-t">
              {result.items.map((item) => (
                <PublicationRow key={item.id} item={item} />
              ))}
            </div>
          )}
          <div className="mt-8">
            <CataloguePagination
              page={result.page}
              pageSize={result.pageSize}
              total={result.total}
              searchParams={urlSearchParams}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
