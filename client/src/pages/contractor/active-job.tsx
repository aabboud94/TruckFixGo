import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useTrackingWebSocket } from "@/hooks/use-tracking-websocket";
import JobPhotoGallery from "@/components/job-photo-gallery";
import {
  MapPin,
  Phone,
  Navigation,
  Camera,
  MessageSquare,
  CheckCircle,
  AlertCircle,
  Truck,
  Clock,
  DollarSign,
  Wifi,
  WifiOff,
  Upload,
  X,
  Send,
  Loader2,
  Shield,
  AlertTriangle,
  Wrench,
  ClipboardList,
  HelpCircle
} from "lucide-react";
import { format } from "date-fns";

interface ActiveJobData {
  job: any;
  customer: any;
  messages: any[];
}

export default function ContractorActiveJob() {
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const [isSharingLocation, setIsSharingLocation] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<GeolocationPosition | null>(null);
  const [selectedPhotos, setSelectedPhotos] = useState<File[]>([]);
  const [completionNotes, setCompletionNotes] = useState("");
  const [messageText, setMessageText] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [photoAnalyses, setPhotoAnalyses] = useState<any[]>([]);
  const [repairRecommendations, setRepairRecommendations] = useState<any>(null);
  const locationWatchId = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch active job
  const { data: activeJobData, isLoading } = useQuery<ActiveJobData>({
    queryKey: ["/api/contractor/active-job"],
    refetchInterval: 30000
  });

  const job = activeJobData?.job;
  const customer = activeJobData?.customer;
  const messages = activeJobData?.messages || [];

  // WebSocket connection for real-time tracking
  const {
    isConnected,
    sendLocationUpdate,
    sendStatusUpdate
  } = useTrackingWebSocket({
    jobId: job?.id || "",
    userId: "contractor-id", // This would come from auth context
    role: "contractor",
    enabled: !!job?.id
  });

  // Update job status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async (status: string) => {
      // Safety check: Ensure job and job.id exist
      if (!job || !job.id) {
        console.error('Cannot update status: Job or Job ID is missing', { 
          job, 
          jobId: job?.id,
          status 
        });
        throw new Error('Job information is not available. Please refresh the page.');
      }
      
      console.log('Updating job status:', { 
        jobId: job.id, 
        newStatus: status,
        currentStatus: job.status 
      });
      
      return await apiRequest("PATCH", `/api/jobs/${job.id}/status`, { status });
    },
    onSuccess: (data, status) => {
      console.log('Job status updated successfully:', { data, status });
      toast({
        title: "Status Updated",
        description: `Job status changed to ${status.replace('_', ' ')}`
      });
      queryClient.invalidateQueries({ queryKey: ["/api/contractor/active-job"] });
      sendStatusUpdate(status);
    },
    onError: (error: any) => {
      // Log detailed error for debugging
      console.error('Failed to update job status:', {
        error: error.message || error,
        response: error.response,
        data: error.response?.data,
        status: error.response?.status,
        jobId: job?.id,
        attemptedStatus: error.config?.data
      });
      
      const errorMessage = error.response?.data?.message || 
                          error.message || 
                          "Failed to update job status. Please check your connection and try again.";
      
      toast({
        title: "Status Update Failed",
        description: errorMessage,
        variant: "destructive"
      });
    }
  });

  // Complete job mutation
  const completeJobMutation = useMutation({
    mutationFn: async () => {
      // Safety check: Ensure job and job.id exist
      if (!job || !job.id) {
        console.error('Cannot complete job: Job or Job ID is missing', { 
          job,
          jobId: job?.id 
        });
        throw new Error('Job information is not available. Please refresh the page.');
      }
      
      console.log('Completing job:', { 
        jobId: job.id,
        completionNotes,
        photosCount: selectedPhotos.length
      });
      
      // Note: The server expects 'completionNotes' and 'finalPhotos'
      return await apiRequest("POST", `/api/jobs/${job.id}/complete`, {
        completionNotes: completionNotes || '',
        finalPhotos: selectedPhotos.map(f => f.name) // In real app, would upload first
      });
    },
    onSuccess: (data) => {
      console.log('Job completed successfully:', { data });
      toast({
        title: "Job Completed",
        description: "Great work! The job has been marked as complete."
      });
      navigate("/contractor/dashboard");
    },
    onError: (error: any) => {
      // Log detailed error for debugging
      console.error('Failed to complete job:', {
        error: error.message || error,
        response: error.response,
        data: error.response?.data,
        status: error.response?.status,
        jobId: job?.id,
        completionNotes,
        photosCount: selectedPhotos.length
      });
      
      const errorMessage = error.response?.data?.message || 
                          error.message || 
                          "Failed to complete job. Please ensure all required fields are filled.";
      
      toast({
        title: "Job Completion Failed",
        description: errorMessage,
        variant: "destructive"
      });
    }
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (message: string) => {
      // Safety check: Ensure job and job.id exist
      if (!job || !job.id) {
        console.error('Cannot send message: Job or Job ID is missing', { 
          job,
          jobId: job?.id 
        });
        throw new Error('Job information is not available. Please refresh the page.');
      }
      
      return await apiRequest("POST", `/api/jobs/${job.id}/messages`, { message });
    },
    onSuccess: () => {
      setMessageText("");
      queryClient.invalidateQueries({ queryKey: ["/api/contractor/active-job"] });
    },
    onError: (error: any) => {
      console.error('Failed to send message:', {
        error: error.message || error,
        response: error.response,
        jobId: job?.id
      });
      
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive"
      });
    }
  });

  // AI Photo analysis mutation
  const analyzePhotoMutation = useMutation({
    mutationFn: async (photoBase64: string) => {
      return apiRequest('POST', '/api/ai/analyze-photo', {
        photo: photoBase64,
        context: `Contractor analyzing damage for Job #${job?.jobNumber}. ${job?.description || ''}`
      });
    },
    onSuccess: (analysis) => {
      setPhotoAnalyses(prev => [...prev, analysis]);
      setIsAnalyzing(false);
      
      // Automatically fetch repair recommendations based on analysis
      if (analysis.damageType) {
        getRepairRecommendationsMutation.mutate({
          issueDescription: `${analysis.damageType} - ${analysis.severity} severity`,
          photoAnalysis: analysis
        });
      }

      // Alert if critical safety issue
      if (analysis.safetyRisk === "Critical" || !analysis.canDriveSafely) {
        toast({
          title: "⚠️ Safety Alert",
          description: "Critical safety issue detected. Advise customer not to drive.",
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      setIsAnalyzing(false);
      toast({
        title: "Analysis Failed",
        description: "Unable to analyze photo. Please try again.",
        variant: "destructive"
      });
    },
  });

  // Get repair recommendations mutation
  const getRepairRecommendationsMutation = useMutation({
    mutationFn: async (data: { issueDescription: string; photoAnalysis?: any }) => {
      return apiRequest('POST', '/api/ai/repair-recommendations', data);
    },
    onSuccess: (recommendations) => {
      setRepairRecommendations(recommendations);
    },
    onError: (error: any) => {
      console.error("Repair recommendations error:", error);
      // Silent failure - recommendations are optional
    },
  });

  // Handle location sharing
  useEffect(() => {
    if (isSharingLocation && job?.id) {
      // Start watching location
      if (navigator.geolocation) {
        locationWatchId.current = navigator.geolocation.watchPosition(
          (position) => {
            setCurrentLocation(position);
            sendLocationUpdate({
              lat: position.coords.latitude,
              lng: position.coords.longitude
            });
          },
          (error) => {
            console.error("Location error:", error);
            toast({
              title: "Location Error",
              description: "Unable to access your location",
              variant: "destructive"
            });
          },
          {
            enableHighAccuracy: true,
            timeout: 30000,
            maximumAge: 0
          }
        );
      }
    } else {
      // Stop watching location
      if (locationWatchId.current !== null) {
        navigator.geolocation.clearWatch(locationWatchId.current);
        locationWatchId.current = null;
      }
    }

    return () => {
      if (locationWatchId.current !== null) {
        navigator.geolocation.clearWatch(locationWatchId.current);
      }
    };
  }, [isSharingLocation, job?.id, sendLocationUpdate]);

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSelectedPhotos(prev => [...prev, ...files]);
    
    // Analyze the first photo if available
    if (files.length > 0 && !isAnalyzing) {
      const file = files[0];
      setIsAnalyzing(true);
      
      // Convert to base64 and analyze
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        analyzePhotoMutation.mutate(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const removePhoto = (index: number) => {
    setSelectedPhotos(prev => prev.filter((_, i) => i !== index));
    // Also remove corresponding analysis if exists
    setPhotoAnalyses(prev => prev.filter((_, i) => i !== index));
  };

  const openNavigation = () => {
    if (job?.location) {
      const { lat, lng } = job.location;
      // Open in Google Maps or Apple Maps
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      const url = isIOS
        ? `maps://maps.google.com/maps?daddr=${lat},${lng}`
        : `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
      window.open(url, "_blank");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-2xl mx-auto space-y-4">
          <Card>
            <CardContent className="p-8">
              <div className="text-center">
                <Clock className="w-12 h-12 mx-auto mb-4 animate-spin text-muted-foreground" />
                <p>Loading active job...</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardContent className="p-8">
              <div className="text-center space-y-4">
                <AlertCircle className="w-12 h-12 mx-auto text-muted-foreground" />
                <h2 className="text-xl font-semibold">No Active Job</h2>
                <p className="text-muted-foreground">
                  You don't have any active jobs at the moment.
                </p>
                <Button onClick={() => navigate("/contractor/dashboard")}>
                  Back to Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b">
        <div className="p-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold">Active Job</h1>
            <div className="flex items-center gap-2">
              <Badge variant={isConnected ? "default" : "secondary"}>
                {isConnected ? (
                  <>
                    <Wifi className="w-3 h-3 mr-1" />
                    Connected
                  </>
                ) : (
                  <>
                    <WifiOff className="w-3 h-3 mr-1" />
                    Offline
                  </>
                )}
              </Badge>
              <Badge>
                {job.status.toUpperCase().replace("_", " ")}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Job Overview Card */}
      <div className="p-4 space-y-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Job #{job.jobNumber}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Customer Info */}
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarImage src={customer?.photo} />
                <AvatarFallback>
                  {customer?.firstName?.[0]}{customer?.lastName?.[0] || "C"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="font-semibold">
                  {customer?.firstName} {customer?.lastName || "Customer"}
                </p>
                <p className="text-sm text-muted-foreground">{customer?.phone}</p>
              </div>
              <Button
                size="icon"
                variant="outline"
                onClick={() => window.location.href = `tel:${customer?.phone}`}
                data-testid="button-call-customer"
              >
                <Phone className="w-4 h-4" />
              </Button>
            </div>

            <Separator />

            {/* Location */}
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <MapPin className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium">Location</p>
                  <p className="text-sm text-muted-foreground">
                    {job.locationAddress || "GPS coordinates provided"}
                  </p>
                  {job.locationNotes && (
                    <p className="text-sm italic mt-1">
                      Note: {job.locationNotes}
                    </p>
                  )}
                </div>
              </div>
              <Button
                variant="outline"
                className="w-full"
                onClick={openNavigation}
                data-testid="button-navigate"
              >
                <Navigation className="w-4 h-4 mr-2" />
                Navigate
              </Button>
            </div>

            <Separator />

            {/* Vehicle Info */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-muted-foreground" />
                <p className="font-medium">Vehicle Information</p>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-muted-foreground">Unit #</p>
                  <p className="font-medium">{job.unitNumber || "N/A"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">VIN</p>
                  <p className="font-medium font-mono text-xs">
                    {job.vin || "N/A"}
                  </p>
                </div>
                {job.vehicleMake && (
                  <>
                    <div>
                      <p className="text-muted-foreground">Make/Model</p>
                      <p className="font-medium">
                        {job.vehicleMake} {job.vehicleModel}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Year</p>
                      <p className="font-medium">{job.vehicleYear}</p>
                    </div>
                  </>
                )}
              </div>
            </div>

            <Separator />

            {/* Issue Description */}
            <div>
              <p className="font-medium mb-1">Issue Description</p>
              <p className="text-sm">{job.description || "Emergency repair needed"}</p>
            </div>
          </CardContent>
        </Card>

        {/* Location Sharing */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="font-medium">Share Live Location</p>
                <p className="text-sm text-muted-foreground">
                  Customer can track your arrival
                </p>
              </div>
              <Switch
                checked={isSharingLocation}
                onCheckedChange={setIsSharingLocation}
                data-testid="switch-location-sharing"
              />
            </div>
            {isSharingLocation && currentLocation && (
              <div className="mt-3 p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <p className="text-sm">
                    Sharing location (accuracy: {Math.round(currentLocation.coords.accuracy)}m)
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Status Actions */}
        {job.status === "assigned" && (
          <Card>
            <CardContent className="p-4">
              <Button
                className="w-full h-14 text-lg"
                onClick={() => {
                  if (!job || !job.id) {
                    console.error('Cannot update status: Job not loaded');
                    toast({
                      title: "Error",
                      description: "Job information not available. Please refresh the page.",
                      variant: "destructive"
                    });
                    return;
                  }
                  updateStatusMutation.mutate("en_route");
                }}
                disabled={updateStatusMutation.isPending || !job?.id}
                data-testid="button-start-route"
              >
                {updateStatusMutation.isPending ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Navigation className="w-5 h-5 mr-2" />
                    Start Route
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {job.status === "en_route" && (
          <Card>
            <CardContent className="p-4">
              <Button
                className="w-full h-14 text-lg"
                variant="destructive"
                onClick={() => {
                  if (!job || !job.id) {
                    console.error('Cannot update status: Job not loaded');
                    toast({
                      title: "Error",
                      description: "Job information not available. Please refresh the page.",
                      variant: "destructive"
                    });
                    return;
                  }
                  updateStatusMutation.mutate("on_site");
                }}
                disabled={updateStatusMutation.isPending || !job?.id}
                data-testid="button-arrived"
              >
                {updateStatusMutation.isPending ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <MapPin className="w-5 h-5 mr-2" />
                    I've Arrived
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {job.status === "on_site" && (
          <Tabs defaultValue="complete" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="complete">Complete</TabsTrigger>
              <TabsTrigger value="photos">Photos</TabsTrigger>
              <TabsTrigger value="chat">Chat</TabsTrigger>
            </TabsList>

            <TabsContent value="complete" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Complete Job</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="notes">Completion Notes</Label>
                    <Textarea
                      id="notes"
                      placeholder="Describe the work completed, parts used, etc."
                      value={completionNotes}
                      onChange={(e) => setCompletionNotes(e.target.value)}
                      rows={4}
                      data-testid="input-completion-notes"
                    />
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      Estimated Total: ${job.estimatedPrice || "150.00"}
                    </p>
                  </div>

                  <Button
                    className="w-full h-14 text-lg"
                    onClick={() => {
                      if (!job || !job.id) {
                        console.error('Cannot complete job: Job not loaded');
                        toast({
                          title: "Error",
                          description: "Job information not available. Please refresh the page.",
                          variant: "destructive"
                        });
                        return;
                      }
                      if (!completionNotes || completionNotes.trim() === '') {
                        toast({
                          title: "Required Field",
                          description: "Please add completion notes before marking the job as complete.",
                          variant: "destructive"
                        });
                        return;
                      }
                      completeJobMutation.mutate();
                    }}
                    disabled={completeJobMutation.isPending || !completionNotes || !job?.id}
                    data-testid="button-complete-job"
                  >
                    {completeJobMutation.isPending ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Completing...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-5 h-5 mr-2" />
                        Mark as Complete
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="photos" className="space-y-4">
              <JobPhotoGalleryForContractor jobId={job?.id || ''} />
            </TabsContent>

            <TabsContent value="chat" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Chat with Customer</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Messages */}
                  <div className="h-64 overflow-y-auto space-y-2 p-2 border rounded-lg">
                    {messages.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">
                        No messages yet
                      </p>
                    ) : (
                      messages.map((msg) => (
                        <div
                          key={msg.id}
                          className={`p-3 rounded-lg ${
                            msg.senderId === "contractor-id"
                              ? "bg-primary text-primary-foreground ml-8"
                              : "bg-muted mr-8"
                          }`}
                        >
                          <p className="text-sm">{msg.message}</p>
                          <p className="text-xs opacity-70 mt-1">
                            {format(new Date(msg.createdAt), "h:mm a")}
                          </p>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Message Input */}
                  <div className="flex gap-2">
                    <Textarea
                      placeholder="Type a message..."
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      rows={2}
                      className="flex-1"
                      data-testid="input-message"
                    />
                    <Button
                      size="icon"
                      onClick={() => sendMessageMutation.mutate(messageText)}
                      disabled={!messageText || sendMessageMutation.isPending}
                      data-testid="button-send-message"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}

// Component for the photos tab content
function JobPhotoGalleryForContractor({ jobId }: { jobId: string }) {
  const { data: photosData, isLoading, refetch } = useQuery({
    queryKey: [`/api/jobs/${jobId}/photos`],
    enabled: !!jobId,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const photos = photosData?.photos || [];

  return (
    <JobPhotoGallery
      jobId={jobId}
      photos={photos}
      canUpload={true}
      onPhotosChange={refetch}
    />
  );
}