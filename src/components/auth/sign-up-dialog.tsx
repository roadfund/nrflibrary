'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { CreateAccountWizard } from '@/components/auth/create-account-wizard';

export function SignUpDialog({
  render,
  children,
}: {
  /** The element the trigger renders as, e.g. <Button size="sm" />. */
  render: React.ReactElement;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={render}>{children}</DialogTrigger>
      <DialogContent showCloseButton={false} className="sm:max-w-md">
        <CreateAccountWizard onClose={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
