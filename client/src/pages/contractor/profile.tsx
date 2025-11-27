import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useWebSocket } from "@/hooks/use-websocket";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  Legend,
  RadialBarChart,
  RadialBar,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid
} from "recharts";
import { useToast } from "@/hooks/use-toast";
import {
  User,
  Phone,
  Mail,
  MapPin,
  Building2,
  CreditCard,
  Shield,
  FileText,
  Upload,
  CheckCircle,
  AlertCircle,
  Clock,
  Calendar,
  Bell,
  Smartphone,
  Volume2,
  Truck,
  Wrench,
  Fuel,
  Award,
  Camera,
  Save,
  RefreshCw,
  ChevronRight,
  DollarSign,
  TrendingUp,
  Package,
  Target,
  AlertTriangle,
  Star,
  CheckCircle2,
  Timer,
  ChevronLeft,
  ArrowUp,
  ArrowDown,
  Info,
  Zap
} from "lucide-react";
import { format } from "date-fns";
import ServiceAreaMap from "@/components/service-area-map";

// Profile form schema
const profileSchema = z.object({
  firstName: z.string().min(2, "First name is required"),
  lastName: z.string().min(2, "Last name is required"),
  email: z.string().email("Invalid email"),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, "Invalid phone number"),
  companyName: z.string().min(2, "Company name is required"),
  bio: z.string().optional(),
  address: z.string(),
  city: z.string(),
  state: z.string().length(2, "State must be 2 characters"),
  zip: z.string().regex(/^\d{5}(-\d{4})?$/, "Invalid ZIP code")
});

// Service area schema
const serviceAreaSchema = z.object({
  baseLocation: z.object({
    address: z.string(),
    lat: z.number(),
    lng: z.number()
  }),
  serviceRadius: z.number().min(10).max(200),
  services: z.array(z.string()).min(1, "Select at least one service"),
  hasMobileWaterSource: z.boolean(),
  hasWastewaterRecovery: z.boolean()
});

// Payment method schema
const paymentMethodSchema = z.object({
  methodType: z.enum(["bank_account", "debit_card"]),
  accountHolderName: z.string().min(2, "Account holder name is required"),
  routingNumber: z.string().regex(/^\d{9}$/, "Routing number must be 9 digits").optional(),
  accountNumber: z.string().min(4, "Account number is required"),
  confirmAccountNumber: z.string()
}).refine(data => data.accountNumber === data.confirmAccountNumber, {
  message: "Account numbers don't match",
  path: ["confirmAccountNumber"]
});

// Notification preferences schema
const notificationSchema = z.object({
  emailNotifications: z.boolean(),
  smsNotifications: z.boolean(),
  pushNotifications: z.boolean(),
  soundAlerts: z.boolean(),
  newJobAlerts: z.boolean(),
  scheduledJobReminders: z.boolean(),
  performanceUpdates: z.boolean(),
  payoutNotifications: z.boolean()
});

// Availability schema
const availabilitySchema = z.object({
  monday: z.object({ enabled: z.boolean(), start: z.string(), end: z.string() }),
  tuesday: z.object({ enabled: z.boolean(), start: z.string(), end: z.string() }),
  wednesday: z.object({ enabled: z.boolean(), start: z.string(), end: z.string() }),
  thursday: z.object({ enabled: z.boolean(), start: z.string(), end: z.string() }),
  friday: z.object({ enabled: z.boolean(), start: z.string(), end: z.string() }),
  saturday: z.object({ enabled: z.boolean(), start: z.string(), end: z.string() }),
  sunday: z.object({ enabled: z.boolean(), start: z.string(), end: z.string() }),
  emergencyAvailable: z.boolean()
});

// Pricing schema
const pricingSchema = z.object({
  baseHourlyRate: z.number().min(0, "Hourly rate must be positive").max(1000, "Hourly rate seems too high"),
  partsMarkupPercent: z.number().min(0, "Markup must be positive").max(100, "Markup cannot exceed 100%")
});

const availableServices = [
  { id: "tire_repair", label: "Tire Repair", icon: Truck },
  { id: "mechanical", label: "Mechanical Repair", icon: Wrench },
  { id: "fuel_delivery", label: "Fuel Delivery", icon: Fuel },
  { id: "jump_start", label: "Jump Start", icon: Shield },
  { id: "lockout", label: "Lockout Service", icon: Shield },
  { id: "towing", label: "Towing", icon: Truck },
  { id: "pm_service", label: "Preventive Maintenance", icon: Wrench },
  { id: "truck_wash", label: "Truck Wash", icon: Truck }
];

interface ProfileData {
  contractor: any;
  documents: Array<{
    id: string;
    type: string;
    name: string;
    uploadedAt: string;
    verifiedAt?: string;
    expiresAt?: string;
    status: "pending" | "verified" | "expired";
  }>;
  paymentMethod: any;
  availability: any;
  notifications: any;
}

interface CommissionData {
  overview: {
    totalEarned: number;
    pendingPayout: number;
    monthEarnings: number;
    averageCommissionRate: number;
  };
  commissions: Array<{
    id: string;
    jobId: string;
    date: string;
    customerName: string;
    serviceType: string;
    amount: number;
    commissionRate: number;
    earned: number;
    status: 'paid' | 'pending' | 'disputed';
  }>;
  totalCount: number;
  currentPage: number;
  totalPages: number;
}

