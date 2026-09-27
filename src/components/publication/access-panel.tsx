import Link from 'next/link';
import { AlertCircle, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AccessRequestDialog } from './access-request-dialog';
import { SaveItemButton } from './save-item-button';
import { DownloadButton, PreviewButton } from './download-button';
import { SubscribeDialog } from './subscribe-dialog';
import type { AccessEvaluation } from '@/lib/access-control';
import type { ContentItem, Plan, PlanCode, Role } from '@/lib/types';
import { isInstitutionRole } from '@/lib/types/roles';

const PLAN_NAMES: Record<PlanCode, string> = {
  STANDARD: 'Standard',
};

export function AccessPanel({
  item,
  access,
  viewerRole,
  isSaved,
  ownerType,
  ownerId,
  plan,
}: {
  item: ContentItem;
  access: AccessEvaluation;
  viewerRole: Role | null;
  isSaved: boolean;
  ownerType: 'USER' | 'INSTITUTION';
  ownerId: string;
  plan?: Plan;
}) {
  if (access.isStaffOverride) {
    return (
      <div className="border-border bg-muted/40 flex flex-col gap-3 rounded-md border p-5">
        <div className="text-foreground flex items-center gap-2 text-sm font-medium">
          <ShieldCheck className="text-primary size-4" />
          Staff access
        </div>
        <p className="text-muted-foreground text-sm">
          You can view, preview, and download this item regardless of its access level.
        </p>
        <Button variant="outline" render={<Link href={`/staff/library/${item.id}`} />}>
          Manage in staff portal
        </Button>
      </div>
    );
  }

  if (access.reasons.includes('SIGN_IN_REQUIRED')) {
    return (
      <div className="border-border bg-muted/40 flex flex-col gap-3 rounded-md border p-5">
        <p className="text-foreground text-sm font-medium">Sign in to view full details</p>
        <p className="text-muted-foreground text-sm">
          Full descriptions, previews, and downloads require an account with an active subscription.
        </p>
        <Button render={<Link href="/sign-in" />}>Sign in</Button>
        <Button variant="outline" render={<Link href="/create-account" />}>
          Create an account
        </Button>
      </div>
    );
  }

  const billingHref =
    viewerRole && isInstitutionRole(viewerRole) ? '/institution/billing' : '/billing';

  if (access.reasons.includes('SUBSCRIPTION_REQUIRED')) {
    return (
      <div className="border-border bg-muted/40 flex flex-col gap-3 rounded-md border p-5">
        <p className="text-foreground text-sm font-medium">Subscribe to access this publication</p>
        <p className="text-muted-foreground text-sm">
          Your account does not have a subscription yet. Subscribe to get full details and
          downloads.
        </p>
        {plan ? (
          <SubscribeDialog ownerType={ownerType} ownerId={ownerId} plan={plan} />
        ) : (
          <Button render={<Link href="/pricing" />}>See subscription plans</Button>
        )}
      </div>
    );
  }

  if (access.reasons.includes('SUBSCRIPTION_INACTIVE')) {
    return (
      <Alert variant="destructive">
        <AlertCircle />
        <AlertTitle>Your subscription is inactive</AlertTitle>
        <AlertDescription>
          Update your payment method to restore access.
          <Button size="sm" className="mt-3" render={<Link href={billingHref} />}>
            Manage billing
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  if (access.reasons.includes('PLAN_DOES_NOT_INCLUDE_ITEM')) {
    return (
      <div className="border-border bg-muted/40 flex flex-col gap-3 rounded-md border p-5">
        <p className="text-foreground text-sm font-medium">Not included in your current plan</p>
        <p className="text-muted-foreground text-sm">
          This item is available on the{' '}
          {item.allowedPlanCodes.map((code) => PLAN_NAMES[code]).join(' and ')} plan
          {item.allowedPlanCodes.length > 1 ? 's' : ''}.
        </p>
        <Button render={<Link href={viewerRole ? billingHref : '/pricing'} />}>
          {viewerRole ? 'Upgrade plan' : 'Compare plans'}
        </Button>
      </div>
    );
  }

  if (access.canRequestAccess) {
    return (
      <div className="border-border bg-muted/40 flex flex-col gap-3 rounded-md border p-5">
        <p className="text-foreground text-sm font-medium">Approval required</p>
        <p className="text-muted-foreground text-sm">
          Submit your research purpose. A reviewer will approve, decline, or ask for more
          information.
        </p>
        <AccessRequestDialog
          contentItemId={item.id}
          contentTitle={item.title}
          defaultInstitution=""
        />
      </div>
    );
  }

  return (
    <div className="border-border bg-muted/40 flex flex-col gap-3 rounded-md border p-5">
      {access.reasons.includes('DOWNLOAD_LIMIT_REACHED') ? (
        <Alert variant="destructive">
          <AlertCircle />
          <AlertTitle>Monthly download limit reached</AlertTitle>
          <AlertDescription>You can still preview this item in the browser.</AlertDescription>
        </Alert>
      ) : null}
      <div className="flex flex-wrap gap-2">
        {item.fileFormat === 'LINK' ? (
          access.canPreview ? (
            <PreviewButton
              contentItemId={item.id}
              label={item.contentType === 'DASHBOARD_LINK' ? 'Open dashboard' : 'Visit link'}
            />
          ) : null
        ) : (
          <>
            {access.canDownload ? <DownloadButton contentItemId={item.id} /> : null}
            {access.canPreview ? <PreviewButton contentItemId={item.id} /> : null}
          </>
        )}
        <SaveItemButton contentItemId={item.id} initiallySaved={isSaved} />
      </div>
      {access.reasons.includes('DOWNLOAD_NOT_PERMITTED') && item.fileFormat !== 'LINK' ? (
        <p className="text-muted-foreground text-xs">
          This item is view-only. Downloading is disabled for this access level.
        </p>
      ) : null}
    </div>
  );
}
