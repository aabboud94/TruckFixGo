import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import AdminLayout from "@/layouts/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { DatePicker } from "@/components/ui/date-picker";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import {
  TrendingUp, TrendingDown, Download, Calendar, DollarSign,
  Users, Briefcase, MapPin, Activity, Award, Truck, Filter,
  FileDown, RefreshCw, BarChart3, PieChartIcon, Loader2
} from "lucide-react";

export default function AdminAnalytics() {
  const { toast } = useToast();
  const [dateRange, setDateRange] = useState("week");
  const [selectedMetric, setSelectedMetric] = useState("revenue");

  // Query for analytics data
  const { data: analytics, isLoading, refetch } = useQuery({
    queryKey: ['/api/admin/analytics', { range: dateRange, metric: selectedMetric }],
  });

  // Export analytics report
  const handleExportReport = async (format: 'pdf' | 'csv') => {
    try {
      const response = await apiRequest('/api/admin/analytics/export', {
        method: 'POST',
        body: JSON.stringify({ format, range: dateRange }),
      });
      
      const blob = new Blob([response.data], { 
        type: format === 'pdf' ? 'application/pdf' : 'text/csv' 
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics-report-${dateRange}-${new Date().toISOString().split('T')[0]}.${format}`;
      a.click();
      
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

  const analyticsData = analytics || {
    revenue: {
      total: 587400,
      growth: 12.5,
      chart: [
        { date: "Jan", amount: 420000 },
        { date: "Feb", amount: 465000 },
        { date: "Mar", amount: 510000 },
        { date: "Apr", amount: 495000 },
        { date: "May", amount: 540000 },
        { date: "Jun", amount: 587400 },
      ],
    },
    jobs: {
      total: 3456,
      completed: 3215,
      cancelled: 126,
      inProgress: 115,
    },
    contractors: {
      total: 342,
      active: 287,
      topPerformers: [
        { name: "Mike Johnson", earnings: 45600, jobs: 342, rating: 4.8 },
        { name: "Sarah Williams", earnings: 38500, jobs: 285, rating: 4.7 },
        { name: "John Davis", earnings: 32100, jobs: 245, rating: 4.9 },
      ],
    },
    fleets: {
      total: 126,
      activeAccounts: 98,
      revenue: 234500,
      topAccounts: [
        { name: "ABC Transport", spent: 45000, jobs: 234 },
        { name: "XYZ Logistics", spent: 38000, jobs: 189 },
        { name: "Quick Fleet", spent: 28500, jobs: 156 },
      ],
    },
    services: [
      { name: "Emergency Repair", value: 45, revenue: 264330 },
      { name: "Fleet Services", value: 30, revenue: 176220 },
      { name: "Truck Wash", value: 15, revenue: 88110 },
      { name: "PM Services", value: 10, revenue: 58740 },
    ],
    geographic: [
      { region: "Miami", jobs: 892, revenue: 145200 },
      { region: "Orlando", jobs: 756, revenue: 123400 },
      { region: "Tampa", jobs: 623, revenue: 98700 },
      { region: "Jacksonville", jobs: 534, revenue: 87600 },
      { region: "Fort Lauderdale", jobs: 451, revenue: 73500 },
    ],
  };

  const colors = ["#1E3A8A", "#F97316", "#059669", "#F59E0B", "#8B5CF6"];

  return (
    <AdminLayout 
      title="Revenue & Analytics"
      breadcrumbs={[{ label: "Analytics" }]}
    >
      {/* Date Range Selector */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex gap-2">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[180px]" data-testid="select-date-range">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="quarter">This Quarter</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
              <SelectItem value="custom">Custom Range</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => handleExportReport('csv')}
            data-testid="button-export-csv"
          >
            <FileDown className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          <Button
            variant="outline"
            onClick={() => handleExportReport('pdf')}
            data-testid="button-export-pdf"
          >
            <FileDown className="mr-2 h-4 w-4" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${analyticsData.revenue.total.toLocaleString()}
            </div>
            <div className="flex items-center text-xs">
              {analyticsData.revenue.growth > 0 ? (
                <>
                  <TrendingUp className="mr-1 h-3 w-3 text-green-600" />
                  <span className="text-green-600">+{analyticsData.revenue.growth}%</span>
                </>
              ) : (
                <>
                  <TrendingDown className="mr-1 h-3 w-3 text-red-600" />
                  <span className="text-red-600">{analyticsData.revenue.growth}%</span>
                </>
              )}
              <span className="ml-1 text-muted-foreground">vs last period</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.jobs.total}</div>
            <Progress 
              value={(analyticsData.jobs.completed / analyticsData.jobs.total) * 100} 
              className="mt-2"
            />
            <p className="text-xs text-muted-foreground mt-1">
              {((analyticsData.jobs.completed / analyticsData.jobs.total) * 100).toFixed(1)}% completion rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Contractors</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.contractors.active}</div>
            <p className="text-xs text-muted-foreground">
              Out of {analyticsData.contractors.total} total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fleet Accounts</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.fleets.activeAccounts}</div>
            <p className="text-xs text-muted-foreground">
              ${(analyticsData.fleets.revenue / 1000).toFixed(1)}k revenue
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Tabs */}
      <Tabs defaultValue="revenue" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="services">Services</TabsTrigger>
          <TabsTrigger value="contractors">Contractors</TabsTrigger>
          <TabsTrigger value="fleets">Fleet Accounts</TabsTrigger>
          <TabsTrigger value="geographic">Geographic</TabsTrigger>
        </TabsList>

        {/* Revenue Tab */}
        <TabsContent value="revenue">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Trend</CardTitle>
              <CardDescription>Monthly revenue performance</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="h-[400px] flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={400}>
                  <AreaChart data={analyticsData.revenue.chart}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#1E3A8A" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#1E3A8A" stopOpacity={0.1} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                    <Area
                      type="monotone"
                      dataKey="amount"
                      stroke="#1E3A8A"
                      fillOpacity={1}
                      fill="url(#colorRevenue)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Services Tab */}
        <TabsContent value="services">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Service Type Distribution</CardTitle>
                <CardDescription>Percentage of jobs by service type</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={analyticsData.services}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {analyticsData.services.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Service Revenue Breakdown</CardTitle>
                <CardDescription>Revenue contribution by service type</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analyticsData.services.map((service, index) => (
                    <div key={service.name}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">{service.name}</span>
                        <span className="text-sm text-muted-foreground">
                          ${service.revenue.toLocaleString()}
                        </span>
                      </div>
                      <Progress 
                        value={(service.revenue / analyticsData.revenue.total) * 100}
                        className="h-2"
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Contractors Tab */}
        <TabsContent value="contractors">
          <Card>
            <CardHeader>
              <CardTitle>Top Performing Contractors</CardTitle>
              <CardDescription>Contractors with highest earnings and ratings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analyticsData.contractors.topPerformers.map((contractor, index) => (
                  <div key={contractor.name} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-semibold">{contractor.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {contractor.jobs} jobs completed
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="font-semibold">${contractor.earnings.toLocaleString()}</p>
                        <p className="text-sm text-muted-foreground">Total earnings</p>
                      </div>
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Award className="h-3 w-3" />
                        {contractor.rating}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Fleet Accounts Tab */}
        <TabsContent value="fleets">
          <Card>
            <CardHeader>
              <CardTitle>Top Fleet Accounts</CardTitle>
              <CardDescription>Fleet accounts by spending and usage</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={analyticsData.fleets.topAccounts}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis yAxisId="left" orientation="left" stroke="#1E3A8A" />
                  <YAxis yAxisId="right" orientation="right" stroke="#F97316" />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="spent" fill="#1E3A8A" name="Spending ($)" />
                  <Bar yAxisId="right" dataKey="jobs" fill="#F97316" name="Jobs Count" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Geographic Tab */}
        <TabsContent value="geographic">
          <Card>
            <CardHeader>
              <CardTitle>Geographic Distribution</CardTitle>
              <CardDescription>Jobs and revenue by region</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={analyticsData.geographic}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="region" />
                  <YAxis yAxisId="left" orientation="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="jobs" fill="#059669" name="Jobs" />
                  <Bar yAxisId="right" dataKey="revenue" fill="#1E3A8A" name="Revenue ($)" />
                </BarChart>
              </ResponsiveContainer>
              
              {/* Heat Map Placeholder */}
              <div className="mt-6 p-8 bg-muted rounded-lg text-center">
                <MapPin className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">
                  Interactive heat map visualization
                </p>
                <Button variant="outline" className="mt-4">
                  View Full Map
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AdminLayout>
  );
}

// Add missing import
import { DatePicker } from "@/components/ui/date-picker";