interface PayoutData {
  payouts: Array<{
    id: string;
    date: string;
    amount: number;
    method: string;
    status: 'completed' | 'pending' | 'processing';
    referenceNumber: string;
  }>;
}

interface CommissionRulesData {
  currentTier: string;
  currentRate: number;
  monthlyVolume: number;
  nextTierThreshold?: number;
  nextTierRate?: number;
  rules: Array<{
    tierName: string;
    minVolume: number;
    maxVolume?: number;
    rate: number;
  }>;
}

interface PerformanceMetricsData {
  completionRate: number;
  averageRating: number;
  responseTime: number;
  jobsCompleted: number;
  ratingsBreakdown: {
    fiveStar: number;
    fourStar: number;
    threeStar: number;
    twoStar: number;
    oneStar: number;
  };
}

interface PerformanceGoalsData {
  goals: Array<{
    id: string;
    metric: string;
    targetValue: number;
    currentValue: number;
    deadline: string;
    status: 'active' | 'completed' | 'missed';
    reward?: string;
  }>;
}

interface PartsStockData {
  parts: Array<{
    id: string;
    partName: string;
    partNumber: string;
    category: string;
    quantity: number;
    unitCost: number;
    totalValue: number;
  }>;
  summary: {
    totalValue: number;
    partTypes: number;
    lowStockAlerts: number;
    lastUpdated: string;
  };
}

interface PricingData {
  baseHourlyRate: number;
  partsMarkupPercent: number;
  platformCommissionRate: number;
}

type CommissionCalculatedPayload = {
  contractorId: string;
  jobId: string;
  amount: number;
  commissionRate: number;
  earned: number;
  serviceType: string;
  jobType?: string;
  timestamp: string;
};

type PayoutProcessedPayload = {
  contractorId: string;
  payoutId: string;
  amount: number;
  method: string;
  status: "completed" | "processing" | "failed";
  referenceNumber?: string;
  timestamp: string;
};

type PerformanceUpdatedPayload = {
  contractorId: string;
  metric: string;
  oldValue: number;
  newValue: number;
  trend: "up" | "down" | "stable";
  timestamp: string;
  message?: string;
  metricType?: string;
  achievement?: boolean;
};

type ContractorPartsUpdatePayload = {
  contractorId: string;
  partId: string;
  partName: string;
  action: "added" | "used" | "restocked" | "low_stock" | "out_of_stock";
  quantity?: number;
  remainingStock?: number;
  message?: string;
  timestamp: string;
};

