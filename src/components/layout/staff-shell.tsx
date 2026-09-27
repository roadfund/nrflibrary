'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
  LayoutDashboard,
  Library,
  ClipboardCheck,
  Inbox,
  Users,
  Building2,
  CreditCard,
  ScrollText,
  Settings,
  ExternalLink,
  Menu,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { STAFF_NAV } from '@/lib/navigation';
import type { User } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { UserMenu } from './user-menu';

const ICONS: Record<string, typeof LayoutDashboard> = {
  '/staff': LayoutDashboard,
  '/staff/library': Library,
  '/staff/review': ClipboardCheck,
  '/staff/requests': Inbox,
  '/staff/users': Users,
  '/staff/institutions': Building2,
  '/staff/plans': CreditCard,
  '/staff/audit-log': ScrollText,
  '/staff/settings': Settings,
};

function NavLinks({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <>
      {STAFF_NAV.map((item) => {
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

export function StaffShell({ user, children }: { user: User; children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <div className="border-border bg-sidebar text-sidebar-foreground flex items-center justify-between border-b px-4 py-3 lg:hidden">
        <Link href="/staff" className="flex items-center gap-2">
          <span className="bg-sidebar-foreground text-sidebar flex size-7 items-center justify-center rounded-sm text-xs font-bold">
            RF
          </span>
          <span className="font-serif text-sm font-semibold">Staff portal</span>
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
                <SheetTitle className="text-sidebar-foreground font-serif">Staff portal</SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-0.5 px-4">
                <NavLinks pathname={pathname} onNavigate={() => setMobileOpen(false)} />
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
        <div className="border-sidebar-border flex items-center gap-2 border-b px-5 py-4">
          <span className="bg-sidebar-foreground text-sidebar flex size-7 items-center justify-center rounded-sm text-xs font-bold">
            RF
          </span>
          <span className="font-serif text-sm font-semibold">Staff portal</span>
        </div>
        <nav className="flex flex-1 flex-col gap-0.5 px-3 py-4">
          <NavLinks pathname={pathname} />
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
      <div className="bg-background min-w-0 flex-1">{children}</div>
    </div>
  );
}
