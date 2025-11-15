import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
  Wrench,
  Package,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Eye,
  History,
  ShieldAlert,
  DollarSign,
  CalendarClock,
  Tool,
  X,
  Info
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

// Parts inventory schema
const partSchema = z.object({
  partName: z.string().min(1, "Part name is required"),
  partNumber: z.string().min(1, "Part number is required"),
  quantity: z.string().min(1, "Quantity is required"),
  unitCost: z.string().min(1, "Unit cost is required"),
  category: z.string().min(1, "Category is required"),
  minimumStock: z.string().optional(),
  location: z.string().optional(),
  notes: z.string().optional()
});

type PartForm = z.infer<typeof partSchema>;

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
  // Enhanced fields
  maintenanceStatus?: 'good' | 'attention' | 'critical';
  activeAlertCount?: number;
}

interface MaintenancePrediction {
  id: string;
  predictionType: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  recommendedAction: string;
  predictedDate: string;
  confidence: number;
  estimatedCost?: number;
}

interface MaintenanceAlert {
  id: string;
  alertType: string;
  severity: 'info' | 'warning' | 'critical';
  message: string;
  createdAt: string;
  isActive: boolean;
}

interface ServiceHistoryItem {
  id: string;
  serviceDate: string;
  serviceType: string;
  cost: number;
  notes?: string;
  performedBy?: string;
  odometer?: number;
  isScheduled?: boolean;
  isOverdue?: boolean;
}

interface PartsInventoryItem {
  id: string;
  partName: string;
  partNumber: string;
  quantity: number;
  unitCost: number;
  totalValue: number;
  category: string;
  minimumStock?: number;
  location?: string;
  notes?: string;
  lastUpdated: string;
}

