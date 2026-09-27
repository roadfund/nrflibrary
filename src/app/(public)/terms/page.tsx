import type { Metadata } from 'next';
import { PageHeader } from '@/components/shared/page-header';

export const metadata: Metadata = {
  title: 'Terms of use',
  description: 'Terms of use for the National Road Fund Research Library.',
};

const SECTIONS = [
  {
    heading: '1. Acceptance',
    body: 'By creating an account or subscribing, you agree to these terms. If you are subscribing on behalf of an institution, you confirm you have authority to bind that institution.',
  },
  {
    heading: '2. Accounts',
    body: 'You are responsible for activity under your account and for keeping your credentials confidential. Institution administrators are responsible for managing member access under their subscription.',
  },
  {
    heading: '3. Subscriptions and billing',
    body: 'Subscriptions renew automatically at the end of each billing period unless canceled beforehand. Fees are non-refundable except where required by law. Institution plans are billed by seat count.',
  },
  {
    heading: '4. Use of content',
    body: 'Published materials may be used according to the license or usage terms stated on each publication. Restricted-access datasets may carry additional conditions tied to an approved access request, including a stated research purpose and an access expiry date.',
  },
  {
    heading: '5. Prohibited conduct',
    body: 'You may not redistribute restricted-access files outside the terms of your access grant, attempt to circumvent access controls, or use the platform to scrape or bulk-extract content beyond normal use.',
  },
  {
    heading: '6. Termination',
    body: 'The Road Fund may suspend or terminate accounts that violate these terms, misuse restricted data, or fail to maintain a current subscription.',
  },
  {
    heading: '7. Changes',
    body: 'These terms may be updated from time to time. Continued use of the platform after a change takes effect constitutes acceptance of the updated terms.',
  },
];

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <PageHeader title="Terms of use" description="Last updated August 2026." />
      <div className="text-foreground mt-8 flex flex-col gap-6 text-sm leading-relaxed">
        {SECTIONS.map((section) => (
          <section key={section.heading}>
            <h2 className="font-semibold">{section.heading}</h2>
            <p className="text-muted-foreground mt-1.5">{section.body}</p>
          </section>
        ))}
      </div>
    </div>
  );
}
