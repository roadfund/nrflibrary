import { describe, expect, it } from 'vitest';
import {
  applyOrangeSettlement,
  findTxnField,
  normalizeOrangeMsisdn,
  orangeAmount,
  orangeCurrency,
  parsePaymentResponse,
  queryOrangeCollectionStatus,
  quotedAmountMatches,
  startOrangeCollection,
  transactionOutcome,
} from './orange-money';

describe('normalizeOrangeMsisdn', () => {
  it('turns a local Liberian number into a 12-digit MSISDN', () => {
    expect(normalizeOrangeMsisdn('0776 123 456')).toBe('231776123456');
  });

  it('keeps an international MSISDN that is already 12 digits', () => {
    expect(normalizeOrangeMsisdn('+231776123456')).toBe('231776123456');
  });

  it('rejects numbers the API will not accept', () => {
    expect(normalizeOrangeMsisdn('123')).toBeNull();
    expect(normalizeOrangeMsisdn('231000')).toBeNull();
  });
});

describe('orangeAmount and currency', () => {
  it('sends a positive amount with two decimal places', () => {
    expect(orangeAmount(25)).toBe('25.00');
    expect(orangeAmount(10.5)).toBe('10.50');
    expect(orangeAmount(0)).toBeNull();
    expect(orangeAmount(Number.NaN)).toBeNull();
  });

  it('accepts only USD and LRD', () => {
    expect(orangeCurrency('USD')).toBe('USD');
    expect(orangeCurrency('lrd')).toBe('LRD');
    expect(orangeCurrency('EUR')).toBeNull();
  });
});

describe('parsePaymentResponse', () => {
  it('reads a transaction id from the result set', () => {
    const parsed = parsePaymentResponse({
      exec_code: 0,
      exec_msg: 'ok',
      exec_kind: 'success',
      resultset: { TXNID: 'TX-1' },
    });
    expect(parsed).toEqual({ ok: true, txnId: 'TX-1', execMsg: 'ok' });
  });

  it('finds a nested transaction id', () => {
    expect(findTxnField({ data: { txnid: 'TX-2' } }, 'txnid')).toBe('TX-2');
  });

  it('surfaces gateway validation and execution errors', () => {
    expect(
      parsePaymentResponse({
        exec_code: -1015,
        exec_msg: 'MSISDN is not an Orange Number',
        exec_kind: 'error',
        resultset: {},
      }),
    ).toEqual({ ok: false, message: 'MSISDN is not an Orange Number' });

    expect(parsePaymentResponse({ detail: [{ msg: 'Field required' }] })).toEqual({
      ok: false,
      message: 'Field required',
    });
  });

  it('rejects a success response that has no transaction id', () => {
    expect(
      parsePaymentResponse({
        exec_code: 0,
        exec_msg: 'ok',
        exec_kind: 'success',
        resultset: {},
      }),
    ).toEqual({ ok: false, message: 'The payment could not be started. Try again.' });
  });
});

describe('transactionOutcome', () => {
  it('maps Orange status codes', () => {
    expect(transactionOutcome('TS')).toBe('PAID');
    expect(transactionOutcome('TF')).toBe('FAILED');
    expect(transactionOutcome('TI')).toBe('PENDING');
    expect(transactionOutcome('NOPE')).toBe('PENDING');
  });
});

describe('applyOrangeSettlement', () => {
  it('activates a pending subscription and marks the invoice paid', () => {
    expect(
      applyOrangeSettlement({
        subscriptionStatus: 'PENDING',
        invoiceStatus: 'OPEN',
        outcome: 'PAID',
      }),
    ).toEqual({
      subscriptionStatus: 'ACTIVE',
      invoiceStatus: 'PAID',
      changed: true,
    });
  });

  it('is a no-op when the same success is applied twice', () => {
    expect(
      applyOrangeSettlement({
        subscriptionStatus: 'ACTIVE',
        invoiceStatus: 'PAID',
        outcome: 'PAID',
      }),
    ).toEqual({
      subscriptionStatus: 'ACTIVE',
      invoiceStatus: 'PAID',
      changed: false,
    });
  });

  it('marks an open invoice failed without closing an active subscription', () => {
    expect(
      applyOrangeSettlement({
        subscriptionStatus: 'PENDING',
        invoiceStatus: 'OPEN',
        outcome: 'FAILED',
      }),
    ).toEqual({
      subscriptionStatus: 'PENDING',
      invoiceStatus: 'FAILED',
      changed: true,
    });

    expect(
      applyOrangeSettlement({
        subscriptionStatus: 'ACTIVE',
        invoiceStatus: 'PAID',
        outcome: 'FAILED',
      }).subscriptionStatus,
    ).toBe('ACTIVE');
  });

  it('leaves an in-progress payment unchanged', () => {
    expect(
      applyOrangeSettlement({
        subscriptionStatus: 'PENDING',
        invoiceStatus: 'OPEN',
        outcome: 'PENDING',
      }).changed,
    ).toBe(false);
  });
});

describe('quotedAmountMatches', () => {
  it('accepts the same amount in a different decimal form and rejects a different charge', () => {
    expect(quotedAmountMatches('15.00', { Amount: '15' })).toBe(true);
    expect(quotedAmountMatches('15.00', {})).toBe(true);
    expect(quotedAmountMatches('15.00', { Amount: '1.00' })).toBe(false);
  });
});

describe('queryOrangeCollectionStatus', () => {
  it('posts the stored transaction id and reads the status code', async () => {
    const result = await queryOrangeCollectionStatus(
      { txnId: 'TX-9', currency: 'USD' },
      {
        baseUrl: 'https://orangemoney.teeket.app',
        apiKey: 'test-key',
        fetchImpl: async () =>
          new Response(
            JSON.stringify({
              exec_code: 0,
              exec_msg: 'ok',
              exec_kind: 'success',
              resultset: { TXNStatus: 'TS', Amount: '15.00' },
            }),
            { status: 200 },
          ),
      },
    );

    expect(result).toEqual({
      ok: true,
      status: 'TS',
      resultset: { TXNStatus: 'TS', Amount: '15.00' },
    });
  });
});

describe('startOrangeCollection', () => {
  it('posts the pay-start payload and returns the transaction id', async () => {
    const calls: Array<{ url: string; body: unknown; apiKey: string | null }> = [];
    const result = await startOrangeCollection(
      {
        msisdn: '231776123456',
        currency: 'USD',
        amount: '15.00',
        externalId: 'inv_1',
      },
      {
        baseUrl: 'https://orangemoney.teeket.app',
        apiKey: 'test-key',
        fetchImpl: async (url, init) => {
          const headers = new Headers(init?.headers);
          calls.push({
            url: String(url),
            body: JSON.parse(String(init?.body)),
            apiKey: headers.get('x-api-key'),
          });
          return new Response(
            JSON.stringify({
              exec_code: 0,
              exec_msg: 'Prompt sent',
              exec_kind: 'success',
              resultset: { TXNID: 'TX-9' },
            }),
            { status: 200, headers: { 'content-type': 'application/json' } },
          );
        },
      },
    );

    expect(calls[0]?.url).toBe('https://orangemoney.teeket.app/collections/subscriber/pay-start');
    expect(calls[0]?.body).toEqual({
      msisdn: '231776123456',
      Currency: 'USD',
      Amount: '15.00',
      ExternalID: 'inv_1',
    });
    expect(calls[0]?.apiKey).toBe('test-key');
    expect(result).toEqual({ ok: true, txnId: 'TX-9', execMsg: 'Prompt sent' });
  });
});
