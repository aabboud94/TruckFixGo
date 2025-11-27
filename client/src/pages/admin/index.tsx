import { useState, type FormEvent, type ComponentType } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import AdminLayout from "@/layouts/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import {
  TrendingUp, TrendingDown, Users, Briefcase, DollarSign, Clock,
  Activity, AlertCircle, CheckCircle, XCircle, Truck, MapPin,
  Timer, Star, Package, Building2, Loader2, PenSquare, FileText, PlusCircle, ArrowRight
} from "lucide-react";
import { format } from "date-fns";

// Helper functions for safe numeric operations
const safeNumber = (value: any, defaultValue: number = 0): number => {
  const num = Number(value);
  return isNaN(num) || value === null || value === undefined ? defaultValue : num;
};

const safePercentage = (numerator: any, denominator: any, defaultValue: number = 0): number => {
  const num = safeNumber(numerator, 0);
  const den = safeNumber(denominator, 1); // Use 1 to avoid division by zero
  if (den === 0) return defaultValue;
  const percentage = (num / den) * 100;
  return Math.min(100, Math.max(0, percentage)); // Clamp between 0 and 100
};

const formatCurrency = (value: any, defaultValue: string = '$0'): string => {
  const num = safeNumber(value, 0);
  return `$${num.toLocaleString()}`;
};

const QUICK_JOB_INITIAL_STATE = {
  customerName: "",
  customerPhone: "",
  locationAddress: "",
  serviceTypeId: "emergency-repair",
  issue: "",
  lat: "32.7767",
  lng: "-96.7970",
};

const QUICK_SERVICE_TYPES = [
  { value: "emergency-repair", label: "Emergency Repair" },
  { value: "tire-service", label: "Tire Service" },
  { value: "mobile-maintenance", label: "Mobile Maintenance" },
  { value: "inspection", label: "DOT Inspection" },
];

const JOB_STATUS_BADGES: Record<string, string> = {
  new: "bg-blue-100 text-blue-800",
  assigned: "bg-purple-100 text-purple-800",
  en_route: "bg-amber-100 text-amber-800",
  on_site: "bg-orange-100 text-orange-800",
  completed: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-rose-100 text-rose-800",
};

interface AdminMetrics {
  activeJobs?: number;
  onlineContractors?: number;
  avgResponseTime?: number;
  completionRate?: number;
  revenueToday?: number;
  revenueWeek?: number;
  revenueMonth?: number;
  totalFleets?: number;
  totalContractors?: number;
  totalUsers?: number;
}

interface RevenuePoint {
  date: string;
  revenue: number;
}

interface ServiceBreakdownEntry {
  name: string;
  value: number;
  color: string;
}

interface JobStatusEntry {
  status: string;
  count: number;
  color?: string;
}

type IconComponent = ComponentType<{ className?: string }>;

interface ActivityEntry {
  id: string | number;
  message: string;
  timestamp: Date | string;
  type?: string;
  color?: string;
  icon?: IconComponent;
}

interface SystemAlert {
  id: string | number;
  type?: string;
  message: string;
  severity: "warning" | "info" | "error";
}

interface AdminJob {
  id: string;
  jobNumber?: string;
  status?: string;
  customerName?: string;
  customerPhone?: string;
  serviceTypeId?: string;
  contractorName?: string;
  contractorPhone?: string;
  createdAt?: string;
}

