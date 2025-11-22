#!/usr/bin/env tsx

import { calculatePaymentBreakdown, buildInvoicePaymentStatus } from './server/utils/invoice-payments';

function assert(condition: any, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

function testPaymentBreakdown() {
  const breakdown = calculatePaymentBreakdown(100, 0.2);
  assert(breakdown.amountInCents === 10000, 'Amount in cents should be 10000 for $100');
  assert(breakdown.applicationFeeAmount === 2000, 'Platform fee should be 20%');
  assert(breakdown.contractorTakeHome === 8000, 'Contractor take home should be remaining amount');
}

function testInvoiceStatusBuild() {
  const successStatus = buildInvoicePaymentStatus({
    success: true,
    totalAmount: 150,
    paymentIntentId: 'pi_test',
    chargeId: 'ch_test',
    transferId: 'tr_test',
    paymentMethodId: 'pm_test',
  });

  assert(successStatus.status === 'paid', 'Successful payment should mark invoice as paid');
  assert(successStatus.amountDue === 0, 'Paid invoice should have zero amount due');
  assert(successStatus.stripePaymentIntentId === 'pi_test', 'Payment intent ID should persist');

  const failureStatus = buildInvoicePaymentStatus({
    success: false,
    totalAmount: 150,
    error: 'Card declined',
  });

  assert(failureStatus.status === 'pending', 'Failed payment should keep invoice pending');
  assert(failureStatus.paymentError?.includes('Card declined'), 'Failure reason should be preserved');
}

try {
  testPaymentBreakdown();
  testInvoiceStatusBuild();
  console.log('✅ Invoice payment helper tests passed');
  process.exit(0);
} catch (error: any) {
  console.error('❌ Invoice payment helper tests failed:', error?.message || error);
  process.exit(1);
}
