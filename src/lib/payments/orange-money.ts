import { z } from 'zod';
import type { InvoiceStatus, SubscriptionStatus } from '@/lib/types/plan';

export type OrangeCurrency = 'USD' | 'LRD';
export type OrangeTxnStatus = 'TS' | 'TF' | 'TI';
export type OrangeOutcome = 'PAID' | 'FAILED' | 'PENDING';

const paymentResponseSchema = z.object({
  exec_code: z.number(),
  exec_msg: z.string(),
  exec_kind: z.enum(['success', 'error']),
  resultset: z.record(z.string(), z.unknown()),
});

const validationErrorSchema = z.object({
  detail: z.array(z.object({ msg: z.string() })).min(1),
});

export interface OrangeFetchOptions {
  baseUrl: string;
  apiKey: string;
  fetchImpl?: (url: string, init: RequestInit) => Promise<Response>;
}

export function normalizeOrangeMsisdn(input: string): string | null {
  const digits = input.replace(/\D/g, '');
  let msisdn = digits;
  if (digits.length === 10 && digits.startsWith('0')) {
    msisdn = `231${digits.slice(1)}`;
  } else if (digits.length === 9 && digits.startsWith('7')) {
    msisdn = `231${digits}`;
  }
  if (!/^231\d{9}$/.test(msisdn)) return null;
  return msisdn;
}

export function orangeAmount(amount: number): string | null {
  if (!Number.isFinite(amount) || amount <= 0) return null;
  return amount.toFixed(2);
}

export function orangeCurrency(currency: string): OrangeCurrency | null {
  const upper = currency.toUpperCase();
  if (upper === 'USD' || upper === 'LRD') return upper;
  return null;
}

export function findTxnField(value: unknown, field: string): string | null {
  if (!value || typeof value !== 'object') return null;
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findTxnField(item, field);
      if (found) return found;
    }
    return null;
  }

  for (const [key, nested] of Object.entries(value)) {
    if (
      key.toLowerCase() === field.toLowerCase() &&
      (typeof nested === 'string' || typeof nested === 'number')
    ) {
      const text = String(nested).trim();
      if (text) return text;
    }
    const found = findTxnField(nested, field);
    if (found) return found;
  }
  return null;
}

export function quotedAmountMatches(expected: string, resultset: Record<string, unknown>): boolean {
  const found = findTxnField(resultset, 'amount');
  if (!found) return true;
  const collected = Number(found);
  const quoted = Number(expected);
  if (!Number.isFinite(collected) || !Number.isFinite(quoted)) return false;
  return collected === quoted;
}

export type ParsedPayment =
  { ok: true; txnId: string; execMsg: string } | { ok: false; message: string };

export function parsePaymentResponse(body: unknown): ParsedPayment {
  const validation = validationErrorSchema.safeParse(body);
  if (validation.success) {
    return { ok: false, message: validation.data.detail[0]?.msg ?? 'Invalid payment request.' };
  }

  const parsed = paymentResponseSchema.safeParse(body);
  if (!parsed.success) {
    return { ok: false, message: 'Orange Money returned an unexpected response.' };
  }
  if (parsed.data.exec_kind === 'error') {
    const detail = findTxnField(parsed.data.resultset, 'exectxt');
    return { ok: false, message: detail || parsed.data.exec_msg };
  }

  const txnId = findTxnField(parsed.data.resultset, 'txnid');
  if (!txnId) {
    return { ok: false, message: 'Orange Money did not return a transaction id.' };
  }
  return { ok: true, txnId, execMsg: parsed.data.exec_msg };
}

export function transactionOutcome(status: string): OrangeOutcome {
  if (status === 'TS') return 'PAID';
  if (status === 'TF') return 'FAILED';
  return 'PENDING';
}

export function applyOrangeSettlement(input: {
  subscriptionStatus: SubscriptionStatus;
  invoiceStatus: InvoiceStatus;
  outcome: OrangeOutcome;
}): {
  subscriptionStatus: SubscriptionStatus;
  invoiceStatus: InvoiceStatus;
  changed: boolean;
} {
  const unchanged = {
    subscriptionStatus: input.subscriptionStatus,
    invoiceStatus: input.invoiceStatus,
    changed: false,
  };

  if (input.outcome === 'PENDING') return unchanged;

  if (input.outcome === 'FAILED') {
    if (input.subscriptionStatus === 'ACTIVE' || input.invoiceStatus === 'PAID') return unchanged;
    if (input.invoiceStatus === 'FAILED') return unchanged;
    return {
      subscriptionStatus: input.subscriptionStatus,
      invoiceStatus: 'FAILED',
      changed: true,
    };
  }

  if (input.subscriptionStatus === 'CANCELED' || input.subscriptionStatus === 'EXPIRED') {
    return unchanged;
  }
  if (input.subscriptionStatus === 'ACTIVE' && input.invoiceStatus === 'PAID') return unchanged;

  const nextStatus =
    input.subscriptionStatus === 'PENDING' || input.subscriptionStatus === 'PAST_DUE'
      ? 'ACTIVE'
      : input.subscriptionStatus;

  return {
    subscriptionStatus: nextStatus,
    invoiceStatus: 'PAID',
    changed: nextStatus !== input.subscriptionStatus || input.invoiceStatus !== 'PAID',
  };
}

export function orangeMoneyBaseUrl(): string {
  const configured = process.env.ORANGE_MONEY_BASE_URL;
  if (!configured) return 'https://orangemoney.teeket.app';
  return configured.replace(/\/$/, '');
}

function requestHeaders(apiKey: string): Record<string, string> {
  return {
    accept: 'application/json',
    'content-type': 'application/json',
    'x-api-key': apiKey,
  };
}

async function postOrange(
  path: string,
  payload: Record<string, string>,
  options: OrangeFetchOptions,
): Promise<unknown> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const response = await fetchImpl(`${options.baseUrl}${path}`, {
    method: 'POST',
    headers: requestHeaders(options.apiKey),
    body: JSON.stringify(payload),
  });
  return response.json() as Promise<unknown>;
}

export async function startOrangeCollection(
  input: { msisdn: string; currency: OrangeCurrency; amount: string; externalId: string },
  options: OrangeFetchOptions,
): Promise<ParsedPayment> {
  const body = await postOrange(
    '/collections/subscriber/pay-start',
    {
      msisdn: input.msisdn,
      Currency: input.currency,
      Amount: input.amount,
      ExternalID: input.externalId,
    },
    options,
  );
  return parsePaymentResponse(body);
}

export async function queryOrangeCollectionStatus(
  input: { txnId: string; currency: OrangeCurrency },
  options: OrangeFetchOptions,
): Promise<
  | { ok: true; status: OrangeTxnStatus; resultset: Record<string, unknown> }
  | { ok: false; message: string }
> {
  const body = await postOrange(
    '/collections/subscriber/pay-start/status',
    { TXNID: input.txnId, Currency: input.currency },
    options,
  );
  const parsed = paymentResponseSchema.safeParse(body);
  if (!parsed.success) {
    return { ok: false, message: 'Orange Money returned an unexpected status response.' };
  }
  if (parsed.data.exec_kind === 'error') {
    const detail = findTxnField(parsed.data.resultset, 'exectxt');
    return { ok: false, message: detail || parsed.data.exec_msg };
  }
  const status = findTxnField(parsed.data.resultset, 'txnstatus');
  if (status === 'TS' || status === 'TF' || status === 'TI') {
    return { ok: true, status, resultset: parsed.data.resultset };
  }
  return { ok: true, status: 'TI', resultset: parsed.data.resultset };
}
