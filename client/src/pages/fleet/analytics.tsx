import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  ComposedChart
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  DollarSign,
  Truck,
  Wrench,
  AlertCircle,
  Calendar,
  MapPin,
  ThermometerSun,
  Clock,
  Shield,
  Download,
  RefreshCcw,
  Settings,
  Bell,
  Activity,
  BarChart3,
  PieChart as PieChartIcon,
  TrendingUpDown,
  Info,
  ChevronRight,
  Filter,
  ArrowLeft
} from "lucide-react";
import { format } from "date-fns";

const COLORS = {
  primary: "#1E3A8A",
  success: "#059669",
  warning: "#F59E0B",
  danger: "#DC2626",
  info: "#3B82F6",
  secondary: "#6B7280"
};

const CHART_COLORS = [
  COLORS.primary,
  COLORS.success,
  COLORS.warning,
  COLORS.danger,
  COLORS.info,
  COLORS.secondary
];

export default function FleetAnalytics() {
  const [, setLocation] = useLocation();
  const [selectedPeriod, setSelectedPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly');
  const [selectedVehicle, setSelectedVehicle] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('overview');

  // Get fleet ID from session/auth context (mocked for now)
  const fleetId = 'fleet-123';

  // Fetch comprehensive analytics data (mocked for now)
  const { data: analytics, isLoading, refetch } = useQuery({
    queryKey: [`/api/fleet/${fleetId}/analytics`],
    enabled: false // Mock data for now
  });

  // Calculate metrics with mock data
  const metrics = useMemo(() => {
    return {
      fleetHealthScore: 78,
      totalMaintenanceCost: 45230,
      avgCostPerMile: 0.82,
      vehiclesAtRisk: 3,
      totalVehicles: 24,
      upcomingMaintenance: [
        { vehicleId: 'T-101', date: new Date('2024-02-15'), service: 'A-Service PM' },
        { vehicleId: 'T-102', date: new Date('2024-02-18'), service: 'B-Service PM' },
        { vehicleId: 'T-103', date: new Date('2024-02-20'), service: 'Tire Rotation' },
        { vehicleId: 'T-104', date: new Date('2024-02-22'), service: 'Oil Change' },
        { vehicleId: 'T-105', date: new Date('2024-02-25'), service: 'Brake Inspection' }
      ]
    };
  }, [analytics]);

  // Mock data for charts
  const costTrendData = [
    { month: 'Jan', maintenance: 8500, fuel: 12000, total: 20500 },
    { month: 'Feb', maintenance: 9200, fuel: 11500, total: 20700 },
    { month: 'Mar', maintenance: 7800, fuel: 13200, total: 21000 },
    { month: 'Apr', maintenance: 10500, fuel: 12800, total: 23300 },
    { month: 'May', maintenance: 8900, fuel: 13500, total: 22400 },
    { month: 'Jun', maintenance: 9500, fuel: 14000, total: 23500 }
  ];

  const breakdownFrequencyData = [
    { issueType: 'Brake System', frequency: 18, avgCost: 850 },
    { issueType: 'Engine Cooling', frequency: 15, avgCost: 1200 },
    { issueType: 'Tire Wear', frequency: 12, avgCost: 450 },
    { issueType: 'Electrical', frequency: 10, avgCost: 650 },
    { issueType: 'Transmission', frequency: 8, avgCost: 2500 },
    { issueType: 'Other', frequency: 5, avgCost: 350 }
  ];

  const vehicleHealthData = [
    { unitNumber: 'T-101', healthScore: 85, riskScore: 15, status: 'Good' },
    { unitNumber: 'T-102', healthScore: 72, riskScore: 28, status: 'Fair' },
    { unitNumber: 'T-103', healthScore: 45, riskScore: 55, status: 'At Risk' },
    { unitNumber: 'T-104', healthScore: 90, riskScore: 10, status: 'Excellent' },
    { unitNumber: 'T-105', healthScore: 68, riskScore: 32, status: 'Fair' }
  ];

  const seasonalPatternData = [
    { season: 'Spring', breakdowns: 12, avgCost: 850 },
    { season: 'Summer', breakdowns: 25, avgCost: 1100 },
    { season: 'Fall', breakdowns: 18, avgCost: 950 },
    { season: 'Winter', breakdowns: 35, avgCost: 1400 }
  ];

  const mockAlerts = [
    { id: '1', alertTitle: 'T-103 High Risk - Immediate Maintenance Needed', severity: 'critical', alertType: 'breakdown_risk' },
    { id: '2', alertTitle: 'Cost threshold exceeded for T-102', severity: 'high', alertType: 'cost_threshold' },
    { id: '3', alertTitle: 'DOT compliance due for 2 vehicles', severity: 'medium', alertType: 'compliance' }
  ];

  const getHealthBadge = (score: number) => {
    if (score >= 80) return <Badge className="bg-green-500">Excellent</Badge>;
    if (score >= 60) return <Badge className="bg-yellow-500">Good</Badge>;
    if (score >= 40) return <Badge className="bg-orange-500">Fair</Badge>;
    return <Badge className="bg-red-500">Poor</Badge>;
  };

  const getRiskBadge = (risk: string) => {
    switch (risk.toLowerCase()) {
      case 'low':
        return <Badge variant="outline" className="border-green-500 text-green-600">Low Risk</Badge>;
      case 'medium':
        return <Badge variant="outline" className="border-yellow-500 text-yellow-600">Medium Risk</Badge>;
      case 'high':
        return <Badge variant="outline" className="border-red-500 text-red-600">High Risk</Badge>;
      default:
        return <Badge variant="secondary">{risk}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setLocation("/fleet/dashboard")}
                data-testid="button-back"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <span className="ml-4 text-2xl font-bold text-primary">Fleet Analytics</span>
            </div>
            <div className="flex items-center gap-2">
              <Select value={selectedPeriod} onValueChange={(v: any) => setSelectedPeriod(v)}>
                <SelectTrigger className="w-32" data-testid="select-period">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon" onClick={() => refetch?.()} data-testid="button-refresh">
                <RefreshCcw className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" data-testid="button-download">
                <Download className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" data-testid="button-settings">
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Fleet Health Score */}
        <Card className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  Fleet Health Score
                  <Info className="h-4 w-4 text-muted-foreground" />
                </h2>
                <p className="text-muted-foreground">Overall fleet performance indicator</p>
              </div>
              <div className="text-right">
                <div className="text-5xl font-bold">{metrics?.fleetHealthScore}/100</div>
                <div className="flex items-center justify-end gap-1 mt-2">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-green-600">+5% from last month</span>
                </div>
              </div>
            </div>
            <Progress value={metrics?.fleetHealthScore} className="mt-4 h-3" />
          </CardContent>
        </Card>

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card data-testid="metric-maintenance">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Maintenance</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${metrics?.totalMaintenanceCost.toLocaleString()}
              </div>
              <div className="flex items-center gap-1 text-sm">
                <TrendingDown className="h-3 w-3 text-green-600" />
                <span className="text-green-600">-12% vs last month</span>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="metric-cpm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Cost/Mile</CardTitle>
              <TrendingUpDown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${metrics?.avgCostPerMile}</div>
              <p className="text-sm text-muted-foreground">Industry avg: $1.25</p>
            </CardContent>
          </Card>

          <Card data-testid="metric-risk">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Vehicles at Risk</CardTitle>
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics?.vehiclesAtRisk}</div>
              <p className="text-sm text-muted-foreground">
                of {metrics?.totalVehicles} total vehicles
              </p>
            </CardContent>
          </Card>

          <Card data-testid="metric-upcoming">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Upcoming PM</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {metrics?.upcomingMaintenance?.length || 5}
              </div>
              <p className="text-sm text-muted-foreground">Next 7 days</p>
            </CardContent>
          </Card>
        </div>

        {/* Active Alerts */}
        {mockAlerts?.length > 0 && (
          <Alert className="border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <AlertTitle>Active Alerts ({mockAlerts.length})</AlertTitle>
            <AlertDescription className="mt-2 space-y-2">
              {mockAlerts.slice(0, 3).map((alert, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm">{alert.alertTitle}</span>
                  <Badge variant="outline" className="text-xs">
                    {alert.severity}
                  </Badge>
                </div>
              ))}
              <Button variant="link" size="sm" className="p-0">
                View all alerts <ChevronRight className="h-3 w-3 ml-1" />
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
            <TabsTrigger value="patterns" data-testid="tab-patterns">Patterns</TabsTrigger>
            <TabsTrigger value="cpm" data-testid="tab-cpm">Cost/Mile</TabsTrigger>
            <TabsTrigger value="predictions" data-testid="tab-predictions">Predictions</TabsTrigger>
            <TabsTrigger value="vehicles" data-testid="tab-vehicles">Vehicles</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Cost Trend Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Cost Trends</CardTitle>
                  <CardDescription>Monthly maintenance and fuel costs</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <ComposedChart data={costTrendData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip formatter={(value) => `$${value}`} />
                      <Legend />
                      <Bar dataKey="maintenance" fill={COLORS.primary} name="Maintenance" />
                      <Bar dataKey="fuel" fill={COLORS.success} name="Fuel" />
                      <Line 
                        type="monotone" 
                        dataKey="total" 
                        stroke={COLORS.danger} 
                        strokeWidth={2}
                        name="Total"
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Breakdown Frequency Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Breakdown Frequency</CardTitle>
                  <CardDescription>Most common issues across the fleet</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={breakdownFrequencyData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="issueType" type="category" width={80} />
                      <Tooltip />
                      <Bar dataKey="frequency" fill={COLORS.warning}>
                        {breakdownFrequencyData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Maintenance Schedule */}
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Maintenance Schedule</CardTitle>
                <CardDescription>Vehicles scheduled for preventive maintenance</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Vehicle</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Service Type</TableHead>
                      <TableHead>Est. Cost</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {metrics?.upcomingMaintenance?.slice(0, 5).map((item, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{item.vehicleId}</TableCell>
                        <TableCell>{format(item.date, 'MMM dd, yyyy')}</TableCell>
                        <TableCell>{item.service}</TableCell>
                        <TableCell>$850</TableCell>
                        <TableCell>
                          <Badge variant={index === 0 ? 'destructive' : 'secondary'}>
                            {index === 0 ? 'High' : 'Medium'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button size="sm" variant="outline" data-testid={`button-schedule-${index}`}>
                            Schedule
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Patterns Tab */}
          <TabsContent value="patterns" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Seasonal Patterns */}
              <Card>
                <CardHeader>
                  <CardTitle>Seasonal Breakdown Patterns</CardTitle>
                  <CardDescription>Breakdown frequency by season</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={seasonalPatternData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="season" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="breakdowns" fill={COLORS.primary} name="Breakdowns" />
                      <Bar dataKey="avgCost" fill={COLORS.warning} name="Avg Cost ($)" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Time of Day Patterns */}
              <Card>
                <CardHeader>
                  <CardTitle>Time of Day Patterns</CardTitle>
                  <CardDescription>When breakdowns most frequently occur</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Morning (6-12)', value: 35 },
                          { name: 'Afternoon (12-6)', value: 25 },
                          { name: 'Evening (6-12)', value: 20 },
                          { name: 'Night (12-6)', value: 20 }
                        ]}
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        fill={COLORS.primary}
                        dataKey="value"
                        label
                      >
                        {[0, 1, 2, 3].map((index) => (
                          <Cell key={`cell-${index}`} fill={CHART_COLORS[index]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Pattern Analysis Table */}
            <Card>
              <CardHeader>
                <CardTitle>Breakdown Pattern Analysis</CardTitle>
                <CardDescription>Detailed breakdown patterns with preventive actions</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Issue Type</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Frequency</TableHead>
                      <TableHead>Total Cost</TableHead>
                      <TableHead>Common Locations</TableHead>
                      <TableHead>Weather Correlation</TableHead>
                      <TableHead>Preventive Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {breakdownFrequencyData.slice(0, 5).map((pattern, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{pattern.issueType}</TableCell>
                        <TableCell>Mechanical</TableCell>
                        <TableCell>{pattern.frequency}</TableCell>
                        <TableCell>${(pattern.frequency * pattern.avgCost).toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge variant="outline">Highway Routes</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <ThermometerSun className="h-3 w-3" />
                            <span className="text-sm">Hot weather</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button size="sm" variant="link" className="p-0">
                            View Actions
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Cost Per Mile Tab */}
          <TabsContent value="cpm" className="space-y-4">
            {/* CPM Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Fleet Average CPM</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">$0.82</div>
                  <div className="text-sm text-muted-foreground mt-1">
                    Industry Benchmark: $1.25
                  </div>
                  <Badge className="mt-2 bg-green-500">
                    34% below industry avg
                  </Badge>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Maintenance CPM</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">$0.35</div>
                  <Progress value={35} className="mt-2" />
                  <p className="text-xs text-muted-foreground mt-1">43% of total CPM</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Fuel CPM</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">$0.47</div>
                  <Progress value={47} className="mt-2" />
                  <p className="text-xs text-muted-foreground mt-1">57% of total CPM</p>
                </CardContent>
              </Card>
            </div>

            {/* CPM by Vehicle */}
            <Card>
              <CardHeader>
                <CardTitle>Cost Per Mile by Vehicle</CardTitle>
                <CardDescription>Comparison across fleet vehicles</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={vehicleHealthData.map(v => ({
                    unitNumber: v.unitNumber,
                    maintenanceCPM: 0.30 + Math.random() * 0.2,
                    fuelCPM: 0.40 + Math.random() * 0.2
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="unitNumber" />
                    <YAxis />
                    <Tooltip formatter={(value) => `$${Number(value).toFixed(2)}`} />
                    <Legend />
                    <Bar dataKey="maintenanceCPM" stackId="a" fill={COLORS.primary} name="Maintenance" />
                    <Bar dataKey="fuelCPM" stackId="a" fill={COLORS.success} name="Fuel" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Historical CPM Trend */}
            <Card>
              <CardHeader>
                <CardTitle>Historical CPM Trend</CardTitle>
                <CardDescription>Cost per mile over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={costTrendData.map((item, idx) => ({
                    month: item.month,
                    cpm: 0.75 + (idx * 0.02) + (Math.random() * 0.1)
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => `$${Number(value).toFixed(2)}`} />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="cpm" 
                      stroke={COLORS.primary} 
                      strokeWidth={2}
                      name="Cost Per Mile"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Predictions Tab */}
          <TabsContent value="predictions" className="space-y-4">
            {/* Predictive Maintenance Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="border-red-200 bg-red-50 dark:bg-red-900/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    High Risk Vehicles
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-red-600">2</div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Need immediate attention
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Predicted Cost (30 days)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">$12,000</div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Based on ML predictions
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Preventable Breakdowns</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600">85%</div>
                  <p className="text-sm text-muted-foreground mt-1">
                    With timely maintenance
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Predictive Maintenance Table */}
            <Card>
              <CardHeader>
                <CardTitle>Predictive Maintenance Recommendations</CardTitle>
                <CardDescription>AI-powered maintenance predictions for your fleet</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Vehicle</TableHead>
                      <TableHead>Risk Score</TableHead>
                      <TableHead>Next Maintenance</TableHead>
                      <TableHead>Predicted Services</TableHead>
                      <TableHead>Est. Cost</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {vehicleHealthData.map((vehicle, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{vehicle.unitNumber}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress value={100 - vehicle.riskScore} className="w-16" />
                            <span className="text-sm">{vehicle.riskScore}%</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {format(new Date(Date.now() + (index + 1) * 5 * 24 * 60 * 60 * 1000), 'MMM dd')}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <Badge variant="outline" className="text-xs">
                              Brake Service (75%)
                            </Badge>
                            {index % 2 === 0 && (
                              <Badge variant="outline" className="text-xs">
                                Oil Change (90%)
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>$1,850</TableCell>
                        <TableCell>
                          <Button size="sm" data-testid={`button-schedule-pm-${index}`}>
                            Schedule PM
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Risk Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Fleet Risk Distribution</CardTitle>
                <CardDescription>Vehicle distribution by risk category</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Low Risk', value: 15, color: COLORS.success },
                        { name: 'Medium Risk', value: 6, color: COLORS.warning },
                        { name: 'High Risk', value: 3, color: COLORS.danger }
                      ]}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      label
                    >
                      {[COLORS.success, COLORS.warning, COLORS.danger].map((color, index) => (
                        <Cell key={`cell-${index}`} fill={color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Vehicles Tab */}
          <TabsContent value="vehicles" className="space-y-4">
            {/* Vehicle Health Overview */}
            <Card>
              <CardHeader>
                <CardTitle>Vehicle Health Status</CardTitle>
                <CardDescription>Individual vehicle performance and health metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Unit Number</TableHead>
                      <TableHead>Make/Model</TableHead>
                      <TableHead>Health Score</TableHead>
                      <TableHead>Total Miles</TableHead>
                      <TableHead>CPM</TableHead>
                      <TableHead>Breakdowns</TableHead>
                      <TableHead>Last Service</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {vehicleHealthData.map((vehicle, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{vehicle.unitNumber}</TableCell>
                        <TableCell>Freightliner Cascadia</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress value={vehicle.healthScore} className="w-20" />
                            <span>{vehicle.healthScore}</span>
                          </div>
                        </TableCell>
                        <TableCell>125,430</TableCell>
                        <TableCell>$0.78</TableCell>
                        <TableCell>3</TableCell>
                        <TableCell>{format(new Date(), 'MMM dd')}</TableCell>
                        <TableCell>{getHealthBadge(vehicle.healthScore)}</TableCell>
                        <TableCell>
                          <Button size="sm" variant="outline" data-testid={`button-vehicle-details-${index}`}>
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Vehicle Comparison */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Health Score Distribution</CardTitle>
                  <CardDescription>Fleet vehicles by health category</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={[
                      { category: 'Excellent (80-100)', count: 8 },
                      { category: 'Good (60-79)', count: 10 },
                      { category: 'Fair (40-59)', count: 4 },
                      { category: 'Poor (0-39)', count: 2 }
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="category" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill={COLORS.primary}>
                        {[COLORS.success, COLORS.info, COLORS.warning, COLORS.danger].map((color, index) => (
                          <Cell key={`cell-${index}`} fill={color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Utilization Rate</CardTitle>
                  <CardDescription>Vehicle usage efficiency</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={[
                      { month: 'Jan', rate: 78 },
                      { month: 'Feb', rate: 82 },
                      { month: 'Mar', rate: 85 },
                      { month: 'Apr', rate: 79 },
                      { month: 'May', rate: 88 },
                      { month: 'Jun', rate: 91 }
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip formatter={(value) => `${value}%`} />
                      <Line 
                        type="monotone" 
                        dataKey="rate" 
                        stroke={COLORS.success} 
                        strokeWidth={2}
                        name="Utilization %"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button variant="outline" className="justify-start" data-testid="button-schedule-bulk">
                <Calendar className="h-4 w-4 mr-2" />
                Schedule Bulk PM
              </Button>
              <Button variant="outline" className="justify-start" data-testid="button-export-report">
                <Download className="h-4 w-4 mr-2" />
                Export Report
              </Button>
              <Button variant="outline" className="justify-start" data-testid="button-configure-alerts">
                <Bell className="h-4 w-4 mr-2" />
                Configure Alerts
              </Button>
              <Button variant="outline" className="justify-start" data-testid="button-import-data">
                <Activity className="h-4 w-4 mr-2" />
                Import Data
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}