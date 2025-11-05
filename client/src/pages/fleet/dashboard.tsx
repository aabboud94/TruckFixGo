import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar } from "@/components/ui/calendar";
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
  TrendingUp
} from "lucide-react";

export default function FleetDashboard() {
  const [, setLocation] = useLocation();
  const [date, setDate] = useState<Date | undefined>(new Date());

  // Mock data - would come from API
  const stats = {
    activeVehicles: 24,
    scheduledServices: 8,
    monthlySpend: "$12,450",
    complianceRate: "98%"
  };

  const vehicles = [
    {
      id: "1",
      unitNumber: "T-101",
      vin: "1HGCM82633A123456",
      make: "Freightliner",
      model: "Cascadia",
      lastService: "2024-01-15",
      nextPMDue: "2024-02-15",
      status: "active",
      location: "Los Angeles, CA"
    },
    {
      id: "2",
      unitNumber: "T-102",
      vin: "1HGCM82633A123457",
      make: "Peterbilt",
      model: "579",
      lastService: "2024-01-10",
      nextPMDue: "2024-02-10",
      status: "in_service",
      location: "Phoenix, AZ"
    },
    {
      id: "3",
      unitNumber: "T-103",
      vin: "1HGCM82633A123458",
      make: "Kenworth",
      model: "T680",
      lastService: "2024-01-20",
      nextPMDue: "2024-02-20",
      status: "active",
      location: "Las Vegas, NV"
    }
  ];

  const scheduledServices = [
    {
      id: "1",
      date: "2024-02-10",
      time: "09:00 AM",
      vehicle: "T-102",
      service: "B-Service PM",
      location: "On-site",
      status: "confirmed"
    },
    {
      id: "2",
      date: "2024-02-15",
      time: "10:00 AM",
      vehicle: "T-101",
      service: "A-Service PM",
      location: "Service Center",
      status: "pending"
    }
  ];

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
          <p className="text-muted-foreground">Welcome back, ABC Trucking Inc.</p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card data-testid="stat-card-vehicles">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Vehicles</CardTitle>
              <Truck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeVehicles}</div>
              <p className="text-xs text-muted-foreground">2 in service</p>
            </CardContent>
          </Card>

          <Card data-testid="stat-card-scheduled">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Scheduled Services</CardTitle>
              <CalendarIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.scheduledServices}</div>
              <p className="text-xs text-muted-foreground">Next: Tomorrow 9AM</p>
            </CardContent>
          </Card>

          <Card data-testid="stat-card-spend">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Spend</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.monthlySpend}</div>
              <p className="text-xs text-green-600">-12% from last month</p>
            </CardContent>
          </Card>

          <Card data-testid="stat-card-compliance">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Compliance Rate</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.complianceRate}</div>
              <p className="text-xs text-muted-foreground">3 inspections due</p>
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
                    {vehicles.map((vehicle) => (
                      <TableRow key={vehicle.id} data-testid={`vehicle-row-${vehicle.id}`}>
                        <TableCell className="font-medium">{vehicle.unitNumber}</TableCell>
                        <TableCell>{vehicle.make} {vehicle.model}</TableCell>
                        <TableCell>{vehicle.lastService}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {new Date(vehicle.nextPMDue) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) && (
                              <AlertCircle className="h-4 w-4 text-yellow-500" />
                            )}
                            {vehicle.nextPMDue}
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(vehicle.status)}</TableCell>
                        <TableCell>{vehicle.location}</TableCell>
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
                    ))}
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
                    {scheduledServices.map((service) => (
                      <div key={service.id} className="flex items-center justify-between p-4 border rounded-lg" data-testid={`service-item-${service.id}`}>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{service.date} at {service.time}</span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {service.vehicle} - {service.service}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Location: {service.location}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(service.status)}
                          <Button variant="ghost" size="icon" data-testid={`button-view-service-${service.id}`}>
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
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