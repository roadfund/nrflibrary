import Link from 'next/link';
import { AccessLevelBadge, ContentTypeBadge } from '@/components/shared/status-badges';
import { stripHtml } from '@/lib/html';
import type { ContentItem } from '@/lib/types';

export function PublicationRow({ item }: { item: ContentItem }) {
  return (
    <Link
      href={`/catalogue/${item.slug}`}
      className="group border-border hover:bg-muted/40 flex flex-col gap-2 border-b py-4 transition-colors last:border-b-0 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-2"
    >
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex flex-wrap items-center gap-2">
          <ContentTypeBadge type={item.contentType} />
          <AccessLevelBadge level={item.accessLevel} />
        </div>
        <h3 className="text-foreground truncate font-serif text-base font-semibold group-hover:underline">
          {item.title}
        </h3>
        <p className="text-muted-foreground mt-0.5 line-clamp-1 text-sm">
          {stripHtml(item.shortDescription)}
        </p>
      </div>
      <div className="text-muted-foreground flex shrink-0 flex-col items-start gap-1 text-xs sm:items-end">
        <span>{item.fileFormat === 'LINK' ? 'External link' : item.fileFormat}</span>
        <span>{item.geographicCoverage}</span>
        <span className="max-w-40 truncate">{item.authorOrSource}</span>
      </div>
    </Link>
  );
}
