import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import {
  AccessLevelBadge,
  ContentStatusBadge,
  ContentTypeBadge,
} from '@/components/shared/status-badges';
import { MetadataList, type MetadataItem } from '@/components/shared/metadata-list';
import { AccessPanel } from '@/components/publication/access-panel';
import { PublicationRow } from '@/components/publication/publication-row';
import { RecordView } from '@/components/publication/record-view';
import {
  getPublicationBySlug,
  getRelatedPublications,
  getViewerSubscription,
} from '@/lib/mock-data/queries';
import { getInstitutionById } from '@/lib/mock-data/institutions';
import { getPlanByCode } from '@/lib/mock-data/plans';
import { isItemSaved } from '@/lib/mock-data/activity';
import { hasApprovedAccessGrant } from '@/lib/mock-data/access-requests';
import { getSession } from '@/lib/auth';
import { evaluateAccess } from '@/lib/access-control';
import { isStaffRole } from '@/lib/types/roles';
import { CONTENT_TYPE_LABELS } from '@/lib/types';
import { formatBytes, formatDate } from '@/lib/format';
import { sanitizeHtml, stripHtml } from '@/lib/html';

export async function generateMetadata({
  params,
}: PageProps<'/catalogue/[slug]'>): Promise<Metadata> {
  const { slug } = await params;
  const item = await getPublicationBySlug(slug);
  if (!item) return { title: 'Publication not found' };
  return { title: item.title, description: stripHtml(item.shortDescription) };
}

export default async function PublicationDetailPage({ params }: PageProps<'/catalogue/[slug]'>) {
  const { slug } = await params;
  const item = await getPublicationBySlug(slug);
  const session = await getSession();
  const isStaff = session ? isStaffRole(session.user.role) : false;

  if (!item || (item.status !== 'PUBLISHED' && !isStaff)) {
    notFound();
  }

  let subscription = null;
  let ownerType: 'USER' | 'INSTITUTION' = 'USER';
  let ownerId = '';
  if (session) {
    const isInstitutionMember =
      session.user.role === 'INSTITUTION_ADMIN' || session.user.role === 'INSTITUTION_MEMBER';
    ownerType = isInstitutionMember ? 'INSTITUTION' : 'USER';
    ownerId = isInstitutionMember ? (session.user.institutionId ?? '') : session.user.id;
    const result = await getViewerSubscription(ownerType, ownerId, session.user.id);
    subscription = result.subscription;
  }

  const access = evaluateAccess({
    item: {
      status: item.status,
      accessLevel: item.accessLevel,
      allowedPlanCodes: item.allowedPlanCodes,
    },
    user: session ? { role: session.user.role, isReviewer: session.user.isReviewer } : null,
    subscription,
    hasApprovedAccessGrant: session
      ? await hasApprovedAccessGrant(session.user.id, item.id)
      : false,
  });

  if (!access.canViewListing) {
    notFound();
  }

  const related = access.canViewDetail ? await getRelatedPublications(item) : [];
  const standardPlan = access.reasons.includes('SUBSCRIPTION_REQUIRED')
    ? await getPlanByCode('STANDARD')
    : undefined;
  const isSaved = session ? await isItemSaved(session.user.id, item.id) : false;
  const owningInstitution = session?.user.institutionId
    ? await getInstitutionById(session.user.institutionId)
    : undefined;

  const metadataItems: MetadataItem[] = [
    { label: 'Content type', value: CONTENT_TYPE_LABELS[item.contentType] },
    { label: 'Category', value: item.category },
    { label: 'Author / source', value: item.authorOrSource },
    { label: 'Geographic coverage', value: item.geographicCoverage },
    { label: 'Date published', value: formatDate(item.datePublished) },
    {
      label: 'Date collected',
      value: item.dateCollected ? formatDate(item.dateCollected) : 'Not applicable',
    },
    { label: 'File format', value: item.fileFormat === 'LINK' ? 'External link' : item.fileFormat },
    {
      label: 'File size',
      value: item.fileFormat === 'LINK' ? 'Not applicable' : formatBytes(item.fileSizeBytes),
    },
    { label: 'License / usage terms', value: item.licenseTerms },
  ];

  if (isStaff) {
    metadataItems.push(
      { label: 'Status', value: <ContentStatusBadge status={item.status} /> },
      { label: 'Owner', value: item.ownerName },
      {
        label: 'File checksum (SHA-256)',
        value: <span className="font-mono text-xs">{item.fileChecksumSha256 || '—'}</span>,
      },
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <RecordView contentItemId={item.id} />
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink render={<Link href="/catalogue" />}>Catalogue</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink render={<Link href={`/catalogue?contentType=${item.contentType}`} />}>
              {CONTENT_TYPE_LABELS[item.contentType]}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage className="max-w-60 truncate">{item.title}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="mt-6 grid grid-cols-1 gap-10 lg:grid-cols-[1fr_320px]">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <ContentTypeBadge type={item.contentType} />
            <AccessLevelBadge level={item.accessLevel} />
            {isStaff ? <ContentStatusBadge status={item.status} /> : null}
          </div>
          <h1 className="text-foreground mt-3 font-serif text-3xl font-semibold tracking-tight">
            {item.title}
          </h1>
          <div
            className="prose prose-sm text-muted-foreground dark:prose-invert mt-3 max-w-none"
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(item.shortDescription) }}
          />

          <div className="mt-8 lg:hidden">
            <AccessPanel
              item={item}
              access={access}
              viewerRole={session?.user.role ?? null}
              isSaved={isSaved}
              ownerType={ownerType}
              ownerId={ownerId}
              plan={standardPlan}
            />
          </div>

          {access.canViewDetail ? (
            <>
              <div className="border-border mt-8 border-t pt-8">
                <h2 className="text-foreground font-serif text-lg font-semibold">Description</h2>
                <div
                  className="prose prose-sm text-foreground dark:prose-invert mt-3 max-w-3xl"
                  dangerouslySetInnerHTML={{ __html: sanitizeHtml(item.fullDescription) }}
                />
              </div>

              <div className="border-border mt-8 border-t pt-8">
                <h2 className="text-foreground font-serif text-lg font-semibold">Details</h2>
                <div className="mt-4">
                  <MetadataList items={metadataItems} columns={2} />
                </div>
              </div>

              {related.length > 0 ? (
                <div className="border-border mt-8 border-t pt-8">
                  <h2 className="text-foreground font-serif text-lg font-semibold">
                    Related items
                  </h2>
                  <div className="mt-4">
                    {related.map((relatedItem) => (
                      <PublicationRow key={relatedItem.id} item={relatedItem} />
                    ))}
                  </div>
                </div>
              ) : null}
            </>
          ) : (
            <div className="border-border mt-8 border-t pt-8">
              <p className="text-muted-foreground text-sm">
                Sign in with an active subscription to see the full details for this publication.
              </p>
            </div>
          )}
        </div>

        <aside className="hidden lg:sticky lg:top-24 lg:block lg:self-start">
          <AccessPanel
            item={item}
            access={access}
            viewerRole={session?.user.role ?? null}
            isSaved={isSaved}
            ownerType={ownerType}
            ownerId={ownerId}
            plan={standardPlan}
          />
          {owningInstitution ? (
            <p className="text-muted-foreground mt-3 text-xs">
              Access provided through {owningInstitution.name}&apos;s institutional subscription.
            </p>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
