import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, CircleMarker } from "react-leaflet";
import L from "leaflet";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import AdminLayout from "@/layouts/AdminLayout";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  MapPin,
  Truck,
  User,
  Phone,
  Mail,
  Clock,
  AlertCircle,
  CheckCircle,
  Navigation,
  Filter,
  Search,
  RefreshCw,
  Eye,
  EyeOff,
  Wrench,
  DollarSign,
  Star,
  MessageSquare,
  Calendar,
  X,
  ChevronRight,
  Wifi,
  WifiOff,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Users
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";

// Fix Leaflet icon issue
import "leaflet/dist/leaflet.css";
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

// Job status configurations
const jobStatusConfig = {
  new: { color: "#ef4444", label: "New", icon: AlertCircle },
  assigned: { color: "#eab308", label: "Assigned", icon: User },
  en_route: { color: "#3b82f6", label: "En Route", icon: Navigation },
  on_site: { color: "#10b981", label: "On Site", icon: MapPin },
  completed: { color: "#6b7280", label: "Completed", icon: CheckCircle },
  cancelled: { color: "#dc2626", label: "Cancelled", icon: X }
};

// Contractor status configurations
const contractorStatusConfig = {
  available: { color: "#10b981", label: "Available" },
  busy: { color: "#eab308", label: "Busy" },
  offline: { color: "#6b7280", label: "Offline" },
  on_job: { color: "#3b82f6", label: "On Job" }
};

// Create custom marker icons
function createJobMarker(status: keyof typeof jobStatusConfig) {
  const config = jobStatusConfig[status];
  const IconComponent = config.icon;
  
  return L.divIcon({
    html: `<div style="background-color: ${config.color}; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 4px rgba(0,0,0,0.2); border: 2px solid white;">
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        ${status === 'new' ? '<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>' : ''}
        ${status === 'assigned' ? '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>' : ''}
        ${status === 'en_route' ? '<polygon points="3 11 22 2 13 21 11 13 3 11"/>' : ''}
        ${status === 'on_site' ? '<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>' : ''}
        ${status === 'completed' ? '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>' : ''}
        ${status === 'cancelled' ? '<circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>' : ''}
      </svg>
    </div>`,
    className: "",
    iconSize: [32, 32],
    iconAnchor: [16, 32],
  });
}

function createContractorMarker(status: 'available' | 'busy' | 'on_job' | 'offline') {
  const config = contractorStatusConfig[status];
  
  return L.divIcon({
    html: `<div style="position: relative;">
      <div style="background-color: ${config.color}; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 6px rgba(0,0,0,0.3); border: 2px solid white;">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/>
          <path d="M15 18H9"/>
          <path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/>
          <circle cx="17" cy="18" r="2"/>
          <circle cx="7" cy="18" r="2"/>
        </svg>
      </div>
      ${status === 'on_job' ? '<div style="position: absolute; bottom: -2px; right: -2px; width: 12px; height: 12px; background-color: #3b82f6; border: 2px solid white; border-radius: 50%; animation: pulse 2s infinite;"></div>' : ''}
    </div>`,
    className: "",
    iconSize: [36, 36],
    iconAnchor: [18, 36],
  });
}

// Map controls component
function MapControls({ map }: { map: L.Map | null }) {
  if (!map) return null;

  const handleZoomIn = () => map.zoomIn();
  const handleZoomOut = () => map.zoomOut();
  const handleFitBounds = () => {
    // Fit to US bounds as default
    map.fitBounds([
      [24.396308, -125.000000], // Southwest
      [49.384358, -66.934570]   // Northeast
    ]);
  };

  return (
    <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
      <Button
        size="icon"
        variant="secondary"
        onClick={handleZoomIn}
        className="shadow-lg"
        data-testid="button-zoom-in"
      >
        <ZoomIn className="h-4 w-4" />
      </Button>
      <Button
        size="icon"
        variant="secondary"
        onClick={handleZoomOut}
        className="shadow-lg"
        data-testid="button-zoom-out"
      >
        <ZoomOut className="h-4 w-4" />
      </Button>
      <Button
        size="icon"
        variant="secondary"
        onClick={handleFitBounds}
        className="shadow-lg"
        data-testid="button-fit-bounds"
      >
        <Maximize2 className="h-4 w-4" />
      </Button>
    </div>
  );
}

