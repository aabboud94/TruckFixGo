import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useTrackingWebSocket } from "@/hooks/use-tracking-websocket";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  RatingDisplay, 
  RatingBadge, 
  PerformanceMetrics, 
  RatingSummaryCard 
} from "@/components/rating-display";
import { ReviewItem } from "@/components/review-item";
import {
  DollarSign,
  TrendingUp,
  Star,
  Clock,
  MapPin,
  Navigation,
  Phone,
  AlertCircle,
  CheckCircle,
  Truck,
  Calendar,
  Wifi,
  WifiOff,
  ChevronRight,
  Bell,
  Timer,
  Award,
  MessageSquare,
  Users,
  Target,
  ArrowUp,
  ArrowDown,
  Sparkles,
  Upload
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";

interface DashboardData {
  contractor: {
    id: string;
    firstName: string;
    lastName: string;
    companyName: string;
    performanceTier: "bronze" | "silver" | "gold";
    isAvailable: boolean;
    averageRating: number;
    totalJobsCompleted: number;
    averageResponseTime: number;
    currentLocation?: { lat: number; lng: number };
    totalReviews: number;
    onTimeRate: number;
    satisfactionScore: number;
    responseRate: number;
    completionRate: number;
    categoryRatings: {
      timeliness: number;
      professionalism: number;
      quality: number;
      value: number;
    };
  };
  metrics: {
    todayEarnings: number;
    weekEarnings: number;
    monthEarnings: number;
    todayJobs: number;
    weekJobs: number;
    totalJobs: number;
    pendingPayout: number;
  };
  activeJob?: any;
  availableJobs: any[];
  scheduledJobs: any[];
  recentReviews?: any[];
  ratingDistribution?: Record<string, number>;
  ratingTrend?: Array<{ date: string; rating: number }>;
}

const tierColors = {
  bronze: "bg-orange-600",
  silver: "bg-gray-400",
  gold: "bg-yellow-500"
};

const tierIcons = {
  bronze: "🥉",
  silver: "🥈",
  gold: "🥇"
};

export default function ContractorDashboard() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isOnline, setIsOnline] = useState(true);
  const [isSharingLocation, setIsSharingLocation] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<GeolocationPosition | null>(null);

  // Fetch dashboard data
  const { data: dashboardData, isLoading, refetch } = useQuery<DashboardData>({
    queryKey: ["/api/contractor/dashboard"],
    refetchInterval: 10000, // Refresh every 10 seconds for faster updates
    onSuccess: (data) => {
      // Log for debugging
      console.log('[ContractorDashboard] Dashboard data loaded:', {
        contractorId: data?.contractor?.id,
        activeJob: data?.activeJob,
        availableJobs: data?.availableJobs?.length,
        scheduledJobs: data?.scheduledJobs?.length
      });
      
      // Play notification for new assigned jobs
      if (data?.activeJob && !dashboardData?.activeJob) {
        const audio = new Audio("/notification.mp3");
        audio.play().catch(() => {});
        toast({
          title: "New Job Assigned!",
          description: "You have a new job assignment",
        });
      }
    }
  });

  // WebSocket for real-time updates
  const {
    isConnected,
    sendLocationUpdate
  } = useTrackingWebSocket({
    jobId: dashboardData?.activeJob?.id || "",
    userId: dashboardData?.contractor?.id || "",
    role: "contractor",
    enabled: !!dashboardData?.activeJob?.id && isSharingLocation
  });

  // Toggle online status
  const toggleOnlineMutation = useMutation({
    mutationFn: async (status: boolean) => {
      return await apiRequest("/api/contractor/status", {
        method: "PATCH",
        body: JSON.stringify({ isAvailable: status })
      });
    },
    onSuccess: (_, status) => {
      toast({
        title: status ? "You're Online" : "You're Offline",
        description: status ? "You can now receive job requests" : "You won't receive new job requests"
      });
      queryClient.invalidateQueries({ queryKey: ["/api/contractor/dashboard"] });
    }
  });

  // Accept job mutation
  const acceptJobMutation = useMutation({
    mutationFn: async (jobId: string) => {
      return await apiRequest(`/api/jobs/${jobId}/accept`, {
        method: "POST"
      });
    },
    onSuccess: () => {
      toast({
        title: "Job Accepted",
        description: "Navigating to job details..."
      });
      refetch();
      // Play notification sound
      const audio = new Audio("/notification.mp3");
      audio.play().catch(() => {});
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to accept job",
        variant: "destructive"
      });
    }
  });

  // Decline job mutation
  const declineJobMutation = useMutation({
    mutationFn: async (jobId: string) => {
      return await apiRequest(`/api/jobs/${jobId}/decline`, {
        method: "POST"
      });
    },
    onSuccess: () => {
      toast({
        title: "Job Declined",
        description: "Job has been removed from your list"
      });
      refetch();
    }
  });

  // Handle location sharing
  useEffect(() => {
    if (isSharingLocation) {
      if (navigator.geolocation) {
        const watchId = navigator.geolocation.watchPosition(
          (position) => {
            setCurrentLocation(position);
            if (dashboardData?.activeJob?.id) {
              sendLocationUpdate({
                lat: position.coords.latitude,
                lng: position.coords.longitude
              });
            }
          },
          (error) => {
            console.error("Location error:", error);
            setIsSharingLocation(false);
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

        return () => {
          navigator.geolocation.clearWatch(watchId);
        };
      }
    }
  }, [isSharingLocation, dashboardData?.activeJob?.id, sendLocationUpdate]);

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 3959; // miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return Math.round(R * c * 10) / 10;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-20 bg-muted rounded-lg"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-32 bg-muted rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const contractor = dashboardData?.contractor;
  const metrics = dashboardData?.metrics;
  const activeJob = dashboardData?.activeJob;
  const availableJobs = dashboardData?.availableJobs || [];
  const scheduledJobs = dashboardData?.scheduledJobs || [];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="w-12 h-12">
                <AvatarFallback>
                  {contractor?.firstName?.[0]}{contractor?.lastName?.[0]}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-2xl font-bold">
                  Welcome back, {contractor?.firstName}!
                </h1>
                <p className="text-muted-foreground">
                  {contractor?.companyName}
                </p>
              </div>
              <Badge className={`${tierColors[contractor?.performanceTier || 'bronze']} text-white`}>
                <Award className="w-3 h-3 mr-1" />
                {contractor?.performanceTier?.toUpperCase()} TIER
              </Badge>
            </div>

            <div className="flex items-center gap-6">
              {/* Location Sharing Status */}
              <div className="flex items-center gap-2">
                {isSharingLocation ? (
                  <Wifi className="w-4 h-4 text-green-600 animate-pulse" />
                ) : (
                  <WifiOff className="w-4 h-4 text-muted-foreground" />
                )}
                <Label htmlFor="location-sharing" className="text-sm">
                  Location Sharing
                </Label>
                <Switch
                  id="location-sharing"
                  checked={isSharingLocation}
                  onCheckedChange={setIsSharingLocation}
                  data-testid="switch-location"
                />
              </div>

              {/* Online/Offline Toggle */}
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-600 animate-pulse' : 'bg-gray-400'}`} />
                <Label htmlFor="online-status" className="text-sm">
                  {isOnline ? 'Online' : 'Offline'}
                </Label>
                <Switch
                  id="online-status"
                  checked={isOnline}
                  onCheckedChange={(checked) => {
                    setIsOnline(checked);
                    toggleOnlineMutation.mutate(checked);
                  }}
                  data-testid="switch-online"
                />
              </div>

              {/* WebSocket Connection Status */}
              <Badge variant={isConnected ? "default" : "secondary"}>
                {isConnected ? "Connected" : "Offline"}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Earnings</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-today-earnings">
                ${metrics?.todayEarnings?.toFixed(2) || '0.00'}
              </div>
              <p className="text-xs text-muted-foreground">
                Week: ${metrics?.weekEarnings?.toFixed(2) || '0.00'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Jobs Completed</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-jobs-today">
                {metrics?.todayJobs || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                This week: {metrics?.weekJobs || 0} | Total: {contractor?.totalJobsCompleted || 0}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-1">
                <span className="text-2xl font-bold" data-testid="text-rating">
                  {contractor?.averageRating?.toFixed(1) || '0.0'}
                </span>
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-4 h-4 ${
                        star <= Math.round(contractor?.averageRating || 0)
                          ? 'fill-yellow-500 text-yellow-500'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Based on {contractor?.totalJobsCompleted || 0} jobs
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Response Time</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-response-time">
                {contractor?.averageResponseTime || 0} min
              </div>
              <p className="text-xs text-muted-foreground">
                Average response time
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Active Job Section */}
        {activeJob && (
          <Card className="border-l-4 border-l-green-600">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse" />
                  Active Job
                </CardTitle>
                <Badge variant="default">
                  {activeJob.status?.toUpperCase()}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">{activeJob.customerName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">{activeJob.location?.address}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{activeJob.issueDescription}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Timer className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      Started {formatDistanceToNow(new Date(activeJob.startedAt))} ago
                    </span>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      if (activeJob.location) {
                        const url = `https://www.google.com/maps/dir/?api=1&destination=${activeJob.location.lat},${activeJob.location.lng}`;
                        window.open(url, "_blank");
                      }
                    }}
                    data-testid="button-navigate-job"
                  >
                    <Navigation className="w-4 h-4 mr-1" />
                    Navigate
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => window.location.href = `tel:${activeJob.customerPhone}`}
                    data-testid="button-call-customer"
                  >
                    <Phone className="w-4 h-4 mr-1" />
                    Call
                  </Button>
                  <Button 
                    onClick={() => navigate("/contractor/active-job")}
                    data-testid="button-view-details"
                  >
                    View Details
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Available Jobs Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Available Jobs ({availableJobs.length})</CardTitle>
              <Badge variant="outline">
                <Bell className="w-3 h-3 mr-1" />
                Auto-refresh: 30s
              </Badge>
            </div>
            <CardDescription>
              Jobs within your service area waiting for assignment
            </CardDescription>
          </CardHeader>
          <CardContent>
            {availableJobs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Truck className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No available jobs in your area</p>
                <p className="text-sm mt-1">Check back in a few minutes</p>
              </div>
            ) : (
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-4">
                  {availableJobs.map((job) => (
                    <Card key={job.id} className={`border-l-4 ${job.jobType === 'emergency' ? 'border-l-orange-600' : 'border-l-blue-600'}`}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2 flex-1">
                            <div className="flex items-center gap-2">
                              <Badge variant={job.jobType === 'emergency' ? 'destructive' : 'default'}>
                                {job.jobType?.toUpperCase()}
                              </Badge>
                              <span className="text-sm font-medium">
                                ${job.estimatedPayout?.toFixed(2)}
                              </span>
                              {currentLocation && job.location && (
                                <Badge variant="outline">
                                  <MapPin className="w-3 h-3 mr-1" />
                                  {calculateDistance(
                                    currentLocation.coords.latitude,
                                    currentLocation.coords.longitude,
                                    job.location.lat,
                                    job.location.lng
                                  )} mi
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm font-medium">{job.serviceType}</p>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {job.issueDescription}
                            </p>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span>Posted {formatDistanceToNow(new Date(job.createdAt))} ago</span>
                              <span>{job.vehicleInfo}</span>
                            </div>
                          </div>
                          <div className="flex gap-2 ml-4">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => declineJobMutation.mutate(job.id)}
                              disabled={declineJobMutation.isPending}
                              data-testid={`button-decline-${job.id}`}
                            >
                              Decline
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => acceptJobMutation.mutate(job.id)}
                              disabled={acceptJobMutation.isPending}
                              data-testid={`button-accept-${job.id}`}
                            >
                              Accept
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Scheduled Jobs */}
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Scheduled Jobs ({scheduledJobs.length})</CardTitle>
            <CardDescription>
              Your accepted jobs scheduled for the future
            </CardDescription>
          </CardHeader>
          <CardContent>
            {scheduledJobs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No scheduled jobs</p>
              </div>
            ) : (
              <div className="space-y-4">
                {scheduledJobs.map((job) => (
                  <Card key={job.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            <span className="font-medium">
                              {format(new Date(job.scheduledDate), 'MMM d, yyyy')} at {job.scheduledTime}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">{job.serviceType}</p>
                          <p className="text-sm text-muted-foreground">{job.location?.address}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">${job.estimatedPayout?.toFixed(2)}</Badge>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => navigate(`/contractor/jobs/${job.id}`)}
                            data-testid={`button-view-scheduled-${job.id}`}
                          >
                            View
                            <ChevronRight className="w-3 h-3 ml-1" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Rating and Reviews Section */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Rating Overview</TabsTrigger>
            <TabsTrigger value="reviews">Recent Reviews</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <RatingSummaryCard
                averageRating={contractor?.averageRating || 0}
                totalReviews={contractor?.totalReviews || 0}
                distribution={dashboardData?.ratingDistribution || {}}
                onTimeRate={contractor?.onTimeRate}
                satisfactionScore={contractor?.satisfactionScore}
              />
              
              <Card>
                <CardHeader>
                  <CardTitle>Performance Metrics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <PerformanceMetrics
                    onTimeRate={contractor?.onTimeRate}
                    satisfactionScore={contractor?.satisfactionScore}
                    responseRate={contractor?.responseRate}
                    completionRate={contractor?.completionRate}
                    tier={contractor?.performanceTier}
                  />
                  
                  {/* Tier Progression */}
                  {contractor?.performanceTier && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Tier Progression</h4>
                      {contractor.performanceTier === 'bronze' && (
                        <div className="text-xs text-muted-foreground">
                          <p>Maintain 4.0+ rating to reach Silver tier</p>
                          <Progress value={(contractor.averageRating / 4.0) * 100} className="h-2 mt-1" />
                        </div>
                      )}
                      {contractor.performanceTier === 'silver' && (
                        <div className="text-xs text-muted-foreground">
                          <p>Maintain 4.5+ rating to reach Gold tier</p>
                          <Progress value={(contractor.averageRating / 4.5) * 100} className="h-2 mt-1" />
                        </div>
                      )}
                      {contractor.performanceTier === 'gold' && (
                        <Badge className="gap-1">
                          <Sparkles className="h-3 w-3" />
                          Top Performer
                        </Badge>
                      )}
                    </div>
                  )}
                  
                  {/* Benefits */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Your Benefits</h4>
                    <div className="space-y-1">
                      {contractor?.averageRating >= 4.8 && (
                        <div className="flex items-center gap-2 text-xs">
                          <CheckCircle className="h-3 w-3 text-green-600" />
                          <span>Reduced platform fees (15% → 12%)</span>
                        </div>
                      )}
                      {contractor?.averageRating >= 4.5 && (
                        <div className="flex items-center gap-2 text-xs">
                          <CheckCircle className="h-3 w-3 text-green-600" />
                          <span>Priority job assignments</span>
                        </div>
                      )}
                      {contractor?.averageRating >= 4.0 && (
                        <div className="flex items-center gap-2 text-xs">
                          <CheckCircle className="h-3 w-3 text-green-600" />
                          <span>Featured contractor badge</span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Rating Improvement Tips */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Rating Improvement Tips
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {contractor?.categoryRatings && (
                    <>
                      {contractor.categoryRatings.timeliness < 4.5 && (
                        <div className="flex items-start gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground mt-1" />
                          <div>
                            <p className="text-sm font-medium">Improve Timeliness</p>
                            <p className="text-xs text-muted-foreground">
                              Arrive within the promised time window. Update customers if running late.
                            </p>
                          </div>
                        </div>
                      )}
                      {contractor.categoryRatings.professionalism < 4.5 && (
                        <div className="flex items-start gap-2">
                          <Users className="h-4 w-4 text-muted-foreground mt-1" />
                          <div>
                            <p className="text-sm font-medium">Enhance Professionalism</p>
                            <p className="text-xs text-muted-foreground">
                              Maintain clean appearance, be courteous, and communicate clearly.
                            </p>
                          </div>
                        </div>
                      )}
                      {contractor.responseRate < 90 && (
                        <div className="flex items-start gap-2">
                          <MessageSquare className="h-4 w-4 text-muted-foreground mt-1" />
                          <div>
                            <p className="text-sm font-medium">Respond to Reviews</p>
                            <p className="text-xs text-muted-foreground">
                              Thank customers for positive reviews and address concerns professionally.
                            </p>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="reviews" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Recent Reviews</CardTitle>
                  <Button variant="outline" size="sm" onClick={() => navigate("/contractor/reviews")}>
                    View All
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {(!dashboardData?.recentReviews || dashboardData.recentReviews.length === 0) ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Star className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No reviews yet</p>
                    <p className="text-sm mt-1">Complete jobs to start receiving reviews</p>
                  </div>
                ) : (
                  <ScrollArea className="h-[500px] pr-4">
                    <div className="space-y-4">
                      {dashboardData.recentReviews.map((review) => (
                        <ReviewItem
                          key={review.id}
                          review={review}
                          isContractor={true}
                          currentUserId={contractor?.id}
                        />
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="performance" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Rating Trend</CardTitle>
                </CardHeader>
                <CardContent>
                  {dashboardData?.ratingTrend && dashboardData.ratingTrend.length > 0 ? (
                    <div className="space-y-3">
                      {dashboardData.ratingTrend.map((point, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">
                            {format(new Date(point.date), 'MMM d')}
                          </span>
                          <div className="flex items-center gap-2">
                            <RatingDisplay 
                              rating={point.rating} 
                              totalReviews={0}
                              size="xs"
                              showCount={false}
                            />
                            {index > 0 && (
                              <span className={`text-xs ${
                                point.rating > dashboardData.ratingTrend[index - 1].rating 
                                  ? 'text-green-600' 
                                  : point.rating < dashboardData.ratingTrend[index - 1].rating
                                  ? 'text-red-600'
                                  : 'text-muted-foreground'
                              }`}>
                                {point.rating > dashboardData.ratingTrend[index - 1].rating ? (
                                  <ArrowUp className="h-3 w-3" />
                                ) : point.rating < dashboardData.ratingTrend[index - 1].rating ? (
                                  <ArrowDown className="h-3 w-3" />
                                ) : '–'}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Not enough data to show trends
                    </p>
                  )}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Category Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  {contractor?.categoryRatings ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">Timeliness</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <RatingDisplay 
                            rating={contractor.categoryRatings.timeliness} 
                            totalReviews={0}
                            size="xs"
                            showCount={false}
                          />
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">Professionalism</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <RatingDisplay 
                            rating={contractor.categoryRatings.professionalism} 
                            totalReviews={0}
                            size="xs"
                            showCount={false}
                          />
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">Quality</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <RatingDisplay 
                            rating={contractor.categoryRatings.quality} 
                            totalReviews={0}
                            size="xs"
                            showCount={false}
                          />
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">Value</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <RatingDisplay 
                            rating={contractor.categoryRatings.value} 
                            totalReviews={0}
                            size="xs"
                            showCount={false}
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No category ratings available yet
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          <Button 
            variant="outline" 
            className="h-auto py-4"
            onClick={() => navigate("/contractor/jobs")}
            data-testid="button-manage-jobs"
          >
            <div className="flex flex-col items-center gap-2">
              <Truck className="w-5 h-5" />
              <span>Manage Jobs</span>
            </div>
          </Button>
          <Button 
            variant="outline" 
            className="h-auto py-4"
            onClick={() => navigate("/contractor/manage-drivers")}
            data-testid="button-manage-drivers"
          >
            <div className="flex flex-col items-center gap-2">
              <Users className="w-5 h-5" />
              <span>Manage Drivers</span>
            </div>
          </Button>
          <Button 
            variant="outline" 
            className="h-auto py-4"
            onClick={() => navigate("/contractor/earnings")}
            data-testid="button-view-earnings"
          >
            <div className="flex flex-col items-center gap-2">
              <DollarSign className="w-5 h-5" />
              <span>View Earnings</span>
            </div>
          </Button>
          <Button 
            variant="outline" 
            className="h-auto py-4"
            onClick={() => navigate("/contractor/documents")}
            data-testid="button-documents"
          >
            <div className="flex flex-col items-center gap-2">
              <Upload className="w-5 h-5" />
              <span>Documents</span>
            </div>
          </Button>
          <Button 
            variant="outline" 
            className="h-auto py-4"
            onClick={() => navigate("/contractor/performance")}
            data-testid="button-performance"
          >
            <div className="flex flex-col items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              <span>Performance</span>
            </div>
          </Button>
          <Button 
            variant="outline" 
            className="h-auto py-4"
            onClick={() => navigate("/contractor/profile")}
            data-testid="button-profile"
          >
            <div className="flex flex-col items-center gap-2">
              <Award className="w-5 h-5" />
              <span>My Profile</span>
            </div>
          </Button>
        </div>
      </div>
    </div>
  );
}