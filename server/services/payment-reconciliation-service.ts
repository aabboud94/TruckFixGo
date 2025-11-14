import { db } from "../db";
import { 
  commissionRules, 
  commissionTransactions, 
  paymentReconciliation,
  payoutBatches,
  jobs,
  contractorProfiles,
  transactions,
  refunds,
  type CommissionRule,
  type CommissionTransaction,
  type PaymentReconciliation,
  type PayoutBatch,
  type Job,
  type InsertCommissionTransaction,
  type InsertPaymentReconciliation,
  type InsertPayoutBatch,
  type InsertCommissionRule,
  commissionStatusEnum,
  reconciliationStatusEnum,
  payoutBatchStatusEnum,
  reconciliationPeriodEnum
} from "@shared/schema";
import { 
  eq, 
  and, 
  gte, 
  lte, 
  between, 
  sql, 
  desc, 
  asc,
  isNull,
  ne,
  inArray
} from "drizzle-orm";
import pdfService from "../pdf-service";
import { emailService } from "./email-service";
import csvService from "../csv-service";

class PaymentReconciliationService {
  // Default commission rate (15% platform fee, 85% contractor payout)
  private readonly DEFAULT_PLATFORM_COMMISSION = 0.15;
  private readonly DEFAULT_CONTRACTOR_SHARE = 0.85;

  /**
   * Get applicable commission rule for a transaction
   */
  async getApplicableRule(
    userType: 'contractor' | 'fleet',
    amount: number,
    monthlyVolume?: number,
    surgeMultiplier?: number
  ): Promise<CommissionRule | null> {
    try {
      const now = new Date();
      
      // Find active rules matching criteria, ordered by priority
      const rules = await db
        .select()
        .from(commissionRules)
        .where(
          and(
            eq(commissionRules.userType, userType),
            eq(commissionRules.isActive, true),
            lte(commissionRules.effectiveFrom, now),
            sql`${commissionRules.effectiveTo} IS NULL OR ${commissionRules.effectiveTo} >= ${now}`,
            gte(commissionRules.minAmount, amount),
            sql`${commissionRules.maxAmount} IS NULL OR ${commissionRules.maxAmount} <= ${amount}`
          )
        )
        .orderBy(desc(commissionRules.priority), asc(commissionRules.commissionPercentage));

      // Filter by monthly volume if provided
      if (monthlyVolume !== undefined && rules.length > 0) {
        const volumeMatchingRules = rules.filter(rule => {
          const minVol = parseFloat(rule.minMonthlyVolume || '0');
          const maxVol = rule.maxMonthlyVolume ? parseFloat(rule.maxMonthlyVolume) : Infinity;
          return monthlyVolume >= minVol && monthlyVolume <= maxVol;
        });
        
        if (volumeMatchingRules.length > 0) {
          return volumeMatchingRules[0];
        }
      }

      return rules.length > 0 ? rules[0] : null;
    } catch (error) {
      console.error('Error getting applicable commission rule:', error);
      return null;
    }
  }

