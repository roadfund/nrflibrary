import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { MAIN_NAV } from '@/lib/navigation';
import { getSession } from '@/lib/auth';
import { UserMenu, GuestMenuLink } from './user-menu';
import { MobileNav } from './mobile-nav';
import { SignUpDialog } from '@/components/auth/sign-up-dialog';

export async function SiteHeader() {
  const session = await getSession();

  return (
    <header className="border-border bg-background sticky top-0 z-40 border-b">
      <div className="border-border bg-primary text-primary-foreground border-b">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-1.5 text-xs sm:px-6 lg:px-8">
          <span>Official research library of the National Road Fund of Liberia</span>
        </div>
      </div>
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center gap-6">
          <MobileNav user={session?.user ?? null} />
          <Link href="/" className="flex items-center">
            <span className="flex items-center rounded-sm bg-white p-1">
              <Image
                src="/nrf-logo.png"
                alt="National Road Fund of Liberia"
                width={643}
                height={263}
                className="h-8 w-auto"
                priority
              />
            </span>
          </Link>
        </div>
        <nav className="hidden items-center gap-6 md:flex">
          {MAIN_NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          {session ? (
            <UserMenu user={session.user} />
          ) : (
            <>
              <div className="hidden sm:block">
                <GuestMenuLink />
              </div>
              <SignUpDialog render={<Button size="sm" />}>Sign up</SignUpDialog>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
