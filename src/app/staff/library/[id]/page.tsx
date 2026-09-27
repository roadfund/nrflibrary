import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PageHeader } from '@/components/shared/page-header';
import { ContentStatusBadge } from '@/components/shared/status-badges';
import { ContentForm } from '@/components/staff/content-form';
import {
  SubmitForReviewButton,
  PublishDirectlyButton,
  ReviewActions,
  ArchiveButton,
} from '@/components/staff/workflow-actions';
import { ReplaceFileForm } from '@/components/staff/replace-file-form';
import { MetadataList } from '@/components/shared/metadata-list';
import { requireStaff } from '@/lib/auth';
import { getContentById, getVersionsForContent } from '@/lib/mock-data/content';
import { formatBytes, formatDateTime } from '@/lib/format';
import type { ContentDraftFormInput } from '@/lib/validation/content';

export async function generateMetadata({
  params,
}: PageProps<'/staff/library/[id]'>): Promise<Metadata> {
  const { id } = await params;
  const item = await getContentById(id);
  return { title: item ? `Edit: ${item.title}` : 'Content not found' };
}

export default async function ContentEditorPage({ params }: PageProps<'/staff/library/[id]'>) {
  const { user } = await requireStaff();
  const { id } = await params;
  const item = await getContentById(id);
  if (!item) notFound();

  const versions = await getVersionsForContent(id);
  const canReview =
    item.status === 'IN_REVIEW' &&
    item.ownerUserId !== user.id &&
    (user.role === 'SUPER_ADMIN' || (user.role === 'PUBLISHER' && user.isReviewer));

  const defaultValues: ContentDraftFormInput = {
    title: item.title,
    shortDescription: item.shortDescription,
    fullDescription: item.fullDescription,
    contentType: item.contentType,
    category: item.category,
    tags: item.tags.join(', '),
    authorOrSource: item.authorOrSource,
    geographicCoverage: item.geographicCoverage,
    datePublished: item.datePublished,
    dateCollected: item.dateCollected ?? '',
    fileFormat: item.fileFormat,
    fileName: '',
    fileSizeBytes: item.fileSizeBytes,
    externalUrl: item.externalUrl ?? '',
    licenseTerms: item.licenseTerms,
    accessLevel: item.accessLevel,
    allowedPlanCodes: item.allowedPlanCodes,
    isFeatured: item.isFeatured,
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <PageHeader
        title={item.title}
        description={`Version ${item.versionNumber} · Owned by ${item.ownerName}`}
        actions={<ContentStatusBadge status={item.status} />}
      />

      <div className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-[1fr_320px]">
        <ContentForm contentItemId={item.id} defaultValues={defaultValues} />

        <aside className="flex flex-col gap-8">
          <div className="border-border rounded-md border p-4">
            <h3 className="text-foreground text-sm font-semibold">Workflow</h3>
            <div className="mt-3 flex flex-col gap-3">
              <SubmitForReviewButton contentItemId={item.id} status={item.status} />
              <PublishDirectlyButton contentItemId={item.id} status={item.status} />
              {item.status === 'IN_REVIEW' ? (
                <ReviewActions contentItemId={item.id} canReview={canReview} />
              ) : null}
              <ArchiveButton contentItemId={item.id} status={item.status} />
              {item.reviewNote ? (
                <div className="bg-muted/50 text-foreground rounded-md p-3 text-sm">
                  <p className="font-medium">Last reviewer note</p>
                  <p className="text-muted-foreground mt-1">{item.reviewNote}</p>
                </div>
              ) : null}
            </div>
          </div>

          <div className="border-border rounded-md border p-4">
            <h3 className="text-foreground text-sm font-semibold">Replace file</h3>
            <p className="text-muted-foreground mt-1 text-xs">
              Uploading here creates a new version and keeps the old one in history.
            </p>
            <div className="mt-3">
              <ReplaceFileForm contentItemId={item.id} />
            </div>
          </div>

          <div className="border-border rounded-md border p-4">
            <h3 className="text-foreground text-sm font-semibold">Version history</h3>
            <div className="mt-3 flex flex-col gap-3">
              {versions.length === 0 ? (
                <p className="text-muted-foreground text-xs">No file versions recorded.</p>
              ) : (
                versions.map((version) => (
                  <div
                    key={version.id}
                    className="border-border border-t pt-3 first:border-t-0 first:pt-0"
                  >
                    <p className="text-foreground text-sm font-medium break-words">
                      v{version.versionNumber} · {version.fileName}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {formatBytes(version.fileSizeBytes)} · {formatDateTime(version.uploadedAt)} ·{' '}
                      {version.uploadedByName}
                    </p>
                    <p className="text-muted-foreground mt-1 text-xs">{version.changeNote}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="border-border rounded-md border p-4">
            <h3 className="text-foreground text-sm font-semibold">Details</h3>
            <div className="mt-3">
              <MetadataList
                columns={1}
                items={[
                  {
                    label: 'Checksum (SHA-256)',
                    value: (
                      <span className="font-mono text-xs break-all">
                        {item.fileChecksumSha256 || '—'}
                      </span>
                    ),
                  },
                  { label: 'Downloads', value: item.downloadCount },
                  { label: 'Views', value: item.viewCount },
                  { label: 'Created', value: formatDateTime(item.createdAt) },
                  { label: 'Last updated', value: formatDateTime(item.updatedAt) },
                ]}
              />
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
