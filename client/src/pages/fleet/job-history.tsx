import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  ArrowLeft,
  Download,
  Filter,
  RefreshCw,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  DollarSign,
  Truck,
  MapPin,
  Calendar,
  Search,
  ChevronRight,
  User
} from "lucide-react";

interface Job {
  id: string;
  jobNumber: string;
  createdAt: string;
  completedAt?: string;
  serviceType: string;
  status: string;
  vehicleId?: string;
  vehicleUnit?: string;
  description: string;
  location?: string;
  estimatedCost?: number;
  actualCost?: number;
  contractorName?: string;
  customerName?: string;
  notes?: string;
}

export default function FleetJobHistory() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Get fleet account first
  const { data: fleetAccounts, isLoading: isLoadingFleet } = useQuery({
    queryKey: ['/api/fleet/accounts'],
    enabled: true,
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/fleet/accounts');
      return response.fleets?.[0] || null;
    }
  });

  const fleetId = fleetAccounts?.id;

  // Fetch jobs for the fleet
  const { 
    data: jobsData, 
    isLoading: isLoadingJobs, 
    refetch: refetchJobs 
  } = useQuery({
    queryKey: [`/api/fleet/${fleetId}/jobs`, selectedStatus, searchQuery, dateFrom, dateTo],
    enabled: !!fleetId,
    queryFn: async () => {
      if (!fleetId) return { jobs: [] };
      
      const params = new URLSearchParams();
      if (selectedStatus !== "all") params.append('status', selectedStatus);
      if (searchQuery) params.append('search', searchQuery);
      if (dateFrom) params.append('dateFrom', dateFrom);
      if (dateTo) params.append('dateTo', dateTo);
      
      const queryString = params.toString() ? `?${params.toString()}` : '';
      
      try {
        return await apiRequest('GET', `/api/fleet/${fleetId}/jobs${queryString}`);
      } catch (error) {
        console.error('Failed to fetch jobs:', error);
        return { jobs: [] };
      }
    }
  });

  const jobs = jobsData?.jobs || [];

  // Export jobs to CSV
  const handleExport = async () => {
    if (!fleetId) {
      toast({
        title: "Export Failed",
        description: "No fleet account found",
        variant: "destructive"
      });
      return;
    }

    setIsExporting(true);
    try {
      const params = new URLSearchParams();
      if (selectedStatus !== "all") params.append('status', selectedStatus);
      if (dateFrom) params.append('dateFrom', dateFrom);
      if (dateTo) params.append('dateTo', dateTo);
      
      const queryString = params.toString() ? `?${params.toString()}` : '';
      
      const response = await fetch(`/api/fleet/${fleetId}/jobs/export${queryString}`, {
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
      const filename = filenameMatch ? filenameMatch[1] : `fleet-jobs-${Date.now()}.csv`;

      // Create blob and download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Export Successful",
        description: `Jobs exported to ${filename}`,
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export jobs. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
    }
  };

  // Generate maintenance report
  const handleMaintenanceReport = async () => {
    if (!fleetId) return;

    try {
      const params = new URLSearchParams();
      params.append('format', 'csv');
      if (dateFrom) params.append('dateFrom', dateFrom);
      if (dateTo) params.append('dateTo', dateTo);
      
      const response = await fetch(`/api/reports/fleet/${fleetId}/maintenance?${params.toString()}`, {
        method: 'GET',
        credentials: 'include'
      });

      if (!response.ok) throw new Error('Report generation failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `maintenance-report-${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Report Generated",
        description: "Maintenance report downloaded successfully",
      });
    } catch (error) {
      toast({
        title: "Report Failed",
        description: "Failed to generate maintenance report",
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: "Pending", variant: "secondary" as const, icon: Clock },
      assigned: { label: "Assigned", variant: "default" as const, icon: Clock },
      in_progress: { label: "In Progress", variant: "default" as const, icon: RefreshCw },
      completed: { label: "Completed", variant: "success" as const, icon: CheckCircle },
      cancelled: { label: "Cancelled", variant: "destructive" as const, icon: XCircle }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  const isLoading = isLoadingFleet || isLoadingJobs;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-4 md:py-8 max-w-7xl px-3 md:px-4">
        {/* Header */}
        <div className="mb-4 md:mb-8">
          {/* Mobile header */}
          <div className="flex flex-col space-y-3 md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation("/fleet/dashboard")}
              className="w-fit"
              data-testid="button-back"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Job History</h1>
              <p className="text-sm text-muted-foreground">View your fleet service history</p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={handleMaintenanceReport}
                disabled={!fleetId || isExporting}
                className="flex-1 min-w-[140px]"
                data-testid="button-maintenance-report"
              >
                <FileText className="mr-1 h-4 w-4" />
                <span className="truncate">Report</span>
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={handleExport}
                disabled={!fleetId || isExporting}
                className="flex-1 min-w-[140px]"
                data-testid="button-export"
              >
                <Download className="mr-1 h-4 w-4" />
                <span className="truncate">{isExporting ? "Exporting..." : "Export CSV"}</span>
              </Button>
            </div>
          </div>

          {/* Desktop header */}
          <div className="hidden md:flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLocation("/fleet/dashboard")}
                data-testid="button-back-desktop"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <div>
                <h1 className="text-3xl font-bold">Job History</h1>
                <p className="text-muted-foreground">View and export your fleet service history</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleMaintenanceReport}
                disabled={!fleetId || isExporting}
                data-testid="button-maintenance-report-desktop"
              >
                <FileText className="mr-2 h-4 w-4" />
                Maintenance Report
              </Button>
              <Button
                variant="default"
                onClick={handleExport}
                disabled={!fleetId || isExporting}
                data-testid="button-export-desktop"
              >
                <Download className="mr-2 h-4 w-4" />
                {isExporting ? "Exporting..." : "Export to CSV"}
              </Button>
            </div>
          </div>
        </div>

        {/* Filters - Mobile collapsible */}
        <Card className="mb-4 md:mb-6">
          <CardHeader 
            className="cursor-pointer md:cursor-default"
            onClick={() => isMobile && setShowFilters(!showFilters)}
          >
            <CardTitle className="text-base md:text-lg flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Filter className="h-4 md:h-5 w-4 md:w-5" />
                <span>Filters</span>
                {isMobile && (searchQuery || selectedStatus !== 'all' || dateFrom || dateTo) && (
                  <Badge variant="secondary" className="ml-2">Active</Badge>
                )}
              </div>
              {isMobile && (
                <ChevronRight 
                  className={`h-4 w-4 transition-transform ${showFilters ? 'rotate-90' : ''}`} 
                />
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className={isMobile && !showFilters ? 'hidden' : ''}>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
              <div className="sm:col-span-2 md:col-span-1">
                <label className="text-sm font-medium mb-2 block">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Job #, vehicle..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 h-10"
                    data-testid="input-search"
                  />
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Status</label>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className="h-10" data-testid="select-status">
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="assigned">Assigned</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">From Date</label>
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="h-10"
                  data-testid="input-date-from"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">To Date</label>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="h-10"
                  data-testid="input-date-to"
                />
              </div>
            </div>
            
            <div className="mt-3 md:mt-4 flex justify-end">
              <Button
                variant="outline"
                size={isMobile ? "sm" : "default"}
                onClick={() => {
                  setSelectedStatus("all");
                  setSearchQuery("");
                  setDateFrom("");
                  setDateTo("");
                }}
                data-testid="button-clear-filters"
              >
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Jobs Table/Cards */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="text-base md:text-xl">Service History</span>
              <Badge variant="secondary" className="text-xs md:text-sm">{jobs.length} jobs</Badge>
            </CardTitle>
            <CardDescription className="text-sm">
              {isMobile ? 'Fleet service records' : 'All service and maintenance records for your fleet vehicles'}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0 md:p-6">
            {isLoading ? (
              <div className="p-4 md:p-0 space-y-3 md:space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-24 md:h-16" />
                ))}
              </div>
            ) : jobs.length === 0 ? (
              <div className="text-center py-8 px-4 text-muted-foreground">
                <Truck className="h-10 w-10 md:h-12 md:w-12 mx-auto mb-3 md:mb-4 opacity-50" />
                <p className="text-sm md:text-base">No jobs found matching your criteria</p>
              </div>
            ) : (
              <>
                {/* Mobile Card View */}
                <div className="md:hidden divide-y">
                  {jobs.map((job: Job) => (
                    <div key={job.id} className="p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-sm">{job.jobNumber}</span>
                            {getStatusBadge(job.status)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            <Calendar className="inline h-3 w-3 mr-1" />
                            {format(new Date(job.createdAt), "MMM dd, yyyy")}
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-muted-foreground block text-xs mb-1">Vehicle</span>
                          <span className="font-medium truncate block">
                            {job.vehicleUnit || "N/A"}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground block text-xs mb-1">Cost</span>
                          <span className="font-medium">
                            ${(job.actualCost || job.estimatedCost || 0).toFixed(2)}
                          </span>
                        </div>
                      </div>
                      
                      <div className="text-sm">
                        <span className="text-muted-foreground block text-xs mb-1">Service</span>
                        <span className="line-clamp-2">
                          {job.serviceType || job.description}
                        </span>
                      </div>
                      
                      {job.contractorName && (
                        <div className="text-sm">
                          <span className="text-muted-foreground block text-xs mb-1">Contractor</span>
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {job.contractorName}
                          </span>
                        </div>
                      )}
                      
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full h-10"
                        onClick={() => setLocation(`/fleet/job-details?id=${job.id}`)}
                        data-testid={`button-view-mobile-${job.id}`}
                      >
                        View Details
                        <ChevronRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>

                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Job #</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Vehicle</TableHead>
                        <TableHead>Service Type</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Contractor</TableHead>
                        <TableHead>Cost</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {jobs.map((job: Job) => (
                        <TableRow key={job.id}>
                          <TableCell className="font-medium">
                            {job.jobNumber}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="text-sm">
                                {format(new Date(job.createdAt), "MMM dd, yyyy")}
                              </span>
                              {job.completedAt && (
                                <span className="text-xs text-muted-foreground">
                                  Completed: {format(new Date(job.completedAt), "MMM dd")}
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {job.vehicleUnit || "N/A"}
                          </TableCell>
                          <TableCell>
                            {job.serviceType || job.description.substring(0, 30) + "..."}
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(job.status)}
                          </TableCell>
                          <TableCell>
                            {job.contractorName || "Unassigned"}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              {job.actualCost ? (
                                <>
                                  <span className="font-medium">
                                    ${job.actualCost.toFixed(2)}
                                  </span>
                                  {job.estimatedCost && (
                                    <span className="text-xs text-muted-foreground">
                                      Est: ${job.estimatedCost.toFixed(2)}
                                    </span>
                                  )}
                                </>
                              ) : job.estimatedCost ? (
                                <span className="text-muted-foreground">
                                  Est: ${job.estimatedCost.toFixed(2)}
                                </span>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setLocation(`/fleet/job-details?id=${job.id}`)}
                              data-testid={`button-view-${job.id}`}
                            >
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mt-4 md:mt-6">
          <Card>
            <CardContent className="p-4 md:pt-6">
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <p className="text-xs md:text-sm font-medium text-muted-foreground">Total Jobs</p>
                  <p className="text-xl md:text-2xl font-bold">{jobs.length}</p>
                </div>
                <Truck className="h-6 w-6 md:h-8 md:w-8 text-muted-foreground flex-shrink-0" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 md:pt-6">
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <p className="text-xs md:text-sm font-medium text-muted-foreground">Completed</p>
                  <p className="text-xl md:text-2xl font-bold text-green-600">
                    {jobs.filter(j => j.status === 'completed').length}
                  </p>
                </div>
                <CheckCircle className="h-6 w-6 md:h-8 md:w-8 text-green-600 flex-shrink-0" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 md:pt-6">
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <p className="text-xs md:text-sm font-medium text-muted-foreground">In Progress</p>
                  <p className="text-xl md:text-2xl font-bold text-blue-600">
                    {jobs.filter(j => j.status === 'in_progress' || j.status === 'assigned').length}
                  </p>
                </div>
                <Clock className="h-6 w-6 md:h-8 md:w-8 text-blue-600 flex-shrink-0" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 md:pt-6">
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <p className="text-xs md:text-sm font-medium text-muted-foreground">Total Cost</p>
                  <p className="text-lg md:text-2xl font-bold truncate">
                    ${jobs.reduce((sum, j) => sum + (j.actualCost || j.estimatedCost || 0), 0).toFixed(2)}
                  </p>
                </div>
                <DollarSign className="h-6 w-6 md:h-8 md:w-8 text-muted-foreground flex-shrink-0" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}