// WebSocket hook for real-time updates
function useMapWebSocket(onUpdate: () => void) {
  const ws = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const reconnectTimeout = useRef<NodeJS.Timeout | null>(null);

  const connect = useCallback(() => {
    if (ws.current?.readyState === WebSocket.OPEN) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}/ws/tracking`;

    try {
      ws.current = new WebSocket(wsUrl);

      ws.current.onopen = () => {
        console.log('Live map WebSocket connected');
        setIsConnected(true);

        // Join as admin to receive all updates
        ws.current?.send(JSON.stringify({
          type: 'JOIN_TRACKING',
          payload: { role: 'admin', jobId: 'all' }
        }));
      };

      ws.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          if (message.type === 'LOCATION_UPDATE' || message.type === 'STATUS_UPDATE' || message.type === 'JOB_ASSIGNED') {
            onUpdate();
          }
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      ws.current.onclose = () => {
        console.log('Live map WebSocket disconnected');
        setIsConnected(false);
        
        // Attempt to reconnect after 3 seconds
        if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current);
        reconnectTimeout.current = setTimeout(connect, 3000);
      };

      ws.current.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
    }
  }, [onUpdate]);

  useEffect(() => {
    connect();
    return () => {
      if (ws.current) {
        ws.current.close();
        ws.current = null;
      }
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
      }
    };
  }, [connect]);

  return isConnected;
}

export default function AdminLiveMap() {
  const mapRef = useRef<L.Map | null>(null);
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [selectedContractor, setSelectedContractor] = useState<any>(null);
  const [showFilters, setShowFilters] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [autoRefresh, setAutoRefresh] = useState(true);
  const { toast } = useToast();

  // Filters state
  const [filters, setFilters] = useState({
    jobStatus: [] as string[],
    jobType: [] as string[],
    contractorStatus: [] as string[],
    showJobs: true,
    showContractors: true,
    showCompletedJobs: false
  });

  // Fetch all active jobs
  const { data: jobsData, refetch: refetchJobs, isLoading: isLoadingJobs } = useQuery({
    queryKey: ['/api/admin/jobs/live'],
    refetchInterval: autoRefresh ? 30000 : false,
  });

  // Fetch all online contractors
  const { data: contractorsData, refetch: refetchContractors, isLoading: isLoadingContractors } = useQuery({
    queryKey: ['/api/admin/contractors/online'],
    refetchInterval: autoRefresh ? 30000 : false,
  });

  // WebSocket connection for real-time updates
  const isConnected = useMapWebSocket(() => {
    if (autoRefresh) {
      refetchJobs();
      refetchContractors();
    }
  });

  // Filter data based on filters and search
  const filteredJobs = useMemo(() => {
    if (!jobsData?.jobs) return [];
    
    return jobsData.jobs.filter((job: any) => {
      // Apply status filter
      if (filters.jobStatus.length > 0 && !filters.jobStatus.includes(job.status)) {
        return false;
      }
      
      // Apply type filter
      if (filters.jobType.length > 0 && !filters.jobType.includes(job.type)) {
        return false;
      }
      
      // Hide completed jobs if filter is off
      if (!filters.showCompletedJobs && job.status === 'completed') {
        return false;
      }
      
      // Apply search
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          job.id.toLowerCase().includes(query) ||
          job.customer?.name?.toLowerCase().includes(query) ||
          job.serviceType?.toLowerCase().includes(query)
        );
      }
      
      return filters.showJobs;
    });
  }, [jobsData, filters, searchQuery]);

  const filteredContractors = useMemo(() => {
    if (!contractorsData?.contractors) return [];
    
    return contractorsData.contractors.filter((contractor: any) => {
      // Apply status filter
      if (filters.contractorStatus.length > 0 && !filters.contractorStatus.includes(contractor.status)) {
        return false;
      }
      
      // Apply search
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          contractor.name?.toLowerCase().includes(query) ||
          contractor.companyName?.toLowerCase().includes(query)
        );
      }
      
      return filters.showContractors;
    });
  }, [contractorsData, filters, searchQuery]);

  // Assign contractor to job mutation
  const assignContractorMutation = useMutation({
    mutationFn: async ({ jobId, contractorId }: { jobId: string; contractorId: string }) => {
      return apiRequest('POST', `/api/admin/jobs/${jobId}/assign`, { contractorId });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Contractor assigned successfully",
      });
      refetchJobs();
      refetchContractors();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to assign contractor",
        variant: "destructive"
      });
    }
  });

  // Handle contractor drag and drop assignment
  const handleContractorDrop = useCallback((jobId: string, contractorId: string) => {
    assignContractorMutation.mutate({ jobId, contractorId });
  }, [assignContractorMutation]);

  // Center map on selected item
  const centerOnLocation = (lat: number, lng: number) => {
    if (mapRef.current) {
      mapRef.current.setView([lat, lng], 16);
    }
  };

  // Statistics
  const stats = useMemo(() => {
    return {
      totalJobs: jobsData?.jobs?.length || 0,
      newJobs: jobsData?.jobs?.filter((j: any) => j.status === 'new').length || 0,
      activeJobs: jobsData?.jobs?.filter((j: any) => ['assigned', 'en_route', 'on_site'].includes(j.status)).length || 0,
      onlineContractors: contractorsData?.contractors?.filter((c: any) => c.status !== 'offline').length || 0,
      availableContractors: contractorsData?.contractors?.filter((c: any) => c.status === 'available').length || 0,
    };
  }, [jobsData, contractorsData]);

  return (
    <AdminLayout 
      title="Live Operations Map" 
      breadcrumbs={[{ label: "Live Map" }]}
    >
      <div className="relative h-[calc(100vh-12rem)]">
        {/* Connection Status */}
        <div className="absolute top-4 left-4 z-[1000] flex items-center gap-2">
          <Badge variant={isConnected ? "default" : "secondary"} className="flex items-center gap-1">
            {isConnected ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
            {isConnected ? "Live" : "Connecting..."}
          </Badge>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              refetchJobs();
              refetchContractors();
            }}
            data-testid="button-refresh"
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Refresh
          </Button>
        </div>

        {/* Stats Bar */}
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-[1000] bg-background/95 backdrop-blur-sm rounded-lg shadow-lg p-2">
          <div className="flex items-center gap-4">
            <div className="text-center px-3">
              <p className="text-xs text-muted-foreground">Total Jobs</p>
              <p className="text-lg font-semibold">{stats.totalJobs}</p>
            </div>
            <div className="h-8 w-px bg-border" />
            <div className="text-center px-3">
              <p className="text-xs text-muted-foreground">New</p>
              <p className="text-lg font-semibold text-destructive">{stats.newJobs}</p>
            </div>
            <div className="h-8 w-px bg-border" />
            <div className="text-center px-3">
              <p className="text-xs text-muted-foreground">Active</p>
              <p className="text-lg font-semibold text-primary">{stats.activeJobs}</p>
            </div>
            <div className="h-8 w-px bg-border" />
            <div className="text-center px-3">
              <p className="text-xs text-muted-foreground">Online</p>
              <p className="text-lg font-semibold text-green-600">{stats.onlineContractors}</p>
            </div>
            <div className="h-8 w-px bg-border" />
            <div className="text-center px-3">
              <p className="text-xs text-muted-foreground">Available</p>
              <p className="text-lg font-semibold">{stats.availableContractors}</p>
            </div>
          </div>
        </div>

        {/* Map Container */}
        <MapContainer
          center={[39.8283, -98.5795]} // Center of USA
          zoom={4}
          className="h-full w-full"
          ref={mapRef}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          
          {/* Job Markers */}
          {filteredJobs.map((job: any) => {
            if (!job.location?.lat || !job.location?.lng) return null;
            
            return (
              <Marker
                key={`job-${job.id}`}
                position={[job.location.lat, job.location.lng]}
                icon={createJobMarker(job.status)}
                eventHandlers={{
                  click: () => setSelectedJob(job)
                }}
              >
                <Popup>
                  <div className="p-2 min-w-[200px]">
                    <p className="font-semibold">Job #{job.id}</p>
                    <Badge className="mb-2" variant={job.status === 'new' ? 'destructive' : 'default'}>
                      {jobStatusConfig[job.status as keyof typeof jobStatusConfig]?.label}
                    </Badge>
                    <p className="text-sm">{job.serviceType}</p>
                    {job.customer && (
                      <p className="text-sm text-muted-foreground">{job.customer.name}</p>
                    )}
                    {job.contractor && (
                      <p className="text-sm text-primary">Assigned: {job.contractor.name}</p>
                    )}
                    <Button
                      size="sm"
                      className="mt-2 w-full"
                      onClick={() => setSelectedJob(job)}
                      data-testid={`button-view-job-${job.id}`}
                    >
                      View Details
                    </Button>
                  </div>
                </Popup>
              </Marker>
            );
          })}

          {/* Contractor Markers */}
          {filteredContractors.map((contractor: any) => {
            if (!contractor.location?.lat || !contractor.location?.lng) return null;
            
            const status = contractor.currentJobId ? 'on_job' : 
                          contractor.status === 'online' ? 'available' : 
                          contractor.status as keyof typeof contractorStatusConfig;
            
            return (
              <Marker
                key={`contractor-${contractor.id}`}
                position={[contractor.location.lat, contractor.location.lng]}
                icon={createContractorMarker(status)}
                eventHandlers={{
                  click: () => setSelectedContractor(contractor),
                  dragend: (e) => {
                    // Handle contractor drag to assign to nearby job
                    const latLng = e.target.getLatLng();
                    // Find nearest job and assign
                    const nearestJob = filteredJobs.find((job: any) => {
                      if (!job.location || job.status !== 'new') return false;
                      const distance = Math.sqrt(
                        Math.pow(job.location.lat - latLng.lat, 2) + 
                        Math.pow(job.location.lng - latLng.lng, 2)
                      );
                      return distance < 0.01; // Threshold for "close enough"
                    });
                    if (nearestJob) {
                      handleContractorDrop(nearestJob.id, contractor.id);
                    }
                  }
                }}
                draggable={contractor.status === 'available'}
              >
                <Popup>
                  <div className="p-2 min-w-[200px]">
                    <p className="font-semibold">{contractor.name}</p>
                    {contractor.companyName && (
                      <p className="text-sm text-muted-foreground">{contractor.companyName}</p>
                    )}
                    <Badge className="mb-2" variant={status === 'available' ? 'default' : 'secondary'}>
                      {contractorStatusConfig[status]?.label}
                    </Badge>
                    {contractor.rating && (
                      <div className="flex items-center gap-1 text-sm">
                        <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                        {contractor.rating.toFixed(1)}
                      </div>
                    )}
                    <Button
                      size="sm"
                      className="mt-2 w-full"
                      onClick={() => setSelectedContractor(contractor)}
                      data-testid={`button-view-contractor-${contractor.id}`}
                    >
                      View Details
                    </Button>
                  </div>
                </Popup>
              </Marker>
            );
          })}

          <MapControls map={mapRef.current} />
        </MapContainer>

        {/* Filters Panel */}
        {showFilters && (
          <div className="absolute bottom-4 left-4 z-[1000] bg-background/95 backdrop-blur-sm rounded-lg shadow-lg p-4 w-80 max-h-[400px] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Filters
              </h3>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setShowFilters(false)}
                data-testid="button-close-filters"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Search */}
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search jobs or contractors..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  data-testid="input-search-map"
                />
              </div>
            </div>

            {/* Toggle Switches */}
            <div className="space-y-3 mb-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="show-jobs" className="text-sm">Show Jobs</Label>
                <Switch
                  id="show-jobs"
                  checked={filters.showJobs}
                  onCheckedChange={(checked) => setFilters(prev => ({ ...prev, showJobs: checked }))}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="show-contractors" className="text-sm">Show Contractors</Label>
                <Switch
                  id="show-contractors"
                  checked={filters.showContractors}
                  onCheckedChange={(checked) => setFilters(prev => ({ ...prev, showContractors: checked }))}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="show-completed" className="text-sm">Show Completed</Label>
                <Switch
                  id="show-completed"
                  checked={filters.showCompletedJobs}
                  onCheckedChange={(checked) => setFilters(prev => ({ ...prev, showCompletedJobs: checked }))}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="auto-refresh" className="text-sm">Auto Refresh</Label>
                <Switch
                  id="auto-refresh"
                  checked={autoRefresh}
                  onCheckedChange={setAutoRefresh}
                />
              </div>
            </div>

            {/* Job Status Filter */}
            <div className="mb-4">
              <Label className="text-sm mb-2">Job Status</Label>
              <div className="flex flex-wrap gap-2">
                {Object.entries(jobStatusConfig).map(([status, config]) => (
                  <Badge
                    key={status}
                    variant={filters.jobStatus.includes(status) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => {
                      setFilters(prev => ({
                        ...prev,
                        jobStatus: prev.jobStatus.includes(status)
                          ? prev.jobStatus.filter(s => s !== status)
                          : [...prev.jobStatus, status]
                      }));
                    }}
                    data-testid={`filter-job-status-${status}`}
                  >
                    {config.label}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Contractor Status Filter */}
            <div>
              <Label className="text-sm mb-2">Contractor Status</Label>
              <div className="flex flex-wrap gap-2">
                {Object.entries(contractorStatusConfig).map(([status, config]) => (
                  <Badge
                    key={status}
                    variant={filters.contractorStatus.includes(status) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => {
                      setFilters(prev => ({
                        ...prev,
                        contractorStatus: prev.contractorStatus.includes(status)
                          ? prev.contractorStatus.filter(s => s !== status)
                          : [...prev.contractorStatus, status]
                      }));
                    }}
                    data-testid={`filter-contractor-status-${status}`}
                  >
                    {config.label}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Show Filters Button (when hidden) */}
        {!showFilters && (
          <Button
            className="absolute bottom-4 left-4 z-[1000]"
            onClick={() => setShowFilters(true)}
            data-testid="button-show-filters"
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
        )}

        {/* Job Details Sheet */}
        <Sheet open={!!selectedJob} onOpenChange={(open) => !open && setSelectedJob(null)}>
          <SheetContent className="w-[400px] sm:w-[540px]">
            <SheetHeader>
              <SheetTitle>Job Details</SheetTitle>
              <SheetDescription>Job #{selectedJob?.id}</SheetDescription>
            </SheetHeader>
            
            {selectedJob && (
              <div className="mt-6 space-y-4">
                <div>
                  <Badge variant={selectedJob.status === 'new' ? 'destructive' : 'default'}>
                    {jobStatusConfig[selectedJob.status as keyof typeof jobStatusConfig]?.label}
                  </Badge>
                </div>

                <div>
                  <Label className="text-sm text-muted-foreground">Service Type</Label>
                  <p className="font-medium">{selectedJob.serviceType}</p>
                </div>

                <div>
                  <Label className="text-sm text-muted-foreground">Customer</Label>
                  <div className="flex items-center gap-3 mt-1">
                    <Avatar>
                      <AvatarFallback>{selectedJob.customer?.name?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{selectedJob.customer?.name}</p>
                      {selectedJob.customer?.phone && (
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {selectedJob.customer.phone}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <Label className="text-sm text-muted-foreground">Location</Label>
                  <p className="text-sm">{selectedJob.location?.address || 'Address not available'}</p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-2"
                    onClick={() => centerOnLocation(selectedJob.location.lat, selectedJob.location.lng)}
                    data-testid="button-center-job"
                  >
                    <MapPin className="h-3 w-3 mr-1" />
                    Center on Map
                  </Button>
                </div>

                {selectedJob.contractor ? (
                  <div>
                    <Label className="text-sm text-muted-foreground">Assigned Contractor</Label>
                    <div className="flex items-center gap-3 mt-1">
                      <Avatar>
                        <AvatarFallback>{selectedJob.contractor.name?.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{selectedJob.contractor.name}</p>
                        {selectedJob.contractor.phone && (
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {selectedJob.contractor.phone}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ) : selectedJob.status === 'new' && (
                  <div>
                    <Label className="text-sm text-muted-foreground">Assign Contractor</Label>
                    <Select
                      onValueChange={(contractorId) => {
                        assignContractorMutation.mutate({ 
                          jobId: selectedJob.id, 
                          contractorId 
                        });
                      }}
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue placeholder="Select a contractor" />
                      </SelectTrigger>
                      <SelectContent>
                        {contractorsData?.contractors
                          ?.filter((c: any) => c.status === 'available')
                          ?.map((contractor: any) => (
                            <SelectItem key={contractor.id} value={contractor.id}>
                              {contractor.name} - {contractor.distance || 'N/A'} miles
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div>
                  <Label className="text-sm text-muted-foreground">Created</Label>
                  <p className="text-sm">
                    {format(new Date(selectedJob.createdAt), "MMM d, yyyy h:mm a")}
                  </p>
                </div>

                <div className="pt-4 flex gap-2">
                  <Button
                    className="flex-1"
                    onClick={() => window.open(`/admin/jobs/${selectedJob.id}`, '_blank')}
                    data-testid="button-view-full-job"
                  >
                    View Full Details
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </SheetContent>
        </Sheet>

        {/* Contractor Details Sheet */}
        <Sheet open={!!selectedContractor} onOpenChange={(open) => !open && setSelectedContractor(null)}>
          <SheetContent className="w-[400px] sm:w-[540px]">
            <SheetHeader>
              <SheetTitle>Contractor Details</SheetTitle>
              <SheetDescription>{selectedContractor?.companyName}</SheetDescription>
            </SheetHeader>
            
            {selectedContractor && (
              <div className="mt-6 space-y-4">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarFallback>{selectedContractor.name?.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold text-lg">{selectedContractor.name}</h3>
                    <Badge variant={selectedContractor.status === 'available' ? 'default' : 'secondary'}>
                      {contractorStatusConfig[selectedContractor.status as keyof typeof contractorStatusConfig]?.label}
                    </Badge>
                  </div>
                </div>

                {selectedContractor.rating && (
                  <div>
                    <Label className="text-sm text-muted-foreground">Rating</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                        <span className="font-medium">{selectedContractor.rating.toFixed(1)}</span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        ({selectedContractor.totalJobs} jobs completed)
                      </span>
                    </div>
                  </div>
                )}

                <div>
                  <Label className="text-sm text-muted-foreground">Contact</Label>
                  <div className="space-y-1 mt-1">
                    {selectedContractor.phone && (
                      <p className="text-sm flex items-center gap-2">
                        <Phone className="h-3 w-3" />
                        {selectedContractor.phone}
                      </p>
                    )}
                    {selectedContractor.email && (
                      <p className="text-sm flex items-center gap-2">
                        <Mail className="h-3 w-3" />
                        {selectedContractor.email}
                      </p>
                    )}
                  </div>
                </div>

                {selectedContractor.currentJobId && (
                  <div>
                    <Label className="text-sm text-muted-foreground">Current Job</Label>
                    <p className="text-sm">Job #{selectedContractor.currentJobId}</p>
                  </div>
                )}

                <div>
                  <Label className="text-sm text-muted-foreground">Current Location</Label>
                  <p className="text-sm">Last updated {formatDistanceToNow(new Date(selectedContractor.lastLocationUpdate))} ago</p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-2"
                    onClick={() => centerOnLocation(selectedContractor.location.lat, selectedContractor.location.lng)}
                    data-testid="button-center-contractor"
                  >
                    <MapPin className="h-3 w-3 mr-1" />
                    Center on Map
                  </Button>
                </div>

                <div className="pt-4 flex gap-2">
                  <Button
                    className="flex-1"
                    onClick={() => window.open(`/admin/contractors/${selectedContractor.id}`, '_blank')}
                    data-testid="button-view-full-contractor"
                  >
                    View Full Profile
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </SheetContent>
        </Sheet>
      </div>
    </AdminLayout>
  );
}