import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar } from "@/components/ui/calendar";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { apiRequest } from "@/lib/queryClient";
import {
  Truck,
  Calendar as CalendarIcon,
  DollarSign,
  CheckCircle,
  AlertCircle,
  Plus,
  FileText,
  Download,
  Settings,
  LogOut,
  ChevronRight,
  Clock,
  Wrench,
  TrendingUp,
  AlertTriangle
} from "lucide-react";

export default function FleetDashboard() {
  const [, setLocation] = useLocation();
  const [date, setDate] = useState<Date | undefined>(new Date());

  // Check authentication and fetch user session
  const { data: session, isLoading: sessionLoading } = useQuery({
    queryKey: ['/api/auth/session'],
    queryFn: async () => {
      try {
        return await apiRequest('GET', '/api/auth/session');
      } catch (error) {
        return null;
      }
    }
  });

  // Fetch fleet account data
  const { data: fleetData, isLoading: fleetLoading } = useQuery({
    queryKey: ['/api/fleet/account'],
    enabled: !!session?.user?.id && session?.user?.role === 'fleet_manager',
    queryFn: async () => apiRequest('GET', '/api/fleet/account')
  });

  // Fetch fleet vehicles
  const { data: vehicles, isLoading: vehiclesLoading } = useQuery({
    queryKey: ['/api/fleet/vehicles'],
    enabled: !!session?.user?.id && session?.user?.role === 'fleet_manager',
    queryFn: async () => apiRequest('GET', '/api/fleet/vehicles')
  });

  // Fetch scheduled services
  const { data: scheduledServices, isLoading: servicesLoading } = useQuery({
    queryKey: ['/api/fleet/scheduled-services'],
    enabled: !!session?.user?.id && session?.user?.role === 'fleet_manager',
    queryFn: async () => apiRequest('GET', '/api/fleet/scheduled-services')
  });

  // Fetch fleet statistics
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/fleet/statistics'],
    enabled: !!session?.user?.id && session?.user?.role === 'fleet_manager',
    queryFn: async () => apiRequest('GET', '/api/fleet/statistics')
  });

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!sessionLoading && (!session?.user || session?.user?.role !== 'fleet_manager')) {
      setLocation('/fleet/login');
    }
  }, [session, sessionLoading, setLocation]);

  // Show loading state
  if (sessionLoading || fleetLoading || vehiclesLoading || servicesLoading || statsLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Skeleton className="h-12 w-64 mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[1, 2, 3, 4].map(i => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-4 w-24 mb-2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-16" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Check if user is authenticated with fleet_manager role
  if (!session?.user || session?.user?.role !== 'fleet_manager') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
          </CardHeader>
          <CardContent>
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                You must be logged in as a fleet manager to access this dashboard.
              </AlertDescription>
            </Alert>
            <Button 
              className="w-full mt-4" 
              onClick={() => setLocation('/fleet/login')}
              data-testid="button-go-to-login"
            >
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Use real data or defaults
  const fleetAccount = fleetData?.fleet || {};
  const vehiclesList = vehicles?.vehicles || [];
  const servicesList = scheduledServices?.services || [];
  const statistics = stats || {
    activeVehicles: vehiclesList.filter((v: any) => v.status === 'active').length,
    scheduledServices: servicesList.length,
    monthlySpend: fleetAccount.currentBalance || 0,
    complianceRate: fleetAccount.complianceRate || 0
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge variant="default" className="bg-green-500">Active</Badge>;
      case "in_service":
        return <Badge variant="secondary" className="bg-yellow-500">In Service</Badge>;
      case "confirmed":
        return <Badge variant="default" className="bg-green-500">Confirmed</Badge>;
      case "pending":
        return <Badge variant="secondary" className="bg-yellow-500">Pending</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <span className="text-2xl font-bold text-primary">TruckFixGo Fleet</span>
              <Badge variant="default" className="ml-4">Gold Tier</Badge>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="icon" data-testid="button-settings">
                <Settings className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setLocation("/")} data-testid="button-logout">
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Fleet Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {fleetAccount.companyName || 'Fleet Manager'}
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card data-testid="stat-card-vehicles">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Vehicles</CardTitle>
              <Truck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.activeVehicles}</div>
              <p className="text-xs text-muted-foreground">
                {vehiclesList.filter((v: any) => v.status === 'in_service').length} in service
              </p>
            </CardContent>
          </Card>

          <Card data-testid="stat-card-scheduled">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Scheduled Services</CardTitle>
              <CalendarIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.scheduledServices}</div>
              <p className="text-xs text-muted-foreground">
                {servicesList.length > 0 ? `Next: ${servicesList[0].date}` : 'None scheduled'}
              </p>
            </CardContent>
          </Card>

          <Card data-testid="stat-card-spend">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Spend</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${typeof statistics.monthlySpend === 'number' ? statistics.monthlySpend.toFixed(2) : '0.00'}
              </div>
              <p className="text-xs text-muted-foreground">Current balance</p>
            </CardContent>
          </Card>

          <Card data-testid="stat-card-compliance">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Compliance Rate</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {typeof statistics.complianceRate === 'number' ? `${statistics.complianceRate}%` : '0%'}
              </div>
              <p className="text-xs text-muted-foreground">Fleet compliance</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Button 
            className="h-auto py-4 flex flex-col items-center gap-2"
            onClick={() => setLocation("/fleet/schedule-pm")}
            data-testid="button-schedule-pm"
          >
            <CalendarIcon className="h-5 w-5" />
            <span>Schedule PM</span>
          </Button>

          <Button 
            className="h-auto py-4 flex flex-col items-center gap-2"
            onClick={() => setLocation("/fleet/batch-jobs")}
            variant="outline"
            data-testid="button-batch-service"
          >
            <Wrench className="h-5 w-5" />
            <span>Request Batch Service</span>
          </Button>

          <Button 
            className="h-auto py-4 flex flex-col items-center gap-2"
            variant="outline"
            data-testid="button-view-invoices"
          >
            <FileText className="h-5 w-5" />
            <span>View Invoices</span>
          </Button>

          <Button 
            className="h-auto py-4 flex flex-col items-center gap-2"
            onClick={() => setLocation("/fleet/analytics")}
            variant="outline"
            data-testid="button-analytics"
          >
            <TrendingUp className="h-5 w-5" />
            <span>Analytics</span>
          </Button>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="vehicles" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="vehicles" data-testid="tab-vehicles">Vehicles</TabsTrigger>
            <TabsTrigger value="schedule" data-testid="tab-schedule">Schedule</TabsTrigger>
            <TabsTrigger value="billing" data-testid="tab-billing">Billing</TabsTrigger>
          </TabsList>

          {/* Vehicles Tab */}
          <TabsContent value="vehicles" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Fleet Vehicles</CardTitle>
                  <CardDescription>Manage your fleet vehicles and maintenance schedules</CardDescription>
                </div>
                <Button onClick={() => setLocation("/fleet/vehicles")} data-testid="button-manage-vehicles">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Vehicle
                </Button>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Unit #</TableHead>
                      <TableHead>Make/Model</TableHead>
                      <TableHead>Last Service</TableHead>
                      <TableHead>Next PM Due</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {vehiclesList.length > 0 ? (
                      vehiclesList.map((vehicle: any) => (
                        <TableRow key={vehicle.id} data-testid={`vehicle-row-${vehicle.id}`}>
                          <TableCell className="font-medium">{vehicle.unitNumber}</TableCell>
                          <TableCell>{vehicle.make} {vehicle.model}</TableCell>
                          <TableCell>{vehicle.lastService || 'N/A'}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              {vehicle.nextPMDue && new Date(vehicle.nextPMDue) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) && (
                                <AlertCircle className="h-4 w-4 text-yellow-500" />
                              )}
                              {vehicle.nextPMDue || 'Not scheduled'}
                            </div>
                          </TableCell>
                          <TableCell>{getStatusBadge(vehicle.status)}</TableCell>
                          <TableCell>{vehicle.location || 'Unknown'}</TableCell>
                          <TableCell>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => setLocation(`/fleet/vehicles/${vehicle.id}`)}
                              data-testid={`button-view-vehicle-${vehicle.id}`}
                            >
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground">
                          No vehicles registered yet
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Schedule Tab */}
          <TabsContent value="schedule" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Upcoming Services</CardTitle>
                  <CardDescription>Scheduled maintenance and services</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {servicesList.length > 0 ? (
                      servicesList.map((service: any) => (
                        <div key={service.id} className="flex items-center justify-between p-4 border rounded-lg" data-testid={`service-item-${service.id}`}>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">{service.date} at {service.time || '9:00 AM'}</span>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {service.vehicle || 'Unassigned'} - {service.service || 'Service'}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Location: {service.location || 'TBD'}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {getStatusBadge(service.status || 'pending')}
                            <Button variant="ghost" size="icon" data-testid={`button-view-service-${service.id}`}>
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-center text-muted-foreground py-4">
                        No scheduled services
                      </p>
                    )}
                  </div>
                  <Button className="w-full mt-4" onClick={() => setLocation("/fleet/schedule-pm")} data-testid="button-schedule-more">
                    Schedule More Services
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Service Calendar</CardTitle>
                  <CardDescription>View scheduled services by date</CardDescription>
                </CardHeader>
                <CardContent>
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    className="rounded-md border"
                  />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Billing Tab */}
          <TabsContent value="billing" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Billing & Invoices</CardTitle>
                  <CardDescription>Manage your billing and payment information</CardDescription>
                </div>
                <Button variant="outline" data-testid="button-download-all">
                  <Download className="h-4 w-4 mr-2" />
                  Download All
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="rounded-lg border p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Current Billing Period</p>
                        <p className="text-sm text-muted-foreground">January 1 - January 31, 2024</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold">{stats.monthlySpend}</p>
                        <p className="text-sm text-muted-foreground">NET 30 Terms</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium">Recent Invoices</h4>
                    <div className="space-y-2">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="flex items-center justify-between p-3 border rounded-lg" data-testid={`invoice-item-${i}`}>
                          <div className="flex items-center gap-3">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="font-medium">Invoice #INV-2024-0{i}</p>
                              <p className="text-sm text-muted-foreground">December {i}, 2023</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">$4,150.00</span>
                            <Badge variant="default" className="bg-green-500">Paid</Badge>
                            <Button variant="ghost" size="icon" data-testid={`button-download-invoice-${i}`}>
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}