import Link from 'next/link';
import Image from 'next/image';
import { FileQuestion } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function GlobalNotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-10 px-4 text-center">
      <Link href="/" className="ring-border flex items-center rounded-sm bg-white p-1 ring-1">
        <Image
          src="/nrf-logo.png"
          alt="National Road Fund of Liberia"
          width={643}
          height={263}
          className="h-8 w-auto"
        />
      </Link>
      <div className="flex flex-col items-center">
        <span className="bg-accent flex size-14 items-center justify-center rounded-full">
          <FileQuestion className="text-primary size-6" aria-hidden />
        </span>
        <p className="text-primary mt-5 font-serif text-sm font-semibold tracking-wide uppercase">
          404
        </p>
        <h1 className="text-foreground mt-1 font-serif text-2xl font-semibold">Page not found</h1>
        <p className="text-muted-foreground mt-2 max-w-sm text-sm">
          The page you&apos;re looking for doesn&apos;t exist, or it may have moved.
        </p>
        <Button className="mt-6" render={<Link href="/" />}>
          Go to homepage
        </Button>
      </div>
    </div>
  );
}
