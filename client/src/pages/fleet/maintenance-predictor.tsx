import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format, addDays, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, parseISO, differenceInDays } from "date-fns";
import { 
  AlertTriangle, 
  CheckCircle2, 
  Activity, 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  Calendar as CalendarIcon,
  Bell,
  Wrench,
  AlertCircle,
  ShieldAlert,
  Clock,
  ChevronRight,
  Gauge,
  Filter,
  Download,
  RefreshCw,
  Car,
  ChevronDown,
  Info,
  XCircle
} from "lucide-react";
import type { SelectMaintenancePrediction, SelectMaintenanceAlert, SelectFleetVehicle } from "@shared/schema";

// Risk level color mapping
const getRiskColor = (level: string) => {
  switch (level) {
    case "critical": return "text-red-600 bg-red-50 border-red-200";
    case "high": return "text-orange-600 bg-orange-50 border-orange-200";
    case "medium": return "text-yellow-600 bg-yellow-50 border-yellow-200";
    case "low": return "text-green-600 bg-green-50 border-green-200";
    default: return "text-muted-foreground bg-muted";
  }
};

// Risk level badge variant
const getRiskBadgeVariant = (level: string) => {
  switch (level) {
    case "critical": return "destructive";
    case "high": return "secondary";
    case "medium": return "outline";
    case "low": return "secondary";
    default: return "secondary";
  }
};

// Risk level icon
const getRiskIcon = (level: string) => {
  switch (level) {
    case "critical": return ShieldAlert;
    case "high": return AlertTriangle;
    case "medium": return AlertCircle;
    case "low": return Info;
    default: return Info;
  }
};

interface MaintenanceScheduleItem {
  id: string;
  vehicleId: string;
  vehicleInfo: string;
  date: Date;
  serviceType: string;
  riskLevel: string;
  estimatedCost: number;
}

