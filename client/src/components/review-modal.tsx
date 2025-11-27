import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  Star,
  Clock,
  User,
  Wrench,
  DollarSign,
  Camera,
  X,
  Upload,
  AlertCircle,
  CheckCircle2,
  Sparkles
} from "lucide-react";

// Review form schema
const reviewFormSchema = z.object({
  overallRating: z.number().min(1).max(5),
  timelinessRating: z.number().min(1).max(5).optional(),
  professionalismRating: z.number().min(1).max(5).optional(),
  qualityRating: z.number().min(1).max(5).optional(),
  valueRating: z.number().min(1).max(5).optional(),
  reviewTitle: z.string().max(200).optional(),
  reviewText: z.string().max(2000).optional(),
  isAnonymous: z.boolean().default(false),
  customerName: z.string().max(100).optional(),
  photoUrls: z.array(z.string()).default([]),
  incentiveAccepted: z.boolean().default(false)
});

type ReviewFormValues = z.infer<typeof reviewFormSchema>;

interface ReviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jobId: string;
  contractorName?: string;
  serviceType?: string;
  completedAt?: Date;
  incentive?: {
    type: string;
    value: string;
    code?: string;
  };
}

interface StarRatingProps {
  value: number;
  onChange: (value: number) => void;
  size?: "sm" | "md" | "lg";
  label?: string;
  description?: string;
  icon?: React.ElementType;
}

function StarRating({ value, onChange, size = "md", label, description, icon: Icon }: StarRatingProps) {
  const [hoverValue, setHoverValue] = useState(0);
  
  const sizes = {
    sm: "h-6 w-6",
    md: "h-8 w-8",
    lg: "h-10 w-10"
  };
  
  const getRatingText = (rating: number) => {
    const texts = ["Poor", "Fair", "Good", "Very Good", "Excellent"];
    return texts[rating - 1] || "";
  };
  
  return (
    <div className="space-y-2">
      {label && (
        <div className="flex items-center gap-2">
          {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
          <span className="text-sm font-medium">{label}</span>
        </div>
      )}
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            className="transition-transform hover:scale-110"
            onClick={() => onChange(star)}
            onMouseEnter={() => setHoverValue(star)}
            onMouseLeave={() => setHoverValue(0)}
            data-testid={`star-rating-${star}`}
          >
            <Star
              className={`${sizes[size]} ${
                star <= (hoverValue || value)
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-gray-300"
              } transition-colors`}
            />
          </button>
        ))}
        <span className="ml-2 text-sm text-muted-foreground">
          {getRatingText(hoverValue || value)}
        </span>
      </div>
    </div>
  );
}

