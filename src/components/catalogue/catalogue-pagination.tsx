import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

function hrefForPage(searchParams: URLSearchParams, page: number): string {
  const params = new URLSearchParams(searchParams);
  params.set('page', String(page));
  return `/catalogue?${params.toString()}`;
}

export function CataloguePagination({
  page,
  pageSize,
  total,
  searchParams,
}: {
  page: number;
  pageSize: number;
  total: number;
  searchParams: URLSearchParams;
}) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  if (pageCount <= 1) return null;

  const pages = Array.from({ length: pageCount }, (_, i) => i + 1).filter(
    (p) => p === 1 || p === pageCount || Math.abs(p - page) <= 1,
  );

  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            href={page > 1 ? hrefForPage(searchParams, page - 1) : undefined}
            aria-disabled={page <= 1}
          />
        </PaginationItem>
        {pages.map((p, index) => (
          <PaginationItem key={p}>
            {index > 0 && pages[index - 1] !== p - 1 ? (
              <span className="text-muted-foreground px-2 text-sm">…</span>
            ) : null}
            <PaginationLink href={hrefForPage(searchParams, p)} isActive={p === page}>
              {p}
            </PaginationLink>
          </PaginationItem>
        ))}
        <PaginationItem>
          <PaginationNext
            href={page < pageCount ? hrefForPage(searchParams, page + 1) : undefined}
            aria-disabled={page >= pageCount}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
