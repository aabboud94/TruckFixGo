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
      return await apiRequest(`/api/jobs/${job.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status })
      });
    },
    onSuccess: (data, status) => {
      toast({
        title: "Status Updated",
        description: `Job status changed to ${status}`
      });
      queryClient.invalidateQueries({ queryKey: ["/api/contractor/active-job"] });
      sendStatusUpdate(status);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update job status",
        variant: "destructive"
      });
    }
  });

  // Complete job mutation
  const completeJobMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest(`/api/jobs/${job.id}/complete`, {
        method: "POST",
        body: JSON.stringify({
          completionNotes,
          photos: selectedPhotos.map(f => f.name) // In real app, would upload first
        })
      });
    },
    onSuccess: () => {
      toast({
        title: "Job Completed",
        description: "Great work! The job has been marked as complete."
      });
      navigate("/contractor/dashboard");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to complete job",
        variant: "destructive"
      });
    }
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (message: string) => {
      return await apiRequest(`/api/jobs/${job.id}/messages`, {
        method: "POST",
        body: JSON.stringify({ message })
      });
    },
    onSuccess: () => {
      setMessageText("");
      queryClient.invalidateQueries({ queryKey: ["/api/contractor/active-job"] });
    },
    onError: () => {
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
      return apiRequest('/api/ai/analyze-photo', {
        method: 'POST',
        body: JSON.stringify({
          photo: photoBase64,
          context: `Contractor analyzing damage for Job #${job?.jobNumber}. ${job?.description || ''}`
        }),
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
      return apiRequest('/api/ai/repair-recommendations', {
        method: 'POST',
        body: JSON.stringify(data),
      });
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
                onClick={() => updateStatusMutation.mutate("en_route")}
                disabled={updateStatusMutation.isPending}
                data-testid="button-start-route"
              >
                <Navigation className="w-5 h-5 mr-2" />
                Start Route
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
                onClick={() => updateStatusMutation.mutate("on_site")}
                disabled={updateStatusMutation.isPending}
                data-testid="button-arrived"
              >
                <MapPin className="w-5 h-5 mr-2" />
                I've Arrived
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
                    onClick={() => completeJobMutation.mutate()}
                    disabled={completeJobMutation.isPending || !completionNotes}
                    data-testid="button-complete-job"
                  >
                    <CheckCircle className="w-5 h-5 mr-2" />
                    Mark as Complete
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="photos" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Job Photos & AI Analysis</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handlePhotoSelect}
                      className="hidden"
                      disabled={isAnalyzing}
                    />
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isAnalyzing}
                      data-testid="button-add-photos"
                    >
                      {isAnalyzing ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Analyzing Photo...
                        </>
                      ) : (
                        <>
                          <Camera className="w-4 h-4 mr-2" />
                          Add Photos for AI Analysis
                        </>
                      )}
                    </Button>
                  </div>

                  {selectedPhotos.length > 0 && (
                    <div className="space-y-2">
                      {selectedPhotos.map((photo, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-2 border rounded-lg"
                        >
                          <span className="text-sm truncate">{photo.name}</span>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => removePhoto(index)}
                            disabled={isAnalyzing}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* AI Analysis Results */}
                  {photoAnalyses.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="font-medium text-sm text-muted-foreground">AI Damage Analysis</h4>
                      {photoAnalyses.map((analysis, index) => (
                        <Alert key={index} className={
                          analysis.severity === "Severe" ? "border-red-500 bg-red-50 dark:bg-red-950/20" :
                          analysis.severity === "Moderate" ? "border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20" :
                          "border-green-500 bg-green-50 dark:bg-green-950/20"
                        }>
                          <AlertTriangle className="h-4 w-4" />
                          <AlertTitle>Analysis {index + 1}</AlertTitle>
                          <AlertDescription>
                            <div className="mt-2 space-y-2">
                              <div className="grid grid-cols-2 gap-2 text-xs">
                                <div>
                                  <p className="font-medium">Issue:</p>
                                  <p>{analysis.damageType}</p>
                                </div>
                                <div>
                                  <p className="font-medium">Severity:</p>
                                  <Badge variant={
                                    analysis.severity === "Severe" ? "destructive" :
                                    analysis.severity === "Moderate" ? "secondary" :
                                    "default"
                                  } className="text-xs">
                                    {analysis.severity}
                                  </Badge>
                                </div>
                              </div>
                              
                              <div className="grid grid-cols-2 gap-2 text-xs">
                                <div className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  <span>{analysis.estimatedRepairTime}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <DollarSign className="w-3 h-3" />
                                  <span>{analysis.costEstimate}</span>
                                </div>
                              </div>

                              {!analysis.canDriveSafely && (
                                <div className="p-2 bg-red-100 dark:bg-red-950/30 rounded text-xs font-medium text-red-700 dark:text-red-300">
                                  ⚠️ Vehicle unsafe to drive
                                </div>
                              )}
                            </div>
                          </AlertDescription>
                        </Alert>
                      ))}
                    </div>
                  )}

                  {/* Repair Recommendations */}
                  {repairRecommendations && (
                    <Card className="border-2 border-primary/20">
                      <CardHeader>
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Wrench className="w-4 h-4" />
                          AI Repair Recommendations
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3 text-xs">
                        {repairRecommendations.recommendations && repairRecommendations.recommendations.length > 0 && (
                          <div>
                            <p className="font-medium mb-1">Repair Steps:</p>
                            <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                              {repairRecommendations.recommendations.map((rec: string, idx: number) => (
                                <li key={idx}>{rec}</li>
                              ))}
                            </ol>
                          </div>
                        )}

                        {repairRecommendations.toolsNeeded && repairRecommendations.toolsNeeded.length > 0 && (
                          <div>
                            <p className="font-medium mb-1">Tools Required:</p>
                            <div className="flex flex-wrap gap-1">
                              {repairRecommendations.toolsNeeded.map((tool: string, idx: number) => (
                                <Badge key={idx} variant="outline" className="text-xs">
                                  {tool}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {repairRecommendations.partsNeeded && repairRecommendations.partsNeeded.length > 0 && (
                          <div>
                            <p className="font-medium mb-1">Parts Needed:</p>
                            <div className="flex flex-wrap gap-1">
                              {repairRecommendations.partsNeeded.map((part: string, idx: number) => (
                                <Badge key={idx} variant="secondary" className="text-xs">
                                  {part}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {repairRecommendations.safetyNotes && repairRecommendations.safetyNotes.length > 0 && (
                          <Alert className="border-orange-500 bg-orange-50 dark:bg-orange-950/20">
                            <Shield className="h-3 w-3" />
                            <AlertDescription>
                              <p className="font-medium mb-1">Safety Notes:</p>
                              <ul className="list-disc list-inside space-y-0.5">
                                {repairRecommendations.safetyNotes.map((note: string, idx: number) => (
                                  <li key={idx}>{note}</li>
                                ))}
                              </ul>
                            </AlertDescription>
                          </Alert>
                        )}

                        <div className="flex items-center gap-2 pt-2 border-t">
                          <Clock className="w-3 h-3 text-muted-foreground" />
                          <span className="text-muted-foreground">
                            Estimated time: {repairRecommendations.estimatedTime}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  <Button
                    className="w-full"
                    disabled={selectedPhotos.length === 0}
                    data-testid="button-upload-photos"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload {selectedPhotos.length} Photo{selectedPhotos.length !== 1 ? "s" : ""}
                  </Button>
                </CardContent>
              </Card>
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