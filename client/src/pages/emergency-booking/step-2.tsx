import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { 
  Camera, 
  Loader2, 
  Wrench,
  Battery,
  Thermometer,
  Fuel,
  AlertCircle,
  Zap,
  HelpCircle,
  Truck,
  Upload,
  X,
  CheckCircle,
  AlertTriangle,
  Clock,
  DollarSign,
  Shield
} from "lucide-react";
import { EmergencyBookingData } from "./index";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  issue: z.string().min(1, "Please select an issue"),
  issueDescription: z.string().optional(),
  unitNumber: z.string().optional(),
  carrierName: z.string().optional(),
});

const issues = [
  { id: "flat_tire", label: "Flat Tire", icon: Wrench },
  { id: "engine_wont_start", label: "Engine Won't Start", icon: Battery },
  { id: "overheating", label: "Overheating", icon: Thermometer },
  { id: "out_of_fuel", label: "Out of Fuel", icon: Fuel },
  { id: "brakes_issue", label: "Brakes Issue", icon: AlertCircle },
  { id: "electrical", label: "Electrical Problem", icon: Zap },
  { id: "other", label: "Other", icon: HelpCircle },
];

interface Step2Props {
  bookingData: EmergencyBookingData;
  onComplete: (data: Partial<EmergencyBookingData>) => void;
  onBack: () => void;
}

