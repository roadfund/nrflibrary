import Link from 'next/link';

const FOOTER_LINKS = [
  { href: '/catalogue', label: 'Catalogue' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
  { href: '/terms', label: 'Terms of use' },
  { href: '/privacy', label: 'Privacy policy' },
];

export function SiteFooter() {
  return (
    <footer className="border-border border-t">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-10 sm:flex-row sm:items-start sm:justify-between sm:px-6 lg:px-8">
        <div>
          <span className="text-foreground font-serif text-base font-semibold">
            National Road Fund Research Library
          </span>
          <p className="text-muted-foreground mt-1 max-w-sm text-sm">
            National Road Fund of Liberia — road, transport, and infrastructure data.
          </p>
        </div>
        <nav aria-label="Footer" className="flex flex-wrap gap-x-6 gap-y-2">
          {FOOTER_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-muted-foreground hover:text-foreground text-sm hover:underline"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
      <div className="overflow-hidden select-none" aria-hidden>
        <p className="text-foreground/5 -mb-8 text-center font-serif text-[clamp(5rem,18vw,13rem)] leading-none font-bold sm:-mb-12">
          Library
        </p>
      </div>
      <div className="border-border border-t">
        <p className="text-muted-foreground mx-auto max-w-7xl px-4 py-4 text-xs sm:px-6 lg:px-8">
          © {new Date().getFullYear()} National Road Fund of Liberia
        </p>
      </div>
    </footer>
  );
}
