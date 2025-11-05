import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Download,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Clock,
  Truck,
  AlertCircle,
  BarChart3,
  FileText,
  Filter
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";

export default function FleetAnalytics() {
  const [, setLocation] = useLocation();
  const [dateRange, setDateRange] = useState("30days");
  const [vehicleFilter, setVehicleFilter] = useState("all");

  // Mock data for charts
  const costTrendData = [
    { month: "Jan", cost: 12500, services: 18 },
    { month: "Feb", cost: 10800, services: 15 },
    { month: "Mar", cost: 14200, services: 20 },
    { month: "Apr", cost: 11500, services: 16 },
    { month: "May", cost: 13800, services: 19 },
    { month: "Jun", cost: 12450, services: 17 }
  ];

  const serviceTypeData = [
    { name: "Emergency Repairs", value: 35, cost: 28000 },
    { name: "PM Services", value: 40, cost: 18000 },
    { name: "Truck Washing", value: 15, cost: 3500 },
    { name: "Tire Services", value: 10, cost: 8500 }
  ];

  const vehiclePerformanceData = [
    { vehicle: "T-101", downtime: 12, cost: 4500, services: 8 },
    { vehicle: "T-102", downtime: 18, cost: 5200, services: 10 },
    { vehicle: "T-103", downtime: 8, cost: 3100, services: 6 },
    { vehicle: "T-104", downtime: 15, cost: 4800, services: 9 },
    { vehicle: "T-105", downtime: 10, cost: 3600, services: 7 }
  ];

  const complianceData = [
    { status: "Compliant", value: 22, percentage: 91.7 },
    { status: "Due Soon", value: 2, percentage: 8.3 }
  ];

  const COLORS = ["#1E3A8A", "#F97316", "#059669", "#F59E0B"];

  const handleExportPDF = () => {
    console.log("Exporting PDF report...");
  };

  const handleExportCSV = () => {
    console.log("Exporting CSV data...");
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
                data-testid="button-back-to-dashboard"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <span className="ml-4 text-2xl font-bold text-primary">Fleet Analytics</span>
            </div>
            <div className="flex items-center space-x-2">
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="w-[150px]" data-testid="select-date-range">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7days">Last 7 Days</SelectItem>
                  <SelectItem value="30days">Last 30 Days</SelectItem>
                  <SelectItem value="90days">Last 90 Days</SelectItem>
                  <SelectItem value="12months">Last 12 Months</SelectItem>
                  <SelectItem value="ytd">Year to Date</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={handleExportPDF} data-testid="button-export-pdf">
                <FileText className="h-4 w-4 mr-2" />
                Export PDF
              </Button>
              <Button variant="outline" onClick={handleExportCSV} data-testid="button-export-csv">
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card data-testid="metric-total-cost">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$74,250</div>
              <p className="text-xs text-green-600 flex items-center">
                <TrendingDown className="h-3 w-3 mr-1" />
                12% vs last period
              </p>
            </CardContent>
          </Card>

          <Card data-testid="metric-avg-downtime">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Downtime</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12.6 hrs</div>
              <p className="text-xs text-green-600 flex items-center">
                <TrendingDown className="h-3 w-3 mr-1" />
                8% improvement
              </p>
            </CardContent>
          </Card>

          <Card data-testid="metric-services">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Services Completed</CardTitle>
              <Truck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">105</div>
              <p className="text-xs text-muted-foreground">
                Average 3.5/day
              </p>
            </CardContent>
          </Card>

          <Card data-testid="metric-compliance">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Compliance Rate</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">91.7%</div>
              <p className="text-xs text-yellow-600 flex items-center">
                <AlertCircle className="h-3 w-3 mr-1" />
                2 vehicles due
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Tabs */}
        <Tabs defaultValue="cost" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="cost" data-testid="tab-cost">Cost Analysis</TabsTrigger>
            <TabsTrigger value="downtime" data-testid="tab-downtime">Downtime Metrics</TabsTrigger>
            <TabsTrigger value="compliance" data-testid="tab-compliance">Compliance</TabsTrigger>
            <TabsTrigger value="vehicles" data-testid="tab-vehicles">Vehicle Performance</TabsTrigger>
          </TabsList>

          {/* Cost Analysis Tab */}
          <TabsContent value="cost" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Monthly Cost Trend</CardTitle>
                  <CardDescription>Total maintenance costs over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={costTrendData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="cost" 
                        stroke="#1E3A8A" 
                        strokeWidth={2}
                        name="Cost ($)"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="services" 
                        stroke="#F97316" 
                        strokeWidth={2}
                        name="Services"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Cost by Service Type</CardTitle>
                  <CardDescription>Breakdown of costs across service categories</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={serviceTypeData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${value}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {serviceTypeData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="mt-4 space-y-2">
                    {serviceTypeData.map((item, index) => (
                      <div key={item.name} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          />
                          <span>{item.name}</span>
                        </div>
                        <span className="font-medium">${item.cost.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Cost Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Most Expensive Vehicle</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold">T-102</p>
                      <p className="text-sm text-muted-foreground">Peterbilt 579</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-destructive">$5,200</p>
                      <p className="text-xs text-muted-foreground">This period</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Cost Per Mile</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold">$0.42</p>
                      <p className="text-sm text-green-600">-$0.03 vs last period</p>
                    </div>
                    <BarChart3 className="h-8 w-8 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Savings (Gold Tier)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold text-green-600">$8,250</p>
                      <p className="text-sm text-muted-foreground">10% discount applied</p>
                    </div>
                    <Badge variant="default">Gold</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Downtime Metrics Tab */}
          <TabsContent value="downtime" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Vehicle Downtime Analysis</CardTitle>
                <CardDescription>Hours of downtime per vehicle</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={vehiclePerformanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="vehicle" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="downtime" fill="#F97316" name="Downtime (hrs)" />
                    <Bar dataKey="services" fill="#1E3A8A" name="Services" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Downtime by Reason</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      { reason: "Emergency Repairs", hours: 35, percentage: 45 },
                      { reason: "Scheduled PM", hours: 20, percentage: 26 },
                      { reason: "Tire Issues", hours: 15, percentage: 19 },
                      { reason: "DOT Inspections", hours: 8, percentage: 10 }
                    ].map((item) => (
                      <div key={item.reason} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>{item.reason}</span>
                          <span className="font-medium">{item.hours} hrs</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-primary h-2 rounded-full" 
                            style={{ width: `${item.percentage}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Downtime Trends</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Average Response Time</span>
                      <div className="text-right">
                        <p className="font-bold">28 min</p>
                        <p className="text-xs text-green-600">-5 min improvement</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Average Repair Time</span>
                      <div className="text-right">
                        <p className="font-bold">2.4 hrs</p>
                        <p className="text-xs text-green-600">-18 min improvement</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">First-Time Fix Rate</span>
                      <div className="text-right">
                        <p className="font-bold">87%</p>
                        <p className="text-xs text-green-600">+3% improvement</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Preventable Issues</span>
                      <div className="text-right">
                        <p className="font-bold">15%</p>
                        <p className="text-xs text-yellow-600">Could be reduced</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Compliance Tab */}
          <TabsContent value="compliance" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>DOT Compliance Status</CardTitle>
                  <CardDescription>Current compliance across your fleet</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={complianceData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        fill="#8884d8"
                        paddingAngle={5}
                        dataKey="value"
                      >
                        <Cell fill="#059669" />
                        <Cell fill="#F59E0B" />
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-green-600" />
                        <span>Compliant</span>
                      </div>
                      <span className="font-medium">22 vehicles (91.7%)</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-yellow-500" />
                        <span>Due Soon</span>
                      </div>
                      <span className="font-medium">2 vehicles (8.3%)</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Upcoming Compliance Actions</CardTitle>
                  <CardDescription>Vehicles requiring attention</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      { vehicle: "T-102", action: "DOT Annual Inspection", due: "Feb 10, 2024", days: 5 },
                      { vehicle: "T-105", action: "Registration Renewal", due: "Feb 15, 2024", days: 10 },
                      { vehicle: "T-101", action: "Insurance Renewal", due: "Feb 28, 2024", days: 23 },
                      { vehicle: "T-103", action: "Emissions Test", due: "Mar 05, 2024", days: 28 }
                    ].map((item) => (
                      <div key={item.vehicle + item.action} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{item.vehicle}</p>
                          <p className="text-sm text-muted-foreground">{item.action}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm">{item.due}</p>
                          <Badge variant={item.days <= 7 ? "destructive" : "secondary"}>
                            {item.days} days
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Vehicle Performance Tab */}
          <TabsContent value="vehicles" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Vehicle Performance Metrics</CardTitle>
                  <CardDescription>Cost and performance analysis by vehicle</CardDescription>
                </div>
                <Select value={vehicleFilter} onValueChange={setVehicleFilter}>
                  <SelectTrigger className="w-[150px]" data-testid="select-vehicle-filter">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Vehicles</SelectItem>
                    <SelectItem value="active">Active Only</SelectItem>
                    <SelectItem value="highcost">High Cost</SelectItem>
                    <SelectItem value="frequent">Frequent Service</SelectItem>
                  </SelectContent>
                </Select>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {vehiclePerformanceData.map((vehicle) => (
                    <div key={vehicle.vehicle} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="font-semibold text-lg">{vehicle.vehicle}</p>
                          <p className="text-sm text-muted-foreground">
                            {vehicle.services} services completed
                          </p>
                        </div>
                        <Badge variant={vehicle.cost > 4500 ? "destructive" : "default"}>
                          ${vehicle.cost.toLocaleString()}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Downtime</p>
                          <p className="font-medium">{vehicle.downtime} hours</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Cost per Service</p>
                          <p className="font-medium">${Math.round(vehicle.cost / vehicle.services)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Performance Score</p>
                          <p className="font-medium">{Math.round(100 - (vehicle.downtime / 20) * 100)}%</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}