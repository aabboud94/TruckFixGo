import { useState } from "react";
import AdminLayout from "@/layouts/AdminLayout";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { MapPin, Plus, Edit, Trash2, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";

// Schema for service area form
const serviceAreaSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  radiusMiles: z.number().min(1, "Radius must be at least 1 mile").max(500, "Radius cannot exceed 500 miles"),
  baseSurcharge: z.number().min(0, "Surcharge cannot be negative"),
  isActive: z.boolean()
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
      description: "",
      latitude: 32.7767,
      longitude: -96.7970,
      radiusMiles: 50,
      baseSurcharge: 0,
      isActive: true
    }
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: ServiceAreaForm) => 
      apiRequest('POST', '/api/admin/service-areas', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/service-areas'] });
      toast({
        title: "Service area created",
        description: "The new service area has been added successfully"
      });
      setShowAddDialog(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Failed to create service area",
        description: error.message
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
        title: "Service area updated",
        description: "The service area has been updated successfully"
      });
      setEditingArea(null);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Failed to update service area",
        description: error.message
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
        title: "Service area deleted",
        description: "The service area has been removed successfully"
      });
      setDeletingArea(null);
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Failed to delete service area",
        description: error.message
      });
    }
  });

  // Toggle active status mutation
  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) =>
      apiRequest('PATCH', `/api/admin/service-areas/${id}/status`, { isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/service-areas'] });
      toast({
        title: "Status updated",
        description: "Service area status has been updated"
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Failed to update status",
        description: error.message
      });
    }
  });

  const handleAdd = () => {
    form.reset({
      name: "",
      description: "",
      latitude: 32.7767,
      longitude: -96.7970,
      radiusMiles: 50,
      baseSurcharge: 0,
      isActive: true
    });
    setShowAddDialog(true);
  };

  const handleEdit = (area: any) => {
    form.reset({
      name: area.name,
      description: area.description || "",
      latitude: area.latitude,
      longitude: area.longitude,
      radiusMiles: area.radiusMiles,
      baseSurcharge: area.baseSurcharge,
      isActive: area.isActive
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
          <h2 className="text-3xl font-bold tracking-tight">Service Areas</h2>
          <Button onClick={handleAdd} data-testid="button-add-area">
            <Plus className="mr-2 h-4 w-4" />
            Add Service Area
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {areas && areas.length > 0 ? (
            areas.map((area: any) => (
              <Card key={area.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-medium">{area.name}</CardTitle>
                    <Badge variant={area.isActive ? "default" : "secondary"}>
                      {area.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <CardDescription>{area.description || "Service area"}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{area.radiusMiles} mile radius</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Center: </span>
                      <span className="font-medium">
                        {area.latitude.toFixed(4)}, {area.longitude.toFixed(4)}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Contractors: </span>
                      <span className="font-medium">{area.contractorCount || 0} active</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Surcharge: </span>
                      <span className="font-medium">${area.baseSurcharge} base</span>
                    </div>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => handleEdit(area)}
                      data-testid="button-edit-area"
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => setDeletingArea(area)}
                      data-testid="button-delete-area"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant={area.isActive ? "outline" : "default"}
                      onClick={() => toggleStatusMutation.mutate({ 
                        id: area.id, 
                        isActive: !area.isActive 
                      })}
                      data-testid="button-toggle-area"
                    >
                      {area.isActive ? "Deactivate" : "Activate"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="col-span-full">
              <CardContent className="text-center py-8">
                <p className="text-muted-foreground">No service areas configured yet.</p>
                <Button onClick={handleAdd} className="mt-4">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Your First Service Area
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
              {editingArea ? "Edit Service Area" : "Add Service Area"}
            </DialogTitle>
            <DialogDescription>
              {editingArea 
                ? "Update the service area details below." 
                : "Configure a new service area for your platform."}
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
                      <FormLabel>Area Name</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g., Dallas-Fort Worth" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="radiusMiles"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Service Radius (miles)</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          type="number" 
                          onChange={(e) => field.onChange(parseFloat(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (optional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field} 
                        placeholder="e.g., Primary service area covering metropolitan region"
                        rows={3}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="latitude"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Center Latitude</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          type="number" 
                          step="0.0001"
                          onChange={(e) => field.onChange(parseFloat(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="longitude"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Center Longitude</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          type="number" 
                          step="0.0001"
                          onChange={(e) => field.onChange(parseFloat(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="baseSurcharge"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Base Surcharge ($)</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          type="number" 
                          step="0.01"
                          onChange={(e) => field.onChange(parseFloat(e.target.value))}
                        />
                      </FormControl>
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
                        <div className="text-sm text-muted-foreground">
                          Enable this area for service
                        </div>
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
                    "Update Area"
                  ) : (
                    "Create Area"
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
            <AlertDialogTitle>Delete Service Area</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingArea?.name}"? This will remove the service area
              and may affect contractors assigned to this region. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMutation.mutate(deletingArea.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Area
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}