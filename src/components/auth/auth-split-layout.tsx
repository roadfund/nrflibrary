import Image from 'next/image';
import Link from 'next/link';

export function AuthSplitLayout({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
      <div className="relative hidden overflow-hidden text-white lg:flex lg:flex-col lg:justify-between lg:p-10">
        <Image src="/login-bg.JPG" alt="" fill priority sizes="50vw" className="object-cover" />
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-black/40"
        />

        <Link href="/" className="relative flex items-center">
          <span className="flex items-center rounded-sm bg-white p-1">
            <Image
              src="/nrf-logo.png"
              alt="National Road Fund of Liberia"
              width={643}
              height={263}
              className="h-8 w-auto"
            />
          </span>
        </Link>

        <div className="relative">
          <h1 className="font-serif text-5xl font-bold tracking-tight text-white">
            Road data.
            <br />
            Every county.
            <br />
            One authority.
          </h1>
        </div>
      </div>

      <div className="flex flex-col justify-center px-4 py-16 sm:px-6 lg:px-16">
        <div className="mx-auto w-full max-w-sm">
          <Link href="/" className="mb-8 inline-flex items-center lg:hidden">
            <span className="flex items-center rounded-sm bg-white p-1">
              <Image
                src="/nrf-logo.png"
                alt="National Road Fund of Liberia"
                width={643}
                height={263}
                className="h-8 w-auto"
              />
            </span>
          </Link>
          <h2 className="text-foreground font-serif text-2xl font-semibold">{title}</h2>
          <p className="text-muted-foreground mt-1 text-sm">{description}</p>
          <div className="mt-8">{children}</div>
        </div>
      </div>
    </div>
  );
}
