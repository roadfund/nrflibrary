'use client';

import { useTransition } from 'react';
import { Bookmark, BookmarkCheck } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { toggleSavedItem } from '@/lib/mock-data/mutations';

export function SaveItemButton({
  contentItemId,
  initiallySaved,
}: {
  contentItemId: string;
  initiallySaved: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      variant="outline"
      loading={isPending}
      onClick={() =>
        startTransition(async () => {
          const result = await toggleSavedItem(contentItemId);
          if (result.success) toast.success(result.message);
          else toast.error(result.message);
        })
      }
    >
      {initiallySaved ? <BookmarkCheck className="size-4" /> : <Bookmark className="size-4" />}
      {initiallySaved ? 'Saved' : 'Save item'}
    </Button>
  );
}
