import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import AdminLayout from "@/layouts/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Activity,
  AlertTriangle,
  Bell,
  Clock,
  Eye,
  Filter,
  Gauge,
  Info,
  Loader2,
  Monitor,
  RefreshCw,
  Save,
  Settings,
  Shield,
  Timer,
  TrendingUp,
  UserCheck,
  Users,
  Zap,
  AlertCircle
} from "lucide-react";

const jobMonitorSchema = z.object({
  monitoringEnabled: z.boolean(),
  refreshInterval: z.number().min(10).max(300),
  escalationEnabled: z.boolean(),
  escalationTimeAdmin: z.number().min(1).max(60),
  escalationTimeCustomer: z.number().min(5).max(120),
  escalationTimeAutoAssign: z.number().min(10).max(180),
  adminAlertCooldown: z.number().min(10).max(240),
  customerNotificationCooldown: z.number().min(5).max(120),
  contractorRejectionCooldown: z.number().min(15).max(480),
  maxAlertAttempts: z.number().min(1).max(10),
  maxNotificationAttempts: z.number().min(1).max(5),
  autoAssignmentAlgorithm: z.enum([
    "nearest_available",
    "highest_rating",
    "balanced_workload",
    "fastest_response",
    "round_robin",
    "smart_match"
  ]),
  contractorSelectionFactors: z.object({
    distance: z.number().min(0).max(100),
    rating: z.number().min(0).max(100),
    availability: z.number().min(0).max(100),
    specialization: z.number().min(0).max(100),
    completionRate: z.number().min(0).max(100),
    responseTime: z.number().min(0).max(100),
  }),
  priorityRules: z.object({
    emergency: z.number().min(1).max(10),
    fleet: z.number().min(1).max(10),
    vip: z.number().min(1).max(10),
    scheduled: z.number().min(1).max(10),
    standard: z.number().min(1).max(10),
  }),
  alertChannels: z.object({
    email: z.boolean(),
    sms: z.boolean(),
    push: z.boolean(),
    inApp: z.boolean(),
    webhook: z.boolean(),
  }),
  monitoringThresholds: z.object({
    jobAgeWarning: z.number().min(5).max(60),
    jobAgeCritical: z.number().min(10).max(120),
    responseTimeWarning: z.number().min(1).max(30),
    responseTimeCritical: z.number().min(2).max(60),
    pendingJobsWarning: z.number().min(5).max(50),
    pendingJobsCritical: z.number().min(10).max(100),
  }),
});

type JobMonitorFormData = z.infer<typeof jobMonitorSchema>;

