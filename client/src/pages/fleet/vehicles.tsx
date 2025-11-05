import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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

export default function VehicleManagement() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);

  // Mock data - would come from API
  const vehicles = [
    {
      id: "1",
      unitNumber: "T-101",
      vin: "1HGCM82633A123456",
      year: "2022",
      make: "Freightliner",
      model: "Cascadia",
      vehicleType: "Semi Truck",
      licensePlate: "CA 12345",
      currentOdometer: "125,000",
      lastService: "2024-01-15",
      nextPMDue: "2024-02-15",
      status: "active",
      assignedDriver: "John Doe",
      serviceHistory: [
        { date: "2024-01-15", type: "A-Service", cost: "$150" },
        { date: "2023-12-10", type: "B-Service", cost: "$300" },
        { date: "2023-11-05", type: "Tire Replacement", cost: "$800" }
      ]
    },
    {
      id: "2",
      unitNumber: "T-102",
      vin: "1HGCM82633A123457",
      year: "2021",
      make: "Peterbilt",
      model: "579",
      vehicleType: "Semi Truck",
      licensePlate: "CA 12346",
      currentOdometer: "150,000",
      lastService: "2024-01-10",
      nextPMDue: "2024-02-10",
      status: "in_service",
      assignedDriver: "Jane Smith",
      serviceHistory: [
        { date: "2024-01-10", type: "C-Service", cost: "$500" },
        { date: "2023-12-01", type: "A-Service", cost: "$150" }
      ]
    }
  ];

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

  const onSubmit = async (data: VehicleForm) => {
    try {
      console.log("Vehicle data:", data);
      
      toast({
        title: isEditDialogOpen ? "Vehicle Updated" : "Vehicle Added",
        description: `Successfully ${isEditDialogOpen ? 'updated' : 'added'} vehicle ${data.unitNumber}`
      });
      
      setIsAddDialogOpen(false);
      setIsEditDialogOpen(false);
      form.reset();
    } catch (error) {
      toast({
        title: "Operation Failed",
        description: "An error occurred. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleEdit = (vehicle: any) => {
    setSelectedVehicle(vehicle);
    form.reset({
      vin: vehicle.vin,
      unitNumber: vehicle.unitNumber,
      year: vehicle.year,
      make: vehicle.make,
      model: vehicle.model,
      vehicleType: vehicle.vehicleType,
      licensePlate: vehicle.licensePlate,
      currentOdometer: vehicle.currentOdometer,
      assignedDriver: vehicle.assignedDriver
    });
    setIsEditDialogOpen(true);
  };

  const handleDelete = (vehicle: any) => {
    toast({
      title: "Vehicle Removed",
      description: `Successfully removed vehicle ${vehicle.unitNumber} from your fleet`
    });
  };

  const handleImportCSV = () => {
    toast({
      title: "CSV Import",
      description: "CSV import functionality would open here"
    });
  };

  const handleExportCSV = () => {
    toast({
      title: "CSV Export",
      description: "Exporting vehicle list to CSV..."
    });
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
                  <Button data-testid="button-add-vehicle">
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
                                  <SelectItem value="semi-truck">Semi Truck</SelectItem>
                                  <SelectItem value="box-truck">Box Truck</SelectItem>
                                  <SelectItem value="flatbed">Flatbed</SelectItem>
                                  <SelectItem value="refrigerated">Refrigerated</SelectItem>
                                  <SelectItem value="tanker">Tanker</SelectItem>
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
                                  <SelectItem value="">Unassigned</SelectItem>
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
                        <Button type="submit" data-testid="button-save-vehicle">Save Vehicle</Button>
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
              <div className="text-2xl font-bold">24</div>
              <p className="text-xs text-muted-foreground">2 added this month</p>
            </CardContent>
          </Card>

          <Card data-testid="stat-active">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active</CardTitle>
              <Truck className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">22</div>
              <p className="text-xs text-muted-foreground">91.7% of fleet</p>
            </CardContent>
          </Card>

          <Card data-testid="stat-pm-due">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">PM Due Soon</CardTitle>
              <Calendar className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">5</div>
              <p className="text-xs text-muted-foreground">Within 7 days</p>
            </CardContent>
          </Card>

          <Card data-testid="stat-drivers">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Assigned Drivers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">18</div>
              <p className="text-xs text-muted-foreground">6 unassigned vehicles</p>
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
                <TabsTrigger value="service" data-testid="tab-service">In Service</TabsTrigger>
                <TabsTrigger value="inactive" data-testid="tab-inactive">Inactive</TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="mt-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Unit #</TableHead>
                      <TableHead>VIN</TableHead>
                      <TableHead>Make/Model</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Driver</TableHead>
                      <TableHead>Next PM</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {vehicles.map((vehicle) => (
                      <TableRow key={vehicle.id} data-testid={`vehicle-row-${vehicle.id}`}>
                        <TableCell className="font-medium">{vehicle.unitNumber}</TableCell>
                        <TableCell className="font-mono text-xs">{vehicle.vin}</TableCell>
                        <TableCell>{vehicle.make} {vehicle.model}</TableCell>
                        <TableCell>{vehicle.vehicleType}</TableCell>
                        <TableCell>{vehicle.assignedDriver || "-"}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {new Date(vehicle.nextPMDue) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) && (
                              <AlertCircle className="h-4 w-4 text-yellow-500" />
                            )}
                            {vehicle.nextPMDue}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={vehicle.status === "active" ? "default" : "secondary"}>
                            {vehicle.status === "active" ? "Active" : "In Service"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => handleEdit(vehicle)}
                              data-testid={`button-edit-${vehicle.id}`}
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
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
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
                  name="assignedDriver"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel>Assigned Driver</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-edit-driver">
                            <SelectValue placeholder="Select driver" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="">Unassigned</SelectItem>
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
                <Button type="submit" data-testid="button-update-vehicle">Update Vehicle</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}