export default function ContractorProfile() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("personal");
  const [commissionsPage, setCommissionsPage] = useState(1);

  // Get contractorId from session/profile
  const { data: profileData, isLoading, refetch } = useQuery<ProfileData>({
    queryKey: ["/api/contractor/profile"]
  });

  const contractorId = profileData?.contractor?.id;

  // WebSocket setup for real-time contractor earnings updates
  const { isConnected } = useWebSocket({
    eventType: 'earnings_updates',
    role: 'contractor',
    onCommissionCalculated: (payload: CommissionCalculatedPayload) => {
      console.log('New commission calculated:', payload);
      // Invalidate queries to refresh commission data
      queryClient.invalidateQueries({ queryKey: [`/api/contractors/${contractorId}/commissions`] });
      
      // Show toast notification
      toast({
        title: "New Commission Earned!",
        description: `You earned $${payload.amount} for ${payload.jobType}`,
      });
    },
    onPayoutProcessed: (payload: PayoutProcessedPayload) => {
      console.log('Payout processed:', payload);
      // Invalidate queries to refresh payout data
      queryClient.invalidateQueries({ queryKey: [`/api/contractors/${contractorId}/payouts`] });
      
      // Show toast notification
      toast({
        title: "Payout Processed",
        description: `$${payload.amount} has been sent to your ${payload.method}`,
      });
    },
    onPerformanceUpdate: (payload: PerformanceUpdatedPayload) => {
      console.log('Performance metrics updated:', payload);
      // Invalidate queries to refresh performance data
      queryClient.invalidateQueries({ queryKey: [`/api/contractors/${contractorId}/performance-metrics`] });
      queryClient.invalidateQueries({ queryKey: [`/api/contractors/${contractorId}/performance-goals`] });
      
      // Show toast notification for significant changes
      if (payload.metricType === 'rating' || payload.metricType === 'milestone') {
        toast({
          title: "Performance Update",
          description: payload.message,
          variant: payload.achievement ? 'default' : undefined,
        });
      }
    },
    onContractorPartsUpdate: (payload: ContractorPartsUpdatePayload) => {
      console.log('Contractor parts inventory updated:', payload);
      // Invalidate parts inventory query
      queryClient.invalidateQueries({ queryKey: [`/api/contractors/${contractorId}/parts-stock`] });
      
      // Show toast notification for low stock
      if (payload.action === 'low_stock' || payload.action === 'out_of_stock') {
        toast({
          title: "Parts Inventory Alert",
          description: `${payload.partName}: ${payload.message}`,
          variant: 'destructive',
        });
      }
    },
  });

  // Fetch commission data
  const { data: commissionsData, isLoading: commissionsLoading } = useQuery<CommissionData>({
    queryKey: [`/api/contractors/${contractorId}/commissions`, commissionsPage],
    enabled: !!contractorId && activeTab === "earnings"
  });
  const totalCommissionPages = commissionsData?.totalPages ?? 1;
  const commissionCurrentPage = commissionsData?.currentPage ?? commissionsPage;
  const showCommissionPagination = totalCommissionPages > 1;

  // Fetch payout data
  const { data: payoutsData, isLoading: payoutsLoading } = useQuery<PayoutData>({
    queryKey: [`/api/contractors/${contractorId}/payouts`],
    enabled: !!contractorId && activeTab === "earnings"
  });

  // Fetch commission rules
  const { data: rulesData, isLoading: rulesLoading } = useQuery<CommissionRulesData>({
    queryKey: [`/api/contractors/${contractorId}/commission-rules`],
    enabled: !!contractorId && activeTab === "earnings"
  });

  // Fetch performance metrics
  const { data: performanceMetrics, isLoading: metricsLoading } = useQuery<PerformanceMetricsData>({
    queryKey: [`/api/contractors/${contractorId}/performance-metrics`],
    enabled: !!contractorId && activeTab === "performance"
  });

  // Fetch performance goals
  const { data: performanceGoals, isLoading: goalsLoading } = useQuery<PerformanceGoalsData>({
    queryKey: [`/api/contractors/${contractorId}/performance-goals`],
    enabled: !!contractorId && activeTab === "performance"
  });

  // Fetch parts stock
  const { data: partsStock, isLoading: partsLoading } = useQuery<PartsStockData>({
    queryKey: [`/api/contractors/${contractorId}/parts-stock`],
    enabled: !!contractorId && activeTab === "inventory"
  });

  // Fetch pricing data
  const { data: pricingData, isLoading: pricingLoading, refetch: refetchPricing } = useQuery<PricingData>({
    queryKey: ["/api/contractor/pricing"],
    enabled: activeTab === "pricing"
  });

  // Profile form
  const profileForm = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: profileData?.contractor?.firstName || "",
      lastName: profileData?.contractor?.lastName || "",
      email: profileData?.contractor?.email || "",
      phone: profileData?.contractor?.phone || "",
      companyName: profileData?.contractor?.companyName || "",
      bio: profileData?.contractor?.bio || "",
      address: profileData?.contractor?.address || "",
      city: profileData?.contractor?.city || "",
      state: profileData?.contractor?.state || "",
      zip: profileData?.contractor?.zip || ""
    }
  });

  // Service area form
  const serviceAreaForm = useForm<z.infer<typeof serviceAreaSchema>>({
    resolver: zodResolver(serviceAreaSchema),
    defaultValues: {
      baseLocation: profileData?.contractor?.baseLocation || { address: "", lat: 0, lng: 0 },
      serviceRadius: profileData?.contractor?.serviceRadius || 50,
      services: profileData?.contractor?.services || [],
      hasMobileWaterSource: profileData?.contractor?.hasMobileWaterSource || false,
      hasWastewaterRecovery: profileData?.contractor?.hasWastewaterRecovery || false
    }
  });

  // Payment method form
  const paymentMethodForm = useForm<z.infer<typeof paymentMethodSchema>>({
    resolver: zodResolver(paymentMethodSchema),
    defaultValues: {
      methodType: "bank_account",
      accountHolderName: "",
      routingNumber: "",
      accountNumber: "",
      confirmAccountNumber: ""
    }
  });

  // Notification form
  const notificationForm = useForm<z.infer<typeof notificationSchema>>({
    resolver: zodResolver(notificationSchema),
    defaultValues: profileData?.notifications || {
      emailNotifications: true,
      smsNotifications: true,
      pushNotifications: true,
      soundAlerts: true,
      newJobAlerts: true,
      scheduledJobReminders: true,
      performanceUpdates: true,
      payoutNotifications: true
    }
  });

  // Availability form
  const availabilityForm = useForm<z.infer<typeof availabilitySchema>>({
    resolver: zodResolver(availabilitySchema),
    defaultValues: profileData?.availability || {
      monday: { enabled: true, start: "08:00", end: "18:00" },
      tuesday: { enabled: true, start: "08:00", end: "18:00" },
      wednesday: { enabled: true, start: "08:00", end: "18:00" },
      thursday: { enabled: true, start: "08:00", end: "18:00" },
      friday: { enabled: true, start: "08:00", end: "18:00" },
      saturday: { enabled: false, start: "08:00", end: "18:00" },
      sunday: { enabled: false, start: "08:00", end: "18:00" },
      emergencyAvailable: true
    }
  });

  // Pricing form
  const pricingForm = useForm<z.infer<typeof pricingSchema>>({
    resolver: zodResolver(pricingSchema),
    defaultValues: {
      baseHourlyRate: pricingData?.baseHourlyRate || 75,
      partsMarkupPercent: pricingData?.partsMarkupPercent || 20
    }
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: z.infer<typeof profileSchema>) => {
      return await apiRequest("/api/contractor/profile", {
        method: "PATCH",
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully"
      });
      refetch();
    },
    onError: () => {
      toast({
        title: "Update Failed",
        description: "Failed to update profile",
        variant: "destructive"
      });
    }
  });

  // Update service area mutation
  const updateServiceAreaMutation = useMutation({
    mutationFn: async (data: z.infer<typeof serviceAreaSchema>) => {
      return await apiRequest("/api/contractor/service-area", {
        method: "PATCH",
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      toast({
        title: "Service Area Updated",
        description: "Your service area has been updated"
      });
      refetch();
    }
  });

  // Update payment method mutation
  const updatePaymentMethodMutation = useMutation({
    mutationFn: async (data: z.infer<typeof paymentMethodSchema>) => {
      const { confirmAccountNumber, ...paymentData } = data;
      return await apiRequest("/api/contractor/payment-method", {
        method: "POST",
        body: JSON.stringify(paymentData)
      });
    },
    onSuccess: () => {
      toast({
        title: "Payment Method Updated",
        description: "Your payment method has been updated"
      });
      paymentMethodForm.reset();
      refetch();
    }
  });

  // Update notifications mutation
  const updateNotificationsMutation = useMutation({
    mutationFn: async (data: z.infer<typeof notificationSchema>) => {
      return await apiRequest("/api/contractor/notifications", {
        method: "PATCH",
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      toast({
        title: "Notifications Updated",
        description: "Your notification preferences have been updated"
      });
      refetch();
    }
  });

  // Update availability mutation
  const updateAvailabilityMutation = useMutation({
    mutationFn: async (data: z.infer<typeof availabilitySchema>) => {
      return await apiRequest("/api/contractor/availability", {
        method: "PATCH",
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      toast({
        title: "Availability Updated",
        description: "Your availability schedule has been updated"
      });
      refetch();
    }
  });

  // Update pricing mutation
  const updatePricingMutation = useMutation({
    mutationFn: async (data: z.infer<typeof pricingSchema>) => {
      return await apiRequest("/api/contractor/pricing", {
        method: "PUT",
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      toast({
        title: "Pricing Updated",
        description: "Your pricing has been updated successfully"
      });
      refetchPricing();
    },
    onError: () => {
      toast({
        title: "Update Failed",
        description: "Failed to update pricing",
        variant: "destructive"
      });
    }
  });

  // Upload document mutation
  const uploadDocumentMutation = useMutation({
    mutationFn: async ({ file, type }: { file: File; type: string }) => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", type);
      
      return await apiRequest("/api/contractor/documents", {
        method: "POST",
        body: formData
      });
    },
    onSuccess: () => {
      toast({
        title: "Document Uploaded",
        description: "Your document has been uploaded successfully"
      });
      refetch();
    }
  });

  const handleDocumentUpload = (event: React.ChangeEvent<HTMLInputElement>, type: string) => {
    const file = event.target.files?.[0];
    if (file) {
      uploadDocumentMutation.mutate({ file, type });
    }
  };

  // Prepare chart data for performance metrics
  const ratingData = performanceMetrics ? [
    { name: '5★', value: performanceMetrics.ratingsBreakdown.fiveStar, fill: '#10b981' },
    { name: '4★', value: performanceMetrics.ratingsBreakdown.fourStar, fill: '#3b82f6' },
    { name: '3★', value: performanceMetrics.ratingsBreakdown.threeStar, fill: '#facc15' },
    { name: '2★', value: performanceMetrics.ratingsBreakdown.twoStar, fill: '#fb923c' },
    { name: '1★', value: performanceMetrics.ratingsBreakdown.oneStar, fill: '#ef4444' }
  ] : [];

  const metricsData = performanceMetrics ? [
    {
      name: 'Completion Rate',
      value: performanceMetrics.completionRate,
      fill: '#8b5cf6'
    }
  ] : [];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-20 bg-muted rounded-lg"></div>
            <div className="h-96 bg-muted rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  const contractor = profileData?.contractor;
  const documents = profileData?.documents || [];
  const paymentMethod = profileData?.paymentMethod;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="w-20 h-20">
                <AvatarFallback className="text-lg">
                  {contractor?.firstName?.[0]}{contractor?.lastName?.[0]}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-2xl font-bold">Profile Management</h1>
                <p className="text-muted-foreground">{contractor?.companyName}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge className={`${
                    contractor?.performanceTier === 'gold' ? 'bg-yellow-500' :
                    contractor?.performanceTier === 'silver' ? 'bg-gray-400' :
                    'bg-orange-600'
                  } text-white`}>
                    <Award className="w-3 h-3 mr-1" />
                    {contractor?.performanceTier?.toUpperCase()} TIER
                  </Badge>
                  {contractor?.isVerified && (
                    <Badge variant="default">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Verified
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={() => navigate("/contractor/dashboard")}
              data-testid="button-back-dashboard"
            >
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <ScrollArea className="w-full">
            <TabsList className="inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground w-full">
              <TabsTrigger value="personal" data-testid="tab-personal">Profile</TabsTrigger>
              <TabsTrigger value="service-area" data-testid="tab-service-area">Service Area</TabsTrigger>
              <TabsTrigger value="earnings" data-testid="tab-earnings">Earnings</TabsTrigger>
              <TabsTrigger value="performance" data-testid="tab-performance">Performance</TabsTrigger>
              <TabsTrigger value="inventory" data-testid="tab-inventory">Parts Inventory</TabsTrigger>
              <TabsTrigger value="pricing" data-testid="tab-pricing">Pricing</TabsTrigger>
              <TabsTrigger value="documents" data-testid="tab-documents">Documents</TabsTrigger>
              <TabsTrigger value="settings" data-testid="tab-settings">Settings</TabsTrigger>
            </TabsList>
          </ScrollArea>

          {/* Personal Tab - Existing Content (Simplified for space) */}
          <TabsContent value="personal" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>Update your personal and company details</CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...profileForm}>
                  <form onSubmit={profileForm.handleSubmit(data => updateProfileMutation.mutate(data))} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={profileForm.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>First Name</FormLabel>
                            <FormControl>
                              <Input {...field} data-testid="input-first-name" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={profileForm.control}
                        name="lastName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Last Name</FormLabel>
                            <FormControl>
                              <Input {...field} data-testid="input-last-name" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={profileForm.control}
                      name="companyName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Company Name</FormLabel>
                          <FormControl>
                            <Input {...field} data-testid="input-company-name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-end">
                      <Button type="submit" disabled={updateProfileMutation.isPending} data-testid="button-save-profile">
                        <Save className="w-4 h-4 mr-2" />
                        {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* SERVICE AREA TAB */}
          <TabsContent value="service-area" className="space-y-4">
            <ServiceAreaMap
              initialLat={profileData?.contractor?.baseLocationLat ? parseFloat(profileData.contractor.baseLocationLat) : 39.8283}
              initialLng={profileData?.contractor?.baseLocationLon ? parseFloat(profileData.contractor.baseLocationLon) : -98.5795}
              initialRadius={profileData?.contractor?.serviceRadius || 25}
              onSave={(lat, lng, radius) => {
                // Update the service area data
                updateServiceAreaMutation.mutate({
                  baseLocation: {
                    address: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
                    lat: lat,
                    lng: lng
                  },
                  serviceRadius: radius,
                  services: profileData?.contractor?.services || [],
                  hasMobileWaterSource: profileData?.contractor?.hasMobileWaterSource || false,
                  hasWastewaterRecovery: profileData?.contractor?.hasWastewaterRecovery || false
                });
              }}
              isLoading={updateServiceAreaMutation.isPending}
            />
          </TabsContent>

          {/* PRICING TAB */}
          <TabsContent value="pricing" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Pricing Configuration</CardTitle>
                <CardDescription>
                  Set your base hourly rate and parts markup percentage. The platform will automatically calculate your earnings after commission.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {pricingLoading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-20 w-full" />
                  </div>
                ) : (
                  <Form {...pricingForm}>
                    <form onSubmit={pricingForm.handleSubmit(data => updatePricingMutation.mutate(data))} className="space-y-6">
                      {/* Base Hourly Rate */}
                      <FormField
                        control={pricingForm.control}
                        name="baseHourlyRate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Base Hourly Rate</FormLabel>
                            <FormDescription>
                              Your standard hourly rate for labor before platform commission
                            </FormDescription>
                            <FormControl>
                              <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                                  $
                                </span>
                                <Input
                                  {...field}
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  max="1000"
                                  className="pl-8"
                                  data-testid="input-hourly-rate"
                                  onChange={(e) => field.onChange(parseFloat(e.target.value))}
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Parts Markup Percentage */}
                      <FormField
                        control={pricingForm.control}
                        name="partsMarkupPercent"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Parts Markup</FormLabel>
                            <FormDescription>
                              The percentage markup you add to parts costs
                            </FormDescription>
                            <FormControl>
                              <div className="relative">
                                <Input
                                  {...field}
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  max="100"
                                  className="pr-8"
                                  data-testid="input-parts-markup"
                                  onChange={(e) => field.onChange(parseFloat(e.target.value))}
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                                  %
                                </span>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Earnings Estimation */}
                      <div className="rounded-lg bg-muted p-4 space-y-3">
                        <h4 className="font-medium flex items-center gap-2">
                          <DollarSign className="h-4 w-4" />
                          Estimated Earnings After Commission
                        </h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Your hourly rate:</span>
                            <span className="font-medium">${pricingForm.watch("baseHourlyRate")?.toFixed(2) || "0.00"}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Platform commission ({pricingData?.platformCommissionRate || 15}%):</span>
                            <span className="text-red-600">
                              -${((pricingForm.watch("baseHourlyRate") || 0) * ((pricingData?.platformCommissionRate || 15) / 100)).toFixed(2)}
                            </span>
                          </div>
                          <Separator />
                          <div className="flex justify-between font-medium">
                            <span>You earn per hour:</span>
                            <span className="text-green-600">
                              ${((pricingForm.watch("baseHourlyRate") || 0) * (1 - ((pricingData?.platformCommissionRate || 15) / 100))).toFixed(2)}
                            </span>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          Note: Parts markup is calculated separately and not subject to commission.
                        </p>
                      </div>

                      {/* Save Button */}
                      <div className="flex justify-end">
                        <Button 
                          type="submit" 
                          disabled={updatePricingMutation.isPending}
                          data-testid="button-save-pricing"
                        >
                          <Save className="w-4 h-4 mr-2" />
                          {updatePricingMutation.isPending ? "Saving..." : "Save Pricing"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* EARNINGS TAB */}
          <TabsContent value="earnings" className="space-y-6">
            {/* Earnings Overview Cards */}
            <div className="grid gap-4 md:grid-cols-4">
              <Card data-testid="card-total-earned">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Earned</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  {commissionsLoading ? (
                    <Skeleton className="h-8 w-24" />
                  ) : (
                    <>
                      <div className="text-2xl font-bold" data-testid="text-total-earned">
                        ${commissionsData?.overview?.totalEarned?.toFixed(2) || '0.00'}
                      </div>
                      <p className="text-xs text-muted-foreground">All-time earnings</p>
                    </>
                  )}
                </CardContent>
              </Card>

              <Card data-testid="card-pending-payout">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pending Payout</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  {commissionsLoading ? (
                    <Skeleton className="h-8 w-24" />
                  ) : (
                    <>
                      <div className="text-2xl font-bold" data-testid="text-pending-payout">
                        ${commissionsData?.overview?.pendingPayout?.toFixed(2) || '0.00'}
                      </div>
                      <p className="text-xs text-muted-foreground">Awaiting payment</p>
                    </>
                  )}
                </CardContent>
              </Card>

              <Card data-testid="card-month-earnings">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">This Month</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  {commissionsLoading ? (
                    <Skeleton className="h-8 w-24" />
                  ) : (
                    <>
                      <div className="text-2xl font-bold" data-testid="text-month-earnings">
                        ${commissionsData?.overview?.monthEarnings?.toFixed(2) || '0.00'}
                      </div>
                      <p className="text-xs text-muted-foreground">Current month earnings</p>
                    </>
                  )}
                </CardContent>
              </Card>

              <Card data-testid="card-commission-rate">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Avg Commission</CardTitle>
                  <Target className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  {commissionsLoading ? (
                    <Skeleton className="h-8 w-24" />
                  ) : (
                    <>
                      <div className="text-2xl font-bold" data-testid="text-commission-rate">
                        {commissionsData?.overview?.averageCommissionRate?.toFixed(1) || '0'}%
                      </div>
                      <p className="text-xs text-muted-foreground">Average rate</p>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Commission Rules Display */}
            <Card data-testid="card-commission-rules">
              <CardHeader>
                <CardTitle>Commission Structure</CardTitle>
                <CardDescription>Your current tier and progress to the next level</CardDescription>
              </CardHeader>
              <CardContent>
                {rulesLoading ? (
                  <Skeleton className="h-32 w-full" />
                ) : rulesData ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">Current Tier: <span className="text-primary">{rulesData.currentTier}</span></p>
                        <p className="text-sm text-muted-foreground">Commission Rate: {rulesData.currentRate}%</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">Monthly Volume</p>
                        <p className="text-2xl font-bold">${rulesData.monthlyVolume.toFixed(0)}</p>
                      </div>
                    </div>
                    
                    {rulesData.nextTierThreshold && (
                      <>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Progress to {rulesData.rules[1]?.tierName || 'Next Tier'}</span>
                            <span>{((rulesData.monthlyVolume / rulesData.nextTierThreshold) * 100).toFixed(0)}%</span>
                          </div>
                          <Progress 
                            value={(rulesData.monthlyVolume / rulesData.nextTierThreshold) * 100}
                            className="h-2"
                            data-testid="progress-tier"
                          />
                          <p className="text-xs text-muted-foreground">
                            ${rulesData.nextTierThreshold - rulesData.monthlyVolume} more to reach {rulesData.nextTierRate}% commission rate
                          </p>
                        </div>
                      </>
                    )}

                    <Separator />

                    <div className="space-y-2">
                      <p className="text-sm font-medium">Commission Tiers</p>
                      {rulesData.rules.map((rule, index) => (
                        <div key={index} className="flex justify-between text-sm">
                          <span className={rule.tierName === rulesData.currentTier ? "font-bold text-primary" : ""}>
                            {rule.tierName}
                          </span>
                          <span className="text-muted-foreground">
                            ${rule.minVolume}+ → {rule.rate}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground">No commission rules data available</p>
                )}
              </CardContent>
            </Card>

            {/* Commission Breakdown Table */}
            <Card data-testid="card-commission-breakdown">
              <CardHeader>
                <CardTitle>Commission Breakdown</CardTitle>
                <CardDescription>Detailed view of your earnings by job</CardDescription>
              </CardHeader>
              <CardContent>
                {commissionsLoading ? (
                  <Skeleton className="h-64 w-full" />
                ) : (
                  <>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Job ID</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Customer</TableHead>
                          <TableHead>Service Type</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                          <TableHead className="text-right">Rate</TableHead>
                          <TableHead className="text-right">Earned</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {commissionsData?.commissions?.map((commission) => (
                          <TableRow key={commission.id} data-testid={`row-commission-${commission.id}`}>
                            <TableCell className="font-medium">{commission.jobId}</TableCell>
                            <TableCell>{format(new Date(commission.date), 'MMM d, yyyy')}</TableCell>
                            <TableCell>{commission.customerName}</TableCell>
                            <TableCell>{commission.serviceType}</TableCell>
                            <TableCell className="text-right">${commission.amount.toFixed(2)}</TableCell>
                            <TableCell className="text-right">{commission.commissionRate}%</TableCell>
                            <TableCell className="text-right font-medium">${commission.earned.toFixed(2)}</TableCell>
                            <TableCell>
                              <Badge 
                                className={
                                  commission.status === 'paid' ? 'bg-green-500 text-white' :
                                  commission.status === 'pending' ? 'bg-yellow-500 text-white' :
                                  'bg-red-500 text-white'
                                }
                                data-testid={`badge-status-${commission.id}`}
                              >
                                {commission.status}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>

                    {/* Pagination */}
                    {showCommissionPagination && (
                      <div className="flex items-center justify-between mt-4">
                        <p className="text-sm text-muted-foreground">
                          Page {commissionCurrentPage} of {totalCommissionPages}
                        </p>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCommissionsPage(prev => Math.max(1, prev - 1))}
                            disabled={commissionsPage === 1}
                            data-testid="button-prev-page"
                          >
                            <ChevronLeft className="h-4 w-4" />
                            Previous
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCommissionsPage(prev => Math.min(totalCommissionPages, prev + 1))}
                            disabled={commissionsPage >= totalCommissionPages}
                            data-testid="button-next-page"
                          >
                            Next
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            {/* Payout History */}
            <Card data-testid="card-payout-history">
              <CardHeader>
                <CardTitle>Payout History</CardTitle>
                <CardDescription>Your payment history and pending payouts</CardDescription>
              </CardHeader>
              <CardContent>
                {payoutsLoading ? (
                  <Skeleton className="h-48 w-full" />
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Payout Date</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead>Method</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Reference Number</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payoutsData?.payouts
                        ?.sort((a, b) => {
                          // Show pending payouts first
                          if (a.status === 'pending' && b.status !== 'pending') return -1;
                          if (a.status !== 'pending' && b.status === 'pending') return 1;
                          return new Date(b.date).getTime() - new Date(a.date).getTime();
                        })
                        .map((payout) => (
                          <TableRow 
                            key={payout.id}
                            className={payout.status === 'pending' ? 'bg-yellow-50 dark:bg-yellow-950' : ''}
                            data-testid={`row-payout-${payout.id}`}
                          >
                            <TableCell className="font-medium">
                              {format(new Date(payout.date), 'MMM d, yyyy')}
                            </TableCell>
                            <TableCell className="text-right font-medium">${payout.amount.toFixed(2)}</TableCell>
                            <TableCell>{payout.method}</TableCell>
                            <TableCell>
                              <Badge 
                                className={
                                  payout.status === 'completed' ? 'bg-green-500 text-white' :
                                  payout.status === 'pending' ? 'bg-yellow-500 text-white' :
                                  'bg-blue-500 text-white'
                                }
                                data-testid={`badge-payout-status-${payout.id}`}
                              >
                                {payout.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-mono text-xs">{payout.referenceNumber}</TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* PERFORMANCE TAB */}
          <TabsContent value="performance" className="space-y-6">
            {/* Performance Metrics Cards */}
            <div className="grid gap-4 md:grid-cols-4">
              <Card data-testid="card-completion-rate">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
                  <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  {metricsLoading ? (
                    <Skeleton className="h-20 w-20" />
                  ) : (
                    <div className="relative w-20 h-20">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadialBarChart
                          cx="50%"
                          cy="50%"
                          innerRadius="60%"
                          outerRadius="90%"
                          data={[{
                            name: 'Completion',
                            value: performanceMetrics?.completionRate || 0,
                            fill: '#8b5cf6'
                          }]}
                        >
                          <RadialBar dataKey="value" cornerRadius={10} fill="#8b5cf6" />
                        </RadialBarChart>
                      </ResponsiveContainer>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-xl font-bold" data-testid="text-completion-rate">
                          {performanceMetrics?.completionRate || 0}%
                        </span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card data-testid="card-average-rating">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
                  <Star className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  {metricsLoading ? (
                    <Skeleton className="h-8 w-24" />
                  ) : (
                    <>
                      <div className="flex items-center gap-2">
                        <div className="text-2xl font-bold" data-testid="text-average-rating">
                          {performanceMetrics?.averageRating?.toFixed(1) || '0.0'}
                        </div>
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${
                                i < Math.round(performanceMetrics?.averageRating || 0)
                                  ? 'fill-yellow-400 text-yellow-400'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">Based on all reviews</p>
                    </>
                  )}
                </CardContent>
              </Card>

              <Card data-testid="card-response-time">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Response Time</CardTitle>
                  <Timer className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  {metricsLoading ? (
                    <Skeleton className="h-8 w-24" />
                  ) : (
                    <>
                      <div className="text-2xl font-bold" data-testid="text-response-time">
                        {performanceMetrics?.responseTime || 0} min
                      </div>
                      <p className="text-xs text-muted-foreground">Average response</p>
                    </>
                  )}
                </CardContent>
              </Card>

              <Card data-testid="card-jobs-completed">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Jobs Completed</CardTitle>
                  <Zap className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  {metricsLoading ? (
                    <Skeleton className="h-8 w-24" />
                  ) : (
                    <>
                      <div className="text-2xl font-bold" data-testid="text-jobs-completed">
                        {performanceMetrics?.jobsCompleted || 0}
                      </div>
                      <p className="text-xs text-muted-foreground">Total completed</p>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Ratings Breakdown */}
            <Card data-testid="card-ratings-breakdown">
              <CardHeader>
                <CardTitle>Ratings Distribution</CardTitle>
                <CardDescription>Breakdown of customer ratings</CardDescription>
              </CardHeader>
              <CardContent>
                {metricsLoading ? (
                  <Skeleton className="h-64 w-full" />
                ) : (
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={ratingData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {ratingData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <RechartsTooltip />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Performance Goals */}
            <Card data-testid="card-performance-goals">
              <CardHeader>
                <CardTitle>Performance Goals</CardTitle>
                <CardDescription>Track your progress towards performance targets</CardDescription>
              </CardHeader>
              <CardContent>
                {goalsLoading ? (
                  <Skeleton className="h-48 w-full" />
                ) : (
                  <div className="space-y-4">
                    {performanceGoals?.goals?.map((goal) => (
                      <div key={goal.id} className="space-y-2" data-testid={`goal-${goal.id}`}>
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{goal.metric}</span>
                            {goal.status === 'completed' && (
                              <CheckCircle className="h-4 w-4 text-green-500" data-testid={`goal-complete-${goal.id}`} />
                            )}
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {goal.currentValue} / {goal.targetValue}
                          </span>
                        </div>
                        <Progress 
                          value={(goal.currentValue / goal.targetValue) * 100}
                          className={`h-2 ${goal.status === 'completed' ? 'bg-green-100' : ''}`}
                          data-testid={`progress-goal-${goal.id}`}
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Due: {format(new Date(goal.deadline), 'MMM d, yyyy')}</span>
                          {goal.reward && <span className="text-primary">Reward: {goal.reward}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* PARTS INVENTORY TAB */}
          <TabsContent value="inventory" className="space-y-6">
            {/* Inventory Summary Cards */}
            <div className="grid gap-4 md:grid-cols-4">
              <Card data-testid="card-total-inventory-value">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Inventory Value</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  {partsLoading ? (
                    <Skeleton className="h-8 w-24" />
                  ) : (
                    <>
                      <div className="text-2xl font-bold" data-testid="text-inventory-value">
                        ${partsStock?.summary?.totalValue?.toFixed(2) || '0.00'}
                      </div>
                      <p className="text-xs text-muted-foreground">Total value in stock</p>
                    </>
                  )}
                </CardContent>
              </Card>

              <Card data-testid="card-part-types">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Part Types</CardTitle>
                  <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  {partsLoading ? (
                    <Skeleton className="h-8 w-24" />
                  ) : (
                    <>
                      <div className="text-2xl font-bold" data-testid="text-part-types">
                        {partsStock?.summary?.partTypes || 0}
                      </div>
                      <p className="text-xs text-muted-foreground">Different parts in stock</p>
                    </>
                  )}
                </CardContent>
              </Card>

              <Card data-testid="card-low-stock">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Low Stock Alerts</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  {partsLoading ? (
                    <Skeleton className="h-8 w-24" />
                  ) : (
                    <>
                      <div className="text-2xl font-bold text-yellow-600" data-testid="text-low-stock">
                        {partsStock?.summary?.lowStockAlerts || 0}
                      </div>
                      <p className="text-xs text-muted-foreground">Items below threshold</p>
                    </>
                  )}
                </CardContent>
              </Card>

              <Card data-testid="card-last-updated">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Last Updated</CardTitle>
                  <RefreshCw className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  {partsLoading ? (
                    <Skeleton className="h-8 w-24" />
                  ) : (
                    <>
                      <div className="text-sm font-medium" data-testid="text-last-updated">
                        {partsStock?.summary?.lastUpdated 
                          ? format(new Date(partsStock.summary.lastUpdated), 'MMM d, h:mm a')
                          : 'Never'}
                      </div>
                      <p className="text-xs text-muted-foreground">Inventory update time</p>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Parts Stock Table */}
            <Card data-testid="card-parts-stock">
              <CardHeader>
                <CardTitle>Parts Stock</CardTitle>
                <CardDescription>Current inventory levels and values</CardDescription>
              </CardHeader>
              <CardContent>
                {partsLoading ? (
                  <Skeleton className="h-64 w-full" />
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Part Name</TableHead>
                        <TableHead>Part Number</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead className="text-right">Quantity</TableHead>
                        <TableHead className="text-right">Unit Cost</TableHead>
                        <TableHead className="text-right">Total Value</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {partsStock?.parts?.map((part) => (
                        <TableRow key={part.id} data-testid={`row-part-${part.id}`}>
                          <TableCell className="font-medium">{part.partName}</TableCell>
                          <TableCell className="font-mono text-sm">{part.partNumber}</TableCell>
                          <TableCell>{part.category}</TableCell>
                          <TableCell className="text-right">
                            {part.quantity < 5 ? (
                              <Badge className="bg-yellow-500 text-white" data-testid={`badge-low-stock-${part.id}`}>
                                {part.quantity}
                              </Badge>
                            ) : (
                              part.quantity
                            )}
                          </TableCell>
                          <TableCell className="text-right">${part.unitCost.toFixed(2)}</TableCell>
                          <TableCell className="text-right font-medium">${part.totalValue.toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Documents Tab - Existing Content */}
          <TabsContent value="documents" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Documents & Certifications</CardTitle>
                <CardDescription>Upload and manage your required documents</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {documents.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{doc.type}</p>
                          <p className="text-sm text-muted-foreground">{doc.name}</p>
                        </div>
                      </div>
                      <Badge
                        className={
                          doc.status === 'verified' ? 'bg-green-500' :
                          doc.status === 'expired' ? 'bg-red-500' :
                          'bg-yellow-500'
                        }
                      >
                        {doc.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab - Existing Content */}
          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>Configure how you receive updates</CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...notificationForm}>
                  <form onSubmit={notificationForm.handleSubmit(data => updateNotificationsMutation.mutate(data))} className="space-y-4">
                    <FormField
                      control={notificationForm.control}
                      name="emailNotifications"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between">
                          <FormLabel>Email Notifications</FormLabel>
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={notificationForm.control}
                      name="smsNotifications"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between">
                          <FormLabel>SMS Notifications</FormLabel>
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <div className="flex justify-end">
                      <Button type="submit" disabled={updateNotificationsMutation.isPending}>
                        Save Preferences
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
