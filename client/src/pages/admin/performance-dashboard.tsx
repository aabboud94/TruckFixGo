import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AreaChart,
  BarChart,
  LineChart,
  PieChart,
  Area,
  Bar,
  Line,
  Pie,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  RadialBarChart,
  RadialBar,
  ComposedChart
} from "recharts";
import PerformanceWidget from "@/components/performance-widget";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import {
  TrendingUp,
  TrendingDown,
  Award,
  Target,
  DollarSign,
  Clock,
  CheckCircle,
  AlertTriangle,
  Download,
  RefreshCw,
  Calendar,
  Users,
  Activity,
  Star,
  Truck,
  BarChart3,
  PieChart as PieChartIcon
} from "lucide-react";

const COLORS = {
  primary: "hsl(var(--primary))",
  success: "hsl(var(--success))",
  warning: "hsl(var(--warning))",
  danger: "hsl(var(--destructive))",
  info: "hsl(var(--info))",
  secondary: "hsl(var(--secondary))"
};

const CHART_COLORS = [
  COLORS.primary,
  COLORS.success,
  COLORS.warning,
  COLORS.danger,
  COLORS.info,
  COLORS.secondary
];

interface KpiData {
  name: string;
  value: number;
  unit: string;
  trend?: number;
  status?: 'green' | 'yellow' | 'red';
  target?: number;
  icon?: any;
}

interface PerformanceTrend {
  metricType: string;
  data: Array<{
    date: Date;
    value: number;
    movingAverage?: number;
  }>;
  trendLine: 'up' | 'down' | 'stable';
  projection?: number;
}

