import type { Metadata } from 'next';
import { PageHeader } from '@/components/shared/page-header';

export const metadata: Metadata = {
  title: 'Privacy policy',
  description: 'Privacy policy for the National Road Fund Research Library.',
};

const SECTIONS = [
  {
    heading: 'Information we collect',
    body: 'Account details you provide (name, email, organization, field of study), subscription and billing records, and platform activity such as searches, downloads, saved items, and access requests.',
  },
  {
    heading: 'How we use it',
    body: 'To operate your account and subscription, process payments, evaluate access requests, respond to support inquiries, and maintain the audit log required for restricted-data governance.',
  },
  {
    heading: 'What we share',
    body: "Payment details are processed by our payment providers and are not stored on our servers beyond what is needed to reconcile a transaction. We do not sell account or activity data. Institution administrators can see their members' access activity within their own institution.",
  },
  {
    heading: 'Data retention',
    body: 'Account and subscription records are retained for as long as your account is active and for a limited period afterward to meet financial and audit record-keeping requirements.',
  },
  {
    heading: 'Your rights',
    body: 'You can review and update your profile at any time from account settings. To request a copy or deletion of your data, contact us using the details on the Contact page.',
  },
  {
    heading: 'Security',
    body: 'Access to restricted content is enforced on every request based on your account, subscription, and any approved access grants. Administrative actions are recorded in an audit log.',
  },
];

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <PageHeader title="Privacy policy" description="Last updated August 2026." />
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