export function ReviewModal({
  open,
  onOpenChange,
  jobId,
  contractorName = "the contractor",
  serviceType = "service",
  completedAt,
  incentive
}: ReviewModalProps) {
  const { toast } = useToast();
  const [uploadedPhotos, setUploadedPhotos] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [step, setStep] = useState(1);
  
  const form = useForm<ReviewFormValues>({
    resolver: zodResolver(reviewFormSchema),
    defaultValues: {
      overallRating: 0,
      timelinessRating: 0,
      professionalismRating: 0,
      qualityRating: 0,
      valueRating: 0,
      reviewTitle: "",
      reviewText: "",
      isAnonymous: false,
      customerName: "",
      photoUrls: [],
      incentiveAccepted: false
    }
  });
  
  const submitReview = useMutation({
    mutationFn: async (data: ReviewFormValues) => {
      return apiRequest("/api/reviews", "POST", {
        ...data,
        jobId,
        photoUrls: uploadedPhotos
      });
    },
    onSuccess: () => {
      toast({
        title: "Review submitted!",
        description: incentive?.code 
          ? `Thank you for your feedback! Your discount code is: ${incentive.code}`
          : "Thank you for your feedback!"
      });
      queryClient.invalidateQueries({ queryKey: ["/api/jobs", jobId] });
      queryClient.invalidateQueries({ queryKey: ["/api/reviews"] });
      onOpenChange(false);
      form.reset();
      setUploadedPhotos([]);
      setStep(1);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to submit review",
        description: error.message || "Please try again later",
        variant: "destructive"
      });
    }
  });
  
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    setIsUploading(true);
    const file = e.target.files[0];
    
    // In production, upload to cloud storage
    // For now, create a local URL
    const url = URL.createObjectURL(file);
    setUploadedPhotos([...uploadedPhotos, url]);
    setIsUploading(false);
    
    toast({
      title: "Photo added",
      description: "Photo has been added to your review"
    });
  };
  
  const removePhoto = (index: number) => {
    const newPhotos = uploadedPhotos.filter((_, i) => i !== index);
    setUploadedPhotos(newPhotos);
  };
  
  const onSubmit = (data: ReviewFormValues) => {
    submitReview.mutate(data);
  };
  
  const canProceed = () => {
    if (step === 1) return form.watch("overallRating") > 0;
    return true;
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            {step === 1 ? "Rate Your Experience" : "Add Details (Optional)"}
          </DialogTitle>
          <DialogDescription>
            {step === 1 
              ? `How was your ${serviceType} experience with ${contractorName}?`
              : "Help other customers by sharing more about your experience"
            }
          </DialogDescription>
          {incentive && (
            <Badge variant="secondary" className="inline-flex gap-1 mt-2">
              <Sparkles className="h-3 w-3" />
              Leave a review and get {incentive.value} off your next service!
            </Badge>
          )}
        </DialogHeader>
        
        {/* Progress indicator */}
        <div className="flex gap-2 mt-4">
          <div className={`h-1 flex-1 rounded ${step >= 1 ? 'bg-primary' : 'bg-gray-200'}`} />
          <div className={`h-1 flex-1 rounded ${step >= 2 ? 'bg-primary' : 'bg-gray-200'}`} />
        </div>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {step === 1 ? (
              <>
                {/* Overall Rating */}
                <FormField
                  control={form.control}
                  name="overallRating"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-lg font-semibold">
                        Overall Experience
                      </FormLabel>
                      <FormControl>
                        <StarRating
                          value={field.value}
                          onChange={field.onChange}
                          size="lg"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Separator />
                
                {/* Category Ratings */}
                <div className="space-y-4">
                  <h3 className="font-medium">Rate specific aspects</h3>
                  
                  <FormField
                    control={form.control}
                    name="timelinessRating"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <StarRating
                            value={field.value || 0}
                            onChange={field.onChange}
                            size="sm"
                            label="Timeliness"
                            description="Did they arrive on time?"
                            icon={Clock}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="professionalismRating"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <StarRating
                            value={field.value || 0}
                            onChange={field.onChange}
                            size="sm"
                            label="Professionalism"
                            description="Were they courteous and professional?"
                            icon={User}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="qualityRating"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <StarRating
                            value={field.value || 0}
                            onChange={field.onChange}
                            size="sm"
                            label="Quality of Work"
                            description="Was the work performed well?"
                            icon={Wrench}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="valueRating"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <StarRating
                            value={field.value || 0}
                            onChange={field.onChange}
                            size="sm"
                            label="Value for Money"
                            description="Was the pricing fair?"
                            icon={DollarSign}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </>
            ) : (
              <>
                {/* Written Review */}
                <FormField
                  control={form.control}
                  name="reviewTitle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Review Title (Optional)</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Summarize your experience"
                          {...field}
                          data-testid="input-review-title"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="reviewText"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Your Review (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Share details about your experience to help other customers..."
                          className="min-h-[120px] resize-none"
                          {...field}
                          data-testid="textarea-review-text"
                        />
                      </FormControl>
                      <FormDescription>
                        {field.value?.length || 0}/2000 characters
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Photo Upload */}
                <div className="space-y-2">
                  <Label>Add Photos (Optional)</Label>
                  <div className="flex gap-2 flex-wrap">
                    {uploadedPhotos.map((photo, index) => (
                      <div key={index} className="relative">
                        <img
                          src={photo}
                          alt={`Review photo ${index + 1}`}
                          className="h-20 w-20 object-cover rounded"
                        />
                        <button
                          type="button"
                          onClick={() => removePhoto(index)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                          data-testid={`button-remove-photo-${index}`}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                    
                    {uploadedPhotos.length < 5 && (
                      <label className="h-20 w-20 border-2 border-dashed border-gray-300 rounded flex items-center justify-center cursor-pointer hover:border-gray-400 transition-colors">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handlePhotoUpload}
                          className="hidden"
                          disabled={isUploading}
                        />
                        {isUploading ? (
                          <div className="animate-spin h-5 w-5 border-2 border-gray-400 border-t-transparent rounded-full" />
                        ) : (
                          <Camera className="h-6 w-6 text-gray-400" />
                        )}
                      </label>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Add up to 5 photos of the completed work
                  </p>
                </div>
                
                {/* Anonymous Option */}
                <FormField
                  control={form.control}
                  name="isAnonymous"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2">
                      <FormControl>
                        <Checkbox 
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="checkbox-anonymous"
                        />
                      </FormControl>
                      <FormLabel className="text-sm font-normal cursor-pointer">
                        Post as anonymous
                      </FormLabel>
                    </FormItem>
                  )}
                />
                
                {/* Display Name */}
                {!form.watch("isAnonymous") && (
                  <FormField
                    control={form.control}
                    name="customerName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Display Name</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="How should we display your name?"
                            {...field}
                            data-testid="input-customer-name"
                          />
                        </FormControl>
                        <FormDescription>
                          Leave blank to use your account name
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                
                {/* Incentive Acknowledgement */}
                {incentive && (
                  <Card className="bg-blue-50 border-blue-200">
                    <CardContent className="p-4">
                      <FormField
                        control={form.control}
                        name="incentiveAccepted"
                        render={({ field }) => (
                          <FormItem className="flex items-start space-x-2">
                            <FormControl>
                              <Checkbox 
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                data-testid="checkbox-incentive"
                              />
                            </FormControl>
                            <div className="space-y-1">
                              <FormLabel className="text-sm font-normal cursor-pointer">
                                Yes, I want {incentive.value} off my next service!
                              </FormLabel>
                              <FormDescription className="text-xs">
                                Your discount code will be shown after submitting your review
                              </FormDescription>
                            </div>
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>
                )}
              </>
            )}
            
            {/* Actions */}
            <div className="flex justify-between pt-4">
              {step === 2 && (
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => setStep(1)}
                  data-testid="button-back"
                >
                  Back
                </Button>
              )}
              
              <div className="flex gap-2 ml-auto">
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  data-testid="button-cancel"
                >
                  Cancel
                </Button>
                
                {step === 1 ? (
                  <Button
                    type="button"
                    onClick={() => setStep(2)}
                    disabled={!canProceed()}
                    data-testid="button-next"
                  >
                    Next
                  </Button>
                ) : (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        form.setValue("reviewText", "");
                        form.setValue("reviewTitle", "");
                        form.handleSubmit(onSubmit)();
                      }}
                      disabled={submitReview.isPending}
                      data-testid="button-skip"
                    >
                      Skip & Submit
                    </Button>
                    <Button
                      type="submit"
                      disabled={submitReview.isPending}
                      data-testid="button-submit-review"
                    >
                      {submitReview.isPending ? "Submitting..." : "Submit Review"}
                    </Button>
                  </>
                )}
              </div>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