export default function JobMonitorPage() {
  const { toast } = useToast();
  const [selectedTab, setSelectedTab] = useState("general");
  const [testMode, setTestMode] = useState(false);
  
  // Fetch current configuration
  const { data: config, isLoading } = useQuery({
    queryKey: ["/api/admin/job-monitor-config"]
  });
  
  // Fetch monitoring stats
  const { data: stats } = useQuery({
    queryKey: ["/api/admin/job-monitor-stats"],
    refetchInterval: 30000 // Refresh every 30 seconds
  });
  
  // Form setup with default values
  const form = useForm<JobMonitorFormData>({
    resolver: zodResolver(jobMonitorSchema),
    defaultValues: config || {
      monitoringEnabled: true,
      refreshInterval: 30,
      escalationEnabled: true,
      escalationTimeAdmin: 5,
      escalationTimeCustomer: 7,
      escalationTimeAutoAssign: 10,
      adminAlertCooldown: 30,
      customerNotificationCooldown: 15,
      contractorRejectionCooldown: 60,
      maxAlertAttempts: 3,
      maxNotificationAttempts: 2,
      autoAssignmentAlgorithm: "balanced_workload",
      contractorSelectionFactors: {
        distance: 25,
        rating: 25,
        availability: 20,
        specialization: 15,
        completionRate: 10,
        responseTime: 5,
      },
      priorityRules: {
        emergency: 10,
        fleet: 8,
        vip: 7,
        scheduled: 5,
        standard: 3,
      },
      alertChannels: {
        email: true,
        sms: true,
        push: true,
        inApp: true,
        webhook: false,
      },
      monitoringThresholds: {
        jobAgeWarning: 15,
        jobAgeCritical: 30,
        responseTimeWarning: 5,
        responseTimeCritical: 10,
        pendingJobsWarning: 20,
        pendingJobsCritical: 50,
      },
    }
  });
  
  // Update configuration mutation
  const updateConfigMutation = useMutation({
    mutationFn: async (data: JobMonitorFormData) => {
      return apiRequest("PUT", "/api/admin/job-monitor-config", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/job-monitor-config"] });
      toast({
        title: "Configuration saved",
        description: "Job monitor settings have been updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Failed to save configuration",
        description: error.message,
      });
    }
  });
  
  // Test configuration mutation
  const testConfigMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/admin/job-monitor-test");
    },
    onSuccess: (data) => {
      toast({
        title: "Test completed",
        description: `Monitoring test completed. ${data.jobsProcessed} jobs processed, ${data.alertsSent} alerts sent.`,
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Test failed",
        description: error.message,
      });
    }
  });
  
  const onSubmit = (data: JobMonitorFormData) => {
    updateConfigMutation.mutate(data);
  };
  
  const handleTestConfiguration = () => {
    setTestMode(true);
    testConfigMutation.mutate();
    setTimeout(() => setTestMode(false), 5000);
  };
  
  // Calculate total weight for selection factors
  const totalWeight = Object.values(form.watch("contractorSelectionFactors")).reduce((a, b) => a + b, 0);
  
  if (isLoading) {
    return (
      <AdminLayout title="Job Monitor Settings">
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </AdminLayout>
    );
  }
  
  return (
    <AdminLayout 
      title="Job Monitor Settings"
      breadcrumbs={[{ label: "Settings" }, { label: "Job Monitor" }]}
    >
      {/* Status Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monitor Status</CardTitle>
            <Monitor className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Badge variant={form.watch("monitoringEnabled") ? "default" : "secondary"}>
                {form.watch("monitoringEnabled") ? "Active" : "Inactive"}
              </Badge>
              {form.watch("monitoringEnabled") && (
                <span className="text-xs text-muted-foreground">
                  Every {form.watch("refreshInterval")}s
                </span>
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Jobs Monitored</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.jobsMonitored || 0}</div>
            <p className="text-xs text-muted-foreground">Last 24 hours</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alerts Sent</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.alertsSent || 0}</div>
            <p className="text-xs text-muted-foreground">Last 24 hours</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Auto-Assigned</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.autoAssigned || 0}</div>
            <p className="text-xs text-muted-foreground">Last 24 hours</p>
          </CardContent>
        </Card>
      </div>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="escalation">Escalation</TabsTrigger>
              <TabsTrigger value="assignment">Assignment</TabsTrigger>
              <TabsTrigger value="alerts">Alerts</TabsTrigger>
              <TabsTrigger value="thresholds">Thresholds</TabsTrigger>
            </TabsList>
            
            {/* General Settings */}
            <TabsContent value="general">
              <Card>
                <CardHeader>
                  <CardTitle>General Monitor Settings</CardTitle>
                  <CardDescription>Configure basic monitoring behavior</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField
                    control={form.control}
                    name="monitoringEnabled"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel>Enable Job Monitoring</FormLabel>
                          <FormDescription>
                            Actively monitor jobs for issues and delays
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="switch-monitoring-enabled"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="refreshInterval"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Refresh Interval (seconds)</FormLabel>
                        <div className="flex items-center gap-4">
                          <Slider
                            value={[field.value]}
                            onValueChange={(value) => field.onChange(value[0])}
                            min={10}
                            max={300}
                            step={10}
                            className="flex-1"
                            data-testid="slider-refresh-interval"
                          />
                          <div className="w-20">
                            <Input
                              type="number"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value))}
                              data-testid="input-refresh-interval"
                            />
                          </div>
                        </div>
                        <FormDescription>
                          How often to check for job issues and trigger alerts
                        </FormDescription>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="maxAlertAttempts"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Maximum Alert Attempts</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                            data-testid="input-max-alert-attempts"
                          />
                        </FormControl>
                        <FormDescription>
                          Maximum number of alert attempts before giving up
                        </FormDescription>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="maxNotificationAttempts"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Maximum Notification Attempts</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                            data-testid="input-max-notification-attempts"
                          />
                        </FormControl>
                        <FormDescription>
                          Maximum number of customer notification attempts
                        </FormDescription>
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Escalation Settings */}
            <TabsContent value="escalation">
              <Card>
                <CardHeader>
                  <CardTitle>Escalation Configuration</CardTitle>
                  <CardDescription>Set up escalation times and cooldown periods</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField
                    control={form.control}
                    name="escalationEnabled"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel>Enable Automatic Escalation</FormLabel>
                          <FormDescription>
                            Automatically escalate unassigned jobs
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="switch-escalation-enabled"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <div className="space-y-4">
                    <h4 className="text-sm font-semibold">Escalation Timeline</h4>
                    
                    <FormField
                      control={form.control}
                      name="escalationTimeAdmin"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Admin Alert Time (minutes)</FormLabel>
                          <div className="flex items-center gap-4">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <Slider
                              value={[field.value]}
                              onValueChange={(value) => field.onChange(value[0])}
                              min={1}
                              max={60}
                              step={1}
                              className="flex-1"
                              data-testid="slider-escalation-admin"
                            />
                            <div className="w-20">
                              <Input
                                type="number"
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value))}
                                data-testid="input-escalation-admin"
                              />
                            </div>
                          </div>
                          <FormDescription>
                            Time to wait before alerting admins about unassigned jobs
                          </FormDescription>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="escalationTimeCustomer"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Customer Notice Time (minutes)</FormLabel>
                          <div className="flex items-center gap-4">
                            <Bell className="h-4 w-4 text-muted-foreground" />
                            <Slider
                              value={[field.value]}
                              onValueChange={(value) => field.onChange(value[0])}
                              min={5}
                              max={120}
                              step={5}
                              className="flex-1"
                              data-testid="slider-escalation-customer"
                            />
                            <div className="w-20">
                              <Input
                                type="number"
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value))}
                                data-testid="input-escalation-customer"
                              />
                            </div>
                          </div>
                          <FormDescription>
                            Time to wait before notifying customer about delays
                          </FormDescription>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="escalationTimeAutoAssign"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Auto-Assignment Time (minutes)</FormLabel>
                          <div className="flex items-center gap-4">
                            <Zap className="h-4 w-4 text-muted-foreground" />
                            <Slider
                              value={[field.value]}
                              onValueChange={(value) => field.onChange(value[0])}
                              min={10}
                              max={180}
                              step={10}
                              className="flex-1"
                              data-testid="slider-escalation-auto-assign"
                            />
                            <div className="w-20">
                              <Input
                                type="number"
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value))}
                                data-testid="input-escalation-auto-assign"
                              />
                            </div>
                          </div>
                          <FormDescription>
                            Time to wait before automatically assigning to contractor
                          </FormDescription>
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-4">
                    <h4 className="text-sm font-semibold">Cooldown Periods</h4>
                    
                    <FormField
                      control={form.control}
                      name="adminAlertCooldown"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Admin Alert Cooldown (minutes)</FormLabel>
                          <div className="flex items-center gap-4">
                            <Slider
                              value={[field.value]}
                              onValueChange={(value) => field.onChange(value[0])}
                              min={10}
                              max={240}
                              step={10}
                              className="flex-1"
                              data-testid="slider-admin-cooldown"
                            />
                            <div className="w-20">
                              <Input
                                type="number"
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value))}
                                data-testid="input-admin-cooldown"
                              />
                            </div>
                          </div>
                          <FormDescription>
                            Minimum time between admin alerts for the same job
                          </FormDescription>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="customerNotificationCooldown"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Customer Notification Cooldown (minutes)</FormLabel>
                          <div className="flex items-center gap-4">
                            <Slider
                              value={[field.value]}
                              onValueChange={(value) => field.onChange(value[0])}
                              min={5}
                              max={120}
                              step={5}
                              className="flex-1"
                              data-testid="slider-customer-cooldown"
                            />
                            <div className="w-20">
                              <Input
                                type="number"
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value))}
                                data-testid="input-customer-cooldown"
                              />
                            </div>
                          </div>
                          <FormDescription>
                            Minimum time between customer notifications
                          </FormDescription>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="contractorRejectionCooldown"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Contractor Rejection Cooldown (minutes)</FormLabel>
                          <div className="flex items-center gap-4">
                            <Slider
                              value={[field.value]}
                              onValueChange={(value) => field.onChange(value[0])}
                              min={15}
                              max={480}
                              step={15}
                              className="flex-1"
                              data-testid="slider-rejection-cooldown"
                            />
                            <div className="w-20">
                              <Input
                                type="number"
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value))}
                                data-testid="input-rejection-cooldown"
                              />
                            </div>
                          </div>
                          <FormDescription>
                            Time before re-offering job to contractor who rejected it
                          </FormDescription>
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Assignment Algorithm */}
            <TabsContent value="assignment">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Auto-Assignment Algorithm</CardTitle>
                    <CardDescription>Configure how contractors are selected for auto-assignment</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <FormField
                      control={form.control}
                      name="autoAssignmentAlgorithm"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Assignment Algorithm</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-assignment-algorithm">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="nearest_available">Nearest Available</SelectItem>
                              <SelectItem value="highest_rating">Highest Rating</SelectItem>
                              <SelectItem value="balanced_workload">Balanced Workload</SelectItem>
                              <SelectItem value="fastest_response">Fastest Response Time</SelectItem>
                              <SelectItem value="round_robin">Round Robin</SelectItem>
                              <SelectItem value="smart_match">Smart Match (AI)</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Algorithm used to select contractors for auto-assignment
                          </FormDescription>
                        </FormItem>
                      )}
                    />
                    
                    {form.watch("autoAssignmentAlgorithm") === "smart_match" && (
                      <Alert>
                        <Info className="h-4 w-4" />
                        <AlertTitle>Smart Match Algorithm</AlertTitle>
                        <AlertDescription>
                          Uses machine learning to match contractors based on historical performance,
                          specialization, and success rates for similar jobs.
                        </AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Selection Factors</CardTitle>
                    <CardDescription>
                      Weight the importance of different factors (Total: {totalWeight}%)
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {Object.entries(form.watch("contractorSelectionFactors")).map(([key, value]) => (
                      <FormField
                        key={key}
                        control={form.control}
                        name={`contractorSelectionFactors.${key}` as any}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="capitalize">
                              {key.replace(/([A-Z])/g, ' $1').trim()} ({value}%)
                            </FormLabel>
                            <div className="flex items-center gap-4">
                              <Slider
                                value={[field.value]}
                                onValueChange={(value) => field.onChange(value[0])}
                                min={0}
                                max={100}
                                step={5}
                                className="flex-1"
                                data-testid={`slider-factor-${key}`}
                              />
                              <div className="w-16">
                                <Input
                                  type="number"
                                  {...field}
                                  onChange={(e) => field.onChange(parseInt(e.target.value))}
                                  data-testid={`input-factor-${key}`}
                                />
                              </div>
                            </div>
                          </FormItem>
                        )}
                      />
                    ))}
                    
                    {totalWeight !== 100 && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          Total weight must equal 100%. Current: {totalWeight}%
                        </AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Priority Rules</CardTitle>
                    <CardDescription>Set priority levels for different job types (1-10)</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {Object.entries(form.watch("priorityRules")).map(([key, value]) => (
                      <FormField
                        key={key}
                        control={form.control}
                        name={`priorityRules.${key}` as any}
                        render={({ field }) => (
                          <FormItem>
                            <div className="flex items-center justify-between">
                              <FormLabel className="capitalize flex items-center gap-2">
                                {key === "emergency" && <Zap className="h-4 w-4 text-red-500" />}
                                {key === "fleet" && <Users className="h-4 w-4 text-blue-500" />}
                                {key === "vip" && <Shield className="h-4 w-4 text-purple-500" />}
                                {key} Jobs
                              </FormLabel>
                              <div className="flex items-center gap-2">
                                <Slider
                                  value={[field.value]}
                                  onValueChange={(value) => field.onChange(value[0])}
                                  min={1}
                                  max={10}
                                  step={1}
                                  className="w-32"
                                  data-testid={`slider-priority-${key}`}
                                />
                                <Badge variant={value >= 7 ? "destructive" : value >= 5 ? "default" : "secondary"}>
                                  {value}
                                </Badge>
                              </div>
                            </div>
                          </FormItem>
                        )}
                      />
                    ))}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            {/* Alert Channels */}
            <TabsContent value="alerts">
              <Card>
                <CardHeader>
                  <CardTitle>Alert Channels</CardTitle>
                  <CardDescription>Configure how alerts are delivered</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    {Object.entries(form.watch("alertChannels")).map(([key, value]) => (
                      <FormField
                        key={key}
                        control={form.control}
                        name={`alertChannels.${key}` as any}
                        render={({ field }) => (
                          <FormItem className="flex items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="capitalize">
                                {key === "inApp" ? "In-App" : key.toUpperCase()} Alerts
                              </FormLabel>
                              <FormDescription>
                                {key === "email" && "Send alerts via email to admins and customers"}
                                {key === "sms" && "Send SMS text messages for urgent alerts"}
                                {key === "push" && "Send mobile push notifications"}
                                {key === "inApp" && "Show alerts in the application dashboard"}
                                {key === "webhook" && "Send alerts to external webhook endpoints"}
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                data-testid={`switch-alert-${key}`}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    ))}
                  </div>
                  
                  {form.watch("alertChannels.webhook") && (
                    <Card className="bg-muted/50">
                      <CardContent className="pt-6">
                        <Label>Webhook URL</Label>
                        <Input 
                          placeholder="https://api.example.com/webhooks/job-alerts"
                          className="mt-2"
                          data-testid="input-webhook-url"
                        />
                        <p className="text-sm text-muted-foreground mt-2">
                          Configure the endpoint to receive real-time job alerts
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Monitoring Thresholds */}
            <TabsContent value="thresholds">
              <Card>
                <CardHeader>
                  <CardTitle>Monitoring Thresholds</CardTitle>
                  <CardDescription>Set warning and critical thresholds for job monitoring</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h4 className="text-sm font-semibold flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Job Age Thresholds
                      </h4>
                      
                      <FormField
                        control={form.control}
                        name="monitoringThresholds.jobAgeWarning"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Warning (minutes)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value))}
                                data-testid="input-job-age-warning"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="monitoringThresholds.jobAgeCritical"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Critical (minutes)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value))}
                                data-testid="input-job-age-critical"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="space-y-4">
                      <h4 className="text-sm font-semibold flex items-center gap-2">
                        <Timer className="h-4 w-4" />
                        Response Time Thresholds
                      </h4>
                      
                      <FormField
                        control={form.control}
                        name="monitoringThresholds.responseTimeWarning"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Warning (minutes)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value))}
                                data-testid="input-response-time-warning"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="monitoringThresholds.responseTimeCritical"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Critical (minutes)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value))}
                                data-testid="input-response-time-critical"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-4">
                    <h4 className="text-sm font-semibold flex items-center gap-2">
                      <Activity className="h-4 w-4" />
                      Pending Jobs Thresholds
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="monitoringThresholds.pendingJobsWarning"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Warning (count)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value))}
                                data-testid="input-pending-jobs-warning"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="monitoringThresholds.pendingJobsCritical"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Critical (count)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value))}
                                data-testid="input-pending-jobs-critical"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                  
                  <Alert>
                    <Gauge className="h-4 w-4" />
                    <AlertTitle>Threshold Guidelines</AlertTitle>
                    <AlertDescription>
                      Warning thresholds trigger notifications to admins.
                      Critical thresholds trigger escalation and auto-assignment procedures.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
          
          <div className="flex justify-between mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={handleTestConfiguration}
              disabled={testMode || testConfigMutation.isPending}
              data-testid="button-test-config"
            >
              {testMode || testConfigMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Testing...
                </>
              ) : (
                <>
                  <Activity className="mr-2 h-4 w-4" />
                  Test Configuration
                </>
              )}
            </Button>
            
            <Button
              type="submit"
              size="lg"
              disabled={updateConfigMutation.isPending || totalWeight !== 100}
              data-testid="button-save-job-monitor"
            >
              {updateConfigMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Configuration
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </AdminLayout>
  );
}