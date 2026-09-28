export const PLAN_CODES = ['STANDARD'] as const;
export type PlanCode = (typeof PLAN_CODES)[number];

export const BILLING_INTERVALS = ['MONTHLY', 'ANNUAL'] as const;
export type BillingInterval = (typeof BILLING_INTERVALS)[number];

export const PAYMENT_METHOD_TYPES = ['CARD', 'MOBILE_MONEY', 'ORANGE_MONEY'] as const;
export type PaymentMethodType = (typeof PAYMENT_METHOD_TYPES)[number];

export const PAYMENT_METHOD_LABELS: Record<PaymentMethodType, string> = {
  CARD: 'Credit or debit card',
  MOBILE_MONEY: 'Mobile money',
  ORANGE_MONEY: 'Orange Money',
};

export interface Plan {
  id: string;
  code: PlanCode;
  name: string;
  description: string;
  monthlyPrice: number;
  annualPrice: number;
  currency: string;
  seatBased: boolean;
  /** Only meaningful when seatBased is true. */
  minSeats: number | null;
  downloadLimitPerMonth: number | null;
  eligibleRoles: string[];
  features: string[];
  active: boolean;
}

export const SUBSCRIPTION_STATUSES = [
  'PENDING',
  'ACTIVE',
  'PAST_DUE',
  'CANCELED',
  'EXPIRED',
] as const;

export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUSES)[number];

export const SUBSCRIPTION_STATUS_LABELS: Record<SubscriptionStatus, string> = {
  PENDING: 'Pending payment',
  ACTIVE: 'Active',
  PAST_DUE: 'Past due',
  CANCELED: 'Canceled',
  EXPIRED: 'Expired',
};

export const GRANT_CATEGORIES = [
  'PARTNER',
  'STUDENT',
  'RESEARCHER',
  'GOVERNMENT',
  'STAFF_COURTESY',
  'OTHER',
] as const;

export type GrantCategory = (typeof GRANT_CATEGORIES)[number];

export const GRANT_CATEGORY_LABELS: Record<GrantCategory, string> = {
  PARTNER: 'Partner',
  STUDENT: 'Student',
  RESEARCHER: 'Researcher',
  GOVERNMENT: 'Government',
  STAFF_COURTESY: 'Staff courtesy',
  OTHER: 'Other',
};

export interface Subscription {
  id: string;
  ownerType: 'USER' | 'INSTITUTION';
  ownerId: string;
  planId: string;
  planCode: PlanCode;
  billingInterval: BillingInterval;
  status: SubscriptionStatus;
  seats: number | null;
  seatsUsed: number | null;
  paymentMethodType: PaymentMethodType | null;
  paymentReference: string | null;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  createdAt: string;
  grantedBy: string | null;
  grantCategory: GrantCategory | null;
  grantNote: string | null;
}

export const INVOICE_STATUSES = ['PAID', 'OPEN', 'FAILED', 'VOID'] as const;
export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];

export interface Invoice {
  id: string;
  subscriptionId: string;
  number: string;
  amount: number;
  currency: string;
  status: InvoiceStatus;
  issuedAt: string;
  paidAt: string | null;
  periodStart: string;
  periodEnd: string;
}
