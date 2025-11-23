import { useMemo, useState } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { WeatherWidget } from "@/components/weather-widget";
import { InvoiceTemplate } from "@/components/invoice-template";
import {
  Activity,
  Camera,
  Cloud,
  Download,
  FileText,
  Mail,
  MapPin,
  MessageSquare,
  Truck
} from "lucide-react";
import { format } from "date-fns";
import type {
  FleetAccount,
  Invoice,
  Job,
  JobPhoto,
  JobStatusHistory,
  User as UserType
} from "@shared/schema";

interface JobDetailsResponse {
  job: Job;
  photos: JobPhoto[];
  statusHistory: JobStatusHistory[];
}

const statusStyles: Record<
  Job["status"],
  { badge: string; label: string; timelineColor: string }
> = {
  new: { badge: "bg-gray-500", label: "New", timelineColor: "bg-gray-500" },
  assigned: { badge: "bg-blue-500", label: "Assigned", timelineColor: "bg-blue-500" },
  en_route: { badge: "bg-yellow-500", label: "En Route", timelineColor: "bg-yellow-500" },
  on_site: { badge: "bg-orange-500", label: "On Site", timelineColor: "bg-orange-500" },
  completed: { badge: "bg-green-600", label: "Completed", timelineColor: "bg-green-600" },
  cancelled: { badge: "bg-red-600", label: "Cancelled", timelineColor: "bg-red-600" },
};

const formatCurrency = (value?: string | number | null) => {
  if (value === null || value === undefined) return "$0.00";
  const numeric = typeof value === "string" ? Number(value) : value;
  if (Number.isNaN(numeric)) return "$0.00";
  return numeric.toLocaleString("en-US", { style: "currency", currency: "USD" });
};

const formatDateTime = (value?: string | Date | null, fallback: string = "—") => {
  if (!value) return fallback;
  try {
    return format(new Date(value), "MMM dd, yyyy h:mm a");
  } catch {
    return fallback;
  }
};

