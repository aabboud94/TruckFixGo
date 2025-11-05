import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";
import Step1 from "./step-1";
import Step2 from "./step-2";
import Confirmation from "./confirmation";

export interface EmergencyBookingData {
  // Step 1
  location?: { lat: number; lng: number; address?: string };
  manualLocation?: string;
  phone: string;
  email?: string;
  
  // Step 2
  issue: string;
  issueDescription?: string;
  unitNumber?: string;
  carrierName?: string;
  photoUrl?: string;
  
  // Response
  jobId?: string;
  jobNumber?: string;
  estimatedArrival?: string;
}

export default function EmergencyBooking() {
  const [currentStep, setCurrentStep] = useState(1);
  const [bookingData, setBookingData] = useState<EmergencyBookingData>({
    phone: "",
  });
  const [, setLocation] = useLocation();

  const handleStepComplete = (stepData: Partial<EmergencyBookingData>) => {
    setBookingData(prev => ({ ...prev, ...stepData }));
    
    if (currentStep === 1) {
      setCurrentStep(2);
    } else if (currentStep === 2) {
      // Submit will be handled by Step2 component
      setCurrentStep(3);
    }
  };

  const handleBack = () => {
    if (currentStep > 1 && currentStep < 3) {
      setCurrentStep(currentStep - 1);
    } else {
      setLocation("/");
    }
  };

  const progress = currentStep === 3 ? 100 : (currentStep / 2) * 100;

  return (
    <div className="min-h-screen bg-background">
      {/* Emergency Header */}
      <header className="sticky top-0 z-50 bg-background border-b">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleBack}
                className="hover-elevate"
                data-testid="button-back-emergency"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="flex flex-col">
                <span className="text-2xl font-bold text-destructive">Emergency Repair</span>
                <span className="text-xs text-muted-foreground">24/7 Immediate Response</span>
              </div>
            </div>
            {currentStep < 3 && (
              <div className="text-sm font-medium text-muted-foreground">
                Step {currentStep} of 2
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Progress Bar */}
      {currentStep < 3 && (
        <div className="w-full bg-muted">
          <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
            <Progress value={progress} className="h-2 rounded-none" />
          </div>
        </div>
      )}

      {/* Step Content */}
      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {currentStep === 1 && (
          <Step1 
            initialData={bookingData}
            onComplete={handleStepComplete}
          />
        )}
        {currentStep === 2 && (
          <Step2
            bookingData={bookingData}
            onComplete={handleStepComplete}
            onBack={() => setCurrentStep(1)}
          />
        )}
        {currentStep === 3 && (
          <Confirmation
            bookingData={bookingData}
          />
        )}
      </main>
    </div>
  );
}