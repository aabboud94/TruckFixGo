import { useState, useEffect } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { format } from "date-fns";
import JobPhotoGallery from "@/components/job-photo-gallery";
import {
  Search, Filter, Download, RefreshCw, MapPin, Clock, DollarSign,
  User, Truck, AlertCircle, CheckCircle, XCircle, Edit, Eye,
  MessageSquare, Camera, Ban, CreditCard, Loader2, Save, ChevronDown
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
  
  // State for editable job details
  const [editedJob, setEditedJob] = useState<any>(null);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);

  // Query for jobs
  const { data: jobs, isLoading, refetch } = useQuery({
    queryKey: ['/api/admin/jobs', { status: statusFilter, type: typeFilter, search: searchQuery }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (typeFilter !== 'all') params.append('type', typeFilter);
      if (searchQuery) params.append('search', searchQuery);
      return apiRequest('GET', `/api/admin/jobs?${params}`);
    }
  });

  // Query for available contractors
  const { data: contractors } = useQuery({
    queryKey: ['/api/admin/contractors/available'],
    queryFn: async () => apiRequest('GET', '/api/admin/contractors/available'),
    enabled: showAssignDialog,
  });
  
  // Query for service types
  const { data: serviceTypes } = useQuery({
    queryKey: ['/api/service-types'],
    queryFn: async () => apiRequest('GET', '/api/service-types'),
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
  
  // Mutation for updating job details
  const updateJobMutation = useMutation({
    mutationFn: async ({ jobId, updates }: { jobId: string; updates: any }) => {
      return apiRequest('PUT', `/api/admin/jobs/${jobId}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/jobs'] });
      toast({
        title: "Job updated",
        description: "Job details have been updated successfully",
      });
      setSelectedJob(editedJob); // Update selected job with edited values
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Update failed",
        description: "Failed to update job details",
      });
    },
  });

  // Use real data from API response
  const jobsData = Array.isArray(jobs) ? jobs : (jobs?.jobs ?? []);
  
  // Initialize edited job when selected job changes
  useEffect(() => {
    if (selectedJob) {
      setEditedJob({ ...selectedJob });
      // Initialize selected services from the job's service field
      if (selectedJob.service) {
        setSelectedServices(Array.isArray(selectedJob.service) ? selectedJob.service : [selectedJob.service]);
      } else {
        setSelectedServices([]);
      }
    }
  }, [selectedJob]);
  
  // Handle save job changes
  const handleSaveChanges = () => {
    if (!editedJob) return;
    
    updateJobMutation.mutate({
      jobId: editedJob.id,
      updates: {
        customerName: editedJob.customerName || editedJob.customer?.name,
        customerPhone: editedJob.customerPhone || editedJob.customer?.phone,
        location: editedJob.location,
        locationAddress: editedJob.locationAddress,
        vin: editedJob.vin || editedJob.vehicle?.vin,
        unitNumber: editedJob.unitNumber || editedJob.vehicle?.unit,
        price: parseFloat(editedJob.price),
        service: selectedServices.join(', '), // Join services for now
        status: editedJob.status,
      }
    });
  };

  // Removed mock data - now using real API data
  /*
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
  */

  const getStatusColor = (status: string) => {
    // Returns valid Badge variant with optional class for custom colors
    switch (status) {
      case 'new': return { variant: 'secondary' as const };
      case 'assigned': return { variant: 'default' as const };
      case 'en_route': return { variant: 'default' as const, className: 'bg-yellow-500 hover:bg-yellow-600' };
      case 'on_site': return { variant: 'default' as const, className: 'bg-yellow-500 hover:bg-yellow-600' };
      case 'completed': return { variant: 'default' as const, className: 'bg-green-500 hover:bg-green-600' };
      case 'cancelled': return { variant: 'destructive' as const };
      default: return { variant: 'secondary' as const };
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
      const data = await apiRequest<string>('POST', '/api/admin/jobs/export', {
        format: 'csv',
        filters: { status: statusFilter, type: typeFilter }
      });
      
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
                          {(() => {
                            const StatusIcon = getStatusIcon(job.status);
                            const statusStyle = getStatusColor(job.status);
                            return (
                              <Badge 
                                variant={statusStyle.variant} 
                                className={`flex items-center gap-1 w-fit ${statusStyle.className || ''}`}
                              >
                                <StatusIcon className="h-3 w-3" />
                                {job.status.replace('_', ' ')}
                              </Badge>
                            );
                          })()}
                        </TableCell>
                        <TableCell>{job.service}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{job.customer?.name || job.customerName || 'Guest'}</p>
                            <p className="text-sm text-muted-foreground">{job.customer?.phone || job.customerPhone || 'N/A'}</p>
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
                          <p className="truncate" title={
                            typeof job.location === 'object' && job.location 
                              ? job.locationAddress || `${job.location.lat?.toFixed(4)}, ${job.location.lng?.toFixed(4)}`
                              : job.location || 'Unknown'
                          }>
                            {typeof job.location === 'object' && job.location 
                              ? job.locationAddress || `${job.location.lat?.toFixed(4)}, ${job.location.lng?.toFixed(4)}`
                              : job.location || 'Unknown'}
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
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto z-[200]" style={{ pointerEvents: 'auto' }}>
          <DialogHeader>
            <DialogTitle>Job Details - {editedJob?.id}</DialogTitle>
            <DialogDescription>
              Complete job information and management options
            </DialogDescription>
          </DialogHeader>
          
          {editedJob && (
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
                      value={editedJob.status}
                      onValueChange={(value) => {
                        setEditedJob({ ...editedJob, status: value });
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="z-[300]" style={{ zIndex: 300, position: 'relative' }}>
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
                    <Label>Service Types</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-between font-normal"
                        >
                          <span className="truncate">
                            {selectedServices.length > 0
                              ? `${selectedServices.length} selected`
                              : "Select services"}
                          </span>
                          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0 z-[110]" align="start" style={{ zIndex: 110 }}>
                        <ScrollArea className="h-[200px]">
                          <div className="p-2 space-y-1">
                            {serviceTypes && serviceTypes.map((service: any) => (
                              <div 
                                key={service.id} 
                                className="flex items-center space-x-2 p-2 hover:bg-muted rounded-md cursor-pointer"
                                onClick={() => {
                                  if (selectedServices.includes(service.name)) {
                                    setSelectedServices(selectedServices.filter(s => s !== service.name));
                                  } else {
                                    setSelectedServices([...selectedServices, service.name]);
                                  }
                                }}
                              >
                                <Checkbox 
                                  checked={selectedServices.includes(service.name)}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      setSelectedServices([...selectedServices, service.name]);
                                    } else {
                                      setSelectedServices(selectedServices.filter(s => s !== service.name));
                                    }
                                  }}
                                  onClick={(e) => e.stopPropagation()}
                                />
                                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer">
                                  {service.name}
                                </label>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      </PopoverContent>
                    </Popover>
                    {selectedServices.length > 0 && (
                      <div className="text-xs text-muted-foreground mt-1">
                        Selected: {selectedServices.join(', ')}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Customer Name</Label>
                    <Input 
                      value={editedJob.customerName || editedJob.customer?.name || ''} 
                      onChange={(e) => setEditedJob({ ...editedJob, customerName: e.target.value })}
                      placeholder="Enter customer name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Customer Phone</Label>
                    <Input 
                      value={editedJob.customerPhone || editedJob.customer?.phone || ''} 
                      onChange={(e) => setEditedJob({ ...editedJob, customerPhone: e.target.value })}
                      placeholder="Enter customer phone"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Location</Label>
                    <Textarea 
                      value={
                        typeof editedJob.location === 'object' && editedJob.location 
                          ? editedJob.locationAddress || `Lat: ${editedJob.location.lat?.toFixed(4)}, Lng: ${editedJob.location.lng?.toFixed(4)}`
                          : editedJob.locationAddress || editedJob.location || ''
                      } 
                      onChange={(e) => setEditedJob({ ...editedJob, locationAddress: e.target.value })}
                      className="resize-none" 
                      placeholder="Enter location address"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Vehicle Info</Label>
                    <Input 
                      value={editedJob.vin || editedJob.vehicle?.vin || ''} 
                      onChange={(e) => setEditedJob({ ...editedJob, vin: e.target.value })}
                      placeholder="VIN Number"
                    />
                    <Input 
                      value={editedJob.unitNumber || editedJob.vehicle?.unit || ''} 
                      onChange={(e) => setEditedJob({ ...editedJob, unitNumber: e.target.value })}
                      placeholder="Unit Number"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Price</Label>
                    <Input 
                      type="number"
                      step="0.01"
                      value={editedJob.price || 0} 
                      onChange={(e) => setEditedJob({ ...editedJob, price: parseFloat(e.target.value) || 0 })}
                      placeholder="0.00"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Created At</Label>
                    <Input value={format(editedJob.createdAt, 'PPpp')} readOnly />
                  </div>
                </div>

                <div className="flex gap-2 pt-4 justify-between">
                  <div className="flex gap-2">
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
                          jobId: editedJob.id,
                          status: 'cancelled',
                        });
                      }}
                      data-testid="button-cancel-job"
                    >
                      Cancel Job
                    </Button>
                  </div>
                  <Button
                    onClick={handleSaveChanges}
                    disabled={updateJobMutation.isPending}
                    data-testid="button-save-changes"
                  >
                    {updateJobMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Changes
                      </>
                    )}
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
                          {format(editedJob.createdAt, 'PPpp')}
                        </p>
                      </div>
                    </div>
                    {editedJob.startedAt && (
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
                            {format(editedJob.startedAt, 'PPpp')}
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
                <JobPhotoGalleryContent jobId={editedJob?.id || ''} />
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

// Component for the photos tab content
function JobPhotoGalleryContent({ jobId }: { jobId: string }) {
  const { data: photosData, isLoading, refetch } = useQuery({
    queryKey: [`/api/jobs/${jobId}/photos`],
    enabled: !!jobId,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const photos = photosData?.photos || [];

  return (
    <JobPhotoGallery
      jobId={jobId}
      photos={photos}
      canUpload={true}
      onPhotosChange={refetch}
    />
  );
}