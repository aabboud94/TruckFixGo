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
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
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
  Users,
  Clock,
  Wrench
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

// Batch scheduling schema
const batchScheduleSchema = z.object({
  vehicleIds: z.array(z.string()).min(1, "Select at least one vehicle"),
  serviceType: z.string().min(1, "Service type is required"),
  scheduledDate: z.string().min(1, "Scheduled date is required"),
  urgency: z.enum(['routine', 'urgent', 'emergency']),
  description: z.string().optional(),
  estimatedDuration: z.string().optional()
});

type BatchScheduleForm = z.infer<typeof batchScheduleSchema>;

// PM Schedule schema
const pmScheduleSchema = z.object({
  vehicleId: z.string().min(1, "Vehicle is required"),
  serviceType: z.string().min(1, "Service type is required"),
  frequency: z.enum(['weekly', 'monthly', 'quarterly', 'annually']),
  nextServiceDate: z.string().min(1, "Next service date is required"),
  lastServiceDate: z.string().optional(),
  notes: z.string().optional()
});

type PmScheduleForm = z.infer<typeof pmScheduleSchema>;

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
  const [isBatchScheduleDialogOpen, setIsBatchScheduleDialogOpen] = useState(false);
  const [isPmScheduleDialogOpen, setIsPmScheduleDialogOpen] = useState(false);
  const [selectedVehicleIds, setSelectedVehicleIds] = useState<string[]>([]);

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

  const batchScheduleForm = useForm<BatchScheduleForm>({
    resolver: zodResolver(batchScheduleSchema),
    defaultValues: {
      vehicleIds: [],
      serviceType: "",
      scheduledDate: "",
      urgency: "routine",
      description: "",
      estimatedDuration: "120"
    }
  });

  const pmScheduleForm = useForm<PmScheduleForm>({
    resolver: zodResolver(pmScheduleSchema),
    defaultValues: {
      vehicleId: "",
      serviceType: "",
      frequency: "monthly",
      nextServiceDate: "",
      lastServiceDate: "",
      notes: ""
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

  // Batch scheduling mutation
  const batchScheduleMutation = useMutation({
    mutationFn: async (data: BatchScheduleForm) => {
      if (!fleetId) throw new Error('Fleet ID not available');
      const payload = {
        ...data,
        estimatedDuration: data.estimatedDuration ? parseInt(data.estimatedDuration) : undefined
      };
      return await apiRequest('POST', `/api/fleet/${fleetId}/batch-jobs`, payload);
    },
    onSuccess: (response) => {
      toast({
        title: "Jobs Scheduled",
        description: response.message || "Successfully scheduled maintenance jobs"
      });
      setIsBatchScheduleDialogOpen(false);
      setSelectedVehicleIds([]);
      batchScheduleForm.reset();
      queryClient.invalidateQueries({ queryKey: ['/api/jobs'] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Schedule Jobs",
        description: error.message || "An error occurred. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Get PM schedules query
  const { data: pmSchedulesData, refetch: refetchPmSchedules } = useQuery({
    queryKey: [`/api/fleet/${fleetId}/pm-schedules`],
    enabled: !!fleetId,
    queryFn: async () => {
      if (!fleetId) return { schedules: [] };
      try {
        return await apiRequest('GET', `/api/fleet/${fleetId}/pm-schedules`);
      } catch (error) {
        console.error('Failed to fetch PM schedules:', error);
        return { schedules: [] };
      }
    }
  });

  const pmSchedules = pmSchedulesData?.schedules || [];

  // Create PM schedule mutation
  const createPmScheduleMutation = useMutation({
    mutationFn: async (data: PmScheduleForm) => {
      if (!fleetId) throw new Error('Fleet ID not available');
      return await apiRequest('POST', `/api/fleet/${fleetId}/pm-schedules`, data);
    },
    onSuccess: () => {
      toast({
        title: "PM Schedule Created",
        description: "Successfully created preventive maintenance schedule"
      });
      setIsPmScheduleDialogOpen(false);
      pmScheduleForm.reset();
      refetchPmSchedules();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Create PM Schedule",
        description: error.message || "An error occurred. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Delete PM schedule mutation
  const deletePmScheduleMutation = useMutation({
    mutationFn: async (scheduleId: string) => {
      if (!fleetId) throw new Error('Fleet ID not available');
      return await apiRequest('DELETE', `/api/fleet/${fleetId}/pm-schedules/${scheduleId}`);
    },
    onSuccess: () => {
      toast({
        title: "PM Schedule Deleted",
        description: "Successfully deleted preventive maintenance schedule"
      });
      refetchPmSchedules();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Delete PM Schedule",
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

  const handleBatchSchedule = async (data: BatchScheduleForm) => {
    batchScheduleMutation.mutate(data);
  };

  const handlePmSchedule = async (data: PmScheduleForm) => {
    createPmScheduleMutation.mutate(data);
  };

  const toggleVehicleSelection = (vehicleId: string) => {
    setSelectedVehicleIds(prev => 
      prev.includes(vehicleId)
        ? prev.filter(id => id !== vehicleId)
        : [...prev, vehicleId]
    );
  };

  const selectAllVehicles = () => {
    if (selectedVehicleIds.length === vehicles.length) {
      setSelectedVehicleIds([]);
    } else {
      setSelectedVehicleIds(vehicles.map((v: Vehicle) => v.id));
    }
  };

  const handleImportCSV = () => {
    toast({
      title: "CSV Import",
      description: "CSV import functionality will be available soon"
    });
  };

  const handleExportCSV = async () => {
    if (!fleetId) {
      toast({
        title: "Export Failed",
        description: "No fleet account found",
        variant: "destructive"
      });
      return;
    }

    try {
      // Call server-side export endpoint
      const response = await fetch(`/api/fleet/${fleetId}/vehicles/export`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Accept': 'text/csv'
        }
      });

      if (!response.ok) {
        throw new Error('Export failed');
      }

      // Get filename from Content-Disposition header
      const contentDisposition = response.headers.get('Content-Disposition');
      const filenameMatch = contentDisposition?.match(/filename="?(.+?)"?$/);
      const filename = filenameMatch ? filenameMatch[1] : `fleet-vehicles-${Date.now()}.csv`;

      // Create blob and download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Export Successful",
        description: `Vehicles exported to ${filename}`,
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export vehicles. Please try again.",
        variant: "destructive"
      });
    }
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
              <Button 
                variant="outline" 
                onClick={() => {
                  if (selectedVehicleIds.length === 0) {
                    toast({
                      title: "No Vehicles Selected",
                      description: "Please select vehicles from the table first",
                      variant: "destructive"
                    });
                    return;
                  }
                  batchScheduleForm.setValue('vehicleIds', selectedVehicleIds);
                  setIsBatchScheduleDialogOpen(true);
                }}
                disabled={selectedVehicleIds.length === 0}
                data-testid="button-batch-schedule"
              >
                <Calendar className="h-4 w-4 mr-2" />
                Batch Schedule ({selectedVehicleIds.length})
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setIsPmScheduleDialogOpen(true)}
                data-testid="button-pm-schedule"
              >
                <Clock className="h-4 w-4 mr-2" />
                PM Schedule
              </Button>
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
                        <TableHead className="w-[50px]">
                          <Checkbox 
                            checked={selectedVehicleIds.length === vehicles.length && vehicles.length > 0}
                            onCheckedChange={selectAllVehicles}
                            data-testid="checkbox-select-all"
                          />
                        </TableHead>
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
                          <TableCell>
                            <Checkbox 
                              checked={selectedVehicleIds.includes(vehicle.id)}
                              onCheckedChange={() => toggleVehicleSelection(vehicle.id)}
                              data-testid={`checkbox-vehicle-${vehicle.id}`}
                            />
                          </TableCell>
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

      {/* Batch Scheduling Dialog */}
      <Dialog open={isBatchScheduleDialogOpen} onOpenChange={setIsBatchScheduleDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Schedule Batch Maintenance</DialogTitle>
            <DialogDescription>
              Schedule maintenance for {selectedVehicleIds.length} selected vehicle(s)
            </DialogDescription>
          </DialogHeader>
          <Form {...batchScheduleForm}>
            <form onSubmit={batchScheduleForm.handleSubmit(handleBatchSchedule)} className="space-y-4">
              <FormField
                control={batchScheduleForm.control}
                name="serviceType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Service Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-batch-service-type">
                          <SelectValue placeholder="Select service type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Oil Change">Oil Change</SelectItem>
                        <SelectItem value="Tire Rotation">Tire Rotation</SelectItem>
                        <SelectItem value="Brake Inspection">Brake Inspection</SelectItem>
                        <SelectItem value="DOT Inspection">DOT Inspection</SelectItem>
                        <SelectItem value="General Maintenance">General Maintenance</SelectItem>
                        <SelectItem value="Engine Service">Engine Service</SelectItem>
                        <SelectItem value="Transmission Service">Transmission Service</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={batchScheduleForm.control}
                name="scheduledDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Scheduled Date</FormLabel>
                    <FormControl>
                      <Input 
                        type="date" 
                        {...field} 
                        data-testid="input-batch-scheduled-date"
                        min={new Date().toISOString().split('T')[0]}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={batchScheduleForm.control}
                name="urgency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Urgency Level</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-batch-urgency">
                          <SelectValue placeholder="Select urgency" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="routine">Routine</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                        <SelectItem value="emergency">Emergency</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={batchScheduleForm.control}
                name="estimatedDuration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estimated Duration (minutes)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        {...field} 
                        placeholder="120" 
                        data-testid="input-batch-duration"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={batchScheduleForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field} 
                        placeholder="Additional notes or special instructions..." 
                        data-testid="textarea-batch-description"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsBatchScheduleDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  data-testid="button-submit-batch-schedule"
                  disabled={batchScheduleMutation.isPending}
                >
                  {batchScheduleMutation.isPending ? "Scheduling..." : "Schedule Maintenance"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* PM Scheduling Dialog */}
      <Dialog open={isPmScheduleDialogOpen} onOpenChange={setIsPmScheduleDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create PM Schedule</DialogTitle>
            <DialogDescription>
              Set up a recurring preventive maintenance schedule for a vehicle
            </DialogDescription>
          </DialogHeader>
          <Form {...pmScheduleForm}>
            <form onSubmit={pmScheduleForm.handleSubmit(handlePmSchedule)} className="space-y-4">
              <FormField
                control={pmScheduleForm.control}
                name="vehicleId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vehicle</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-pm-vehicle">
                          <SelectValue placeholder="Select vehicle" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {vehicles.map((vehicle: Vehicle) => (
                          <SelectItem key={vehicle.id} value={vehicle.id}>
                            {vehicle.unitNumber} - {vehicle.make} {vehicle.model}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={pmScheduleForm.control}
                name="serviceType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Service Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-pm-service-type">
                          <SelectValue placeholder="Select service type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Oil Change">Oil Change</SelectItem>
                        <SelectItem value="Tire Rotation">Tire Rotation</SelectItem>
                        <SelectItem value="Brake Inspection">Brake Inspection</SelectItem>
                        <SelectItem value="DOT Inspection">DOT Inspection</SelectItem>
                        <SelectItem value="General Maintenance">General Maintenance</SelectItem>
                        <SelectItem value="Engine Service">Engine Service</SelectItem>
                        <SelectItem value="Transmission Service">Transmission Service</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={pmScheduleForm.control}
                name="frequency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Frequency</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-pm-frequency">
                          <SelectValue placeholder="Select frequency" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="quarterly">Quarterly</SelectItem>
                        <SelectItem value="annually">Annually</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={pmScheduleForm.control}
                name="nextServiceDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Next Service Date</FormLabel>
                    <FormControl>
                      <Input 
                        type="date" 
                        {...field} 
                        data-testid="input-pm-next-date"
                        min={new Date().toISOString().split('T')[0]}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={pmScheduleForm.control}
                name="lastServiceDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Service Date (Optional)</FormLabel>
                    <FormControl>
                      <Input 
                        type="date" 
                        {...field} 
                        data-testid="input-pm-last-date"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={pmScheduleForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes (Optional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field} 
                        placeholder="Additional notes about this PM schedule..." 
                        data-testid="textarea-pm-notes"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsPmScheduleDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  data-testid="button-submit-pm-schedule"
                  disabled={createPmScheduleMutation.isPending}
                >
                  {createPmScheduleMutation.isPending ? "Creating..." : "Create PM Schedule"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}