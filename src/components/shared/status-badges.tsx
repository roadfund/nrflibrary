import {
  Globe,
  Users,
  Layers,
  Lock,
  Eye,
  ShieldOff,
  Database,
  FileText,
  BookOpen,
  Scale,
  Map,
  ClipboardList,
  LayoutDashboard,
  CalendarDays,
  type LucideIcon,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  ACCESS_LEVEL_LABELS,
  CONTENT_STATUS_LABELS,
  CONTENT_TYPE_LABELS,
  type AccessLevel,
  type ContentStatus,
  type ContentType,
} from '@/lib/types';
import { ACCESS_REQUEST_STATUS_LABELS, type AccessRequestStatus } from '@/lib/types/access-request';
import { SUBSCRIPTION_STATUS_LABELS, type SubscriptionStatus } from '@/lib/types/plan';

const CONTENT_STATUS_VARIANT: Record<
  ContentStatus,
  'secondary' | 'info' | 'warning' | 'destructive' | 'success' | 'outline'
> = {
  DRAFT: 'secondary',
  IN_REVIEW: 'info',
  CHANGES_REQUESTED: 'warning',
  REJECTED: 'destructive',
  PUBLISHED: 'success',
  ARCHIVED: 'outline',
};

export function ContentStatusBadge({ status }: { status: ContentStatus }) {
  return <Badge variant={CONTENT_STATUS_VARIANT[status]}>{CONTENT_STATUS_LABELS[status]}</Badge>;
}

const ACCESS_LEVEL_VARIANT: Record<
  AccessLevel,
  'success' | 'secondary' | 'info' | 'warning' | 'outline'
> = {
  PUBLIC: 'success',
  SUBSCRIBER: 'secondary',
  PLAN_RESTRICTED: 'info',
  REQUEST_REQUIRED: 'warning',
  VIEW_ONLY: 'outline',
  INTERNAL: 'outline',
};

export const ACCESS_LEVEL_ICONS: Record<AccessLevel, LucideIcon> = {
  PUBLIC: Globe,
  SUBSCRIBER: Users,
  PLAN_RESTRICTED: Layers,
  REQUEST_REQUIRED: Lock,
  VIEW_ONLY: Eye,
  INTERNAL: ShieldOff,
};

export function AccessLevelBadge({ level }: { level: AccessLevel }) {
  const Icon = ACCESS_LEVEL_ICONS[level];
  return (
    <Badge variant={ACCESS_LEVEL_VARIANT[level]}>
      <Icon />
      {ACCESS_LEVEL_LABELS[level]}
    </Badge>
  );
}

export function ContentTypeBadge({ type }: { type: ContentType }) {
  return <Badge variant="outline">{CONTENT_TYPE_LABELS[type]}</Badge>;
}

export const CONTENT_TYPE_ICONS: Record<ContentType, LucideIcon> = {
  DATASET: Database,
  REPORT: FileText,
  RESEARCH_PAPER: BookOpen,
  POLICY_DOCUMENT: Scale,
  MAP_GIS: Map,
  PROJECT_DOCUMENT: ClipboardList,
  DASHBOARD_LINK: LayoutDashboard,
  ANNUAL_PUBLICATION: CalendarDays,
};

const SUBSCRIPTION_STATUS_VARIANT: Record<
  SubscriptionStatus,
  'success' | 'warning' | 'destructive' | 'secondary'
> = {
  PENDING: 'secondary',
  ACTIVE: 'success',
  PAST_DUE: 'warning',
  CANCELED: 'secondary',
  EXPIRED: 'destructive',
};

export function SubscriptionStatusBadge({ status }: { status: SubscriptionStatus }) {
  return (
    <Badge variant={SUBSCRIPTION_STATUS_VARIANT[status]}>
      {SUBSCRIPTION_STATUS_LABELS[status]}
    </Badge>
  );
}

const ACCESS_REQUEST_STATUS_VARIANT: Record<
  AccessRequestStatus,
  'secondary' | 'warning' | 'success' | 'destructive'
> = {
  PENDING: 'secondary',
  NEEDS_INFO: 'warning',
  APPROVED: 'success',
  DECLINED: 'destructive',
};

export function AccessRequestStatusBadge({ status }: { status: AccessRequestStatus }) {
  return (
    <Badge variant={ACCESS_REQUEST_STATUS_VARIANT[status]}>
      {ACCESS_REQUEST_STATUS_LABELS[status]}
    </Badge>
  );
}
