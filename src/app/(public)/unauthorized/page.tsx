import Link from 'next/link';
import type { Metadata } from 'next';
import { ShieldX } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = { title: 'Not authorized' };

export default function UnauthorizedPage() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-24 text-center sm:px-6">
      <ShieldX className="text-muted-foreground size-10" aria-hidden />
      <h1 className="text-foreground mt-4 font-serif text-2xl font-semibold">Not authorized</h1>
      <p className="text-muted-foreground mt-2 text-sm">
        Your account does not have access to this page. If you believe this is a mistake, contact
        Road Fund staff.
      </p>
      <div className="mt-6 flex gap-3">
        <Button render={<Link href="/" />}>Go to homepage</Button>
        <Button variant="outline" render={<Link href="/contact" />}>
          Contact support
        </Button>
      </div>
    </div>
  );
}
