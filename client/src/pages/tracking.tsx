import { useEffect, useState, useRef } from "react";
import { useParams } from "wouter";
import { MapContainer, TileLayer, Marker, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useTrackingWebSocket } from "@/hooks/use-tracking-websocket";
import {
  MapPin,
  Clock,
  Phone,
  MessageSquare,
  Navigation,
  User,
  Truck,
  Wrench,
  AlertCircle,
  CheckCircle,
  Wifi,
  WifiOff,
  Star
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";

// Fix Leaflet icon issue
import "leaflet/dist/leaflet.css";
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

// Custom marker icons
const truckIcon = new L.DivIcon({
  html: `<div class="relative">
    <div class="absolute -top-8 -left-4 w-8 h-8 bg-destructive rounded-full flex items-center justify-center shadow-lg">
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/>
        <path d="M15 18H9"/>
        <path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/>
        <circle cx="17" cy="18" r="2"/>
        <circle cx="7" cy="18" r="2"/>
      </svg>
    </div>
  </div>`,
  className: "",
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

const mechanicIcon = new L.DivIcon({
  html: `<div class="relative">
    <div class="absolute -top-8 -left-4 w-8 h-8 bg-primary rounded-full flex items-center justify-center shadow-lg animate-pulse">
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 13V7"/>
        <path d="M4 20h16"/>
        <path d="m5 20 6-16 6 16"/>
        <path d="M9 13h6"/>
        <path d="M12 3v4"/>
      </svg>
    </div>
  </div>`,
  className: "",
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

// Map bounds updater component
function MapBoundsUpdater({ customerLocation, contractorLocation }: any) {
  const map = useMap();
  
  useEffect(() => {
    if (customerLocation && contractorLocation) {
      const bounds = L.latLngBounds([
        [customerLocation.lat, customerLocation.lng],
        [contractorLocation.lat, contractorLocation.lng]
      ]);
      map.fitBounds(bounds, { padding: [50, 50] });
    } else if (customerLocation) {
      map.setView([customerLocation.lat, customerLocation.lng], 14);
    }
  }, [map, customerLocation, contractorLocation]);

  return null;
}

// Status Timeline Component
function StatusTimeline({ statusHistory }: { statusHistory: any[] }) {
  const statusConfig = {
    new: { label: "Job Created", icon: AlertCircle, color: "text-gray-500" },
    assigned: { label: "Contractor Assigned", icon: User, color: "text-blue-500" },
    en_route: { label: "En Route", icon: Navigation, color: "text-yellow-500" },
    on_site: { label: "On Site", icon: MapPin, color: "text-orange-500" },
    completed: { label: "Completed", icon: CheckCircle, color: "text-green-500" },
    cancelled: { label: "Cancelled", icon: AlertCircle, color: "text-red-500" }
  };

  return (
    <div className="space-y-4">
      {statusHistory.map((item, index) => {
        const config = statusConfig[item.toStatus as keyof typeof statusConfig];
        const Icon = config?.icon || AlertCircle;
        
        return (
          <div key={item.id} className="flex gap-4">
            <div className="relative">
              <div className={`w-10 h-10 rounded-full bg-background border-2 flex items-center justify-center ${config?.color}`}>
                <Icon className="w-5 h-5" />
              </div>
              {index < statusHistory.length - 1 && (
                <div className="absolute top-10 left-5 w-0.5 h-12 bg-border -translate-x-1/2" />
              )}
            </div>
            <div className="flex-1 pb-8">
              <p className="font-medium">{config?.label}</p>
              <p className="text-sm text-muted-foreground">
                {format(new Date(item.createdAt), "MMM d, h:mm a")}
              </p>
              {item.reason && (
                <p className="text-sm mt-1">{item.reason}</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ETA Countdown Component
function ETACountdown({ eta }: { eta: string | null }) {
  const [timeLeft, setTimeLeft] = useState<string>("");

  useEffect(() => {
    if (!eta) return;

    const updateCountdown = () => {
      const now = new Date();
      const etaDate = new Date(eta);
      const diff = etaDate.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeLeft("Arrived");
      } else {
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
        
        if (hours > 0) {
          setTimeLeft(`${hours}h ${remainingMinutes}m`);
        } else {
          setTimeLeft(`${remainingMinutes} min`);
        }
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 30000);

    return () => clearInterval(interval);
  }, [eta]);

  return (
    <div className="text-center">
      <p className="text-3xl font-bold text-destructive">{timeLeft || "Calculating..."}</p>
      <p className="text-sm text-muted-foreground">Estimated Arrival</p>
    </div>
  );
}

export default function TrackingPage() {
  const { jobId } = useParams();
  const { toast } = useToast();
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [isTracking, setIsTracking] = useState(false);
  
  // Fetch job details
  const { data: jobData, isLoading: isLoadingJob } = useQuery({
    queryKey: [`/api/jobs/${jobId}/tracking`],
    enabled: !!jobId,
    refetchInterval: 30000 // Refetch every 30 seconds
  });

  // WebSocket connection for real-time updates
  const {
    isConnected,
    contractorLocation,
    eta,
    status,
    contractorOnline,
    sendLocationUpdate
  } = useTrackingWebSocket({
    jobId: jobId!,
    role: "guest",
    onLocationUpdate: (location) => {
      console.log("Location updated:", location);
    },
    onStatusUpdate: (newStatus) => {
      console.log("Status updated:", newStatus);
    },
    onEtaUpdate: (newEta) => {
      console.log("ETA updated:", newEta);
    }
  });

  const customerLocation = jobData?.job?.location || null;
  const contractor = jobData?.contractor || null;
  const statusHistory = jobData?.statusHistory || [];

  // Demo mode: simulate contractor movement
  useEffect(() => {
    if (isDemoMode && customerLocation && !contractorLocation) {
      // Start contractor 5 miles away
      const startLat = customerLocation.lat - 0.05;
      const startLng = customerLocation.lng - 0.05;
      
      let progress = 0;
      const interval = setInterval(() => {
        progress += 0.02;
        if (progress >= 1) {
          clearInterval(interval);
          progress = 1;
        }

        const currentLat = startLat + (customerLocation.lat - startLat) * progress;
        const currentLng = startLng + (customerLocation.lng - startLng) * progress;

        sendLocationUpdate({
          lat: currentLat,
          lng: currentLng
        });
      }, 3000);

      return () => clearInterval(interval);
    }
  }, [isDemoMode, customerLocation, contractorLocation, sendLocationUpdate]);

  if (!jobId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-6">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <p className="text-center">Invalid tracking link</p>
        </Card>
      </div>
    );
  }

  if (isLoadingJob) {
    return (
      <div className="min-h-screen p-4 space-y-4">
        <Skeleton className="h-96 w-full" />
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
      </div>
    );
  }

  if (!jobData?.job) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-6">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <p className="text-center">Job not found</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Map Container */}
      <div className="relative h-[60vh] md:h-[70vh]">
        {customerLocation && (
          <MapContainer
            center={[customerLocation.lat, customerLocation.lng]}
            zoom={14}
            style={{ height: "100%", width: "100%" }}
            className="z-0"
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            />
            
            {/* Customer/Truck location */}
            <Marker position={[customerLocation.lat, customerLocation.lng]} icon={truckIcon} />
            
            {/* Contractor location */}
            {contractorLocation && (
              <>
                <Marker
                  position={[contractorLocation.lat, contractorLocation.lng]}
                  icon={mechanicIcon}
                />
                
                {/* Route line */}
                <Polyline
                  positions={[
                    [customerLocation.lat, customerLocation.lng],
                    [contractorLocation.lat, contractorLocation.lng]
                  ]}
                  pathOptions={{
                    color: "blue",
                    weight: 3,
                    dashArray: "10, 10"
                  }}
                />
              </>
            )}
            
            <MapBoundsUpdater
              customerLocation={customerLocation}
              contractorLocation={contractorLocation}
            />
          </MapContainer>
        )}

        {/* Connection Status Indicator */}
        <div className="absolute top-4 left-4 z-10">
          <Badge variant={isConnected ? "default" : "secondary"} className="gap-2">
            {isConnected ? (
              <>
                <Wifi className="w-3 h-3" />
                Live Tracking
              </>
            ) : (
              <>
                <WifiOff className="w-3 h-3" />
                Reconnecting...
              </>
            )}
          </Badge>
        </div>

        {/* ETA Card */}
        {contractor && (
          <Card className="absolute top-4 right-4 z-10 w-72 shadow-xl backdrop-blur">
            <CardContent className="p-4 space-y-4">
              {/* Contractor Info */}
              <div className="flex items-center gap-3">
                <Avatar className="w-12 h-12">
                  <AvatarImage src={contractor.photo} />
                  <AvatarFallback>
                    {contractor.firstName?.[0]}{contractor.lastName?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-semibold">
                    {contractor.firstName} {contractor.lastName}
                  </p>
                  <div className="flex items-center gap-1">
                    <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                    <span className="text-sm">{contractor.rating || "4.8"}</span>
                    <span className="text-sm text-muted-foreground">
                      ({contractor.totalJobs || 156} jobs)
                    </span>
                  </div>
                </div>
                {contractorOnline && (
                  <Badge variant="outline" className="text-green-600">
                    Online
                  </Badge>
                )}
              </div>

              <Separator />

              {/* ETA Display */}
              <ETACountdown eta={eta} />

              <Separator />

              {/* Current Status */}
              <div className="space-y-2">
                <Badge className="w-full justify-center py-2" variant={
                  status === "completed" ? "default" :
                  status === "on_site" ? "destructive" :
                  status === "en_route" ? "secondary" :
                  "outline"
                }>
                  {status === "en_route" ? "Mechanic En Route" :
                   status === "on_site" ? "Mechanic On Site" :
                   status === "completed" ? "Service Completed" :
                   "Preparing to Dispatch"}
                </Badge>
              </div>

              {/* Actions */}
              <div className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => window.location.href = `tel:${contractor.phone}`}
                  data-testid="button-call-contractor"
                >
                  <Phone className="w-4 h-4 mr-2" />
                  Call Mechanic
                </Button>
                <Button
                  variant="outline" 
                  className="w-full"
                  data-testid="button-message-contractor"
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Send Message
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Demo Mode Toggle */}
        {!contractorLocation && (
          <div className="absolute bottom-4 right-4 z-10">
            <Button
              variant="outline"
              onClick={() => setIsDemoMode(!isDemoMode)}
              className="backdrop-blur"
            >
              {isDemoMode ? "Stop Demo" : "Start Demo Mode"}
            </Button>
          </div>
        )}
      </div>

      {/* Job Details Section */}
      <div className="container mx-auto px-4 py-8 space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          {/* Job Information */}
          <Card>
            <CardHeader>
              <h3 className="font-semibold text-lg">Job Details</h3>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Job ID</p>
                <p className="font-mono font-semibold" data-testid="text-job-number">
                  {jobData.job.jobNumber}
                </p>
              </div>

              <Separator />

              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Service Type</p>
                <p className="font-medium">{jobData.job.serviceType || "Emergency Repair"}</p>
              </div>

              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Issue Description</p>
                <p>{jobData.job.description || "Truck breakdown on highway"}</p>
              </div>

              <Separator />

              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Vehicle Information</p>
                <div className="space-y-1">
                  <p className="text-sm">
                    <span className="font-medium">Unit:</span> {jobData.job.unitNumber || "N/A"}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">VIN:</span> {jobData.job.vin || "N/A"}
                  </p>
                  {jobData.job.vehicleMake && (
                    <p className="text-sm">
                      <span className="font-medium">Vehicle:</span> {jobData.job.vehicleYear} {jobData.job.vehicleMake} {jobData.job.vehicleModel}
                    </p>
                  )}
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Location</p>
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 mt-0.5 text-muted-foreground" />
                  <p className="text-sm">
                    {jobData.job.locationAddress || "GPS Location captured"}
                    {jobData.job.locationNotes && (
                      <span className="block text-muted-foreground mt-1">
                        Note: {jobData.job.locationNotes}
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Status Timeline */}
          <Card>
            <CardHeader>
              <h3 className="font-semibold text-lg">Status Timeline</h3>
            </CardHeader>
            <CardContent>
              <StatusTimeline statusHistory={statusHistory} />
            </CardContent>
          </Card>
        </div>

        {/* Actions based on status */}
        {status === "completed" && (
          <Card>
            <CardContent className="p-6">
              <div className="text-center space-y-4">
                <CheckCircle className="w-12 h-12 text-green-600 mx-auto" />
                <h3 className="text-xl font-semibold">Service Completed!</h3>
                <p className="text-muted-foreground">
                  How was your experience with {contractor?.firstName}?
                </p>
                <Button variant="default" size="lg" className="hover-elevate">
                  Rate Your Service
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {status === "new" && (
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Need to cancel?</p>
                  <p className="text-sm text-muted-foreground">
                    You can cancel this job before the mechanic is dispatched
                  </p>
                </div>
                <Button variant="destructive" data-testid="button-cancel-job">
                  Cancel Job
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}