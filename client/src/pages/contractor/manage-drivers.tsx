import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Users,
  UserPlus,
  Phone,
  Mail,
  Truck,
  AlertCircle,
  CheckCircle,
  XCircle,
  Edit,
  Trash2
} from "lucide-react";

const addDriverSchema = z.object({
  firstName: z.string().min(2, "First name is required"),
  lastName: z.string().min(2, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Phone number is required"),
  cdlNumber: z.string().optional(),
  cdlState: z.string().max(2).optional(),
  carrierName: z.string().optional(),
  dotNumber: z.string().optional(),
});

type AddDriverFormData = z.infer<typeof addDriverSchema>;

interface Driver {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  cdlNumber?: string;
  cdlState?: string;
  carrierName?: string;
  isActive: boolean;
  approvalStatus?: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  activeJobs: number;
  completedJobs: number;
}

export default function ManageDrivers() {
  const { toast } = useToast();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Fetch drivers managed by this contractor
  const { data: drivers, isLoading } = useQuery<Driver[]>({
    queryKey: ["/api/contractor/drivers"],
  });

  const form = useForm<AddDriverFormData>({
    resolver: zodResolver(addDriverSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      cdlNumber: "",
      cdlState: "",
      carrierName: "",
      dotNumber: "",
    },
  });

  // Add driver mutation
  const addDriverMutation = useMutation({
    mutationFn: async (data: AddDriverFormData) => {
      return await apiRequest("POST", "/api/contractor/drivers", data);
    },
    onSuccess: () => {
      toast({
        title: "Driver Added",
        description: "The driver has been successfully added to your team",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/contractor/drivers"] });
      setShowAddDialog(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add driver",
        variant: "destructive",
      });
    },
  });

  // Remove driver mutation
  const removeDriverMutation = useMutation({
    mutationFn: async (driverId: string) => {
      return await apiRequest("DELETE", `/api/contractor/drivers/${driverId}`);
    },
    onSuccess: () => {
      toast({
        title: "Driver Removed",
        description: "The driver has been removed from your team",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/contractor/drivers"] });
      setShowDeleteDialog(false);
      setSelectedDriver(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to remove driver",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: AddDriverFormData) => {
    addDriverMutation.mutate(data);
  };

  const handleDeleteDriver = () => {
    if (selectedDriver) {
      removeDriverMutation.mutate(selectedDriver.id);
    }
  };
  
  // Separate drivers by approval status
  const approvedDrivers = drivers?.filter(d => d.approvalStatus === 'approved') || [];
  const pendingDrivers = drivers?.filter(d => d.approvalStatus === 'pending') || [];

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Manage Drivers</h1>
        <p className="text-muted-foreground">
          Add and manage drivers who work under your contractor account
        </p>
      </div>

      {/* Pending Drivers Card - Only show if there are pending drivers */}
      {pendingDrivers.length > 0 && (
        <Card className="mb-6 border-amber-200 bg-amber-50 dark:bg-amber-950/10 dark:border-amber-900">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-600" />
              <CardTitle>Pending Admin Approval</CardTitle>
            </div>
            <CardDescription>
              These drivers are awaiting admin approval before they can be assigned to jobs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>CDL Info</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingDrivers.map((driver) => (
                  <TableRow key={driver.id} data-testid={`row-pending-driver-${driver.id}`}>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {driver.firstName} {driver.lastName}
                        </div>
                        {driver.carrierName && (
                          <div className="text-sm text-muted-foreground">
                            {driver.carrierName}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center text-sm">
                          <Mail className="mr-2 h-3 w-3 text-muted-foreground" />
                          {driver.email}
                        </div>
                        <div className="flex items-center text-sm">
                          <Phone className="mr-2 h-3 w-3 text-muted-foreground" />
                          {driver.phone}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {driver.cdlNumber ? (
                        <div className="text-sm">
                          <div>CDL: {driver.cdlNumber}</div>
                          {driver.cdlState && <div>State: {driver.cdlState}</div>}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Not provided</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800">Pending Admin Approval</Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSelectedDriver(driver);
                          setShowDeleteDialog(true);
                        }}
                        data-testid={`button-remove-pending-driver-${driver.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Approved Drivers Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Your Drivers</CardTitle>
            <CardDescription>
              Drivers you manage can be assigned to your jobs
            </CardDescription>
          </div>
          <Button onClick={() => setShowAddDialog(true)} data-testid="button-add-driver">
            <UserPlus className="mr-2 h-4 w-4" />
            Add Driver
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-muted-foreground">Loading drivers...</p>
            </div>
          ) : approvedDrivers.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>CDL Info</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Active Jobs</TableHead>
                  <TableHead>Completed</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {approvedDrivers.map((driver) => (
                  <TableRow key={driver.id} data-testid={`row-driver-${driver.id}`}>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {driver.firstName} {driver.lastName}
                        </div>
                        {driver.carrierName && (
                          <div className="text-sm text-muted-foreground">
                            {driver.carrierName}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center text-sm">
                          <Mail className="mr-2 h-3 w-3 text-muted-foreground" />
                          {driver.email}
                        </div>
                        <div className="flex items-center text-sm">
                          <Phone className="mr-2 h-3 w-3 text-muted-foreground" />
                          {driver.phone}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {driver.cdlNumber ? (
                        <div className="text-sm">
                          <div>CDL: {driver.cdlNumber}</div>
                          {driver.cdlState && <div>State: {driver.cdlState}</div>}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Not provided</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={driver.isActive ? "default" : "secondary"}
                        className={driver.isActive ? "bg-green-100 text-green-700 border-green-200 dark:bg-green-950/30 dark:text-green-400 dark:border-green-800" : ""}
                      >
                        {driver.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{driver.activeJobs || 0}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{driver.completedJobs || 0}</Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSelectedDriver(driver);
                          setShowDeleteDialog(true);
                        }}
                        data-testid={`button-remove-driver-${driver.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12">
              <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No drivers yet</h3>
              <p className="text-muted-foreground mb-4">
                Add drivers to your team to assign them jobs
              </p>
              <Button onClick={() => setShowAddDialog(true)}>
                <UserPlus className="mr-2 h-4 w-4" />
                Add Your First Driver
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Driver Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Driver</DialogTitle>
            <DialogDescription>
              Add a driver to your team. They will be able to receive job assignments from you.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-driver-first-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-driver-last-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" {...field} data-testid="input-driver-email" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-driver-phone" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="cdlNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CDL Number (Optional)</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-driver-cdl" />
                      </FormControl>
                      <FormDescription>
                        Commercial Driver's License number
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="cdlState"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CDL State (Optional)</FormLabel>
                      <FormControl>
                        <Input {...field} maxLength={2} placeholder="TX" data-testid="input-driver-cdl-state" />
                      </FormControl>
                      <FormDescription>
                        State that issued the CDL
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="carrierName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Carrier Name (Optional)</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-driver-carrier" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="dotNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>DOT Number (Optional)</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-driver-dot" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={addDriverMutation.isPending} data-testid="button-submit-add-driver">
                  {addDriverMutation.isPending ? "Adding..." : "Add Driver"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Driver</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove {selectedDriver?.firstName} {selectedDriver?.lastName} from your team?
              They will no longer be able to receive job assignments from you.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteDriver}
              disabled={removeDriverMutation.isPending}
              data-testid="button-confirm-remove-driver"
            >
              {removeDriverMutation.isPending ? "Removing..." : "Remove Driver"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}