export default function AdminDashboard() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [statusJobId, setStatusJobId] = useState<string | null>(null);
  const [assignJobId, setAssignJobId] = useState<string | null>(null);
  const [quickJobForm, setQuickJobForm] = useState({ ...QUICK_JOB_INITIAL_STATE });

  const { data: session, isLoading: sessionLoading } = useQuery({
    queryKey: ["/api/auth/me"],
    retry: false,
    queryFn: async () => {
      try {
        const response = await fetch("/api/auth/me", { credentials: "include" });
        if (response.status === 401) return null;
        if (!response.ok) throw new Error(`Failed to load session (${response.status})`);
        const data = await response.json();
        return data?.user || null;
      } catch (error: any) {
        if (typeof error?.message === "string" && error.message.startsWith("401")) {
          return null;
        }
        throw error;
      }
    }
  });

  const allowAdminQueries = !!session?.id && session.role === "admin";

  // Query for real-time metrics
  const { data: metrics, isLoading: metricsLoading } = useQuery<AdminMetrics>({
    queryKey: ['/api/admin/metrics'],
    enabled: allowAdminQueries,
    refetchInterval: 10000, // Refresh every 10 seconds
    queryFn: () => apiRequest('GET', '/api/admin/metrics'),
  });

  // Query for revenue data
  const { data: revenueData, isLoading: revenueLoading } = useQuery<RevenuePoint[]>({
    queryKey: ['/api/admin/revenue/weekly'],
    enabled: allowAdminQueries,
    refetchInterval: 30000,
    queryFn: () => apiRequest('GET', '/api/admin/revenue/weekly'),
  });

  // Query for service breakdown
  const { data: serviceBreakdownData, isLoading: serviceLoading } = useQuery<ServiceBreakdownEntry[]>({
    queryKey: ['/api/admin/jobs/breakdown'],
    enabled: allowAdminQueries,
    refetchInterval: 30000,
    queryFn: () => apiRequest('GET', '/api/admin/jobs/breakdown'),
  });

  // Query for job status breakdown
  const { data: jobStatusData, isLoading: jobStatusLoading } = useQuery<JobStatusEntry[]>({
    queryKey: ['/api/admin/jobs/status-breakdown'],
    enabled: allowAdminQueries,
    refetchInterval: 30000,
    queryFn: () => apiRequest('GET', '/api/admin/jobs/status-breakdown'),
  });

  const { data: recentJobs = [], isLoading: jobsLoading } = useQuery<AdminJob[]>({
    queryKey: ['/api/admin/jobs', 'recent'],
    enabled: allowAdminQueries,
    refetchInterval: 30000,
    queryFn: async () => {
      const params = new URLSearchParams({ limit: "5", sort: "createdAt:desc" });
      const response = await apiRequest('GET', `/api/admin/jobs?${params.toString()}`);
      const jobs = Array.isArray(response?.jobs)
        ? response.jobs
        : Array.isArray(response)
          ? response
          : [];
      return jobs.slice(0, 5);
    },
  });

  // Query for recent activity
  const { data: recentActivity = [] } = useQuery<ActivityEntry[]>({
    queryKey: ['/api/admin/activity'],
    enabled: allowAdminQueries,
    refetchInterval: 30000,
    queryFn: () => apiRequest('GET', '/api/admin/activity'),
  });

  const refreshRecentJobs = () => {
    queryClient.invalidateQueries({ queryKey: ['/api/admin/jobs', 'recent'] });
  };

  const isQuickJobValid =
    quickJobForm.customerName.trim().length > 1 &&
    quickJobForm.customerPhone.trim().length > 6 &&
    quickJobForm.locationAddress.trim().length > 5 &&
    quickJobForm.issue.trim().length > 3;

  const createJobMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        jobType: "emergency" as const,
        serviceTypeId: quickJobForm.serviceTypeId,
        customerName: quickJobForm.customerName.trim(),
        customerPhone: quickJobForm.customerPhone.trim(),
        description: quickJobForm.issue.trim(),
        locationAddress: quickJobForm.locationAddress.trim(),
        location: {
          lat: Number(quickJobForm.lat) || 32.7767,
          lng: Number(quickJobForm.lng) || -96.7970,
        },
        urgencyLevel: 5,
        allowBidding: false,
      };

      return apiRequest("POST", "/api/jobs", payload);
    },
    onSuccess: (job) => {
      toast({
        title: "Job created",
        description: job?.jobNumber ? `Job #${job.jobNumber} is live in the queue.` : "The job was created successfully.",
      });
      setQuickJobForm({ ...QUICK_JOB_INITIAL_STATE });
      refreshRecentJobs();
    },
    onError: (error: Error) => {
      toast({
        title: "Unable to create job",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleQuickJobChange = (field: keyof typeof QUICK_JOB_INITIAL_STATE, value: string) => {
    setQuickJobForm(prev => ({ ...prev, [field]: value }));
  };

  const handleQuickJobSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isQuickJobValid || createJobMutation.isPending) {
      return;
    }
    createJobMutation.mutate();
  };

  // Query for alerts
  const { data: alerts = [] } = useQuery<SystemAlert[]>({
    queryKey: ['/api/admin/alerts'],
    enabled: allowAdminQueries,
    refetchInterval: 30000,
  });

  if (sessionLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Checking permissions…</CardTitle>
            <CardDescription>Loading your admin session.</CardDescription>
          </CardHeader>
          <CardContent>
            <Progress value={66} aria-label="Loading admin session" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Sign in required</CardTitle>
            <CardDescription>You need to be signed in as an admin to view this dashboard.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full" onClick={() => navigate('/admin/login')} data-testid="button-go-to-login">
              Go to Admin Login
            </Button>
            <Button variant="ghost" className="w-full" onClick={() => navigate('/')}>Return home</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (session.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Access denied</CardTitle>
            <CardDescription>This dashboard is only available to administrator accounts.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full" onClick={() => navigate('/')}>Back to Home</Button>
            <Button variant="ghost" className="w-full" onClick={() => navigate('/admin/login')}>
              Switch account
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Ensure all numeric fields have safe default values - use 0 to show real data
  const stats = {
    activeJobs: safeNumber(metrics?.activeJobs, 0),
    onlineContractors: safeNumber(metrics?.onlineContractors, 0),
    avgResponseTime: safeNumber(metrics?.avgResponseTime, 0),
    completionRate: safeNumber(metrics?.completionRate, 0),
    revenueToday: safeNumber(metrics?.revenueToday, 0),
    revenueWeek: safeNumber(metrics?.revenueWeek, 0),
    revenueMonth: safeNumber(metrics?.revenueMonth, 0),
    totalFleets: safeNumber(metrics?.totalFleets, 0),
    totalContractors: safeNumber(metrics?.totalContractors, 0),
    totalUsers: safeNumber(metrics?.totalUsers, 0),
  };

  // Format revenue data for the chart
  const chartRevenueData: RevenuePoint[] = revenueData?.length ? revenueData : [
    { date: "Mon", revenue: 0 },
    { date: "Tue", revenue: 0 },
    { date: "Wed", revenue: 0 },
    { date: "Thu", revenue: 0 },
    { date: "Fri", revenue: 0 },
    { date: "Sat", revenue: 0 },
    { date: "Sun", revenue: 0 },
  ];

  // Format service breakdown data for the chart
  const chartServiceBreakdown: ServiceBreakdownEntry[] = serviceBreakdownData?.length ? serviceBreakdownData : [
    { name: "Emergency Repairs", value: 0, color: "#F97316" },
    { name: "Fleet Services", value: 0, color: "#1E3A8A" },
    { name: "Truck Wash", value: 0, color: "#059669" },
    { name: "PM Services", value: 0, color: "#F59E0B" },
  ];

  // Format job status data for the chart
  const chartJobStatusData: JobStatusEntry[] = jobStatusData?.length ? jobStatusData : [
    { status: "Completed", count: 0, color: "#059669" },
    { status: "In Progress", count: 0, color: "#F59E0B" },
    { status: "Assigned", count: 0, color: "#1E3A8A" },
    { status: "New", count: 0, color: "#9CA3AF" },
  ];

  const activities: ActivityEntry[] = recentActivity.length ? recentActivity : [
    {
      id: 1,
      type: "job_completed",
      message: "Job #JOB-2451 completed by John Smith",
      timestamp: new Date(),
      icon: CheckCircle,
      color: "text-green-600",
    },
    {
      id: 2,
      type: "contractor_online",
      message: "Mike Johnson is now online",
      timestamp: new Date(Date.now() - 5 * 60000),
      icon: Users,
      color: "text-blue-600",
    },
    {
      id: 3,
      type: "new_fleet",
      message: "New fleet account registered: ABC Transport",
      timestamp: new Date(Date.now() - 15 * 60000),
      icon: Building2,
      color: "text-purple-600",
    },
  ];

  const updateStatusMutation = useMutation({
    mutationFn: async ({ jobId, status }: { jobId: string; status: string }) => {
      await apiRequest('PUT', `/api/admin/jobs/${jobId}/status`, { status });
    },
    onSuccess: () => {
      toast({
        title: "Job updated",
        description: "Status updated successfully.",
      });
      refreshRecentJobs();
      queryClient.invalidateQueries({ queryKey: ['/api/admin/jobs/status-breakdown'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Unable to update job",
        description: error.message,
        variant: "destructive",
      });
    },
    onSettled: () => setStatusJobId(null),
  });

  const autoAssignMutation = useMutation({
    mutationFn: async (jobId: string) => {
      await apiRequest('POST', `/api/admin/jobs/${jobId}/auto-assign`, {});
    },
    onSuccess: () => {
      toast({
        title: "Assignment triggered",
        description: "Dispatch is assigning the best mechanic.",
      });
      refreshRecentJobs();
    },
    onError: (error: Error) => {
      toast({
        title: "Assignment failed",
        description: error.message,
        variant: "destructive",
      });
    },
    onSettled: () => setAssignJobId(null),
  });

  const handleStatusUpdate = (jobId: string) => {
    setStatusJobId(jobId);
    updateStatusMutation.mutate({ jobId, status: "completed" });
  };

  const handleAutoAssign = (jobId: string) => {
    setAssignJobId(jobId);
    autoAssignMutation.mutate(jobId);
  };

  const handleNavigateToJob = (jobId: string) => {
    navigate(`/job-details/${jobId}`);
  };

  const systemAlerts: SystemAlert[] = alerts.length ? alerts : [
    {
      id: 1,
      type: "warning",
      message: "High demand in Downtown area - consider surge pricing",
      severity: "warning",
    },
    {
      id: 2,
      type: "info",
      message: "3 contractors pending approval",
      severity: "info",
    },
  ];

  return (
    <AdminLayout title="Admin Dashboard">
      <div className="space-y-6 pb-10">
        {/* Key Metrics */}
        <div className="grid gap-3 md:gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
          <Card className="w-full h-full">
            <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Jobs</CardTitle>
              <Briefcase className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="space-y-1">
              <div className="text-xl md:text-2xl font-bold">{stats.activeJobs}</div>
              <div className="flex items-center gap-1 text-sm md:text-xs text-muted-foreground">
                <TrendingUp className="h-3 w-3 text-green-600" />
                <span className="text-green-600">+12%</span>
                <span className="hidden sm:inline">from yesterday</span>
              </div>
            </CardContent>
          </Card>

          <Card className="w-full h-full">
            <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Online Contractors</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="space-y-1">
              <div className="text-xl md:text-2xl font-bold">{stats.onlineContractors}</div>
              <div className="text-sm md:text-xs text-muted-foreground">
                Out of {stats.totalContractors} total
              </div>
              <Progress value={safePercentage(stats.onlineContractors, stats.totalContractors, 0)} className="mt-2" />
            </CardContent>
          </Card>

          <Card className="w-full h-full">
            <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="space-y-1">
              <div className="text-2xl font-bold">{stats.avgResponseTime} min</div>
              <div className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
                <TrendingDown className="h-3 w-3 text-green-600" />
                <span className="text-green-600">-2 min</span>
                <span>from last week</span>
              </div>
            </CardContent>
          </Card>

          <Card className="w-full h-full">
            <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-2xl font-bold">{stats.completionRate}%</div>
              <Progress value={Math.min(100, Math.max(0, stats.completionRate))} className="mt-1" />
            </CardContent>
          </Card>
        </div>

        {/* Revenue Cards */}
        <div className="grid gap-3 md:gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
          <Card className="w-full border-green-200 bg-green-50/50 dark:bg-green-950/20 h-full">
            <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Revenue Today</CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(stats.revenueToday)}
              </div>
              <div className="text-xs text-muted-foreground">Target: $30,000</div>
              <Progress value={safePercentage(stats.revenueToday, 30000, 0)} className="mt-1" />
            </CardContent>
          </Card>

          <Card className="w-full border-blue-200 bg-blue-50/50 dark:bg-blue-950/20 h-full">
            <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Revenue This Week</CardTitle>
              <DollarSign className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-2xl font-bold text-blue-600">
                {formatCurrency(stats.revenueWeek)}
              </div>
              <div className="text-xs text-muted-foreground">Target: $175,000</div>
              <Progress value={safePercentage(stats.revenueWeek, 175000, 0)} className="mt-1" />
            </CardContent>
          </Card>

          <Card className="w-full border-purple-200 bg-purple-50/50 dark:bg-purple-950/20 h-full">
            <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Revenue This Month</CardTitle>
              <DollarSign className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-2xl font-bold text-purple-600">
                {formatCurrency(stats.revenueMonth)}
              </div>
              <div className="text-xs text-muted-foreground">Target: $700,000</div>
              <Progress value={safePercentage(stats.revenueMonth, 700000, 0)} className="mt-1" />
            </CardContent>
          </Card>
        </div>

        {/* Rapid Command Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Rapid Dispatch Console</CardTitle>
            <CardDescription>Create an emergency job or jump to critical admin views.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr),minmax(0,1fr)]">
              <form className="space-y-4" onSubmit={handleQuickJobSubmit}>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="quick-name">Contact name</Label>
                    <Input
                      id="quick-name"
                      value={quickJobForm.customerName}
                      onChange={(event) => handleQuickJobChange("customerName", event.target.value)}
                      placeholder="Dispatcher / driver"
                      autoComplete="name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="quick-phone">Phone</Label>
                    <Input
                      id="quick-phone"
                      value={quickJobForm.customerPhone}
                      onChange={(event) => handleQuickJobChange("customerPhone", event.target.value)}
                      placeholder="(555) 123-4567"
                      autoComplete="tel"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="quick-location">Location / Mile marker</Label>
                  <Textarea
                    id="quick-location"
                    value={quickJobForm.locationAddress}
                    onChange={(event) => handleQuickJobChange("locationAddress", event.target.value)}
                    placeholder="I-35E southbound MM 269 near Denton, TX"
                    rows={2}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Service type</Label>
                    <Select
                      value={quickJobForm.serviceTypeId}
                      onValueChange={(value) => handleQuickJobChange("serviceTypeId", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select service" />
                      </SelectTrigger>
                      <SelectContent>
                        {QUICK_SERVICE_TYPES.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="quick-lat" className="text-xs text-muted-foreground">Latitude</Label>
                      <Input
                        id="quick-lat"
                        value={quickJobForm.lat}
                        onChange={(event) => handleQuickJobChange("lat", event.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="quick-lng" className="text-xs text-muted-foreground">Longitude</Label>
                      <Input
                        id="quick-lng"
                        value={quickJobForm.lng}
                        onChange={(event) => handleQuickJobChange("lng", event.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="quick-issue">Issue summary</Label>
                  <Textarea
                    id="quick-issue"
                    value={quickJobForm.issue}
                    onChange={(event) => handleQuickJobChange("issue", event.target.value)}
                    placeholder="Blown steer tire, tractor disabled on the shoulder"
                    rows={2}
                  />
                </div>

                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs text-muted-foreground">
                    Jobs are created as <span className="font-semibold">emergency</span> and immediately sent to dispatch.
                  </p>
                  <Button
                    type="submit"
                    disabled={!isQuickJobValid || createJobMutation.isPending}
                    className="gap-2"
                    data-testid="button-quick-create-job"
                  >
                    {createJobMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Dispatching…
                      </>
                    ) : (
                      <>
                        <PlusCircle className="h-4 w-4" />
                        Create emergency job
                      </>
                    )}
                  </Button>
                </div>
                {createJobMutation.error && (
                  <p className="text-sm text-destructive">
                    {(createJobMutation.error as Error).message}
                  </p>
                )}
              </form>

              <div className="space-y-3 rounded-xl border bg-muted/40 p-4">
                <p className="text-sm font-semibold text-muted-foreground">One-click shortcuts</p>
                <div className="flex flex-col gap-2">
                  <Button
                    variant="outline"
                    className="justify-between"
                    onClick={() => navigate("/admin/jobs")}
                  >
                    <span className="flex items-center gap-2">
                      <PenSquare className="h-4 w-4" />
                      Job board
                    </span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    className="justify-between"
                    onClick={() => navigate("/admin/invoices")}
                  >
                    <span className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Invoice center
                    </span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    className="justify-between"
                    onClick={() => navigate("/admin/job-monitor")}
                  >
                    <span className="flex items-center gap-2">
                      <Activity className="h-4 w-4" />
                      Live job monitor
                    </span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Charts and Activity */}
        <div className="grid gap-3 md:gap-6 grid-cols-1 lg:grid-cols-3">
          {/* Revenue Chart */}
          <Card className="w-full lg:col-span-2 h-full">
            <CardHeader>
              <CardTitle>Revenue Trend</CardTitle>
              <CardDescription>Daily revenue for the past week</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-hidden rounded-md border bg-background">
                <ResponsiveContainer width="100%" height={288} className="h-56 md:h-72">
                  <AreaChart data={chartRevenueData}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#1E3A8A" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#1E3A8A" stopOpacity={0.1} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="#1E3A8A"
                      fillOpacity={1}
                      fill="url(#colorRevenue)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="w-full h-full">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Live platform activity feed</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-64 sm:h-72">
                <div className="space-y-4">
                  {activities.map((activity) => {
                    const ActivityIcon = activity.icon ?? CheckCircle;
                    return (
                    <div key={activity.id} className="flex flex-col sm:flex-row sm:items-start gap-3">
                      <div className={`p-2 rounded-full bg-muted ${activity.color}`}>
                        <ActivityIcon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm leading-5 break-words">{activity.message}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(activity.timestamp, "h:mm a")}
                        </p>
                      </div>
                    </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Service Breakdown and Job Status */}
        <div className="grid gap-3 md:gap-6 grid-cols-1 lg:grid-cols-2">
          {/* Service Type Breakdown */}
          <Card className="w-full h-full">
            <CardHeader>
              <CardTitle>Service Type Breakdown</CardTitle>
              <CardDescription>Distribution of jobs by service type</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="overflow-hidden rounded-md border bg-background">
                <ResponsiveContainer width="100%" height={224} className="h-56">
                  <PieChart>
                    <Pie
                      data={chartServiceBreakdown}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {chartServiceBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2">
                {chartServiceBreakdown.map((service) => (
                  <div key={service.name} className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: service.color }}
                      />
                      <span className="text-sm truncate">{service.name}</span>
                    </div>
                    <span className="text-sm font-medium">{service.value}%</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Job Status Distribution */}
          <Card className="w-full h-full">
            <CardHeader>
              <CardTitle>Job Status Distribution</CardTitle>
              <CardDescription>Current status of all jobs</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-hidden rounded-md border bg-background">
                <ResponsiveContainer width="100%" height={224} className="h-56">
                  <BarChart data={chartJobStatusData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="status" interval={0} angle={-15} textAnchor="end" height={48} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#1E3A8A" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* System Alerts */}
        {systemAlerts.length > 0 && (
          <Card className="w-full">
            <CardHeader>
              <CardTitle>System Alerts</CardTitle>
              <CardDescription>Important notifications requiring attention</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {systemAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-lg ${
                      alert.severity === "warning"
                        ? "bg-orange-50 dark:bg-orange-950/20 border border-orange-200"
                        : "bg-blue-50 dark:bg-blue-950/20 border border-blue-200"
                    }`}
                  >
                    <div className="flex items-center gap-3 sm:gap-2">
                      <AlertCircle
                        className={`h-5 w-5 ${
                          alert.severity === "warning" ? "text-orange-600" : "text-blue-600"
                        }`}
                      />
                      <p className="text-sm flex-1 leading-5">{alert.message}</p>
                    </div>
                    <div className="flex w-full sm:w-auto justify-end">
                      <Button size="sm" variant="outline" className="w-full sm:w-auto">
                        View
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Jobs with inline actions */}
        {recentJobs.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Recent Jobs</CardTitle>
              <CardDescription>Last {recentJobs.length} jobs created via any channel</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="table-scroll">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Job</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentJobs.map((job: any) => (
                      <TableRow key={job.id}>
                        <TableCell>
                          <p className="font-mono text-sm">{job.jobNumber || job.id?.slice(0, 8)}</p>
                          <p className="text-xs text-muted-foreground">{job.jobType || "—"}</p>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-semibold">{job.customerName || job.customer?.name || "Guest"}</span>
                            {job.customerPhone && (
                              <span className="text-xs text-muted-foreground">{job.customerPhone}</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">{job.locationAddress || "—"}</TableCell>
                        <TableCell>
                          <Badge className={JOB_STATUS_BADGES[job.status] || "bg-slate-100 text-slate-700"}>
                            {job.status ? job.status.replace(/_/g, " ") : "Unknown"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleNavigateToJob(job.id)}
                              data-testid={`button-view-${job.id}`}
                            >
                              Details
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleAutoAssign(job.id)}
                              disabled={assignJobId === job.id && autoAssignMutation.isPending}
                            >
                              {assignJobId === job.id && autoAssignMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                "Auto assign"
                              )}
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleStatusUpdate(job.id)}
                              disabled={statusJobId === job.id && updateStatusMutation.isPending}
                            >
                              {statusJobId === job.id && updateStatusMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                "Mark done"
                              )}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}
