'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
  LayoutDashboard,
  Download,
  Inbox,
  Bookmark,
  CreditCard,
  UserCog,
  Building2,
  Users,
  BarChart3,
  ScrollText,
  Menu,
  ExternalLink,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getAccountNav } from '@/lib/navigation';
import type { User } from '@/lib/types';
import { UserMenu } from './user-menu';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';

const ICONS: Record<string, LucideIcon> = {
  '/dashboard': LayoutDashboard,
  '/downloads': Download,
  '/requests': Inbox,
  '/saved': Bookmark,
  '/billing': CreditCard,
  '/profile': UserCog,
  '/institution/profile': Building2,
  '/institution/members': Users,
  '/institution/billing': CreditCard,
  '/institution/usage': BarChart3,
  '/institution/activity': ScrollText,
};

function NavLinks({
  nav,
  pathname,
  onNavigate,
}: {
  nav: readonly { href: string; label: string }[];
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <>
      {nav.map((item) => {
        const Icon = ICONS[item.href];
        const active = item.href === pathname;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              'flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors',
              active
                ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground',
            )}
          >
            {Icon ? <Icon className="size-4 shrink-0" /> : null}
            {item.label}
          </Link>
        );
      })}
    </>
  );
}

export function AccountShell({ user, children }: { user: User; children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const nav = getAccountNav(user.role);

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <div className="border-sidebar-border bg-sidebar flex items-center justify-between border-b px-4 py-3 lg:hidden">
        <Link href="/" className="flex items-center rounded-sm bg-white p-1">
          <Image
            src="/nrf-logo.png"
            alt="National Road Fund of Liberia"
            width={643}
            height={263}
            className="h-7 w-auto"
          />
        </Link>
        <div className="flex items-center gap-1">
          <UserMenu user={user} />
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-sidebar-foreground hover:bg-sidebar-accent"
                >
                  <Menu />
                  <span className="sr-only">Open menu</span>
                </Button>
              }
            />
            <SheetContent side="left" className="bg-sidebar text-sidebar-foreground w-72">
              <SheetHeader>
                <SheetTitle className="text-sidebar-foreground font-serif">Menu</SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-0.5 px-4">
                <NavLinks nav={nav} pathname={pathname} onNavigate={() => setMobileOpen(false)} />
              </nav>
              <div className="mt-auto px-4 py-4">
                <Link
                  href="/"
                  onClick={() => setMobileOpen(false)}
                  className="text-sidebar-foreground/70 hover:text-sidebar-foreground flex items-center gap-1.5 text-xs"
                >
                  <ExternalLink className="size-3.5" />
                  View public site
                </Link>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      <aside className="bg-sidebar text-sidebar-foreground hidden w-64 shrink-0 flex-col lg:flex">
        <Link href="/" className="border-sidebar-border flex items-center border-b px-5 py-4">
          <span className="flex items-center rounded-sm bg-white p-1">
            <Image
              src="/nrf-logo.png"
              alt="National Road Fund of Liberia"
              width={643}
              height={263}
              className="h-7 w-auto"
            />
          </span>
        </Link>
        <nav className="flex flex-1 flex-col gap-0.5 px-3 py-4">
          <NavLinks nav={nav} pathname={pathname} />
        </nav>
        <div className="border-sidebar-border border-t p-3">
          <UserMenu user={user} />
          <Link
            href="/"
            className="text-sidebar-foreground/70 hover:text-sidebar-foreground mt-2 flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs"
          >
            <ExternalLink className="size-3.5" />
            View public site
          </Link>
        </div>
      </aside>

      <div className="bg-background min-w-0 flex-1">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">{children}</div>
      </div>
    </div>
  );
}
