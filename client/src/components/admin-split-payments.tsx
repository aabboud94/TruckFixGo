import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import { 
  Users, 
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Mail,
  Phone,
  RefreshCw,
  Filter,
  Download,
  TrendingUp,
  TrendingDown,
  CreditCard,
  Send,
  Eye,
  Edit,
  Ban
} from "lucide-react";

interface SplitPaymentStats {
  totalSplitPayments: number;
  totalAmount: number;
  totalCollected: number;
  averageCollectionTime: number;
  successRate: number;
  pendingCount: number;
  paidCount: number;
  failedCount: number;
  byPayerType: {
    driver: number;
    carrier: number;
    fleet: number;
    insurance: number;
    other: number;
  };
}

export default function AdminSplitPayments() {
  const [selectedSplitPayment, setSelectedSplitPayment] = useState<any>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [dateRange, setDateRange] = useState({ from: "", to: "" });
  const { toast } = useToast();

  // Fetch all split payments
  const { data: splitPaymentsData, isLoading, refetch } = useQuery({
    queryKey: ["/api/admin/payments/split", filterStatus, searchQuery, dateRange],
    enabled: true
  });

  // Send reminder mutation
  const sendReminder = useMutation({
    mutationFn: (data: any) => apiRequest("/api/payments/split/remind", {
      method: "POST",
      body: JSON.stringify(data)
    }),
    onSuccess: (data) => {
      toast({
        title: "Reminders Sent",
        description: data.message
      });
      refetch();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send reminders",
        variant: "destructive"
      });
    }
  });

  // Manual payment entry mutation
  const manualPayment = useMutation({
    mutationFn: (data: any) => apiRequest("/api/admin/payments/split/manual", {
      method: "POST",
      body: JSON.stringify(data)
    }),
    onSuccess: () => {
      toast({
        title: "Payment Recorded",
        description: "Manual payment has been recorded successfully"
      });
      refetch();
      setShowDetailsModal(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to record payment",
        variant: "destructive"
      });
    }
  });

  // Refund payment mutation
  const refundPayment = useMutation({
    mutationFn: (data: any) => apiRequest("/api/admin/payments/split/refund", {
      method: "POST",
      body: JSON.stringify(data)
    }),
    onSuccess: () => {
      toast({
        title: "Refund Initiated",
        description: "Payment refund has been initiated"
      });
      refetch();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to process refund",
        variant: "destructive"
      });
    }
  });

  // Calculate statistics
  const stats: SplitPaymentStats = splitPaymentsData?.stats || {
    totalSplitPayments: 0,
    totalAmount: 0,
    totalCollected: 0,
    averageCollectionTime: 0,
    successRate: 0,
    pendingCount: 0,
    paidCount: 0,
    failedCount: 0,
    byPayerType: {
      driver: 0,
      carrier: 0,
      fleet: 0,
      insurance: 0,
      other: 0
    }
  };

  // Export data
  const handleExport = () => {
    const csv = [
      ['Date', 'Job ID', 'Total Amount', 'Status', 'Payer Type', 'Payer Name', 'Amount Assigned', 'Amount Paid', 'Payment Status'],
      ...(splitPaymentsData?.splitPayments || []).flatMap((sp: any) => 
        sp.paymentSplits?.map((split: any) => [
          format(new Date(sp.createdAt), 'yyyy-MM-dd'),
          sp.jobId,
          (parseFloat(sp.totalAmount) / 100).toFixed(2),
          sp.status,
          split.payerType,
          split.payerName,
          (parseFloat(split.amountAssigned) / 100).toFixed(2),
          (parseFloat(split.amountPaid) / 100).toFixed(2),
          split.status
        ])
      )
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `split-payments-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Split Payments</p>
                <p className="text-2xl font-bold" data-testid="text-total-split-payments">
                  {stats.totalSplitPayments}
                </p>
              </div>
              <Users className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Amount</p>
                <p className="text-2xl font-bold" data-testid="text-total-amount">
                  ${(stats.totalAmount / 100).toFixed(2)}
                </p>
                <p className="text-sm text-muted-foreground">
                  Collected: ${(stats.totalCollected / 100).toFixed(2)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Success Rate</p>
                <p className="text-2xl font-bold" data-testid="text-success-rate">
                  {stats.successRate.toFixed(1)}%
                </p>
                <div className="flex items-center gap-2 mt-1">
                  {stats.successRate > 80 ? (
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-600" />
                  )}
                  <span className="text-sm text-muted-foreground">
                    {stats.paidCount} paid / {stats.pendingCount} pending
                  </span>
                </div>
              </div>
              <CheckCircle className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Collection Time</p>
                <p className="text-2xl font-bold" data-testid="text-avg-collection">
                  {stats.averageCollectionTime.toFixed(1)}h
                </p>
                <p className="text-sm text-muted-foreground">
                  Failed: {stats.failedCount}
                </p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Actions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Split Payments Management</CardTitle>
            <div className="flex gap-2">
              <Button
                onClick={() => refetch()}
                variant="outline"
                size="sm"
                data-testid="button-refresh"
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Refresh
              </Button>
              <Button
                onClick={handleExport}
                variant="outline"
                size="sm"
                data-testid="button-export"
              >
                <Download className="h-4 w-4 mr-1" />
                Export CSV
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div>
              <Label>Status Filter</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger data-testid="select-status-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="partially_paid">Partially Paid</SelectItem>
                  <SelectItem value="paid">Fully Paid</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Search</Label>
              <Input
                placeholder="Job ID or Payer Name"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                data-testid="input-search"
              />
            </div>

            <div>
              <Label>From Date</Label>
              <Input
                type="date"
                value={dateRange.from}
                onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
                data-testid="input-date-from"
              />
            </div>

            <div>
              <Label>To Date</Label>
              <Input
                type="date"
                value={dateRange.to}
                onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
                data-testid="input-date-to"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Split Payments Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Job ID</TableHead>
                <TableHead>Total Amount</TableHead>
                <TableHead>Splits</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Collected</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center">
                    <Clock className="h-6 w-6 animate-spin mx-auto" />
                    Loading...
                  </TableCell>
                </TableRow>
              ) : !splitPaymentsData?.splitPayments?.length ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    No split payments found
                  </TableCell>
                </TableRow>
              ) : (
                splitPaymentsData.splitPayments.map((splitPayment: any) => {
                  const totalAssigned = splitPayment.paymentSplits?.reduce(
                    (sum: number, split: any) => sum + parseFloat(split.amountAssigned), 0
                  ) || 0;
                  const totalPaid = splitPayment.paymentSplits?.reduce(
                    (sum: number, split: any) => sum + parseFloat(split.amountPaid), 0
                  ) || 0;
                  const percentCollected = totalAssigned > 0 ? (totalPaid / totalAssigned * 100) : 0;
                  
                  return (
                    <TableRow key={splitPayment.id}>
                      <TableCell>
                        {format(new Date(splitPayment.createdAt), 'MMM dd, yyyy')}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{splitPayment.jobId.slice(0, 8)}</Badge>
                      </TableCell>
                      <TableCell>
                        ${(parseFloat(splitPayment.totalAmount) / 100).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {splitPayment.paymentSplits?.map((split: any, idx: number) => (
                            <Badge 
                              key={idx} 
                              variant={split.status === 'paid' ? 'default' : split.status === 'pending' ? 'secondary' : 'destructive'}
                              className="text-xs"
                            >
                              {split.payerType}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={splitPayment.status === 'completed' ? 'default' : 
                                  splitPayment.status === 'active' ? 'secondary' : 
                                  'destructive'}
                        >
                          {splitPayment.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="text-sm font-medium">
                            {percentCollected.toFixed(0)}%
                          </div>
                          <div className="text-xs text-muted-foreground">
                            ${(totalPaid / 100).toFixed(2)} / ${(totalAssigned / 100).toFixed(2)}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setSelectedSplitPayment(splitPayment);
                              setShowDetailsModal(true);
                            }}
                            data-testid={`button-view-${splitPayment.id}`}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {splitPayment.status !== 'completed' && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => sendReminder.mutate({
                                splitPaymentId: splitPayment.id
                              })}
                              disabled={sendReminder.isPending}
                              data-testid={`button-remind-${splitPayment.id}`}
                            >
                              <Send className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Payer Type Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue by Payer Type</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {Object.entries(stats.byPayerType).map(([type, amount]) => (
              <div key={type} className="text-center">
                <div className="text-2xl font-bold">
                  ${((amount as number) / 100).toFixed(2)}
                </div>
                <div className="text-sm text-muted-foreground capitalize">{type}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Details Modal */}
      {selectedSplitPayment && (
        <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Split Payment Details</DialogTitle>
              <DialogDescription>
                Job: {selectedSplitPayment.jobId} | Created: {format(new Date(selectedSplitPayment.createdAt), 'PPpp')}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Payment Splits */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Payment Splits</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Payer</TableHead>
                        <TableHead>Contact</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedSplitPayment.paymentSplits?.map((split: any) => (
                        <TableRow key={split.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{split.payerName}</div>
                              <Badge variant="outline" className="text-xs">
                                {split.payerType}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell>
                            {split.payerEmail && (
                              <div className="flex items-center gap-1 text-sm">
                                <Mail className="h-3 w-3" />
                                {split.payerEmail}
                              </div>
                            )}
                            {split.payerPhone && (
                              <div className="flex items-center gap-1 text-sm">
                                <Phone className="h-3 w-3" />
                                {split.payerPhone}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">
                                ${(parseFloat(split.amountAssigned) / 100).toFixed(2)}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Paid: ${(parseFloat(split.amountPaid) / 100).toFixed(2)}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={split.status === 'paid' ? 'default' : 
                                      split.status === 'pending' ? 'secondary' : 
                                      'destructive'}
                            >
                              {split.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              {split.status === 'pending' && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => manualPayment.mutate({
                                    paymentSplitId: split.id,
                                    amount: parseFloat(split.amountAssigned)
                                  })}
                                  data-testid={`button-manual-pay-${split.id}`}
                                >
                                  <CreditCard className="h-3 w-3" />
                                </Button>
                              )}
                              {split.status === 'paid' && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => refundPayment.mutate({
                                    paymentSplitId: split.id
                                  })}
                                  data-testid={`button-refund-${split.id}`}
                                >
                                  <Ban className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* Payment Links */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Payment Links</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {selectedSplitPayment.paymentSplits?.map((split: any) => (
                      split.paymentLinkUrl && (
                        <div key={split.id} className="flex items-center justify-between p-2 border rounded">
                          <div className="flex-1">
                            <div className="text-sm font-medium">{split.payerName}</div>
                            <div className="text-xs text-muted-foreground">{split.paymentLinkUrl}</div>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              navigator.clipboard.writeText(split.paymentLinkUrl);
                              toast({
                                title: "Link Copied",
                                description: "Payment link copied to clipboard"
                              });
                            }}
                          >
                            Copy
                          </Button>
                        </div>
                      )
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}