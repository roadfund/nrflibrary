import type { Metadata } from 'next';
import { PageHeader } from '@/components/shared/page-header';

export const metadata: Metadata = {
  title: 'About',
  description: 'About the National Road Fund of Liberia and the Research Hub.',
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <PageHeader title="About" description="The Road Fund and the Research Hub." />

      <div className="text-foreground mt-8 flex flex-col gap-8 text-sm leading-relaxed">
        <section>
          <h2 className="font-serif text-lg font-semibold">The National Road Fund of Liberia</h2>
          <p className="text-muted-foreground mt-2">
            The National Road Fund of Liberia finances the construction, rehabilitation, and
            maintenance of the national road network. It is funded primarily through a fuel levy and
            axle load fees, and disburses funds to the National Road Authority and county road
            maintenance programs against an annual work plan.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-lg font-semibold">What this platform is</h2>
          <p className="text-muted-foreground mt-2">
            The National Road Fund Research Library is the Road Fund&apos;s subscription research
            portal. It publishes datasets, reports, policy documents, maps, and project records
            related to roads, traffic, safety, and funding in Liberia. The Road Fund is the only
            publisher: all content is created, reviewed, and released by designated Road Fund staff.
          </p>
          <p className="text-muted-foreground mt-2">
            Anyone can browse the public catalogue. Viewing full details, previewing files, and
            downloading requires an account with an active subscription.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-lg font-semibold">Who uses it</h2>
          <p className="text-muted-foreground mt-2">
            Students and researchers subscribe individually. Universities, government agencies, and
            other organizations subscribe under an institution plan that covers multiple staff. Some
            datasets require a stated research purpose and reviewer approval before access is
            granted.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-lg font-semibold">Editorial and data controls</h2>
          <p className="text-muted-foreground mt-2">
            Every publication is drafted, reviewed, and approved by Road Fund staff before release.
            Files carry a version history: replacing a file retains the prior version and a record
            of who made the change and when. Every publishing, review, and access decision is
            written to an audit log.
          </p>
        </section>
      </div>
    </div>
  );
}
