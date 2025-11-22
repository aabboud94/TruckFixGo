import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Clock3, MapPin, PhoneCall, ShieldCheck } from "lucide-react";
import { useLocation } from "wouter";
import Step1 from "./step-1";
import Step2 from "./step-2";
import Confirmation from "./confirmation";

export interface EmergencyBookingData {
  // Step 1
  name?: string;
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
      <header className="sticky top-0 z-50 border-b bg-background/90 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
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
                <span className="text-xs text-muted-foreground">Live dispatch + guided intake</span>
              </div>
            </div>
            <div className="flex items-center gap-3 text-xs font-medium text-muted-foreground">
              <Badge variant="secondary" className="bg-orange-100 text-orange-700">Priority</Badge>
              <span className="hidden sm:inline">Avg dispatch in 6 minutes</span>
            </div>
          </div>
        </div>
      </header>

      {/* Step Content */}
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[1.6fr,1fr]">
          <section className="space-y-4">
            {currentStep < 3 && (
              <div className="flex flex-col gap-3 rounded-xl border bg-card p-4 text-sm text-muted-foreground shadow-sm sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2 font-semibold text-destructive">
                  <ShieldCheck className="h-4 w-4" />
                  Safety checks enabled
                </div>
                <div className="flex flex-wrap gap-3 text-xs text-foreground/80">
                  <span className="flex items-center gap-1"><MapPin className="h-4 w-4" />Live location lock</span>
                  <span className="flex items-center gap-1"><Clock3 className="h-4 w-4" />ETA tracking</span>
                  <span className="flex items-center gap-1"><PhoneCall className="h-4 w-4" />Dispatcher on standby</span>
                </div>
              </div>
            )}

            {currentStep < 3 && (
              <div className="rounded-xl border bg-muted/60 p-4 shadow-sm">
                <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <span>Guided emergency workflow</span>
                  <span>Step {currentStep} of 2</span>
                </div>
                <Progress value={progress} className="mt-3 h-2 rounded-full" />
              </div>
            )}

            <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
              {currentStep < 3 && (
                <div className="flex items-center justify-between border-b px-6 py-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Emergency intake</p>
                    <p className="text-lg font-semibold">Tell us what happened</p>
                  </div>
                  <Badge variant="outline" className="border-orange-200 text-orange-700">SOS mode</Badge>
                </div>
              )}
              <div className="p-6">
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
              </div>
            </div>
          </section>

          <aside className="space-y-4">
            <div className="rounded-xl border bg-card p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-foreground">Need to talk to dispatch?</p>
                  <p className="text-xs text-muted-foreground">We can start a job for you while you’re on the call.</p>
                </div>
                <Badge className="bg-orange-100 text-orange-700">24/7</Badge>
              </div>
              <div className="mt-4 flex flex-col gap-3">
                <Button variant="destructive" className="w-full" asChild>
                  <a href="tel:1-800-TRUCK-FIX" className="flex items-center justify-center gap-2">
                    <PhoneCall className="h-4 w-4" /> Call dispatch now
                  </a>
                </Button>
                <div className="rounded-lg border bg-muted/60 p-3 text-xs text-muted-foreground">
                  We’ll text you the job number, mechanic verification, and ETA once dispatched.
                </div>
              </div>
            </div>

            <div className="rounded-xl border bg-card p-5 shadow-sm">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Clock3 className="h-4 w-4 text-destructive" /> What happens after submission
              </div>
              <ul className="mt-3 space-y-3 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <div className="mt-1 h-2 w-2 rounded-full bg-destructive" /> We confirm your location and unit details.
                </li>
                <li className="flex items-start gap-2">
                  <div className="mt-1 h-2 w-2 rounded-full bg-destructive" /> A certified tech is dispatched with the right tools.
                </li>
                <li className="flex items-start gap-2">
                  <div className="mt-1 h-2 w-2 rounded-full bg-destructive" /> Live ETA + badge verification is shared with you and your fleet contact.
                </li>
              </ul>
            </div>

            <div className="rounded-xl border bg-card p-5 shadow-sm">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <ShieldCheck className="h-4 w-4 text-destructive" /> Safety checklist
              </div>
              <ul className="mt-3 space-y-2 text-xs text-muted-foreground">
                <li>• Move to a safe shoulder and enable hazards.</li>
                <li>• Share nearby landmarks to speed up arrival.</li>
                <li>• Have photos ready if safe to capture.</li>
              </ul>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}