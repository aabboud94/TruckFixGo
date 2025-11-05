import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { 
  CreditCard,
  DollarSign,
  CheckCircle,
  AlertCircle,
  Clock,
  Truck,
  FileText,
  Upload,
  Shield,
  Eye,
  Download,
  Calendar,
  TrendingUp,
  Info
} from "lucide-react";
import { format } from "date-fns";

interface CheckJob {
  id: string;
  jobId: string;
  provider: "efs" | "comdata";
  checkNumber: string;
  maskedCheckNumber: string;
  authorizedAmount: string;
  capturedAmount?: string;
  status: string;
  jobDetails: {
    serviceType: string;
    location: string;
    scheduledTime: string;
    customerName: string;
    truckInfo: string;
  };
  specialInstructions?: string;
  requiresCheckImage: boolean;
  settlementDate?: string;
  createdAt: string;
  completedAt?: string;
}

export default function ContractorCheckPayments() {
  const { toast } = useToast();
  const [selectedJob, setSelectedJob] = useState<CheckJob | null>(null);
  const [showInstructions, setShowInstructions] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Fetch check payment jobs for contractor
  const { data: checkJobs, isLoading } = useQuery({
    queryKey: ["/api/contractor/check-jobs"],
    queryFn: async () => {
      // This would fetch check payment jobs assigned to the contractor
      return {
        pending: [
          {
            id: "1",
            jobId: "job-123",
            provider: "efs" as const,
            checkNumber: "1234567890",
            maskedCheckNumber: "******7890",
            authorizedAmount: "450.00",
            status: "authorized",
            jobDetails: {
              serviceType: "Tire Repair",
              location: "I-95 Mile Marker 42",
              scheduledTime: "2024-01-15T10:30:00Z",
              customerName: "John's Trucking",
              truckInfo: "2020 Freightliner Cascadia"
            },
            specialInstructions: "Customer will provide check after service completion. Verify check matches authorized amount.",
            requiresCheckImage: true,
            createdAt: "2024-01-15T09:00:00Z"
          }
        ],
        completed: [],
        total: 1
      };
    }
  });

  const formatCurrency = (amount: string | number) => {
    const num = typeof amount === "string" ? parseFloat(amount) : amount;
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD"
    }).format(num);
  };

  const handleImageUpload = async (jobId: string, file: File) => {
    setUploadingImage(true);
    try {
      // Simulate upload
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast({
        title: "Check Image Uploaded",
        description: "The check image has been successfully uploaded for verification"
      });
      setUploadingImage(false);
    } catch (error) {
      toast({
        title: "Upload Failed",
        description: "Failed to upload check image. Please try again.",
        variant: "destructive"
      });
      setUploadingImage(false);
    }
  };

  const getProviderBadge = (provider: string) => {
    return (
      <Badge variant="outline" className="gap-1">
        <Truck className="w-3 h-3" />
        {provider.toUpperCase()}
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { variant: any; icon: any }> = {
      authorized: { variant: "default", icon: Shield },
      captured: { variant: "default", icon: CheckCircle },
      pending: { variant: "secondary", icon: Clock },
      completed: { variant: "default", icon: CheckCircle }
    };

    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="w-3 h-3" />
        {status.toUpperCase()}
      </Badge>
    );
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Check Payment Jobs</h1>
        <p className="text-muted-foreground mt-2">
          Manage jobs with EFS and Comdata check payments
        </p>
      </div>

      {/* Important Information Alert */}
      <Alert className="mb-6">
        <Info className="h-4 w-4" />
        <AlertTitle>Check Payment Instructions</AlertTitle>
        <AlertDescription>
          For jobs with fleet check payments:
          <ul className="mt-2 space-y-1 text-sm">
            <li>• Verify the check details match the authorized amount before completing service</li>
            <li>• Take a clear photo of the check after receiving it from the customer</li>
            <li>• Upload the check image immediately after job completion</li>
            <li>• Settlement typically occurs within 1-2 business days</li>
          </ul>
        </AlertDescription>
      </Alert>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Jobs</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{checkJobs?.pending?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting completion
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Authorized</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(
                checkJobs?.pending?.reduce((sum, job) => 
                  sum + parseFloat(job.authorizedAmount), 0) || 0
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Available for capture
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{checkJobs?.completed?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              This month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Settlement</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1-2 days</div>
            <p className="text-xs text-muted-foreground">
              Average time
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Jobs Tabs */}
      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending" data-testid="tab-pending">
            Pending Jobs
          </TabsTrigger>
          <TabsTrigger value="completed" data-testid="tab-completed">
            Completed Jobs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pending Check Payment Jobs</CardTitle>
              <CardDescription>
                Jobs with authorized fleet checks awaiting completion
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">Loading jobs...</div>
              ) : checkJobs?.pending?.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No pending check payment jobs
                </div>
              ) : (
                <div className="space-y-4">
                  {checkJobs?.pending?.map((job) => (
                    <Card key={job.id}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {getProviderBadge(job.provider)}
                            {getStatusBadge(job.status)}
                          </div>
                          <Badge variant="outline">
                            Job #{job.jobId.slice(0, 8)}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid gap-4 md:grid-cols-2">
                          <div>
                            <h4 className="font-semibold mb-2">Job Details</h4>
                            <div className="space-y-1 text-sm">
                              <p><strong>Service:</strong> {job.jobDetails.serviceType}</p>
                              <p><strong>Location:</strong> {job.jobDetails.location}</p>
                              <p><strong>Customer:</strong> {job.jobDetails.customerName}</p>
                              <p><strong>Vehicle:</strong> {job.jobDetails.truckInfo}</p>
                              <p><strong>Scheduled:</strong> {format(new Date(job.jobDetails.scheduledTime), "PPp")}</p>
                            </div>
                          </div>
                          <div>
                            <h4 className="font-semibold mb-2">Payment Details</h4>
                            <div className="space-y-1 text-sm">
                              <p><strong>Check #:</strong> {job.maskedCheckNumber}</p>
                              <p><strong>Authorized:</strong> {formatCurrency(job.authorizedAmount)}</p>
                              <p><strong>Provider:</strong> {job.provider.toUpperCase()}</p>
                              {job.requiresCheckImage && (
                                <Badge variant="secondary" className="mt-2">
                                  <Upload className="w-3 h-3 mr-1" />
                                  Check Image Required
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>

                        {job.specialInstructions && (
                          <Alert className="mt-4">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Special Instructions</AlertTitle>
                            <AlertDescription>
                              {job.specialInstructions}
                            </AlertDescription>
                          </Alert>
                        )}

                        <div className="flex gap-2 mt-4">
                          <Button
                            onClick={() => {
                              setSelectedJob(job);
                              setShowInstructions(true);
                            }}
                            data-testid={`button-view-${job.id}`}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => {
                              const input = document.createElement("input");
                              input.type = "file";
                              input.accept = "image/*";
                              input.onchange = (e) => {
                                const file = (e.target as HTMLInputElement).files?.[0];
                                if (file) {
                                  handleImageUpload(job.jobId, file);
                                }
                              };
                              input.click();
                            }}
                            disabled={uploadingImage}
                            data-testid={`button-upload-${job.id}`}
                          >
                            {uploadingImage ? (
                              <>
                                <Clock className="mr-2 h-4 w-4 animate-spin" />
                                Uploading...
                              </>
                            ) : (
                              <>
                                <Upload className="mr-2 h-4 w-4" />
                                Upload Check Image
                              </>
                            )}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Completed Check Payment Jobs</CardTitle>
              <CardDescription>
                Jobs with captured fleet check payments
              </CardDescription>
            </CardHeader>
            <CardContent>
              {checkJobs?.completed?.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No completed check payment jobs yet
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Job ID</TableHead>
                      <TableHead>Provider</TableHead>
                      <TableHead>Check #</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Completed</TableHead>
                      <TableHead>Settlement</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {checkJobs?.completed?.map((job: CheckJob) => (
                      <TableRow key={job.id}>
                        <TableCell>#{job.jobId.slice(0, 8)}</TableCell>
                        <TableCell>{getProviderBadge(job.provider)}</TableCell>
                        <TableCell className="font-mono">{job.maskedCheckNumber}</TableCell>
                        <TableCell>{formatCurrency(job.capturedAmount || job.authorizedAmount)}</TableCell>
                        <TableCell>
                          {job.completedAt && format(new Date(job.completedAt), "MMM d")}
                        </TableCell>
                        <TableCell>
                          {job.settlementDate ? (
                            <Badge variant="default">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Settled
                            </Badge>
                          ) : (
                            <Badge variant="secondary">
                              <Clock className="w-3 h-3 mr-1" />
                              Pending
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="ghost"
                            data-testid={`button-download-${job.id}`}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Instructions Dialog */}
      <Dialog open={showInstructions} onOpenChange={setShowInstructions}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Check Payment Processing Instructions</DialogTitle>
            <DialogDescription>
              Important steps for handling {selectedJob?.provider.toUpperCase()} check payments
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Before Service:</h4>
              <ol className="list-decimal list-inside space-y-1 text-sm">
                <li>Confirm customer has the {selectedJob?.provider.toUpperCase()} check ready</li>
                <li>Verify check number ends with: {selectedJob?.maskedCheckNumber}</li>
                <li>Confirm authorized amount: {selectedJob && formatCurrency(selectedJob.authorizedAmount)}</li>
              </ol>
            </div>

            <div>
              <h4 className="font-semibold mb-2">After Service Completion:</h4>
              <ol className="list-decimal list-inside space-y-1 text-sm">
                <li>Collect the check from the customer</li>
                <li>Verify all check details match the authorization</li>
                <li>Take a clear photo of the entire check</li>
                <li>Upload the check image immediately</li>
                <li>Have customer sign service completion form</li>
              </ol>
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Important:</strong> Do not release the vehicle until you have received 
                and photographed the check. The check image is required for payment processing.
              </AlertDescription>
            </Alert>

            <div>
              <h4 className="font-semibold mb-2">Settlement Information:</h4>
              <p className="text-sm">
                • Payment will be processed within 1-2 business days<br />
                • Settlement will be deposited to your registered bank account<br />
                • You'll receive confirmation once the check is processed
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}