// Component for Vehicle Detail View
function VehicleDetailView({ 
  vehicle, 
  onClose 
}: { 
  vehicle: Vehicle; 
  onClose: () => void;
}) {
  const { toast } = useToast();
  const [isAddPartDialogOpen, setIsAddPartDialogOpen] = useState(false);
  
  const partForm = useForm<PartForm>({
    resolver: zodResolver(partSchema),
    defaultValues: {
      partName: "",
      partNumber: "",
      quantity: "",
      unitCost: "",
      category: "",
      minimumStock: "5",
      location: "",
      notes: ""
    }
  });

  // Fetch maintenance predictions
  const { data: predictionsData, isLoading: isLoadingPredictions } = useQuery({
    queryKey: [`/api/fleet/vehicles/${vehicle.id}/maintenance/predictions`],
    queryFn: async () => {
      try {
        return await apiRequest('GET', `/api/fleet/vehicles/${vehicle.id}/maintenance/predictions`);
      } catch (error) {
        console.error('Failed to fetch predictions:', error);
        return { predictions: [] };
      }
    }
  });

  // Fetch maintenance alerts
  const { data: alertsData, isLoading: isLoadingAlerts } = useQuery({
    queryKey: [`/api/fleet/vehicles/${vehicle.id}/maintenance/alerts`],
    queryFn: async () => {
      try {
        return await apiRequest('GET', `/api/fleet/vehicles/${vehicle.id}/maintenance/alerts`);
      } catch (error) {
        console.error('Failed to fetch alerts:', error);
        return { alerts: [] };
      }
    }
  });

  // Fetch service history
  const { data: serviceHistoryData, isLoading: isLoadingHistory } = useQuery({
    queryKey: [`/api/fleet/vehicles/${vehicle.id}/service-history`],
    queryFn: async () => {
      try {
        return await apiRequest('GET', `/api/fleet/vehicles/${vehicle.id}/service-history`);
      } catch (error) {
        console.error('Failed to fetch service history:', error);
        return { history: [] };
      }
    }
  });

  // Fetch service schedules
  const { data: schedulesData, isLoading: isLoadingSchedules } = useQuery({
    queryKey: [`/api/fleet/vehicles/${vehicle.id}/service-schedules`],
    queryFn: async () => {
      try {
        return await apiRequest('GET', `/api/fleet/vehicles/${vehicle.id}/service-schedules`);
      } catch (error) {
        console.error('Failed to fetch schedules:', error);
        return { schedules: [] };
      }
    }
  });

  // Fetch parts inventory
  const { data: partsData, isLoading: isLoadingParts, refetch: refetchParts } = useQuery({
    queryKey: [`/api/fleet/vehicles/${vehicle.id}/parts-inventory`],
    queryFn: async () => {
      try {
        return await apiRequest('GET', `/api/fleet/vehicles/${vehicle.id}/parts-inventory`);
      } catch (error) {
        console.error('Failed to fetch parts inventory:', error);
        return { parts: [] };
      }
    }
  });

  // Add part mutation
  const addPartMutation = useMutation({
    mutationFn: async (data: PartForm) => {
      const payload = {
        ...data,
        quantity: parseInt(data.quantity),
        unitCost: parseFloat(data.unitCost),
        minimumStock: data.minimumStock ? parseInt(data.minimumStock) : 5
      };
      return await apiRequest('POST', `/api/fleet/vehicles/${vehicle.id}/parts-inventory`, payload);
    },
    onSuccess: () => {
      toast({
        title: "Part Added",
        description: "Successfully added part to inventory"
      });
      refetchParts();
      setIsAddPartDialogOpen(false);
      partForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Add Part",
        description: error.message || "An error occurred",
        variant: "destructive"
      });
    }
  });

  // Remove part mutation
  const removePartMutation = useMutation({
    mutationFn: async (partId: string) => {
      return await apiRequest('DELETE', `/api/fleet/vehicles/${vehicle.id}/parts-inventory/${partId}`);
    },
    onSuccess: () => {
      toast({
        title: "Part Removed",
        description: "Successfully removed part from inventory"
      });
      refetchParts();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Remove Part",
        description: error.message || "An error occurred",
        variant: "destructive"
      });
    }
  });

  const predictions = predictionsData?.predictions || [];
  const alerts = alertsData?.alerts || [];
  const history = serviceHistoryData?.history || [];
  const schedules = schedulesData?.schedules || [];
  const parts = partsData?.parts || [];

  // Combine history and schedules for timeline
  const timelineItems = [
    ...history.map((item: any) => ({ ...item, isScheduled: false })),
    ...schedules.map((item: any) => ({ 
      ...item, 
      isScheduled: true,
      isOverdue: new Date(item.serviceDate) < new Date()
    }))
  ].sort((a, b) => new Date(b.serviceDate).getTime() - new Date(a.serviceDate).getTime());

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'critical': return 'text-red-600 bg-red-50';
      case 'high': return 'text-orange-600 bg-orange-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'warning': return 'secondary';
      case 'info': return 'default';
      default: return 'outline';
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-full max-w-4xl bg-background shadow-xl overflow-y-auto">
        <div className="sticky top-0 z-10 bg-background border-b p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="icon" onClick={onClose} data-testid="button-close-detail">
                <X className="h-5 w-5" />
              </Button>
              <div>
                <h2 className="text-2xl font-bold">{vehicle.make} {vehicle.model}</h2>
                <p className="text-muted-foreground">Unit #{vehicle.unitNumber} • {vehicle.licensePlate}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
              <TabsTrigger value="maintenance" data-testid="tab-maintenance">
                Maintenance
                {alerts.length > 0 && (
                  <Badge variant="destructive" className="ml-2">
                    {alerts.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="service" data-testid="tab-service">Service History</TabsTrigger>
              <TabsTrigger value="parts" data-testid="tab-parts">
                Parts
                {parts.filter((p: PartsInventoryItem) => p.quantity < (p.minimumStock || 5)).length > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    !
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Vehicle Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">VIN</p>
                      <p className="font-medium">{vehicle.vin}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Year</p>
                      <p className="font-medium">{vehicle.year}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Type</p>
                      <p className="font-medium">{vehicle.vehicleType}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Current Odometer</p>
                      <p className="font-medium">{vehicle.currentOdometer?.toLocaleString()} miles</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Last Service</p>
                      <p className="font-medium">
                        {vehicle.lastServiceDate 
                          ? new Date(vehicle.lastServiceDate).toLocaleDateString()
                          : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Next Service Due</p>
                      <p className="font-medium">
                        {vehicle.nextServiceDue 
                          ? new Date(vehicle.nextServiceDue).toLocaleDateString()
                          : 'N/A'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="maintenance" className="space-y-4">
              {/* Active Alerts */}
              <Card>
                <CardHeader>
                  <CardTitle>Active Maintenance Alerts</CardTitle>
                  <CardDescription>Current issues requiring attention</CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingAlerts ? (
                    <div className="space-y-2">
                      <Skeleton className="h-20 w-full" />
                      <Skeleton className="h-20 w-full" />
                    </div>
                  ) : alerts.length > 0 ? (
                    <div className="space-y-3">
                      {alerts.map((alert: MaintenanceAlert) => (
                        <Alert key={alert.id} className={`border-l-4 ${
                          alert.severity === 'critical' ? 'border-l-red-500' :
                          alert.severity === 'warning' ? 'border-l-yellow-500' :
                          'border-l-blue-500'
                        }`}>
                          <div className="flex items-start gap-3">
                            {alert.severity === 'critical' ? (
                              <ShieldAlert className="h-5 w-5 text-red-500 mt-0.5" />
                            ) : alert.severity === 'warning' ? (
                              <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
                            ) : (
                              <Info className="h-5 w-5 text-blue-500 mt-0.5" />
                            )}
                            <div className="flex-1">
                              <AlertTitle className="mb-1">
                                {alert.alertType}
                                <Badge 
                                  variant={getSeverityColor(alert.severity)} 
                                  className="ml-2"
                                  data-testid={`badge-severity-${alert.id}`}
                                >
                                  {alert.severity.toUpperCase()}
                                </Badge>
                              </AlertTitle>
                              <AlertDescription>
                                {alert.message}
                                <p className="text-xs text-muted-foreground mt-1">
                                  {new Date(alert.createdAt).toLocaleString()}
                                </p>
                              </AlertDescription>
                            </div>
                          </div>
                        </Alert>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <CheckCircle2 className="h-12 w-12 mx-auto mb-2 text-green-500" />
                      <p>No active alerts</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Predictive Maintenance */}
              <Card>
                <CardHeader>
                  <CardTitle>Predictive Maintenance</CardTitle>
                  <CardDescription>AI-powered maintenance predictions</CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingPredictions ? (
                    <div className="space-y-2">
                      <Skeleton className="h-24 w-full" />
                      <Skeleton className="h-24 w-full" />
                    </div>
                  ) : predictions.length > 0 ? (
                    <div className="space-y-3">
                      {predictions.map((prediction: MaintenancePrediction) => (
                        <Card key={prediction.id} className={`p-4 ${getRiskLevelColor(prediction.riskLevel)}`}>
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Tool className="h-4 w-4" />
                                <h4 className="font-semibold">{prediction.predictionType}</h4>
                                <Badge 
                                  variant="outline"
                                  className={getRiskLevelColor(prediction.riskLevel)}
                                  data-testid={`badge-risk-${prediction.id}`}
                                >
                                  {prediction.riskLevel.toUpperCase()} RISK
                                </Badge>
                              </div>
                              <p className="text-sm mb-2">{prediction.recommendedAction}</p>
                              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <CalendarClock className="h-3 w-3" />
                                  {new Date(prediction.predictedDate).toLocaleDateString()}
                                </span>
                                {prediction.estimatedCost && (
                                  <span className="flex items-center gap-1">
                                    <DollarSign className="h-3 w-3" />
                                    ${prediction.estimatedCost}
                                  </span>
                                )}
                                <span>
                                  Confidence: {(prediction.confidence * 100).toFixed(0)}%
                                </span>
                              </div>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Tool className="h-12 w-12 mx-auto mb-2" />
                      <p>No predictions available</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="service" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Service Timeline</CardTitle>
                  <CardDescription>Service history and upcoming schedules</CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingHistory || isLoadingSchedules ? (
                    <div className="space-y-2">
                      <Skeleton className="h-20 w-full" />
                      <Skeleton className="h-20 w-full" />
                      <Skeleton className="h-20 w-full" />
                    </div>
                  ) : timelineItems.length > 0 ? (
                    <div className="relative">
                      <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>
                      <div className="space-y-6">
                        {timelineItems.map((item: ServiceHistoryItem, index: number) => (
                          <div key={item.id} className="relative flex items-start gap-4">
                            <div className={`absolute left-2 w-4 h-4 rounded-full border-2 ${
                              item.isOverdue ? 'bg-red-500 border-red-500' :
                              item.isScheduled ? 'bg-blue-500 border-blue-500' :
                              'bg-green-500 border-green-500'
                            }`}></div>
                            <div className="ml-10 flex-1">
                              <Card className={item.isOverdue ? 'border-red-200 bg-red-50' : ''}>
                                <CardContent className="p-4">
                                  <div className="flex items-start justify-between">
                                    <div>
                                      <div className="flex items-center gap-2 mb-1">
                                        <h4 className="font-semibold">{item.serviceType}</h4>
                                        {item.isScheduled && (
                                          <Badge 
                                            variant={item.isOverdue ? "destructive" : "secondary"}
                                            data-testid={`badge-schedule-${item.id}`}
                                          >
                                            {item.isOverdue ? 'OVERDUE' : 'SCHEDULED'}
                                          </Badge>
                                        )}
                                      </div>
                                      <p className="text-sm text-muted-foreground">
                                        {new Date(item.serviceDate).toLocaleDateString()}
                                        {item.performedBy && ` • By ${item.performedBy}`}
                                      </p>
                                      {item.odometer && (
                                        <p className="text-sm text-muted-foreground">
                                          Odometer: {item.odometer.toLocaleString()} miles
                                        </p>
                                      )}
                                      {item.notes && (
                                        <p className="text-sm mt-2">{item.notes}</p>
                                      )}
                                    </div>
                                    {item.cost !== undefined && (
                                      <div className="text-right">
                                        <p className="font-semibold">${item.cost}</p>
                                      </div>
                                    )}
                                  </div>
                                </CardContent>
                              </Card>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <History className="h-12 w-12 mx-auto mb-2" />
                      <p>No service history available</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="parts" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Parts Inventory</CardTitle>
                      <CardDescription>Manage vehicle parts and supplies</CardDescription>
                    </div>
                    <Dialog open={isAddPartDialogOpen} onOpenChange={setIsAddPartDialogOpen}>
                      <DialogTrigger asChild>
                        <Button data-testid="button-add-part">
                          <Plus className="h-4 w-4 mr-2" />
                          Add Part
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Add New Part</DialogTitle>
                          <DialogDescription>
                            Add a new part to the vehicle inventory
                          </DialogDescription>
                        </DialogHeader>
                        <Form {...partForm}>
                          <form onSubmit={partForm.handleSubmit((data) => addPartMutation.mutate(data))} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <FormField
                                control={partForm.control}
                                name="partName"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Part Name</FormLabel>
                                    <FormControl>
                                      <Input {...field} placeholder="Oil Filter" data-testid="input-part-name" />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={partForm.control}
                                name="partNumber"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Part Number</FormLabel>
                                    <FormControl>
                                      <Input {...field} placeholder="OF-12345" data-testid="input-part-number" />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={partForm.control}
                                name="quantity"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Quantity</FormLabel>
                                    <FormControl>
                                      <Input {...field} type="number" placeholder="10" data-testid="input-quantity" />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={partForm.control}
                                name="unitCost"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Unit Cost ($)</FormLabel>
                                    <FormControl>
                                      <Input {...field} type="number" step="0.01" placeholder="25.99" data-testid="input-unit-cost" />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={partForm.control}
                                name="category"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Category</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                      <FormControl>
                                        <SelectTrigger data-testid="select-category">
                                          <SelectValue placeholder="Select category" />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        <SelectItem value="engine">Engine</SelectItem>
                                        <SelectItem value="transmission">Transmission</SelectItem>
                                        <SelectItem value="brakes">Brakes</SelectItem>
                                        <SelectItem value="electrical">Electrical</SelectItem>
                                        <SelectItem value="suspension">Suspension</SelectItem>
                                        <SelectItem value="tires">Tires</SelectItem>
                                        <SelectItem value="fluids">Fluids</SelectItem>
                                        <SelectItem value="filters">Filters</SelectItem>
                                        <SelectItem value="other">Other</SelectItem>
                                      </SelectContent>
                                    </Select>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={partForm.control}
                                name="minimumStock"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Minimum Stock</FormLabel>
                                    <FormControl>
                                      <Input {...field} type="number" placeholder="5" data-testid="input-minimum-stock" />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                            <FormField
                              control={partForm.control}
                              name="location"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Storage Location</FormLabel>
                                  <FormControl>
                                    <Input {...field} placeholder="Shelf A-3" data-testid="input-location" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={partForm.control}
                              name="notes"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Notes</FormLabel>
                                  <FormControl>
                                    <Textarea {...field} placeholder="Additional notes..." data-testid="input-notes" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <DialogFooter>
                              <Button type="submit" disabled={addPartMutation.isPending} data-testid="button-submit-part">
                                {addPartMutation.isPending ? 'Adding...' : 'Add Part'}
                              </Button>
                            </DialogFooter>
                          </form>
                        </Form>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent>
                  {isLoadingParts ? (
                    <div className="space-y-2">
                      <Skeleton className="h-12 w-full" />
                      <Skeleton className="h-12 w-full" />
                      <Skeleton className="h-12 w-full" />
                    </div>
                  ) : parts.length > 0 ? (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Part Name</TableHead>
                            <TableHead>Part #</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>Quantity</TableHead>
                            <TableHead>Unit Cost</TableHead>
                            <TableHead>Total Value</TableHead>
                            <TableHead>Location</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {parts.map((part: PartsInventoryItem) => (
                            <TableRow key={part.id}>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  {part.partName}
                                  {part.quantity < (part.minimumStock || 5) && (
                                    <Badge variant="secondary" data-testid={`badge-low-stock-${part.id}`}>
                                      Low Stock
                                    </Badge>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>{part.partNumber}</TableCell>
                              <TableCell>{part.category}</TableCell>
                              <TableCell>{part.quantity}</TableCell>
                              <TableCell>${part.unitCost.toFixed(2)}</TableCell>
                              <TableCell className="font-semibold">
                                ${part.totalValue.toFixed(2)}
                              </TableCell>
                              <TableCell>{part.location || '-'}</TableCell>
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    if (confirm(`Remove ${part.partName} from inventory?`)) {
                                      removePartMutation.mutate(part.id);
                                    }
                                  }}
                                  data-testid={`button-remove-part-${part.id}`}
                                >
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                      <div className="mt-4 text-right">
                        <p className="text-sm text-muted-foreground">
                          Total Inventory Value: 
                          <span className="font-semibold text-foreground ml-2">
                            ${parts.reduce((sum: number, part: PartsInventoryItem) => sum + part.totalValue, 0).toFixed(2)}
                          </span>
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Package className="h-12 w-12 mx-auto mb-2" />
                      <p>No parts in inventory</p>
                      <Button 
                        variant="outline" 
                        className="mt-4"
                        onClick={() => setIsAddPartDialogOpen(true)}
                      >
                        Add First Part
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

export default function VehicleManagement() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [selectedVehicleForDetail, setSelectedVehicleForDetail] = useState<Vehicle | null>(null);
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

  // Fetch vehicles for the fleet with enhanced data
  const { data: vehiclesData, isLoading: isLoadingVehicles, refetch: refetchVehicles } = useQuery({
    queryKey: [`/api/fleet/${fleetId}/vehicles`],
    enabled: !!fleetId,
    queryFn: async () => {
      if (!fleetId) return { vehicles: [] };
      try {
        const data = await apiRequest('GET', `/api/fleet/${fleetId}/vehicles`);
        
        // Enhance vehicles with maintenance status and alert count
        const enhancedVehicles = await Promise.all(
          data.vehicles.map(async (vehicle: Vehicle) => {
            try {
              // Fetch alerts for each vehicle
              const alertsResponse = await apiRequest('GET', `/api/fleet/vehicles/${vehicle.id}/maintenance/alerts`);
              const activeAlerts = alertsResponse.alerts || [];
              const criticalAlerts = activeAlerts.filter((a: any) => a.severity === 'critical');
              const warningAlerts = activeAlerts.filter((a: any) => a.severity === 'warning');
              
              return {
                ...vehicle,
                activeAlertCount: activeAlerts.length,
                maintenanceStatus: criticalAlerts.length > 0 ? 'critical' : 
                                 warningAlerts.length > 0 ? 'attention' : 'good'
              };
            } catch (error) {
              // If fetching alerts fails, return vehicle with defaults
              return {
                ...vehicle,
                activeAlertCount: 0,
                maintenanceStatus: 'good'
              };
            }
          })
        );
        
        return { vehicles: enhancedVehicles };
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
    criticalMaintenanceCount: vehicles.filter((v: Vehicle) => v.maintenanceStatus === 'critical').length,
    attentionNeededCount: vehicles.filter((v: Vehicle) => v.maintenanceStatus === 'attention').length
  };

  const getMaintenanceStatusIcon = (status: string | undefined) => {
    switch (status) {
      case 'critical':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'attention':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'good':
      default:
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    }
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
                                  <SelectItem value="semi_truck">Semi Truck</SelectItem>
                                  <SelectItem value="box_truck">Box Truck</SelectItem>
                                  <SelectItem value="flatbed">Flatbed</SelectItem>
                                  <SelectItem value="reefer">Reefer</SelectItem>
                                  <SelectItem value="tanker">Tanker</SelectItem>
                                  <SelectItem value="dump_truck">Dump Truck</SelectItem>
                                  <SelectItem value="tow_truck">Tow Truck</SelectItem>
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
                                <Input {...field} placeholder="ABC-1234" data-testid="input-license-plate" />
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
                              <FormLabel>Current Odometer (miles)</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="150000" data-testid="input-odometer" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="assignedDriver"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Assigned Driver (Optional)</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger data-testid="select-driver">
                                    <SelectValue placeholder="Select driver" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="">Unassigned</SelectItem>
                                  {drivers.map(driver => (
                                    <SelectItem key={driver.id} value={driver.id}>
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
                        <Button type="submit" disabled={addVehicleMutation.isPending} data-testid="button-submit">
                          {addVehicleMutation.isPending ? 'Adding...' : 'Add Vehicle'}
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

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Vehicles</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <p className="text-2xl font-bold">{stats.totalVehicles}</p>
                <Truck className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Active</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <p className="text-2xl font-bold">{stats.activeVehicles}</p>
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">PM Due Soon</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <p className="text-2xl font-bold">{stats.pmDueSoon}</p>
                <Clock className="h-5 w-5 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Critical Issues</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <p className="text-2xl font-bold">{stats.criticalMaintenanceCount}</p>
                <AlertCircle className="h-5 w-5 text-red-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Attention Needed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <p className="text-2xl font-bold">{stats.attentionNeededCount}</p>
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Vehicles Table */}
        <Card>
          <CardHeader>
            <CardTitle>Fleet Vehicles</CardTitle>
            <CardDescription>
              Manage your fleet vehicles and their maintenance schedules
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingVehicles ? (
              <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : vehicles.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={selectedVehicleIds.length === vehicles.length}
                          onCheckedChange={selectAllVehicles}
                          data-testid="checkbox-select-all"
                        />
                      </TableHead>
                      <TableHead>Unit #</TableHead>
                      <TableHead>Vehicle</TableHead>
                      <TableHead>License Plate</TableHead>
                      <TableHead>Odometer</TableHead>
                      <TableHead>Maintenance</TableHead>
                      <TableHead>Next Service</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {vehicles.map((vehicle: Vehicle) => (
                      <TableRow key={vehicle.id} className="cursor-pointer hover:bg-muted/50">
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            checked={selectedVehicleIds.includes(vehicle.id)}
                            onCheckedChange={() => toggleVehicleSelection(vehicle.id)}
                            data-testid={`checkbox-vehicle-${vehicle.id}`}
                          />
                        </TableCell>
                        <TableCell onClick={() => setSelectedVehicleForDetail(vehicle)}>
                          <span className="font-medium">{vehicle.unitNumber}</span>
                        </TableCell>
                        <TableCell onClick={() => setSelectedVehicleForDetail(vehicle)}>
                          {vehicle.year} {vehicle.make} {vehicle.model}
                        </TableCell>
                        <TableCell onClick={() => setSelectedVehicleForDetail(vehicle)}>
                          {vehicle.licensePlate}
                        </TableCell>
                        <TableCell onClick={() => setSelectedVehicleForDetail(vehicle)}>
                          {vehicle.currentOdometer?.toLocaleString()} mi
                        </TableCell>
                        <TableCell onClick={() => setSelectedVehicleForDetail(vehicle)}>
                          <div className="flex items-center gap-2">
                            {getMaintenanceStatusIcon(vehicle.maintenanceStatus)}
                            <span className="text-sm">
                              {vehicle.maintenanceStatus === 'critical' ? 'Critical' :
                               vehicle.maintenanceStatus === 'attention' ? 'Attention' : 'Good'}
                            </span>
                            {vehicle.activeAlertCount > 0 && (
                              <Badge variant="outline" data-testid={`badge-alerts-${vehicle.id}`}>
                                {vehicle.activeAlertCount} alert{vehicle.activeAlertCount > 1 ? 's' : ''}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell onClick={() => setSelectedVehicleForDetail(vehicle)}>
                          {vehicle.nextServiceDue ? (
                            <div className="flex items-center gap-1">
                              <CalendarClock className="h-4 w-4" />
                              {new Date(vehicle.nextServiceDue).toLocaleDateString()}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell onClick={() => setSelectedVehicleForDetail(vehicle)}>
                          {vehicle.isActive ? (
                            <Badge variant="outline" className="text-green-600">Active</Badge>
                          ) : (
                            <Badge variant="secondary">Inactive</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setSelectedVehicleForDetail(vehicle)}
                              data-testid={`button-view-${vehicle.id}`}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
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
                              onClick={() => handleDelete(vehicle)}
                              data-testid={`button-delete-${vehicle.id}`}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8">
                <Truck className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground mb-4">No vehicles in your fleet yet</p>
                <Button onClick={() => setIsAddDialogOpen(true)} data-testid="button-add-first">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Vehicle
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Vehicle Detail View */}
      {selectedVehicleForDetail && (
        <VehicleDetailView 
          vehicle={selectedVehicleForDetail} 
          onClose={() => setSelectedVehicleForDetail(null)}
        />
      )}

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
                          <SelectItem value="semi_truck">Semi Truck</SelectItem>
                          <SelectItem value="box_truck">Box Truck</SelectItem>
                          <SelectItem value="flatbed">Flatbed</SelectItem>
                          <SelectItem value="reefer">Reefer</SelectItem>
                          <SelectItem value="tanker">Tanker</SelectItem>
                          <SelectItem value="dump_truck">Dump Truck</SelectItem>
                          <SelectItem value="tow_truck">Tow Truck</SelectItem>
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
                        <Input {...field} placeholder="ABC-1234" data-testid="input-edit-license-plate" />
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
                      <FormLabel>Current Odometer (miles)</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="150000" data-testid="input-edit-odometer" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <DialogFooter>
                <Button type="submit" disabled={updateVehicleMutation.isPending} data-testid="button-update">
                  {updateVehicleMutation.isPending ? 'Updating...' : 'Update Vehicle'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Batch Schedule Dialog */}
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
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-batch-service-type">
                          <SelectValue placeholder="Select service type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="oil_change">Oil Change</SelectItem>
                        <SelectItem value="tire_rotation">Tire Rotation</SelectItem>
                        <SelectItem value="brake_inspection">Brake Inspection</SelectItem>
                        <SelectItem value="full_service">Full Service</SelectItem>
                        <SelectItem value="dot_inspection">DOT Inspection</SelectItem>
                        <SelectItem value="transmission_service">Transmission Service</SelectItem>
                        <SelectItem value="coolant_flush">Coolant Flush</SelectItem>
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
                      <Input {...field} type="datetime-local" data-testid="input-batch-date" />
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
                    <FormLabel>Urgency</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                      <Input {...field} type="number" placeholder="120" data-testid="input-batch-duration" />
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
                      <Textarea {...field} placeholder="Additional notes..." data-testid="input-batch-description" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="submit" disabled={batchScheduleMutation.isPending} data-testid="button-batch-submit">
                  {batchScheduleMutation.isPending ? 'Scheduling...' : 'Schedule Maintenance'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* PM Schedule Dialog */}
      <Dialog open={isPmScheduleDialogOpen} onOpenChange={setIsPmScheduleDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create PM Schedule</DialogTitle>
            <DialogDescription>
              Set up a preventive maintenance schedule for a vehicle
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
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-pm-vehicle">
                          <SelectValue placeholder="Select vehicle" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {vehicles.map((vehicle: Vehicle) => (
                          <SelectItem key={vehicle.id} value={vehicle.id}>
                            {vehicle.unitNumber} - {vehicle.year} {vehicle.make} {vehicle.model}
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
                    <FormControl>
                      <Input {...field} placeholder="e.g., Oil Change, Tire Rotation" data-testid="input-pm-service" />
                    </FormControl>
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
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                      <Input {...field} type="date" data-testid="input-pm-next-date" />
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
                      <Input {...field} type="date" data-testid="input-pm-last-date" />
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
                      <Textarea {...field} placeholder="Additional notes..." data-testid="input-pm-notes" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="submit" disabled={createPmScheduleMutation.isPending} data-testid="button-pm-submit">
                  {createPmScheduleMutation.isPending ? 'Creating...' : 'Create Schedule'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}