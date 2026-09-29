'use server';

import { getSession } from '@/lib/auth';
import { getSubscriptionByOwner } from '@/lib/mock-data/subscriptions';
import {
  syncStoredOrangePayment,
  type OrangeSyncResult,
} from '@/lib/payments/collect-orange-money';

export async function refreshOrangeMoneyPayment(
  ownerType: 'USER' | 'INSTITUTION',
  ownerId: string,
): Promise<OrangeSyncResult> {
  const session = await getSession();
  if (!session) {
    return { success: false, message: 'Sign in to check the payment.', status: 'PENDING' };
  }
  if (ownerType === 'USER' && ownerId !== session.user.id) {
    return {
      success: false,
      message: 'You can only check your own subscription.',
      status: 'FAILED',
    };
  }
  if (
    ownerType === 'INSTITUTION' &&
    (session.user.role !== 'INSTITUTION_ADMIN' || session.user.institutionId !== ownerId)
  ) {
    return {
      success: false,
      message: 'Only your institution administrator can check this payment.',
      status: 'FAILED',
    };
  }

  const subscription = await getSubscriptionByOwner(ownerType, ownerId);
  if (!subscription || subscription.paymentMethodType !== 'ORANGE_MONEY') {
    return {
      success: false,
      message: 'No payment is waiting.',
      status: 'FAILED',
    };
  }

  return syncStoredOrangePayment(subscription.id);
}
