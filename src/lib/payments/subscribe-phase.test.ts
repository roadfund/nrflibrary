import { describe, expect, it } from 'vitest';
import { phaseAfterPaymentCheck, phaseAfterSubscribeStart } from './subscribe-phase';

describe('phaseAfterSubscribeStart', () => {
  it('moves to pending when Orange Money is waiting for phone approval', () => {
    expect(
      phaseAfterSubscribeStart({
        success: true,
        awaitingApproval: true,
        message: 'Approve the payment prompt on your Orange Money phone.',
      }),
    ).toEqual({
      phase: 'pending',
      message: 'Approve the payment prompt on your Orange Money phone.',
    });
  });

  it('shows an error when the payment cannot start', () => {
    expect(
      phaseAfterSubscribeStart({
        success: false,
        message: 'Enter an Orange Money number, for example 0776 123 456.',
      }),
    ).toEqual({
      phase: 'error',
      message: 'Enter an Orange Money number, for example 0776 123 456.',
    });
  });
});

describe('phaseAfterPaymentCheck', () => {
  it('shows success once the subscription is active', () => {
    expect(
      phaseAfterPaymentCheck({
        success: true,
        status: 'ACTIVE',
        message: 'Payment received. Your subscription is active.',
      }).phase,
    ).toBe('success');
  });

  it('stays pending while the phone prompt is unanswered', () => {
    expect(
      phaseAfterPaymentCheck({
        success: true,
        status: 'PENDING',
        message: 'Waiting for approval on your phone.',
      }).phase,
    ).toBe('pending');
  });

  it('shows an error when Orange Money declines the payment', () => {
    expect(
      phaseAfterPaymentCheck({
        success: false,
        status: 'FAILED',
        message: 'Orange Money declined the payment. You can try again.',
      }).phase,
    ).toBe('error');
  });
});