export default function Step2({ bookingData, onComplete, onBack }: Step2Props) {
  const [selectedIssue, setSelectedIssue] = useState(bookingData.issue || "");
  const [showOtherInput, setShowOtherInput] = useState((bookingData.issue || "") === "other");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [photoAnalysis, setPhotoAnalysis] = useState<any>(null);
  const [showAIAnalysis, setShowAIAnalysis] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const { toast } = useToast();

interface GuestBookingPayload {
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  location: { lat: number; lng: number };
  locationAddress: string;
  serviceTypeId: string;
  vehicleInfo: {
    make?: string;
    model?: string;
    year?: string;
    licensePlate?: string;
  };
  description: string;
  photos?: string[];
}

interface JobSubmissionPayload {
  jobPayload: Record<string, any>;
  guestPayload: GuestBookingPayload;
}

interface JobSubmissionResult {
  source: "guest" | "fallback";
  jobId?: string;
  jobNumber?: string;
  trackingLink?: string;
  estimatedArrival?: string;
  status?: string;
}
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      issue: bookingData.issue || "",
      issueDescription: bookingData.issueDescription || "",
      unitNumber: bookingData.unitNumber || "",
      carrierName: bookingData.carrierName || "",
    },
  });

  useEffect(() => {
    if (bookingData.issue) {
      setSelectedIssue(bookingData.issue);
      setShowOtherInput(bookingData.issue === "other");
      form.setValue("issue", bookingData.issue);
    }
    if (bookingData.issueDescription) {
      form.setValue("issueDescription", bookingData.issueDescription);
    }
    if (bookingData.unitNumber) {
      form.setValue("unitNumber", bookingData.unitNumber);
    }
    if (bookingData.carrierName) {
      form.setValue("carrierName", bookingData.carrierName);
    }
  }, [bookingData, form]);

  // Photo analysis mutation
  const analyzePhotoMutation = useMutation({
    mutationFn: async (photoBase64: string) => {
      return apiRequest('POST', '/api/ai/analyze-photo', {
        photo: photoBase64,
        context: "Emergency roadside truck repair request - analyze damage and provide repair recommendations"
      });
    },
    onSuccess: (analysis) => {
      setPhotoAnalysis(analysis);
      setShowAIAnalysis(true);
      setIsAnalyzing(false);
      
      // Auto-select issue based on AI analysis
      if (analysis.damageType) {
        const suggestedIssue = mapAnalysisToIssue(analysis.damageType);
        if (suggestedIssue) {
          handleIssueSelect(suggestedIssue);
        }
      }

      // Show severity alert if critical
      if (analysis.safetyRisk === "Critical" || analysis.severity === "Severe") {
        toast({
          title: "⚠️ Critical Issue Detected",
          description: "This appears to be a serious safety concern. Emergency assistance recommended.",
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      setIsAnalyzing(false);
      toast({
        title: "Analysis Failed",
        description: "Unable to analyze photo. You can still continue with manual selection.",
      });
    },
  });

  // Submit job mutation - prefer full guest workflow, fallback to legacy endpoint
  const submitJobMutation = useMutation<JobSubmissionResult, Error, JobSubmissionPayload>({
    mutationFn: async ({ jobPayload, guestPayload }) => {
      try {
        const response = await apiRequest('POST', '/api/emergency/book-guest', guestPayload);
        if (response?.job) {
          return {
            source: "guest",
            jobId: response.job.id,
            jobNumber: response.job.jobNumber,
            trackingLink: response.job.trackingLink,
            estimatedArrival: response.job.estimatedWaitTime || "30-45 minutes",
            status: response.job.status,
          };
        }
      } catch (error: any) {
        if (error?.status && error.status < 500) {
          throw error;
        }
        console.warn("[EmergencyBooking] Guest booking failed, falling back to /api/jobs/emergency", error);
      }

      const fallback = await apiRequest('POST', '/api/jobs/emergency', jobPayload);
      return {
        source: "fallback",
        jobId: fallback?.job?.id,
        jobNumber: fallback?.job?.jobNumber,
        trackingLink: fallback?.job?.trackingUrl
          ? `${window.location.origin}${fallback.job.trackingUrl}`
          : undefined,
        estimatedArrival: fallback?.job?.estimatedArrival || "15-30 minutes",
        status: fallback?.job?.status,
      };
    },
  });

  // Helper function to map AI analysis to issue type
  const mapAnalysisToIssue = (damageType: string): string => {
    const lowerDamage = damageType.toLowerCase();
    if (lowerDamage.includes("tire")) return "flat_tire";
    if (lowerDamage.includes("engine") || lowerDamage.includes("start")) return "engine_wont_start";
    if (lowerDamage.includes("overheat") || lowerDamage.includes("temperature")) return "overheating";
    if (lowerDamage.includes("fuel") || lowerDamage.includes("gas")) return "out_of_fuel";
    if (lowerDamage.includes("brake")) return "brakes_issue";
    if (lowerDamage.includes("electric") || lowerDamage.includes("battery")) return "electrical";
    return "other";
  };

  // Helper function to map issue to service type ID
  const mapIssueToServiceType = (issueId: string): string => {
    switch(issueId) {
      case "flat_tire":
        return "flat-tire";
      case "out_of_fuel":
        return "fuel-delivery";
      case "engine_wont_start":
      case "electrical":
        return "jump-start";
      case "overheating":
      case "brakes_issue":
      case "other":
      default:
        return "emergency-repair";
    }
  };

  const handleIssueSelect = (issueId: string) => {
    setSelectedIssue(issueId);
    form.setValue("issue", issueId);
    form.clearErrors("issue"); // Clear any validation errors when an issue is selected
    setShowOtherInput(issueId === "other");
    setSubmitError(null);
  };

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select a photo under 10MB",
          variant: "destructive",
        });
        return;
      }
      
      setPhotoFile(file);
      
      // Create preview and analyze photo
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setPhotoPreview(base64);
        
        // Start AI analysis
        setIsAnalyzing(true);
        analyzePhotoMutation.mutate(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const removePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview("");
    setPhotoAnalysis(null);
    setShowAIAnalysis(false);
  };

  const uploadPhoto = async (): Promise<string | undefined> => {
    if (!photoFile) return undefined;
    
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', photoFile);
      
      // In production, this would upload to object storage
      // For now, we'll store as base64 in the photo URL
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(photoFile);
      });
      
      return base64;
    } catch (error) {
      console.error('Photo upload error:', error);
      toast({
        title: "Photo upload failed",
        description: "The repair request will be submitted without the photo",
        variant: "destructive",
      });
      return undefined;
    } finally {
      setIsUploading(false);
    }
  };

  const resolvedLocation = useMemo(() => {
    if (!bookingData.location) return null;
    return {
      lat: bookingData.location.lat,
      lng: bookingData.location.lng,
      address: bookingData.manualLocation || bookingData.location.address || "Location provided",
    };
  }, [bookingData.location, bookingData.manualLocation]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setSubmitError(null);

    if (!resolvedLocation) {
      setSubmitError("We couldn't read your location. Please go back and share it again.");
      return;
    }
    
    // Upload photo if present
    const photoUrl = await uploadPhoto();
    
    // Get the appropriate issue description
    let issueText = values.issue;
    if (values.issue === "other" && values.issueDescription) {
      issueText = values.issueDescription;
    } else {
      const issueLabel = issues.find(i => i.id === values.issue)?.label;
      if (issueLabel) {
        issueText = issueLabel;
        if (values.issueDescription) {
          issueText += `: ${values.issueDescription}`;
        }
      }
    }

    const serviceTypeId = mapIssueToServiceType(values.issue);
    const vehicleInfo = {
      make: bookingData.carrierName || undefined,
      model: values.unitNumber || undefined,
      licensePlate: values.unitNumber || undefined,
    };

    const jobPayload = {
      type: 'emergency',
      jobType: "emergency",
      guestPhone: bookingData.phone,
      guestEmail: bookingData.email,
      customerName: bookingData.name || 'Guest Driver',
      customerPhone: bookingData.phone,
      customerEmail: bookingData.email,
      email: bookingData.email,
      serviceType: serviceTypeId,
      serviceTypeId,
      location: { lat: resolvedLocation.lat, lng: resolvedLocation.lng },
      locationAddress: resolvedLocation.address,
      description: issueText,
      unitNumber: values.unitNumber || undefined,
      carrierName: values.carrierName || undefined,
      vehicleMake: vehicleInfo.make || "Heavy-Duty Truck",
      vehicleModel: vehicleInfo.model || "Commercial Vehicle",
      urgencyLevel: 5,
      photoUrl: photoUrl || undefined,
      aiAnalysis: photoAnalysis || undefined,
    };

    const guestPayload: GuestBookingPayload = {
      customerName: bookingData.name || 'Guest Driver',
      customerPhone: bookingData.phone,
      customerEmail: bookingData.email,
      location: { lat: resolvedLocation.lat, lng: resolvedLocation.lng },
      locationAddress: resolvedLocation.address,
      serviceTypeId,
      vehicleInfo: {
        make: vehicleInfo.make,
        model: vehicleInfo.model,
        licensePlate: vehicleInfo.licensePlate,
      },
      description: issueText,
      photos: photoUrl ? [photoUrl] : undefined,
    };

    try {
      const response = await submitJobMutation.mutateAsync({ jobPayload, guestPayload });

      if (response?.jobId) {
        localStorage.setItem('emergencyJobId', response.jobId);
      }
      if (response?.jobNumber) {
        localStorage.setItem('emergencyJobNumber', response.jobNumber);
      }
      if (response?.trackingLink) {
        localStorage.setItem('emergencyTrackingLink', response.trackingLink);
      }

      onComplete({
        issue: values.issue,
        issueDescription: values.issueDescription,
        unitNumber: values.unitNumber,
        carrierName: values.carrierName,
        photoUrl: photoUrl || undefined,
        jobId: response?.jobId,
        jobNumber: response?.jobNumber,
        estimatedArrival: response?.estimatedArrival || "15-30 minutes",
        trackingLink: response?.trackingLink,
      });
    } catch (error: any) {
      const message = error?.message || "Failed to submit emergency request. Please try again.";
      setSubmitError(message);
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl sm:text-4xl font-bold text-foreground">
          What's Wrong?
        </h1>
        <p className="text-muted-foreground text-lg">
          Select the issue and we'll send the right help
        </p>
      </div>

      <Form {...form}>
        <form 
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-4"
        >
          {/* Validation Error Alert */}
          {form.formState.errors.issue && (
            <Alert variant="destructive" className="animate-in fade-in slide-in-from-top">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Required Field Missing</AlertTitle>
              <AlertDescription>
                Please select an issue type before submitting. Click on one of the buttons below to describe what's wrong with your vehicle.
              </AlertDescription>
            </Alert>
          )}

          {!resolvedLocation && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>We need your location</AlertTitle>
              <AlertDescription>
                Go back to Step 1 and share your GPS or highway location so dispatch can find you.
              </AlertDescription>
            </Alert>
          )}
          
          {/* Issue Selection */}
          <Card className="border-2">
            <CardContent className="p-6 space-y-4">
              <FormField
                control={form.control}
                name="issue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-medium">Select Issue</FormLabel>
                    <FormControl>
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                        {issues.map((issue) => {
                          const Icon = issue.icon;
                          return (
                            <Button
                              key={issue.id}
                              type="button"
                              variant={selectedIssue === issue.id ? "destructive" : "outline"}
                              className="h-20 flex flex-col items-center justify-center gap-2 hover-elevate active-elevate-2"
                              onClick={() => handleIssueSelect(issue.id)}
                              data-testid={`button-issue-${issue.id}`}
                              aria-pressed={selectedIssue === issue.id}
                            >
                              <Icon className="w-6 h-6" />
                              <span className="text-xs font-medium text-center leading-tight">
                                {issue.label}
                              </span>
                            </Button>
                          );
                        })}
                      </div>
                    </FormControl>
                    <FormMessage className="text-base font-medium text-destructive mt-2" />
                  </FormItem>
                )}
              />

              {/* Other Issue Description */}
              {showOtherInput && (
                <FormField
                  control={form.control}
                  name="issueDescription"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Describe the Issue</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Please describe what's wrong..."
                          className="min-h-[80px] text-base"
                          data-testid="textarea-issue-description"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {!showOtherInput && (
                <FormField
                  control={form.control}
                  name="issueDescription"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes for the mechanic <span className="text-muted-foreground text-xs">(optional)</span></FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Example: Trailer fully loaded, parked on shoulder, need steer tire."
                          className="min-h-[80px] text-base"
                          data-testid="textarea-issue-notes"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </CardContent>
          </Card>

          {/* Vehicle Info */}
          <Card className="border-2">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Truck className="w-5 h-5 text-muted-foreground" />
                <h3 className="text-base font-medium">Vehicle Info</h3>
                <Badge variant="outline" className="ml-auto">Optional</Badge>
              </div>
              
              <FormField
                control={form.control}
                name="unitNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unit/Truck Number</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="e.g., T-1234"
                        className="h-12 text-base"
                        data-testid="input-unit-number"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="carrierName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Carrier Name</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="e.g., ABC Transport"
                        className="h-12 text-base"
                        data-testid="input-carrier-name"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Photo Upload & AI Analysis */}
          <Card className="border-2">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Camera className="w-5 h-5 text-muted-foreground" />
                    <h3 className="text-base font-medium">Photo Evidence</h3>
                  </div>
                  <Badge variant="outline">Optional - AI Analysis Available</Badge>
                </div>

                <label htmlFor="photo-upload" className="block">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-14 text-base hover-elevate"
                    onClick={() => document.getElementById('photo-upload')?.click()}
                    disabled={isAnalyzing}
                    data-testid="button-add-photo"
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Analyzing Photo...
                      </>
                    ) : (
                      <>
                        <Upload className="w-5 h-5 mr-2" />
                        {photoPreview ? "Change Photo" : "Upload Photo for AI Analysis"}
                      </>
                    )}
                  </Button>
                </label>
                <input
                  id="photo-upload"
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handlePhotoSelect}
                  disabled={isAnalyzing}
                />
                
                {photoPreview && (
                  <div className="relative">
                    <img
                      src={photoPreview}
                      alt="Issue photo"
                      className="w-full h-48 object-cover rounded-lg"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2"
                      onClick={removePhoto}
                      disabled={isAnalyzing}
                      data-testid="button-remove-photo"
                    >
                      <X className="w-4 h-4" />
                    </Button>

                    {isAnalyzing && (
                      <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                        <div className="text-center text-white">
                          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                          <p className="text-sm font-medium">AI Analyzing Damage...</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* AI Analysis Results */}
                {photoAnalysis && showAIAnalysis && (
                  <Alert className={
                    photoAnalysis.severity === "Severe" ? "border-red-500 bg-red-50 dark:bg-red-950/20" :
                    photoAnalysis.severity === "Moderate" ? "border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20" :
                    "border-green-500 bg-green-50 dark:bg-green-950/20"
                  }>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle className="font-semibold">AI Analysis Complete</AlertTitle>
                    <AlertDescription>
                      <div className="mt-3 space-y-3">
                        {/* Damage Type & Severity */}
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <p className="text-xs text-muted-foreground">Issue Detected</p>
                            <p className="font-medium">{photoAnalysis.damageType}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Severity</p>
                            <Badge variant={
                              photoAnalysis.severity === "Severe" ? "destructive" :
                              photoAnalysis.severity === "Moderate" ? "secondary" :
                              "default"
                            }>
                              {photoAnalysis.severity}
                            </Badge>
                          </div>
                        </div>

                        {/* Safety Risk */}
                        <div className="flex items-center gap-2 p-2 rounded-lg bg-background/50">
                          <Shield className={`w-4 h-4 ${
                            photoAnalysis.safetyRisk === "Critical" ? "text-red-500" :
                            photoAnalysis.safetyRisk === "High" ? "text-orange-500" :
                            photoAnalysis.safetyRisk === "Medium" ? "text-yellow-500" :
                            "text-green-500"
                          }`} />
                          <div className="flex-1">
                            <p className="text-xs text-muted-foreground">Safety Risk</p>
                            <p className="text-sm font-medium">{photoAnalysis.safetyRisk}</p>
                          </div>
                          {!photoAnalysis.canDriveSafely && (
                            <Badge variant="destructive" className="text-xs">
                              DO NOT DRIVE
                            </Badge>
                          )}
                        </div>

                        {/* Time & Cost Estimates */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-muted-foreground" />
                            <div>
                              <p className="text-xs text-muted-foreground">Est. Repair Time</p>
                              <p className="text-sm font-medium">{photoAnalysis.estimatedRepairTime}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <DollarSign className="w-4 h-4 text-muted-foreground" />
                            <div>
                              <p className="text-xs text-muted-foreground">Est. Cost</p>
                              <p className="text-sm font-medium">{photoAnalysis.costEstimate}</p>
                            </div>
                          </div>
                        </div>

                        {/* Immediate Actions */}
                        {photoAnalysis.immediateActions && photoAnalysis.immediateActions.length > 0 && (
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Immediate Actions</p>
                            <ul className="text-sm space-y-1">
                              {photoAnalysis.immediateActions.slice(0, 3).map((action: string, idx: number) => (
                                <li key={idx} className="flex items-start gap-1">
                                  <CheckCircle className="w-3 h-3 text-green-500 mt-0.5" />
                                  <span className="text-xs">{action}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Services Needed */}
                        {photoAnalysis.servicesNeeded && photoAnalysis.servicesNeeded.length > 0 && (
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Services Required</p>
                            <div className="flex flex-wrap gap-1">
                              {photoAnalysis.servicesNeeded.map((service: string, idx: number) => (
                                <Badge key={idx} variant="outline" className="text-xs">
                                  {service}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* DOT Compliance Note */}
                        {photoAnalysis.dotCompliance && (
                          <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-950/30">
                            <p className="text-xs font-medium text-blue-700 dark:text-blue-300">
                              DOT Compliance: {photoAnalysis.dotCompliance}
                            </p>
                          </div>
                        )}
                      </div>
                    </AlertDescription>
                  </Alert>
                )}

                <p className="text-xs text-muted-foreground">
                  Upload a photo and our AI will instantly analyze the damage, estimate repair time, and suggest services needed.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={onBack}
              className="flex-1 h-14 hover-elevate"
              data-testid="button-back-step2"
            >
              ← Back
            </Button>
            <Button
              type="submit"
              size="lg"
              variant="destructive"
              disabled={submitJobMutation.isPending || isUploading || !resolvedLocation}
              className="flex-[2] h-16 text-lg font-semibold hover-elevate"
              data-testid="button-get-help"
            >
              {submitJobMutation.isPending ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                "GET HELP NOW"
              )}
            </Button>
          </div>

          {submitError && (
            <Alert variant="destructive">
              <AlertDescription>{submitError}</AlertDescription>
            </Alert>
          )}
        </form>
      </Form>

      {/* Emergency Notice */}
      <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
        <p className="text-sm text-center">
          <span className="font-semibold">Quick Response:</span> Average arrival time is 15 minutes
        </p>
      </div>
    </div>
  );
}
