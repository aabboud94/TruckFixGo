import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { format } from "date-fns";
import { 
  Search, 
  MapPin, 
  Clock, 
  Truck, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  RefreshCw,
  Home,
  Activity,
  DollarSign,
  Calendar,
  ChevronRight,
  Filter
} from "lucide-react";

export default function JobsDashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);

  // Query for all jobs
  const { data: jobsData, isLoading, error, refetch } = useQuery({
    queryKey: ['/api/jobs', { status: statusFilter, type: typeFilter, search: searchQuery }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (typeFilter !== 'all') params.append('jobType', typeFilter);
      if (searchQuery) params.append('search', searchQuery);
      
      const response = await fetch(`/api/jobs?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch jobs');
      }
      
      return response.json();
    },
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  const jobs = jobsData?.jobs || [];

  // Calculate statistics
  const stats = {
    total: jobs.length,
    emergency: jobs.filter(j => j.jobType === 'emergency').length,
    active: jobs.filter(j => ['new', 'assigned', 'en_route', 'on_site'].includes(j.status)).length,
    completed: jobs.filter(j => j.status === 'completed').length
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'destructive';
      case 'assigned': return 'blue';
      case 'en_route': return 'yellow';
      case 'on_site': return 'orange';
      case 'completed': return 'green';
      case 'cancelled': return 'gray';
      default: return 'secondary';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'new': return <AlertTriangle className="h-4 w-4" />;
      case 'assigned': return <Truck className="h-4 w-4" />;
      case 'en_route': return <Activity className="h-4 w-4" />;
      case 'on_site': return <Clock className="h-4 w-4" />;
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'cancelled': return <XCircle className="h-4 w-4" />;
      default: return null;
    }
  };

  const formatJobType = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  const handleViewDetails = (jobId: string) => {
    setLocation(`/job-details/${jobId}`);
  };

  const handleTrackJob = (jobId: string) => {
    setLocation(`/track/${jobId}`);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-3 md:px-4 py-4 md:py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <h1 className="text-xl md:text-3xl font-bold">Jobs Dashboard</h1>
              <p className="text-sm md:text-base text-muted-foreground mt-1">
                {isMobile ? 'Service jobs' : 'Monitor and manage all service jobs'}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size={isMobile ? "sm" : "default"}
                onClick={() => setLocation("/")}
                data-testid="button-home"
                className="flex-1 md:flex-initial"
              >
                <Home className="h-4 w-4 mr-1 md:mr-2" />
                <span className="hidden sm:inline">Home</span>
              </Button>
              <Button
                onClick={() => refetch()}
                variant="outline"
                size={isMobile ? "sm" : "default"}
                data-testid="button-refresh"
                className="flex-1 md:flex-initial"
              >
                <RefreshCw className="h-4 w-4 mr-1 md:mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-3 md:px-4 py-4 md:py-8">
        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-4 md:mb-6">
          <Card>
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <p className="text-xs md:text-sm font-medium text-muted-foreground">Total Jobs</p>
                  <p className="text-xl md:text-2xl font-bold">{stats.total}</p>
                </div>
                <Activity className="h-6 w-6 md:h-8 md:w-8 text-primary opacity-20 flex-shrink-0" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <p className="text-xs md:text-sm font-medium text-muted-foreground">Active</p>
                  <p className="text-xl md:text-2xl font-bold text-destructive">{stats.active}</p>
                </div>
                <AlertTriangle className="h-6 w-6 md:h-8 md:w-8 text-destructive opacity-20 flex-shrink-0" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <p className="text-xs md:text-sm font-medium text-muted-foreground">Emergency</p>
                  <p className="text-xl md:text-2xl font-bold text-orange-600">{stats.emergency}</p>
                </div>
                <Clock className="h-6 w-6 md:h-8 md:w-8 text-orange-600 opacity-20 flex-shrink-0" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <p className="text-xs md:text-sm font-medium text-muted-foreground">Completed</p>
                  <p className="text-xl md:text-2xl font-bold text-green-600">{stats.completed}</p>
                </div>
                <CheckCircle className="h-6 w-6 md:h-8 md:w-8 text-green-600 opacity-20 flex-shrink-0" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-4 md:mb-6">
          <CardHeader 
            className="cursor-pointer md:cursor-default"
            onClick={() => isMobile && setShowFilters(!showFilters)}
          >
            <CardTitle className="text-base md:text-xl flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Filter className="h-4 md:h-5 w-4 md:w-5" />
                <span>Filter Jobs</span>
                {isMobile && (searchQuery || statusFilter !== 'all' || typeFilter !== 'all') && (
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
            <div className="flex flex-col md:flex-row gap-3 md:gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder={isMobile ? "Search jobs..." : "Search by job number, location, or customer..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-10"
                  data-testid="input-search"
                />
              </div>
              
              <div className="flex gap-2 flex-1 md:flex-initial">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="h-10 flex-1 md:w-[180px]" data-testid="select-status">
                    <SelectValue placeholder="Status" />
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
                  <SelectTrigger className="h-10 flex-1 md:w-[180px]" data-testid="select-type">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="emergency">Emergency</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Jobs Table/Cards */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base md:text-xl">All Jobs</CardTitle>
          </CardHeader>
          <CardContent className="p-0 md:p-0">
            {isLoading ? (
              <div className="p-4 md:p-6 space-y-3 md:space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex gap-4">
                    <Skeleton className="h-20 md:h-12 flex-1" />
                  </div>
                ))}
              </div>
            ) : error ? (
              <Alert variant="destructive" className="m-4 md:m-6">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Failed to load jobs. Please try refreshing the page.
                </AlertDescription>
              </Alert>
            ) : jobs.length === 0 ? (
              <div className="p-8 md:p-12 text-center">
                <Activity className="h-10 w-10 md:h-12 md:w-12 text-muted-foreground mx-auto mb-3 md:mb-4" />
                <p className="text-base md:text-lg font-medium">No jobs found</p>
                <p className="text-sm md:text-base text-muted-foreground mt-2">
                  {searchQuery || statusFilter !== 'all' || typeFilter !== 'all' 
                    ? "Try adjusting your filters" 
                    : "Jobs will appear here when created"}
                </p>
              </div>
            ) : (
              <>
                {/* Mobile Card View */}
                <div className="md:hidden divide-y">
                  {jobs.map((job: any) => (
                    <div key={job.id} className="p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className="font-semibold text-sm">
                              {job.jobNumber || `JOB-${job.id.slice(0, 8)}`}
                            </span>
                            <Badge variant={job.jobType === 'emergency' ? 'destructive' : 'secondary'} className="text-xs">
                              {formatJobType(job.jobType)}
                            </Badge>
                            <Badge 
                              className="flex items-center gap-1 text-xs"
                              // @ts-ignore
                              variant={getStatusColor(job.status)}
                            >
                              {getStatusIcon(job.status)}
                              {job.status.replace('_', ' ')}
                            </Badge>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            <Calendar className="inline h-3 w-3 mr-1" />
                            {job.createdAt ? format(new Date(job.createdAt), 'MMM d, h:mm a') : 'N/A'}
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-2 text-sm">
                        <div className="flex items-start gap-1">
                          <MapPin className="h-3 w-3 text-muted-foreground mt-0.5 flex-shrink-0" />
                          <span className="line-clamp-2">
                            {job.locationAddress || 'GPS Location'}
                          </span>
                        </div>
                        
                        <div>
                          <span className="text-muted-foreground">Service: </span>
                          <span>{job.issueType || 'General Service'}</span>
                        </div>
                        
                        <div>
                          <span className="text-muted-foreground">Customer: </span>
                          <span>{job.customerPhone || 'Guest'}</span>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 h-10"
                          onClick={() => handleViewDetails(job.id)}
                          data-testid={`button-view-mobile-${job.id}`}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        {['assigned', 'en_route', 'on_site'].includes(job.status) && (
                          <Button
                            size="sm"
                            variant="default"
                            className="flex-1 h-10"
                            onClick={() => handleTrackJob(job.id)}
                            data-testid={`button-track-mobile-${job.id}`}
                          >
                            <MapPin className="h-4 w-4 mr-1" />
                            Track
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Job Number</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Service Type</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {jobs.map((job: any) => (
                        <TableRow key={job.id} className="hover:bg-muted/50">
                          <TableCell className="font-medium">
                            {job.jobNumber || `JOB-${job.id.slice(0, 8)}`}
                          </TableCell>
                          <TableCell>
                            <Badge variant={job.jobType === 'emergency' ? 'destructive' : 'secondary'}>
                              {formatJobType(job.jobType)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge 
                              className="flex items-center gap-1 w-fit"
                              // @ts-ignore
                              variant={getStatusColor(job.status)}
                            >
                              {getStatusIcon(job.status)}
                              {job.status.replace('_', ' ')}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3 text-muted-foreground" />
                              <span className="text-sm">
                                {job.locationAddress || 'GPS Location'}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {job.issueType || 'General Service'}
                          </TableCell>
                          <TableCell>
                            {job.customerPhone || 'Guest'}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3 text-muted-foreground" />
                              <span className="text-sm">
                                {job.createdAt ? format(new Date(job.createdAt), 'MMM d, h:mm a') : 'N/A'}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleViewDetails(job.id)}
                                data-testid={`button-view-${job.id}`}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              {['assigned', 'en_route', 'on_site'].includes(job.status) && (
                                <Button
                                  size="sm"
                                  variant="default"
                                  onClick={() => handleTrackJob(job.id)}
                                  data-testid={`button-track-${job.id}`}
                                >
                                  <MapPin className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
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
      </div>
    </div>
  );
}