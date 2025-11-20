import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import AdminLayout from "@/layouts/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { useIsMobile } from "@/hooks/use-mobile";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import { 
  LineChart, Line, AreaChart, Area, BarChart, Bar, 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  RadialBarChart, RadialBar, Cell
} from "recharts";
import {
  Activity, AlertCircle, AlertTriangle, CheckCircle, ChevronDown, ChevronUp, 
  Clock, Cpu, Database, Download, FileText, Filter, HardDrive, Loader2, 
  Mail, MessageSquare, PauseCircle, PlayCircle, RefreshCw, Server, 
  Shield, ShoppingCart, TrendingUp, Users, Wifi, WifiOff, XCircle,
  Gauge, MemoryStick, Zap, Calendar, Settings, Trash2, Search, Code
} from "lucide-react";

interface SystemHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  services: {
    database: 'healthy' | 'degraded' | 'unhealthy';
    websocket: 'healthy' | 'degraded' | 'unhealthy';
    stripe: 'healthy' | 'degraded' | 'unhealthy';
    email: 'healthy' | 'degraded' | 'unhealthy';
    storage: 'healthy' | 'degraded' | 'unhealthy';
    scheduler: 'healthy' | 'degraded' | 'unhealthy';
  };
  metrics: {
    uptime: number;
    memory: {
      used: number;
      total: number;
      percentage: number;
    };
    cpu: {
      usage: number;
      loadAverage: number[];
    };
    activeConnections: number;
    requestThroughput: number;
  };
  responseTime: number;
  lastChecked: string;
  errors: string[];
}

interface ServiceHealth {
  services: Record<string, {
    name: string;
    status: 'healthy' | 'degraded' | 'unhealthy';
    responseTime: number;
    details: Record<string, any>;
    lastCheck: string;
    errors: string[];
  }>;
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime: number;
  lastChecked: string;
}

interface DatabaseHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  connectionPool: {
    total: number;
    active: number;
    idle: number;
    waiting: number;
  };
  tableStats: Array<{
    tableName: string;
    rowCount: number;
    sizeBytes: number;
  }>;
  slowQueries: Array<{
    query: string;
    duration: number;
    timestamp: string;
  }>;
  databaseSize: {
    totalBytes: number;
    dataBytes: number;
    indexBytes: number;
  };
  indexUsage: Array<{
    indexName: string;
    tableName: string;
    scans: number;
    reads: number;
    efficiency: number;
  }>;
  responseTime: number;
  lastChecked: string;
  errors: string[];
}

interface ErrorTracking {
  recentErrors: Array<{
    timestamp: string;
    type: string;
    message: string;
    stack?: string;
    endpoint?: string;
    userId?: string;
  }>;
  errorFrequency: Record<string, number>;
  failedPayments: number;
  failedNotifications: number;
  apiErrorRate: {
    total: number;
    rate4xx: number;
    rate5xx: number;
    rateTimeout: number;
  };
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime: number;
  lastChecked: string;
}

