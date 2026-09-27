import Link from 'next/link';
import { FileQuestion } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PublicNotFound() {
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
        This publication or page does not exist, or may have been archived.
      </p>
      <div className="mt-6 flex gap-3">
        <Button render={<Link href="/catalogue" />}>Browse catalogue</Button>
        <Button variant="outline" render={<Link href="/" />}>
          Go to homepage
        </Button>
      </div>
    </div>
  );
}
