import type { Metadata } from 'next';
import { PageHeader } from '@/components/shared/page-header';
import { ContentForm } from '@/components/staff/content-form';
import { requireStaff } from '@/lib/auth';
import type { ContentDraftFormInput } from '@/lib/validation/content';

export const metadata: Metadata = { title: 'New content' };

const DEFAULT_VALUES: ContentDraftFormInput = {
  title: '',
  shortDescription: '',
  fullDescription: '',
  contentType: 'DATASET',
  category: '',
  tags: '',
  authorOrSource: 'National Road Fund of Liberia',
  geographicCoverage: 'National',
  datePublished: new Date().toISOString().slice(0, 10),
  dateCollected: '',
  fileFormat: 'PDF',
  fileName: '',
  fileSizeBytes: 0,
  externalUrl: '',
  licenseTerms: 'Road Fund Research Hub subscriber license.',
  accessLevel: 'SUBSCRIBER',
  allowedPlanCodes: [],
  isFeatured: false,
};

export default async function NewContentPage() {
  await requireStaff();

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <PageHeader
        title="New content"
        description="Create a draft. You can submit it for review once the details are complete."
      />
      <div className="mt-8">
        <ContentForm defaultValues={DEFAULT_VALUES} />
      </div>
    </div>
  );
}
