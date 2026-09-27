import Link from 'next/link';
import { ArrowRight, LibraryBig, Plus, Star } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { PublicationRow } from '@/components/publication/publication-row';
import { EmptyState } from '@/components/shared/empty-state';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { ACCESS_LEVEL_ICONS, CONTENT_TYPE_ICONS } from '@/components/shared/status-badges';
import { getPublications } from '@/lib/mock-data/queries';
import { ACCESS_LEVEL_DESCRIPTIONS, ACCESS_LEVEL_LABELS, ACCESS_LEVELS } from '@/lib/types';

export default async function HomePage() {
  const [recent, featured, allPublications] = await Promise.all([
    getPublications({ sort: 'newest', pageSize: 5 }),
    getPublications({ featuredOnly: true, sort: 'newest', pageSize: 4 }),
    getPublications({ pageSize: 1 }),
  ]);

  return (
    <div>
      <section className="relative overflow-hidden bg-[#1e3a6e] text-white">
        <svg
          aria-hidden
          className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.15]"
        >
          <defs>
            <pattern id="hero-network" width="140" height="140" patternUnits="userSpaceOnUse">
              <circle cx="12" cy="16" r="2" fill="white" />
              <circle cx="96" cy="42" r="1.5" fill="white" />
              <circle cx="54" cy="96" r="2.5" fill="white" />
              <circle cx="122" cy="114" r="1.5" fill="white" />
              <line x1="12" y1="16" x2="96" y2="42" stroke="white" strokeWidth="0.5" />
              <line x1="96" y1="42" x2="54" y2="96" stroke="white" strokeWidth="0.5" />
              <line x1="54" y1="96" x2="122" y2="114" stroke="white" strokeWidth="0.5" />
              <line x1="12" y1="16" x2="54" y2="96" stroke="white" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#hero-network)" />
        </svg>

        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <h1 className="font-serif text-6xl font-bold tracking-tight text-white sm:text-7xl">
            Library
          </h1>

          <form action="/catalogue" method="GET" className="mt-8 flex max-w-2xl">
            <Input
              name="q"
              placeholder="Search datasets, reports, policy documents…"
              aria-label="Search the catalogue"
              className="h-14 flex-1 rounded-none rounded-l-md border-0 bg-white px-5 text-base text-black placeholder:text-neutral-500 focus-visible:ring-0"
            />
            <button
              type="submit"
              className="h-14 shrink-0 rounded-r-md bg-[#101828] px-8 text-sm font-semibold text-white transition-colors hover:bg-[#1a2c4d]"
            >
              Search
            </button>
          </form>
          <Link
            href="/catalogue"
            className="mt-2 inline-block text-sm text-white/70 underline underline-offset-4 hover:text-white"
          >
            Advanced search
          </Link>

          <p className="mt-8 max-w-2xl text-sm text-white/70">
            The National Road Fund Research Library comprises of publications — datasets, reports,
            maps, visuals, dashboards,and research — published by the National Road Fund and
            partners, covering all 15 counties of Liberia.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between">
              <h2 className="text-foreground font-serif text-xl font-semibold">
                Recent publications
              </h2>
              <Link
                href="/catalogue?sort=newest"
                className="text-primary flex items-center gap-1 text-sm font-medium hover:underline"
              >
                View all <ArrowRight className="size-3.5" />
              </Link>
            </div>
            <div className="mt-4">
              {recent.items.length > 0 ? (
                recent.items.map((item) => <PublicationRow key={item.id} item={item} />)
              ) : (
                <EmptyState
                  icon={LibraryBig}
                  title="No publications yet"
                  description="Published datasets, reports, and research will appear here."
                />
              )}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <h2 className="text-foreground font-serif text-xl font-semibold">Featured</h2>
              <Link
                href="/catalogue"
                className="text-primary flex items-center gap-1 text-sm font-medium hover:underline"
              >
                View all <ArrowRight className="size-3.5" />
              </Link>
            </div>
            {featured.items.length > 0 ? (
              <ul className="mt-4 flex flex-col gap-4">
                {featured.items.map((item) => {
                  const Icon = CONTENT_TYPE_ICONS[item.contentType];
                  return (
                    <li key={item.id} className="border-primary flex gap-3 border-l-2 pl-3">
                      <Icon className="text-muted-foreground mt-0.5 size-4 shrink-0" />
                      <div className="min-w-0">
                        <Link href={`/catalogue/${item.slug}`} className="hover:underline">
                          <p className="text-foreground text-sm font-medium">{item.title}</p>
                        </Link>
                        <p className="text-muted-foreground mt-0.5 text-xs">
                          {item.geographicCoverage} ·{' '}
                          {item.fileFormat === 'LINK' ? 'External link' : item.fileFormat} ·{' '}
                          {item.authorOrSource}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <EmptyState
                icon={Star}
                title="Nothing featured yet"
                description="Staff can pin a publication to feature it here."
                className="mt-4"
              />
            )}
          </div>
        </div>
      </section>

      <section
        id="how-access-works"
        className="border-border bg-secondary/40 scroll-mt-20 border-t"
      >
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:items-center lg:gap-16">
            <div>
              <h2 className="text-foreground font-serif text-3xl font-semibold tracking-tight sm:text-4xl">
                How access works
              </h2>
              <p className="text-muted-foreground mt-4 max-w-md text-base">
                Anyone can browse the catalogue and read publication summaries. Viewing full
                details, previewing files, and downloading requires an account with an active
                subscription. Each publication carries one of five access labels.
              </p>
            </div>

            <Accordion defaultValue={['SUBSCRIBER']} className="gap-3">
              {ACCESS_LEVELS.filter((level) => level !== 'INTERNAL').map((level) => {
                const Icon = ACCESS_LEVEL_ICONS[level];
                return (
                  <AccordionItem
                    key={level}
                    value={level}
                    className="border-border bg-background rounded-2xl border px-5"
                  >
                    <AccordionTrigger className="items-center gap-4 py-5 text-base hover:no-underline [&_[data-slot=accordion-trigger-icon]]:hidden">
                      <span className="flex flex-1 items-center gap-4">
                        <span className="bg-foreground text-background flex size-10 shrink-0 items-center justify-center rounded-lg">
                          <Icon className="size-5" />
                        </span>
                        <span className="text-foreground text-base font-semibold">
                          {ACCESS_LEVEL_LABELS[level]}
                        </span>
                      </span>
                      <Plus className="text-muted-foreground size-5 shrink-0 transition-transform duration-200 group-aria-expanded/accordion-trigger:rotate-45" />
                    </AccordionTrigger>
                    <AccordionContent>
                      <p className="text-muted-foreground pb-1 pl-14 text-sm">
                        {ACCESS_LEVEL_DESCRIPTIONS[level]}
                      </p>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          </div>
        </div>
      </section>
    </div>
  );
}
