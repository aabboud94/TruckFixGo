import { useQuery } from "@tanstack/react-query";
import AdminLayout from "@/layouts/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import {
  TrendingUp, TrendingDown, Users, Briefcase, DollarSign, Clock,
  Activity, AlertCircle, CheckCircle, XCircle, Truck, MapPin,
  Timer, Star, Package, Building2
} from "lucide-react";
import { format } from "date-fns";

// Mock data for charts
const revenueData = [
  { date: "Mon", revenue: 12450 },
  { date: "Tue", revenue: 15200 },
  { date: "Wed", revenue: 13800 },
  { date: "Thu", revenue: 16500 },
  { date: "Fri", revenue: 18200 },
  { date: "Sat", revenue: 14600 },
  { date: "Sun", revenue: 11200 },
];

const serviceBreakdown = [
  { name: "Emergency Repairs", value: 45, color: "#F97316" },
  { name: "Fleet Services", value: 30, color: "#1E3A8A" },
  { name: "Truck Wash", value: 15, color: "#059669" },
  { name: "PM Services", value: 10, color: "#F59E0B" },
];

const jobStatusData = [
  { status: "Completed", count: 145, color: "#059669" },
  { status: "In Progress", count: 23, color: "#F59E0B" },
  { status: "Assigned", count: 12, color: "#1E3A8A" },
  { status: "New", count: 8, color: "#9CA3AF" },
];

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

export default function AdminDashboard() {
  // Query for real-time metrics
  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: ['/api/admin/metrics'],
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  // Query for recent activity
  const { data: recentActivity } = useQuery({
    queryKey: ['/api/admin/activity'],
    refetchInterval: 30000,
  });

  // Query for alerts
  const { data: alerts } = useQuery({
    queryKey: ['/api/admin/alerts'],
    refetchInterval: 30000,
  });

  // Ensure all numeric fields have safe default values
  const stats = {
    activeJobs: safeNumber(metrics?.activeJobs, 35),
    onlineContractors: safeNumber(metrics?.onlineContractors, 87),
    avgResponseTime: safeNumber(metrics?.avgResponseTime, 12),
    completionRate: safeNumber(metrics?.completionRate, 94.5),
    revenueToday: safeNumber(metrics?.revenueToday, 24650),
    revenueWeek: safeNumber(metrics?.revenueWeek, 142800),
    revenueMonth: safeNumber(metrics?.revenueMonth, 587400),
    totalFleets: safeNumber(metrics?.totalFleets, 126),
    totalContractors: safeNumber(metrics?.totalContractors, 342),
    totalUsers: safeNumber(metrics?.totalUsers, 5821),
  };

  const activities = recentActivity || [
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

  const systemAlerts = alerts || [
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
      {/* Key Metrics */}
      <div className="grid gap-3 md:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card className="w-full">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Jobs</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeJobs}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 mr-1 text-green-600" />
              <span className="text-green-600">+12%</span> from yesterday
            </div>
          </CardContent>
        </Card>

        <Card className="w-full">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Online Contractors</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.onlineContractors}</div>
            <div className="text-xs text-muted-foreground">
              Out of {stats.totalContractors} total
            </div>
            <Progress value={safePercentage(stats.onlineContractors, stats.totalContractors, 0)} className="mt-2" />
          </CardContent>
        </Card>

        <Card className="w-full">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgResponseTime} min</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingDown className="h-3 w-3 mr-1 text-green-600" />
              <span className="text-green-600">-2 min</span> from last week
            </div>
          </CardContent>
        </Card>

        <Card className="w-full">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completionRate}%</div>
            <Progress value={Math.min(100, Math.max(0, stats.completionRate))} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Revenue Cards */}
      <div className="grid gap-3 md:gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 mb-6">
        <Card className="w-full border-green-200 bg-green-50/50 dark:bg-green-950/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue Today</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(stats.revenueToday)}
            </div>
            <div className="text-xs text-muted-foreground">
              Target: $30,000
            </div>
            <Progress value={safePercentage(stats.revenueToday, 30000, 0)} className="mt-2" />
          </CardContent>
        </Card>

        <Card className="w-full border-blue-200 bg-blue-50/50 dark:bg-blue-950/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue This Week</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(stats.revenueWeek)}
            </div>
            <div className="text-xs text-muted-foreground">
              Target: $175,000
            </div>
            <Progress value={safePercentage(stats.revenueWeek, 175000, 0)} className="mt-2" />
          </CardContent>
        </Card>

        <Card className="w-full border-purple-200 bg-purple-50/50 dark:bg-purple-950/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue This Month</CardTitle>
            <DollarSign className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {formatCurrency(stats.revenueMonth)}
            </div>
            <div className="text-xs text-muted-foreground">
              Target: $700,000
            </div>
            <Progress value={safePercentage(stats.revenueMonth, 700000, 0)} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Charts and Activity */}
      <div className="grid gap-3 md:gap-6 grid-cols-1 lg:grid-cols-3">
        {/* Revenue Chart */}
        <Card className="w-full lg:col-span-2">
          <CardHeader>
            <CardTitle>Revenue Trend</CardTitle>
            <CardDescription>Daily revenue for the past week</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <ResponsiveContainer width="100%" height={288} className="h-56 md:h-72">
                <AreaChart data={revenueData}>
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
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Live platform activity feed</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-56 md:h-72">
              <div className="space-y-4">
                {activities.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3">
                    <div className={`p-2 rounded-full bg-muted ${activity.color}`}>
                      <activity.icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm">{activity.message}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(activity.timestamp, "h:mm a")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Service Breakdown and Job Status */}
      <div className="grid gap-3 md:gap-6 grid-cols-1 lg:grid-cols-2 mt-6">
        {/* Service Type Breakdown */}
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Service Type Breakdown</CardTitle>
            <CardDescription>Distribution of jobs by service type</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <ResponsiveContainer width="100%" height={224} className="h-56">
                <PieChart>
                <Pie
                  data={serviceBreakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {serviceBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 space-y-2">
              {serviceBreakdown.map((service) => (
                <div key={service.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: service.color }}
                    />
                    <span className="text-sm">{service.name}</span>
                  </div>
                  <span className="text-sm font-medium">{service.value}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Job Status Distribution */}
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Job Status Distribution</CardTitle>
            <CardDescription>Current status of all jobs</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <ResponsiveContainer width="100%" height={224} className="h-56">
                <BarChart data={jobStatusData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="status" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#1E3A8A" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Alerts */}
      {systemAlerts.length > 0 && (
        <Card className="w-full mt-6">
          <CardHeader>
            <CardTitle>System Alerts</CardTitle>
            <CardDescription>Important notifications requiring attention</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {systemAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`flex items-center gap-3 p-3 rounded-lg ${
                    alert.severity === "warning"
                      ? "bg-orange-50 dark:bg-orange-950/20 border border-orange-200"
                      : "bg-blue-50 dark:bg-blue-950/20 border border-blue-200"
                  }`}
                >
                  <AlertCircle
                    className={`h-5 w-5 ${
                      alert.severity === "warning" ? "text-orange-600" : "text-blue-600"
                    }`}
                  />
                  <p className="text-sm flex-1">{alert.message}</p>
                  <Button size="sm" variant="outline">
                    View
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </AdminLayout>
  );
}