export default function JobDetails() {
  const [params] = useParams<{ jobId: string }>();
  const jobId = params?.jobId;
  const { toast } = useToast();
  const [showInvoicePreview, setShowInvoicePreview] = useState(false);

  const {
    data: jobResponse,
    isLoading: jobLoading,
    error: jobError,
  } = useQuery<JobDetailsResponse>({
    queryKey: ["/api/jobs", jobId],
    enabled: Boolean(jobId),
    queryFn: async () => apiRequest(`/api/jobs/${jobId}`, "GET"),
  });

  const {
    data: invoiceData,
    isLoading: invoiceLoading,
    refetch: refetchInvoice,
  } = useQuery({
    queryKey: ["/api/jobs", jobId, "invoice"],
    queryFn: async () => apiRequest(`/api/jobs/${jobId}/invoice`, "GET"),
    enabled: Boolean(jobId),
  });

  const invoice: Invoice | undefined = invoiceData?.invoice;
  const customer: UserType | undefined = invoiceData?.customer;
  const fleetAccount: FleetAccount | undefined = invoiceData?.fleetAccount;
  const contractor = invoiceData?.contractor;

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
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `invoice-${invoice?.invoiceNumber || "download"}.pdf`;
      document.body.appendChild(anchor);
      anchor.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(anchor);
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

  const emailInvoiceMutation = useMutation({
    mutationFn: async (invoiceId: string) => {
      const recipientEmail = customer?.email || jobResponse?.job?.customerEmail;
      if (!recipientEmail) {
        throw new Error("Missing customer email address");
      }
      return apiRequest(`/api/invoices/${invoiceId}/email`, "POST", {
        recipientEmail,
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

  if (jobLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="text-center space-y-3">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          <p className="text-muted-foreground">Loading job details…</p>
        </div>
      </div>
    );
  }

  if (jobError) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <Alert className="max-w-lg">
          <AlertTitle>Unable to load job</AlertTitle>
          <AlertDescription>
            {(jobError as Error).message || "Something went wrong while fetching this job."}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!jobResponse?.job) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <Card className="w-full max-w-lg">
          <CardHeader>
            <CardTitle>Job not found</CardTitle>
            <CardDescription>The requested job could not be located.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => history.back()}>Go Back</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const job = jobResponse.job;
  const jobPhotos = jobResponse.photos || [];
  const statusHistory = jobResponse.statusHistory || [];
  const statusMeta = statusStyles[job.status] ?? statusStyles.new;

  const issueDescription = job.description || "No description provided.";
  const serviceLocation =
    job.locationAddress ||
    (typeof job.location === "object" && job.location && "address" in job.location
      ? (job.location as any).address
      : null) ||
    "On-site service";

  const vehicleInfo = {
    make: job.vehicleMake,
    model: job.vehicleModel,
    year: job.vehicleYear,
    unitNumber: job.unitNumber,
    vin: job.vin,
  };

  const paymentSummary = {
    quoted: job.estimatedPrice || job.finalPrice,
    actual: job.finalPrice || job.estimatedPrice,
  };

  const timelineEntries = useMemo(() => {
    if (statusHistory.length) {
      return statusHistory.map(item => ({
        id: item.id,
        status: item.toStatus,
        date: item.createdAt,
        note: item.reason,
      }));
    }

    const fallback: Array<{ id: string; status: Job["status"]; date?: Date | string | null; note?: string }> = [
      { id: "created", status: "new", date: job.createdAt },
      { id: "assigned", status: "assigned", date: job.assignedAt },
      { id: "en_route", status: "en_route", date: job.enRouteAt },
      { id: "on_site", status: "on_site", date: job.arrivedAt },
      { id: "completed", status: "completed", date: job.completedAt },
    ];

    return fallback.filter(entry => entry.date);
  }, [statusHistory, job]);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8 space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Job #{job.jobNumber}</p>
          <h1 className="text-3xl font-bold text-foreground">Job Details</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Created {formatDateTime(job.createdAt)}
          </p>
        </div>
        <Badge className={`${statusMeta.badge} text-white px-4 py-2 text-base flex items-center gap-2`}>
          <Activity className="h-4 w-4" />
          {statusMeta.label}
        </Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Job Overview */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5" />
              Job Overview
            </CardTitle>
            <CardDescription>Core details about this service request.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm text-muted-foreground">Job Type</p>
                <Badge className={job.jobType === "emergency" ? "bg-orange-500" : "bg-blue-500"}>
                  {job.jobType === "emergency" ? "Emergency" : "Scheduled"}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <p className="font-semibold text-foreground">{statusMeta.label}</p>
              </div>
            </div>

            <Separator />

            <div>
              <p className="text-sm text-muted-foreground mb-1">Issue Description</p>
              <p>{issueDescription}</p>
            </div>

            <Separator />

            <div className="flex items-start gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">Service Location</p>
                <p className="text-sm">{serviceLocation}</p>
              </div>
            </div>

            {vehicleInfo.make || vehicleInfo.model || vehicleInfo.unitNumber || vehicleInfo.vin ? (
              <>
                <Separator />
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Vehicle Information</p>
                  <p className="text-sm font-medium">
                    {[vehicleInfo.year, vehicleInfo.make, vehicleInfo.model].filter(Boolean).join(" ")}
                  </p>
                  {vehicleInfo.unitNumber && (
                    <p className="text-xs text-muted-foreground">Unit #: {vehicleInfo.unitNumber}</p>
                  )}
                  {vehicleInfo.vin && (
                    <p className="text-xs text-muted-foreground font-mono">VIN: {vehicleInfo.vin}</p>
                  )}
                </div>
              </>
            ) : null}
          </CardContent>
        </Card>

        {/* Invoice Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Invoice & Payment
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {invoiceLoading ? (
              <p className="text-sm text-muted-foreground">Loading invoice…</p>
            ) : invoice ? (
              <>
                <div>
                  <p className="text-sm text-muted-foreground">Invoice Number</p>
                  <p className="font-mono text-sm">{invoice.invoiceNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge>
                    {invoice.status.toUpperCase()}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Amount</p>
                  <p className="text-2xl font-bold">{formatCurrency(invoice.totalAmount)}</p>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Button className="w-full" onClick={() => setShowInvoicePreview(true)}>
                    View Invoice
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => downloadInvoiceMutation.mutate(invoice.id)}
                    disabled={downloadInvoiceMutation.isPending}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    {downloadInvoiceMutation.isPending ? "Downloading…" : "Download PDF"}
                  </Button>
                  {customer?.email && (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => emailInvoiceMutation.mutate(invoice.id)}
                      disabled={emailInvoiceMutation.isPending}
                    >
                      <Mail className="h-4 w-4 mr-2" />
                      {emailInvoiceMutation.isPending ? "Sending…" : "Email Invoice"}
                    </Button>
                  )}
                </div>
              </>
            ) : (
              <div className="text-center text-sm text-muted-foreground">
                <FileText className="h-10 w-10 mx-auto mb-2 text-muted-foreground/60" />
                <p>No invoice generated yet.</p>
                {job.status === "completed" && (
                  <Button className="mt-4" onClick={() => refetchInvoice()}>
                    Generate Invoice
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Weather */}
        {job.location && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Cloud className="h-5 w-5" />
                Weather Impact
              </CardTitle>
            </CardHeader>
            <CardContent>
              <WeatherWidget
                jobId={job.id}
                compact={false}
                showAlerts
                showImpactScore
                showForecast={false}
              />
            </CardContent>
          </Card>
        )}
      </div>

      <Tabs defaultValue="timeline">
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
              <CardDescription>Milestones recorded for this job.</CardDescription>
            </CardHeader>
            <CardContent>
              {timelineEntries.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">
                  No timeline entries yet.
                </p>
              ) : (
                <div className="space-y-5">
                  {timelineEntries.map(entry => {
                    const meta = statusStyles[entry.status] ?? statusStyles.new;
                    return (
                      <div key={entry.id} className="flex items-start gap-3">
                        <div className={`h-3 w-3 rounded-full ${meta.timelineColor} mt-1`} />
                        <div>
                          <p className="font-medium">{meta.label}</p>
                          <p className="text-sm text-muted-foreground">{formatDateTime(entry.date)}</p>
                          {entry.note && (
                            <p className="text-xs text-muted-foreground mt-1">{entry.note}</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="messages" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Messages</CardTitle>
              <CardDescription>Real-time chat history will appear here.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="py-10 text-center text-sm text-muted-foreground">
                <MessageSquare className="mx-auto mb-3 h-10 w-10 text-muted-foreground/60" />
                No messages yet.
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="photos" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Job Photos</CardTitle>
              <CardDescription>Visual documentation uploaded by contractors.</CardDescription>
            </CardHeader>
            <CardContent>
              {jobPhotos.length === 0 ? (
                <div className="py-10 text-center text-sm text-muted-foreground">
                  <Camera className="mx-auto mb-3 h-10 w-10 text-muted-foreground/60" />
                  No photos uploaded.
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {jobPhotos.map(photo => (
                    <div key={photo.id} className="space-y-2">
                      <img
                        src={photo.photoUrl}
                        alt={photo.description || "Job photo"}
                        className="w-full rounded-lg border object-cover"
                      />
                      <p className="text-xs text-muted-foreground">
                        Uploaded {formatDateTime(photo.createdAt)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payment" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Payment Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">Quoted Price</p>
                  <p className="text-xl font-semibold">{formatCurrency(paymentSummary.quoted)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Actual Price</p>
                  <p className="text-xl font-semibold">{formatCurrency(paymentSummary.actual)}</p>
                </div>
              </div>

              {fleetAccount && (
                <div className="rounded-lg border bg-muted/40 p-4">
                  <p className="font-semibold">{fleetAccount.companyName}</p>
                  <p className="text-sm text-muted-foreground">
                    Tier: {fleetAccount.pricingTier?.toUpperCase() || "Standard"}
                  </p>
                  {fleetAccount.billingStatus && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Billing Status: {fleetAccount.billingStatus}
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={showInvoicePreview} onOpenChange={setShowInvoicePreview}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Invoice Preview</DialogTitle>
            <DialogDescription>Review the invoice before sending or downloading.</DialogDescription>
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
