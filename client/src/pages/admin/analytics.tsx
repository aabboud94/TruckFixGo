import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import AdminLayout from "@/layouts/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { format, subDays, subMonths, subYears } from "date-fns";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  RadialBarChart, RadialBar, ComposedChart, Scatter, ScatterChart
} from "recharts";
import {
  TrendingUp, TrendingDown, Download, Calendar, DollarSign,
  Users, Briefcase, MapPin, Activity, Award, Truck, Filter,
  FileDown, RefreshCw, BarChart3, PieChartIcon, Loader2,
  Clock, AlertCircle, CheckCircle, XCircle, Timer, Star,
  Package, Building2, Map, Target, Zap, Shield, ArrowUp,
  ArrowDown, Eye, Settings, ChevronRight, Info, Gauge
} from "lucide-react";

// Color palette
const COLORS = {
  primary: "#1E3A8A",
  secondary: "#F97316",
  success: "#059669",
  warning: "#F59E0B",
  danger: "#DC2626",
  info: "#3B82F6",
  purple: "#8B5CF6",
  pink: "#EC4899",
  gray: "#6B7280"
};

// Chart colors
const chartColors = Object.values(COLORS);

// Custom Gauge Chart Component
function GaugeChart({ value, title, subtitle, target = 100 }: { value: number; title: string; subtitle?: string; target?: number }) {
  const data = [{ value, fill: value >= target * 0.9 ? COLORS.success : value >= target * 0.7 ? COLORS.warning : COLORS.danger }];
  const circleData = [{ value: target, fill: "#E5E7EB" }];

  return (
    <div className="text-center">
      <ResponsiveContainer width="100%" height={140}>
        <RadialBarChart cx="50%" cy="50%" innerRadius="60%" outerRadius="90%" startAngle={180} endAngle={0} data={data}>
          <RadialBar dataKey="value" cornerRadius={10} fill={data[0].fill} />
          <text x="50%" y="45%" textAnchor="middle" dominantBaseline="middle" className="text-2xl font-bold">
            {value}%
          </text>
        </RadialBarChart>
      </ResponsiveContainer>
      <p className="text-sm font-medium">{title}</p>
      {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
    </div>
  );
}

export default function AdminAnalytics() {
  const { toast } = useToast();
  const [dateRange, setDateRange] = useState("month");
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedMetric, setSelectedMetric] = useState("revenue");

  // Calculate date range
  const getDateRange = () => {
    const endDate = new Date();
    let startDate = new Date();
    
    switch (dateRange) {
      case "today":
        startDate.setHours(0, 0, 0, 0);
        break;
      case "week":
        startDate = subDays(endDate, 7);
        break;
      case "month":
        startDate = subMonths(endDate, 1);
        break;
      case "quarter":
        startDate = subMonths(endDate, 3);
        break;
      case "year":
        startDate = subYears(endDate, 1);
        break;
    }
    
    return { startDate, endDate };
  };

  // Main analytics query
  const { data: analytics, isLoading, refetch } = useQuery({
    queryKey: ['/api/admin/analytics', { range: dateRange }],
    refetchInterval: 60000, // Refresh every minute
  });

  // Export function
  const handleExport = async (format: 'pdf' | 'csv') => {
    try {
      const response = await apiRequest('/api/admin/analytics/export', {
        method: 'POST',
        body: JSON.stringify({ format, range: dateRange }),
      });
      
      toast({
        title: "Export successful",
        description: `Analytics report exported as ${format.toUpperCase()}`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Export failed",
        description: "Failed to export analytics report",
      });
    }
  };

  // Mock data for comprehensive analytics
  const mockData = {
    // Platform Overview
    platformMetrics: {
      activeJobs: 47,
      onlineContractors: 112,
      avgResponseTime: 11.5,
      completionRate: 94.8,
      totalRevenue: 847250,
      totalFleets: 156,
      totalUsers: 8421,
      platformUptime: 99.9,
    },
    
    // SLA Metrics
    slaMetrics: {
      overallCompliance: 92.5,
      avgResponseTime: 11.5,
      breachedCount: 23,
      byServiceType: [
        { service: "Emergency Repair", compliance: 89, avgTime: 9 },
        { service: "Fleet PM", compliance: 96, avgTime: 24 },
        { service: "Truck Wash", compliance: 98, avgTime: 45 },
        { service: "Tire Service", compliance: 91, avgTime: 12 },
      ],
      trends: Array.from({ length: 30 }, (_, i) => ({
        date: format(subDays(new Date(), 30 - i), "MMM dd"),
        compliance: 88 + Math.random() * 12,
        responseTime: 10 + Math.random() * 5,
      })),
    },
    
    // Response Time Analytics
    responseTimeMetrics: {
      acceptance: { actual: 3.2, target: 5, variance: -36 },
      travel: { actual: 15.8, target: 20, variance: -21 },
      service: { actual: 42.5, target: 45, variance: -5.6 },
      total: { actual: 61.5, target: 70, variance: -12.1 },
      hourlyPattern: Array.from({ length: 24 }, (_, hour) => ({
        hour: `${hour}:00`,
        avgTime: 10 + Math.sin(hour / 3) * 5 + Math.random() * 3,
        jobs: Math.floor(5 + Math.sin(hour / 2) * 3 + Math.random() * 2),
      })),
    },
    
    // Contractor Performance
    contractorMetrics: {
      topPerformers: [
        { name: "Mike Johnson", jobs: 342, earnings: 45600, rating: 4.8, acceptance: 92, onTime: 96, tier: "Gold" },
        { name: "Sarah Williams", jobs: 285, earnings: 38500, rating: 4.7, acceptance: 88, onTime: 94, tier: "Gold" },
        { name: "John Davis", jobs: 245, earnings: 32100, rating: 4.9, acceptance: 95, onTime: 97, tier: "Silver" },
        { name: "Lisa Anderson", jobs: 212, earnings: 28400, rating: 4.6, acceptance: 85, onTime: 91, tier: "Silver" },
        { name: "Tom Wilson", jobs: 198, earnings: 26300, rating: 4.5, acceptance: 82, onTime: 89, tier: "Bronze" },
      ],
      tierDistribution: [
        { tier: "Gold", count: 28, percentage: 15 },
        { tier: "Silver", count: 65, percentage: 35 },
        { tier: "Bronze", count: 93, percentage: 50 },
      ],
      performanceTrends: Array.from({ length: 12 }, (_, i) => ({
        month: format(subMonths(new Date(), 11 - i), "MMM"),
        avgRating: 4.3 + Math.random() * 0.4,
        avgJobs: 15 + Math.random() * 10,
        avgEarnings: 3000 + Math.random() * 2000,
      })),
    },
    
    // Revenue Analytics
    revenueMetrics: {
      total: 847250,
      growth: 12.5,
      byService: [
        { name: "Emergency Repair", value: 380260, percentage: 45 },
        { name: "Fleet Services", value: 254175, percentage: 30 },
        { name: "Truck Wash", value: 127087, percentage: 15 },
        { name: "PM Services", value: 85728, percentage: 10 },
      ],
      emergencyVsScheduled: { emergency: 507450, scheduled: 339800 },
      paymentMethods: [
        { method: "Credit Card", amount: 423625, percentage: 50 },
        { method: "Fleet Account", amount: 254175, percentage: 30 },
        { method: "EFS Check", amount: 84725, percentage: 10 },
        { method: "Comdata", amount: 84725, percentage: 10 },
      ],
      dailyRevenue: Array.from({ length: 30 }, (_, i) => ({
        date: format(subDays(new Date(), 30 - i), "MMM dd"),
        revenue: 20000 + Math.random() * 15000,
        jobs: 30 + Math.floor(Math.random() * 20),
      })),
      platformFees: 42362,
      outstanding: 23450,
      surgeRevenue: 15670,
    },
    
    // Fleet Analytics
    fleetMetrics: {
      activeFleets: 132,
      totalVehicles: 3456,
      avgVehiclesPerFleet: 26,
      topFleets: [
        { name: "ABC Transport", vehicles: 125, jobs: 456, spent: 67800, pmCompliance: 92, tier: "Platinum" },
        { name: "XYZ Logistics", vehicles: 98, jobs: 389, spent: 54200, pmCompliance: 88, tier: "Gold" },
        { name: "Quick Fleet", vehicles: 76, jobs: 312, spent: 43100, pmCompliance: 85, tier: "Gold" },
        { name: "Reliable Hauling", vehicles: 65, jobs: 278, spent: 38900, pmCompliance: 91, tier: "Silver" },
      ],
      pmCompliance: 87.5,
      breakdownRate: 3.2,
      costPerMile: 1.85,
      savings: 125600,
      tierDistribution: [
        { tier: "Platinum", count: 12, revenue: 234500 },
        { tier: "Gold", count: 34, revenue: 187600 },
        { tier: "Silver", count: 56, revenue: 142300 },
        { tier: "Standard", count: 30, revenue: 89400 },
      ],
    },
    
    // Geographic Analytics
    geographicMetrics: {
      regions: [
        { region: "Miami", jobs: 892, revenue: 145200, contractors: 28, avgResponse: 10 },
        { region: "Orlando", jobs: 756, revenue: 123400, contractors: 22, avgResponse: 12 },
        { region: "Tampa", jobs: 623, revenue: 98700, contractors: 18, avgResponse: 11 },
        { region: "Jacksonville", jobs: 534, revenue: 87600, contractors: 15, avgResponse: 14 },
        { region: "Fort Lauderdale", jobs: 451, revenue: 73500, contractors: 12, avgResponse: 9 },
      ],
      heatmapData: Array.from({ length: 50 }, () => ({
        lat: 25.7617 + (Math.random() - 0.5) * 2,
        lng: -80.1918 + (Math.random() - 0.5) * 2,
        intensity: Math.random(),
      })),
      coverageGaps: [
        { area: "Homestead", demand: 45, coverage: 12, gap: 33 },
        { area: "Key Largo", demand: 28, coverage: 5, gap: 23 },
        { area: "Belle Glade", demand: 31, coverage: 8, gap: 23 },
      ],
      avgTravelDistance: 18.5,
    },
    
    // Job Analytics
    jobMetrics: {
      total: 3456,
      byStatus: { 
        completed: 3215, 
        inProgress: 115, 
        assigned: 78, 
        new: 48 
      },
      completionRate: 93.1,
      cancellationRate: 3.2,
      cancellationReasons: {
        "Customer cancelled": 45,
        "Contractor unavailable": 23,
        "Weather": 18,
        "Vehicle fixed": 12,
        "Other": 13,
      },
      typeDistribution: [
        { type: "Tire Service", count: 1382, percentage: 40 },
        { type: "Engine Repair", count: 864, percentage: 25 },
        { type: "Electrical", count: 518, percentage: 15 },
        { type: "PM Service", count: 345, percentage: 10 },
        { type: "Other", count: 347, percentage: 10 },
      ],
      peakHours: Array.from({ length: 24 }, (_, hour) => ({
        hour,
        jobs: Math.floor(50 + 100 * Math.sin((hour - 6) * Math.PI / 12) + Math.random() * 20),
      })),
      repeatRate: 68.5,
      avgDuration: 52.3,
    },
    
    // Customer Analytics
    customerMetrics: {
      total: 8421,
      new: 342,
      acquisitionTrend: Array.from({ length: 12 }, (_, i) => ({
        month: format(subMonths(new Date(), 11 - i), "MMM"),
        new: 200 + Math.floor(Math.random() * 150),
        total: 7000 + i * 120 + Math.floor(Math.random() * 50),
      })),
      lifetimeValue: 2847,
      retentionRate: 82.3,
      guestVsRegistered: { guest: 2105, registered: 6316 },
      satisfactionScore: 4.6,
      nps: 68,
      referrals: 456,
      referralConversion: 34.5,
      churnRate: 5.2,
      topCustomers: [
        { name: "Fleet Corp", jobs: 234, spent: 45600 },
        { name: "Logistics Inc", jobs: 189, spent: 38900 },
        { name: "Transport Co", jobs: 167, spent: 32100 },
      ],
    },
    
    // Operational Efficiency
    efficiency: {
      contractorUtilization: 78.5,
      avgIdleTime: 2.3,
      routeSavings: 23450,
      batchingRate: 34.5,
      platformUptime: 99.92,
      apiResponseTime: 145,
      errorRate: 0.3,
      systemHealth: {
        database: true,
        api: true,
        websocket: true,
        payments: true,
      },
      performanceTrends: Array.from({ length: 7 }, (_, i) => ({
        day: format(subDays(new Date(), 6 - i), "EEE"),
        utilization: 70 + Math.random() * 20,
        efficiency: 80 + Math.random() * 15,
      })),
    },
    
    // Predictive Analytics
    predictions: {
      demandForecast: Array.from({ length: 7 }, (_, i) => ({
        date: format(new Date(Date.now() + i * 86400000), "MMM dd"),
        predicted: 120 + Math.floor(Math.random() * 40),
        confidence: 85 + Math.random() * 10,
      })),
      contractorNeeds: Array.from({ length: 24 }, (_, hour) => ({
        hour,
        predicted: Math.floor(15 + 10 * Math.sin((hour - 6) * Math.PI / 12)),
        needed: Math.floor(18 + 12 * Math.sin((hour - 6) * Math.PI / 12)),
      })),
      revenueProjection: Array.from({ length: 6 }, (_, i) => ({
        month: format(new Date(Date.now() + i * 30 * 86400000), "MMM"),
        projected: 850000 + Math.floor(Math.random() * 100000),
        confidence: 80 + Math.random() * 15,
      })),
      growthRate: { current: 12.5, projected: 15.8, target: 20 },
      seasonalImpact: [
        { period: "Summer", trend: "High", impact: 25 },
        { period: "Hurricane Season", trend: "Peak", impact: 40 },
        { period: "Winter", trend: "Low", impact: -15 },
        { period: "Spring", trend: "Normal", impact: 0 },
      ],
    },
  };

  const analyticsData = analytics || mockData;

  return (
    <AdminLayout 
      title="Analytics Dashboard"
      breadcrumbs={[{ label: "Analytics" }]}
    >
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="flex flex-wrap items-center gap-2">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[180px]" data-testid="select-date-range">
              <Calendar className="mr-2 h-4 w-4" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">Last 7 Days</SelectItem>
              <SelectItem value="month">Last 30 Days</SelectItem>
              <SelectItem value="quarter">Last Quarter</SelectItem>
              <SelectItem value="year">Last Year</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            variant="outline" 
            onClick={() => refetch()}
            disabled={isLoading}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => handleExport('csv')}
            data-testid="button-export-csv"
          >
            <FileDown className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          <Button
            variant="outline"
            onClick={() => handleExport('pdf')}
            data-testid="button-export-pdf"
          >
            <FileDown className="mr-2 h-4 w-4" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Main Analytics Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-6 gap-2">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="sla">SLA & Response</TabsTrigger>
          <TabsTrigger value="contractors">Contractors</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="fleets">Fleet Analytics</TabsTrigger>
          <TabsTrigger value="operations">Operations</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Jobs</CardTitle>
                <Briefcase className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analyticsData.platformMetrics.activeJobs}</div>
                <div className="flex items-center text-xs text-muted-foreground">
                  <TrendingUp className="mr-1 h-3 w-3 text-green-600" />
                  <span className="text-green-600">+8%</span> from yesterday
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Online Contractors</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analyticsData.platformMetrics.onlineContractors}</div>
                <Progress value={75} className="mt-2" />
                <p className="text-xs text-muted-foreground mt-1">75% availability</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analyticsData.platformMetrics.avgResponseTime} min</div>
                <div className="flex items-center text-xs text-muted-foreground">
                  <TrendingDown className="mr-1 h-3 w-3 text-green-600" />
                  <span className="text-green-600">-2 min</span> from last week
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Platform Uptime</CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analyticsData.platformMetrics.platformUptime}%</div>
                <Badge variant="outline" className="mt-2">
                  <CheckCircle className="mr-1 h-3 w-3 text-green-600" />
                  All Systems Operational
                </Badge>
              </CardContent>
            </Card>
          </div>

          {/* Charts Grid */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Revenue Trend */}
            <Card>
              <CardHeader>
                <CardTitle>Revenue Trend</CardTitle>
                <CardDescription>Daily revenue over the selected period</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={analyticsData.revenueMetrics.dailyRevenue}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.8}/>
                        <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                    <Area type="monotone" dataKey="revenue" stroke={COLORS.primary} fillOpacity={1} fill="url(#colorRevenue)" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Job Status Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Job Status Distribution</CardTitle>
                <CardDescription>Current status of all jobs</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: "Completed", value: analyticsData.jobMetrics.byStatus.completed, fill: COLORS.success },
                        { name: "In Progress", value: analyticsData.jobMetrics.byStatus.inProgress, fill: COLORS.warning },
                        { name: "Assigned", value: analyticsData.jobMetrics.byStatus.assigned, fill: COLORS.info },
                        { name: "New", value: analyticsData.jobMetrics.byStatus.new, fill: COLORS.gray },
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Geographic Performance */}
            <Card>
              <CardHeader>
                <CardTitle>Geographic Performance</CardTitle>
                <CardDescription>Jobs and revenue by region</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <ComposedChart data={analyticsData.geographicMetrics.regions}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="region" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Bar yAxisId="left" dataKey="jobs" fill={COLORS.primary} />
                    <Line yAxisId="right" type="monotone" dataKey="avgResponse" stroke={COLORS.secondary} />
                  </ComposedChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Peak Hours Analysis */}
            <Card>
              <CardHeader>
                <CardTitle>Peak Demand Hours</CardTitle>
                <CardDescription>Job volume by hour of day</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={analyticsData.jobMetrics.peakHours}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hour" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="jobs" stroke={COLORS.secondary} fill={COLORS.secondary} fillOpacity={0.6} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* SLA & Response Time Tab */}
        <TabsContent value="sla" className="space-y-6">
          {/* SLA Compliance Gauges */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardContent className="pt-6">
                <GaugeChart 
                  value={analyticsData.slaMetrics.overallCompliance} 
                  title="Overall SLA Compliance"
                  subtitle="Target: 95%"
                  target={95}
                />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <GaugeChart 
                  value={89} 
                  title="Emergency Response"
                  subtitle="Target: 90%"
                  target={90}
                />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <GaugeChart 
                  value={96} 
                  title="Fleet Services"
                  subtitle="Target: 95%"
                  target={95}
                />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <GaugeChart 
                  value={98} 
                  title="Scheduled Services"
                  subtitle="Target: 98%"
                  target={98}
                />
              </CardContent>
            </Card>
          </div>

          {/* Response Time Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Response Time Breakdown</CardTitle>
              <CardDescription>Average time for each phase of service delivery</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(analyticsData.responseTimeMetrics).slice(0, 4).map(([key, data]: [string, any]) => (
                  <div key={key}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium capitalize">{key} Time</span>
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-muted-foreground">
                          Target: {data.target} min
                        </span>
                        <span className="text-sm font-medium">
                          Actual: {data.actual} min
                        </span>
                        <Badge variant={data.variance < 0 ? "default" : "destructive"}>
                          {data.variance > 0 ? '+' : ''}{data.variance}%
                        </Badge>
                      </div>
                    </div>
                    <Progress value={(data.actual / data.target) * 100} className="h-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* SLA Trends & Hourly Patterns */}
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>SLA Compliance Trends</CardTitle>
                <CardDescription>Compliance rate and response time over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <ComposedChart data={analyticsData.slaMetrics.trends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Line yAxisId="left" type="monotone" dataKey="compliance" stroke={COLORS.success} name="Compliance %" />
                    <Bar yAxisId="right" dataKey="responseTime" fill={COLORS.info} name="Response Time (min)" />
                  </ComposedChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Response Time by Hour</CardTitle>
                <CardDescription>Average response time throughout the day</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={analyticsData.responseTimeMetrics.hourlyPattern}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hour" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="avgTime" stroke={COLORS.primary} name="Avg Time (min)" />
                    <Line type="monotone" dataKey="jobs" stroke={COLORS.secondary} name="Job Count" yAxisId="right" />
                    <YAxis yAxisId="right" orientation="right" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* SLA by Service Type */}
          <Card>
            <CardHeader>
              <CardTitle>SLA Performance by Service Type</CardTitle>
              <CardDescription>Compliance rates and average response times</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Service Type</TableHead>
                    <TableHead>Compliance Rate</TableHead>
                    <TableHead>Avg Response Time</TableHead>
                    <TableHead>Target Time</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {analyticsData.slaMetrics.byServiceType.map((service) => (
                    <TableRow key={service.service}>
                      <TableCell className="font-medium">{service.service}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={service.compliance} className="w-20" />
                          <span>{service.compliance}%</span>
                        </div>
                      </TableCell>
                      <TableCell>{service.avgTime} min</TableCell>
                      <TableCell>15 min</TableCell>
                      <TableCell>
                        <Badge variant={service.compliance >= 90 ? "default" : "destructive"}>
                          {service.compliance >= 90 ? "Meeting SLA" : "Below SLA"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Contractors Tab */}
        <TabsContent value="contractors" className="space-y-6">
          {/* Contractor Performance Metrics */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle>Tier Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={analyticsData.contractorMetrics.tierDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={70}
                      paddingAngle={5}
                      dataKey="count"
                    >
                      {analyticsData.contractorMetrics.tierDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={[COLORS.warning, COLORS.gray, COLORS.info][index]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2">
                  {analyticsData.contractorMetrics.tierDistribution.map((tier, index) => (
                    <div key={tier.tier} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full`} 
                          style={{ backgroundColor: [COLORS.warning, COLORS.gray, COLORS.info][index] }} />
                        <span className="text-sm">{tier.tier}</span>
                      </div>
                      <span className="text-sm font-medium">{tier.count} ({tier.percentage}%)</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle>Performance Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={analyticsData.contractorMetrics.performanceTrends.slice(-6)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="avgRating" stroke={COLORS.success} strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle>Key Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Avg Acceptance Rate</span>
                  <span className="font-medium">88.5%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">On-Time Arrival</span>
                  <span className="font-medium">93.2%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Avg Rating</span>
                  <span className="font-medium">4.6/5.0</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Utilization Rate</span>
                  <span className="font-medium">78.5%</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Top Performers Leaderboard */}
          <Card>
            <CardHeader>
              <CardTitle>Top Performers Leaderboard</CardTitle>
              <CardDescription>Contractors ranked by performance metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">Rank</TableHead>
                    <TableHead>Contractor</TableHead>
                    <TableHead>Tier</TableHead>
                    <TableHead className="text-right">Jobs</TableHead>
                    <TableHead className="text-right">Earnings</TableHead>
                    <TableHead className="text-right">Rating</TableHead>
                    <TableHead className="text-right">Acceptance</TableHead>
                    <TableHead className="text-right">On-Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {analyticsData.contractorMetrics.topPerformers.map((contractor, index) => (
                    <TableRow key={contractor.name}>
                      <TableCell>
                        <div className="flex items-center justify-center">
                          {index === 0 && <Award className="h-4 w-4 text-yellow-500" />}
                          {index === 1 && <Award className="h-4 w-4 text-gray-400" />}
                          {index === 2 && <Award className="h-4 w-4 text-orange-600" />}
                          {index > 2 && <span className="text-sm text-muted-foreground">{index + 1}</span>}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{contractor.name}</TableCell>
                      <TableCell>
                        <Badge variant={contractor.tier === "Gold" ? "default" : contractor.tier === "Silver" ? "secondary" : "outline"}>
                          {contractor.tier}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">{contractor.jobs}</TableCell>
                      <TableCell className="text-right">${contractor.earnings.toLocaleString()}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          <span>{contractor.rating}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">{contractor.acceptance}%</TableCell>
                      <TableCell className="text-right">
                        <Badge variant={contractor.onTime >= 95 ? "default" : "outline"}>
                          {contractor.onTime}%
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Revenue Tab */}
        <TabsContent value="revenue" className="space-y-6">
          {/* Revenue Overview Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${analyticsData.revenueMetrics.total.toLocaleString()}</div>
                <div className="flex items-center text-xs text-muted-foreground">
                  <TrendingUp className="mr-1 h-3 w-3 text-green-600" />
                  <span className="text-green-600">+{analyticsData.revenueMetrics.growth}%</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Platform Fees</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${analyticsData.revenueMetrics.platformFees.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">5% of total revenue</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Outstanding</CardTitle>
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${analyticsData.revenueMetrics.outstanding.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">23 unpaid invoices</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Surge Revenue</CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${analyticsData.revenueMetrics.surgeRevenue.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">Peak pricing impact</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Revenue by Service Type */}
            <Card>
              <CardHeader>
                <CardTitle>Revenue by Service Type</CardTitle>
                <CardDescription>Distribution of revenue across services</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={analyticsData.revenueMetrics.byService}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      dataKey="value"
                      label={({ name, percentage }) => `${name}: ${percentage}%`}
                    >
                      {analyticsData.revenueMetrics.byService.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Payment Method Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Payment Methods</CardTitle>
                <CardDescription>Revenue by payment type</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analyticsData.revenueMetrics.paymentMethods}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="method" />
                    <YAxis />
                    <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                    <Bar dataKey="amount" fill={COLORS.primary} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Emergency vs Scheduled */}
            <Card>
              <CardHeader>
                <CardTitle>Service Type Split</CardTitle>
                <CardDescription>Emergency vs Scheduled revenue</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Emergency Services</span>
                      <span className="text-sm font-medium">
                        ${analyticsData.revenueMetrics.emergencyVsScheduled.emergency.toLocaleString()}
                      </span>
                    </div>
                    <Progress value={60} className="h-2" />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Scheduled Services</span>
                      <span className="text-sm font-medium">
                        ${analyticsData.revenueMetrics.emergencyVsScheduled.scheduled.toLocaleString()}
                      </span>
                    </div>
                    <Progress value={40} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Revenue Trend */}
            <Card>
              <CardHeader>
                <CardTitle>Revenue Trend</CardTitle>
                <CardDescription>Daily revenue and job count</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <ComposedChart data={analyticsData.revenueMetrics.dailyRevenue}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Bar yAxisId="left" dataKey="revenue" fill={COLORS.primary} />
                    <Line yAxisId="right" type="monotone" dataKey="jobs" stroke={COLORS.secondary} />
                  </ComposedChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Fleet Analytics Tab */}
        <TabsContent value="fleets" className="space-y-6">
          {/* Fleet Overview */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Fleets</CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analyticsData.fleetMetrics.activeFleets}</div>
                <p className="text-xs text-muted-foreground">
                  {analyticsData.fleetMetrics.totalVehicles} total vehicles
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">PM Compliance</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analyticsData.fleetMetrics.pmCompliance}%</div>
                <Progress value={analyticsData.fleetMetrics.pmCompliance} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Cost per Mile</CardTitle>
                <Truck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${analyticsData.fleetMetrics.costPerMile}</div>
                <div className="flex items-center text-xs text-muted-foreground">
                  <TrendingDown className="mr-1 h-3 w-3 text-green-600" />
                  <span className="text-green-600">-$0.15</span> from last month
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Savings Delivered</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${analyticsData.fleetMetrics.savings.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">This period</p>
              </CardContent>
            </Card>
          </div>

          {/* Top Fleet Accounts */}
          <Card>
            <CardHeader>
              <CardTitle>Top Fleet Accounts</CardTitle>
              <CardDescription>Fleet performance and usage statistics</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fleet Name</TableHead>
                    <TableHead>Tier</TableHead>
                    <TableHead className="text-right">Vehicles</TableHead>
                    <TableHead className="text-right">Jobs</TableHead>
                    <TableHead className="text-right">Spent</TableHead>
                    <TableHead className="text-right">PM Compliance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {analyticsData.fleetMetrics.topFleets.map((fleet) => (
                    <TableRow key={fleet.name}>
                      <TableCell className="font-medium">{fleet.name}</TableCell>
                      <TableCell>
                        <Badge variant={fleet.tier === "Platinum" ? "default" : fleet.tier === "Gold" ? "secondary" : "outline"}>
                          {fleet.tier}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">{fleet.vehicles}</TableCell>
                      <TableCell className="text-right">{fleet.jobs}</TableCell>
                      <TableCell className="text-right">${fleet.spent.toLocaleString()}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Progress value={fleet.pmCompliance} className="w-20" />
                          <span>{fleet.pmCompliance}%</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Fleet Tier Distribution */}
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Fleet Tier Distribution</CardTitle>
                <CardDescription>Number of fleets and revenue by tier</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analyticsData.fleetMetrics.tierDistribution}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="tier" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Bar yAxisId="left" dataKey="count" fill={COLORS.primary} name="Fleet Count" />
                    <Bar yAxisId="right" dataKey="revenue" fill={COLORS.secondary} name="Revenue" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Fleet Analytics Summary</CardTitle>
                <CardDescription>Key metrics for fleet operations</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Avg Vehicles per Fleet</span>
                  <Badge variant="outline">{analyticsData.fleetMetrics.avgVehiclesPerFleet}</Badge>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Breakdown Rate</span>
                  <Badge variant={analyticsData.fleetMetrics.breakdownRate < 5 ? "default" : "destructive"}>
                    {analyticsData.fleetMetrics.breakdownRate}%
                  </Badge>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Avg Jobs per Vehicle</span>
                  <Badge variant="outline">2.3</Badge>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Fleet Retention Rate</span>
                  <Badge variant="default">92%</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Operations Tab */}
        <TabsContent value="operations" className="space-y-6">
          {/* System Health Status */}
          <Card>
            <CardHeader>
              <CardTitle>System Health</CardTitle>
              <CardDescription>Real-time system status and performance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4">
                {Object.entries(analyticsData.efficiency.systemHealth).map(([system, status]) => (
                  <div key={system} className="flex items-center justify-between p-3 border rounded-lg">
                    <span className="text-sm font-medium capitalize">{system}</span>
                    <Badge variant={status ? "default" : "destructive"}>
                      {status ? <CheckCircle className="h-3 w-3 mr-1" /> : <XCircle className="h-3 w-3 mr-1" />}
                      {status ? "Online" : "Offline"}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Operational Metrics */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardContent className="pt-6">
                <GaugeChart 
                  value={analyticsData.efficiency.contractorUtilization} 
                  title="Contractor Utilization"
                  subtitle="Target: 85%"
                  target={85}
                />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <GaugeChart 
                  value={analyticsData.efficiency.platformUptime} 
                  title="Platform Uptime"
                  subtitle="Target: 99.9%"
                  target={99.9}
                />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-3xl font-bold">{analyticsData.efficiency.apiResponseTime}ms</div>
                  <p className="text-sm font-medium mt-2">API Response Time</p>
                  <p className="text-xs text-muted-foreground">Target: &lt;200ms</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-3xl font-bold">{analyticsData.efficiency.errorRate}%</div>
                  <p className="text-sm font-medium mt-2">Error Rate</p>
                  <p className="text-xs text-muted-foreground">Target: &lt;1%</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Efficiency Trends */}
          <Card>
            <CardHeader>
              <CardTitle>Operational Efficiency Trends</CardTitle>
              <CardDescription>Utilization and efficiency metrics over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analyticsData.efficiency.performanceTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="utilization" stroke={COLORS.primary} name="Utilization %" />
                  <Line type="monotone" dataKey="efficiency" stroke={COLORS.success} name="Efficiency %" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Predictive Analytics */}
          <Card>
            <CardHeader>
              <CardTitle>Predictive Analytics</CardTitle>
              <CardDescription>AI-powered forecasting and predictions</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="demand" className="space-y-4">
                <TabsList>
                  <TabsTrigger value="demand">Demand Forecast</TabsTrigger>
                  <TabsTrigger value="contractors">Contractor Needs</TabsTrigger>
                  <TabsTrigger value="revenue">Revenue Projection</TabsTrigger>
                </TabsList>
                
                <TabsContent value="demand">
                  <ResponsiveContainer width="100%" height={250}>
                    <AreaChart data={analyticsData.predictions.demandForecast}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Area type="monotone" dataKey="predicted" stroke={COLORS.info} fill={COLORS.info} fillOpacity={0.6} />
                    </AreaChart>
                  </ResponsiveContainer>
                </TabsContent>
                
                <TabsContent value="contractors">
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={analyticsData.predictions.contractorNeeds}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="hour" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="predicted" stroke={COLORS.primary} name="Available" />
                      <Line type="monotone" dataKey="needed" stroke={COLORS.danger} name="Needed" />
                    </LineChart>
                  </ResponsiveContainer>
                </TabsContent>
                
                <TabsContent value="revenue">
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={analyticsData.predictions.revenueProjection}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                      <Bar dataKey="projected" fill={COLORS.success} />
                    </BarChart>
                  </ResponsiveContainer>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AdminLayout>
  );
}

// Add missing imports
import { Separator } from "@/components/ui/separator";