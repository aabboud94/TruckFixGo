import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertTriangle,
  MapPin,
  Phone,
  Clock,
  CheckCircle,
  Navigation,
  MessageSquare,
  Activity,
  User,
  Calendar,
  AlertOctagon,
  Shield,
  Wrench,
  Heart,
  XCircle,
  Loader2,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { EmergencySosAlert, EmergencyResponseLog } from "@shared/schema";

interface AlertWithLogs {
  alert: EmergencySosAlert;
  logs: EmergencyResponseLog[];
}

export default function EmergencyResponsePage() {
  const [selectedAlert, setSelectedAlert] = useState<EmergencySosAlert | null>(null);
  const [showResolveDialog, setShowResolveDialog] = useState(false);
  const [resolution, setResolution] = useState("resolved");
  const [notes, setNotes] = useState("");
  const [autoRefresh, setAutoRefresh] = useState(true);
  const { toast } = useToast();

  // Fetch active SOS alerts
  const { data: activeAlerts, isLoading } = useQuery<EmergencySosAlert[]>({
    queryKey: ["/api/emergency/sos/active"],
    refetchInterval: autoRefresh ? 10000 : false, // Refresh every 10 seconds
  });

  // Fetch selected alert details with logs
  const { data: alertDetails } = useQuery<AlertWithLogs>({
    queryKey: [`/api/emergency/sos/${selectedAlert?.id}`],
    enabled: !!selectedAlert?.id,
    refetchInterval: autoRefresh ? 5000 : false, // Refresh every 5 seconds
  });

  // Acknowledge alert mutation
  const acknowledgeMutation = useMutation({
    mutationFn: async (alertId: string) => {
      return await apiRequest(`/api/emergency/sos/${alertId}/acknowledge`, {
        method: "PATCH",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/emergency/sos/active"] });
      queryClient.invalidateQueries({ queryKey: [`/api/emergency/sos/${selectedAlert?.id}`] });
      toast({
        title: "Alert Acknowledged",
        description: "You have acknowledged the emergency alert.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to acknowledge alert.",
        variant: "destructive",
      });
    },
  });

  // Resolve alert mutation
  const resolveMutation = useMutation({
    mutationFn: async ({ alertId, resolution, notes }: { alertId: string; resolution: string; notes: string }) => {
      return await apiRequest(`/api/emergency/sos/${alertId}/resolve`, {
        method: "PATCH",
        body: JSON.stringify({ resolution, notes }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/emergency/sos/active"] });
      setShowResolveDialog(false);
      setSelectedAlert(null);
      setNotes("");
      toast({
        title: "Alert Resolved",
        description: "The emergency alert has been resolved.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to resolve alert.",
        variant: "destructive",
      });
    },
  });

  const getAlertIcon = (alertType: string) => {
    switch (alertType) {
      case "medical":
        return <Heart className="h-5 w-5" />;
      case "accident":
        return <AlertOctagon className="h-5 w-5" />;
      case "threat":
        return <Shield className="h-5 w-5" />;
      case "mechanical":
        return <Wrench className="h-5 w-5" />;
      default:
        return <AlertTriangle className="h-5 w-5" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "destructive";
      case "high":
        return "destructive";
      case "medium":
        return "secondary";
      case "low":
        return "outline";
      default:
        return "secondary";
    }
  };

  const handleNavigate = (location: any) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${location.lat},${location.lng}`;
    window.open(url, "_blank");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6" data-testid="page-emergency-response">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Emergency Response Center</h1>
            <p className="text-muted-foreground">Monitor and respond to active SOS alerts</p>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant={activeAlerts && activeAlerts.length > 0 ? "destructive" : "secondary"}>
              {activeAlerts?.length || 0} Active Alerts
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
              data-testid="button-auto-refresh"
            >
              {autoRefresh ? "Pause Refresh" : "Resume Refresh"}
            </Button>
          </div>
        </div>
      </div>

      {activeAlerts && activeAlerts.length === 0 ? (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            No active emergency alerts at this time. The system is monitoring for new alerts.
          </AlertDescription>
        </Alert>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Active Alerts</CardTitle>
                <CardDescription>Click on an alert to view details and respond</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px]">
                  <div className="space-y-4">
                    {activeAlerts?.map((alert) => (
                      <Card
                        key={alert.id}
                        className={cn(
                          "cursor-pointer transition-all hover-elevate",
                          selectedAlert?.id === alert.id && "ring-2 ring-primary"
                        )}
                        onClick={() => setSelectedAlert(alert)}
                        data-testid={`card-alert-${alert.id}`}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3">
                              <div className={cn(
                                "p-2 rounded-full",
                                alert.severity === "critical" || alert.severity === "high"
                                  ? "bg-red-100 text-red-600 dark:bg-red-950"
                                  : "bg-yellow-100 text-yellow-600 dark:bg-yellow-950"
                              )}>
                                {getAlertIcon(alert.alertType)}
                              </div>
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <Badge variant={getSeverityColor(alert.severity)}>
                                    {alert.severity}
                                  </Badge>
                                  <span className="text-sm font-medium">
                                    {alert.alertType.charAt(0).toUpperCase() + alert.alertType.slice(1)}
                                  </span>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  {alert.message}
                                </p>
                                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                  <div className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {formatDistanceToNow(new Date(alert.createdAt), { addSuffix: true })}
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <User className="h-3 w-3" />
                                    {alert.initiatorType}
                                  </div>
                                  {alert.status === "acknowledged" && (
                                    <Badge variant="outline" className="text-xs">
                                      Acknowledged
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          <div>
            {selectedAlert ? (
              <Card>
                <CardHeader>
                  <CardTitle>Alert Details</CardTitle>
                  <CardDescription>ID: {selectedAlert.id}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="details" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="details">Details</TabsTrigger>
                      <TabsTrigger value="location">Location</TabsTrigger>
                      <TabsTrigger value="logs">Activity</TabsTrigger>
                    </TabsList>

                    <TabsContent value="details" className="space-y-4">
                      <div className="space-y-3">
                        <div>
                          <label className="text-sm font-medium">Alert Type</label>
                          <div className="flex items-center gap-2 mt-1">
                            {getAlertIcon(selectedAlert.alertType)}
                            <span className="capitalize">{selectedAlert.alertType}</span>
                          </div>
                        </div>
                        <div>
                          <label className="text-sm font-medium">Severity</label>
                          <div className="mt-1">
                            <Badge variant={getSeverityColor(selectedAlert.severity)}>
                              {selectedAlert.severity}
                            </Badge>
                          </div>
                        </div>
                        <div>
                          <label className="text-sm font-medium">Message</label>
                          <p className="text-sm mt-1">{selectedAlert.message}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium">Status</label>
                          <div className="mt-1">
                            <Badge variant={selectedAlert.status === "active" ? "destructive" : "secondary"}>
                              {selectedAlert.status}
                            </Badge>
                          </div>
                        </div>
                        <div>
                          <label className="text-sm font-medium">Created</label>
                          <p className="text-sm mt-1">
                            {new Date(selectedAlert.createdAt).toLocaleString()}
                          </p>
                        </div>
                        {selectedAlert.jobId && (
                          <div>
                            <label className="text-sm font-medium">Related Job</label>
                            <p className="text-sm mt-1">#{selectedAlert.jobId}</p>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2 pt-4">
                        {selectedAlert.status === "active" && (
                          <Button
                            onClick={() => acknowledgeMutation.mutate(selectedAlert.id)}
                            disabled={acknowledgeMutation.isPending}
                            data-testid="button-acknowledge"
                          >
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Acknowledge
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          onClick={() => handleNavigate(selectedAlert.location)}
                          data-testid="button-navigate"
                        >
                          <Navigation className="mr-2 h-4 w-4" />
                          Navigate
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setShowResolveDialog(true)}
                          data-testid="button-resolve"
                        >
                          <XCircle className="mr-2 h-4 w-4" />
                          Resolve
                        </Button>
                      </div>
                    </TabsContent>

                    <TabsContent value="location" className="space-y-4">
                      <div className="space-y-3">
                        <div>
                          <label className="text-sm font-medium">Coordinates</label>
                          <p className="text-sm mt-1">
                            Lat: {(selectedAlert.location as any).lat?.toFixed(6)}, 
                            Lng: {(selectedAlert.location as any).lng?.toFixed(6)}
                          </p>
                        </div>
                        {(selectedAlert.location as any).accuracy && (
                          <div>
                            <label className="text-sm font-medium">Accuracy</label>
                            <p className="text-sm mt-1">
                              ±{(selectedAlert.location as any).accuracy}m
                            </p>
                          </div>
                        )}
                        {(selectedAlert.location as any).address && (
                          <div>
                            <label className="text-sm font-medium">Address</label>
                            <p className="text-sm mt-1">{(selectedAlert.location as any).address}</p>
                          </div>
                        )}
                      </div>
                      <Alert>
                        <MapPin className="h-4 w-4" />
                        <AlertDescription>
                          Location is being updated in real-time from the person's device
                        </AlertDescription>
                      </Alert>
                      <Button
                        className="w-full"
                        onClick={() => handleNavigate(selectedAlert.location)}
                        data-testid="button-open-maps"
                      >
                        <Navigation className="mr-2 h-4 w-4" />
                        Open in Maps
                      </Button>
                    </TabsContent>

                    <TabsContent value="logs" className="space-y-4">
                      <ScrollArea className="h-[400px]">
                        <div className="space-y-2">
                          {alertDetails?.logs?.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No activity logs yet</p>
                          ) : (
                            alertDetails?.logs?.map((log) => (
                              <div
                                key={log.id}
                                className="border-l-2 border-muted pl-4 py-2"
                                data-testid={`log-entry-${log.id}`}
                              >
                                <div className="flex items-center gap-2 text-sm font-medium">
                                  <Activity className="h-3 w-3" />
                                  {log.action}
                                </div>
                                {log.notes && (
                                  <p className="text-sm text-muted-foreground mt-1">
                                    {log.notes}
                                  </p>
                                )}
                                <p className="text-xs text-muted-foreground mt-1">
                                  {formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}
                                </p>
                              </div>
                            ))
                          )}
                        </div>
                      </ScrollArea>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="flex items-center justify-center h-[600px]">
                  <p className="text-muted-foreground">Select an alert to view details</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      <Dialog open={showResolveDialog} onOpenChange={setShowResolveDialog}>
        <DialogContent data-testid="dialog-resolve-alert">
          <DialogHeader>
            <DialogTitle>Resolve Emergency Alert</DialogTitle>
            <DialogDescription>
              Provide details about the resolution of this emergency alert
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Resolution Status</label>
              <Select value={resolution} onValueChange={setResolution}>
                <SelectTrigger data-testid="select-resolution">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="resolved">Resolved - Issue Addressed</SelectItem>
                  <SelectItem value="false_alarm">False Alarm</SelectItem>
                  <SelectItem value="cancelled">Cancelled by User</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Notes</label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Describe how the emergency was resolved..."
                className="min-h-24"
                data-testid="textarea-resolution-notes"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowResolveDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={() =>
                selectedAlert &&
                resolveMutation.mutate({
                  alertId: selectedAlert.id,
                  resolution,
                  notes,
                })
              }
              disabled={!notes || resolveMutation.isPending}
              data-testid="button-confirm-resolve"
            >
              {resolveMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Resolving...
                </>
              ) : (
                "Resolve Alert"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}