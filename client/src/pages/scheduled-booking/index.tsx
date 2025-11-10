import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import Step1ServiceDate from "./step-1.tsx";
import Step2VehicleLocation from "./step-2.tsx";
import Step3Confirmation from "./step-3.tsx";

interface BookingData {
  // Step 1
  serviceTypeId?: string;
  scheduledDate?: string;
  scheduledTimeSlot?: string;
  
  // Step 2
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
  
  // Fleet info
  fleetAccountId?: string;
}

interface UserProfile {
  id: string;
  email?: string;
  phone?: string;
  role: string;
  firstName?: string;
  lastName?: string;
  fleetAccountId?: string;
}

export default function ScheduledBooking() {
  const [, setLocation] = useLocation();
  const [currentStep, setCurrentStep] = useState(1);
  const [bookingData, setBookingData] = useState<BookingData>({});
  
  // Get user profile to check for fleet account
  const { data: profile } = useQuery<UserProfile>({
    queryKey: ["/api/users/me"],
  });
  
  // Submit booking mutation
  const submitBooking = useMutation({
    mutationFn: async (data: BookingData) => {
      return apiRequest("POST", "/api/jobs/scheduled", data);
    },
    onSuccess: (response) => {
      toast({
        title: "Booking Confirmed!",
        description: `Your service has been scheduled. Job number: ${response.jobNumber}`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
      setLocation(`/jobs/${response.jobId}`);
    },
    onError: (error: any) => {
      toast({
        title: "Booking Failed",
        description: error.message || "Failed to create scheduled booking",
        variant: "destructive",
      });
    },
  });
  
  const handleStep1Complete = (data: Partial<BookingData>) => {
    setBookingData((prev) => ({ ...prev, ...data }));
    setCurrentStep(2);
  };
  
  const handleStep2Complete = (data: Partial<BookingData>) => {
    setBookingData((prev) => ({ ...prev, ...data }));
    setCurrentStep(3);
  };
  
  const handleConfirm = () => {
    // Add fleet account if user has one
    const finalData = {
      ...bookingData,
      fleetAccountId: profile?.fleetAccountId || undefined,
    };
    
    submitBooking.mutate(finalData);
  };
  
  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      setLocation("/dashboard");
    }
  };
  
  const progressValue = (currentStep / 3) * 100;
  
  const stepTitles = {
    1: "Select Service & Time",
    2: "Vehicle & Location",
    3: "Review & Confirm",
  };
  
  const stepDescriptions = {
    1: "Choose your service type and preferred appointment time",
    2: "Provide vehicle and pickup location details",
    3: "Review your booking and confirm",
  };
  
  return (
    <div className="container max-w-4xl mx-auto py-8">
      <Button
        variant="ghost"
        onClick={handleBack}
        className="mb-6"
        data-testid="button-back"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>
      
      <Card>
        <CardHeader>
          <CardTitle>Schedule Service Appointment</CardTitle>
          <CardDescription>
            Book your maintenance or repair service up to 30 days in advance
          </CardDescription>
          
          <div className="mt-6 space-y-2">
            <div className="flex justify-between text-sm">
              <span>Step {currentStep} of 3</span>
              <span>{stepTitles[currentStep as keyof typeof stepTitles]}</span>
            </div>
            <Progress value={progressValue} className="h-2" />
          </div>
        </CardHeader>
        
        <CardContent>
          {currentStep === 1 && (
            <Step1ServiceDate
              onNext={handleStep1Complete}
              initialData={bookingData}
            />
          )}
          
          {currentStep === 2 && (
            <Step2VehicleLocation
              onNext={handleStep2Complete}
              onBack={() => setCurrentStep(1)}
              initialData={bookingData}
              fleetAccountId={profile?.fleetAccountId}
            />
          )}
          
          {currentStep === 3 && (
            <Step3Confirmation
              bookingData={bookingData}
              onConfirm={handleConfirm}
              onBack={() => setCurrentStep(2)}
              isSubmitting={submitBooking.isPending}
            />
          )}
        </CardContent>
      </Card>
      
      {profile?.fleetAccountId && (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="text-sm">Fleet Account</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              This booking will be associated with your fleet account for centralized billing and management.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}