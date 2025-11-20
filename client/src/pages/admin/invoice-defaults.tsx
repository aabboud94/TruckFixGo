import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import AdminLayout from "@/layouts/AdminLayout";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import {
  Plus, Edit, Trash2, Save, DollarSign, FileText,
  Settings, Check, X, AlertCircle, Loader2
} from "lucide-react";

interface DefaultCharge {
  id: string;
  name: string;
  amount: number;
  type: "fee" | "tax" | "surcharge";
  description?: string;
  active: boolean;
  applyByDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

// Form schema for default charge
const defaultChargeSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  amount: z.number().min(0, "Amount must be positive"),
  type: z.enum(["fee", "tax", "surcharge"]),
  description: z.string().optional(),
  active: z.boolean(),
  applyByDefault: z.boolean(),
});

type DefaultChargeFormData = z.infer<typeof defaultChargeSchema>;

export default function AdminInvoiceDefaults() {
  const { toast } = useToast();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingCharge, setEditingCharge] = useState<DefaultCharge | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Fetch default charges
  const { data: charges, isLoading, refetch } = useQuery({
    queryKey: ["/api/admin/invoice-defaults"],
    queryFn: async () => apiRequest("GET", "/api/admin/invoice-defaults"),
  });

  // Form for add/edit
  const form = useForm<DefaultChargeFormData>({
    resolver: zodResolver(defaultChargeSchema),
    defaultValues: {
      name: "",
      amount: 0,
      type: "fee",
      description: "",
      active: true,
      applyByDefault: true,
    },
  });

  // Create mutation
  const createChargeMutation = useMutation({
    mutationFn: async (data: DefaultChargeFormData) => {
      return apiRequest("POST", "/api/admin/invoice-defaults", data);
    },
    onSuccess: () => {
      toast({
        title: "Default charge created",
        description: "The default charge has been added successfully",
      });
      setShowAddDialog(false);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/admin/invoice-defaults"] });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create default charge",
      });
    },
  });

  // Update mutation
  const updateChargeMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: DefaultChargeFormData }) => {
      return apiRequest("PUT", `/api/admin/invoice-defaults/${id}`, data);
    },
    onSuccess: () => {
      toast({
        title: "Default charge updated",
        description: "The default charge has been updated successfully",
      });
      setEditingCharge(null);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/admin/invoice-defaults"] });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update default charge",
      });
    },
  });

  // Delete mutation
  const deleteChargeMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/admin/invoice-defaults/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Default charge deleted",
        description: "The default charge has been removed",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/invoice-defaults"] });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete default charge",
      });
    },
  });

  // Toggle active status
  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      return apiRequest("PATCH", `/api/admin/invoice-defaults/${id}/toggle`, { active });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/invoice-defaults"] });
    },
  });

  // Handle form submission
  const handleSubmit = (data: DefaultChargeFormData) => {
    if (editingCharge) {
      updateChargeMutation.mutate({ id: editingCharge.id, data });
    } else {
      createChargeMutation.mutate(data);
    }
  };

  // Handle edit
  const handleEdit = (charge: DefaultCharge) => {
    setEditingCharge(charge);
    form.reset({
      name: charge.name,
      amount: charge.amount,
      type: charge.type,
      description: charge.description || "",
      active: charge.active,
      applyByDefault: charge.applyByDefault,
    });
    setShowAddDialog(true);
  };

  // Handle delete
  const handleDelete = (id: string) => {
    deleteChargeMutation.mutate(id);
    setDeleteConfirmId(null);
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "fee":
        return "default";
      case "tax":
        return "secondary";
      case "surcharge":
        return "outline";
      default:
        return "default";
    }
  };

  const chargesArray = Array.isArray(charges) ? charges : [];

  return (
    <AdminLayout
      title="Invoice Default Charges"
      breadcrumbs={[
        { label: "Settings", href: "/admin/settings" },
        { label: "Invoice Defaults" },
      ]}
    >
      {/* Header */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Default Invoice Charges
              </CardTitle>
              <CardDescription>
                Configure default charges that are automatically added to new invoices
              </CardDescription>
            </div>
            <Button
              onClick={() => {
                setEditingCharge(null);
                form.reset({
                  name: "",
                  amount: 0,
                  type: "fee",
                  description: "",
                  active: true,
                  applyByDefault: true,
                });
                setShowAddDialog(true);
              }}
              data-testid="button-add-default-charge"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Default Charge
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Charges Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Auto-Apply</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                  </TableCell>
                </TableRow>
              ) : chargesArray.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No default charges configured
                  </TableCell>
                </TableRow>
              ) : (
                chargesArray.map((charge: DefaultCharge) => (
                  <TableRow key={charge.id} data-testid={`row-charge-${charge.id}`}>
                    <TableCell className="font-medium">{charge.name}</TableCell>
                    <TableCell>
                      <Badge variant={getTypeColor(charge.type) as any}>
                        {charge.type}
                      </Badge>
                    </TableCell>
                    <TableCell>${charge.amount.toFixed(2)}</TableCell>
                    <TableCell className="max-w-[300px]">
                      <p className="truncate text-sm text-muted-foreground">
                        {charge.description || "-"}
                      </p>
                    </TableCell>
                    <TableCell>
                      {charge.applyByDefault ? (
                        <Badge variant="outline" className="bg-green-50">
                          <Check className="h-3 w-3 mr-1" />
                          Auto
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-gray-50">
                          <X className="h-3 w-3 mr-1" />
                          Manual
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={charge.active}
                        onCheckedChange={(checked) => {
                          toggleActiveMutation.mutate({
                            id: charge.id,
                            active: checked,
                          });
                        }}
                        data-testid={`switch-active-${charge.id}`}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleEdit(charge)}
                          data-testid={`button-edit-${charge.id}`}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => setDeleteConfirmId(charge.id)}
                          data-testid={`button-delete-${charge.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Summary Card */}
      {chargesArray.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Active Charges</p>
                <p className="text-2xl font-bold">
                  {chargesArray.filter((c: DefaultCharge) => c.active).length}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Auto-Applied</p>
                <p className="text-2xl font-bold">
                  {chargesArray.filter((c: DefaultCharge) => c.applyByDefault).length}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Default Amount</p>
                <p className="text-2xl font-bold">
                  $
                  {chargesArray
                    .filter((c: DefaultCharge) => c.active && c.applyByDefault)
                    .reduce((sum: number, c: DefaultCharge) => sum + c.amount, 0)
                    .toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add/Edit Dialog */}
      <Dialog 
        open={showAddDialog} 
        onOpenChange={(open) => {
          setShowAddDialog(open);
          if (!open) {
            setEditingCharge(null);
            form.reset();
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCharge ? "Edit Default Charge" : "Add Default Charge"}
            </DialogTitle>
            <DialogDescription>
              {editingCharge 
                ? "Update the details of this default charge"
                : "Create a new default charge that will be available for invoices"}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        placeholder="e.g., Service Call Fee"
                        data-testid="input-charge-name"
                      />
                    </FormControl>
                    <FormDescription>
                      A descriptive name for this charge
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount ($)</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          step="0.01"
                          min="0"
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          data-testid="input-charge-amount"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger data-testid="select-charge-type">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="fee">Fee</SelectItem>
                          <SelectItem value="tax">Tax</SelectItem>
                          <SelectItem value="surcharge">Surcharge</SelectItem>
                        </SelectContent>
                      </Select>
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
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Additional details about this charge"
                        className="resize-none"
                        data-testid="textarea-charge-description"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="active"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel>Active</FormLabel>
                      <FormDescription>
                        Enable this charge to be available for selection
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-testid="switch-charge-active"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="applyByDefault"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel>Apply by Default</FormLabel>
                      <FormDescription>
                        Automatically add this charge to new invoices
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-testid="switch-charge-auto-apply"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowAddDialog(false);
                    setEditingCharge(null);
                    form.reset();
                  }}
                  data-testid="button-cancel-charge"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={createChargeMutation.isPending || updateChargeMutation.isPending}
                  data-testid="button-save-charge"
                >
                  {createChargeMutation.isPending || updateChargeMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      {editingCharge ? "Update" : "Create"} Charge
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Default Charge</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this default charge? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteConfirmId(null)}
              data-testid="button-cancel-delete"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
              disabled={deleteChargeMutation.isPending}
              data-testid="button-confirm-delete"
            >
              {deleteChargeMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}