  /**
   * Calculate commission for a job
   */
  async calculateCommission(
    jobId: string,
    contractorId: string,
    baseAmount: number,
    surgeMultiplier: number = 1.0
  ): Promise<InsertCommissionTransaction> {
    try {
      // Get contractor's monthly volume for tier calculation
      const monthlyVolume = await this.getContractorMonthlyVolume(contractorId);
      
      // Get applicable commission rule
      const rule = await this.getApplicableRule(
        'contractor',
        baseAmount,
        monthlyVolume,
        surgeMultiplier
      );

      let commissionRate: number;
      let flatFee: number;
      
      if (rule) {
        commissionRate = parseFloat(rule.commissionPercentage) / 100;
        flatFee = parseFloat(rule.flatFee || '0');
        
        // Apply surge multiplier to commission if applicable
        if (surgeMultiplier > 1 && rule.surgeMultiplier) {
          const adjustedRate = commissionRate * parseFloat(rule.surgeMultiplier);
          const surgeCap = rule.surgeCap ? parseFloat(rule.surgeCap) : null;
          
          // Apply surge cap if defined
          if (surgeCap && (baseAmount * adjustedRate) > surgeCap) {
            commissionRate = surgeCap / baseAmount;
          } else {
            commissionRate = adjustedRate;
          }
        }
      } else {
        // Use default commission rates
        commissionRate = this.DEFAULT_PLATFORM_COMMISSION;
        flatFee = 0;
      }

      // Calculate amounts
      const platformCommission = (baseAmount * commissionRate) + flatFee;
      const netPayout = baseAmount - platformCommission;

      return {
        jobId,
        contractorId,
        ruleId: rule?.id || null,
        baseAmount: baseAmount.toFixed(2),
        commissionAmount: platformCommission.toFixed(2),
        platformFeeAmount: platformCommission.toFixed(2),
        netPayoutAmount: netPayout.toFixed(2),
        commissionRate: (commissionRate * 100).toFixed(2),
        flatFeeApplied: flatFee.toFixed(2),
        surgeMultiplierApplied: surgeMultiplier.toFixed(2),
        status: 'calculated',
        calculatedAt: new Date(),
        isDisputed: false,
        adjustmentAmount: '0'
      };
    } catch (error) {
      console.error('Error calculating commission:', error);
      throw error;
    }
  }

  /**
   * Get contractor's monthly volume for tier calculation
   */
  private async getContractorMonthlyVolume(contractorId: string): Promise<number> {
    try {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const result = await db
        .select({
          totalVolume: sql<number>`COALESCE(SUM(CAST(${commissionTransactions.baseAmount} AS DECIMAL)), 0)`
        })
        .from(commissionTransactions)
        .where(
          and(
            eq(commissionTransactions.contractorId, contractorId),
            gte(commissionTransactions.createdAt, startOfMonth),
            ne(commissionTransactions.status, 'disputed')
          )
        );

      return result[0]?.totalVolume || 0;
    } catch (error) {
      console.error('Error getting contractor monthly volume:', error);
      return 0;
    }
  }

