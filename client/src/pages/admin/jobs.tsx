import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import AdminLayout from "@/layouts/AdminLayout";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { format } from "date-fns";
import {
  Search, Filter, Download, RefreshCw, MapPin, Clock, DollarSign,
  User, Truck, AlertCircle, CheckCircle, XCircle, Edit, Eye,
  MessageSquare, Camera, Ban, CreditCard, Loader2
} from "lucide-react";

export default function AdminJobs() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [showJobDetails, setShowJobDetails] = useState(false);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [showRefundDialog, setShowRefundDialog] = useState(false);

  // Query for jobs
  const { data: jobs, isLoading, refetch } = useQuery({
    queryKey: ['/api/admin/jobs', { status: statusFilter, type: typeFilter, search: searchQuery }],
  });

  // Query for available contractors
  const { data: contractors } = useQuery({
    queryKey: ['/api/admin/contractors/available'],
    enabled: showAssignDialog,
  });

  // Mutation for updating job status
  const updateStatusMutation = useMutation({
    mutationFn: async ({ jobId, status }: { jobId: string; status: string }) => {
      return apiRequest('PUT', `/api/admin/jobs/${jobId}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/jobs'] });
      toast({
        title: "Status updated",
        description: "Job status has been updated successfully",
      });
    },
  });

  // Mutation for assigning contractor
  const assignContractorMutation = useMutation({
    mutationFn: async ({ jobId, contractorId }: { jobId: string; contractorId: string }) => {
      return apiRequest('PUT', `/api/admin/jobs/${jobId}/assign`, { contractorId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/jobs'] });
      setShowAssignDialog(false);
      toast({
        title: "Contractor assigned",
        description: "Job has been assigned to the contractor",
      });
    },
  });

  // Mutation for refunding
  const refundMutation = useMutation({
    mutationFn: async ({ jobId, amount, reason }: { jobId: string; amount: number; reason: string }) => {
      return apiRequest('POST', `/api/admin/jobs/${jobId}/refund`, { amount, reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/jobs'] });
      setShowRefundDialog(false);
      toast({
        title: "Refund processed",
        description: "The refund has been processed successfully",
      });
    },
  });

  const jobsData = Array.isArray(jobs) ? jobs : [
    {
      id: "JOB-001",
      type: "emergency",
      status: "in_progress",
      service: "Emergency Repair",
      customer: {
        name: "John Smith",
        phone: "(555) 123-4567",
        email: "john@example.com",
      },
      contractor: {
        name: "Mike Johnson",
        phone: "(555) 987-6543",
      },
      location: "I-95 Mile Marker 142, Miami, FL",
      vehicle: {
        vin: "1HGBH41JXMN109186",
        unit: "TRK-4521",
      },
      price: 450,
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      startedAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
    },
    {
      id: "JOB-002",
      type: "scheduled",
      status: "completed",
      service: "Truck Wash",
      customer: {
        name: "ABC Transport",
        phone: "(555) 555-5555",
        email: "fleet@abctransport.com",
      },
      contractor: {
        name: "Clean Team Pro",
        phone: "(555) 111-2222",
      },
      location: "ABC Transport Yard, Atlanta, GA",
      vehicle: {
        vin: "2HGFG12628H573456",
        unit: "FLEET-223",
      },
      price: 180,
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      completedAt: new Date(Date.now() - 20 * 60 * 60 * 1000),
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'secondary';
      case 'assigned': return 'default';
      case 'en_route': return 'warning';
      case 'on_site': return 'warning';
      case 'completed': return 'success';
      case 'cancelled': return 'destructive';
      default: return 'secondary';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'new': return AlertCircle;
      case 'assigned': return User;
      case 'en_route': return Truck;
      case 'on_site': return Clock;
      case 'completed': return CheckCircle;
      case 'cancelled': return XCircle;
      default: return AlertCircle;
    }
  };

  const handleExport = async () => {
    try {
      const response = await apiRequest('POST', '/api/admin/jobs/export', {
        format: 'csv',
        filters: { status: statusFilter, type: typeFilter }
      });
      
      // Get the response data
      const data = await response.text();
      
      // Create download link
      const blob = new Blob([data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `jobs-export-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      a.click();
      
      toast({
        title: "Export successful",
        description: "Jobs have been exported to CSV",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Export failed",
        description: "Failed to export jobs data",
      });
    }
  };

  return (
    <AdminLayout 
      title="Job Management"
      breadcrumbs={[{ label: "Jobs" }]}
    >
      {/* Filters and Actions */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Jobs</CardTitle>
              <CardDescription>Manage and monitor all platform jobs</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => refetch()}
                data-testid="button-refresh-jobs"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </Button>
              <Button
                variant="outline"
                onClick={handleExport}
                data-testid="button-export-jobs"
              >
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by ID, customer, contractor, or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
                data-testid="input-search-jobs"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]" data-testid="select-status-filter">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="assigned">Assigned</SelectItem>
                <SelectItem value="en_route">En Route</SelectItem>
                <SelectItem value="on_site">On Site</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[180px]" data-testid="select-type-filter">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="emergency">Emergency</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Jobs Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Job ID</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Contractor</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : jobsData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                      No jobs found
                    </TableCell>
                  </TableRow>
                ) : (
                  jobsData.map((job: any) => {
                    const StatusIcon = getStatusIcon(job.status);
                    return (
                      <TableRow key={job.id}>
                        <TableCell className="font-mono">{job.id}</TableCell>
                        <TableCell>
                          <Badge variant={job.type === 'emergency' ? 'destructive' : 'default'}>
                            {job.type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusColor(job.status) as any} className="flex items-center gap-1 w-fit">
                            <StatusIcon className="h-3 w-3" />
                            {job.status.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>{job.service}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{job.customer.name}</p>
                            <p className="text-sm text-muted-foreground">{job.customer.phone}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          {job.contractor ? (
                            <div>
                              <p className="font-medium">{job.contractor.name}</p>
                              <p className="text-sm text-muted-foreground">{job.contractor.phone}</p>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">Unassigned</span>
                          )}
                        </TableCell>
                        <TableCell className="max-w-[200px]">
                          <p className="truncate" title={job.location}>
                            {job.location}
                          </p>
                        </TableCell>
                        <TableCell>${job.price}</TableCell>
                        <TableCell>{format(job.createdAt, 'MMM d, h:mm a')}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => {
                                setSelectedJob(job);
                                setShowJobDetails(true);
                              }}
                              data-testid={`button-view-${job.id}`}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => {
                                setSelectedJob(job);
                                setShowAssignDialog(true);
                              }}
                              data-testid={`button-assign-${job.id}`}
                            >
                              <User className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Job Details Dialog */}
      <Dialog open={showJobDetails} onOpenChange={setShowJobDetails}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Job Details - {selectedJob?.id}</DialogTitle>
            <DialogDescription>
              Complete job information and management options
            </DialogDescription>
          </DialogHeader>
          
          {selectedJob && (
            <Tabs defaultValue="details" className="mt-4">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="timeline">Timeline</TabsTrigger>
                <TabsTrigger value="messages">Messages</TabsTrigger>
                <TabsTrigger value="photos">Photos</TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select
                      value={selectedJob.status}
                      onValueChange={(value) => {
                        updateStatusMutation.mutate({
                          jobId: selectedJob.id,
                          status: value,
                        });
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="new">New</SelectItem>
                        <SelectItem value="assigned">Assigned</SelectItem>
                        <SelectItem value="en_route">En Route</SelectItem>
                        <SelectItem value="on_site">On Site</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Service Type</Label>
                    <Input value={selectedJob.service} readOnly />
                  </div>

                  <div className="space-y-2">
                    <Label>Customer Name</Label>
                    <Input value={selectedJob.customer.name} readOnly />
                  </div>

                  <div className="space-y-2">
                    <Label>Customer Phone</Label>
                    <Input value={selectedJob.customer.phone} readOnly />
                  </div>

                  <div className="space-y-2">
                    <Label>Location</Label>
                    <Textarea value={selectedJob.location} readOnly className="resize-none" />
                  </div>

                  <div className="space-y-2">
                    <Label>Vehicle Info</Label>
                    <Input value={`VIN: ${selectedJob.vehicle.vin}`} readOnly />
                    <Input value={`Unit: ${selectedJob.vehicle.unit}`} readOnly />
                  </div>

                  <div className="space-y-2">
                    <Label>Price</Label>
                    <Input value={`$${selectedJob.price}`} readOnly />
                  </div>

                  <div className="space-y-2">
                    <Label>Created At</Label>
                    <Input value={format(selectedJob.createdAt, 'PPpp')} readOnly />
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setShowAssignDialog(true)}
                    data-testid="button-reassign"
                  >
                    Reassign Contractor
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowRefundDialog(true)}
                    data-testid="button-refund"
                  >
                    Process Refund
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => {
                      updateStatusMutation.mutate({
                        jobId: selectedJob.id,
                        status: 'cancelled',
                      });
                    }}
                    data-testid="button-cancel-job"
                  >
                    Cancel Job
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="timeline">
                <ScrollArea className="h-[400px]">
                  <div className="space-y-4">
                    <div className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        </div>
                        <div className="h-full w-0.5 bg-border" />
                      </div>
                      <div className="flex-1 pb-4">
                        <p className="font-medium">Job Created</p>
                        <p className="text-sm text-muted-foreground">
                          {format(selectedJob.createdAt, 'PPpp')}
                        </p>
                      </div>
                    </div>
                    {selectedJob.startedAt && (
                      <div className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                            <Truck className="h-4 w-4 text-blue-600" />
                          </div>
                          <div className="h-full w-0.5 bg-border" />
                        </div>
                        <div className="flex-1 pb-4">
                          <p className="font-medium">Job Started</p>
                          <p className="text-sm text-muted-foreground">
                            {format(selectedJob.startedAt, 'PPpp')}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="messages">
                <div className="text-center py-8 text-muted-foreground">
                  No messages yet
                </div>
              </TabsContent>

              <TabsContent value="photos">
                <div className="text-center py-8 text-muted-foreground">
                  No photos uploaded
                </div>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

      {/* Assign Contractor Dialog */}
      <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Contractor</DialogTitle>
            <DialogDescription>
              Select a contractor to assign to job {selectedJob?.id}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <ScrollArea className="h-[300px]">
              <div className="space-y-2">
                {Array.isArray(contractors) && contractors.map((contractor: any) => (
                  <div
                    key={contractor.id}
                    className="p-3 border rounded-lg hover:bg-muted cursor-pointer"
                    onClick={() => {
                      assignContractorMutation.mutate({
                        jobId: selectedJob?.id,
                        contractorId: contractor.id,
                      });
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{contractor.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {contractor.distance} miles away • {contractor.rating} ⭐
                        </p>
                      </div>
                      <Badge>{contractor.tier}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAssignDialog(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Refund Dialog */}
      <Dialog open={showRefundDialog} onOpenChange={setShowRefundDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Process Refund</DialogTitle>
            <DialogDescription>
              Process a refund for job {selectedJob?.id}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Refund Amount</Label>
              <Input
                type="number"
                placeholder="0.00"
                max={selectedJob?.price}
                data-testid="input-refund-amount"
              />
              <p className="text-sm text-muted-foreground">
                Original amount: ${selectedJob?.price}
              </p>
            </div>

            <div className="space-y-2">
              <Label>Reason for Refund</Label>
              <Textarea
                placeholder="Enter reason for refund..."
                data-testid="textarea-refund-reason"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRefundDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                // Process refund
                setShowRefundDialog(false);
              }}
              data-testid="button-process-refund"
            >
              Process Refund
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}

// Add missing import
import { Label } from "@/components/ui/label";