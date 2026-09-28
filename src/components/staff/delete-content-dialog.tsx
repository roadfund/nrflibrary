'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { deleteContentItem } from '@/lib/mock-data/content-mutations';

export function DeleteContentDialog({
  contentItemId,
  title,
  wasPublished,
}: {
  contentItemId: string;
  title: string;
  wasPublished: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState('');
  const [isPending, startTransition] = useTransition();
  const confirmed = !wasPublished || typed.trim() === title.trim();

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setTyped('');
      }}
    >
      <DialogTrigger render={<Button variant="destructive" className="w-full" />}>
        <Trash2 className="size-4" />
        Delete permanently
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete this content?</DialogTitle>
          <DialogDescription>
            {wasPublished
              ? 'This removes it from the catalogue and deletes every file version from storage. Subscribers lose access, saved items and access requests for it are removed, and download history keeps only the title. This cannot be undone.'
              : 'This deletes the draft and every uploaded file version from storage. This cannot be undone.'}
          </DialogDescription>
        </DialogHeader>
        {wasPublished ? (
          <div>
            <Label htmlFor="confirm-title">
              Type <span className="text-foreground font-semibold">{title}</span> to confirm
            </Label>
            <Input
              id="confirm-title"
              className="mt-1.5"
              autoComplete="off"
              value={typed}
              onChange={(event) => setTyped(event.target.value)}
            />
          </div>
        ) : null}
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            disabled={!confirmed}
            loading={isPending}
            onClick={() =>
              startTransition(async () => {
                const result = await deleteContentItem(contentItemId, typed);
                if (result.success) {
                  toast.success(result.message);
                  setOpen(false);
                  router.push('/staff/library');
                  router.refresh();
                } else {
                  toast.error(result.message);
                }
              })
            }
          >
            Delete permanently
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
