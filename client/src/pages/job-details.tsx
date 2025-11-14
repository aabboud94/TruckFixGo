import { useState } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { WeatherWidget } from "@/components/weather-widget";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { InvoiceTemplate } from "@/components/invoice-template";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { format } from "date-fns";
import { 
  FileText, 
  Download, 
  Mail, 
  Printer, 
  MapPin, 
  Calendar, 
  User, 
  Truck, 
  Clock, 
  DollarSign,
  CheckCircle,
  XCircle,
  AlertCircle,
  Building2,
  MessageSquare,
  Camera,
  Activity,
  Hash,
  Cloud
} from "lucide-react";
import type { Job, Invoice, User as UserType, FleetAccount } from "@shared/schema";

export default function JobDetails() {
  const [params] = useParams<{ id: string }>();
  const { toast } = useToast();
  const [showInvoicePreview, setShowInvoicePreview] = useState(false);

  // Query job details
  const { data: jobData, isLoading: jobLoading } = useQuery({
    queryKey: ["/api/jobs", params?.id],
    enabled: !!params?.id,
  });

  // Query invoice for job
  const { data: invoiceData, isLoading: invoiceLoading, refetch: refetchInvoice } = useQuery({
    queryKey: ["/api/jobs", params?.id, "invoice"],
    queryFn: () => apiRequest(`/api/jobs/${params?.id}/invoice`, "GET"),
    enabled: !!params?.id,
  });

  // Mutation to download invoice
  const downloadInvoiceMutation = useMutation({
    mutationFn: async (invoiceId: string) => {
      const response = await fetch(`/api/invoices/${invoiceId}/download`, {
        method: "GET",
        credentials: "include",
      });
      
      if (!response.ok) {
        throw new Error("Failed to download invoice");
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `invoice-${invoiceData?.invoice?.invoiceNumber || "download"}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    },
    onSuccess: () => {
      toast({
        title: "Invoice downloaded",
        description: "The invoice has been downloaded successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Download failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutation to email invoice
  const emailInvoiceMutation = useMutation({
    mutationFn: async (invoiceId: string) => {
      return apiRequest(`/api/invoices/${invoiceId}/email`, "POST", {
        recipientEmail: jobData?.customer?.email,
      });
    },
    onSuccess: () => {
      toast({
        title: "Invoice sent",
        description: "The invoice has been emailed successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Email failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (jobLoading || invoiceLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading job details...</p>
        </div>
      </div>
    );
  }

  if (!jobData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Job Not Found</CardTitle>
            <CardDescription>The requested job could not be found.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const job: Job = jobData;
  const invoice: Invoice | undefined = invoiceData?.invoice;
  const customer: UserType | undefined = invoiceData?.customer;
  const fleetAccount: FleetAccount | undefined = invoiceData?.fleetAccount;
  const contractor = invoiceData?.contractor;

  const getStatusIcon = (status: string) => {
    const icons: Record<string, any> = {
      new: AlertCircle,
      assigned: User,
      en_route: Truck,
      on_site: Activity,
      completed: CheckCircle,
      cancelled: XCircle,
    };
    return icons[status] || AlertCircle;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      new: "bg-gray-500",
      assigned: "bg-blue-500",
      en_route: "bg-yellow-500",
      on_site: "bg-orange-500",
      completed: "bg-green-500",
      cancelled: "bg-red-500",
    };
    return colors[status] || "bg-gray-500";
  };

  const StatusIcon = getStatusIcon(job.status);
  const vehicleInfo = job.vehicleInfo as any;

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Job Details</h1>
            <p className="text-gray-600 mt-1">Job ID: {job.id}</p>
          </div>
          <Badge className={`${getStatusColor(job.status)} text-white px-4 py-2`}>
            <StatusIcon className="h-4 w-4 mr-2" />
            {job.status.toUpperCase()}
          </Badge>
        </div>
      </div>

      {/* Job Information Cards */}
      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        {/* Job Overview */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5" />
              Job Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Job Type</p>
                <Badge className={job.jobType === "emergency" ? "bg-orange-500" : "bg-blue-500"}>
                  {job.jobType === "emergency" ? "EMERGENCY" : "SCHEDULED"}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-gray-600">Created At</p>
                <p className="font-semibold">{format(job.createdAt, "MMM dd, yyyy h:mm a")}</p>
              </div>
            </div>

            <Separator />

            <div>
              <p className="text-sm text-gray-600 mb-2">Issue Description</p>
              <p className="text-gray-900">{job.issueDescription || "No description provided"}</p>
            </div>

            <Separator />

            <div>
              <p className="text-sm text-gray-600 mb-2">Service Location</p>
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-gray-400 mt-1" />
                <p className="text-gray-900">{job.serviceLocation || "On-site service"}</p>
              </div>
            </div>

            {vehicleInfo && (
              <>
                <Separator />
                <div>
                  <p className="text-sm text-gray-600 mb-2">Vehicle Information</p>
                  {vehicleInfo.make && vehicleInfo.model && (
                    <p className="text-gray-900">
                      {vehicleInfo.year} {vehicleInfo.make} {vehicleInfo.model}
                    </p>
                  )}
                  {vehicleInfo.vin && (
                    <p className="text-sm text-gray-600 font-mono">VIN: {vehicleInfo.vin}</p>
                  )}
                  {vehicleInfo.unitNumber && (
                    <p className="text-sm text-gray-600">Unit #: {vehicleInfo.unitNumber}</p>
                  )}
                  {vehicleInfo.licensePlate && (
                    <p className="text-sm text-gray-600">License: {vehicleInfo.licensePlate}</p>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Invoice & Payment Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Invoice & Payment
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {invoice ? (
              <>
                <div>
                  <p className="text-sm text-gray-600">Invoice Number</p>
                  <p className="font-semibold font-mono">{invoice.invoiceNumber}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-600">Invoice Status</p>
                  <Badge className={
                    invoice.status === "paid" ? "bg-green-500" :
                    invoice.status === "pending" ? "bg-yellow-500" :
                    invoice.status === "overdue" ? "bg-red-500" :
                    "bg-gray-500"
                  }>
                    {invoice.status.toUpperCase()}
                  </Badge>
                </div>

                <div>
                  <p className="text-sm text-gray-600">Total Amount</p>
                  <p className="text-2xl font-bold text-gray-900">${invoice.totalAmount}</p>
                </div>

                {invoice.dueDate && (
                  <div>
                    <p className="text-sm text-gray-600">Due Date</p>
                    <p className="font-semibold">{format(invoice.dueDate, "MMM dd, yyyy")}</p>
                  </div>
                )}

                <Separator />

                <div className="space-y-2">
                  <Button
                    className="w-full"
                    onClick={() => setShowInvoicePreview(true)}
                    data-testid="button-view-invoice"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    View Invoice
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => downloadInvoiceMutation.mutate(invoice.id)}
                    disabled={downloadInvoiceMutation.isPending}
                    data-testid="button-download-invoice"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    {downloadInvoiceMutation.isPending ? "Downloading..." : "Download PDF"}
                  </Button>

                  {customer?.email && (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => emailInvoiceMutation.mutate(invoice.id)}
                      disabled={emailInvoiceMutation.isPending}
                      data-testid="button-email-invoice"
                    >
                      <Mail className="h-4 w-4 mr-2" />
                      {emailInvoiceMutation.isPending ? "Sending..." : "Email Invoice"}
                    </Button>
                  )}
                </div>
              </>
            ) : (
              <div className="text-center py-4">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600">No invoice generated yet</p>
                {job.status === "completed" && (
                  <Button
                    className="mt-4"
                    onClick={() => refetchInvoice()}
                    data-testid="button-generate-invoice"
                  >
                    Generate Invoice
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Weather Information Card */}
        {job.location && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Cloud className="h-5 w-5" />
                Weather Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <WeatherWidget 
                jobId={job.id}
                compact={false}
                showAlerts={true}
                showForecast={false}
                showImpactScore={true}
              />
            </CardContent>
          </Card>
        )}
      </div>

      {/* Additional Information Tabs */}
      <Tabs defaultValue="timeline" className="mb-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="messages">Messages</TabsTrigger>
          <TabsTrigger value="photos">Photos</TabsTrigger>
          <TabsTrigger value="payment">Payment</TabsTrigger>
        </TabsList>
        
        <TabsContent value="timeline" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Job Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <div>
                    <p className="font-semibold">Job Created</p>
                    <p className="text-sm text-gray-600">{format(job.createdAt, "MMM dd, yyyy h:mm a")}</p>
                  </div>
                </div>
                {job.assignedAt && (
                  <div className="flex items-center gap-4">
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                    <div>
                      <p className="font-semibold">Contractor Assigned</p>
                      <p className="text-sm text-gray-600">{format(job.assignedAt, "MMM dd, yyyy h:mm a")}</p>
                    </div>
                  </div>
                )}
                {job.enRouteAt && (
                  <div className="flex items-center gap-4">
                    <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                    <div>
                      <p className="font-semibold">Contractor En Route</p>
                      <p className="text-sm text-gray-600">{format(job.enRouteAt, "MMM dd, yyyy h:mm a")}</p>
                    </div>
                  </div>
                )}
                {job.arrivedAt && (
                  <div className="flex items-center gap-4">
                    <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                    <div>
                      <p className="font-semibold">Arrived On Site</p>
                      <p className="text-sm text-gray-600">{format(job.arrivedAt, "MMM dd, yyyy h:mm a")}</p>
                    </div>
                  </div>
                )}
                {job.completedAt && (
                  <div className="flex items-center gap-4">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <div>
                      <p className="font-semibold">Job Completed</p>
                      <p className="text-sm text-gray-600">{format(job.completedAt, "MMM dd, yyyy h:mm a")}</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="messages" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Messages</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <MessageSquare className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                <p>No messages yet</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="photos" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Job Photos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <Camera className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                <p>No photos uploaded</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payment" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Payment Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Quoted Price</p>
                  <p className="text-xl font-semibold">${job.quotedPrice || "0.00"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Actual Price</p>
                  <p className="text-xl font-semibold">${job.actualPrice || job.quotedPrice || "0.00"}</p>
                </div>
              </div>
              
              {fleetAccount && (
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="font-semibold text-blue-900 mb-2">Fleet Account</p>
                  <p className="text-blue-700">{fleetAccount.companyName}</p>
                  <p className="text-sm text-blue-600">Tier: {fleetAccount.pricingTier.toUpperCase()}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Invoice Preview Dialog */}
      <Dialog open={showInvoicePreview} onOpenChange={setShowInvoicePreview}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Invoice Preview</DialogTitle>
            <DialogDescription>
              Review the invoice details before downloading or sending.
            </DialogDescription>
          </DialogHeader>
          
          {invoice && customer && (
            <InvoiceTemplate
              invoice={invoice}
              job={job}
              customer={customer}
              fleetAccount={fleetAccount}
              contractor={contractor}
              transactions={invoiceData?.transactions}
              onDownload={() => downloadInvoiceMutation.mutate(invoice.id)}
              onEmail={() => emailInvoiceMutation.mutate(invoice.id)}
              onPrint={() => window.print()}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}