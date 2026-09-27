import Link from 'next/link';
import { FileQuestion } from 'lucide-react';
import { AccountShell } from '@/components/layout/account-shell';
import { Button } from '@/components/ui/button';
import { getSession } from '@/lib/auth';
import { isStaffRole } from '@/lib/types/roles';

function NotFoundContent() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-24 text-center sm:px-6">
      <span className="bg-accent flex size-14 items-center justify-center rounded-full">
        <FileQuestion className="text-primary size-6" aria-hidden />
      </span>
      <p className="text-primary mt-5 font-serif text-sm font-semibold tracking-wide uppercase">
        404
      </p>
      <h1 className="text-foreground mt-1 font-serif text-2xl font-semibold">Page not found</h1>
      <p className="text-muted-foreground mt-2 text-sm">
        This page does not exist, or you may not have access to it.
      </p>
      <Button className="mt-6" render={<Link href="/dashboard" />}>
        Back to dashboard
      </Button>
    </div>
  );
}

export default async function AccountNotFound() {
  const session = await getSession();

  if (session && !isStaffRole(session.user.role)) {
    return (
      <AccountShell user={session.user}>
        <NotFoundContent />
      </AccountShell>
    );
  }

  return <NotFoundContent />;
}
