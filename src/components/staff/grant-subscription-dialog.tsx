'use client';

import { useMemo, useState, useTransition } from 'react';
import { Check, Search } from 'lucide-react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { grantSubscription } from '@/lib/mock-data/subscription-grant-mutations';
import { GRANT_CATEGORIES, GRANT_CATEGORY_LABELS, type GrantCategory } from '@/lib/types/plan';

export interface GrantRecipient {
  id: string;
  name: string;
  detail: string;
}

type OwnerType = 'USER' | 'INSTITUTION';

const PRESETS = [
  { label: '3 months', months: 3 },
  { label: '6 months', months: 6 },
  { label: '1 year', months: 12 },
];

function monthsFromToday(months: number): string {
  const date = new Date();
  date.setMonth(date.getMonth() + months);
  return date.toISOString().slice(0, 10);
}

export function GrantSubscriptionDialog({
  users,
  institutions,
  initial,
  triggerLabel = 'Grant subscription',
  triggerVariant = 'default',
}: {
  users: GrantRecipient[];
  institutions: GrantRecipient[];
  initial?: {
    ownerType: OwnerType;
    ownerId: string;
    category: GrantCategory;
    note: string | null;
    seats: number | null;
  };
  triggerLabel?: string;
  triggerVariant?: 'default' | 'outline';
}) {
  const [open, setOpen] = useState(false);
  const [ownerType, setOwnerType] = useState<OwnerType>(initial?.ownerType ?? 'USER');
  const [ownerId, setOwnerId] = useState<string | null>(initial?.ownerId ?? null);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<GrantCategory>(initial?.category ?? 'STUDENT');
  const [endDate, setEndDate] = useState(monthsFromToday(12));
  const [seats, setSeats] = useState(initial?.seats ?? 10);
  const [note, setNote] = useState(initial?.note ?? '');
  const [isPending, startTransition] = useTransition();

  const recipients = ownerType === 'USER' ? users : institutions;
  const selected = recipients.find((r) => r.id === ownerId);
  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    return recipients
      .filter((r) => !q || r.name.toLowerCase().includes(q) || r.detail.toLowerCase().includes(q))
      .slice(0, 6);
  }, [recipients, query]);

  function submit() {
    if (!ownerId) {
      toast.error('Choose who receives the subscription.');
      return;
    }
    startTransition(async () => {
      const result = await grantSubscription({
        ownerType,
        ownerId,
        endDate,
        category,
        note: note.trim() || undefined,
        seats: ownerType === 'INSTITUTION' ? seats : undefined,
      });
      if (result.success) {
        toast.success(result.message);
        setOpen(false);
      } else {
        toast.error(result.message);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant={triggerVariant} size="sm" />}>
        {triggerLabel}
      </DialogTrigger>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{initial ? 'Extend or change grant' : 'Grant a subscription'}</DialogTitle>
          <DialogDescription>
            Gives full subscriber access with no payment until the end date.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-5">
          {initial ? (
            <div>
              <Label>Recipient</Label>
              <p className="text-foreground mt-1.5 text-sm font-medium">{selected?.name}</p>
              <p className="text-muted-foreground text-xs">{selected?.detail}</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <Label>Recipient</Label>
              <Tabs
                value={ownerType}
                onValueChange={(value) => {
                  setOwnerType(value as OwnerType);
                  setOwnerId(null);
                  setQuery('');
                  setCategory(value === 'INSTITUTION' ? 'PARTNER' : 'STUDENT');
                }}
              >
                <TabsList>
                  <TabsTrigger value="USER">Individual</TabsTrigger>
                  <TabsTrigger value="INSTITUTION">Institution</TabsTrigger>
                </TabsList>
              </Tabs>
              <Input
                icon={Search}
                placeholder={ownerType === 'USER' ? 'Search name or email' : 'Search institutions'}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
              <div className="border-border divide-border divide-y rounded-md border">
                {matches.length === 0 ? (
                  <p className="text-muted-foreground px-3 py-2.5 text-sm">No matches.</p>
                ) : (
                  matches.map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setOwnerId(r.id)}
                      className={cn(
                        'hover:bg-muted flex w-full items-center gap-3 px-3 py-2 text-left',
                        r.id === ownerId && 'bg-muted',
                      )}
                    >
                      <span className="min-w-0 flex-1">
                        <span className="text-foreground block truncate text-sm font-medium">
                          {r.name}
                        </span>
                        <span className="text-muted-foreground block truncate text-xs">
                          {r.detail}
                        </span>
                      </span>
                      {r.id === ownerId ? <Check className="text-primary size-4 shrink-0" /> : null}
                    </button>
                  ))
                )}
              </div>
            </div>
          )}

          <div>
            <Label>Reason</Label>
            <Select value={category} onValueChange={(value) => setCategory(value as GrantCategory)}>
              <SelectTrigger className="mt-1.5 w-full">
                <SelectValue>{(value: GrantCategory) => GRANT_CATEGORY_LABELS[value]}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {GRANT_CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {GRANT_CATEGORY_LABELS[c]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="grant-end">Access ends on</Label>
            <div className="mt-1.5 flex flex-wrap gap-2">
              {PRESETS.map((preset) => (
                <Button
                  key={preset.months}
                  type="button"
                  size="sm"
                  variant={endDate === monthsFromToday(preset.months) ? 'default' : 'outline'}
                  onClick={() => setEndDate(monthsFromToday(preset.months))}
                >
                  {preset.label}
                </Button>
              ))}
              <Input
                id="grant-end"
                type="date"
                className="h-8 w-40"
                min={monthsFromToday(0)}
                value={endDate}
                onChange={(event) => setEndDate(event.target.value)}
              />
            </div>
          </div>

          {ownerType === 'INSTITUTION' ? (
            <div>
              <Label htmlFor="grant-seats">Seats</Label>
              <Input
                id="grant-seats"
                type="number"
                min={1}
                className="mt-1.5 w-32"
                value={seats}
                onChange={(event) => setSeats(Number(event.target.value))}
              />
            </div>
          ) : null}

          <div>
            <Label htmlFor="grant-note">Note (optional)</Label>
            <Textarea
              id="grant-note"
              className="mt-1.5"
              rows={2}
              maxLength={500}
              placeholder="e.g. MoU with University of Liberia, 2026 thesis cohort"
              value={note}
              onChange={(event) => setNote(event.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button onClick={submit} loading={isPending}>
            {initial ? 'Save' : 'Grant access'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