export default function AdminStatusPage() {
  const { toast } = useToast();
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(5000);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    system: true,
    services: true,
    database: true,
    errors: true,
    jobs: true
  });
  const [selectedError, setSelectedError] = useState<any>(null);
  const [showStackTrace, setShowStackTrace] = useState(false);
  const [errorFilter, setErrorFilter] = useState("all");
  const [showClearDialog, setShowClearDialog] = useState(false);

  // Query for system health
  const { data: systemHealth, isLoading: systemLoading, refetch: refetchSystem } = useQuery<SystemHealth>({
    queryKey: ['/api/health/system'],
    refetchInterval: autoRefresh ? refreshInterval : false,
  });

  // Query for services health
  const { data: servicesHealth, isLoading: servicesLoading, refetch: refetchServices } = useQuery<ServiceHealth>({
    queryKey: ['/api/health/services'],
    refetchInterval: autoRefresh ? refreshInterval : false,
  });

  // Query for database health
  const { data: databaseHealth, isLoading: databaseLoading, refetch: refetchDatabase } = useQuery<DatabaseHealth>({
    queryKey: ['/api/health/database'],
    refetchInterval: autoRefresh ? refreshInterval : false,
  });

  // Query for error tracking
  const { data: errorTracking, isLoading: errorsLoading, refetch: refetchErrors } = useQuery<ErrorTracking>({
    queryKey: ['/api/health/errors'],
    refetchInterval: autoRefresh ? refreshInterval : false,
  });

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const getStatusColor = (status?: string): "default" | "secondary" | "destructive" => {
    switch (status) {
      case 'healthy': return "default";
      case 'degraded': return "secondary";
      case 'unhealthy': return "destructive";
      default: return "secondary";
    }
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="h-4 w-4" />;
      case 'degraded': return <AlertTriangle className="h-4 w-4" />;
      case 'unhealthy': return <XCircle className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const handleRefreshAll = async () => {
    await Promise.all([
      refetchSystem(),
      refetchServices(),
      refetchDatabase(),
      refetchErrors()
    ]);
    toast({
      title: "Status refreshed",
      description: "All health metrics have been updated",
    });
  };

  const handleExportLogs = () => {
    const exportData = {
      timestamp: new Date().toISOString(),
      systemHealth,
      servicesHealth,
      databaseHealth,
      errorTracking
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `system-status-${format(new Date(), 'yyyy-MM-dd-HH-mm-ss')}.json`;
    a.click();
    
    toast({
      title: "Logs exported",
      description: "System status logs have been downloaded",
    });
  };

  const handleClearErrors = async () => {
    try {
      await apiRequest('POST', '/api/health/errors/clear');
      await refetchErrors();
      setShowClearDialog(false);
      toast({
        title: "Errors cleared",
        description: "Error logs have been cleared successfully",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to clear errors",
        description: "Could not clear error logs",
      });
    }
  };

  const filteredErrors = errorTracking?.recentErrors?.filter(error => {
    if (errorFilter === "all") return true;
    if (errorFilter === "4xx") return error.type?.includes("4") || error.message?.includes("400") || error.message?.includes("401") || error.message?.includes("403") || error.message?.includes("404");
    if (errorFilter === "5xx") return error.type?.includes("5") || error.message?.includes("500") || error.message?.includes("502") || error.message?.includes("503");
    if (errorFilter === "timeout") return error.type?.toLowerCase().includes("timeout");
    if (errorFilter === "payment") return error.type?.toLowerCase().includes("payment") || error.endpoint?.includes("payment") || error.endpoint?.includes("stripe");
    if (errorFilter === "notification") return error.type?.toLowerCase().includes("notification") || error.type?.toLowerCase().includes("email") || error.type?.toLowerCase().includes("sms");
    return true;
  }) || [];

  // Prepare data for charts
  const memoryChartData = systemHealth ? [{
    name: 'Memory',
    used: systemHealth.metrics.memory.percentage,
    available: 100 - systemHealth.metrics.memory.percentage,
  }] : [];

  const cpuChartData = systemHealth ? [{
    name: 'CPU',
    usage: systemHealth.metrics.cpu.usage,
    idle: 100 - systemHealth.metrics.cpu.usage,
  }] : [];

  const errorRateData = errorTracking ? [
    { name: '4xx', value: errorTracking.apiErrorRate.rate4xx, fill: '#fbbf24' },
    { name: '5xx', value: errorTracking.apiErrorRate.rate5xx, fill: '#ef4444' },
    { name: 'Timeout', value: errorTracking.apiErrorRate.rateTimeout, fill: '#f97316' },
  ] : [];

  return (
    <AdminLayout
      title="System Status Monitoring"
      breadcrumbs={[{ label: "Status" }]}
    >
      {/* Header Controls */}
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-4">
          <div className="flex items-center gap-2">
            <Switch
              checked={autoRefresh}
              onCheckedChange={setAutoRefresh}
              id="auto-refresh"
              data-testid="switch-auto-refresh"
            />
            <Label htmlFor="auto-refresh" className="cursor-pointer">
              Auto-refresh {autoRefresh && `(${refreshInterval / 1000}s)`}
            </Label>
          </div>
          
          {autoRefresh && (
            <Select value={String(refreshInterval)} onValueChange={(value) => setRefreshInterval(Number(value))}>
              <SelectTrigger className="w-32" data-testid="select-refresh-interval">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5000">5 seconds</SelectItem>
                <SelectItem value="10000">10 seconds</SelectItem>
                <SelectItem value="30000">30 seconds</SelectItem>
                <SelectItem value="60000">1 minute</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefreshAll}
            data-testid="button-refresh-all"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh Now
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportLogs}
            data-testid="button-export-logs"
          >
            <Download className="mr-2 h-4 w-4" />
            Export Logs
          </Button>
        </div>
      </div>

      {/* Overall Status Alert */}
      {systemHealth && systemHealth.status !== 'healthy' && (
        <Alert className="mb-6" variant={systemHealth.status === 'unhealthy' ? 'destructive' : 'default'}>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>System Status: {systemHealth.status.toUpperCase()}</AlertTitle>
          <AlertDescription>
            {systemHealth.errors && systemHealth.errors.length > 0 && (
              <ul className="mt-2 list-disc list-inside">
                {systemHealth.errors.map((error, idx) => (
                  <li key={idx}>{error}</li>
                ))}
              </ul>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* System Overview Section */}
      <Collapsible open={expandedSections.system} className="mb-6">
        <Card>
          <CardHeader>
            <CollapsibleTrigger
              onClick={() => toggleSection('system')}
              className="flex w-full items-center justify-between cursor-pointer"
              data-testid="collapsible-system-overview"
            >
              <div className="flex items-center gap-3">
                <Server className="h-5 w-5" />
                <div>
                  <CardTitle>System Overview</CardTitle>
                  <CardDescription>Overall system health and metrics</CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {systemLoading ? (
                  <Skeleton className="h-6 w-20" />
                ) : (
                  <Badge variant={getStatusColor(systemHealth?.status)}>
                    {getStatusIcon(systemHealth?.status)}
                    <span className="ml-1">{systemHealth?.status || 'Unknown'}</span>
                  </Badge>
                )}
                {expandedSections.system ? <ChevronUp /> : <ChevronDown />}
              </div>
            </CollapsibleTrigger>
          </CardHeader>
          
          <CollapsibleContent>
            <CardContent className="space-y-6">
              {systemLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                </div>
              ) : systemHealth ? (
                <>
                  {/* Key Metrics Grid */}
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Uptime</span>
                      </div>
                      <p className="text-2xl font-bold">{formatUptime(systemHealth.metrics.uptime)}</p>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Wifi className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Active Connections</span>
                      </div>
                      <p className="text-2xl font-bold">{systemHealth.metrics.activeConnections}</p>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Request Throughput</span>
                      </div>
                      <p className="text-2xl font-bold">{systemHealth.metrics.requestThroughput}/s</p>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Gauge className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Response Time</span>
                      </div>
                      <p className="text-2xl font-bold">{systemHealth.responseTime}ms</p>
                    </div>
                  </div>

                  <Separator />

                  {/* Resource Usage */}
                  <div className="grid gap-6 md:grid-cols-2">
                    {/* Memory Usage */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <MemoryStick className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">Memory Usage</span>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {formatBytes(systemHealth.metrics.memory.used)} / {formatBytes(systemHealth.metrics.memory.total)}
                        </span>
                      </div>
                      <Progress value={systemHealth.metrics.memory.percentage} className="h-3" />
                      <p className="text-xs text-muted-foreground">
                        {systemHealth.metrics.memory.percentage.toFixed(1)}% used
                      </p>
                    </div>

                    {/* CPU Usage */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Cpu className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">CPU Usage</span>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          Load: {systemHealth.metrics.cpu.loadAverage.map(l => l.toFixed(2)).join(', ')}
                        </span>
                      </div>
                      <Progress value={systemHealth.metrics.cpu.usage} className="h-3" />
                      <p className="text-xs text-muted-foreground">
                        {systemHealth.metrics.cpu.usage.toFixed(1)}% used
                      </p>
                    </div>
                  </div>

                  {/* Visual Charts */}
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="h-64">
                      <h4 className="mb-4 text-sm font-medium">Memory Distribution</h4>
                      <ResponsiveContainer width="100%" height="100%">
                        <RadialBarChart cx="50%" cy="50%" innerRadius="30%" outerRadius="90%" data={memoryChartData}>
                          <RadialBar dataKey="used" fill="#3b82f6" />
                          <RadialBar dataKey="available" fill="#e5e7eb" />
                          <Tooltip />
                        </RadialBarChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="h-64">
                      <h4 className="mb-4 text-sm font-medium">CPU Usage</h4>
                      <ResponsiveContainer width="100%" height="100%">
                        <RadialBarChart cx="50%" cy="50%" innerRadius="30%" outerRadius="90%" data={cpuChartData}>
                          <RadialBar dataKey="usage" fill="#10b981" />
                          <RadialBar dataKey="idle" fill="#e5e7eb" />
                          <Tooltip />
                        </RadialBarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </>
              ) : (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>No Data</AlertTitle>
                  <AlertDescription>Unable to fetch system health data</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Service Health Grid */}
      <Collapsible open={expandedSections.services} className="mb-6">
        <Card>
          <CardHeader>
            <CollapsibleTrigger
              onClick={() => toggleSection('services')}
              className="flex w-full items-center justify-between cursor-pointer"
              data-testid="collapsible-services"
            >
              <div className="flex items-center gap-3">
                <Settings className="h-5 w-5" />
                <div>
                  <CardTitle>Service Health</CardTitle>
                  <CardDescription>Individual service status and performance</CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {servicesLoading ? (
                  <Skeleton className="h-6 w-20" />
                ) : (
                  <Badge variant={getStatusColor(servicesHealth?.status)}>
                    {getStatusIcon(servicesHealth?.status)}
                    <span className="ml-1">{servicesHealth?.status || 'Unknown'}</span>
                  </Badge>
                )}
                {expandedSections.services ? <ChevronUp /> : <ChevronDown />}
              </div>
            </CollapsibleTrigger>
          </CardHeader>

          <CollapsibleContent>
            <CardContent>
              {servicesLoading ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {[...Array(9)].map((_, i) => (
                    <Skeleton key={i} className="h-32" />
                  ))}
                </div>
              ) : servicesHealth ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {/* Authentication Service */}
                  <Card className="border">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4" />
                          <span className="font-medium">Authentication</span>
                        </div>
                        <Badge variant={getStatusColor(servicesHealth.services.auth?.status)}>
                          {servicesHealth.services.auth?.status || 'Unknown'}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Response Time</span>
                        <span>{servicesHealth.services.auth?.responseTime || 0}ms</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Last Check</span>
                        <span>{servicesHealth.services.auth?.lastCheck ? format(new Date(servicesHealth.services.auth.lastCheck), 'HH:mm:ss') : 'N/A'}</span>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Job Management */}
                  <Card className="border">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          <span className="font-medium">Job Management</span>
                        </div>
                        <Badge variant={getStatusColor(servicesHealth.services.jobs?.status)}>
                          {servicesHealth.services.jobs?.status || 'Unknown'}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Response Time</span>
                        <span>{servicesHealth.services.jobs?.responseTime || 0}ms</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Last Check</span>
                        <span>{servicesHealth.services.jobs?.lastCheck ? format(new Date(servicesHealth.services.jobs.lastCheck), 'HH:mm:ss') : 'N/A'}</span>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Payment System (Stripe) */}
                  <Card className="border">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <ShoppingCart className="h-4 w-4" />
                          <span className="font-medium">Stripe Payments</span>
                        </div>
                        <Badge variant={getStatusColor(systemHealth?.services.stripe)}>
                          {systemHealth?.services.stripe || 'Unknown'}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">API Connected</span>
                        <span>{servicesHealth.services.stripe?.details?.apiConnected ? 'Yes' : 'No'}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Webhook</span>
                        <span>{servicesHealth.services.stripe?.details?.webhookConfigured ? 'Configured' : 'Not configured'}</span>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Email Service */}
                  <Card className="border">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          <span className="font-medium">Email Service</span>
                        </div>
                        <Badge variant={getStatusColor(systemHealth?.services.email)}>
                          {systemHealth?.services.email || 'Unknown'}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Configured</span>
                        <span>{servicesHealth.services.email?.details?.configured ? 'Yes' : 'No'}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Queue Size</span>
                        <span>{servicesHealth.services.email?.details?.queueSize || 0}</span>
                      </div>
                    </CardContent>
                  </Card>

                  {/* SMS Service */}
                  <Card className="border">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <MessageSquare className="h-4 w-4" />
                          <span className="font-medium">SMS Service</span>
                        </div>
                        <Badge variant={getStatusColor(servicesHealth.services.sms?.status)}>
                          {servicesHealth.services.sms?.status || 'Unknown'}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Response Time</span>
                        <span>{servicesHealth.services.sms?.responseTime || 0}ms</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Last Check</span>
                        <span>{servicesHealth.services.sms?.lastCheck ? format(new Date(servicesHealth.services.sms.lastCheck), 'HH:mm:ss') : 'N/A'}</span>
                      </div>
                    </CardContent>
                  </Card>

                  {/* WebSocket Server */}
                  <Card className="border">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {systemHealth?.services.websocket === 'healthy' ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
                          <span className="font-medium">WebSocket Server</span>
                        </div>
                        <Badge variant={getStatusColor(systemHealth?.services.websocket)}>
                          {systemHealth?.services.websocket || 'Unknown'}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Connections</span>
                        <span>{servicesHealth.services.websocket?.details?.connections || 0}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Rooms</span>
                        <span>{servicesHealth.services.websocket?.details?.rooms || 0}</span>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Background Jobs */}
                  <Card className="border">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span className="font-medium">Background Jobs</span>
                        </div>
                        <Badge variant={getStatusColor(systemHealth?.services.scheduler)}>
                          {systemHealth?.services.scheduler || 'Unknown'}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Running Jobs</span>
                        <span>{servicesHealth.services.scheduler?.details?.runningJobs || 0}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Total Jobs</span>
                        <span>{servicesHealth.services.scheduler?.details?.totalJobs || 0}</span>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Invoice System */}
                  <Card className="border">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          <span className="font-medium">Invoice System</span>
                        </div>
                        <Badge variant={getStatusColor(servicesHealth.services.invoicing?.status)}>
                          {servicesHealth.services.invoicing?.status || 'Unknown'}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Response Time</span>
                        <span>{servicesHealth.services.invoicing?.responseTime || 0}ms</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Last Check</span>
                        <span>{servicesHealth.services.invoicing?.lastCheck ? format(new Date(servicesHealth.services.invoicing.lastCheck), 'HH:mm:ss') : 'N/A'}</span>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Fleet Management */}
                  <Card className="border">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          <span className="font-medium">Fleet Management</span>
                        </div>
                        <Badge variant={getStatusColor(servicesHealth.services.fleet?.status)}>
                          {servicesHealth.services.fleet?.status || 'Unknown'}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Response Time</span>
                        <span>{servicesHealth.services.fleet?.responseTime || 0}ms</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Last Check</span>
                        <span>{servicesHealth.services.fleet?.lastCheck ? format(new Date(servicesHealth.services.fleet.lastCheck), 'HH:mm:ss') : 'N/A'}</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>No Data</AlertTitle>
                  <AlertDescription>Unable to fetch services health data</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Database Metrics */}
      <Collapsible open={expandedSections.database} className="mb-6">
        <Card>
          <CardHeader>
            <CollapsibleTrigger
              onClick={() => toggleSection('database')}
              className="flex w-full items-center justify-between cursor-pointer"
              data-testid="collapsible-database"
            >
              <div className="flex items-center gap-3">
                <Database className="h-5 w-5" />
                <div>
                  <CardTitle>Database Metrics</CardTitle>
                  <CardDescription>Database performance and statistics</CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {databaseLoading ? (
                  <Skeleton className="h-6 w-20" />
                ) : (
                  <Badge variant={getStatusColor(databaseHealth?.status)}>
                    {getStatusIcon(databaseHealth?.status)}
                    <span className="ml-1">{databaseHealth?.status || 'Unknown'}</span>
                  </Badge>
                )}
                {expandedSections.database ? <ChevronUp /> : <ChevronDown />}
              </div>
            </CollapsibleTrigger>
          </CardHeader>

          <CollapsibleContent>
            <CardContent className="space-y-6">
              {databaseLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-32 w-full" />
                </div>
              ) : databaseHealth ? (
                <>
                  {/* Connection Pool */}
                  <div>
                    <h4 className="mb-3 font-medium">Connection Pool</h4>
                    <div className="grid gap-4 md:grid-cols-4">
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Total</p>
                        <p className="text-2xl font-bold">{databaseHealth.connectionPool.total}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Active</p>
                        <p className="text-2xl font-bold">{databaseHealth.connectionPool.active}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Idle</p>
                        <p className="text-2xl font-bold">{databaseHealth.connectionPool.idle}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Waiting</p>
                        <p className="text-2xl font-bold">{databaseHealth.connectionPool.waiting}</p>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Database Size */}
                  <div>
                    <h4 className="mb-3 font-medium">Database Size</h4>
                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Total Size</p>
                        <p className="text-xl font-semibold">{formatBytes(databaseHealth.databaseSize.totalBytes)}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Data Size</p>
                        <p className="text-xl font-semibold">{formatBytes(databaseHealth.databaseSize.dataBytes)}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Index Size</p>
                        <p className="text-xl font-semibold">{formatBytes(databaseHealth.databaseSize.indexBytes)}</p>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Table Statistics */}
                  <div>
                    <h4 className="mb-3 font-medium">Table Statistics</h4>
                    <ScrollArea className="h-64">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Table</TableHead>
                            <TableHead className="text-right">Row Count</TableHead>
                            <TableHead className="text-right">Size</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {databaseHealth.tableStats.map((table) => (
                            <TableRow key={table.tableName}>
                              <TableCell className="font-mono text-sm">{table.tableName}</TableCell>
                              <TableCell className="text-right">{table.rowCount.toLocaleString()}</TableCell>
                              <TableCell className="text-right">{formatBytes(table.sizeBytes)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </ScrollArea>
                  </div>

                  {/* Slow Queries */}
                  {databaseHealth.slowQueries && databaseHealth.slowQueries.length > 0 && (
                    <>
                      <Separator />
                      <div>
                        <h4 className="mb-3 font-medium">Slow Queries</h4>
                        <ScrollArea className="h-64">
                          <div className="space-y-3">
                            {databaseHealth.slowQueries.map((query, idx) => (
                              <div key={idx} className="rounded-lg border p-3">
                                <div className="mb-2 flex items-center justify-between">
                                  <Badge variant="secondary">{query.duration}ms</Badge>
                                  <span className="text-xs text-muted-foreground">
                                    {format(new Date(query.timestamp), 'HH:mm:ss')}
                                  </span>
                                </div>
                                <code className="text-xs">{query.query.substring(0, 200)}...</code>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      </div>
                    </>
                  )}
                </>
              ) : (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>No Data</AlertTitle>
                  <AlertDescription>Unable to fetch database metrics</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Error Tracking */}
      <Collapsible open={expandedSections.errors} className="mb-6">
        <Card>
          <CardHeader>
            <CollapsibleTrigger
              onClick={() => toggleSection('errors')}
              className="flex w-full items-center justify-between cursor-pointer"
              data-testid="collapsible-errors"
            >
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5" />
                <div>
                  <CardTitle>Error Tracking</CardTitle>
                  <CardDescription>Recent errors and error frequency</CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {errorsLoading ? (
                  <Skeleton className="h-6 w-20" />
                ) : errorTracking && errorTracking.apiErrorRate.total > 0 ? (
                  <Badge variant="destructive">
                    {errorTracking.apiErrorRate.total} errors
                  </Badge>
                ) : (
                  <Badge variant="default">No errors</Badge>
                )}
                {expandedSections.errors ? <ChevronUp /> : <ChevronDown />}
              </div>
            </CollapsibleTrigger>
          </CardHeader>

          <CollapsibleContent>
            <CardContent className="space-y-6">
              {errorsLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-32 w-full" />
                  <Skeleton className="h-64 w-full" />
                </div>
              ) : errorTracking ? (
                <>
                  {/* Error Summary */}
                  <div className="grid gap-4 md:grid-cols-4">
                    <Card className="border">
                      <CardHeader className="p-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Total Errors</span>
                          <AlertCircle className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <p className="text-2xl font-bold">{errorTracking.apiErrorRate.total}</p>
                      </CardHeader>
                    </Card>
                    
                    <Card className="border">
                      <CardHeader className="p-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Failed Payments</span>
                          <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <p className="text-2xl font-bold">{errorTracking.failedPayments}</p>
                      </CardHeader>
                    </Card>
                    
                    <Card className="border">
                      <CardHeader className="p-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Failed Notifications</span>
                          <Mail className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <p className="text-2xl font-bold">{errorTracking.failedNotifications}</p>
                      </CardHeader>
                    </Card>
                    
                    <Card className="border">
                      <CardHeader className="p-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Timeouts</span>
                          <Clock className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <p className="text-2xl font-bold">{errorTracking.apiErrorRate.rateTimeout}</p>
                      </CardHeader>
                    </Card>
                  </div>

                  {/* Error Rate Chart */}
                  {errorRateData.length > 0 && (
                    <div className="h-64">
                      <h4 className="mb-4 font-medium">Error Distribution</h4>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={errorRateData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="value" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  <Separator />

                  {/* Recent Errors Table */}
                  <div>
                    <div className="mb-3 flex items-center justify-between">
                      <h4 className="font-medium">Recent Errors</h4>
                      <div className="flex gap-2">
                        <Select value={errorFilter} onValueChange={setErrorFilter}>
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Errors</SelectItem>
                            <SelectItem value="4xx">4xx Errors</SelectItem>
                            <SelectItem value="5xx">5xx Errors</SelectItem>
                            <SelectItem value="timeout">Timeouts</SelectItem>
                            <SelectItem value="payment">Payment</SelectItem>
                            <SelectItem value="notification">Notification</SelectItem>
                          </SelectContent>
                        </Select>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowClearDialog(true)}
                          data-testid="button-clear-errors"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Clear
                        </Button>
                      </div>
                    </div>

                    <ScrollArea className="h-96">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-32">Timestamp</TableHead>
                            <TableHead className="w-24">Type</TableHead>
                            <TableHead>Message</TableHead>
                            <TableHead className="w-32">Endpoint</TableHead>
                            <TableHead className="w-20">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredErrors.length > 0 ? (
                            filteredErrors.map((error, idx) => (
                              <TableRow key={idx}>
                                <TableCell className="text-xs">
                                  {format(new Date(error.timestamp), 'HH:mm:ss')}
                                </TableCell>
                                <TableCell>
                                  <Badge variant="destructive" className="text-xs">
                                    {error.type}
                                  </Badge>
                                </TableCell>
                                <TableCell className="max-w-xs truncate text-sm">
                                  {error.message}
                                </TableCell>
                                <TableCell className="text-xs">
                                  {error.endpoint || '-'}
                                </TableCell>
                                <TableCell>
                                  {error.stack && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        setSelectedError(error);
                                        setShowStackTrace(true);
                                      }}
                                      data-testid={`button-view-stack-${idx}`}
                                    >
                                      <Code className="h-4 w-4" />
                                    </Button>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell colSpan={5} className="text-center text-muted-foreground">
                                No errors found
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </ScrollArea>
                  </div>
                </>
              ) : (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertTitle>No Errors</AlertTitle>
                  <AlertDescription>No errors have been recorded</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Background Jobs */}
      <Collapsible open={expandedSections.jobs} className="mb-6">
        <Card>
          <CardHeader>
            <CollapsibleTrigger
              onClick={() => toggleSection('jobs')}
              className="flex w-full items-center justify-between cursor-pointer"
              data-testid="collapsible-jobs"
            >
              <div className="flex items-center gap-3">
                <Zap className="h-5 w-5" />
                <div>
                  <CardTitle>Background Jobs</CardTitle>
                  <CardDescription>Scheduled task status and monitoring</CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={getStatusColor(systemHealth?.services.scheduler)}>
                  {getStatusIcon(systemHealth?.services.scheduler)}
                  <span className="ml-1">{systemHealth?.services.scheduler || 'Unknown'}</span>
                </Badge>
                {expandedSections.jobs ? <ChevronUp /> : <ChevronDown />}
              </div>
            </CollapsibleTrigger>
          </CardHeader>

          <CollapsibleContent>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                {/* Job Monitor */}
                <Card className="border">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Job Monitor</span>
                      <Badge variant="default">Active</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Last Run</span>
                      <span>{format(new Date(), 'HH:mm:ss')}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Next Run</span>
                      <span>In 5 minutes</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Billing Scheduler */}
                <Card className="border">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Billing Scheduler</span>
                      <Badge variant="default">Active</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Last Run</span>
                      <span>{format(new Date(), 'HH:mm:ss')}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Next Run</span>
                      <span>Tomorrow 00:00</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Reminder Processor */}
                <Card className="border">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Reminder Processor</span>
                      <Badge variant="default">Active</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Last Run</span>
                      <span>{format(new Date(), 'HH:mm:ss')}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Next Run</span>
                      <span>In 30 minutes</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Stack Trace Dialog */}
      <Dialog open={showStackTrace} onOpenChange={setShowStackTrace}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Error Stack Trace</DialogTitle>
            <DialogDescription>
              {selectedError?.timestamp && format(new Date(selectedError.timestamp), 'PPpp')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <h4 className="mb-2 text-sm font-medium">Error Type</h4>
              <Badge variant="destructive">{selectedError?.type}</Badge>
            </div>
            <div>
              <h4 className="mb-2 text-sm font-medium">Message</h4>
              <p className="text-sm">{selectedError?.message}</p>
            </div>
            {selectedError?.endpoint && (
              <div>
                <h4 className="mb-2 text-sm font-medium">Endpoint</h4>
                <code className="text-sm">{selectedError.endpoint}</code>
              </div>
            )}
            {selectedError?.stack && (
              <div>
                <h4 className="mb-2 text-sm font-medium">Stack Trace</h4>
                <ScrollArea className="h-64 rounded border bg-muted p-4">
                  <pre className="text-xs">{selectedError.stack}</pre>
                </ScrollArea>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStackTrace(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Clear Errors Confirmation Dialog */}
      <Dialog open={showClearDialog} onOpenChange={setShowClearDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Clear Error Logs</DialogTitle>
            <DialogDescription>
              Are you sure you want to clear all error logs? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowClearDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleClearErrors}>
              Clear Errors
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}