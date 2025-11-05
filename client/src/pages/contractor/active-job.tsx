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
  Send
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

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSelectedPhotos(prev => [...prev, ...files]);
  };

  const removePhoto = (index: number) => {
    setSelectedPhotos(prev => prev.filter((_, i) => i !== index));
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
                  <CardTitle className="text-lg">Job Photos</CardTitle>
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
                    />
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => fileInputRef.current?.click()}
                      data-testid="button-add-photos"
                    >
                      <Camera className="w-4 h-4 mr-2" />
                      Add Photos
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
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
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