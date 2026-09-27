'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useTransition } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  CONTENT_STATUS_LABELS,
  CONTENT_STATUSES,
  CONTENT_TYPE_LABELS,
  CONTENT_TYPES,
} from '@/lib/types';

export function LibraryFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();
  const [q, setQ] = useState(searchParams.get('q') ?? '');

  function setParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== 'ALL') params.set(key, value);
    else params.delete(key);
    startTransition(() => router.push(`/staff/library?${params.toString()}`));
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <form
        className="flex-1"
        onSubmit={(event) => {
          event.preventDefault();
          setParam('q', q);
        }}
      >
        <div className="relative">
          <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
          <Input
            value={q}
            onChange={(event) => setQ(event.target.value)}
            placeholder="Search content library…"
            className="pl-8"
          />
        </div>
      </form>
      <Select
        value={searchParams.get('status') ?? 'ALL'}
        onValueChange={(v) => setParam('status', String(v))}
      >
        <SelectTrigger className="w-full sm:w-48">
          <SelectValue placeholder="All statuses" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">All statuses</SelectItem>
          {CONTENT_STATUSES.map((status) => (
            <SelectItem key={status} value={status}>
              {CONTENT_STATUS_LABELS[status]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={searchParams.get('contentType') ?? 'ALL'}
        onValueChange={(v) => setParam('contentType', String(v))}
      >
        <SelectTrigger className="w-full sm:w-52">
          <SelectValue placeholder="All content types" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">All content types</SelectItem>
          {CONTENT_TYPES.map((type) => (
            <SelectItem key={type} value={type}>
              {CONTENT_TYPE_LABELS[type]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
