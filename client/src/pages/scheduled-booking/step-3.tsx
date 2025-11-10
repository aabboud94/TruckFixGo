import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  CalendarDays, 
  Clock, 
  Truck, 
  MapPin, 
  DollarSign,
  AlertCircle,
  CheckCircle
} from "lucide-react";
import type { ServiceType } from "@shared/schema";

interface Step3Props {
  bookingData: {
    serviceTypeId?: string;
    scheduledDate?: string;
    scheduledTimeSlot?: string;
    vehicleId?: string;
    vin?: string;
    unitNumber?: string;
    vehicleMake?: string;
    vehicleModel?: string;
    vehicleYear?: string;
    location?: { lat: number; lng: number };
    locationAddress?: string;
    locationNotes?: string;
    description?: string;
  };
  onConfirm: () => void;
  onBack: () => void;
  isSubmitting: boolean;
}

export default function Step3Confirmation({ 
  bookingData, 
  onConfirm, 
  onBack, 
  isSubmitting 
}: Step3Props) {
  // Fetch service details for pricing
  const { data: serviceTypes } = useQuery<ServiceType[]>({
    queryKey: ["/api/service-types"],
  });
  
  const service = serviceTypes?.find(s => s.id === bookingData.serviceTypeId);
  
  // Format time slot for display
  const formatTimeSlot = (slot?: string) => {
    if (!slot) return "";
    const [start, end] = slot.split("-");
    return `${start} - ${end}`;
  };
  
  // Format date for display
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "";
    return format(new Date(dateStr), "EEEE, MMMM d, yyyy");
  };
  
  return (
    <div className="space-y-6">
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Please review your booking details before confirming. You can reschedule or cancel
          up to 24 hours before your appointment.
        </AlertDescription>
      </Alert>
      
      {/* Service Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Service Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Service Type</span>
            <span className="font-medium">{service?.name || "N/A"}</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground flex items-center gap-2">
              <CalendarDays className="h-4 w-4" />
              Date
            </span>
            <span className="font-medium">{formatDate(bookingData.scheduledDate)}</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Time
            </span>
            <span className="font-medium">{formatTimeSlot(bookingData.scheduledTimeSlot)}</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Duration</span>
            <span className="font-medium">{service?.estimatedDuration || 60} minutes</span>
          </div>
          
          <Separator />
          
          <div className="space-y-2">
            <span className="text-sm text-muted-foreground">Service Description</span>
            <p className="text-sm">{bookingData.description}</p>
          </div>
        </CardContent>
      </Card>
      
      {/* Vehicle Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Vehicle Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-sm text-muted-foreground">Make</span>
              <p className="font-medium">{bookingData.vehicleMake || "N/A"}</p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Model</span>
              <p className="font-medium">{bookingData.vehicleModel || "N/A"}</p>
            </div>
          </div>
          
          {bookingData.vehicleYear && (
            <div>
              <span className="text-sm text-muted-foreground">Year</span>
              <p className="font-medium">{bookingData.vehicleYear}</p>
            </div>
          )}
          
          {bookingData.unitNumber && (
            <div>
              <span className="text-sm text-muted-foreground">Unit Number</span>
              <p className="font-medium">{bookingData.unitNumber}</p>
            </div>
          )}
          
          {bookingData.vin && (
            <div>
              <span className="text-sm text-muted-foreground">VIN</span>
              <p className="font-mono text-sm">{bookingData.vin}</p>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Location Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Service Location
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <span className="text-sm text-muted-foreground">Address</span>
            <p className="font-medium">{bookingData.locationAddress || "N/A"}</p>
          </div>
          
          {bookingData.locationNotes && (
            <div>
              <span className="text-sm text-muted-foreground">Location Notes</span>
              <p className="text-sm">{bookingData.locationNotes}</p>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Pricing Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Pricing Estimate
          </CardTitle>
          <CardDescription>
            Final price may vary based on actual work performed
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Service Price</span>
              <span className="font-medium text-lg">
                Contact for pricing
              </span>
            </div>
            
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                This is a scheduled service booking. You will receive a confirmation
                email with a calendar invite after booking.
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
      </Card>
      
      {/* Action Buttons */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={onBack}
          disabled={isSubmitting}
          data-testid="button-back"
        >
          Back
        </Button>
        <Button
          onClick={onConfirm}
          disabled={isSubmitting}
          data-testid="button-confirm"
        >
          {isSubmitting ? "Booking..." : "Confirm Booking"}
        </Button>
      </div>
    </div>
  );
}