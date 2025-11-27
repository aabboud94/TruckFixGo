import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { formatCurrency, cn } from '@/lib/utils';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from 'date-fns';
import { 
  CalendarIcon, 
  Download, 
  DollarSign, 
  TrendingUp, 
  Users, 
  AlertCircle,
  Clock,
  CheckCircle,
  XCircle,
  FileText,
  Play,
  RefreshCw
} from 'lucide-react';
import { usePaymentReconciliation } from '@/hooks/use-payment-reconciliation';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

export default function PaymentReconciliationPage() {
  const { toast } = useToast();
  const [selectedPeriod, setSelectedPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'quarterly'>('monthly');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showProcessDialog, setShowProcessDialog] = useState(false);
  const [processingPeriod, setProcessingPeriod] = useState<{ start: Date; end: Date } | null>(null);

  const {
    reconciliationData,
    pendingPayouts,
    isProcessing,
    processReconciliation,
    downloadReport,
    createPayoutBatch,
    processPayoutBatch
  } = usePaymentReconciliation(selectedPeriod, selectedDate);

  const getPeriodDates = () => {
    const now = selectedDate;
    switch (selectedPeriod) {
      case 'daily':
        return {
          start: new Date(now.setHours(0, 0, 0, 0)),
          end: new Date(now.setHours(23, 59, 59, 999))
        };
      case 'weekly':
        return {
          start: startOfWeek(now),
          end: endOfWeek(now)
        };
      case 'monthly':
        return {
          start: startOfMonth(now),
          end: endOfMonth(now)
        };
      case 'quarterly':
        const quarter = Math.floor(now.getMonth() / 3);
        const startMonth = quarter * 3;
        return {
          start: new Date(now.getFullYear(), startMonth, 1),
          end: new Date(now.getFullYear(), startMonth + 3, 0, 23, 59, 59, 999)
        };
      default:
        return { start: now, end: now };
    }
  };

  const handleProcessReconciliation = async () => {
    const dates = getPeriodDates();
    setProcessingPeriod(dates);
    setShowProcessDialog(true);
  };

  const confirmProcessReconciliation = async () => {
    if (!processingPeriod) return;
    
    try {
      await processReconciliation(processingPeriod.start, processingPeriod.end);
      toast({
        title: 'Reconciliation Started',
        description: 'Processing reconciliation for the selected period...'
      });
      setShowProcessDialog(false);
    } catch (error) {
      toast({
        title: 'Processing Failed',
        description: 'Failed to process reconciliation. Please try again.',
        variant: 'destructive'
      });
    }
  };

  const handleCreatePayoutBatch = async (contractorId: string) => {
    const dates = getPeriodDates();
    try {
      await createPayoutBatch(contractorId, dates.start, dates.end);
      toast({
        title: 'Payout Batch Created',
        description: 'The payout batch has been created successfully.'
      });
    } catch (error) {
      toast({
        title: 'Creation Failed',
        description: 'Failed to create payout batch. Please try again.',
        variant: 'destructive'
      });
    }
  };

  const handleProcessPayout = async (batchId: string) => {
    try {
      await processPayoutBatch(batchId, 'bank_transfer');
      toast({
        title: 'Payout Processing',
        description: 'The payout is being processed.'
      });
    } catch (error) {
      toast({
        title: 'Processing Failed',
        description: 'Failed to process payout. Please try again.',
        variant: 'destructive'
      });
    }
  };

  type StatusBadgeConfig = {
    variant: 'default' | 'secondary' | 'destructive' | 'outline';
    icon: typeof Clock;
    className?: string;
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, StatusBadgeConfig> = {
      pending: { variant: 'secondary', icon: Clock },
      processing: { variant: 'default', icon: RefreshCw },
      completed: { variant: 'default', icon: CheckCircle, className: 'bg-green-500 text-white' },
      failed: { variant: 'destructive', icon: XCircle },
      disputed: { variant: 'outline', icon: AlertCircle }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;
    
    return (
      <Badge variant={config.variant} className={cn('gap-1', config.className)}>
        <Icon className="w-3 h-3" />
        {status.toUpperCase()}
      </Badge>
    );
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold" data-testid="text-page-title">Payment Reconciliation</h1>
        <p className="text-muted-foreground">Manage commission calculations and contractor payouts</p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-revenue">
              {formatCurrency(reconciliationData?.totalRevenue || 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              <TrendingUp className="w-3 h-3 inline mr-1" />
              +12% from last period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Platform Fees</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-platform-fees">
              {formatCurrency(reconciliationData?.totalCommissions || 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              15% average commission
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Pending Payouts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-pending-payouts">
              {formatCurrency(reconciliationData?.totalPendingPayouts || 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              <Users className="w-3 h-3 inline mr-1" />
              {pendingPayouts?.length || 0} contractors
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Completed Payouts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-completed-payouts">
              {formatCurrency(reconciliationData?.totalCompletedPayouts || 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              <CheckCircle className="w-3 h-3 inline mr-1" />
              This {selectedPeriod}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Reconciliation Period</CardTitle>
          <CardDescription>Select the period and date range for reconciliation</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="space-y-2">
              <Label>Period Type</Label>
              <Select value={selectedPeriod} onValueChange={(v: any) => setSelectedPeriod(v)}>
                <SelectTrigger className="w-40" data-testid="select-period">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-48" data-testid="button-date-picker">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(selectedDate, 'PPP')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => date && setSelectedDate(date)}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex items-end gap-2">
              <Button 
                onClick={handleProcessReconciliation}
                disabled={isProcessing}
                data-testid="button-process-reconciliation"
              >
                {isProcessing ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Play className="w-4 h-4 mr-2" />
                )}
                Process Reconciliation
              </Button>

              <Button 
                variant="outline"
                onClick={() => downloadReport()}
                data-testid="button-download-report"
              >
                <Download className="w-4 h-4 mr-2" />
                Download Report
              </Button>
            </div>
          </div>

          {reconciliationData?.status && (
            <Alert className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Last reconciliation: {format(reconciliationData.lastProcessedAt, 'PPpp')} - 
                Status: {getStatusBadge(reconciliationData.status)}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Tabs for Different Views */}
      <Tabs defaultValue="payouts" className="space-y-4">
        <TabsList>
          <TabsTrigger value="payouts">Pending Payouts</TabsTrigger>
          <TabsTrigger value="transactions">Commission Transactions</TabsTrigger>
          <TabsTrigger value="history">Reconciliation History</TabsTrigger>
          <TabsTrigger value="disputes">Disputes</TabsTrigger>
        </TabsList>

        <TabsContent value="payouts">
          <Card>
            <CardHeader>
              <CardTitle>Pending Contractor Payouts</CardTitle>
              <CardDescription>Review and process pending payments to contractors</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Contractor</TableHead>
                      <TableHead>Period</TableHead>
                      <TableHead>Jobs</TableHead>
                      <TableHead className="text-right">Base Amount</TableHead>
                      <TableHead className="text-right">Commission</TableHead>
                      <TableHead className="text-right">Net Payout</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingPayouts?.map((payout) => (
                      <TableRow key={payout.id}>
                        <TableCell className="font-medium">
                          {payout.contractorName}
                          <br />
                          <span className="text-xs text-muted-foreground">{payout.contractorId}</span>
                        </TableCell>
                        <TableCell>
                          {format(new Date(payout.periodStart), 'MMM d')} - 
                          {format(new Date(payout.periodEnd), 'MMM d, yyyy')}
                        </TableCell>
                        <TableCell>{payout.jobCount}</TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(payout.totalAmount)}
                        </TableCell>
                        <TableCell className="text-right text-red-600">
                          -{formatCurrency(payout.commissionAmount)}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(payout.netAmount)}
                        </TableCell>
                        <TableCell>{getStatusBadge(payout.status)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleCreatePayoutBatch(payout.contractorId)}
                              disabled={payout.status !== 'pending'}
                              data-testid={`button-create-batch-${payout.contractorId}`}
                            >
                              Create Batch
                            </Button>
                            {payout.batchId && (
                              <Button
                                size="sm"
                                onClick={() => handleProcessPayout(payout.batchId!)}
                                disabled={payout.status === 'completed'}
                                data-testid={`button-process-payout-${payout.batchId}`}
                              >
                                <DollarSign className="w-3 h-3 mr-1" />
                                Pay
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {(!pendingPayouts || pendingPayouts.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                          No pending payouts for this period
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions">
          <Card>
            <CardHeader>
              <CardTitle>Recent Commission Transactions</CardTitle>
              <CardDescription>View all commission calculations for completed jobs</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Transaction ID</TableHead>
                      <TableHead>Job ID</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Base Amount</TableHead>
                      <TableHead className="text-right">Rate</TableHead>
                      <TableHead className="text-right">Commission</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reconciliationData?.transactions?.map((tx) => (
                      <TableRow key={tx.id}>
                        <TableCell className="font-mono text-xs">{tx.id.slice(0, 8)}</TableCell>
                        <TableCell className="font-mono text-xs">{tx.jobId.slice(0, 8)}</TableCell>
                        <TableCell>{format(new Date(tx.createdAt), 'MMM d, yyyy')}</TableCell>
                        <TableCell className="text-right">{formatCurrency(Number(tx.baseAmount || 0))}</TableCell>
                        <TableCell className="text-right">{(Number(tx.commissionRate || 0) * 100).toFixed(1)}%</TableCell>
                        <TableCell className="text-right">{formatCurrency(Number(tx.commissionAmount || 0))}</TableCell>
                        <TableCell>{getStatusBadge(tx.status)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Reconciliation History</CardTitle>
              <CardDescription>View past reconciliation reports and their status</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-4">
                  {reconciliationData?.history?.map((record) => (
                    <div key={record.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <div className="font-medium">
                            {format(new Date(record.periodStart), 'MMM d')} - 
                            {format(new Date(record.periodEnd), 'MMM d, yyyy')}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {record.periodType.toUpperCase()} Reconciliation
                          </div>
                        </div>
                        <div className="text-right space-y-1">
                          <div className="font-medium">{formatCurrency(record.totalRevenue)}</div>
                          {getStatusBadge(record.status)}
                        </div>
                      </div>
                      
                      <Separator className="my-3" />
                      
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Revenue:</span>
                          <br />
                          {formatCurrency(record.totalRevenue)}
                        </div>
                        <div>
                          <span className="text-muted-foreground">Commissions:</span>
                          <br />
                          {formatCurrency(record.totalCommissions)}
                        </div>
                        <div>
                          <span className="text-muted-foreground">Payouts:</span>
                          <br />
                          {formatCurrency(record.totalPayouts)}
                        </div>
                      </div>

                      {record.completedAt && (
                        <div className="mt-3 text-xs text-muted-foreground">
                          Completed: {format(new Date(record.completedAt), 'PPpp')}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="disputes">
          <Card>
            <CardHeader>
              <CardTitle>Commission Disputes</CardTitle>
              <CardDescription>Review and resolve commission disputes from contractors</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-4">
                  {reconciliationData?.disputes?.map((dispute) => (
                    <div key={dispute.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium">Job #{dispute.jobId.slice(0, 8)}</div>
                          <div className="text-sm text-muted-foreground">
                            Contractor: {dispute.contractorName}
                          </div>
                        </div>
                        {getStatusBadge('disputed')}
                      </div>
                      
                      <div className="mt-3 p-3 bg-muted rounded-md">
                        <p className="text-sm">{dispute.reason}</p>
                      </div>

                      <div className="mt-3 flex justify-between items-center">
                        <div className="text-sm">
                          <span className="text-muted-foreground">Original:</span> {formatCurrency(dispute.originalAmount)}
                          {dispute.adjustmentAmount && (
                            <>
                              <br />
                              <span className="text-muted-foreground">Adjustment:</span> {formatCurrency(dispute.adjustmentAmount)}
                            </>
                          )}
                        </div>
                        <Button size="sm" variant="outline">
                          Review Dispute
                        </Button>
                      </div>
                    </div>
                  ))}
                  
                  {(!reconciliationData?.disputes || reconciliationData.disputes.length === 0) && (
                    <div className="text-center text-muted-foreground py-8">
                      No active disputes
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Process Confirmation Dialog */}
      <Dialog open={showProcessDialog} onOpenChange={setShowProcessDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Process Reconciliation</DialogTitle>
            <DialogDescription>
              You are about to process reconciliation for the following period:
            </DialogDescription>
          </DialogHeader>
          
          {processingPeriod && (
            <div className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Period:</strong> {format(processingPeriod.start, 'PPP')} to {format(processingPeriod.end, 'PPP')}
                  <br />
                  <strong>Type:</strong> {selectedPeriod.toUpperCase()}
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">This will:</p>
                <ul className="text-sm space-y-1 ml-4">
                  <li>• Calculate all pending commissions</li>
                  <li>• Generate payout batches for contractors</li>
                  <li>• Update revenue and fee totals</li>
                  <li>• Create a reconciliation report</li>
                </ul>
              </div>

              <div className="flex justify-end gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setShowProcessDialog(false)}
                  data-testid="button-cancel-process"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={confirmProcessReconciliation}
                  disabled={isProcessing}
                  data-testid="button-confirm-process"
                >
                  {isProcessing ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle className="w-4 h-4 mr-2" />
                  )}
                  Confirm & Process
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
