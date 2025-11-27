import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
  Send,
  TrendingUp,
  FileText,
  MessageSquare,
  Eye
} from "lucide-react";

interface ContractorSplitPaymentsProps {
  contractorId?: string;
}

interface ContractorSplitPaymentJob {
  jobId: string;
  jobNumber?: string;
  createdAt?: string;
  splitPayment?: {
    totalAmount?: string;
    status?: string;
    paymentSplits?: Array<{
      id: string;
      payerType: string;
      payerName?: string;
      amountAssigned: string;
      amountPaid: string;
      status: string;
    }>;
  };
}

interface ContractorSplitPaymentsResponse {
  jobs: ContractorSplitPaymentJob[];
}

export default function ContractorSplitPayments({ contractorId }: ContractorSplitPaymentsProps) {
  const [selectedJob, setSelectedJob] = useState<string | null>(null);
  const { toast } = useToast();

  // Fetch contractor's jobs with split payments
  const { data: splitPaymentJobs, isLoading, refetch } = useQuery<ContractorSplitPaymentsResponse>({
    queryKey: ["/api/contractor/split-payments", contractorId],
    enabled: !!contractorId
  });

  // Send reminder to specific payer
  const sendReminder = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/payments/split/remind", data),
    onSuccess: () => {
      toast({
        title: "Reminder Sent",
        description: "Payment reminder has been sent to the payer"
      });
      refetch();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send reminder",
        variant: "destructive"
      });
    }
  });

  // Calculate total statistics
  const stats = {
    totalJobs: splitPaymentJobs?.jobs?.length || 0,
    totalExpected: splitPaymentJobs?.jobs?.reduce((sum: number, job: any) => 
      sum + parseFloat(job.splitPayment?.totalAmount || 0), 0
    ) || 0,
    totalCollected: splitPaymentJobs?.jobs?.reduce((sum: number, job: any) => {
      const splits = job.splitPayment?.paymentSplits || [];
      return sum + splits.reduce((s: number, split: any) => 
        s + parseFloat(split.amountPaid || 0), 0
      );
    }, 0) || 0,
    pendingPayments: splitPaymentJobs?.jobs?.reduce((count: number, job: any) => {
      const splits = job.splitPayment?.paymentSplits || [];
      return count + splits.filter((s: any) => s.status === 'pending').length;
    }, 0) || 0
  };

  const collectionRate = stats.totalExpected > 0 ? 
    (stats.totalCollected / stats.totalExpected * 100).toFixed(1) : '0';

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Split Payment Jobs</p>
                <p className="text-2xl font-bold" data-testid="text-total-jobs">
                  {stats.totalJobs}
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
                <p className="text-sm font-medium text-muted-foreground">Total Expected</p>
                <p className="text-2xl font-bold" data-testid="text-total-expected">
                  ${(stats.totalExpected / 100).toFixed(2)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Collected</p>
                <p className="text-2xl font-bold" data-testid="text-total-collected">
                  ${(stats.totalCollected / 100).toFixed(2)}
                </p>
                <p className="text-sm text-green-600">
                  {collectionRate}% collected
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending Payments</p>
                <p className="text-2xl font-bold" data-testid="text-pending-payments">
                  {stats.pendingPayments}
                </p>
                <p className="text-sm text-muted-foreground">
                  Awaiting payment
                </p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Split Payments */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Active Split Payments</CardTitle>
              <CardDescription>
                Jobs with split payment arrangements
              </CardDescription>
            </div>
            <Button
              onClick={() => refetch()}
              variant="outline"
              size="sm"
              data-testid="button-refresh"
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Job</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Total Amount</TableHead>
                <TableHead>Payment Status</TableHead>
                <TableHead>Collection Progress</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center">
                    <Clock className="h-6 w-6 animate-spin mx-auto" />
                    Loading split payments...
                  </TableCell>
                </TableRow>
              ) : !splitPaymentJobs?.jobs?.length ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No jobs with split payments
                  </TableCell>
                </TableRow>
              ) : (
                splitPaymentJobs.jobs.map((job: any) => {
                  const splitPayment = job.splitPayment;
                  const paymentSplits = splitPayment?.paymentSplits || [];
                  const totalAssigned = paymentSplits.reduce(
                    (sum: number, split: any) => sum + parseFloat(split.amountAssigned || 0), 0
                  );
                  const totalPaid = paymentSplits.reduce(
                    (sum: number, split: any) => sum + parseFloat(split.amountPaid || 0), 0
                  );
                  const progressPercent = totalAssigned > 0 ? (totalPaid / totalAssigned * 100) : 0;
                  const paidCount = paymentSplits.filter((s: any) => s.status === 'paid').length;
                  
                  return (
                    <TableRow key={job.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">#{job.jobNumber}</div>
                          <div className="text-sm text-muted-foreground">{job.description}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {format(new Date(job.createdAt), 'MMM dd')}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">
                          ${(totalAssigned / 100).toFixed(2)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant={progressPercent === 100 ? 'default' : 
                                    progressPercent > 0 ? 'secondary' : 
                                    'outline'}
                          >
                            {paidCount}/{paymentSplits.length} Paid
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <Progress value={progressPercent} className="h-2" />
                          <div className="text-xs text-muted-foreground">
                            ${(totalPaid / 100).toFixed(2)} collected
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedJob(selectedJob === job.id ? null : job.id)}
                          data-testid={`button-details-${job.id}`}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          {selectedJob === job.id ? 'Hide' : 'View'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Detailed View for Selected Job */}
      {selectedJob && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Payment Split Details</CardTitle>
          </CardHeader>
          <CardContent>
            {splitPaymentJobs?.jobs?.find((j: any) => j.id === selectedJob)?.splitPayment?.paymentSplits?.map((split: any) => (
              <div key={split.id} className="mb-4 p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="capitalize">
                      {split.payerType}
                    </Badge>
                    <span className="font-medium">{split.payerName}</span>
                    {split.status === 'paid' ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : split.status === 'pending' ? (
                      <Clock className="h-5 w-5 text-yellow-600" />
                    ) : (
                      <XCircle className="h-5 w-5 text-destructive" />
                    )}
                  </div>
                  <div className="text-lg font-semibold">
                    ${(parseFloat(split.amountAssigned) / 100).toFixed(2)}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                  <div>
                    <span className="text-muted-foreground">Contact:</span>
                    <div className="mt-1">
                      {split.payerEmail && (
                        <div className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {split.payerEmail}
                        </div>
                      )}
                      {split.payerPhone && (
                        <div className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {split.payerPhone}
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <span className="text-muted-foreground">Payment Status:</span>
                    <div className="mt-1">
                      <Badge 
                        variant={split.status === 'paid' ? 'default' : 
                                split.status === 'pending' ? 'secondary' : 
                                'destructive'}
                      >
                        {split.status}
                      </Badge>
                    </div>
                  </div>

                  <div>
                    <span className="text-muted-foreground">Amount Paid:</span>
                    <div className="mt-1 font-medium">
                      ${(parseFloat(split.amountPaid) / 100).toFixed(2)}
                    </div>
                  </div>
                </div>

                {split.description && (
                  <div className="mt-3 p-2 bg-muted rounded text-sm">
                    <span className="text-muted-foreground">Description:</span> {split.description}
                  </div>
                )}

                {split.status === 'pending' && (
                  <div className="mt-3 flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => sendReminder.mutate({
                        splitPaymentId: split.splitPaymentId,
                        paymentSplitIds: [split.id]
                      })}
                      disabled={sendReminder.isPending}
                      data-testid={`button-remind-${split.id}`}
                    >
                      <Send className="h-3 w-3 mr-1" />
                      Send Reminder
                    </Button>
                    {split.remindersSent > 0 && (
                      <span className="text-xs text-muted-foreground mt-2">
                        {split.remindersSent} reminder(s) sent
                      </span>
                    )}
                  </div>
                )}

                {split.transactionId && (
                  <div className="mt-2 text-xs text-muted-foreground">
                    Transaction ID: {split.transactionId}
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Important Notes */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Payment Collection:</strong> Full payment for the job will be marked as received only when all parties have completed their payment portions. 
          You can send reminders to pending payers and track the collection progress for each split payment arrangement.
        </AlertDescription>
      </Alert>
    </div>
  );
}