  /**
   * Process reconciliation for a specific period
   */
  async processReconciliation(
    periodType: 'daily' | 'weekly' | 'monthly' | 'quarterly',
    periodStart: Date,
    periodEnd: Date,
    createdBy?: string
  ): Promise<PaymentReconciliation> {
    try {
      // Check if reconciliation already exists for this period
      const existing = await db
        .select()
        .from(paymentReconciliation)
        .where(
          and(
            eq(paymentReconciliation.periodType, periodType),
            eq(paymentReconciliation.periodStart, periodStart),
            eq(paymentReconciliation.periodEnd, periodEnd)
          )
        )
        .limit(1);

      if (existing.length > 0 && existing[0].status === 'completed') {
        throw new Error('Reconciliation already completed for this period');
      }

      // Create or update reconciliation record
      const reconciliationData: InsertPaymentReconciliation = {
        periodType,
        periodStart,
        periodEnd,
        totalRevenue: '0',
        totalCommissions: '0',
        totalPlatformFees: '0',
        totalPayouts: '0',
        totalAdjustments: '0',
        totalRefunds: '0',
        jobCount: 0,
        transactionCount: 0,
        contractorCount: 0,
        status: 'processing',
        startedAt: new Date(),
        createdBy
      };

      const [reconciliation] = existing.length > 0
        ? await db
            .update(paymentReconciliation)
            .set({ ...reconciliationData, startedAt: new Date() })
            .where(eq(paymentReconciliation.id, existing[0].id))
            .returning()
        : await db
            .insert(paymentReconciliation)
            .values(reconciliationData)
            .returning();

      try {
        // Get all completed jobs in the period
        const completedJobs = await db
          .select()
          .from(jobs)
          .where(
            and(
              eq(jobs.status, 'completed'),
              between(jobs.completedAt, periodStart, periodEnd)
            )
          );

        // Get all transactions in the period
        const periodTransactions = await db
          .select()
          .from(transactions)
          .where(
            and(
              eq(transactions.status, 'completed'),
              between(transactions.createdAt, periodStart, periodEnd)
            )
          );

        // Get refunds in the period
        const periodRefunds = await db
          .select({
            totalRefunds: sql<number>`COALESCE(SUM(CAST(${refunds.amount} AS DECIMAL)), 0)`
          })
          .from(refunds)
          .where(
            and(
              eq(refunds.status, 'processed'),
              between(refunds.processedAt, periodStart, periodEnd)
            )
          );

        // Calculate totals
        let totalRevenue = 0;
        let totalCommissions = 0;
        let totalPlatformFees = 0;
        let totalPayouts = 0;
        let totalAdjustments = 0;
        const contractorIds = new Set<string>();

        // Process each job and create/update commission transactions
        for (const job of completedJobs) {
          if (!job.finalAmount || !job.contractorId) continue;
          
          const jobAmount = parseFloat(job.finalAmount);
          contractorIds.add(job.contractorId);

          // Check if commission transaction exists
          const existingCommission = await db
            .select()
            .from(commissionTransactions)
            .where(eq(commissionTransactions.jobId, job.id))
            .limit(1);

          let commission: CommissionTransaction;
          
          if (existingCommission.length === 0) {
            // Calculate and create new commission transaction
            const surgeMultiplier = job.surgeMultiplier ? parseFloat(job.surgeMultiplier) : 1.0;
            const commissionData = await this.calculateCommission(
              job.id,
              job.contractorId,
              jobAmount,
              surgeMultiplier
            );
            
            commissionData.reconciliationId = reconciliation.id;
            
            [commission] = await db
              .insert(commissionTransactions)
              .values(commissionData)
              .returning();
          } else {
            commission = existingCommission[0];
            
            // Update reconciliation reference
            await db
              .update(commissionTransactions)
              .set({ reconciliationId: reconciliation.id })
              .where(eq(commissionTransactions.id, commission.id));
          }

          // Add to totals
          totalRevenue += jobAmount;
          totalCommissions += parseFloat(commission.commissionAmount);
          totalPlatformFees += parseFloat(commission.platformFeeAmount);
          totalPayouts += parseFloat(commission.netPayoutAmount);
          totalAdjustments += parseFloat(commission.adjustmentAmount || '0');
        }

        // Update reconciliation with calculated totals
        const updatedReconciliation = await db
          .update(paymentReconciliation)
          .set({
            totalRevenue: totalRevenue.toFixed(2),
            totalCommissions: totalCommissions.toFixed(2),
            totalPlatformFees: totalPlatformFees.toFixed(2),
            totalPayouts: totalPayouts.toFixed(2),
            totalAdjustments: totalAdjustments.toFixed(2),
            totalRefunds: periodRefunds[0]?.totalRefunds?.toFixed(2) || '0',
            jobCount: completedJobs.length,
            transactionCount: periodTransactions.length,
            contractorCount: contractorIds.size,
            status: 'completed',
            completedAt: new Date(),
            reconciledAt: new Date()
          })
          .where(eq(paymentReconciliation.id, reconciliation.id))
          .returning();

        // Generate reconciliation report
        await this.generateReconciliationReport(updatedReconciliation[0]);

        return updatedReconciliation[0];
      } catch (error) {
        // Update reconciliation status to failed
        await db
          .update(paymentReconciliation)
          .set({
            status: 'failed',
            errorMessage: error instanceof Error ? error.message : 'Unknown error',
            retryCount: sql`${paymentReconciliation.retryCount} + 1`
          })
          .where(eq(paymentReconciliation.id, reconciliation.id));
        
        throw error;
      }
    } catch (error) {
      console.error('Error processing reconciliation:', error);
      throw error;
    }
  }

