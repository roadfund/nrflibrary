import Link from 'next/link';
import { FileQuestion } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function StaffNotFound() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-24 text-center sm:px-6">
      <span className="bg-accent flex size-14 items-center justify-center rounded-full">
        <FileQuestion className="text-primary size-6" aria-hidden />
      </span>
      <p className="text-primary mt-5 font-serif text-sm font-semibold tracking-wide uppercase">
        404
      </p>
      <h1 className="text-foreground mt-1 font-serif text-2xl font-semibold">Not found</h1>
      <p className="text-muted-foreground mt-2 text-sm">
        This item does not exist or may have been removed.
      </p>
      <Button className="mt-6" render={<Link href="/staff/library" />}>
        Back to content library
      </Button>
    </div>
  );
}
