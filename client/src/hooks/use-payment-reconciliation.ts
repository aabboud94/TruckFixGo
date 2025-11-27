import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { format } from 'date-fns';
import type {
  PaymentReconciliation,
  PayoutBatch,
  CommissionTransaction,
  CommissionRule
} from '@shared/schema';

interface ReconciliationData {
  totalRevenue: number;
  totalCommissions: number;
  totalPendingPayouts: number;
  totalCompletedPayouts: number;
  lastProcessedAt: Date;
  status: string;
  transactions?: CommissionTransaction[];
  history?: PaymentReconciliation[];
  disputes?: any[];
}

interface PendingPayout {
  id: string;
  contractorId: string;
  contractorName: string;
  periodStart: string;
  periodEnd: string;
  jobCount: number;
  totalAmount: number;
  commissionAmount: number;
  netAmount: number;
  status: string;
  batchId?: string;
}

export function usePaymentReconciliation(
  periodType: 'daily' | 'weekly' | 'monthly' | 'quarterly',
  selectedDate: Date
) {
  const [reconciliationData, setReconciliationData] = useState<ReconciliationData | null>(null);

  // Fetch reconciliation report
  const { data: report, refetch: refetchReport } = useQuery({
    queryKey: ['/api/payments/reconciliation/report', periodType, format(selectedDate, 'yyyy-MM-dd')],
    queryFn: async () => {
      const response = await fetch(
        `/api/payments/reconciliation/report?periodType=${periodType}&date=${selectedDate.toISOString()}`
      );
      if (!response.ok) throw new Error('Failed to fetch reconciliation report');
      const data = await response.json();
      return data.report;
    }
  });

  // Fetch pending payouts
  const { data: pendingPayouts, refetch: refetchPayouts } = useQuery({
    queryKey: ['/api/payments/payouts/pending'],
    queryFn: async () => {
      const response = await fetch('/api/payments/payouts/pending');
      if (!response.ok) throw new Error('Failed to fetch pending payouts');
      const data = await response.json();
      return data.payouts?.map((payout: PayoutBatch) => ({
        id: payout.id,
        contractorId: payout.contractorId,
        contractorName: `Contractor ${payout.contractorId.slice(0, 8)}`, // Would be fetched from contractor profile
        periodStart: payout.periodStart,
        periodEnd: payout.periodEnd,
        jobCount: payout.jobCount || 0,
        totalAmount: parseFloat(payout.totalAmount),
        commissionAmount: parseFloat(payout.commissionAmount),
        netAmount: parseFloat(payout.netPayoutAmount),
        status: payout.status,
        batchId: payout.id
      })) as PendingPayout[];
    }
  });

  // Process reconciliation mutation
  const processReconciliationMutation = useMutation({
    mutationFn: async ({ periodStart, periodEnd }: { periodStart: Date; periodEnd: Date }) => {
      return await apiRequest('POST', '/api/payments/reconciliation/process', {
        periodType,
        periodStart: periodStart.toISOString(),
        periodEnd: periodEnd.toISOString(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/payments/reconciliation'] });
      queryClient.invalidateQueries({ queryKey: ['/api/payments/payouts/pending'] });
      refetchReport();
      refetchPayouts();
    }
  });

  // Create payout batch mutation
  const createPayoutBatchMutation = useMutation({
    mutationFn: async ({
      contractorId,
      periodStart,
      periodEnd,
      reconciliationId
    }: {
      contractorId: string;
      periodStart: Date;
      periodEnd: Date;
      reconciliationId?: string;
    }) => {
      return await apiRequest('POST', '/api/payments/payouts/batch', {
        contractorId,
        periodStart: periodStart.toISOString(),
        periodEnd: periodEnd.toISOString(),
        reconciliationId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/payments/payouts/pending'] });
      refetchPayouts();
    }
  });

  // Process payout batch mutation
  const processPayoutBatchMutation = useMutation({
    mutationFn: async ({
      batchId,
      paymentMethod,
      paymentReference
    }: {
      batchId: string;
      paymentMethod: string;
      paymentReference?: string;
    }) => {
      return await apiRequest('POST', `/api/payments/payouts/batch/${batchId}/process`, {
        paymentMethod,
        paymentReference,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/payments/payouts/pending'] });
      refetchPayouts();
    }
  });

  // Download report function
  const downloadReport = async () => {
    try {
      const response = await fetch(
        `/api/payments/reconciliation/report?periodType=${periodType}&format=csv`
      );
      if (!response.ok) throw new Error('Failed to download report');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `reconciliation_${periodType}_${format(selectedDate, 'yyyy-MM-dd')}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  // Update reconciliation data when report changes
  useEffect(() => {
    if (report && report.length > 0) {
      const latest = report[0];
      const totalRevenue = report.reduce((sum: number, r: any) => sum + parseFloat(r.totalRevenue || 0), 0);
      const totalCommissions = report.reduce((sum: number, r: any) => sum + parseFloat(r.totalCommissions || 0), 0);
      const totalPayouts = report.reduce((sum: number, r: any) => sum + parseFloat(r.totalPayouts || 0), 0);
      
      setReconciliationData({
        totalRevenue,
        totalCommissions,
        totalPendingPayouts: totalPayouts * 0.3, // Estimate pending
        totalCompletedPayouts: totalPayouts * 0.7, // Estimate completed
        lastProcessedAt: new Date(latest.createdAt),
        status: latest.status,
        history: report
      });
    }
  }, [report]);

  return {
    reconciliationData,
    pendingPayouts,
    isProcessing: processReconciliationMutation.isPending,
    processReconciliation: (periodStart: Date, periodEnd: Date) => 
      processReconciliationMutation.mutateAsync({ periodStart, periodEnd }),
    createPayoutBatch: (contractorId: string, periodStart: Date, periodEnd: Date, reconciliationId?: string) =>
      createPayoutBatchMutation.mutateAsync({ contractorId, periodStart, periodEnd, reconciliationId }),
    processPayoutBatch: (batchId: string, paymentMethod: string, paymentReference?: string) =>
      processPayoutBatchMutation.mutateAsync({ batchId, paymentMethod, paymentReference }),
    downloadReport
  };
}

// Hook for managing commission rules
export function useCommissionRules() {
  const { data: rules, isLoading } = useQuery({
    queryKey: ['/api/payments/commissions/rules'],
    queryFn: async () => {
      const response = await fetch('/api/payments/commissions/rules');
      if (!response.ok) throw new Error('Failed to fetch commission rules');
      const data = await response.json();
      return data.rules as CommissionRule[];
    }
  });

  const createRuleMutation = useMutation({
    mutationFn: async (rule: Partial<CommissionRule>) => {
      return await apiRequest('POST', '/api/payments/commissions/rules', rule);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/payments/commissions/rules'] });
    }
  });

  const updateRuleMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<CommissionRule> }) => {
      return await apiRequest('PUT', `/api/payments/commissions/rules/${id}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/payments/commissions/rules'] });
    }
  });

  const deleteRuleMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest(`/api/payments/commissions/rules/${id}`, {
        method: 'DELETE'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/payments/commissions/rules'] });
    }
  });

  return {
    rules,
    isLoading,
    createRule: createRuleMutation.mutateAsync,
    updateRule: (id: string, updates: Partial<CommissionRule>) => 
      updateRuleMutation.mutateAsync({ id, updates }),
    deleteRule: deleteRuleMutation.mutateAsync
  };
}

// Hook for contractor earnings
export function useContractorEarnings(contractorId: string | undefined) {
  const { data: earnings, isLoading } = useQuery({
    queryKey: ['/api/payments/contractor', contractorId, 'earnings'],
    enabled: !!contractorId,
    queryFn: async () => {
      if (!contractorId) return null;
      const response = await fetch(`/api/payments/contractor/${contractorId}/earnings`);
      if (!response.ok) throw new Error('Failed to fetch contractor earnings');
      const data = await response.json();
      return data.earnings;
    }
  });

  const { data: monthlyVolume } = useQuery({
    queryKey: ['/api/payments/contractor', contractorId, 'volume'],
    enabled: !!contractorId,
    queryFn: async () => {
      if (!contractorId) return 0;
      // This would be a separate endpoint or part of earnings
      return 0; // Placeholder
    }
  });

  // Calculate tier based on monthly volume
  const getTier = (volume: number): 'bronze' | 'silver' | 'gold' => {
    if (volume >= 50000) return 'gold';
    if (volume >= 20000) return 'silver';
    return 'bronze';
  };

  return {
    earnings,
    isLoading,
    monthlyVolume,
    tier: getTier(monthlyVolume || 0),
    totalEarnings: earnings?.totalEarnings || 0,
    totalCommissions: earnings?.totalCommissions || 0,
    netPayout: earnings?.netPayout || 0,
    pendingPayouts: earnings?.pendingPayouts || 0,
    completedPayouts: earnings?.completedPayouts || 0,
    transactions: earnings?.transactions || []
  };
}
