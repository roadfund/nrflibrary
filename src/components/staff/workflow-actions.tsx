'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  submitForReview,
  publishContentDraft,
  decideContentReview,
  archiveContentItem,
  restoreContentItem,
  type ReviewDecision,
} from '@/lib/mock-data/content-mutations';
import type { ContentStatus } from '@/lib/types';

export function SubmitForReviewButton({
  contentItemId,
  status,
}: {
  contentItemId: string;
  status: ContentStatus;
}) {
  const [isPending, startTransition] = useTransition();
  if (status !== 'DRAFT' && status !== 'CHANGES_REQUESTED') return null;

  return (
    <Button
      loading={isPending}
      onClick={() =>
        startTransition(async () => {
          const result = await submitForReview(contentItemId);
          if (result.success) toast.success(result.message);
          else toast.error(result.message);
        })
      }
    >
      Submit for review
    </Button>
  );
}

export function PublishDirectlyButton({
  contentItemId,
  status,
}: {
  contentItemId: string;
  status: ContentStatus;
}) {
  const [isPending, startTransition] = useTransition();
  if (status !== 'DRAFT' && status !== 'CHANGES_REQUESTED') return null;

  return (
    <Button
      variant="outline"
      loading={isPending}
      onClick={() =>
        startTransition(async () => {
          const result = await publishContentDraft(contentItemId);
          if (result.success) toast.success(result.message);
          else toast.error(result.message);
        })
      }
    >
      Publish directly
    </Button>
  );
}

export function ReviewActions({
  contentItemId,
  canReview,
}: {
  contentItemId: string;
  canReview: boolean;
}) {
  const [note, setNote] = useState('');
  const [isPending, startTransition] = useTransition();

  if (!canReview) {
    return (
      <p className="text-muted-foreground text-sm">This item is awaiting review by a reviewer.</p>
    );
  }

  function decide(decision: ReviewDecision) {
    startTransition(async () => {
      const result = await decideContentReview(contentItemId, decision, note);
      if (result.success) {
        toast.success(result.message);
        setNote('');
      } else {
        toast.error(result.message);
      }
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <Label htmlFor="review-note">Reviewer note</Label>
      <Textarea
        id="review-note"
        rows={3}
        value={note}
        onChange={(event) => setNote(event.target.value)}
        placeholder="Required for changes requested or rejection."
      />
      <div className="flex flex-wrap gap-2">
        <Button loading={isPending} onClick={() => decide('APPROVE')}>
          Approve & publish
        </Button>
        <Button
          variant="outline"
          disabled={!note}
          loading={isPending}
          onClick={() => decide('CHANGES_REQUESTED')}
        >
          Request changes
        </Button>
        <Button
          variant="destructive"
          disabled={!note}
          loading={isPending}
          onClick={() => decide('REJECT')}
        >
          Reject
        </Button>
      </div>
    </div>
  );
}

export function ArchiveButton({
  contentItemId,
  status,
}: {
  contentItemId: string;
  status: ContentStatus;
}) {
  const [isPending, startTransition] = useTransition();
  if (status !== 'PUBLISHED') return null;

  return (
    <Button
      variant="outline"
      loading={isPending}
      onClick={() =>
        startTransition(async () => {
          const result = await archiveContentItem(contentItemId);
          if (result.success) toast.success(result.message);
          else toast.error(result.message);
        })
      }
    >
      Archive
    </Button>
  );
}

export function RestoreButton({
  contentItemId,
  status,
}: {
  contentItemId: string;
  status: ContentStatus;
}) {
  const [isPending, startTransition] = useTransition();
  if (status !== 'ARCHIVED') return null;

  return (
    <Button
      variant="outline"
      loading={isPending}
      onClick={() =>
        startTransition(async () => {
          const result = await restoreContentItem(contentItemId);
          if (result.success) toast.success(result.message);
          else toast.error(result.message);
        })
      }
    >
      Restore to catalogue
    </Button>
  );
}
