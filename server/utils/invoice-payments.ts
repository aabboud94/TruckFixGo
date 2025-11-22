export function calculatePaymentBreakdown(totalAmount: number, platformRate = 0.15) {
  const amountInCents = Math.round(totalAmount * 100);
  const applicationFeeAmount = Math.round(amountInCents * platformRate);
  const contractorTakeHome = amountInCents - applicationFeeAmount;

  return {
    amountInCents,
    applicationFeeAmount,
    contractorTakeHome,
  };
}

export function buildInvoicePaymentStatus({
  success,
  totalAmount,
  paymentIntentId,
  chargeId,
  transferId,
  paymentMethodId,
  error,
}: {
  success: boolean;
  totalAmount: number;
  paymentIntentId?: string;
  chargeId?: string | null;
  transferId?: string | null;
  paymentMethodId?: string | null;
  error?: string;
}) {
  if (success) {
    return {
      status: 'paid' as const,
      paidAt: new Date(),
      paidAmount: totalAmount,
      amountDue: 0,
      paymentError: null,
      stripePaymentIntentId: paymentIntentId,
      stripeChargeId: chargeId || undefined,
      stripeTransferId: transferId || undefined,
      stripePaymentMethodId: paymentMethodId || undefined,
    };
  }

  return {
    status: 'pending' as const,
    paymentError: error || 'Payment could not be completed',
  };
}