  /**
   * Create payout batch for a contractor
   */
  async createPayoutBatch(
    contractorId: string,
    periodStart: Date,
    periodEnd: Date,
    reconciliationId?: string,
    createdBy?: string
  ): Promise<PayoutBatch> {
    try {
      // Get all commission transactions for the contractor in the period
      const commissions = await db
        .select()
        .from(commissionTransactions)
        .where(
          and(
            eq(commissionTransactions.contractorId, contractorId),
            between(commissionTransactions.createdAt, periodStart, periodEnd),
            eq(commissionTransactions.status, 'calculated')
          )
        );

      if (commissions.length === 0) {
        throw new Error('No commission transactions found for this period');
      }

      // Calculate batch totals
      let totalAmount = 0;
      let commissionAmount = 0;
      let adjustmentAmount = 0;
      const jobIds: string[] = [];

      for (const commission of commissions) {
        totalAmount += parseFloat(commission.netPayoutAmount);
        commissionAmount += parseFloat(commission.commissionAmount);
        adjustmentAmount += parseFloat(commission.adjustmentAmount || '0');
        jobIds.push(commission.jobId);
      }

      const netPayoutAmount = totalAmount - adjustmentAmount;

      // Generate batch number
      const batchNumber = `BATCH-${Date.now()}-${contractorId.substring(0, 8)}`;

      // Determine period type
      const daysDiff = Math.ceil((periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24));
      let periodType: 'daily' | 'weekly' | 'monthly' | 'quarterly';
      
      if (daysDiff <= 1) {
        periodType = 'daily';
      } else if (daysDiff <= 7) {
        periodType = 'weekly';
      } else if (daysDiff <= 31) {
        periodType = 'monthly';
      } else {
        periodType = 'quarterly';
      }

      // Create payout batch
      const batchData: InsertPayoutBatch = {
        batchNumber,
        contractorId,
        reconciliationId,
        periodType,
        periodStart,
        periodEnd,
        totalAmount: totalAmount.toFixed(2),
        commissionAmount: commissionAmount.toFixed(2),
        adjustmentAmount: adjustmentAmount.toFixed(2),
        netPayoutAmount: netPayoutAmount.toFixed(2),
        jobCount: jobIds.length,
        jobIds: jobIds,
        status: 'pending',
        retryCount: 0,
        createdBy
      };

      const [batch] = await db
        .insert(payoutBatches)
        .values(batchData)
        .returning();

      // Update commission transactions with batch reference
      await db
        .update(commissionTransactions)
        .set({
          payoutBatchId: batch.id,
          status: 'approved',
          approvedAt: new Date()
        })
        .where(
          and(
            eq(commissionTransactions.contractorId, contractorId),
            inArray(commissionTransactions.jobId, jobIds)
          )
        );

      return batch;
    } catch (error) {
      console.error('Error creating payout batch:', error);
      throw error;
    }
  }

  /**
   * Process payout batch
   */
  async processPayoutBatch(batchId: string, paymentMethod: string, paymentReference?: string): Promise<PayoutBatch> {
    try {
      const [batch] = await db
        .select()
        .from(payoutBatches)
        .where(eq(payoutBatches.id, batchId))
        .limit(1);

      if (!batch) {
        throw new Error('Payout batch not found');
      }

      if (batch.status !== 'pending' && batch.status !== 'failed') {
        throw new Error(`Cannot process batch in ${batch.status} status`);
      }

      // Update batch status to processing
      await db
        .update(payoutBatches)
        .set({
          status: 'processing',
          processedAt: new Date(),
          paymentMethod,
          paymentReference
        })
        .where(eq(payoutBatches.id, batchId));

      try {
        // Here you would integrate with actual payment provider (Stripe, bank transfer, etc.)
        // For now, we'll simulate successful payment
        
        // Update batch status to completed
        const [completedBatch] = await db
          .update(payoutBatches)
          .set({
            status: 'completed',
            paidAt: new Date()
          })
          .where(eq(payoutBatches.id, batchId))
          .returning();

        // Update commission transactions as paid
        if (batch.jobIds && Array.isArray(batch.jobIds)) {
          await db
            .update(commissionTransactions)
            .set({
              status: 'paid',
              paidAt: new Date()
            })
            .where(
              and(
                eq(commissionTransactions.payoutBatchId, batchId),
                inArray(commissionTransactions.jobId, batch.jobIds as string[])
              )
            );
        }

        // Send notification to contractor
        // await emailService.sendPayoutNotification(batch.contractorId, completedBatch);

        return completedBatch;
      } catch (error) {
        // Update batch status to failed
        await db
          .update(payoutBatches)
          .set({
            status: 'failed',
            failedAt: new Date(),
            failureReason: error instanceof Error ? error.message : 'Payment processing failed',
            retryCount: sql`${payoutBatches.retryCount} + 1`,
            lastRetryAt: new Date()
          })
          .where(eq(payoutBatches.id, batchId));
        
        throw error;
      }
    } catch (error) {
      console.error('Error processing payout batch:', error);
      throw error;
    }
  }

