import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  CheckCircle, 
  MapPin, 
  Clock, 
  Phone, 
  MessageSquare,
  User,
  Copy,
  ExternalLink
} from "lucide-react";
import { EmergencyBookingData } from "./index";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

interface ConfirmationProps {
  bookingData: EmergencyBookingData;
}

export default function Confirmation({ bookingData }: ConfirmationProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const handleCopyJobId = () => {
    if (bookingData.jobNumber) {
      navigator.clipboard.writeText(bookingData.jobNumber);
      toast({
        title: "Copied!",
        description: "Job ID copied to clipboard",
      });
    }
  };

  const handleTrack = () => {
    // Navigate to tracking page with job ID
    if (bookingData.jobId) {
      setLocation(`/track/${bookingData.jobId}`);
    }
  };

  const handleCreateAccount = () => {
    // Navigate to signup with pre-filled data
    setLocation('/signup?from=emergency');
  };

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
                {bookingData.jobNumber || "EM-123456"}
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
                {bookingData.estimatedArrival || "15-30 minutes"}
              </p>
            </div>
          </div>
          
          <Separator className="my-4" />
          
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium">Location</p>
                <p className="text-sm text-muted-foreground">
                  {bookingData.manualLocation || 
                   (bookingData.location ? `GPS: ${bookingData.location.lat.toFixed(4)}, ${bookingData.location.lng.toFixed(4)}` : "Location captured")}
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <Phone className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium">Contact</p>
                <p className="text-sm text-muted-foreground">
                  {bookingData.phone}
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
                Pay directly to the mechanic after service
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
              <span className="font-medium">SMS Updates:</span> We'll send real-time updates to {bookingData.phone}
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
        >
          <MapPin className="w-5 h-5 mr-2" />
          Track Mechanic Location
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
          onClick={() => setLocation("/")}
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
    </div>
  );
}