export default function PerformanceDashboard() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [selectedPeriod, setSelectedPeriod] = useState("30d");
  const [selectedMetric, setSelectedMetric] = useState("completion_rate");
  const [selectedEntityType, setSelectedEntityType] = useState("all");

  // Fetch dashboard data
  const { data: dashboardData, isLoading, refetch } = useQuery({
    queryKey: ["/api/metrics/dashboard", selectedPeriod],
    queryFn: async () => {
      const response = await fetch(`/api/metrics/dashboard?period=${selectedPeriod}`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch dashboard data');
      return response.json();
    },
    refetchInterval: 60000 // Refresh every minute
  });

  // Fetch KPI definitions
  const { data: kpiDefinitions } = useQuery({
    queryKey: ["/api/metrics/kpis"],
    queryFn: async () => {
      const response = await fetch('/api/metrics/kpis', {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch KPI definitions');
      return response.json();
    }
  });

  const handleExportReport = async (format: 'json' | 'csv') => {
    try {
      const response = await fetch(
        `/api/reports/performance?format=${format}&startDate=${dashboardData?.dateRange?.startDate}&endDate=${dashboardData?.dateRange?.endDate}`,
        { credentials: 'include' }
      );
      
      if (!response.ok) throw new Error('Failed to export report');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `performance-report-${Date.now()}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Report Exported",
        description: `Performance report exported as ${format.toUpperCase()}`
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export performance report",
        variant: "destructive"
      });
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'green': return 'text-green-600';
      case 'yellow': return 'text-yellow-600';
      case 'red': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getTrendIcon = (trend?: number) => {
    if (!trend) return null;
    if (trend > 0) return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (trend < 0) return <TrendingDown className="h-4 w-4 text-red-600" />;
    return null;
  };

  const formatValue = (value: number, unit: string) => {
    switch (unit) {
      case 'percentage':
        return `${value.toFixed(1)}%`;
      case 'dollars':
        return `$${value.toLocaleString()}`;
      case 'minutes':
        return `${value.toFixed(0)} min`;
      case 'rating':
        return value.toFixed(1);
      case 'count':
        return value.toFixed(0);
      default:
        return value.toFixed(2);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading performance metrics...</p>
        </div>
      </div>
    );
  }

  const kpis = dashboardData?.kpis?.scorecard || [];
  const compositeScore = dashboardData?.kpis?.compositeScore || 0;
  const trends = dashboardData?.trends || {};
  const leaderboards = dashboardData?.leaderboards || {};

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-page-title">Performance Metrics Dashboard</h1>
          <p className="text-muted-foreground">Monitor and analyze key performance indicators</p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-32" data-testid="select-period">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon"
            onClick={() => refetch()}
            data-testid="button-refresh"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            onClick={() => handleExportReport('csv')}
            data-testid="button-export"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Composite Score */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Overall Performance Score</span>
            <Badge variant={compositeScore >= 80 ? "default" : compositeScore >= 60 ? "secondary" : "destructive"}>
              {compositeScore.toFixed(1)}%
            </Badge>
          </CardTitle>
          <CardDescription>Composite score based on all active KPIs</CardDescription>
        </CardHeader>
        <CardContent>
          <Progress value={compositeScore} className="h-3" />
          <div className="flex justify-between mt-2 text-sm text-muted-foreground">
            <span>Poor</span>
            <span>Fair</span>
            <span>Good</span>
            <span>Excellent</span>
          </div>
        </CardContent>
      </Card>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.slice(0, 8).map((kpi: KpiData, index: number) => (
          <PerformanceWidget
            key={kpi.name}
            title={kpi.name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
            value={kpi.value}
            unit={kpi.unit}
            trend={kpi.trend}
            status={kpi.status}
            target={kpi.target}
            icon={
              kpi.name.includes('revenue') ? DollarSign :
              kpi.name.includes('time') ? Clock :
              kpi.name.includes('completion') || kpi.name.includes('rate') ? CheckCircle :
              kpi.name.includes('satisfaction') ? Star :
              kpi.name.includes('utilization') ? Truck :
              Activity
            }
          />
        ))}
      </div>

      <Tabs defaultValue="trends" className="space-y-4">
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="trends" data-testid="tab-trends">Trends</TabsTrigger>
          <TabsTrigger value="leaderboard" data-testid="tab-leaderboard">Leaderboard</TabsTrigger>
          <TabsTrigger value="comparison" data-testid="tab-comparison">Comparison</TabsTrigger>
          <TabsTrigger value="goals" data-testid="tab-goals">Goals</TabsTrigger>
        </TabsList>

        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Completion Rate Trend */}
            <Card>
              <CardHeader>
                <CardTitle>Completion Rate Trend</CardTitle>
                <CardDescription>Job completion rate over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={trends.completion?.data || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={(date) => format(new Date(date), 'MMM dd')}
                    />
                    <YAxis />
                    <Tooltip 
                      labelFormatter={(date) => format(new Date(date), 'MMM dd, yyyy')}
                      formatter={(value: any) => `${value.toFixed(1)}%`}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="value" 
                      stroke={COLORS.primary} 
                      strokeWidth={2}
                      name="Completion Rate"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="movingAverage" 
                      stroke={COLORS.secondary} 
                      strokeDasharray="5 5"
                      name="7-Day Average"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Revenue Trend */}
            <Card>
              <CardHeader>
                <CardTitle>Revenue Trend</CardTitle>
                <CardDescription>Daily revenue performance</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={trends.revenue?.data || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date"
                      tickFormatter={(date) => format(new Date(date), 'MMM dd')}
                    />
                    <YAxis />
                    <Tooltip 
                      labelFormatter={(date) => format(new Date(date), 'MMM dd, yyyy')}
                      formatter={(value: any) => `$${value.toLocaleString()}`}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="value" 
                      stroke={COLORS.success} 
                      fill={COLORS.success}
                      fillOpacity={0.3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Satisfaction Score Trend */}
            <Card>
              <CardHeader>
                <CardTitle>Customer Satisfaction Trend</CardTitle>
                <CardDescription>Average customer ratings over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <ComposedChart data={trends.satisfaction?.data || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date"
                      tickFormatter={(date) => format(new Date(date), 'MMM dd')}
                    />
                    <YAxis domain={[0, 5]} />
                    <Tooltip 
                      labelFormatter={(date) => format(new Date(date), 'MMM dd, yyyy')}
                      formatter={(value: any) => value.toFixed(1)}
                    />
                    <Legend />
                    <Bar 
                      dataKey="value" 
                      fill={COLORS.warning}
                      name="Rating"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="movingAverage" 
                      stroke={COLORS.danger}
                      strokeWidth={2}
                      name="Moving Average"
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Metric Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Metric Status Distribution</CardTitle>
                <CardDescription>Current KPI status breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Green', value: kpis.filter((k: KpiData) => k.status === 'green').length },
                        { name: 'Yellow', value: kpis.filter((k: KpiData) => k.status === 'yellow').length },
                        { name: 'Red', value: kpis.filter((k: KpiData) => k.status === 'red').length }
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      <Cell fill={COLORS.success} />
                      <Cell fill={COLORS.warning} />
                      <Cell fill={COLORS.danger} />
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Leaderboard Tab */}
        <TabsContent value="leaderboard" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Top Contractors by Completion */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  Top Performers - Completion Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  <div className="space-y-3">
                    {leaderboards.topContractors?.map((contractor: any, index: number) => (
                      <div key={contractor.entityId} className="flex items-center justify-between p-3 rounded-lg bg-background hover-elevate">
                        <div className="flex items-center gap-3">
                          <div className={`text-xl font-bold ${index < 3 ? 'text-yellow-500' : 'text-muted-foreground'}`}>
                            #{index + 1}
                          </div>
                          <div>
                            <p className="font-medium">{contractor.name}</p>
                            <p className="text-sm text-muted-foreground">{contractor.metricCount} jobs</p>
                          </div>
                        </div>
                        <Badge variant={index < 3 ? "default" : "secondary"}>
                          {formatValue(contractor.value, 'percentage')}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Fastest Response Time */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Fastest Response Time
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  <div className="space-y-3">
                    {leaderboards.fastestResponse?.map((contractor: any, index: number) => (
                      <div key={contractor.entityId} className="flex items-center justify-between p-3 rounded-lg bg-background hover-elevate">
                        <div className="flex items-center gap-3">
                          <div className={`text-xl font-bold ${index < 3 ? 'text-blue-500' : 'text-muted-foreground'}`}>
                            #{index + 1}
                          </div>
                          <div>
                            <p className="font-medium">{contractor.name}</p>
                            <p className="text-sm text-muted-foreground">{contractor.metricCount} responses</p>
                          </div>
                        </div>
                        <Badge variant={index < 3 ? "default" : "secondary"}>
                          {formatValue(contractor.value, 'minutes')}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Highest Revenue */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Highest Revenue
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  <div className="space-y-3">
                    {leaderboards.highestRevenue?.map((contractor: any, index: number) => (
                      <div key={contractor.entityId} className="flex items-center justify-between p-3 rounded-lg bg-background hover-elevate">
                        <div className="flex items-center gap-3">
                          <div className={`text-xl font-bold ${index < 3 ? 'text-green-500' : 'text-muted-foreground'}`}>
                            #{index + 1}
                          </div>
                          <div>
                            <p className="font-medium">{contractor.name}</p>
                            <p className="text-sm text-muted-foreground">{contractor.metricCount} jobs</p>
                          </div>
                        </div>
                        <Badge variant={index < 3 ? "default" : "secondary"}>
                          {formatValue(contractor.value, 'dollars')}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Comparison Tab */}
        <TabsContent value="comparison" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Period-over-Period Comparison</CardTitle>
              <CardDescription>Compare metrics across different time periods</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center text-muted-foreground py-8">
                <BarChart3 className="h-12 w-12 mx-auto mb-4" />
                <p>Period comparison feature coming soon</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Goals Tab */}
        <TabsContent value="goals" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance Goals</CardTitle>
              <CardDescription>Track progress towards performance targets</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center text-muted-foreground py-8">
                <Target className="h-12 w-12 mx-auto mb-4" />
                <p>Goal tracking feature coming soon</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}