  /**
   * Generate reconciliation report
   */
  private async generateReconciliationReport(reconciliation: PaymentReconciliation): Promise<void> {
    try {
      // Get detailed data for report
      const commissions = await db
        .select({
          commission: commissionTransactions,
          job: jobs
        })
        .from(commissionTransactions)
        .leftJoin(jobs, eq(commissionTransactions.jobId, jobs.id))
        .where(eq(commissionTransactions.reconciliationId, reconciliation.id));

      // Generate CSV report
      const csvData = await csvService.generateReconciliationCSV(reconciliation, commissions);
      const csvFileName = `reconciliation_${reconciliation.periodType}_${reconciliation.periodStart.toISOString().split('T')[0]}.csv`;
      const csvPath = await csvService.saveCSV(csvData, csvFileName);

      // Generate PDF report
      const pdfData = await pdfService.generateReconciliationPDF(reconciliation, commissions);
      const pdfFileName = `reconciliation_${reconciliation.periodType}_${reconciliation.periodStart.toISOString().split('T')[0]}.pdf`;
      const pdfPath = await pdfService.savePDF(pdfData, pdfFileName);

      // Update reconciliation with report URLs
      await db
        .update(paymentReconciliation)
        .set({
          reportUrl: pdfPath,
          csvExportUrl: csvPath,
          reportGeneratedAt: new Date()
        })
        .where(eq(paymentReconciliation.id, reconciliation.id));
    } catch (error) {
      console.error('Error generating reconciliation report:', error);
    }
  }

