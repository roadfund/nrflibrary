'use client';

import { useState, useTransition } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { decideAccessRequest, type AccessRequestDecision } from '@/lib/mock-data/content-mutations';
import type { AccessRequest } from '@/lib/types';

export function AccessRequestDecisionDialog({ request }: { request: AccessRequest }) {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState('');
  const [days, setDays] = useState(request.requestedAccessDays);
  const [isPending, startTransition] = useTransition();

  function decide(decision: AccessRequestDecision) {
    startTransition(async () => {
      const result = await decideAccessRequest(request.id, decision, note, days);
      if (result.success) {
        toast.success(result.message);
        setOpen(false);
        setNote('');
      } else {
        toast.error(result.message);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" />}>Review</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{request.contentTitle}</DialogTitle>
          <DialogDescription>
            Request from {request.userName} · {request.institution}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 text-sm">
          <div>
            <p className="text-foreground font-medium">Purpose</p>
            <p className="text-muted-foreground mt-1">{request.purpose}</p>
          </div>
          <div>
            <p className="text-foreground font-medium">Intended use</p>
            <p className="text-muted-foreground mt-1">{request.intendedUse}</p>
          </div>
          <div>
            <Label htmlFor="access-days">Access period if approved (days)</Label>
            <Input
              id="access-days"
              type="number"
              min={7}
              max={180}
              className="mt-1.5 w-32"
              value={days}
              onChange={(event) => setDays(Number(event.target.value))}
            />
          </div>
          <div>
            <Label htmlFor="decision-note">Note to subscriber</Label>
            <Textarea
              id="decision-note"
              rows={3}
              className="mt-1.5"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Required when declining or requesting more information."
            />
          </div>
        </div>
        <DialogFooter className="flex-wrap gap-2">
          <Button loading={isPending} onClick={() => decide('APPROVE')}>
            Approve
          </Button>
          <Button
            variant="outline"
            disabled={!note}
            loading={isPending}
            onClick={() => decide('NEEDS_INFO')}
          >
            Ask for more information
          </Button>
          <Button
            variant="destructive"
            disabled={!note}
            loading={isPending}
            onClick={() => decide('DECLINE')}
          >
            Decline
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
