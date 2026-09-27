'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { MAIN_NAV } from '@/lib/navigation';
import { SignUpDialog } from '@/components/auth/sign-up-dialog';
import type { User } from '@/lib/types';

export function MobileNav({ user }: { user: User | null }) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu />
            <span className="sr-only">Open menu</span>
          </Button>
        }
      />
      <SheetContent side="left" className="w-72">
        <SheetHeader>
          <SheetTitle className="font-serif text-lg">
            The National Road Fund Research Library
          </SheetTitle>
        </SheetHeader>
        <nav className="flex flex-col gap-1 px-4">
          {MAIN_NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="text-foreground hover:bg-muted rounded-md px-2 py-2 text-sm font-medium"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="border-border mt-auto flex flex-col gap-2 border-t px-4 py-4">
          {user ? (
            <Link
              href="/dashboard"
              onClick={() => setOpen(false)}
              className="text-foreground text-sm font-medium hover:underline"
            >
              Go to dashboard
            </Link>
          ) : (
            <>
              <Button render={<Link href="/sign-in" onClick={() => setOpen(false)} />}>
                Sign in
              </Button>
              <SignUpDialog render={<Button variant="outline" onClick={() => setOpen(false)} />}>
                Sign up
              </SignUpDialog>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
