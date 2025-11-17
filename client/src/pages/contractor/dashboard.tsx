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
import { AvailabilityCalendar } from "@/components/availability-calendar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
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
  Upload,
  FastForward,
  CheckCircle2,
  XCircle,
  Settings,
  Power,
  CalendarDays,
  CircleCheck,
  CircleX,
  FileText,
  Plus,
  Trash2,
  Mail,
  MessageCircle,
  Send,
  Edit
} from "lucide-react";
import { format, formatDistanceToNow, addHours } from "date-fns";
import PerformanceWidget from "@/components/performance-widget";
import { SOSButton } from "@/components/sos-button";
import { FuelPriceWidget } from "@/components/fuel-price-widget";
import { FuelCalculator } from "@/components/fuel-calculator";

interface InvoiceLineItem {
  id?: string;
  type: "part" | "labor" | "fee" | "tax" | "other";
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice?: number;
}

interface QueuedJob {
  id: string;
  jobNumber: string;
  queuePosition: number;
  customerName: string;
  customerPhone?: string;
  location: { lat: number; lng: number };
  locationAddress: string;
  serviceType: string;
  jobType: string;
  status: string;
  urgencyLevel: string;
  scheduledFor?: string;
  estimatedDuration?: number;
  description: string;
}

interface ActiveJob extends QueuedJob {
  customerEmail?: string;
  totalAmount: number;
  estimatedArrival?: string;
}

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
  activeJob?: ActiveJob;
  queuedJobs: QueuedJob[];
  availableJobs: any[];
  scheduledJobs: any[];
  recentReviews?: any[];
  ratingDistribution?: Record<string, number>;
  ratingTrend?: Array<{ date: string; rating: number }>;
  queueInfo?: {
    currentPosition: number | null;
    totalInQueue: number;
    queuedCount: number;
  };
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
  const [isOnline, setIsOnline] = useState<boolean | null>(null); // Initialize as null to wait for data
  const [isSharingLocation, setIsSharingLocation] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<GeolocationPosition | null>(null);
  const [showAdvanceDialog, setShowAdvanceDialog] = useState(false);
  const [showOfflineDialog, setShowOfflineDialog] = useState(false);
  const [returnTime, setReturnTime] = useState<string>("");
  
  // Invoice editing states
  const [showInvoiceDialog, setShowInvoiceDialog] = useState(false);
  const [lineItems, setLineItems] = useState<InvoiceLineItem[]>([]);
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [invoiceNotes, setInvoiceNotes] = useState("");
  const [sendMethod, setSendMethod] = useState<"email" | "sms" | null>(null);

  // Fetch dashboard data
  const { data: dashboardData, isLoading, refetch } = useQuery<DashboardData>({
    queryKey: ["/api/contractor/dashboard"],
    refetchInterval: 10000, // Refresh every 10 seconds for faster updates
  });

  // Handle dashboard data updates and sync availability status
  useEffect(() => {
    if (dashboardData) {
      // Sync the isOnline state with the actual contractor's availability from database
      if (isOnline === null && dashboardData.contractor) {
        setIsOnline(dashboardData.contractor.isAvailable);
        console.log('[ContractorDashboard] Syncing availability status from database:', dashboardData.contractor.isAvailable);
      }
      // Log for debugging
      console.log('[ContractorDashboard] Dashboard data loaded:', {
        contractorId: dashboardData?.contractor?.id,
        activeJob: dashboardData?.activeJob,
        availableJobs: dashboardData?.availableJobs?.length,
        scheduledJobs: dashboardData?.scheduledJobs?.length,
        isAvailable: dashboardData?.contractor?.isAvailable
      });
    }
  }, [dashboardData, isOnline]);

  // WebSocket for real-time updates
  const {
    isConnected,
    sendLocationUpdate
  } = useTrackingWebSocket({
    jobId: dashboardData?.activeJob?.id || "",
    userId: dashboardData?.contractor?.id || "",
    role: "contractor",
    onStatusUpdate: (status) => {
      // Show toast notification for automatic status updates
      if (status === 'en_route') {
        toast({
          title: "Status Updated",
          description: "You've been marked as EN ROUTE to the job location",
          className: "bg-blue-50 border-blue-200"
        });
        // Refresh dashboard data
        refetch();
      } else if (status === 'on_site') {
        toast({
          title: "Arrival Detected",
          description: "You've been automatically marked as ON SITE",
          className: "bg-green-50 border-green-200"
        });
        // Play arrival sound
        const audio = new Audio("/notification.mp3");
        audio.play().catch(() => {});
        // Refresh dashboard data
        refetch();
      }
    }
  });

  // Toggle online status
  const toggleOnlineMutation = useMutation({
    mutationFn: async (status: boolean) => {
      return await apiRequest("PATCH", "/api/contractor/status", { isAvailable: status });
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
      console.log('[CLIENT ACCEPT DEBUG] Starting job acceptance for jobId:', jobId);
      // Note: Contractor data is available in component scope if needed
      
      try {
        console.log('[CLIENT ACCEPT DEBUG] Sending POST request to:', `/api/jobs/${jobId}/accept`);
        const response = await apiRequest("POST", `/api/jobs/${jobId}/accept`);
        console.log('[CLIENT ACCEPT DEBUG] Response received:', response);
        return response;
      } catch (error) {
        console.error('[CLIENT ACCEPT DEBUG] Accept request failed:', error);
        console.error('[CLIENT ACCEPT DEBUG] Error details:', {
          message: error instanceof Error ? error.message : 'Unknown error',
          response: (error as any)?.response,
          status: (error as any)?.status,
          responseData: (error as any)?.data
        });
        throw error;
      }
    },
    onSuccess: (response) => {
      console.log('[CLIENT ACCEPT DEBUG] Job accepted successfully:', response);
      toast({
        title: "Job Accepted",
        description: "Navigating to job details..."
      });
      refetch();
      // Play notification sound
      const audio = new Audio("/notification.mp3");
      audio.play().catch(() => {});
    },
    onError: (error) => {
      console.error('[CLIENT ACCEPT DEBUG] Mutation error handler:', error);
      const errorMessage = error instanceof Error ? error.message : "Failed to accept job";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    }
  });

  // Decline job mutation
  const declineJobMutation = useMutation({
    mutationFn: async (jobId: string) => {
      return await apiRequest("POST", `/api/jobs/${jobId}/decline`);
    },
    onSuccess: () => {
      toast({
        title: "Job Declined",
        description: "Job has been removed from your list"
      });
      refetch();
    }
  });

  // Complete and advance to next job mutation
  const advanceToNextJobMutation = useMutation({
    mutationFn: async (jobId: string) => {
      return await apiRequest(`/api/contractor/jobs/${jobId}/complete-and-advance`, "POST");
    },
    onSuccess: (data) => {
      if (data.hasNextJob && data.nextJob) {
        toast({
          title: "Job Completed!",
          description: `Advanced to next job: ${data.nextJob.jobNumber}`,
        });
        // Invalidate and refetch dashboard data
        queryClient.invalidateQueries({ queryKey: ["/api/contractor/dashboard"] });
        queryClient.invalidateQueries({ queryKey: ["/api/contractor/active-job"] });
        refetch();
      } else {
        toast({
          title: "Job Completed!",
          description: "No more jobs in queue. Great work!",
        });
        refetch();
      }
      setShowAdvanceDialog(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to complete and advance to next job",
        variant: "destructive"
      });
      setShowAdvanceDialog(false);
    }
  });

  // Complete job with invoice mutation
  const completeJobWithInvoiceMutation = useMutation({
    mutationFn: async ({ 
      jobId, 
      lineItems, 
      notes, 
      sendMethod,
      recipientEmail,
      recipientPhone 
    }: { 
      jobId: string; 
      lineItems: InvoiceLineItem[]; 
      notes: string;
      sendMethod: "email" | "sms";
      recipientEmail?: string;
      recipientPhone?: string;
    }) => {
      return await apiRequest(`/api/contractor/jobs/${jobId}/complete-with-invoice`, "POST", {
        lineItems,
        notes,
        sendMethod,
        recipientEmail,
        recipientPhone
      });
    },
    onSuccess: (data) => {
      toast({
        title: "Job Completed & Invoice Sent!",
        description: `Invoice sent via ${data.sentVia === 'sms' ? 'SMS' : 'email'} successfully`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/contractor/dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["/api/contractor/active-job"] });
      queryClient.invalidateQueries({ queryKey: ["/api/contractor/invoices"] });
      setShowInvoiceDialog(false);
      resetInvoiceForm();
      refetch();
    },
    onError: (error: any) => {
      // Check if it's a Twilio error
      if (error?.message?.includes('SMS') || error?.message?.includes('Twilio')) {
        toast({
          title: "SMS Service Not Available",
          description: "SMS service is not configured. Using email instead.",
          variant: "destructive"
        });
        // Retry with email
        if (activeJob?.id) {
          completeJobWithInvoiceMutation.mutate({
            jobId: activeJob.id,
            lineItems,
            notes: invoiceNotes,
            sendMethod: "email",
            recipientEmail: customerEmail
          });
        }
      } else {
        toast({
          title: "Error",
          description: error?.message || "Failed to complete job with invoice",
          variant: "destructive"
        });
      }
    }
  });

  // Helper functions for invoice editing
  const resetInvoiceForm = () => {
    setLineItems([]);
    setCustomerEmail("");
    setCustomerPhone("");
    setInvoiceNotes("");
    setSendMethod(null);
  };

  const initializeInvoiceForm = () => {
    if (activeJob) {
      // Initialize with default line items based on the service
      const defaultItems: InvoiceLineItem[] = [
        {
          type: "labor",
          description: activeJob.serviceType || "Service",
          quantity: 1,
          unitPrice: activeJob.totalAmount || 0,
          totalPrice: activeJob.totalAmount || 0
        }
      ];
      setLineItems(defaultItems);
      setCustomerEmail(activeJob.customerEmail || "");
      setCustomerPhone(activeJob.customerPhone || "");
      setInvoiceNotes("");
      setSendMethod(null);
    }
  };

  const handleAddLineItem = () => {
    setLineItems([
      ...lineItems,
      {
        type: "other",
        description: "",
        quantity: 1,
        unitPrice: 0,
        totalPrice: 0
      }
    ]);
  };

  const handleRemoveLineItem = (index: number) => {
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const handleUpdateLineItem = (index: number, field: keyof InvoiceLineItem, value: any) => {
    const newLineItems = [...lineItems];
    newLineItems[index] = {
      ...newLineItems[index],
      [field]: value
    };
    
    // Recalculate total price if quantity or unit price changes
    if (field === "quantity" || field === "unitPrice") {
      const quantity = field === "quantity" ? value : newLineItems[index].quantity;
      const unitPrice = field === "unitPrice" ? value : newLineItems[index].unitPrice;
      newLineItems[index].totalPrice = quantity * unitPrice;
    }
    
    setLineItems(newLineItems);
  };

  const calculateInvoiceTotal = () => {
    return lineItems.reduce((sum, item) => {
      return sum + (item.quantity * item.unitPrice);
    }, 0);
  };

  const handleOpenInvoiceDialog = () => {
    initializeInvoiceForm();
    setShowInvoiceDialog(true);
  };

  const handleSendInvoice = (method: "email" | "sms") => {
    if (!activeJob) return;

    // Validate line items
    const invalidItems = lineItems.filter(
      item => !item.description || item.quantity <= 0 || item.unitPrice < 0
    );
    
    if (invalidItems.length > 0) {
      toast({
        title: "Validation Error",
        description: "Please fill in all line item details correctly",
        variant: "destructive"
      });
      return;
    }

    // Validate recipient info
    if (method === "email" && !customerEmail) {
      toast({
        title: "Email Required",
        description: "Please enter customer email address",
        variant: "destructive"
      });
      return;
    }

    if (method === "sms" && !customerPhone) {
      toast({
        title: "Phone Number Required",
        description: "Please enter customer phone number",
        variant: "destructive"
      });
      return;
    }

    completeJobWithInvoiceMutation.mutate({
      jobId: activeJob.id,
      lineItems,
      notes: invoiceNotes,
      sendMethod: method,
      recipientEmail: method === "email" ? customerEmail : undefined,
      recipientPhone: method === "sms" ? customerPhone : undefined
    });
  };

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
  const queuedJobs = dashboardData?.queuedJobs || [];
  const availableJobs = dashboardData?.availableJobs || [];
  const scheduledJobs = dashboardData?.scheduledJobs || [];
  const queueInfo = dashboardData?.queueInfo;
  
  // Helper function to check if job needs acceptance (assigned status)
  const needsAcceptance = (job: any) => {
    // Job needs acceptance if it has status 'assigned' or has the isAssigned flag
    return job.status === 'assigned' || job.isAssigned === true;
  };
  
  // Helper function to check if job was assigned recently (for visual highlighting)
  const isRecentlyAssigned = (job: any) => {
    if (!job.assignedAt) return false;
    const assignedTime = new Date(job.assignedAt);
    const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
    return assignedTime > hourAgo;
  };
  
  // Separate and sort jobs: assigned jobs first, then by position
  const sortedQueuedJobs = [...queuedJobs].sort((a, b) => {
    const aNeedsAcceptance = needsAcceptance(a);
    const bNeedsAcceptance = needsAcceptance(b);
    // Assigned jobs should appear first
    if (aNeedsAcceptance && !bNeedsAcceptance) return -1;
    if (!aNeedsAcceptance && bNeedsAcceptance) return 1;
    // Then sort by queue position
    return (a.queuePosition || 0) - (b.queuePosition || 0);
  });

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

            <div className="flex items-center gap-4">
              {/* Enhanced Online/Offline Toggle */}
              <div className={`flex items-center gap-3 px-4 py-2 rounded-lg border ${
                isOnline !== false ? 'bg-green-50 border-green-300 dark:bg-green-900/20' : 'bg-gray-100 border-gray-300 dark:bg-gray-800'
              }`}>
                <div className="flex items-center gap-2">
                  {isOnline !== false ? (
                    <CircleCheck className="w-6 h-6 text-green-600" />
                  ) : (
                    <CircleX className="w-6 h-6 text-gray-500" />
                  )}
                  <div>
                    <Label className="text-sm font-semibold">
                      {isOnline !== false ? 'ONLINE' : 'OFFLINE'}
                    </Label>
                    {isOnline === false && returnTime && (
                      <p className="text-xs text-muted-foreground">
                        Back at {returnTime}
                      </p>
                    )}
                  </div>
                </div>
                {isOnline !== false ? (
                  <Popover open={showOfflineDialog} onOpenChange={setShowOfflineDialog}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="default"
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                        data-testid="button-toggle-status"
                      >
                        <Power className="w-4 h-4 mr-1" />
                        Go Offline
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <h4 className="font-medium">Going Offline</h4>
                          <p className="text-sm text-muted-foreground">
                            When will you be back online?
                          </p>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="return-time">Return Time (Optional)</Label>
                          <Input
                            id="return-time"
                            type="time"
                            value={returnTime}
                            onChange={(e) => setReturnTime(e.target.value)}
                            data-testid="input-return-time"
                          />
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setShowOfflineDialog(false);
                              setReturnTime("");
                            }}
                          >
                            Cancel
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => {
                              setIsOnline(false);
                              toggleOnlineMutation.mutate(false);
                              setShowOfflineDialog(false);
                              toast({
                                title: "You're now offline",
                                description: returnTime ? `You'll be back at ${returnTime}` : "You won't receive new job requests",
                              });
                            }}
                            data-testid="button-confirm-offline"
                          >
                            Confirm
                          </Button>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                ) : (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setIsOnline(true);
                      toggleOnlineMutation.mutate(true);
                      setReturnTime("");
                      toast({
                        title: "You're back online!",
                        description: "You can now receive job requests"
                      });
                    }}
                    data-testid="button-go-online"
                  >
                    <Power className="w-4 h-4 mr-1" />
                    Go Online
                  </Button>
                )}
              </div>

              {/* Location Sharing Status */}
              <div className="flex items-center gap-2">
                {isSharingLocation ? (
                  <Wifi className="w-4 h-4 text-green-600 animate-pulse" />
                ) : (
                  <WifiOff className="w-4 h-4 text-muted-foreground" />
                )}
                <Label htmlFor="location-sharing" className="text-sm">
                  GPS
                </Label>
                <Switch
                  id="location-sharing"
                  checked={isSharingLocation}
                  onCheckedChange={setIsSharingLocation}
                  data-testid="switch-location"
                />
              </div>

              {/* Settings Link */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/contractor/settings")}
                data-testid="button-settings"
              >
                <Settings className="w-4 h-4 mr-1" />
                Settings
              </Button>

              {/* WebSocket Connection Status */}
              <Badge variant={isConnected ? "default" : "secondary"}>
                {isConnected ? "Connected" : "Disconnected"}
              </Badge>
              
              {/* Emergency SOS Button */}
              <SOSButton 
                jobId={activeJob?.id}
                className="ml-2"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Active Job Section - MOVED TO TOP FOR VISIBILITY */}
        {activeJob && (
          <Card className="border-l-4 border-l-green-600 shadow-lg animate-in fade-in-50 slide-in-from-top-2 duration-500 bg-gradient-to-r from-green-50/50 to-transparent dark:from-green-950/20">
            <CardHeader className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <div className="w-3 h-3 bg-green-600 rounded-full animate-pulse" />
                    🚛 Current Active Job
                  </CardTitle>
                  <Badge variant="default" className="bg-green-600 w-fit animate-pulse">
                    <Truck className="w-3 h-3 mr-1" />
                    Job #{activeJob.jobNumber}
                  </Badge>
                </div>
                <Badge 
                  variant={
                    activeJob.status === 'on_site' ? 'default' :
                    activeJob.status === 'en_route' ? 'secondary' : 
                    'outline'
                  }
                  className={
                    activeJob.status === 'on_site' ? 'bg-green-500 hover:bg-green-600 w-fit' :
                    activeJob.status === 'en_route' ? 'bg-blue-500 hover:bg-blue-600 text-white w-fit' :
                    'w-fit'
                  }
                >
                  {activeJob.status === 'en_route' ? 'EN ROUTE' :
                   activeJob.status === 'on_site' ? 'ON SITE' :
                   activeJob.status?.toUpperCase()}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 p-4 sm:p-6 pt-0">
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                <div className="space-y-3 flex-1">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                    <span className="font-medium text-base">{activeJob.customerName}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <MapPin className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-muted-foreground">{activeJob.locationAddress}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <span className="text-sm">{activeJob.serviceType} - {activeJob.description}</span>
                  </div>
                  {activeJob.estimatedArrival && (
                    <div className="flex items-center gap-2">
                      <Timer className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                      <span className="text-sm text-muted-foreground">
                        ETA: {format(new Date(activeJob.estimatedArrival), 'h:mm a')}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex flex-col sm:flex-row lg:flex-col gap-2 w-full lg:w-auto">
                  <Button 
                    variant="outline" 
                    size="default"
                    className="h-12 sm:h-10 text-base sm:text-sm w-full sm:w-auto"
                    onClick={() => {
                      if (activeJob.location) {
                        const url = `https://www.google.com/maps/dir/?api=1&destination=${activeJob.location.lat},${activeJob.location.lng}`;
                        window.open(url, "_blank");
                      }
                    }}
                    data-testid="button-navigate-job"
                  >
                    <Navigation className="w-5 h-5 sm:w-4 sm:h-4 mr-2" />
                    Navigate
                  </Button>
                  <Button 
                    variant="outline" 
                    size="default"
                    className="h-12 sm:h-10 text-base sm:text-sm w-full sm:w-auto"
                    onClick={() => window.location.href = `tel:${activeJob.customerPhone}`}
                    data-testid="button-call-customer"
                  >
                    <Phone className="w-5 h-5 sm:w-4 sm:h-4 mr-2" />
                    Call
                  </Button>
                  <Button 
                    size="default"
                    className="h-12 sm:h-10 text-base sm:text-sm w-full sm:w-auto"
                    onClick={() => navigate("/contractor/active-job")}
                    data-testid="button-view-details"
                  >
                    View Details
                    <ChevronRight className="w-5 h-5 sm:w-4 sm:h-4 ml-2" />
                  </Button>
                </div>
              </div>
              
              {/* Next Job Button - Only show if there are queued jobs */}
              {queuedJobs.length > 0 && (
                <div className="mt-4 pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="gap-1">
                        <Bell className="w-3 h-3" />
                        {queuedJobs.length} job{queuedJobs.length > 1 ? 's' : ''} in queue
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        Next: {queuedJobs[0]?.customerName}
                      </span>
                    </div>
                    <Button
                      variant="default"
                      className="bg-green-600 hover:bg-green-700"
                      onClick={handleOpenInvoiceDialog}
                      disabled={completeJobWithInvoiceMutation.isPending}
                      data-testid="button-complete-job"
                    >
                      {completeJobWithInvoiceMutation.isPending ? (
                        <>
                          <Timer className="w-4 h-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                          Mark Complete
                        </>
                      )}
                    </Button>
                  </div>
                  {/* Preview of next job */}
                  <div className="mt-3 p-3 bg-muted/50 rounded-md">
                    <div className="text-sm space-y-1">
                      <div className="font-medium">Next Job: #{queuedJobs[0]?.jobNumber}</div>
                      <div className="text-muted-foreground">{queuedJobs[0]?.serviceType}</div>
                      <div className="text-muted-foreground">{queuedJobs[0]?.locationAddress}</div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
        
        {/* Key Metrics - Mobile Optimized */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 sm:p-6">
              <CardTitle className="text-base sm:text-sm font-medium">Today's Earnings</CardTitle>
              <DollarSign className="h-5 w-5 sm:h-4 sm:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <div className="text-3xl sm:text-2xl font-bold" data-testid="text-today-earnings">
                ${metrics?.todayEarnings?.toFixed(2) || '0.00'}
              </div>
              <p className="text-sm sm:text-xs text-muted-foreground mt-1">
                Week: ${metrics?.weekEarnings?.toFixed(2) || '0.00'}
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 sm:p-6">
              <CardTitle className="text-base sm:text-sm font-medium">Jobs Completed</CardTitle>
              <TrendingUp className="h-5 w-5 sm:h-4 sm:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <div className="text-3xl sm:text-2xl font-bold" data-testid="text-jobs-today">
                {metrics?.todayJobs || 0}
              </div>
              <p className="text-sm sm:text-xs text-muted-foreground mt-1">
                This week: {metrics?.weekJobs || 0} | Total: {contractor?.totalJobsCompleted || 0}
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 sm:p-6">
              <CardTitle className="text-base sm:text-sm font-medium">Average Rating</CardTitle>
              <Star className="h-5 w-5 sm:h-4 sm:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <div className="flex items-center gap-2">
                <span className="text-3xl sm:text-2xl font-bold" data-testid="text-rating">
                  {contractor?.averageRating?.toFixed(1) || '0.0'}
                </span>
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-5 h-5 sm:w-4 sm:h-4 ${
                        star <= Math.round(contractor?.averageRating || 0)
                          ? 'fill-yellow-500 text-yellow-500'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
              </div>
              <p className="text-sm sm:text-xs text-muted-foreground mt-1">
                Based on {contractor?.totalJobsCompleted || 0} jobs
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 sm:p-6">
              <CardTitle className="text-base sm:text-sm font-medium">Response Time</CardTitle>
              <Clock className="h-5 w-5 sm:h-4 sm:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <div className="text-3xl sm:text-2xl font-bold" data-testid="text-response-time">
                {contractor?.averageResponseTime || 0} min
              </div>
              <p className="text-sm sm:text-xs text-muted-foreground mt-1">
                Average response time
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Queued Jobs Section */}
        <Card className="border-l-4 border-l-blue-600">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CardTitle>Job Queue</CardTitle>
                {queueInfo && queueInfo.queuedCount > 0 && (
                  <Badge variant="secondary">
                    {queueInfo.queuedCount} {queueInfo.queuedCount === 1 ? 'job' : 'jobs'} in queue
                  </Badge>
                )}
              </div>
              {queuedJobs.length > 0 && (
                <Badge variant="outline" className="gap-1">
                  <Clock className="w-3 h-3" />
                  Next up
                </Badge>
              )}
            </div>
            <CardDescription>
              Jobs assigned to you that are waiting to be started
            </CardDescription>
          </CardHeader>
          <CardContent>
            {queuedJobs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <div className="flex flex-col items-center gap-2">
                  <div className="rounded-full bg-muted p-3">
                    <Clock className="w-8 h-8" />
                  </div>
                  <p className="font-medium">No jobs in queue</p>
                  <p className="text-sm">New jobs will appear here when assigned to you</p>
                </div>
              </div>
            ) : (
              <ScrollArea className="h-[300px] pr-4">
                <div className="space-y-3">
                  {sortedQueuedJobs.map((job, index) => {
                    const showAcceptReject = needsAcceptance(job);
                    const isRecent = isRecentlyAssigned(job);
                    return (
                    <Card key={job.id} className={`border-l-2 ${showAcceptReject ? 'border-l-orange-500 bg-orange-50/5' : 'border-l-muted'}`}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2 flex-1">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                              {showAcceptReject && (
                                <Badge variant="default" className="bg-orange-500 hover:bg-orange-600 px-3 py-1.5 text-sm font-semibold animate-pulse w-fit">
                                  <AlertCircle className="w-4 h-4 mr-1.5" />
                                  NEEDS APPROVAL
                                </Badge>
                              )}
                              {isRecent && !showAcceptReject && (
                                <Badge variant="default" className="bg-green-500 hover:bg-green-600 px-3 py-1 w-fit">
                                  <Sparkles className="w-3 h-3 mr-1" />
                                  RECENTLY ADDED
                                </Badge>
                              )}
                              <div className="flex items-center gap-2 sm:gap-3">
                                <div className="flex items-center justify-center w-10 h-10 sm:w-8 sm:h-8 rounded-full bg-primary text-primary-foreground text-base sm:text-sm font-bold">
                                  #{job.queuePosition}
                                </div>
                                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                                  <span className="font-medium text-base sm:text-sm">Job #{job.jobNumber}</span>
                                  <div className="flex items-center gap-2">
                                    <Badge variant={job.jobType === 'emergency' ? 'destructive' : 'default'} className="text-xs">
                                      {job.jobType?.toUpperCase()}
                                    </Badge>
                                    {job.urgencyLevel === 'high' && (
                                      <Badge variant="outline" className="text-xs gap-1">
                                        <AlertCircle className="w-3 h-3" />
                                        High Priority
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                              <div className="flex items-center gap-1.5">
                                <Users className="w-3.5 h-3.5 text-muted-foreground" />
                                <span>{job.customerName}</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                                <span className="text-muted-foreground truncate">{job.locationAddress}</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <Truck className="w-3.5 h-3.5 text-muted-foreground" />
                                <span>{job.serviceType}</span>
                              </div>
                              {job.estimatedDuration && (
                                <div className="flex items-center gap-1.5">
                                  <Timer className="w-3.5 h-3.5 text-muted-foreground" />
                                  <span className="text-muted-foreground">Est. {job.estimatedDuration} mins</span>
                                </div>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-1">{job.description}</p>
                            {showAcceptReject && (
                              <div className="flex flex-col sm:flex-row gap-3 mt-4">
                                <Button
                                  variant="default"
                                  size="default"
                                  className="bg-green-600 hover:bg-green-700 h-12 text-base font-medium w-full sm:w-auto sm:h-10 sm:text-sm"
                                  onClick={() => acceptJobMutation.mutate(job.id)}
                                  disabled={acceptJobMutation.isPending}
                                  data-testid={`button-accept-${job.id}`}
                                >
                                  <CheckCircle2 className="w-5 h-5 mr-2 sm:w-4 sm:h-4" />
                                  Accept Job
                                </Button>
                                <Button
                                  variant="outline"
                                  size="default"
                                  className="h-12 text-base font-medium w-full sm:w-auto sm:h-10 sm:text-sm"
                                  onClick={() => declineJobMutation.mutate(job.id)}
                                  disabled={declineJobMutation.isPending}
                                  data-testid={`button-decline-${job.id}`}
                                >
                                  <XCircle className="w-5 h-5 mr-2 sm:w-4 sm:h-4" />
                                  Decline
                                </Button>
                              </div>
                            )}
                          </div>
                          {currentLocation && job.location && (
                            <div className="ml-4">
                              <Badge variant="outline" className="whitespace-nowrap">
                                <MapPin className="w-3 h-3 mr-1" />
                                {calculateDistance(
                                  currentLocation.coords.latitude,
                                  currentLocation.coords.longitude,
                                  job.location.lat,
                                  job.location.lng
                                )} mi
                              </Badge>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>

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
                              {job.scheduledAt 
                                ? format(new Date(job.scheduledAt), 'MMM d, yyyy \'at\' h:mm a')
                                : 'Not scheduled'}
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

        {/* Completed Jobs Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  Completed Jobs
                </CardTitle>
                <CardDescription>
                  Jobs completed today and recent invoices
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/contractor/jobs?status=completed")}
                data-testid="button-view-all-completed"
              >
                View All
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Completed Jobs Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Today</p>
                  <p className="text-2xl font-bold">
                    {dashboardData?.completedToday || 0}
                  </p>
                  <p className="text-xs text-muted-foreground">Jobs</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500 opacity-20" />
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Revenue Today</p>
                  <p className="text-2xl font-bold">
                    ${metrics?.todayEarnings?.toFixed(2) || "0.00"}
                  </p>
                  <p className="text-xs text-muted-foreground">Earned</p>
                </div>
                <DollarSign className="h-8 w-8 text-green-500 opacity-20" />
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">This Week</p>
                  <p className="text-2xl font-bold">
                    ${metrics?.weekEarnings?.toFixed(2) || "0.00"}
                  </p>
                  <p className="text-xs text-muted-foreground">Revenue</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-500 opacity-20" />
              </div>
            </div>

            {/* Recent Completed Jobs List */}
            {dashboardData?.recentCompletedJobs && dashboardData.recentCompletedJobs.length > 0 ? (
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-muted-foreground">Recent Completions</h4>
                {dashboardData.recentCompletedJobs.slice(0, 3).map((job: any) => (
                  <div 
                    key={job.id} 
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-xs">
                          #{job.jobNumber}
                        </Badge>
                        <span className="text-sm font-medium">{job.customerName}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{job.serviceType}</p>
                      <p className="text-xs text-muted-foreground">
                        Completed {job.completedAt && formatDistanceToNow(new Date(job.completedAt), { addSuffix: true })}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="default" className="bg-green-500">
                        ${job.totalAmount?.toFixed(2) || "0.00"}
                      </Badge>
                      <div className="flex gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => navigate(`/contractor/invoices/${job.id}`)}
                          data-testid={`button-view-invoice-${job.id}`}
                        >
                          <Receipt className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => navigate(`/contractor/jobs/${job.id}`)}
                          data-testid={`button-view-job-${job.id}`}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p>No completed jobs today</p>
                <p className="text-sm mt-1">Complete jobs to see them here</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Rating and Reviews Section */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Rating Overview</TabsTrigger>
            <TabsTrigger value="reviews">Recent Reviews</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="fuel">Fuel Tracking</TabsTrigger>
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
            {/* Performance KPI Widgets */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <PerformanceWidget
                title="Completion Rate"
                value={contractor?.completionRate || 0}
                unit="percentage"
                trend={metrics?.completionRateTrend}
                status={
                  (contractor?.completionRate || 0) >= 95 ? 'green' :
                  (contractor?.completionRate || 0) >= 85 ? 'yellow' :
                  'red'
                }
                target={95}
                icon={CheckCircle}
                variant="default"
              />
              <PerformanceWidget
                title="Response Time"
                value={contractor?.responseTime || 0}
                unit="minutes"
                trend={metrics?.responseTimeTrend}
                status={
                  (contractor?.responseTime || 0) <= 30 ? 'green' :
                  (contractor?.responseTime || 0) <= 60 ? 'yellow' :
                  'red'
                }
                target={30}
                icon={Clock}
                variant="default"
              />
              <PerformanceWidget
                title="Weekly Revenue"
                value={metrics?.weekEarnings || 0}
                unit="dollars"
                trend={metrics?.revenueTrend}
                status="neutral"
                icon={DollarSign}
                variant="default"
              />
              <PerformanceWidget
                title="Customer Satisfaction"
                value={contractor?.satisfactionScore || contractor?.averageRating || 0}
                unit="rating"
                trend={metrics?.satisfactionTrend}
                status={
                  (contractor?.averageRating || 0) >= 4.5 ? 'green' :
                  (contractor?.averageRating || 0) >= 4.0 ? 'yellow' :
                  'red'
                }
                target={4.5}
                icon={Star}
                variant="default"
              />
            </div>

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
          
          <TabsContent value="fuel" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Fuel Price Widget */}
              <FuelPriceWidget
                latitude={currentLocation?.coords.latitude}
                longitude={currentLocation?.coords.longitude}
                radius={15}
                fuelType="diesel"
                showTrends={true}
                showAlerts={true}
                maxStations={5}
                className="h-fit"
              />
              
              {/* Fuel Calculator */}
              <FuelCalculator
                origin={
                  currentLocation 
                    ? { lat: currentLocation.coords.latitude, lng: currentLocation.coords.longitude }
                    : undefined
                }
                destination={
                  activeJob?.location 
                    ? { lat: activeJob.location.lat, lng: activeJob.location.lng }
                    : undefined
                }
                vehicleId={dashboardData?.contractor?.vehicleId}
                defaultMpg={6.5}
                defaultTankCapacity={150}
                className="h-fit"
                onCalculate={(result) => {
                  toast({
                    title: "Fuel Cost Calculated",
                    description: `Estimated cost: $${result.estimatedCost?.toFixed(2) || 'N/A'}`
                  });
                }}
              />
            </div>
            
            {/* Quick Fuel Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Avg Local Price</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">$4.12</p>
                  <p className="text-xs text-muted-foreground">per gallon</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Weekly Change</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-green-600">-2.3%</p>
                  <p className="text-xs text-muted-foreground">vs last week</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Cheapest Nearby</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">$3.89</p>
                  <p className="text-xs text-muted-foreground">2.3 mi away</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Est. Monthly Fuel</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">$2,847</p>
                  <p className="text-xs text-muted-foreground">based on usage</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
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
            onClick={() => navigate("/contractor/invoices")}
            data-testid="button-manage-invoices"
          >
            <div className="flex flex-col items-center gap-2">
              <FileText className="w-5 h-5" />
              <span>Invoices</span>
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

      {/* Invoice Editing Dialog */}
      <Dialog open={showInvoiceDialog} onOpenChange={setShowInvoiceDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Complete Job & Send Invoice</DialogTitle>
            <DialogDescription>
              Review and edit the invoice details before sending to customer
            </DialogDescription>
          </DialogHeader>
          
          {activeJob && (
            <div className="space-y-6">
              {/* Job Details */}
              <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="font-medium">Job #:</span>
                  <span>{activeJob.jobNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Customer:</span>
                  <span>{activeJob.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Service:</span>
                  <span>{activeJob.serviceType}</span>
                </div>
              </div>

              {/* Line Items Table */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-medium">Invoice Line Items</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAddLineItem}
                    data-testid="button-add-line-item"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Item
                  </Button>
                </div>
                
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="w-24">Quantity</TableHead>
                      <TableHead className="w-32">Unit Price</TableHead>
                      <TableHead className="w-32">Total</TableHead>
                      <TableHead className="w-16"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lineItems.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <Select
                            value={item.type}
                            onValueChange={(value) => handleUpdateLineItem(index, "type", value)}
                          >
                            <SelectTrigger className="w-24" data-testid={`select-type-${index}`}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="part">Part</SelectItem>
                              <SelectItem value="labor">Labor</SelectItem>
                              <SelectItem value="fee">Fee</SelectItem>
                              <SelectItem value="tax">Tax</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Input
                            value={item.description}
                            onChange={(e) => handleUpdateLineItem(index, "description", e.target.value)}
                            placeholder="Enter description"
                            data-testid={`input-description-${index}`}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => handleUpdateLineItem(index, "quantity", parseFloat(e.target.value) || 0)}
                            min="0"
                            step="1"
                            data-testid={`input-quantity-${index}`}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={item.unitPrice}
                            onChange={(e) => handleUpdateLineItem(index, "unitPrice", parseFloat(e.target.value) || 0)}
                            min="0"
                            step="0.01"
                            placeholder="0.00"
                            data-testid={`input-unitprice-${index}`}
                          />
                        </TableCell>
                        <TableCell className="font-medium">
                          ${(item.quantity * item.unitPrice).toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveLineItem(index)}
                            data-testid={`button-remove-${index}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                
                {/* Total */}
                <div className="flex justify-end">
                  <div className="text-right space-y-2">
                    <div className="text-2xl font-bold">
                      Total: ${calculateInvoiceTotal().toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Customer Contact Info */}
              <div className="space-y-4">
                <Label className="text-base font-medium">Customer Contact Information</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="customer-email">Email Address</Label>
                    <Input
                      id="customer-email"
                      type="email"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      placeholder="customer@email.com"
                      data-testid="input-customer-email"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="customer-phone">Phone Number</Label>
                    <Input
                      id="customer-phone"
                      type="tel"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="+1 (555) 123-4567"
                      data-testid="input-customer-phone"
                    />
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="invoice-notes">Invoice Notes (Optional)</Label>
                <Textarea
                  id="invoice-notes"
                  value={invoiceNotes}
                  onChange={(e) => setInvoiceNotes(e.target.value)}
                  placeholder="Add any special instructions or notes for the customer..."
                  className="min-h-[80px]"
                  data-testid="textarea-notes"
                />
              </div>
            </div>
          )}

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowInvoiceDialog(false);
                resetInvoiceForm();
              }}
              disabled={completeJobWithInvoiceMutation.isPending}
            >
              Cancel
            </Button>
            <div className="flex gap-2 w-full sm:w-auto">
              <Button
                variant="default"
                onClick={() => handleSendInvoice("email")}
                disabled={completeJobWithInvoiceMutation.isPending || !customerEmail}
                className="flex-1"
                data-testid="button-send-email"
              >
                {completeJobWithInvoiceMutation.isPending && sendMethod === "email" ? (
                  <>
                    <Timer className="w-4 h-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4 mr-2" />
                    Send via Email
                  </>
                )}
              </Button>
              <Button
                variant="secondary"
                onClick={() => handleSendInvoice("sms")}
                disabled={completeJobWithInvoiceMutation.isPending || !customerPhone}
                className="flex-1"
                data-testid="button-send-sms"
              >
                {completeJobWithInvoiceMutation.isPending && sendMethod === "sms" ? (
                  <>
                    <Timer className="w-4 h-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Send via SMS
                  </>
                )}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog for Advancing to Next Job */}
      <AlertDialog open={showAdvanceDialog} onOpenChange={setShowAdvanceDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Complete Current Job and Start Next?</AlertDialogTitle>
            <AlertDialogDescription>
              This will mark your current job as completed and automatically advance you to the next job in your queue.
              {queuedJobs.length > 0 && (
                <div className="mt-4 p-3 bg-muted/50 rounded-md">
                  <div className="text-sm space-y-1">
                    <div className="font-medium">Next Job Details:</div>
                    <div>Job #{queuedJobs[0]?.jobNumber} - {queuedJobs[0]?.customerName}</div>
                    <div>{queuedJobs[0]?.serviceType}</div>
                    <div>{queuedJobs[0]?.locationAddress}</div>
                  </div>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={advanceToNextJobMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (activeJob?.id) {
                  advanceToNextJobMutation.mutate(activeJob.id);
                }
              }}
              disabled={advanceToNextJobMutation.isPending}
            >
              {advanceToNextJobMutation.isPending ? (
                <>
                  <Timer className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Complete & Start Next
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}