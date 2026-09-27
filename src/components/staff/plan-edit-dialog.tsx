'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { updatePlan } from '@/lib/mock-data/plan-mutations';
import type { Plan } from '@/lib/types';

export function PlanEditDialog({ plan }: { plan: Plan }) {
  const [open, setOpen] = useState(false);
  const [monthlyPrice, setMonthlyPrice] = useState(plan.monthlyPrice);
  const [annualPrice, setAnnualPrice] = useState(plan.annualPrice);
  const [downloadLimit, setDownloadLimit] = useState(plan.downloadLimitPerMonth ?? 0);
  const [unlimited, setUnlimited] = useState(plan.downloadLimitPerMonth === null);
  const [active, setActive] = useState(plan.active);
  const [isPending, startTransition] = useTransition();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" size="sm" />}>Edit</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{plan.name} plan</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="monthly">Monthly price (USD)</Label>
              <Input
                id="monthly"
                type="number"
                min={0}
                className="mt-1.5"
                value={monthlyPrice}
                onChange={(event) => setMonthlyPrice(Number(event.target.value))}
              />
            </div>
            <div>
              <Label htmlFor="annual">Annual price (USD)</Label>
              <Input
                id="annual"
                type="number"
                min={0}
                className="mt-1.5"
                value={annualPrice}
                onChange={(event) => setAnnualPrice(Number(event.target.value))}
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Switch id="unlimited" checked={unlimited} onCheckedChange={setUnlimited} />
            <Label htmlFor="unlimited" className="font-normal">
              No monthly download limit
            </Label>
          </div>
          {!unlimited ? (
            <div>
              <Label htmlFor="limit">Downloads per month</Label>
              <Input
                id="limit"
                type="number"
                min={0}
                className="mt-1.5 w-32"
                value={downloadLimit}
                onChange={(event) => setDownloadLimit(Number(event.target.value))}
              />
            </div>
          ) : null}
          <div className="flex items-center gap-2">
            <Switch id="active" checked={active} onCheckedChange={setActive} />
            <Label htmlFor="active" className="font-normal">
              Plan is active and available for signup
            </Label>
          </div>
        </div>
        <DialogFooter>
          <Button
            loading={isPending}
            onClick={() =>
              startTransition(async () => {
                const result = await updatePlan({
                  planId: plan.id,
                  monthlyPrice,
                  annualPrice,
                  downloadLimitPerMonth: unlimited ? null : downloadLimit,
                  active,
                });
                if (result.success) {
                  toast.success(result.message);
                  setOpen(false);
                } else {
                  toast.error(result.message);
                }
              })
            }
          >
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
