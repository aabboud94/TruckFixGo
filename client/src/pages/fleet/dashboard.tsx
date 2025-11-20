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
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
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
  AlertTriangle,
  Activity,
  MoreVertical,
  MapPin,
  User
} from "lucide-react";

export default function FleetDashboard() {
  const [, setLocation] = useLocation();
  const [date, setDate] = useState<Date | undefined>(new Date());

  // Check authentication and fetch user session
  const { data: session, isLoading: sessionLoading } = useQuery({
    queryKey: ['/api/auth/me'],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', '/api/auth/me');
        // The API returns { user: {...} }, extract the user object
        return response?.user || null;
      } catch (error) {
        return null;
      }
    }
  });

  // Fetch fleet account data
  const { data: fleetData, isLoading: fleetLoading } = useQuery({
    queryKey: ['/api/fleet/accounts'],
    enabled: !!session?.id && session?.role === 'fleet_manager',
    queryFn: async () => {
      // Get all fleet accounts for this user
      const response = await apiRequest('GET', '/api/fleet/accounts');
      // API returns { fleets: [...] }
      const fleets = response?.fleets || [];
      // Return the first account (most fleet managers have one account)
      return fleets.length > 0 ? fleets[0] : null;
    }
  });

  // Fetch fleet vehicles
  const { data: vehicles, isLoading: vehiclesLoading } = useQuery({
    queryKey: [`/api/fleet/accounts/${fleetData?.id}/vehicles`],
    enabled: !!fleetData?.id,
    queryFn: async () => {
      if (!fleetData?.id) return { vehicles: [] };
      try {
        return await apiRequest('GET', `/api/fleet/accounts/${fleetData.id}/vehicles`);
      } catch (error) {
        console.error('Failed to fetch vehicles:', error);
        return { vehicles: [] };
      }
    }
  });

  // Fetch scheduled services (using jobs endpoint as services)
  const { data: scheduledServices, isLoading: servicesLoading } = useQuery({
    queryKey: ['/api/jobs'],
    enabled: !!fleetData?.id,
    queryFn: async () => {
      if (!fleetData?.id) return { services: [] };
      try {
        // Get jobs for this fleet account
        const jobs = await apiRequest('GET', `/api/jobs?fleetAccountId=${fleetData.id}`);
        return { services: jobs || [] };
      } catch (error) {
        console.error('Failed to fetch services:', error);
        return { services: [] };
      }
    }
  });

  // Fetch fleet statistics (optional - handle failure gracefully)
  const { data: stats } = useQuery({
    queryKey: [`/api/fleet/accounts/${fleetData?.id}/analytics`],
    enabled: !!fleetData?.id,
    queryFn: async () => {
      if (!fleetData?.id) return null;
      
      // Wrap in try-catch to absolutely prevent any errors
      try {
        const response = await fetch(`/api/fleet/accounts/${fleetData.id}/analytics`, {
          credentials: 'include'
        });
        
        if (!response.ok) {
          console.warn(`Analytics unavailable (${response.status})`);
          return null;
        }
        
        const data = await response.json();
        return data?.analytics || null;
      } catch (error) {
        console.warn('Analytics unavailable:', error);
        // Always return null on any error
        return null;
      }
    },
    // Don't retry analytics on failure - it's optional
    retry: false,
    // Don't throw errors - analytics is optional
    throwOnError: false
  });

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!sessionLoading && (!session || session?.role !== 'fleet_manager')) {
      setLocation('/fleet/login');
    }
  }, [session, sessionLoading, setLocation]);

  // Show loading state (don't wait for stats since they're optional)
  if (sessionLoading || fleetLoading || vehiclesLoading || servicesLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="w-full px-3 py-4 md:max-w-7xl md:mx-auto md:px-4 lg:px-8">
          <Skeleton className="h-10 w-48 mb-6" />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 md:grid-cols-4 mb-6">
            {[1, 2, 3, 4].map(i => (
              <Card key={i}>
                <CardHeader className="p-4">
                  <Skeleton className="h-4 w-20 mb-2" />
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <Skeleton className="h-7 w-16" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Check if user is authenticated with fleet_manager role
  if (!session || session?.role !== 'fleet_manager') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <Card className="w-full max-w-md">
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
  
  // Check if fleet account is found
  if (!fleetData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>No Fleet Account Found</CardTitle>
          </CardHeader>
          <CardContent>
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No fleet account is associated with your email address. Please contact support to set up your fleet account.
              </AlertDescription>
            </Alert>
            <Button 
              className="w-full mt-4" 
              onClick={() => setLocation('/fleet/login')}
              data-testid="button-back-to-login"
            >
              Back to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Use real data or defaults
  const fleetAccount = fleetData || {};
  const vehiclesList = vehicles?.vehicles || vehicles || [];
  const servicesList = scheduledServices?.services || [];
  const statistics = stats || {
    activeVehicles: vehiclesList.filter((v: any) => v.status === 'active').length,
    scheduledServices: servicesList.length,
    monthlySpend: fleetAccount.totalSpent || 0,
    complianceRate: fleetAccount.complianceRate || 95
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge variant="default" className="bg-green-500 text-xs">Active</Badge>;
      case "in_service":
        return <Badge variant="secondary" className="bg-yellow-500 text-xs">In Service</Badge>;
      case "confirmed":
        return <Badge variant="default" className="bg-green-500 text-xs">Confirmed</Badge>;
      case "pending":
        return <Badge variant="secondary" className="bg-yellow-500 text-xs">Pending</Badge>;
      default:
        return <Badge variant="secondary" className="text-xs">{status}</Badge>;
    }
  };

  // Mobile card component for vehicles
  const VehicleCard = ({ vehicle }: { vehicle: any }) => (
    <Card className="mb-3" data-testid={`vehicle-card-${vehicle.id}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm truncate">Unit #{vehicle.unitNumber}</h3>
            <p className="text-xs text-muted-foreground truncate">
              {vehicle.make} {vehicle.model}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {getStatusBadge(vehicle.status)}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setLocation(`/fleet/vehicles/${vehicle.id}`)}
              data-testid={`button-view-vehicle-${vehicle.id}`}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <p className="text-muted-foreground">Last Service</p>
            <p className="font-medium truncate">{vehicle.lastService || 'N/A'}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Next PM</p>
            <p className="font-medium truncate flex items-center gap-1">
              {vehicle.nextPMDue && new Date(vehicle.nextPMDue) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) && (
                <AlertCircle className="h-3 w-3 text-yellow-500 flex-shrink-0" />
              )}
              <span className="truncate">{vehicle.nextPMDue || 'Not scheduled'}</span>
            </p>
          </div>
        </div>
        
        {vehicle.location && (
          <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3 flex-shrink-0" />
            <span className="truncate">{vehicle.location}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - Mobile Optimized */}
      <header className="sticky top-0 z-50 bg-background border-b">
        <div className="w-full px-3 py-3 md:max-w-7xl md:mx-auto md:px-4 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-lg font-bold text-primary truncate sm:text-xl md:text-2xl">
                TruckFixGo Fleet
              </span>
              <Badge variant="default" className="hidden sm:inline-flex text-xs">Gold</Badge>
            </div>
            <div className="flex items-center gap-1 sm:gap-2">
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-10 w-10"
                data-testid="button-settings"
              >
                <Settings className="h-5 w-5" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-10 w-10"
                onClick={() => setLocation("/")} 
                data-testid="button-logout"
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="w-full px-3 py-4 md:max-w-7xl md:mx-auto md:px-4 lg:px-8">
        {/* Welcome Section - Mobile Optimized */}
        <div className="mb-6">
          <h1 className="text-xl font-bold sm:text-2xl md:text-3xl">Fleet Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1 truncate">
            Welcome, {fleetAccount.companyName || 'Fleet Manager'}
          </p>
        </div>

        {/* Stats Overview - Mobile Responsive Grid */}
        <div className="grid grid-cols-2 gap-3 mb-6 sm:grid-cols-2 md:grid-cols-4">
          <Card data-testid="stat-card-vehicles">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-xs font-medium flex items-center justify-between">
                <span className="truncate">Active Vehicles</span>
                <Truck className="h-4 w-4 text-muted-foreground flex-shrink-0 ml-1" />
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-xl font-bold sm:text-2xl">{statistics.activeVehicles}</div>
              <p className="text-xs text-muted-foreground truncate">
                {vehiclesList.filter((v: any) => v.status === 'in_service').length} in service
              </p>
            </CardContent>
          </Card>

          <Card data-testid="stat-card-scheduled">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-xs font-medium flex items-center justify-between">
                <span className="truncate">Scheduled</span>
                <CalendarIcon className="h-4 w-4 text-muted-foreground flex-shrink-0 ml-1" />
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-xl font-bold sm:text-2xl">{statistics.scheduledServices}</div>
              <p className="text-xs text-muted-foreground truncate">
                {servicesList.length > 0 ? 'Services pending' : 'None scheduled'}
              </p>
            </CardContent>
          </Card>

          <Card data-testid="stat-card-spend">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-xs font-medium flex items-center justify-between">
                <span className="truncate">Monthly Spend</span>
                <DollarSign className="h-4 w-4 text-muted-foreground flex-shrink-0 ml-1" />
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-xl font-bold truncate sm:text-2xl">
                ${typeof statistics.monthlySpend === 'number' ? statistics.monthlySpend.toFixed(0) : '0'}
              </div>
              <p className="text-xs text-muted-foreground truncate">Current balance</p>
            </CardContent>
          </Card>

          <Card data-testid="stat-card-compliance">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-xs font-medium flex items-center justify-between">
                <span className="truncate">Compliance</span>
                <CheckCircle className="h-4 w-4 text-muted-foreground flex-shrink-0 ml-1" />
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-xl font-bold sm:text-2xl">
                {typeof statistics.complianceRate === 'number' ? `${statistics.complianceRate}%` : '0%'}
              </div>
              <p className="text-xs text-muted-foreground truncate">Fleet compliance</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions - Mobile Horizontal Scroll */}
        <div className="mb-6">
          <ScrollArea className="w-full whitespace-nowrap">
            <div className="flex gap-3 pb-2">
              <Button 
                className="flex-shrink-0 h-auto px-4 py-3 flex flex-col items-center gap-1 min-w-[100px]"
                onClick={() => setLocation("/fleet/schedule-pm")}
                data-testid="button-schedule-pm"
              >
                <CalendarIcon className="h-5 w-5" />
                <span className="text-xs">Schedule PM</span>
              </Button>

              <Button 
                className="flex-shrink-0 h-auto px-4 py-3 flex flex-col items-center gap-1 min-w-[100px]"
                onClick={() => setLocation("/fleet/batch-jobs")}
                variant="outline"
                data-testid="button-batch-service"
              >
                <Wrench className="h-5 w-5" />
                <span className="text-xs">Batch Service</span>
              </Button>

              <Button 
                className="flex-shrink-0 h-auto px-4 py-3 flex flex-col items-center gap-1 min-w-[100px]"
                variant="outline"
                data-testid="button-view-invoices"
              >
                <FileText className="h-5 w-5" />
                <span className="text-xs">Invoices</span>
              </Button>

              <Button 
                className="flex-shrink-0 h-auto px-4 py-3 flex flex-col items-center gap-1 min-w-[100px]"
                onClick={() => setLocation("/fleet/analytics")}
                variant="outline"
                data-testid="button-analytics"
              >
                <TrendingUp className="h-5 w-5" />
                <span className="text-xs">Analytics</span>
              </Button>

              <Button 
                className="flex-shrink-0 h-auto px-4 py-3 flex flex-col items-center gap-1 min-w-[100px]"
                onClick={() => setLocation("/fleet/maintenance-predictor")}
                variant="outline"
                data-testid="button-maintenance-predictor"
              >
                <Activity className="h-5 w-5" />
                <span className="text-xs">AI Predict</span>
              </Button>
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </div>

        {/* Main Content Tabs - Mobile Optimized */}
        <Tabs defaultValue="vehicles" className="space-y-4">
          <TabsList className="w-full h-auto p-1 grid grid-cols-3">
            <TabsTrigger 
              value="vehicles" 
              className="text-xs py-2 data-[state=active]:text-xs"
              data-testid="tab-vehicles"
            >
              Vehicles
            </TabsTrigger>
            <TabsTrigger 
              value="schedule" 
              className="text-xs py-2 data-[state=active]:text-xs"
              data-testid="tab-schedule"
            >
              Schedule
            </TabsTrigger>
            <TabsTrigger 
              value="billing" 
              className="text-xs py-2 data-[state=active]:text-xs"
              data-testid="tab-billing"
            >
              Billing
            </TabsTrigger>
          </TabsList>

          {/* Vehicles Tab - Mobile Card Layout */}
          <TabsContent value="vehicles" className="space-y-4">
            <Card>
              <CardHeader className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="min-w-0">
                  <CardTitle className="text-base sm:text-lg">Fleet Vehicles</CardTitle>
                  <CardDescription className="text-xs sm:text-sm mt-1">
                    Manage your vehicles and maintenance
                  </CardDescription>
                </div>
                <Button 
                  className="w-full sm:w-auto"
                  size="sm"
                  onClick={() => setLocation("/fleet/vehicles")} 
                  data-testid="button-manage-vehicles"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Vehicle
                </Button>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                {/* Mobile: Card Layout */}
                <div className="block md:hidden">
                  {vehiclesList.length > 0 ? (
                    vehiclesList.map((vehicle: any) => (
                      <VehicleCard key={vehicle.id} vehicle={vehicle} />
                    ))
                  ) : (
                    <p className="text-center text-sm text-muted-foreground py-8">
                      No vehicles registered yet
                    </p>
                  )}
                </div>

                {/* Desktop: Table Layout */}
                <div className="hidden md:block overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Unit #</TableHead>
                        <TableHead>Make/Model</TableHead>
                        <TableHead className="hidden lg:table-cell">Last Service</TableHead>
                        <TableHead className="hidden lg:table-cell">Next PM Due</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="hidden xl:table-cell">Location</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {vehiclesList.length > 0 ? (
                        vehiclesList.map((vehicle: any) => (
                          <TableRow key={vehicle.id} data-testid={`vehicle-row-${vehicle.id}`}>
                            <TableCell className="font-medium">{vehicle.unitNumber}</TableCell>
                            <TableCell>{vehicle.make} {vehicle.model}</TableCell>
                            <TableCell className="hidden lg:table-cell">{vehicle.lastService || 'N/A'}</TableCell>
                            <TableCell className="hidden lg:table-cell">
                              <div className="flex items-center gap-1">
                                {vehicle.nextPMDue && new Date(vehicle.nextPMDue) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) && (
                                  <AlertCircle className="h-4 w-4 text-yellow-500" />
                                )}
                                {vehicle.nextPMDue || 'Not scheduled'}
                              </div>
                            </TableCell>
                            <TableCell>{getStatusBadge(vehicle.status)}</TableCell>
                            <TableCell className="hidden xl:table-cell">{vehicle.location || 'Unknown'}</TableCell>
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
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Schedule Tab - Mobile Optimized */}
          <TabsContent value="schedule" className="space-y-4">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader className="p-4">
                  <CardTitle className="text-base sm:text-lg">Upcoming Services</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    Scheduled maintenance and services
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="space-y-3">
                    {servicesList.length > 0 ? (
                      servicesList.slice(0, 3).map((service: any) => (
                        <div 
                          key={service.id} 
                          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 border rounded-lg" 
                          data-testid={`service-item-${service.id}`}
                        >
                          <div className="space-y-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <Clock className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                              <span className="text-sm font-medium truncate">
                                {service.date} at {service.time || '9:00 AM'}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground truncate">
                              {service.vehicle || 'Unassigned'} - {service.service || 'Service'}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              <MapPin className="h-3 w-3 inline mr-1" />
                              {service.location || 'TBD'}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 self-end sm:self-center">
                            {getStatusBadge(service.status || 'pending')}
                            <Button 
                              variant="ghost" 
                              size="icon"
                              className="h-8 w-8"
                              data-testid={`button-view-service-${service.id}`}
                            >
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-center text-sm text-muted-foreground py-8">
                        No scheduled services
                      </p>
                    )}
                  </div>
                  <Button 
                    className="w-full mt-4" 
                    size="sm"
                    onClick={() => setLocation("/fleet/schedule-pm")} 
                    data-testid="button-schedule-more"
                  >
                    Schedule More Services
                  </Button>
                </CardContent>
              </Card>

              <Card className="hidden lg:block">
                <CardHeader className="p-4">
                  <CardTitle className="text-base sm:text-lg">Service Calendar</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    View scheduled services by date
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    className="rounded-md border w-full"
                  />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Billing Tab - Mobile Optimized */}
          <TabsContent value="billing" className="space-y-4">
            <Card>
              <CardHeader className="p-4 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div className="min-w-0">
                  <CardTitle className="text-base sm:text-lg">Billing & Invoices</CardTitle>
                  <CardDescription className="text-xs sm:text-sm mt-1">
                    Manage billing and payment info
                  </CardDescription>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="w-full sm:w-auto"
                  data-testid="button-download-all"
                >
                  <Download className="h-4 w-4 mr-1" />
                  <span className="hidden sm:inline">Download All</span>
                  <span className="sm:hidden">Download</span>
                </Button>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="space-y-4">
                  {/* Current Billing Period */}
                  <div className="rounded-lg border p-3">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium">Current Period</p>
                        <p className="text-xs text-muted-foreground">Jan 1 - Jan 31, 2024</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold sm:text-2xl">
                          ${typeof stats?.monthlySpend === 'number' ? stats.monthlySpend.toFixed(0) : '0'}
                        </p>
                        <p className="text-xs text-muted-foreground">NET 30</p>
                      </div>
                    </div>
                  </div>

                  {/* Recent Invoices */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Recent Invoices</h4>
                    <div className="space-y-2">
                      {[1, 2, 3].map((i) => (
                        <div 
                          key={i} 
                          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 border rounded-lg" 
                          data-testid={`invoice-item-${i}`}
                        >
                          <div className="flex items-start gap-2 min-w-0">
                            <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate">INV-2024-0{i}</p>
                              <p className="text-xs text-muted-foreground">Dec {i}, 2023</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 self-end sm:self-center">
                            <span className="text-sm font-medium">$4,150</span>
                            <Badge variant="default" className="bg-green-500 text-xs">Paid</Badge>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              className="h-8 w-8"
                              data-testid={`button-download-invoice-${i}`}
                            >
                              <Download className="h-3 w-3" />
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