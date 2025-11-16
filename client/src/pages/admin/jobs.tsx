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
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { format } from "date-fns";
import JobPhotoGallery from "@/components/job-photo-gallery";
import { WeatherBadge } from "@/components/weather-widget";
import {
  Search, Filter, Download, RefreshCw, MapPin, Clock, DollarSign,
  User, Truck, AlertCircle, CheckCircle, XCircle, Edit, Eye,
  MessageSquare, Camera, Ban, CreditCard, Loader2, Save, ChevronDown,
  FileText, Receipt, ChevronUp, Package, Cloud
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
  const [selectedContractorId, setSelectedContractorId] = useState<string>('');
  const [selectedAssigneeId, setSelectedAssigneeId] = useState<string>('');
  const [assigneeType, setAssigneeType] = useState<'contractor' | 'driver'>('contractor');
  const [showInvoiceDetails, setShowInvoiceDetails] = useState(false);
  const [expandedLineItems, setExpandedLineItems] = useState<string | null>(null);
  
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
    queryFn: async () => {
      console.log('[AssignDialog] Fetching available contractors...');
      const result = await apiRequest('GET', '/api/admin/contractors/available');
      console.log('[AssignDialog] Available contractors response:', result);
      console.log('[AssignDialog] Is array?', Array.isArray(result));
      console.log('[AssignDialog] Length:', result?.length);
      return result;
    },
    enabled: showAssignDialog,
  });

  // Query for drivers managed by selected contractor
  const { data: managedDrivers } = useQuery({
    queryKey: ['/api/admin/contractors', selectedContractorId, 'drivers'],
    queryFn: async () => apiRequest('GET', `/api/admin/contractors/${selectedContractorId}/drivers`),
    enabled: !!selectedContractorId && showAssignDialog,
  });
  
  // Query for service types
  const { data: serviceTypes } = useQuery({
    queryKey: ['/api/service-types'],
    queryFn: async () => apiRequest('GET', '/api/service-types'),
  });

  // Query for invoice data when job is completed
  const { data: invoiceData } = useQuery({
    queryKey: [`/api/admin/jobs/${selectedJob?.id}/invoice`],
    queryFn: async () => apiRequest('GET', `/api/admin/jobs/${selectedJob?.id}/invoice`),
    enabled: !!selectedJob?.id && selectedJob?.status === 'completed',
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
    mutationFn: async ({ jobId, contractorId, driverId }: { jobId: string; contractorId: string; driverId?: string }) => {
      return apiRequest('PUT', `/api/admin/jobs/${jobId}/assign`, { contractorId, driverId });
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
                type="search"
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
                  <TableHead>Weather</TableHead>
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
                        <TableCell className="font-mono">{job.jobNumber || job.id}</TableCell>
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
                        <TableCell>
                          {job.location && typeof job.location === 'object' && job.location.lat && job.location.lng ? (
                            <WeatherBadge lat={job.location.lat} lng={job.location.lng} />
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
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
                            {job.status === 'completed' && (
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => {
                                  setSelectedJob(job);
                                  setShowInvoiceDetails(true);
                                }}
                                data-testid={`button-invoice-${job.id}`}
                              >
                                <Receipt className="h-4 w-4" />
                              </Button>
                            )}
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
            <DialogTitle>Job Details - {editedJob?.jobNumber || editedJob?.id}</DialogTitle>
            <DialogDescription>
              Complete job information and management options
            </DialogDescription>
          </DialogHeader>
          
          {editedJob && (
            <Tabs defaultValue="details" className="mt-4">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="details">Details</TabsTrigger>
                {editedJob?.status === 'completed' && (
                  <TabsTrigger value="invoice">Invoice</TabsTrigger>
                )}
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

              {/* Invoice Tab - Only for completed jobs */}
              {editedJob?.status === 'completed' && (
                <TabsContent value="invoice" className="space-y-4">
                  {invoiceData ? (
                    <>
                      {/* Completion Notes */}
                      {invoiceData.completionNotes && (
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-sm font-medium flex items-center gap-2">
                              <FileText className="h-4 w-4" />
                              Completion Notes
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-sm whitespace-pre-wrap">{invoiceData.completionNotes}</p>
                          </CardContent>
                        </Card>
                      )}

                      {/* Line Items */}
                      <Card>
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-sm font-medium flex items-center gap-2">
                              <Package className="h-4 w-4" />
                              Invoice Line Items
                            </CardTitle>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setExpandedLineItems(
                                expandedLineItems === editedJob.id ? null : editedJob.id
                              )}
                              data-testid="button-toggle-line-items"
                            >
                              {expandedLineItems === editedJob.id ? (
                                <>
                                  <ChevronUp className="h-4 w-4 mr-1" />
                                  Collapse
                                </>
                              ) : (
                                <>
                                  <ChevronDown className="h-4 w-4 mr-1" />
                                  Expand
                                </>
                              )}
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent>
                          {expandedLineItems === editedJob.id ? (
                            <div className="space-y-4">
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Description</TableHead>
                                    <TableHead className="text-right">Qty</TableHead>
                                    <TableHead className="text-right">Unit Price</TableHead>
                                    <TableHead className="text-right">Total</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {invoiceData.lineItems?.map((item: any) => (
                                    <TableRow key={item.id}>
                                      <TableCell>
                                        <Badge variant="outline">{item.type}</Badge>
                                      </TableCell>
                                      <TableCell>{item.description}</TableCell>
                                      <TableCell className="text-right">{item.quantity}</TableCell>
                                      <TableCell className="text-right">${item.unitPrice?.toFixed(2)}</TableCell>
                                      <TableCell className="text-right font-medium">${item.total?.toFixed(2)}</TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                              
                              {/* Totals */}
                              <div className="flex justify-end">
                                <div className="w-full max-w-xs space-y-2">
                                  <div className="flex justify-between text-sm">
                                    <span>Subtotal</span>
                                    <span>${invoiceData.subtotal?.toFixed(2)}</span>
                                  </div>
                                  <div className="flex justify-between text-sm">
                                    <span>Tax</span>
                                    <span>${invoiceData.tax?.toFixed(2)}</span>
                                  </div>
                                  <Separator />
                                  <div className="flex justify-between font-bold">
                                    <span>Total</span>
                                    <span>${invoiceData.total?.toFixed(2)}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="flex justify-between items-center py-2">
                              <span className="text-sm text-muted-foreground">
                                {invoiceData.lineItems?.length || 0} line items
                              </span>
                              <span className="font-bold">
                                Total: ${invoiceData.total?.toFixed(2)}
                              </span>
                            </div>
                          )}
                        </CardContent>
                      </Card>

                      {/* Payment Status */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <CreditCard className="h-4 w-4" />
                            Payment Information
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm">Payment Status</span>
                            <Badge variant={invoiceData.paymentStatus === 'paid' ? 'default' : 'secondary'}>
                              {invoiceData.paymentStatus || 'Pending'}
                            </Badge>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm">Invoice Number</span>
                            <span className="text-sm font-mono">{invoiceData.invoiceNumber}</span>
                          </div>
                          {invoiceData.paidAt && (
                            <div className="flex justify-between">
                              <span className="text-sm">Paid At</span>
                              <span className="text-sm">{format(new Date(invoiceData.paidAt), 'PPp')}</span>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </>
                  ) : (
                    <Card>
                      <CardContent className="py-8">
                        <p className="text-center text-muted-foreground">
                          No invoice data available for this job
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>
              )}

              <TabsContent value="timeline">
                <ScrollArea className="h-[400px]">
                  <div className="space-y-4">
                    {/* Job Created Event */}
                    <div className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                          <AlertCircle className="h-4 w-4 text-green-600" />
                        </div>
                        <div className="h-full w-0.5 bg-border" />
                      </div>
                      <div className="flex-1 pb-4">
                        <p className="font-medium">Job Created</p>
                        <p className="text-sm text-muted-foreground">
                          {format(editedJob.createdAt, 'PPpp')}
                        </p>
                        <p className="text-sm mt-1">Job {editedJob.jobNumber || editedJob.id} was created</p>
                      </div>
                    </div>
                    
                    {/* Job Assigned Event */}
                    {editedJob.assignedAt && (
                      <div className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                            <User className="h-4 w-4 text-blue-600" />
                          </div>
                          <div className="h-full w-0.5 bg-border" />
                        </div>
                        <div className="flex-1 pb-4">
                          <p className="font-medium">Job Assigned</p>
                          <p className="text-sm text-muted-foreground">
                            {format(editedJob.assignedAt, 'PPpp')}
                          </p>
                          <p className="text-sm mt-1">
                            Assigned to {editedJob.contractor?.name || 'contractor'}
                          </p>
                        </div>
                      </div>
                    )}
                    
                    {/* En Route Event */}
                    {editedJob.enRouteAt && (
                      <div className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className="h-8 w-8 rounded-full bg-yellow-100 dark:bg-yellow-900/20 flex items-center justify-center">
                            <Truck className="h-4 w-4 text-yellow-600" />
                          </div>
                          <div className="h-full w-0.5 bg-border" />
                        </div>
                        <div className="flex-1 pb-4">
                          <p className="font-medium">En Route</p>
                          <p className="text-sm text-muted-foreground">
                            {format(editedJob.enRouteAt, 'PPpp')}
                          </p>
                          <p className="text-sm mt-1">Contractor is on the way</p>
                        </div>
                      </div>
                    )}
                    
                    {/* On Site Event */}
                    {editedJob.onSiteAt && (
                      <div className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className="h-8 w-8 rounded-full bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
                            <MapPin className="h-4 w-4 text-purple-600" />
                          </div>
                          <div className="h-full w-0.5 bg-border" />
                        </div>
                        <div className="flex-1 pb-4">
                          <p className="font-medium">Arrived On Site</p>
                          <p className="text-sm text-muted-foreground">
                            {format(editedJob.onSiteAt, 'PPpp')}
                          </p>
                          <p className="text-sm mt-1">Contractor arrived at location</p>
                        </div>
                      </div>
                    )}
                    
                    {/* Job Started (if different from on site) */}
                    {editedJob.startedAt && editedJob.startedAt !== editedJob.onSiteAt && (
                      <div className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className="h-8 w-8 rounded-full bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center">
                            <Wrench className="h-4 w-4 text-orange-600" />
                          </div>
                          <div className="h-full w-0.5 bg-border" />
                        </div>
                        <div className="flex-1 pb-4">
                          <p className="font-medium">Job Started</p>
                          <p className="text-sm text-muted-foreground">
                            {format(editedJob.startedAt, 'PPpp')}
                          </p>
                          <p className="text-sm mt-1">Work in progress</p>
                        </div>
                      </div>
                    )}
                    
                    {/* Job Completed Event */}
                    {editedJob.completedAt && (
                      <div className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          </div>
                          {editedJob.status !== 'completed' && <div className="h-full w-0.5 bg-border" />}
                        </div>
                        <div className="flex-1 pb-4">
                          <p className="font-medium">Job Completed</p>
                          <p className="text-sm text-muted-foreground">
                            {format(editedJob.completedAt, 'PPpp')}
                          </p>
                          <p className="text-sm mt-1">Job successfully completed</p>
                        </div>
                      </div>
                    )}
                    
                    {/* Job Cancelled Event */}
                    {editedJob.status === 'cancelled' && editedJob.cancelledAt && (
                      <div className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className="h-8 w-8 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                            <XCircle className="h-4 w-4 text-red-600" />
                          </div>
                        </div>
                        <div className="flex-1 pb-4">
                          <p className="font-medium">Job Cancelled</p>
                          <p className="text-sm text-muted-foreground">
                            {format(editedJob.cancelledAt, 'PPpp')}
                          </p>
                          <p className="text-sm mt-1">Job was cancelled</p>
                        </div>
                      </div>
                    )}
                    
                    {/* No Events Message */}
                    {!editedJob.assignedAt && !editedJob.enRouteAt && !editedJob.onSiteAt && !editedJob.startedAt && !editedJob.completedAt && editedJob.status !== 'cancelled' && (
                      <div className="text-center py-8 text-muted-foreground">
                        <p>No additional timeline events yet</p>
                        <p className="text-sm mt-1">Events will appear as the job progresses</p>
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
      <Dialog open={showAssignDialog} onOpenChange={(open) => {
        setShowAssignDialog(open);
        if (!open) {
          setSelectedContractorId('');
          setSelectedAssigneeId('');
          setAssigneeType('contractor');
        }
      }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Assign Contractor or Driver</DialogTitle>
            <DialogDescription>
              Select a contractor or their managed driver to assign to job {selectedJob?.id}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Step 1: Select Contractor */}
            <div className="space-y-2">
              <Label>Select Contractor</Label>
              <Select 
                value={selectedContractorId} 
                onValueChange={(value) => {
                  setSelectedContractorId(value);
                  setSelectedAssigneeId(value);
                  setAssigneeType('contractor');
                }}
              >
                <SelectTrigger data-testid="select-contractor">
                  <SelectValue placeholder="Choose a contractor..." />
                </SelectTrigger>
                <SelectContent>
                  {Array.isArray(contractors) && contractors.length > 0 ? (
                    contractors.map((contractor: any) => {
                      // Determine queue status and colors
                      const queueLength = contractor.queueLength || 0;
                      const isCurrentlyBusy = contractor.isCurrentlyBusy || false;
                      const totalQueuedJobs = contractor.totalQueuedJobs || 0;
                      
                      let queueBadgeVariant: "default" | "secondary" | "destructive" = "default";
                      let queueBadgeText = "Available";
                      let queueBadgeClass = "";
                      
                      if (totalQueuedJobs === 0) {
                        queueBadgeVariant = "secondary";
                        queueBadgeText = "Available";
                        queueBadgeClass = "bg-green-500 hover:bg-green-600 text-white";
                      } else if (totalQueuedJobs <= 2) {
                        queueBadgeVariant = "secondary";
                        queueBadgeText = `${totalQueuedJobs} job${totalQueuedJobs > 1 ? 's' : ''} queued`;
                        queueBadgeClass = "bg-yellow-500 hover:bg-yellow-600 text-white";
                      } else {
                        queueBadgeVariant = "destructive";
                        queueBadgeText = `${totalQueuedJobs} jobs queued`;
                        queueBadgeClass = "bg-red-500 hover:bg-red-600 text-white";
                      }
                      
                      return (
                        <SelectItem key={contractor.id} value={contractor.id}>
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{contractor.name}</span>
                              <Badge 
                                variant={queueBadgeVariant}
                                className={`h-5 px-1.5 text-xs ${queueBadgeClass}`}
                              >
                                {queueBadgeText}
                              </Badge>
                            </div>
                            
                            {/* Current job information if contractor is busy */}
                            {contractor.currentJob && (
                              <div className="text-xs text-muted-foreground ml-2">
                                <span className="font-medium">Current: </span>
                                Job {contractor.currentJobNumber} - {contractor.currentJob.jobNumber}
                                {contractor.currentJob.serviceType && (
                                  <span> ({contractor.currentJob.serviceType})</span>
                                )}
                                {contractor.currentJob.customerName && (
                                  <span> - {contractor.currentJob.customerName}</span>
                                )}
                              </div>
                            )}
                            
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              {contractor.distance > 0 && <span>{contractor.distance} mi</span>}
                              <span>{contractor.averageRating || contractor.rating || 0} ⭐</span>
                              <span className="capitalize">{contractor.performanceTier || contractor.tier || 'bronze'} tier</span>
                              {/* Next position in queue */}
                              {totalQueuedJobs > 0 && (
                                <span className="text-muted-foreground">
                                  • This job will be #{totalQueuedJobs + 1} in queue
                                </span>
                              )}
                            </div>
                          </div>
                        </SelectItem>
                      );
                    })
                  ) : (
                    <div className="px-2 py-1 text-sm text-muted-foreground">
                      No contractors available
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Step 2: Optionally Select Driver (if contractor has managed drivers) */}
            {selectedContractorId && managedDrivers && managedDrivers.length > 0 && (
              <div className="space-y-2">
                <Label>Or Assign to Managed Driver</Label>
                <Select 
                  value={assigneeType === 'driver' ? selectedAssigneeId : ''} 
                  onValueChange={(value) => {
                    setSelectedAssigneeId(value);
                    setAssigneeType('driver');
                  }}
                >
                  <SelectTrigger data-testid="select-driver">
                    <SelectValue placeholder="Choose a driver managed by this contractor..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">
                      <span className="text-muted-foreground">Assign to contractor directly</span>
                    </SelectItem>
                    {managedDrivers.map((driver: any) => (
                      <SelectItem key={driver.id} value={driver.id}>
                        <div className="flex items-center justify-between w-full">
                          <span>{driver.firstName} {driver.lastName}</span>
                          <span className="text-xs text-muted-foreground">
                            {driver.phoneNumber}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Assignment Summary with Queue Warning */}
            {selectedContractorId && (
              <div className="p-3 bg-muted rounded-lg">
                {(() => {
                  const selectedContractor = contractors?.find((c: any) => c.id === selectedContractorId);
                  const totalQueuedJobs = selectedContractor?.totalQueuedJobs || 0;
                  const isCurrentlyBusy = selectedContractor?.isCurrentlyBusy || false;
                  
                  if (totalQueuedJobs > 0) {
                    return (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="h-4 w-4 text-yellow-600" />
                          <p className="text-sm font-medium text-yellow-600">
                            Queue Notice
                          </p>
                        </div>
                        <p className="text-sm">
                          This contractor has <span className="font-medium">{totalQueuedJobs} job{totalQueuedJobs > 1 ? 's' : ''}</span> in queue.
                          This job will be <span className="font-medium">#{totalQueuedJobs + 1}</span> in their queue.
                        </p>
                        {selectedContractor?.currentJob && (
                          <p className="text-sm text-muted-foreground">
                            Currently working on: {selectedContractor.currentJob.jobNumber}
                            {selectedContractor.currentJob.serviceType && ` (${selectedContractor.currentJob.serviceType})`}
                          </p>
                        )}
                        <p className="text-sm text-muted-foreground">
                          The job will be automatically assigned when the contractor becomes available.
                        </p>
                      </div>
                    );
                  }
                  
                  return (
                    <p className="text-sm">
                      <span className="font-medium">Assignment:</span> Job will be assigned to{' '}
                      <span className="font-medium">
                        {assigneeType === 'contractor' 
                          ? selectedContractor?.name
                          : managedDrivers?.find((d: any) => d.id === selectedAssigneeId)?.firstName + ' ' + 
                            managedDrivers?.find((d: any) => d.id === selectedAssigneeId)?.lastName}
                      </span>
                      {assigneeType === 'driver' && (
                        <span className="text-muted-foreground"> (Driver managed by contractor)</span>
                      )}
                      <span className="text-green-600 ml-2">(Available immediately)</span>
                    </p>
                  );
                })()}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowAssignDialog(false);
              setSelectedContractorId('');
              setSelectedAssigneeId('');
              setAssigneeType('contractor');
            }}>
              Cancel
            </Button>
            <Button 
              onClick={() => {
                const selectedContractor = contractors?.find((c: any) => c.id === selectedContractorId);
                const totalQueuedJobs = selectedContractor?.totalQueuedJobs || 0;
                
                // Show confirmation for busy contractors
                if (totalQueuedJobs > 0) {
                  const confirmed = window.confirm(
                    `This contractor has ${totalQueuedJobs} job${totalQueuedJobs > 1 ? 's' : ''} in queue.\n` +
                    `This job will be #${totalQueuedJobs + 1} in their queue.\n\n` +
                    `Do you want to proceed with queuing this job?`
                  );
                  
                  if (!confirmed) {
                    return;
                  }
                }
                
                assignContractorMutation.mutate({
                  jobId: selectedJob?.id,
                  contractorId: selectedContractorId,
                  driverId: assigneeType === 'driver' ? selectedAssigneeId : undefined,
                });
              }}
              disabled={!selectedContractorId || assignContractorMutation.isPending}
              variant={(() => {
                const selectedContractor = contractors?.find((c: any) => c.id === selectedContractorId);
                const totalQueuedJobs = selectedContractor?.totalQueuedJobs || 0;
                return totalQueuedJobs > 0 ? 'secondary' : 'default';
              })()}
            >
              {assignContractorMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {(() => {
                    const selectedContractor = contractors?.find((c: any) => c.id === selectedContractorId);
                    const totalQueuedJobs = selectedContractor?.totalQueuedJobs || 0;
                    return totalQueuedJobs > 0 ? 'Queuing...' : 'Assigning...';
                  })()}
                </>
              ) : (
                <>
                  {(() => {
                    const selectedContractor = contractors?.find((c: any) => c.id === selectedContractorId);
                    const totalQueuedJobs = selectedContractor?.totalQueuedJobs || 0;
                    if (totalQueuedJobs > 0) {
                      return `Add to Queue (Position #${totalQueuedJobs + 1})`;
                    }
                    return 'Assign Now';
                  })()}
                </>
              )}
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