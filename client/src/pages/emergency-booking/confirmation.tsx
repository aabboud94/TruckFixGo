import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { 
  CheckCircle, 
  MapPin, 
  Clock, 
  Phone, 
  MessageSquare,
  User,
  Copy,
  ExternalLink,
  CreditCard,
  AlertCircle,
  DollarSign,
  Star,
  RefreshCw,
  ShieldCheck
} from "lucide-react";
import type { EmergencyBookingData, EmergencyTrackingResponse } from "@/types/emergency";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { loadEmergencyMeta, clearEmergencyMeta } from "@/hooks/use-emergency-workflow";
import Checkout from "@/components/checkout";
import { formatDistanceToNow } from "date-fns";

const ISSUE_LABELS: Record<string, string> = {
  flat_tire: "Flat tire",
  engine_wont_start: "Engine won't start",
  overheating: "Overheating",
  out_of_fuel: "Out of fuel",
  brakes_issue: "Brake issue",
  electrical: "Electrical problem",
  other: "Other issue",
};

interface ConfirmationProps {
  bookingData: EmergencyBookingData;
  trackingData?: EmergencyTrackingResponse;
  trackingError?: string;
  isTracking?: boolean;
  onRefreshTracking?: () => void;
}

export default function Confirmation({
  bookingData,
  trackingData,
  trackingError,
  isTracking = false,
  onRefreshTracking,
}: ConfirmationProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [showPayment, setShowPayment] = useState(false);
  const [paymentComplete, setPaymentComplete] = useState(false);
  const cachedMeta = loadEmergencyMeta();
  const mergedBooking = {
    ...(cachedMeta?.bookingSnapshot ?? {}),
    ...bookingData,
  } as EmergencyBookingData;
  const jobNumber = mergedBooking.jobNumber || cachedMeta?.jobNumber || trackingData?.job?.jobNumber;
  const jobId = mergedBooking.jobId || cachedMeta?.jobId || trackingData?.job?.id;
  const estimatedArrival = trackingData?.job?.estimatedArrival || mergedBooking.estimatedArrival || cachedMeta?.estimatedArrival;
  const trackingLink = mergedBooking.trackingLink || cachedMeta?.trackingLink;
  const trackingTarget = trackingLink || (jobId ? `/track/${jobId}` : null);
  const showTrackingCard = Boolean(trackingError || jobId || trackingData?.job);
  
  // Calculate estimated price (this would normally come from backend)
  const estimatedPrice = {
    serviceCost: 15000, // $150 base service
    emergencySurcharge: 5000, // $50 emergency fee
    distanceFee: 2500, // $25 distance fee
    tax: 1420, // 8% tax
    total: 23920 // $239.20 total
  };

  const handleCopyJobId = () => {
    if (jobNumber) {
      navigator.clipboard.writeText(jobNumber);
      toast({
        title: "Copied!",
        description: "Job ID copied to clipboard",
      });
    }
  };

  const handleTrack = () => {
    if (!trackingTarget) {
      toast({
        title: "Assigning mechanic",
        description: "We’ll unlock tracking as soon as a mechanic accepts the job."
      });
      return;
    }

    if (trackingTarget.startsWith("http")) {
      window.open(trackingTarget, "_blank", "noopener,noreferrer");
      return;
    }

    setLocation(trackingTarget);
  };

  const handleCreateAccount = () => {
    // Navigate to signup with pre-filled data
    setLocation('/signup?from=emergency');
  };

  const handleBackHome = () => {
    clearEmergencyMeta();
    setLocation("/");
  };

  const handlePaymentSuccess = (paymentId: string) => {
    setPaymentComplete(true);
    setShowPayment(false);
    toast({
      title: "Payment Successful",
      description: "Your payment has been processed. The mechanic is on the way!",
    });
  };

  const handlePayLater = () => {
    toast({
      title: "Pay on Completion",
      description: "You can pay after the service is completed",
    });
  };

  const issueLabel = mergedBooking.issue ? (ISSUE_LABELS[mergedBooking.issue] || mergedBooking.issue) : "Emergency roadside repair";
  const notes = mergedBooking.issueDescription?.trim() || "No additional notes were provided.";
  const vehicleSummary = mergedBooking.unitNumber || mergedBooking.carrierName
    ? [mergedBooking.unitNumber, mergedBooking.carrierName].filter(Boolean).join(" • ")
    : "Not provided";
  const contactSummary = mergedBooking.name
    ? `${mergedBooking.name} - ${mergedBooking.phone}`
    : mergedBooking.phone;
  const locationSummary = mergedBooking.manualLocation ||
    (mergedBooking.location ? `GPS pinned at ${mergedBooking.location.lat.toFixed(4)}, ${mergedBooking.location.lng.toFixed(4)}` : "Captured during intake");

  return (
    <div className="space-y-6">
      {/* Success Header */}
      <div className="text-center space-y-4">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle className="w-12 h-12 text-green-600" />
        </div>
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2">
            Help Is On The Way!
          </h1>
          <p className="text-muted-foreground text-lg">
            A mechanic has been dispatched to your location
          </p>
        </div>
      </div>

      {/* Job ID Card */}
      <Card className="border-2 border-green-500/20 bg-green-50/50">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Job ID</p>
              <p className="text-2xl font-bold font-mono" data-testid="text-job-id">
                {jobNumber || "EM-123456"}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyJobId}
              className="hover-elevate"
              data-testid="button-copy-job-id"
            >
              <Copy className="w-4 h-4 mr-2" />
              Copy
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Scene Photos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {mergedBooking.photoUrl ? (
            <>
              <img
                src={mergedBooking.photoUrl}
                alt="Uploaded damage photo"
                className="rounded-xl border object-cover w-full max-h-72"
              />
              <p className="text-xs text-muted-foreground">
                Thanks for sharing a photo—we’ve attached it to your job ticket.
              </p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              No photos yet. You can upload one later or text it to dispatch for faster diagnosis.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Live Tracking & Status */}
      {showTrackingCard && (
        <Card>
          <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle className="text-xl">Live Dispatch Status</CardTitle>
              <CardDescription>
                {trackingData?.job?.status
                  ? `Current status: ${trackingData.job.status.replace(/_/g, " ").toUpperCase()}`
                  : "We’re syncing with dispatch"}
              </CardDescription>
            </div>
            {trackingTarget && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleTrack}
                className="gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                Open tracking
              </Button>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase text-muted-foreground">Estimated arrival</p>
                <p className="text-lg font-semibold">{estimatedArrival || "Dispatch is assigning a nearby tech"}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onRefreshTracking}
                  disabled={isTracking}
                  className="gap-2"
                  data-testid="button-refresh-tracking"
                >
                  <RefreshCw className={`h-4 w-4 ${isTracking ? "animate-spin" : ""}`} />
                  {isTracking ? "Refreshing…" : "Refresh"}
                </Button>
                <Button variant="ghost" size="sm" onClick={handleTrack}>
                  View Map
                </Button>
              </div>
            </div>

            {trackingError && (
              <Alert variant="destructive">
                <AlertDescription>
                  {trackingError}. We’ll keep retrying automatically.
                </AlertDescription>
              </Alert>
            )}

            {trackingData?.contractor && (
              <div className="rounded-lg border bg-muted/40 p-4">
                <p className="text-xs font-semibold uppercase text-muted-foreground mb-2">
                  Assigned mechanic
                </p>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-base font-semibold">{trackingData.contractor.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {trackingData.contractor.company || "Independent partner"} • {trackingData.contractor.totalJobs || 0} jobs completed
                    </p>
                  </div>
                  <div className="flex gap-4 text-sm">
                    {trackingData.contractor.rating && (
                      <span className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-yellow-500" />
                        {trackingData.contractor.rating.toFixed(1)}
                      </span>
                    )}
                    <span className={`flex items-center gap-1 ${trackingData.contractor.isOnline ? "text-green-600" : "text-muted-foreground"}`}>
                      <ShieldCheck className="h-4 w-4" />
                      {trackingData.contractor.isOnline ? "Verified" : "Pending dispatch"}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {trackingData?.statusHistory && trackingData.statusHistory.length > 0 && (
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase text-muted-foreground">Recent updates</p>
                <div className="space-y-2">
                  {trackingData.statusHistory.slice(0, 4).map((entry, index) => (
                    <div key={`${entry.createdAt}-${index}`} className="flex items-start gap-3">
                      <div className="text-xs font-semibold text-muted-foreground min-w-[90px]">
                        {entry.createdAt
                          ? `${formatDistanceToNow(new Date(entry.createdAt), { addSuffix: true })}`
                          : "Just now"}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium capitalize">
                          {entry.toStatus?.replace(/_/g, " ") || "Status update"}
                        </p>
                        {entry.reason && (
                          <p className="text-sm text-muted-foreground">{entry.reason}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Payment Information - Service First, Pay Later */}
      {!paymentComplete && (
        <Card className="border-2 border-blue-500/20 bg-blue-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Service First Policy
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className="bg-blue-100/50 border-blue-200">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <AlertDescription>
                <span className="font-medium">No upfront payment required!</span>
                <br />
                Our mechanic will complete the service first. Payment will be arranged after the repair is done based on actual work performed.
              </AlertDescription>
            </Alert>
            
            <div className="space-y-2 text-sm">
              <p className="text-muted-foreground">
                Our transparent pricing policy ensures you only pay for the work that's actually completed. The mechanic will:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                <li>Diagnose the issue on-site</li>
                <li>Provide a detailed quote before starting work</li>
                <li>Complete the repairs with your approval</li>
                <li>Present the final invoice after completion</li>
              </ul>
            </div>
            
            <div className="p-3 bg-background rounded-lg border">
              <p className="text-sm font-medium mb-1">Payment Options Available:</p>
              <div className="flex gap-2 flex-wrap">
                <Badge variant="secondary">Credit Card</Badge>
                <Badge variant="secondary">Debit Card</Badge>
                <Badge variant="secondary">Fleet Check</Badge>
                <Badge variant="secondary">Company Account</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment Complete Badge */}
      {paymentComplete && (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription>
            <span className="font-medium">Payment Complete!</span> Your payment has been processed successfully.
          </AlertDescription>
        </Alert>
      )}

      {/* Request Summary */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle>Request summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Issue type</p>
            <p className="font-semibold text-foreground">{issueLabel}</p>
            <p className="text-muted-foreground">{notes}</p>
          </div>

          <Separator />

          <div className="space-y-1">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Vehicle / carrier</p>
            <p className="text-foreground">{vehicleSummary}</p>
          </div>

          <div className="space-y-1">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Contact</p>
            <p className="text-foreground break-words">{contactSummary}</p>
            {mergedBooking.email && (
              <p className="text-muted-foreground">{mergedBooking.email}</p>
            )}
          </div>

          <div className="space-y-1">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Location</p>
            <p className="text-foreground">{locationSummary}</p>
          </div>
        </CardContent>
      </Card>

      {/* Arrival Estimate */}
      <Card className="border-2">
        <CardContent className="p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-destructive/10 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-destructive" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Estimated Arrival</p>
              <p className="text-2xl font-bold text-destructive" data-testid="text-eta">
                {estimatedArrival || "15-30 minutes"}
              </p>
            </div>
          </div>
          
          <Separator className="my-4" />
          
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium">Location</p>
                <p className="text-sm text-muted-foreground break-words">
                  {mergedBooking.manualLocation || 
                   (mergedBooking.location ? `GPS: ${mergedBooking.location.lat.toFixed(4)}, ${mergedBooking.location.lng.toFixed(4)}` : "Location captured")}
                </p>
                {trackingLink && (
                  <p className="text-xs text-primary mt-2 break-words">
                    Tracking URL: {trackingLink}
                  </p>
                )}
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <Phone className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium">Contact</p>
                <p className="text-sm text-muted-foreground">
                  {mergedBooking.phone}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* What's Next */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <h3 className="font-semibold text-lg">What Happens Next?</h3>
          
          <div className="space-y-3">
            <div className="flex gap-3">
              <Badge className="h-6 w-6 rounded-full p-0 flex items-center justify-center">
                1
              </Badge>
              <p className="text-sm flex-1">
                You'll receive an SMS when the mechanic is en route
              </p>
            </div>
            
            <div className="flex gap-3">
              <Badge className="h-6 w-6 rounded-full p-0 flex items-center justify-center">
                2
              </Badge>
              <p className="text-sm flex-1">
                Track the mechanic's location in real-time
              </p>
            </div>
            
            <div className="flex gap-3">
              <Badge className="h-6 w-6 rounded-full p-0 flex items-center justify-center">
                3
              </Badge>
              <p className="text-sm flex-1">
                Mechanic will diagnose and fix the issue on-site
              </p>
            </div>
            
            <div className="flex gap-3">
              <Badge className="h-6 w-6 rounded-full p-0 flex items-center justify-center">
                4
              </Badge>
              <p className="text-sm flex-1">
                Review final invoice and complete payment after service
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SMS Notification */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <MessageSquare className="w-5 h-5 text-primary" />
            <p className="text-sm">
              <span className="font-medium">SMS Updates:</span> We'll send real-time updates to {mergedBooking.phone}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="space-y-3">
        <Button
          size="lg"
          variant="default"
          onClick={handleTrack}
          className="w-full h-14 text-lg font-semibold hover-elevate"
          data-testid="button-track-mechanic"
          disabled={!trackingTarget}
        >
          <MapPin className="w-5 h-5 mr-2" />
          {trackingTarget ? "Track Mechanic Location" : "Waiting for mechanic assignment"}
        </Button>
        
        <Button
          size="lg"
          variant="outline"
          onClick={handleCreateAccount}
          className="w-full h-14 hover-elevate"
          data-testid="button-create-account"
        >
          <User className="w-5 h-5 mr-2" />
          Create Account for Easy Tracking
        </Button>
        
        <Button
          size="lg"
          variant="ghost"
          onClick={handleBackHome}
          className="w-full h-12"
          data-testid="button-back-home"
        >
          Back to Homepage
        </Button>
      </div>

      {/* Support Info */}
      <div className="text-center text-sm text-muted-foreground">
        <p>Need help? Call us at</p>
        <a 
          href="tel:1-800-FIX-TRUCK" 
          className="font-semibold text-primary hover:underline"
          data-testid="link-support-phone"
        >
          1-800-FIX-TRUCK
        </a>
      </div>

      {/* Payment Dialog */}
      <Dialog open={showPayment} onOpenChange={setShowPayment}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Complete Payment</DialogTitle>
            <DialogDescription>
              Choose your payment method to confirm the emergency service request
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            <Checkout
              jobId={jobId}
              amount={estimatedPrice.total}
              serviceCost={estimatedPrice.serviceCost}
              emergencySurcharge={estimatedPrice.emergencySurcharge}
              distanceFee={estimatedPrice.distanceFee}
              tax={estimatedPrice.tax}
              onSuccess={handlePaymentSuccess}
              onCancel={() => setShowPayment(false)}
              isEmergency={true}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
