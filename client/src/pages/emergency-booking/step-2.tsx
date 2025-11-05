import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
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
  Truck
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
  const [selectedIssue, setSelectedIssue] = useState("");
  const [showOtherInput, setShowOtherInput] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      issue: bookingData.issue || "",
      issueDescription: bookingData.issueDescription || "",
      unitNumber: bookingData.unitNumber || "",
      carrierName: bookingData.carrierName || "",
    },
  });

  // Submit job mutation
  const submitJobMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest('/api/auth/guest-booking', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: (response) => {
      // Store job info in localStorage for tracking
      localStorage.setItem('emergencyJobId', response.job.id);
      localStorage.setItem('emergencyJobNumber', response.job.jobNumber);
      
      onComplete({
        jobId: response.job.id,
        jobNumber: response.job.jobNumber,
        estimatedArrival: response.job.estimatedArrival || "15-30 minutes",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to submit emergency request. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleIssueSelect = (issueId: string) => {
    setSelectedIssue(issueId);
    form.setValue("issue", issueId);
    setShowOtherInput(issueId === "other");
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
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
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

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
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

    // Prepare job data
    const jobData = {
      guestPhone: bookingData.phone,
      guestEmail: bookingData.email,
      jobType: "emergency" as const,
      serviceTypeId: "emergency-repair", // This would be mapped to actual service type ID
      location: bookingData.location || {
        lat: 0,
        lng: 0,
        address: bookingData.manualLocation
      },
      locationAddress: bookingData.manualLocation || bookingData.location?.address || "",
      description: issueText,
      unitNumber: values.unitNumber,
      carrierName: values.carrierName,
      vehicleMake: "Unknown", // Could be enhanced with more fields
      vehicleModel: "Truck",
      urgencyLevel: 5, // Max urgency for emergency
      vehicleLocation: bookingData.location,
      photoUrl: photoUrl,
    };

    submitJobMutation.mutate(jobData);
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
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
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
                    <FormMessage />
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

          {/* Photo Upload */}
          <Card className="border-2">
            <CardContent className="p-6">
              <div className="space-y-3">
                <label htmlFor="photo-upload" className="block">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-14 text-base hover-elevate"
                    onClick={() => document.getElementById('photo-upload')?.click()}
                    data-testid="button-add-photo"
                  >
                    <Camera className="w-5 h-5 mr-2" />
                    {photoPreview ? "Change Photo" : "Add Photo (Optional)"}
                  </Button>
                </label>
                <input
                  id="photo-upload"
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handlePhotoSelect}
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
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => {
                        setPhotoFile(null);
                        setPhotoPreview("");
                      }}
                      data-testid="button-remove-photo"
                    >
                      Remove
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-3">
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
              disabled={submitJobMutation.isPending || isUploading}
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