export type SubscribeDialogPhase = 'form' | 'pending' | 'success' | 'error';

export function phaseAfterSubscribeStart(result: {
  success: boolean;
  awaitingApproval?: boolean;
  message: string;
}): { phase: SubscribeDialogPhase; message: string } {
  if (result.success && result.awaitingApproval) {
    return { phase: 'pending', message: result.message };
  }
  if (!result.success) {
    return { phase: 'error', message: result.message };
  }
  return { phase: 'success', message: result.message };
}

export function phaseAfterPaymentCheck(result: {
  success: boolean;
  status: 'ACTIVE' | 'PENDING' | 'FAILED';
  message: string;
}): { phase: SubscribeDialogPhase; message: string } {
  if (result.status === 'ACTIVE') {
    return { phase: 'success', message: result.message };
  }
  if (result.status === 'FAILED') {
    return { phase: 'error', message: result.message };
  }
  return { phase: 'pending', message: result.message };
}
