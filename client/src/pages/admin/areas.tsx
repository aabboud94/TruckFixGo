import { useState } from "react";
import AdminLayout from "@/layouts/AdminLayout";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { MapPin, Plus, Edit, Trash2, Loader2, Clock, CheckCircle2, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";

// US States list
const US_STATES = [
  { code: "AL", name: "Alabama" },
  { code: "AK", name: "Alaska" },
  { code: "AZ", name: "Arizona" },
  { code: "AR", name: "Arkansas" },
  { code: "CA", name: "California" },
  { code: "CO", name: "Colorado" },
  { code: "CT", name: "Connecticut" },
  { code: "DE", name: "Delaware" },
  { code: "FL", name: "Florida" },
  { code: "GA", name: "Georgia" },
  { code: "HI", name: "Hawaii" },
  { code: "ID", name: "Idaho" },
  { code: "IL", name: "Illinois" },
  { code: "IN", name: "Indiana" },
  { code: "IA", name: "Iowa" },
  { code: "KS", name: "Kansas" },
  { code: "KY", name: "Kentucky" },
  { code: "LA", name: "Louisiana" },
  { code: "ME", name: "Maine" },
  { code: "MD", name: "Maryland" },
  { code: "MA", name: "Massachusetts" },
  { code: "MI", name: "Michigan" },
  { code: "MN", name: "Minnesota" },
  { code: "MS", name: "Mississippi" },
  { code: "MO", name: "Missouri" },
  { code: "MT", name: "Montana" },
  { code: "NE", name: "Nebraska" },
  { code: "NV", name: "Nevada" },
  { code: "NH", name: "New Hampshire" },
  { code: "NJ", name: "New Jersey" },
  { code: "NM", name: "New Mexico" },
  { code: "NY", name: "New York" },
  { code: "NC", name: "North Carolina" },
  { code: "ND", name: "North Dakota" },
  { code: "OH", name: "Ohio" },
  { code: "OK", name: "Oklahoma" },
  { code: "OR", name: "Oregon" },
  { code: "PA", name: "Pennsylvania" },
  { code: "RI", name: "Rhode Island" },
  { code: "SC", name: "South Carolina" },
  { code: "SD", name: "South Dakota" },
  { code: "TN", name: "Tennessee" },
  { code: "TX", name: "Texas" },
  { code: "UT", name: "Utah" },
  { code: "VT", name: "Vermont" },
  { code: "VA", name: "Virginia" },
  { code: "WA", name: "Washington" },
  { code: "WV", name: "West Virginia" },
  { code: "WI", name: "Wisconsin" },
  { code: "WY", name: "Wyoming" }
];

// US Timezones
const US_TIMEZONES = [
  { value: "America/New_York", label: "Eastern Time (ET)" },
  { value: "America/Chicago", label: "Central Time (CT)" },
  { value: "America/Denver", label: "Mountain Time (MT)" },
  { value: "America/Phoenix", label: "Arizona Time (MST)" },
  { value: "America/Los_Angeles", label: "Pacific Time (PT)" },
  { value: "America/Anchorage", label: "Alaska Time (AKST)" },
  { value: "Pacific/Honolulu", label: "Hawaii Time (HST)" }
];

// Schema for service area form - updated for city management
const serviceAreaSchema = z.object({
  name: z.string().min(1, "City name is required").max(100, "City name is too long"),
  state: z.string().length(2, "Please select a state"),
  country: z.string().default("USA"),
  coverageRadiusMiles: z.number()
    .min(5, "Coverage radius must be at least 5 miles")
    .max(200, "Coverage radius cannot exceed 200 miles"),
  isActive: z.boolean(),
  baseRateMultiplier: z.number()
    .min(0.5, "Rate multiplier cannot be less than 0.5")
    .max(3, "Rate multiplier cannot exceed 3")
    .optional()
    .nullable(),
  timezone: z.string().min(1, "Timezone is required")
});

type ServiceAreaForm = z.infer<typeof serviceAreaSchema>;

export default function AdminServiceAreas() {
  const { toast } = useToast();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingArea, setEditingArea] = useState<any>(null);
  const [deletingArea, setDeletingArea] = useState<any>(null);

  // Query for service areas
  const { data: areas, isLoading } = useQuery({
    queryKey: ['/api/admin/service-areas'],
    queryFn: () => apiRequest('GET', '/api/admin/service-areas')
  });

  const form = useForm<ServiceAreaForm>({
    resolver: zodResolver(serviceAreaSchema),
    defaultValues: {
      name: "",
      state: "",
      country: "USA",
      coverageRadiusMiles: 50,
      isActive: true,
      baseRateMultiplier: 1.0,
      timezone: "America/Chicago"
    }
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: ServiceAreaForm) => 
      apiRequest('POST', '/api/admin/service-areas', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/service-areas'] });
      toast({
        title: "City added successfully",
        description: "The new service city has been added to your coverage area"
      });
      setShowAddDialog(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Failed to add city",
        description: error.message || "Please try again"
      });
    }
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: ServiceAreaForm }) =>
      apiRequest('PUT', `/api/admin/service-areas/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/service-areas'] });
      toast({
        title: "City updated",
        description: "The service city has been updated successfully"
      });
      setEditingArea(null);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Failed to update city",
        description: error.message || "Please try again"
      });
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) =>
      apiRequest('DELETE', `/api/admin/service-areas/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/service-areas'] });
      toast({
        title: "City removed",
        description: "The service city has been removed from your coverage area"
      });
      setDeletingArea(null);
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Failed to remove city",
        description: error.message || "Please try again"
      });
    }
  });

  // Toggle active status mutation
  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) =>
      apiRequest('PUT', `/api/admin/service-areas/${id}`, { isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/service-areas'] });
      toast({
        title: "Status updated",
        description: "City service status has been updated"
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Failed to update status",
        description: error.message || "Please try again"
      });
    }
  });

  const handleAdd = () => {
    form.reset({
      name: "",
      state: "",
      country: "USA",
      coverageRadiusMiles: 50,
      isActive: true,
      baseRateMultiplier: 1.0,
      timezone: "America/Chicago"
    });
    setShowAddDialog(true);
  };

  const handleEdit = (area: any) => {
    form.reset({
      name: area.name,
      state: area.state || "",
      country: area.country || "USA",
      coverageRadiusMiles: area.coverageRadiusMiles || area.radiusMiles || 50,
      isActive: area.isActive,
      baseRateMultiplier: area.baseRateMultiplier || 1.0,
      timezone: area.timezone || "America/Chicago"
    });
    setEditingArea(area);
  };

  const onSubmit = (data: ServiceAreaForm) => {
    if (editingArea) {
      updateMutation.mutate({ id: editingArea.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  // Get timezone label
  const getTimezoneLabel = (value: string) => {
    const tz = US_TIMEZONES.find(t => t.value === value);
    return tz ? tz.label : value;
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Service Cities</h2>
            <p className="text-muted-foreground">
              Manage which cities TruckFixGo operates in
            </p>
          </div>
          <Button onClick={handleAdd} data-testid="button-add-city">
            <Plus className="mr-2 h-4 w-4" />
            Add City
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {areas && areas.length > 0 ? (
            areas.map((area: any) => (
              <Card key={area.id} className="relative overflow-hidden">
                <div className={`absolute top-0 left-0 right-0 h-1 ${area.isActive ? 'bg-green-500' : 'bg-gray-400'}`} />
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-semibold">
                      {area.name}, {area.state || "TX"}
                    </CardTitle>
                    <Badge 
                      variant={area.isActive ? "default" : "secondary"}
                      className="flex items-center gap-1"
                    >
                      {area.isActive ? (
                        <CheckCircle2 className="h-3 w-3" />
                      ) : (
                        <XCircle className="h-3 w-3" />
                      )}
                      {area.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <CardDescription>
                    {area.country || "USA"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Coverage:</span>
                      <span>{area.coverageRadiusMiles || area.radiusMiles || 50} miles</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Timezone:</span>
                      <span>{getTimezoneLabel(area.timezone || "America/Chicago")}</span>
                    </div>

                    {area.baseRateMultiplier && area.baseRateMultiplier !== 1 && (
                      <div className="text-sm">
                        <span className="text-muted-foreground">Rate adjustment:</span>
                        <span className="ml-2 font-medium">
                          {area.baseRateMultiplier > 1 ? '+' : ''}
                          {((area.baseRateMultiplier - 1) * 100).toFixed(0)}%
                        </span>
                      </div>
                    )}

                    {area.contractorCount > 0 && (
                      <div className="text-sm">
                        <span className="text-muted-foreground">Active contractors:</span>
                        <span className="ml-2 font-medium">{area.contractorCount}</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 flex gap-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => handleEdit(area)}
                      data-testid={`button-edit-city-${area.id}`}
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => setDeletingArea(area)}
                      data-testid={`button-delete-city-${area.id}`}
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Remove
                    </Button>
                    <Button
                      size="sm"
                      variant={area.isActive ? "secondary" : "default"}
                      onClick={() => toggleStatusMutation.mutate({ 
                        id: area.id, 
                        isActive: !area.isActive 
                      })}
                      data-testid={`button-toggle-city-${area.id}`}
                    >
                      {area.isActive ? "Deactivate" : "Activate"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="col-span-full">
              <CardContent className="text-center py-12">
                <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Service Cities Yet</h3>
                <p className="text-muted-foreground mb-4">
                  Start by adding cities where TruckFixGo will operate
                </p>
                <Button onClick={handleAdd} data-testid="button-add-first-city">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Your First City
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={showAddDialog || !!editingArea} onOpenChange={(open) => {
        if (!open) {
          setShowAddDialog(false);
          setEditingArea(null);
          form.reset();
        }
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingArea ? "Edit Service City" : "Add Service City"}
            </DialogTitle>
            <DialogDescription>
              {editingArea 
                ? "Update the service city details below." 
                : "Add a new city to your service coverage area."}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City Name</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder="e.g., Detroit, Dallas, Chicago"
                          data-testid="input-city-name"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>State</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger data-testid="select-state">
                            <SelectValue placeholder="Select a state" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {US_STATES.map(state => (
                            <SelectItem key={state.code} value={state.code}>
                              {state.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="coverageRadiusMiles"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Coverage Radius (miles)</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          type="number" 
                          onChange={(e) => field.onChange(parseFloat(e.target.value))}
                          data-testid="input-coverage-radius"
                        />
                      </FormControl>
                      <FormDescription>
                        Service area radius from city center
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="timezone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Timezone</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select timezone" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {US_TIMEZONES.map(tz => (
                            <SelectItem key={tz.value} value={tz.value}>
                              {tz.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="baseRateMultiplier"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rate Multiplier (optional)</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          type="number" 
                          step="0.1"
                          value={field.value || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            field.onChange(val ? parseFloat(val) : null);
                          }}
                          placeholder="1.0"
                        />
                      </FormControl>
                      <FormDescription>
                        Adjust pricing for this city (1.0 = standard, 1.5 = +50%)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel>Active Status</FormLabel>
                        <FormDescription>
                          Enable service in this city
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              {/* Hidden country field with default value */}
              <FormField
                control={form.control}
                name="country"
                render={({ field }) => (
                  <input type="hidden" {...field} value="USA" />
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowAddDialog(false);
                    setEditingArea(null);
                    form.reset();
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {createMutation.isPending || updateMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : editingArea ? (
                    "Update City"
                  ) : (
                    "Add City"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingArea} onOpenChange={() => setDeletingArea(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Service City</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove "{deletingArea?.name}, {deletingArea?.state || 'TX'}" from your service area? 
              This will affect contractors assigned to this city and may impact active jobs.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMutation.mutate(deletingArea.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove City
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}