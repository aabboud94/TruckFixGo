import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import {
  MapPin,
  Clock,
  DollarSign,
  Phone,
  Navigation,
  CheckCircle,
  AlertCircle,
  XCircle,
  Calendar as CalendarIcon,
  Filter,
  Download,
  ChevronRight,
  Truck,
  Timer,
  Star,
  MessageSquare
} from "lucide-react";
import { format, formatDistanceToNow, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";
import { cn } from "@/lib/utils";

interface Job {
  id: string;
  jobNumber: string;
  status: string;
  jobType: "emergency" | "scheduled";
  serviceType: string;
  customerName: string;
  customerPhone: string;
  vehicleInfo: string;
  location: {
    address: string;
    lat: number;
    lng: number;
  };
  issueDescription: string;
  scheduledAt?: string;
  assignedAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  estimatedPayout: number;
  actualPayout?: number;
  tips?: number;
  rating?: number;
  customerReview?: string;
  photos?: string[];
  completionNotes?: string;
}

export default function ContractorJobs() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("active");
  const [filterServiceType, setFilterServiceType] = useState<string>("all");
  const [filterDateRange, setFilterDateRange] = useState<string>("all");
  const [customDateRange, setCustomDateRange] = useState<{ from?: Date; to?: Date }>({});
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch jobs based on status
  const { data: activeJobs, isLoading: loadingActive } = useQuery<Job[]>({
    queryKey: ["/api/contractor/jobs/active"],
    enabled: activeTab === "active"
  });

  const { data: availableJobs, isLoading: loadingAvailable, refetch: refetchAvailable } = useQuery<Job[]>({
    queryKey: ["/api/contractor/jobs/available"],
    enabled: activeTab === "available",
    refetchInterval: 30000 // Auto-refresh every 30 seconds
  });

  const { data: scheduledJobs, isLoading: loadingScheduled } = useQuery<Job[]>({
    queryKey: ["/api/contractor/jobs/scheduled"],
    enabled: activeTab === "scheduled"
  });

  const { data: completedJobs, isLoading: loadingCompleted } = useQuery<Job[]>({
    queryKey: ["/api/contractor/jobs/completed"],
    enabled: activeTab === "completed"
  });

  // Accept job mutation
  const acceptJobMutation = useMutation({
    mutationFn: async (jobId: string) => {
      return await apiRequest("POST", `/api/jobs/${jobId}/accept`);
    },
    onSuccess: () => {
      toast({
        title: "Job Accepted",
        description: "The job has been added to your active jobs"
      });
      // Invalidate both available and active jobs queries
      queryClient.invalidateQueries({ queryKey: ["/api/contractor/jobs/available"] });
      queryClient.invalidateQueries({ queryKey: ["/api/contractor/jobs/active"] });
      queryClient.invalidateQueries({ queryKey: ["/api/contractor/jobs/scheduled"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to accept job",
        variant: "destructive"
      });
    }
  });

  // Cancel job mutation
  const cancelJobMutation = useMutation({
    mutationFn: async (jobId: string) => {
      return await apiRequest("POST", `/api/jobs/${jobId}/cancel`, {
        reason: "Contractor cancelled"
      });
    },
    onSuccess: () => {
      toast({
        title: "Job Cancelled",
        description: "The job has been cancelled"
      });
      // Invalidate active and completed jobs queries (cancelled jobs might be visible in completed)
      queryClient.invalidateQueries({ queryKey: ["/api/contractor/jobs/active"] });
      queryClient.invalidateQueries({ queryKey: ["/api/contractor/jobs/scheduled"] });
      queryClient.invalidateQueries({ queryKey: ["/api/contractor/jobs/completed"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to cancel job",
        variant: "destructive"
      });
    }
  });

  const filterJobs = (jobs: Job[] | undefined) => {
    if (!jobs) return [];

    let filtered = [...jobs];

    // Filter by service type
    if (filterServiceType !== "all") {
      filtered = filtered.filter(job => job.serviceType === filterServiceType);
    }

    // Filter by date range
    if (filterDateRange !== "all" && filterDateRange !== "custom") {
      const now = new Date();
      let fromDate: Date;
      let toDate: Date = now;

      switch (filterDateRange) {
        case "today":
          fromDate = new Date(now.setHours(0, 0, 0, 0));
          break;
        case "week":
          fromDate = startOfWeek(now);
          toDate = endOfWeek(now);
          break;
        case "month":
          fromDate = startOfMonth(now);
          toDate = endOfMonth(now);
          break;
        default:
          fromDate = new Date(0);
      }

      filtered = filtered.filter(job => {
        const jobDate = new Date(job.assignedAt || job.scheduledAt || job.completedAt || "");
        return jobDate >= fromDate && jobDate <= toDate;
      });
    }

    // Custom date range
    if (filterDateRange === "custom" && (customDateRange.from || customDateRange.to)) {
      filtered = filtered.filter(job => {
        const jobDate = new Date(job.assignedAt || job.scheduledAt || job.completedAt || "");
        if (customDateRange.from && jobDate < customDateRange.from) return false;
        if (customDateRange.to && jobDate > customDateRange.to) return false;
        return true;
      });
    }

    // Search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(job => 
        job.jobNumber.toLowerCase().includes(query) ||
        job.customerName.toLowerCase().includes(query) ||
        job.issueDescription.toLowerCase().includes(query) ||
        job.vehicleInfo.toLowerCase().includes(query)
      );
    }

    return filtered;
  };

  const exportToCSV = () => {
    const jobs = activeTab === "completed" ? completedJobs : [];
    if (!jobs || jobs.length === 0) {
      toast({
        title: "No Data",
        description: "No jobs to export",
        variant: "destructive"
      });
      return;
    }

    const csv = [
      ["Job Number", "Date", "Service Type", "Customer", "Status", "Payout", "Tips", "Rating"],
      ...jobs.map(job => [
        job.jobNumber,
        format(new Date(job.completedAt || ""), "MM/dd/yyyy"),
        job.serviceType,
        job.customerName,
        job.status,
        job.actualPayout?.toFixed(2) || job.estimatedPayout.toFixed(2),
        job.tips?.toFixed(2) || "0.00",
        job.rating?.toString() || "N/A"
      ])
    ];

    const csvContent = csv.map(row => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `jobs-${activeTab}-${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Export Successful",
      description: "Jobs have been exported to CSV"
    });
  };

  const renderJobCard = (job: Job) => {
    const statusColors = {
      new: "border-l-gray-400",
      assigned: "border-l-blue-600",
      en_route: "border-l-yellow-600",
      on_site: "border-l-orange-600",
      completed: "border-l-green-600",
      cancelled: "border-l-red-600"
    };

    return (
      <Card key={job.id} className={`border-l-4 ${statusColors[job.status as keyof typeof statusColors] || ''}`}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-mono text-muted-foreground">#{job.jobNumber}</span>
                <Badge variant={job.jobType === 'emergency' ? 'destructive' : 'default'}>
                  {job.jobType?.toUpperCase()}
                </Badge>
                <Badge variant="outline">{job.status?.toUpperCase()}</Badge>
              </div>
              
              <div className="space-y-1">
                <p className="font-medium">{job.serviceType}</p>
                <p className="text-sm text-muted-foreground">{job.issueDescription}</p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center gap-1">
                  <Truck className="w-3 h-3 text-muted-foreground" />
                  <span>{job.customerName}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Phone className="w-3 h-3 text-muted-foreground" />
                  <span>{job.customerPhone}</span>
                </div>
                <div className="flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-muted-foreground" />
                  <span className="truncate">{job.location.address}</span>
                </div>
                <div className="flex items-center gap-1">
                  <DollarSign className="w-3 h-3 text-muted-foreground" />
                  <span>${job.actualPayout?.toFixed(2) || job.estimatedPayout.toFixed(2)}</span>
                  {job.tips && job.tips > 0 && (
                    <Badge variant="secondary" className="ml-1">+${job.tips.toFixed(2)} tip</Badge>
                  )}
                </div>
              </div>

              {job.rating && (
                <div className="flex items-center gap-2">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-3 h-3 ${
                          star <= job.rating! ? 'fill-yellow-500 text-yellow-500' : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  {job.customerReview && (
                    <span className="text-sm text-muted-foreground italic">"{job.customerReview}"</span>
                  )}
                </div>
              )}

              {job.scheduledAt && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <CalendarIcon className="w-3 h-3" />
                  <span>
                    {format(new Date(job.scheduledAt), 'MMM d, yyyy \'at\' h:mm a')}
                  </span>
                </div>
              )}

              {job.completedAt && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <CheckCircle className="w-3 h-3" />
                  <span>Completed {formatDistanceToNow(new Date(job.completedAt))} ago</span>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2 ml-4">
              {activeTab === "available" && (
                <>
                  <Button
                    size="sm"
                    onClick={() => acceptJobMutation.mutate(job.id)}
                    disabled={acceptJobMutation.isPending}
                    data-testid={`button-accept-${job.id}`}
                  >
                    Accept Job
                  </Button>
                </>
              )}
              
              {(activeTab === "active" || activeTab === "scheduled") && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/contractor/active-job`)}
                    data-testid={`button-view-${job.id}`}
                  >
                    View Details
                    <ChevronRight className="w-3 h-3 ml-1" />
                  </Button>
                  {job.status !== "on_site" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => cancelJobMutation.mutate(job.id)}
                      disabled={cancelJobMutation.isPending}
                      data-testid={`button-cancel-${job.id}`}
                    >
                      Cancel
                    </Button>
                  )}
                </>
              )}

              {activeTab === "completed" && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/contractor/jobs/${job.id}`)}
                    data-testid={`button-details-${job.id}`}
                  >
                    View Details
                    <ChevronRight className="w-3 h-3 ml-1" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      try {
                        // Create invoice if it doesn't exist
                        const response = await fetch(`/api/jobs/${job.id}/invoice`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' }
                        });
                        
                        if (response.ok) {
                          const data = await response.json();
                          const invoiceId = data.invoice.id;
                          
                          // Download the invoice PDF
                          const pdfResponse = await fetch(`/api/invoices/${invoiceId}/pdf`);
                          if (pdfResponse.ok) {
                            const blob = await pdfResponse.blob();
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `invoice-${job.jobNumber}.pdf`;
                            document.body.appendChild(a);
                            a.click();
                            document.body.removeChild(a);
                            URL.revokeObjectURL(url);
                            
                            toast({
                              title: "Invoice Downloaded",
                              description: "The invoice PDF has been downloaded successfully"
                            });
                          }
                        }
                      } catch (error) {
                        toast({
                          title: "Download Failed",
                          description: "Failed to download invoice",
                          variant: "destructive"
                        });
                      }
                    }}
                    data-testid={`button-invoice-${job.id}`}
                  >
                    <Download className="w-3 h-3 mr-1" />
                    Invoice
                  </Button>
                </>
              )}

              {job.location && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const url = `https://www.google.com/maps/dir/?api=1&destination=${job.location.lat},${job.location.lng}`;
                    window.open(url, "_blank");
                  }}
                  data-testid={`button-navigate-${job.id}`}
                >
                  <Navigation className="w-3 h-3 mr-1" />
                  Navigate
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const getJobsForTab = () => {
    switch (activeTab) {
      case "active":
        return filterJobs(activeJobs);
      case "available":
        return filterJobs(availableJobs);
      case "scheduled":
        return filterJobs(scheduledJobs);
      case "completed":
        return filterJobs(completedJobs);
      default:
        return [];
    }
  };

  const isLoading = loadingActive || loadingAvailable || loadingScheduled || loadingCompleted;
  const jobs = getJobsForTab();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Job Management</h1>
              <p className="text-muted-foreground">View and manage all your jobs</p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => navigate("/contractor/dashboard")}
                data-testid="button-back-dashboard"
              >
                Back to Dashboard
              </Button>
              {activeTab === "completed" && (
                <Button
                  variant="outline"
                  onClick={exportToCSV}
                  data-testid="button-export-csv"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export CSV
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="search">Search</Label>
                <Input
                  id="search"
                  placeholder="Job #, customer, vehicle..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  data-testid="input-search"
                />
              </div>

              <div>
                <Label htmlFor="service-type">Service Type</Label>
                <Select value={filterServiceType} onValueChange={setFilterServiceType}>
                  <SelectTrigger id="service-type" data-testid="select-service-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Services</SelectItem>
                    <SelectItem value="tire_repair">Tire Repair</SelectItem>
                    <SelectItem value="mechanical">Mechanical</SelectItem>
                    <SelectItem value="fuel_delivery">Fuel Delivery</SelectItem>
                    <SelectItem value="jump_start">Jump Start</SelectItem>
                    <SelectItem value="towing">Towing</SelectItem>
                    <SelectItem value="pm_service">PM Service</SelectItem>
                    <SelectItem value="truck_wash">Truck Wash</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="date-range">Date Range</Label>
                <Select value={filterDateRange} onValueChange={setFilterDateRange}>
                  <SelectTrigger id="date-range" data-testid="select-date-range">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="week">This Week</SelectItem>
                    <SelectItem value="month">This Month</SelectItem>
                    <SelectItem value="custom">Custom Range</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {filterDateRange === "custom" && (
                <div>
                  <Label>Custom Date Range</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !customDateRange.from && !customDateRange.to && "text-muted-foreground"
                        )}
                        data-testid="button-date-picker"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {customDateRange.from ? (
                          customDateRange.to ? (
                            <>
                              {format(customDateRange.from, "LLL dd")} -{" "}
                              {format(customDateRange.to, "LLL dd")}
                            </>
                          ) : (
                            format(customDateRange.from, "PPP")
                          )
                        ) : (
                          <span>Pick a date range</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="range"
                        selected={{
                          from: customDateRange.from,
                          to: customDateRange.to
                        }}
                        onSelect={(range: any) => setCustomDateRange(range || {})}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="active" data-testid="tab-active">
              Active
              {activeJobs && activeJobs.length > 0 && (
                <Badge variant="secondary" className="ml-2">{activeJobs.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="available" data-testid="tab-available">
              Available
              {availableJobs && availableJobs.length > 0 && (
                <Badge variant="secondary" className="ml-2">{availableJobs.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="scheduled" data-testid="tab-scheduled">
              Scheduled
              {scheduledJobs && scheduledJobs.length > 0 && (
                <Badge variant="secondary" className="ml-2">{scheduledJobs.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="completed" data-testid="tab-completed">
              Completed
              {completedJobs && completedJobs.length > 0 && (
                <Badge variant="secondary" className="ml-2">{completedJobs.length}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-32 bg-muted rounded-lg animate-pulse"></div>
                ))}
              </div>
            ) : jobs.length === 0 ? (
              <Card>
                <CardContent className="py-16">
                  <div className="text-center text-muted-foreground">
                    <Truck className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg">No {activeTab} jobs found</p>
                    <p className="text-sm mt-1">
                      {activeTab === "available" 
                        ? "New jobs will appear here automatically"
                        : "Jobs matching your filters will appear here"}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <ScrollArea className="h-[600px]">
                <div className="space-y-4 pr-4">
                  {jobs.map(renderJobCard)}
                </div>
              </ScrollArea>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}