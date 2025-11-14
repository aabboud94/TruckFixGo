import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  Plus,
  Upload,
  Download,
  Edit,
  Trash2,
  Truck,
  Calendar,
  AlertCircle,
  FileText,
  Users
} from "lucide-react";

const vehicleSchema = z.object({
  vin: z.string().min(17, "VIN must be 17 characters").max(17),
  unitNumber: z.string().min(1, "Unit number is required"),
  year: z.string().min(4, "Year is required"),
  make: z.string().min(1, "Make is required"),
  model: z.string().min(1, "Model is required"),
  vehicleType: z.string().min(1, "Vehicle type is required"),
  licensePlate: z.string().min(1, "License plate is required"),
  currentOdometer: z.string().min(1, "Odometer reading is required"),
  assignedDriver: z.string().optional()
});

type VehicleForm = z.infer<typeof vehicleSchema>;

interface Vehicle {
  id: string;
  fleetAccountId: string;
  vin: string;
  unitNumber: string;
  year: number;
  make: string;
  model: string;
  vehicleType: string;
  licensePlate: string;
  currentOdometer: number;
  lastServiceDate?: string;
  nextServiceDue?: string;
  isActive: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export default function VehicleManagement() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);

  // Get fleet account first
  const { data: fleetAccounts, isLoading: isLoadingFleet } = useQuery({
    queryKey: ['/api/fleet/accounts'],
    enabled: true,
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/fleet/accounts');
      // Return the first fleet account (in production, handle multiple accounts)
      return response.fleets?.[0] || null;
    }
  });

  const fleetId = fleetAccounts?.id;

  // Fetch vehicles for the fleet
  const { data: vehiclesData, isLoading: isLoadingVehicles, refetch: refetchVehicles } = useQuery({
    queryKey: [`/api/fleet/${fleetId}/vehicles`],
    enabled: !!fleetId,
    queryFn: async () => {
      if (!fleetId) return { vehicles: [] };
      try {
        return await apiRequest('GET', `/api/fleet/${fleetId}/vehicles`);
      } catch (error) {
        console.error('Failed to fetch vehicles:', error);
        return { vehicles: [] };
      }
    }
  });

  const vehicles = vehiclesData?.vehicles || [];

  // Mock drivers data - in production, fetch from API
  const drivers = [
    { id: "d1", name: "John Doe" },
    { id: "d2", name: "Jane Smith" },
    { id: "d3", name: "Bob Johnson" },
    { id: "d4", name: "Alice Williams" }
  ];

  const form = useForm<VehicleForm>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: {
      vin: "",
      unitNumber: "",
      year: "",
      make: "",
      model: "",
      vehicleType: "",
      licensePlate: "",
      currentOdometer: "",
      assignedDriver: ""
    }
  });

  // Add vehicle mutation
  const addVehicleMutation = useMutation({
    mutationFn: async (data: VehicleForm) => {
      if (!fleetId) throw new Error('Fleet ID not available');
      // Convert numeric fields from strings to numbers
      const payload = {
        ...data,
        year: parseInt(data.year),
        currentOdometer: parseInt(data.currentOdometer)
      };
      return await apiRequest('POST', `/api/fleet/${fleetId}/vehicles`, payload);
    },
    onSuccess: () => {
      toast({
        title: "Vehicle Added",
        description: "Successfully added vehicle to your fleet"
      });
      refetchVehicles();
      setIsAddDialogOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Add Vehicle",
        description: error.message || "An error occurred. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Update vehicle mutation
  const updateVehicleMutation = useMutation({
    mutationFn: async ({ vehicleId, data }: { vehicleId: string; data: VehicleForm }) => {
      if (!fleetId) throw new Error('Fleet ID not available');
      // Convert numeric fields from strings to numbers
      const payload = {
        ...data,
        year: parseInt(data.year),
        currentOdometer: parseInt(data.currentOdometer)
      };
      return await apiRequest('PUT', `/api/fleet/${fleetId}/vehicles/${vehicleId}`, payload);
    },
    onSuccess: () => {
      toast({
        title: "Vehicle Updated",
        description: "Successfully updated vehicle information"
      });
      refetchVehicles();
      setIsEditDialogOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Update Vehicle",
        description: error.message || "An error occurred. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Delete vehicle mutation
  const deleteVehicleMutation = useMutation({
    mutationFn: async (vehicleId: string) => {
      if (!fleetId) throw new Error('Fleet ID not available');
      return await apiRequest('DELETE', `/api/fleet/${fleetId}/vehicles/${vehicleId}`);
    },
    onSuccess: (_, vehicleId) => {
      const vehicle = vehicles.find((v: Vehicle) => v.id === vehicleId);
      toast({
        title: "Vehicle Removed",
        description: `Successfully removed vehicle ${vehicle?.unitNumber || ''} from your fleet`
      });
      refetchVehicles();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Delete Vehicle",
        description: error.message || "An error occurred. Please try again.",
        variant: "destructive"
      });
    }
  });

  const onSubmit = async (data: VehicleForm) => {
    if (isEditDialogOpen && selectedVehicle) {
      updateVehicleMutation.mutate({ vehicleId: selectedVehicle.id, data });
    } else {
      addVehicleMutation.mutate(data);
    }
  };

  const handleEdit = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    form.reset({
      vin: vehicle.vin || "",
      unitNumber: vehicle.unitNumber || "",
      year: vehicle.year?.toString() || "",
      make: vehicle.make || "",
      model: vehicle.model || "",
      vehicleType: vehicle.vehicleType || "",
      licensePlate: vehicle.licensePlate || "",
      currentOdometer: vehicle.currentOdometer?.toString() || "",
      assignedDriver: ""
    });
    setIsEditDialogOpen(true);
  };

  const handleDelete = (vehicle: Vehicle) => {
    if (confirm(`Are you sure you want to delete vehicle ${vehicle.unitNumber}?`)) {
      deleteVehicleMutation.mutate(vehicle.id);
    }
  };

  const handleImportCSV = () => {
    toast({
      title: "CSV Import",
      description: "CSV import functionality will be available soon"
    });
  };

  const handleExportCSV = () => {
    if (vehicles.length === 0) {
      toast({
        title: "No Data",
        description: "No vehicles to export",
        variant: "destructive"
      });
      return;
    }
    
    // Create CSV content
    const headers = ['Unit Number', 'VIN', 'Year', 'Make', 'Model', 'Type', 'License Plate', 'Odometer'];
    const rows = vehicles.map((v: Vehicle) => [
      v.unitNumber,
      v.vin,
      v.year,
      v.make,
      v.model,
      v.vehicleType,
      v.licensePlate,
      v.currentOdometer
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `vehicles_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    
    toast({
      title: "Export Successful",
      description: `Exported ${vehicles.length} vehicles to CSV`
    });
  };

  // Calculate stats
  const stats = {
    totalVehicles: vehicles.length,
    activeVehicles: vehicles.filter((v: Vehicle) => v.isActive).length,
    pmDueSoon: vehicles.filter((v: Vehicle) => {
      if (!v.nextServiceDue) return false;
      const dueDate = new Date(v.nextServiceDue);
      const weekFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      return dueDate < weekFromNow;
    }).length,
    unassignedVehicles: vehicles.length // In production, track assigned drivers
  };

  if (!fleetId && !isLoadingFleet) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-6">
            <AlertCircle className="h-8 w-8 text-yellow-500 mx-auto mb-4" />
            <p className="text-center">No fleet account found. Please contact support.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

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
              <span className="ml-4 text-2xl font-bold text-primary">Vehicle Management</span>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" onClick={handleImportCSV} data-testid="button-import">
                <Upload className="h-4 w-4 mr-2" />
                Import CSV
              </Button>
              <Button variant="outline" onClick={handleExportCSV} data-testid="button-export">
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button data-testid="button-add-vehicle" disabled={!fleetId}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Vehicle
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Add New Vehicle</DialogTitle>
                    <DialogDescription>
                      Enter the details of the vehicle to add to your fleet
                    </DialogDescription>
                  </DialogHeader>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="unitNumber"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Unit Number</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="T-105" data-testid="input-unit-number" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="vin"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>VIN</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="17 characters" maxLength={17} data-testid="input-vin" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="year"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Year</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="2024" data-testid="input-year" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="make"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Make</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="Freightliner" data-testid="input-make" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="model"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Model</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="Cascadia" data-testid="input-model" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="vehicleType"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Vehicle Type</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger data-testid="select-vehicle-type">
                                    <SelectValue placeholder="Select type" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="Semi Truck">Semi Truck</SelectItem>
                                  <SelectItem value="Box Truck">Box Truck</SelectItem>
                                  <SelectItem value="Flatbed">Flatbed</SelectItem>
                                  <SelectItem value="Refrigerated">Refrigerated</SelectItem>
                                  <SelectItem value="Tanker">Tanker</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="licensePlate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>License Plate</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="CA 12345" data-testid="input-license" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="currentOdometer"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Current Odometer</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="125000" data-testid="input-odometer" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="assignedDriver"
                          render={({ field }) => (
                            <FormItem className="col-span-2">
                              <FormLabel>Assigned Driver (Optional)</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger data-testid="select-driver">
                                    <SelectValue placeholder="Select driver" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="unassigned">Unassigned</SelectItem>
                                  {drivers.map((driver) => (
                                    <SelectItem key={driver.id} value={driver.name}>
                                      {driver.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button 
                          type="submit" 
                          data-testid="button-save-vehicle"
                          disabled={addVehicleMutation.isPending}
                        >
                          {addVehicleMutation.isPending ? "Saving..." : "Save Vehicle"}
                        </Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card data-testid="stat-total-vehicles">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Vehicles</CardTitle>
              <Truck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalVehicles}</div>
              <p className="text-xs text-muted-foreground">In your fleet</p>
            </CardContent>
          </Card>

          <Card data-testid="stat-active">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active</CardTitle>
              <Truck className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeVehicles}</div>
              <p className="text-xs text-muted-foreground">
                {stats.totalVehicles > 0 
                  ? `${Math.round((stats.activeVehicles / stats.totalVehicles) * 100)}% of fleet`
                  : 'No vehicles'}
              </p>
            </CardContent>
          </Card>

          <Card data-testid="stat-pm-due">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">PM Due Soon</CardTitle>
              <Calendar className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pmDueSoon}</div>
              <p className="text-xs text-muted-foreground">Within 7 days</p>
            </CardContent>
          </Card>

          <Card data-testid="stat-drivers">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Unassigned</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.unassignedVehicles}</div>
              <p className="text-xs text-muted-foreground">Vehicles without drivers</p>
            </CardContent>
          </Card>
        </div>

        {/* Vehicle Table */}
        <Card>
          <CardHeader>
            <CardTitle>Fleet Vehicles</CardTitle>
            <CardDescription>
              Manage your fleet vehicles, assignments, and maintenance schedules
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="all" className="w-full">
              <TabsList>
                <TabsTrigger value="all" data-testid="tab-all">All Vehicles</TabsTrigger>
                <TabsTrigger value="active" data-testid="tab-active">Active</TabsTrigger>
                <TabsTrigger value="inactive" data-testid="tab-inactive">Inactive</TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="mt-4">
                {isLoadingVehicles ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : vehicles.length === 0 ? (
                  <div className="text-center py-8">
                    <Truck className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No vehicles found</p>
                    <p className="text-sm text-muted-foreground mt-2">Add your first vehicle to get started</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Unit #</TableHead>
                        <TableHead>VIN</TableHead>
                        <TableHead>Make/Model</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>License Plate</TableHead>
                        <TableHead>Odometer</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {vehicles.map((vehicle: Vehicle) => (
                        <TableRow key={vehicle.id} data-testid={`vehicle-row-${vehicle.id}`}>
                          <TableCell className="font-medium">{vehicle.unitNumber}</TableCell>
                          <TableCell className="font-mono text-xs">{vehicle.vin}</TableCell>
                          <TableCell>{vehicle.make} {vehicle.model}</TableCell>
                          <TableCell>{vehicle.vehicleType}</TableCell>
                          <TableCell>{vehicle.licensePlate}</TableCell>
                          <TableCell>{vehicle.currentOdometer?.toLocaleString()}</TableCell>
                          <TableCell>
                            <Badge variant={vehicle.isActive ? "default" : "secondary"}>
                              {vehicle.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => handleEdit(vehicle)}
                                data-testid={`button-edit-${vehicle.id}`}
                                disabled={updateVehicleMutation.isPending}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => setLocation(`/fleet/vehicles/${vehicle.id}`)}
                                data-testid={`button-history-${vehicle.id}`}
                              >
                                <FileText className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => handleDelete(vehicle)}
                                data-testid={`button-delete-${vehicle.id}`}
                                disabled={deleteVehicleMutation.isPending}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </TabsContent>

              <TabsContent value="active" className="mt-4">
                {isLoadingVehicles ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Unit #</TableHead>
                        <TableHead>VIN</TableHead>
                        <TableHead>Make/Model</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {vehicles
                        .filter((v: Vehicle) => v.isActive)
                        .map((vehicle: Vehicle) => (
                          <TableRow key={vehicle.id}>
                            <TableCell className="font-medium">{vehicle.unitNumber}</TableCell>
                            <TableCell className="font-mono text-xs">{vehicle.vin}</TableCell>
                            <TableCell>{vehicle.make} {vehicle.model}</TableCell>
                            <TableCell>{vehicle.vehicleType}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  onClick={() => handleEdit(vehicle)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  onClick={() => handleDelete(vehicle)}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                )}
              </TabsContent>

              <TabsContent value="inactive" className="mt-4">
                {isLoadingVehicles ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Unit #</TableHead>
                        <TableHead>VIN</TableHead>
                        <TableHead>Make/Model</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {vehicles
                        .filter((v: Vehicle) => !v.isActive)
                        .map((vehicle: Vehicle) => (
                          <TableRow key={vehicle.id}>
                            <TableCell className="font-medium">{vehicle.unitNumber}</TableCell>
                            <TableCell className="font-mono text-xs">{vehicle.vin}</TableCell>
                            <TableCell>{vehicle.make} {vehicle.model}</TableCell>
                            <TableCell>{vehicle.vehicleType}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  onClick={() => handleEdit(vehicle)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  onClick={() => handleDelete(vehicle)}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Vehicle</DialogTitle>
            <DialogDescription>
              Update the details of the vehicle
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="unitNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unit Number</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="T-105" data-testid="input-edit-unit-number" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="vin"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>VIN</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="17 characters" maxLength={17} data-testid="input-edit-vin" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="year"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Year</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="2024" data-testid="input-edit-year" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="make"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Make</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Freightliner" data-testid="input-edit-make" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="model"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Model</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Cascadia" data-testid="input-edit-model" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="vehicleType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vehicle Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-edit-vehicle-type">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Semi Truck">Semi Truck</SelectItem>
                          <SelectItem value="Box Truck">Box Truck</SelectItem>
                          <SelectItem value="Flatbed">Flatbed</SelectItem>
                          <SelectItem value="Refrigerated">Refrigerated</SelectItem>
                          <SelectItem value="Tanker">Tanker</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="licensePlate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>License Plate</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="CA 12345" data-testid="input-edit-license" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="currentOdometer"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Current Odometer</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="125000" data-testid="input-edit-odometer" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="assignedDriver"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel>Assigned Driver (Optional)</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-edit-driver">
                            <SelectValue placeholder="Select driver" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="unassigned">Unassigned</SelectItem>
                          {drivers.map((driver) => (
                            <SelectItem key={driver.id} value={driver.name}>
                              {driver.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  data-testid="button-update-vehicle"
                  disabled={updateVehicleMutation.isPending}
                >
                  {updateVehicleMutation.isPending ? "Updating..." : "Update Vehicle"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}