export default function MaintenancePredictor() {
  const { toast } = useToast();
  const [selectedVehicle, setSelectedVehicle] = useState<string>("all");
  const [selectedRiskLevel, setSelectedRiskLevel] = useState<string>("all");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedAlert, setSelectedAlert] = useState<SelectMaintenanceAlert | null>(null);
  const [acknowledgeNotes, setAcknowledgeNotes] = useState("");
  const [showROICalculator, setShowROICalculator] = useState(false);
  const [roiVehicleId, setRoiVehicleId] = useState<string>("");

  // Get fleet ID from session/auth context (would come from auth in real app)
  const fleetId = "default-fleet-id"; // This should come from auth context

  // Fetch maintenance predictions
  const { data: predictions, isLoading: loadingPredictions, refetch: refetchPredictions } = useQuery<{ 
    predictions: SelectMaintenancePrediction[], 
    summary: { 
      total: number, 
      byRiskLevel: Record<string, number>,
      totalEstimatedCost: number,
      upcomingInNext7Days: number,
      upcomingInNext30Days: number
    } 
  }>({
    queryKey: ['/api/fleet', fleetId, 'maintenance-predictions'],
    queryFn: async () => {
      const start = startOfMonth(new Date()).toISOString();
      const end = endOfMonth(addDays(new Date(), 60)).toISOString();
      return apiRequest('GET', `/api/fleet/${fleetId}/maintenance-predictions?start=${start}&end=${end}`);
    }
  });

  // Fetch maintenance alerts
  const { data: alertsData, isLoading: loadingAlerts, refetch: refetchAlerts } = useQuery<{ alerts: SelectMaintenanceAlert[] }>({
    queryKey: ['/api/fleet', fleetId, 'maintenance-alerts'],
    queryFn: async () => apiRequest('GET', `/api/fleet/${fleetId}/maintenance-alerts?active=true`)
  });

  // Fetch high-risk vehicles
  const { data: highRiskData, isLoading: loadingHighRisk } = useQuery<{ vehicles: SelectFleetVehicle[] }>({
    queryKey: ['/api/fleet', fleetId, 'high-risk-vehicles'],
    queryFn: async () => apiRequest('GET', `/api/fleet/${fleetId}/high-risk-vehicles`)
  });

  // Fetch fleet vehicles
  const { data: vehiclesData, isLoading: loadingVehicles } = useQuery<{ vehicles: SelectFleetVehicle[] }>({
    queryKey: ['/api/fleet', fleetId, 'vehicles'],
    queryFn: async () => apiRequest('GET', `/api/fleet/${fleetId}/vehicles`)
  });

  // Acknowledge alert mutation
  const acknowledgeAlertMutation = useMutation({
    mutationFn: async ({ alertId, notes }: { alertId: string; notes?: string }) => {
      return apiRequest('POST', `/api/predictions/${alertId}/acknowledge`, { notes });
    },
    onSuccess: () => {
      toast({
        title: "Alert Acknowledged",
        description: "The maintenance alert has been acknowledged successfully."
      });
      queryClient.invalidateQueries({ queryKey: ['/api/fleet', fleetId, 'maintenance-alerts'] });
      setSelectedAlert(null);
      setAcknowledgeNotes("");
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Acknowledge",
        description: error.message || "Could not acknowledge the alert. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Fetch ROI calculation
  const { data: roiData, isLoading: loadingROI, refetch: refetchROI } = useQuery({
    queryKey: ['/api/analytics/maintenance-roi', roiVehicleId],
    queryFn: async () => {
      if (!roiVehicleId) return null;
      return apiRequest('GET', `/api/analytics/maintenance-roi?vehicleId=${roiVehicleId}`);
    },
    enabled: !!roiVehicleId
  });

  // Process maintenance schedule
  const maintenanceSchedule = useMemo<MaintenanceScheduleItem[]>(() => {
    if (!predictions?.predictions) return [];
    
    return predictions.predictions
      .filter(p => {
        if (selectedVehicle !== "all" && p.vehicleId !== selectedVehicle) return false;
        if (selectedRiskLevel !== "all" && p.riskLevel !== selectedRiskLevel) return false;
        return true;
      })
      .map(p => ({
        id: p.id,
        vehicleId: p.vehicleId,
        vehicleInfo: vehiclesData?.vehicles?.find(v => v.id === p.vehicleId)?.identifier || p.vehicleId,
        date: new Date(p.predictedDate),
        serviceType: p.serviceType,
        riskLevel: p.riskLevel,
        estimatedCost: p.estimatedCost
      }))
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [predictions, selectedVehicle, selectedRiskLevel, vehiclesData]);

  // Calendar events for the selected month
  const calendarEvents = useMemo(() => {
    if (!selectedDate || !maintenanceSchedule.length) return {};
    
    const events: Record<string, MaintenanceScheduleItem[]> = {};
    const monthStart = startOfMonth(selectedDate);
    const monthEnd = endOfMonth(selectedDate);
    
    maintenanceSchedule.forEach(item => {
      if (item.date >= monthStart && item.date <= monthEnd) {
        const dateKey = format(item.date, "yyyy-MM-dd");
        if (!events[dateKey]) events[dateKey] = [];
        events[dateKey].push(item);
      }
    });
    
    return events;
  }, [selectedDate, maintenanceSchedule]);

  // Export predictions to CSV
  const exportPredictions = () => {
    if (!predictions?.predictions) return;
    
    const csv = [
      ["Vehicle", "Service Type", "Predicted Date", "Risk Level", "Confidence", "Estimated Cost", "Reasoning"],
      ...predictions.predictions.map(p => [
        vehiclesData?.vehicles?.find(v => v.id === p.vehicleId)?.identifier || p.vehicleId,
        p.serviceType,
        format(new Date(p.predictedDate), "yyyy-MM-dd"),
        p.riskLevel,
        `${(p.confidence * 100).toFixed(1)}%`,
        `$${p.estimatedCost.toFixed(2)}`,
        p.reasoning
      ])
    ].map(row => row.join(",")).join("\n");
    
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `maintenance-predictions-${format(new Date(), "yyyy-MM-dd")}.csv`;
    link.click();
  };

  const isLoading = loadingPredictions || loadingAlerts || loadingHighRisk || loadingVehicles;

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-page-title">Maintenance Predictions</h1>
          <p className="text-muted-foreground mt-1">AI-powered predictive maintenance insights for your fleet</p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={() => {
              refetchPredictions();
              refetchAlerts();
            }}
            data-testid="button-refresh"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={exportPredictions} data-testid="button-export">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Predictions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-predictions">
              {predictions?.summary?.total || 0}
            </div>
            <p className="text-xs text-muted-foreground">Active maintenance predictions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Next 7 Days</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-upcoming-7days">
              {predictions?.summary?.upcomingInNext7Days || 0}
            </div>
            <p className="text-xs text-muted-foreground">Urgent maintenance needed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Estimated Cost</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-estimated-cost">
              ${(predictions?.summary?.totalEstimatedCost || 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Total projected expenses</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">High Risk Vehicles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-high-risk-count">
              {highRiskData?.vehicles?.length || 0}
            </div>
            <p className="text-xs text-muted-foreground">Require immediate attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="dashboard" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="dashboard" data-testid="tab-dashboard">
            <Gauge className="w-4 h-4 mr-2" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="schedule" data-testid="tab-schedule">
            <CalendarIcon className="w-4 h-4 mr-2" />
            Schedule
          </TabsTrigger>
          <TabsTrigger value="alerts" data-testid="tab-alerts">
            <Bell className="w-4 h-4 mr-2" />
            Alerts
          </TabsTrigger>
          <TabsTrigger value="risk-map" data-testid="tab-risk-map">
            <Activity className="w-4 h-4 mr-2" />
            Risk Map
          </TabsTrigger>
          <TabsTrigger value="roi" data-testid="tab-roi">
            <DollarSign className="w-4 h-4 mr-2" />
            ROI Analysis
          </TabsTrigger>
        </TabsList>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Risk Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Risk Distribution</CardTitle>
                <CardDescription>Current fleet risk levels</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {["critical", "high", "medium", "low"].map(level => {
                  const count = predictions?.summary?.byRiskLevel?.[level] || 0;
                  const total = predictions?.summary?.total || 1;
                  const percentage = (count / total) * 100;
                  const RiskIcon = getRiskIcon(level);
                  
                  return (
                    <div key={level} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <RiskIcon className={`w-4 h-4 ${getRiskColor(level).split(' ')[0]}`} />
                          <span className="text-sm font-medium capitalize">{level}</span>
                        </div>
                        <span className="text-sm text-muted-foreground">{count} vehicles</span>
                      </div>
                      <Progress value={percentage} className="h-2" />
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Upcoming Maintenance */}
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Maintenance</CardTitle>
                <CardDescription>Next 5 scheduled services</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[280px]">
                  <div className="space-y-3">
                    {maintenanceSchedule.slice(0, 5).map(item => (
                      <div key={item.id} className={`p-3 rounded-lg border ${getRiskColor(item.riskLevel)}`}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-sm">{item.vehicleInfo}</span>
                          <Badge variant={getRiskBadgeVariant(item.riskLevel) as any}>
                            {item.riskLevel}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {item.serviceType}
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-muted-foreground">
                            {format(item.date, "MMM dd, yyyy")}
                          </span>
                          <span className="text-xs font-medium">
                            ${item.estimatedCost}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* High Risk Vehicles */}
          {highRiskData?.vehicles && highRiskData.vehicles.length > 0 && (
            <Alert className="border-orange-200 bg-orange-50">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <AlertTitle>High Risk Vehicles</AlertTitle>
              <AlertDescription>
                The following vehicles require immediate attention:
                <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-2">
                  {highRiskData.vehicles.map(v => (
                    <Badge key={v.id} variant="secondary">
                      {v.identifier}
                    </Badge>
                  ))}
                </div>
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>

        {/* Schedule Tab */}
        <TabsContent value="schedule" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Maintenance Calendar</CardTitle>
                  <CardDescription>View and manage scheduled maintenance</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Select value={selectedVehicle} onValueChange={setSelectedVehicle}>
                    <SelectTrigger className="w-[180px]" data-testid="select-vehicle-filter">
                      <SelectValue placeholder="All vehicles" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All vehicles</SelectItem>
                      {vehiclesData?.vehicles?.map(v => (
                        <SelectItem key={v.id} value={v.id}>{v.identifier}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={selectedRiskLevel} onValueChange={setSelectedRiskLevel}>
                    <SelectTrigger className="w-[140px]" data-testid="select-risk-filter">
                      <SelectValue placeholder="All risks" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All risks</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Calendar */}
                <div className="lg:col-span-2">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    className="rounded-md border"
                    components={{
                      DayContent: ({ date }) => {
                        const dateKey = format(date, "yyyy-MM-dd");
                        const events = calendarEvents[dateKey] || [];
                        const hasEvents = events.length > 0;
                        const hasCritical = events.some(e => e.riskLevel === "critical");
                        const hasHigh = events.some(e => e.riskLevel === "high");
                        
                        return (
                          <div className="relative w-full h-full flex items-center justify-center">
                            <span>{date.getDate()}</span>
                            {hasEvents && (
                              <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 flex gap-0.5">
                                {hasCritical && <div className="w-1 h-1 rounded-full bg-red-500" />}
                                {hasHigh && !hasCritical && <div className="w-1 h-1 rounded-full bg-orange-500" />}
                                {!hasCritical && !hasHigh && <div className="w-1 h-1 rounded-full bg-yellow-500" />}
                              </div>
                            )}
                          </div>
                        );
                      }
                    }}
                  />
                </div>

                {/* Selected Date Events */}
                <div>
                  <h3 className="font-semibold mb-3">
                    {selectedDate ? format(selectedDate, "MMMM dd, yyyy") : "Select a date"}
                  </h3>
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-2">
                      {selectedDate && calendarEvents[format(selectedDate, "yyyy-MM-dd")]?.map(event => (
                        <Card key={event.id} className={`${getRiskColor(event.riskLevel)}`}>
                          <CardContent className="p-3">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium text-sm">{event.vehicleInfo}</span>
                              <Badge variant={getRiskBadgeVariant(event.riskLevel) as any} className="text-xs">
                                {event.riskLevel}
                              </Badge>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {event.serviceType}
                            </div>
                            <div className="text-xs font-medium mt-1">
                              Est. ${event.estimatedCost}
                            </div>
                          </CardContent>
                        </Card>
                      )) || (
                        <p className="text-sm text-muted-foreground">No maintenance scheduled for this date</p>
                      )}
                    </div>
                  </ScrollArea>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Alerts Tab */}
        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Active Maintenance Alerts</CardTitle>
              <CardDescription>
                {alertsData?.alerts?.length || 0} active alerts requiring attention
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <div className="space-y-3">
                  {alertsData?.alerts?.map(alert => (
                    <div key={alert.id} className="p-4 rounded-lg border hover-elevate">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className={`w-5 h-5 ${
                            alert.severity === 'critical' ? 'text-red-600' :
                            alert.severity === 'high' ? 'text-orange-600' :
                            'text-yellow-600'
                          }`} />
                          <div>
                            <div className="font-medium">{alert.alertType}</div>
                            <div className="text-sm text-muted-foreground">
                              {vehiclesData?.vehicles?.find(v => v.id === alert.vehicleId)?.identifier || alert.vehicleId}
                            </div>
                          </div>
                        </div>
                        <Badge variant={
                          alert.severity === 'critical' ? 'destructive' :
                          alert.severity === 'high' ? 'secondary' :
                          'outline'
                        }>
                          {alert.severity}
                        </Badge>
                      </div>
                      
                      <p className="text-sm mb-3">{alert.message}</p>
                      
                      <div className="flex items-center justify-between">
                        <div className="text-xs text-muted-foreground">
                          <Clock className="w-3 h-3 inline mr-1" />
                          {format(new Date(alert.createdAt), "MMM dd, yyyy HH:mm")}
                        </div>
                        
                        {!alert.acknowledgedAt && (
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => setSelectedAlert(alert)}
                                data-testid={`button-acknowledge-${alert.id}`}
                              >
                                Acknowledge
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Acknowledge Alert</DialogTitle>
                                <DialogDescription>
                                  Confirm that you have reviewed this maintenance alert
                                </DialogDescription>
                              </DialogHeader>
                              
                              <div className="space-y-4">
                                <div className="p-3 rounded-lg bg-muted">
                                  <p className="font-medium text-sm mb-1">{alert.alertType}</p>
                                  <p className="text-sm text-muted-foreground">{alert.message}</p>
                                </div>
                                
                                <div>
                                  <label className="text-sm font-medium">Notes (optional)</label>
                                  <Textarea 
                                    value={acknowledgeNotes}
                                    onChange={(e) => setAcknowledgeNotes(e.target.value)}
                                    placeholder="Add any notes about this alert..."
                                    className="mt-1"
                                    data-testid="input-acknowledge-notes"
                                  />
                                </div>
                              </div>
                              
                              <DialogFooter>
                                <Button 
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedAlert(null);
                                    setAcknowledgeNotes("");
                                  }}
                                  data-testid="button-cancel-acknowledge"
                                >
                                  Cancel
                                </Button>
                                <Button 
                                  onClick={() => {
                                    if (selectedAlert) {
                                      acknowledgeAlertMutation.mutate({
                                        alertId: selectedAlert.id,
                                        notes: acknowledgeNotes || undefined
                                      });
                                    }
                                  }}
                                  disabled={acknowledgeAlertMutation.isPending}
                                  data-testid="button-confirm-acknowledge"
                                >
                                  {acknowledgeAlertMutation.isPending ? "Acknowledging..." : "Acknowledge"}
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        )}
                        
                        {alert.acknowledgedAt && (
                          <Badge variant="secondary">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Acknowledged
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {(!alertsData?.alerts || alertsData.alerts.length === 0) && (
                    <div className="text-center py-8">
                      <CheckCircle2 className="w-12 h-12 mx-auto text-green-600 mb-3" />
                      <p className="text-muted-foreground">No active alerts</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Risk Map Tab */}
        <TabsContent value="risk-map" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Fleet Risk Heat Map</CardTitle>
              <CardDescription>Visual representation of vehicle maintenance risks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {vehiclesData?.vehicles?.map(vehicle => {
                  const vehiclePredictions = predictions?.predictions?.filter(p => p.vehicleId === vehicle.id) || [];
                  const highestRisk = vehiclePredictions.reduce((highest, p) => {
                    const riskLevels = ['low', 'medium', 'high', 'critical'];
                    const currentIndex = riskLevels.indexOf(p.riskLevel);
                    const highestIndex = riskLevels.indexOf(highest);
                    return currentIndex > highestIndex ? p.riskLevel : highest;
                  }, 'low');
                  
                  const RiskIcon = getRiskIcon(highestRisk);
                  
                  return (
                    <div 
                      key={vehicle.id} 
                      className={`p-4 rounded-lg border hover-elevate cursor-pointer ${getRiskColor(highestRisk)}`}
                      data-testid={`risk-card-${vehicle.id}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <RiskIcon className="w-5 h-5" />
                        <Badge variant={getRiskBadgeVariant(highestRisk) as any} className="text-xs">
                          {highestRisk}
                        </Badge>
                      </div>
                      <div className="font-medium text-sm">{vehicle.identifier}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {vehicle.make} {vehicle.model}
                      </div>
                      <div className="text-xs mt-2">
                        {vehiclePredictions.length} predictions
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {/* Legend */}
              <div className="mt-6 pt-4 border-t">
                <p className="text-sm font-medium mb-3">Risk Level Legend</p>
                <div className="flex items-center gap-4">
                  {['critical', 'high', 'medium', 'low'].map(level => {
                    const RiskIcon = getRiskIcon(level);
                    return (
                      <div key={level} className="flex items-center gap-2">
                        <RiskIcon className={`w-4 h-4 ${getRiskColor(level).split(' ')[0]}`} />
                        <span className="text-sm capitalize">{level}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ROI Analysis Tab */}
        <TabsContent value="roi" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Maintenance ROI Calculator</CardTitle>
              <CardDescription>Calculate return on investment for preventive maintenance</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Select value={roiVehicleId} onValueChange={setRoiVehicleId}>
                  <SelectTrigger className="w-[240px]" data-testid="select-roi-vehicle">
                    <SelectValue placeholder="Select a vehicle" />
                  </SelectTrigger>
                  <SelectContent>
                    {vehiclesData?.vehicles?.map(v => (
                      <SelectItem key={v.id} value={v.id}>{v.identifier}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button 
                  onClick={() => refetchROI()}
                  disabled={!roiVehicleId || loadingROI}
                  data-testid="button-calculate-roi"
                >
                  Calculate ROI
                </Button>
              </div>

              {roiData && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Preventive Maintenance Cost</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-green-600">
                        ${roiData.preventiveCost?.toLocaleString() || 0}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Scheduled maintenance expenses
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Reactive Maintenance Cost</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-red-600">
                        ${roiData.reactiveCost?.toLocaleString() || 0}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Emergency repair expenses
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Potential Savings</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-primary">
                        ${roiData.savings?.toLocaleString() || 0}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        By following predictions
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">ROI Percentage</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {roiData.roiPercentage?.toFixed(1) || 0}%
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Return on investment
                      </p>
                    </CardContent>
                  </Card>
                </div>
              )}

              {roiData?.breakdown && (
                <Card className="mt-4">
                  <CardHeader>
                    <CardTitle className="text-sm">Cost Breakdown Analysis</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {roiData.breakdown.map((item: any, index: number) => (
                        <div key={index} className="flex items-center justify-between p-2 rounded bg-muted">
                          <div>
                            <p className="text-sm font-medium">{item.serviceType}</p>
                            <p className="text-xs text-muted-foreground">
                              {item.frequency} per year
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium">
                              ${item.preventiveCost} vs ${item.reactiveCost}
                            </p>
                            <p className="text-xs text-green-600">
                              Save ${item.savings}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {!roiData && roiVehicleId && !loadingROI && (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertTitle>Calculate ROI</AlertTitle>
                  <AlertDescription>
                    Click "Calculate ROI" to see the potential savings from preventive maintenance for the selected vehicle.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}