  /**
   * Get reconciliation report
   */
  async getReconciliationReport(
    periodType?: 'daily' | 'weekly' | 'monthly' | 'quarterly',
    startDate?: Date,
    endDate?: Date,
    status?: string
  ): Promise<PaymentReconciliation[]> {
    try {
      let query = db.select().from(paymentReconciliation);
      const conditions = [];

      if (periodType) {
        conditions.push(eq(paymentReconciliation.periodType, periodType));
      }
      
      if (startDate && endDate) {
        conditions.push(
          and(
            gte(paymentReconciliation.periodStart, startDate),
            lte(paymentReconciliation.periodEnd, endDate)
          )
        );
      }
      
      if (status) {
        conditions.push(eq(paymentReconciliation.status, status as any));
      }

      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }

      return await query.orderBy(desc(paymentReconciliation.periodStart));
    } catch (error) {
      console.error('Error getting reconciliation report:', error);
      throw error;
    }
  }

  /**
   * Get pending payouts
   */
  async getPendingPayouts(contractorId?: string): Promise<PayoutBatch[]> {
    try {
      const conditions = [
        eq(payoutBatches.status, 'pending')
      ];

      if (contractorId) {
        conditions.push(eq(payoutBatches.contractorId, contractorId));
      }

      return await db
        .select()
        .from(payoutBatches)
        .where(and(...conditions))
        .orderBy(desc(payoutBatches.createdAt));
    } catch (error) {
      console.error('Error getting pending payouts:', error);
      throw error;
    }
  }

  /**
   * Get contractor earnings
   */
  async getContractorEarnings(
    contractorId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<{
    totalEarnings: number;
    totalCommissions: number;
    netPayout: number;
    pendingPayouts: number;
    completedPayouts: number;
    transactions: CommissionTransaction[];
  }> {
    try {
      const conditions = [
        eq(commissionTransactions.contractorId, contractorId)
      ];

      if (startDate && endDate) {
        conditions.push(
          between(commissionTransactions.createdAt, startDate, endDate)
        );
      }

      const transactions = await db
        .select()
        .from(commissionTransactions)
        .where(and(...conditions))
        .orderBy(desc(commissionTransactions.createdAt));

      // Calculate totals
      let totalEarnings = 0;
      let totalCommissions = 0;
      let netPayout = 0;
      let pendingPayouts = 0;
      let completedPayouts = 0;

      for (const transaction of transactions) {
        totalEarnings += parseFloat(transaction.baseAmount);
        totalCommissions += parseFloat(transaction.commissionAmount);
        netPayout += parseFloat(transaction.netPayoutAmount);

        if (transaction.status === 'paid') {
          completedPayouts += parseFloat(transaction.netPayoutAmount);
        } else if (transaction.status === 'approved' || transaction.status === 'calculated') {
          pendingPayouts += parseFloat(transaction.netPayoutAmount);
        }
      }

      return {
        totalEarnings,
        totalCommissions,
        netPayout,
        pendingPayouts,
        completedPayouts,
        transactions
      };
    } catch (error) {
      console.error('Error getting contractor earnings:', error);
      throw error;
    }
  }

  /**
   * Handle commission dispute
   */
  async handleCommissionDispute(
    transactionId: string,
    disputeReason: string,
    adjustmentAmount?: number
  ): Promise<CommissionTransaction> {
    try {
      const updateData: any = {
        isDisputed: true,
        disputeReason,
        status: 'disputed'
      };

      if (adjustmentAmount !== undefined) {
        updateData.adjustmentAmount = adjustmentAmount.toFixed(2);
        updateData.adjustmentReason = disputeReason;
        
        // Recalculate net payout
        const [transaction] = await db
          .select()
          .from(commissionTransactions)
          .where(eq(commissionTransactions.id, transactionId))
          .limit(1);
        
        if (transaction) {
          const newNetPayout = parseFloat(transaction.netPayoutAmount) + adjustmentAmount;
          updateData.netPayoutAmount = newNetPayout.toFixed(2);
          updateData.status = 'adjusted';
        }
      }

      const [updated] = await db
        .update(commissionTransactions)
        .set(updateData)
        .where(eq(commissionTransactions.id, transactionId))
        .returning();

      return updated;
    } catch (error) {
      console.error('Error handling commission dispute:', error);
      throw error;
    }
  }

  /**
   * Create or update commission rule
   */
  async saveCommissionRule(rule: InsertCommissionRule): Promise<CommissionRule> {
    try {
      const [saved] = await db
        .insert(commissionRules)
        .values(rule)
        .returning();
      
      return saved;
    } catch (error) {
      console.error('Error saving commission rule:', error);
      throw error;
    }
  }

  /**
   * Get commission rules
   */
  async getCommissionRules(
    userType?: 'contractor' | 'fleet',
    isActive?: boolean
  ): Promise<CommissionRule[]> {
    try {
      const conditions = [];

      if (userType) {
        conditions.push(eq(commissionRules.userType, userType));
      }

      if (isActive !== undefined) {
        conditions.push(eq(commissionRules.isActive, isActive));
      }

      const query = conditions.length > 0
        ? db.select().from(commissionRules).where(and(...conditions))
        : db.select().from(commissionRules);

      return await query.orderBy(desc(commissionRules.priority), asc(commissionRules.commissionPercentage));
    } catch (error) {
      console.error('Error getting commission rules:', error);
      throw error;
    }
  }
}

// Export singleton instance
const paymentReconciliationService = new PaymentReconciliationService();
export default paymentReconciliationService;