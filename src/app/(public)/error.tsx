'use client';

import { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PublicError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-24 text-center sm:px-6">
      <AlertTriangle className="text-destructive size-10" aria-hidden />
      <h1 className="text-foreground mt-4 font-serif text-2xl font-semibold">
        Something went wrong
      </h1>
      <p className="text-muted-foreground mt-2 text-sm">
        An unexpected error occurred while loading this page. Try again, or contact support if the
        problem continues.
      </p>
      <Button className="mt-6" onClick={() => reset()}>
        Try again
      </Button>
    </div>
  );
}
