'use client';

import Link from 'next/link';
import { useTransition } from 'react';
import { Loader2, LogOut, User as UserIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import type { User } from '@/lib/types';
import { signOut } from '@/lib/auth/actions';

function initials(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function UserMenu({ user }: { user: User }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" className="h-9 gap-2 px-2">
            <Avatar className="size-6">
              <AvatarFallback className="text-[11px]">{initials(user.name)}</AvatarFallback>
            </Avatar>
            <span className="hidden text-sm font-medium sm:inline">{user.name}</span>
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-64">
        <div className="px-1.5 py-1.5">
          <span className="text-foreground text-sm font-medium">{user.name}</span>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          disabled={isPending}
          onClick={() =>
            startTransition(async () => {
              await signOut();
              router.push('/');
              router.refresh();
            })
          }
        >
          {isPending ? <Loader2 className="animate-spin" /> : <LogOut />}
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function GuestMenuLink() {
  return (
    <Link
      href="/sign-in"
      className="text-foreground inline-flex items-center gap-1.5 text-sm font-medium hover:underline"
    >
      <UserIcon className="size-4" />
      Sign in
    </Link>
  );
}
