import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  Mail,
  CheckCircle2,
  XCircle,
  Send,
  AlertCircle,
  Loader2,
  WifiOff,
  Wifi,
  RefreshCw,
  User,
  Truck,
  FileText,
  Key,
  Bell,
  Clock,
  DollarSign,
  UserPlus,
  AlertTriangle,
  Activity,
  Gavel,
  MessageSquare
} from "lucide-react";

interface EmailStatus {
  connected: boolean;
  verified: boolean;
  failures: number;
  successes: number;
  successRate: number;
  queueSize: number;
  lastError: string | null;
  queuedFailures: any[];
  emailAccount: string;
}

interface WorkflowTest {
  id: string;
  name: string;
  description: string;
  icon: any;
  color: string;
  fields: {
    name: string;
    label: string;
    type: string;
    required: boolean;
    defaultValue?: string;
    placeholder?: string;
  }[];
}

const workflowTests: WorkflowTest[] = [
  {
    id: "job-assignment-contractor",
    name: "Job Assignment - Contractor",
    description: "Test contractor notification when assigned to a job",
    icon: User,
    color: "blue",
    fields: [
      { name: "recipientEmail", label: "Recipient Email", type: "email", required: true, placeholder: "contractor@example.com" },
      { name: "contractorName", label: "Contractor Name", type: "text", required: false, defaultValue: "John Doe" },
      { name: "jobNumber", label: "Job Number", type: "text", required: false, defaultValue: "" },
      { name: "customerName", label: "Customer Name", type: "text", required: false, defaultValue: "Jane Smith" },
      { name: "address", label: "Job Address", type: "text", required: false, defaultValue: "123 Test Street, Detroit, MI 48201" },
      { name: "serviceType", label: "Service Type", type: "text", required: false, defaultValue: "Tire Service" },
      { name: "issueDescription", label: "Issue Description", type: "text", required: false, defaultValue: "Tire replacement needed" }
    ]
  },
  {
    id: "job-assignment-customer",
    name: "Job Assignment - Customer",
    description: "Test customer notification when contractor is assigned",
    icon: Truck,
    color: "green",
    fields: [
      { name: "recipientEmail", label: "Recipient Email", type: "email", required: true, placeholder: "customer@example.com" },
      { name: "customerName", label: "Customer Name", type: "text", required: false, defaultValue: "Jane Smith" },
      { name: "contractorName", label: "Contractor Name", type: "text", required: false, defaultValue: "John Doe" },
      { name: "contractorRating", label: "Contractor Rating", type: "number", required: false, defaultValue: "4.8" },
      { name: "eta", label: "ETA", type: "text", required: false, defaultValue: "30 minutes" }
    ]
  },
  {
    id: "job-completion",
    name: "Job Completion",
    description: "Test service completion notification",
    icon: CheckCircle2,
    color: "emerald",
    fields: [
      { name: "recipientEmail", label: "Recipient Email", type: "email", required: true, placeholder: "customer@example.com" },
      { name: "customerName", label: "Customer Name", type: "text", required: false, defaultValue: "Jane Smith" },
      { name: "jobNumber", label: "Job Number", type: "text", required: false, defaultValue: "" },
      { name: "serviceType", label: "Service Type", type: "text", required: false, defaultValue: "Tire Service" },
      { name: "totalAmount", label: "Total Amount", type: "number", required: false, defaultValue: "250.00" },
      { name: "technicianName", label: "Technician Name", type: "text", required: false, defaultValue: "John Doe" },
      { name: "resolutionNotes", label: "Resolution Notes", type: "text", required: false, defaultValue: "Replaced front tires, balanced and aligned" }
    ]
  },
  {
    id: "invoice",
    name: "Invoice Sent",
    description: "Test invoice email with PDF attachment",
    icon: FileText,
    color: "purple",
    fields: [
      { name: "recipientEmail", label: "Recipient Email", type: "email", required: true, placeholder: "customer@example.com" },
      { name: "customerFirstName", label: "Customer First Name", type: "text", required: false, defaultValue: "Jane" },
      { name: "customerLastName", label: "Customer Last Name", type: "text", required: false, defaultValue: "Smith" },
      { name: "amountDue", label: "Amount Due", type: "number", required: false, defaultValue: "250.00" }
    ]
  },
  {
    id: "password-reset",
    name: "Password Reset",
    description: "Test password reset link email",
    icon: Key,
    color: "yellow",
    fields: [
      { name: "recipientEmail", label: "Recipient Email", type: "email", required: true, placeholder: "user@example.com" },
      { name: "userName", label: "User Name", type: "text", required: false, defaultValue: "Test User" },
      { name: "expiresIn", label: "Link Expires In", type: "text", required: false, defaultValue: "1 hour" }
    ]
  },
  {
    id: "emergency-sos",
    name: "Emergency SOS",
    description: "Test emergency alert notifications",
    icon: AlertTriangle,
    color: "red",
    fields: [
      { name: "recipientEmail", label: "Recipient Email", type: "email", required: true, placeholder: "emergency@example.com" },
      { name: "driverName", label: "Driver Name", type: "text", required: false, defaultValue: "John Smith" },
      { name: "vehicleInfo", label: "Vehicle Info", type: "text", required: false, defaultValue: "2020 Peterbilt 579" },
      { name: "location", label: "Location", type: "text", required: false, defaultValue: "I-75 Northbound, Mile Marker 45" },
      { name: "emergencyType", label: "Emergency Type", type: "text", required: false, defaultValue: "Vehicle Breakdown" },
      { name: "description", label: "Description", type: "text", required: false, defaultValue: "Engine failure, vehicle disabled" },
      { name: "contactNumber", label: "Contact Number", type: "text", required: false, defaultValue: "(313) 555-0911" }
    ]
  },
  {
    id: "service-reminder",
    name: "Service Reminders",
    description: "Test 24hr/12hr/1hr service reminders",
    icon: Clock,
    color: "orange",
    fields: [
      { name: "recipientEmail", label: "Recipient Email", type: "email", required: true, placeholder: "customer@example.com" },
      { name: "customerName", label: "Customer Name", type: "text", required: false, defaultValue: "Customer" },
      { name: "serviceType", label: "Service Type", type: "text", required: false, defaultValue: "Preventive Maintenance" },
      { name: "scheduledDate", label: "Scheduled Date", type: "text", required: false, defaultValue: "" },
      { name: "scheduledTime", label: "Scheduled Time", type: "text", required: false, defaultValue: "10:00 AM" },
      { name: "location", label: "Location", type: "text", required: false, defaultValue: "123 Test Street, Detroit, MI 48201" }
    ]
  },
  {
    id: "payment-due",
    name: "Payment Due",
    description: "Test payment reminder emails",
    icon: DollarSign,
    color: "pink",
    fields: [
      { name: "recipientEmail", label: "Recipient Email", type: "email", required: true, placeholder: "customer@example.com" },
      { name: "customerName", label: "Customer Name", type: "text", required: false, defaultValue: "Customer" },
      { name: "invoiceNumber", label: "Invoice Number", type: "text", required: false, defaultValue: "" },
      { name: "amountDue", label: "Amount Due", type: "text", required: false, defaultValue: "250.00" },
      { name: "dueDate", label: "Due Date", type: "text", required: false, defaultValue: "" }
    ]
  },
  {
    id: "welcome-contractor",
    name: "Welcome Contractor",
    description: "Test contractor onboarding email",
    icon: UserPlus,
    color: "indigo",
    fields: [
      { name: "recipientEmail", label: "Recipient Email", type: "email", required: true, placeholder: "contractor@example.com" },
      { name: "contractorName", label: "Contractor Name", type: "text", required: false, defaultValue: "John Doe" },
      { name: "temporaryPassword", label: "Temporary Password", type: "text", required: false, defaultValue: "TEST-PASSWORD-123" }
    ]
  },
  {
    id: "admin-unassigned",
    name: "Admin Alerts",
    description: "Test unassigned job notifications to admins",
    icon: AlertCircle,
    color: "slate",
    fields: [
      { name: "recipientEmail", label: "Recipient Email", type: "email", required: true, placeholder: "admin@example.com" },
      { name: "jobNumber", label: "Job Number", type: "text", required: false, defaultValue: "" },
      { name: "minutesWaiting", label: "Minutes Waiting", type: "number", required: false, defaultValue: "15" },
      { name: "customerName", label: "Customer Name", type: "text", required: false, defaultValue: "Jane Smith" },
      { name: "address", label: "Address", type: "text", required: false, defaultValue: "123 Test Street, Detroit, MI 48201" },
      { name: "issueDescription", label: "Issue Description", type: "text", required: false, defaultValue: "Urgent repair needed" }
    ]
  },
  {
    id: "job-status",
    name: "Job Status Updates",
    description: "Test status change notifications",
    icon: Activity,
    color: "cyan",
    fields: [
      { name: "recipientEmail", label: "Recipient Email", type: "email", required: true, placeholder: "customer@example.com" },
      { name: "customerName", label: "Customer Name", type: "text", required: false, defaultValue: "Customer" },
      { name: "jobNumber", label: "Job Number", type: "text", required: false, defaultValue: "" },
      { name: "previousStatus", label: "Previous Status", type: "text", required: false, defaultValue: "assigned" },
      { name: "newStatus", label: "New Status", type: "text", required: false, defaultValue: "in_progress" },
      { name: "updatedBy", label: "Updated By", type: "text", required: false, defaultValue: "John Doe (Contractor)" },
      { name: "notes", label: "Status Notes", type: "text", required: false, defaultValue: "Contractor has arrived and started working" }
    ]
  },
  {
    id: "bidding",
    name: "Bidding Notifications",
    description: "Test bid received/accepted/rejected emails",
    icon: Gavel,
    color: "teal",
    fields: [
      { name: "recipientEmail", label: "Recipient Email", type: "email", required: true, placeholder: "contractor@example.com" },
      { name: "contractorName", label: "Contractor Name", type: "text", required: false, defaultValue: "Contractor" },
      { name: "bidType", label: "Bid Type (received/accepted/declined)", type: "text", required: false, defaultValue: "received" },
      { name: "jobNumber", label: "Job Number", type: "text", required: false, defaultValue: "" },
      { name: "serviceType", label: "Service Type", type: "text", required: false, defaultValue: "Emergency Repair" },
      { name: "location", label: "Location", type: "text", required: false, defaultValue: "123 Test Street, Detroit, MI 48201" },
      { name: "customerName", label: "Customer Name", type: "text", required: false, defaultValue: "Jane Smith" },
      { name: "bidAmount", label: "Bid Amount", type: "number", required: false, defaultValue: "350.00" }
    ]
  }
];

export default function EmailTestPage() {
  const { toast } = useToast();
  const [selectedWorkflow, setSelectedWorkflow] = useState<string>("");
  const [basicTestEmail, setBasicTestEmail] = useState("");
  const [workflowData, setWorkflowData] = useState<Record<string, any>>({});
  const [customEmail, setCustomEmail] = useState({
    recipientEmail: "",
    subject: "Custom Email Test",
    message: "This is a test custom email from TruckFixGo Email Testing Dashboard."
  });

  // Query email service status
  const { data: status, refetch: refetchStatus, isLoading: statusLoading } = useQuery<EmailStatus>({
    queryKey: ['/api/admin/email-test/status'],
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  // Mutation for basic test
  const basicTestMutation = useMutation({
    mutationFn: async (to: string) => {
      return apiRequest('/api/admin/email-test/send-test', {
        method: 'POST',
        body: JSON.stringify({ to })
      });
    },
    onSuccess: (data) => {
      toast({
        title: "Test Email Sent",
        description: data.message || "Basic test email sent successfully",
      });
      refetchStatus();
    },
    onError: (error: any) => {
      toast({
        title: "Test Failed",
        description: error.message || "Failed to send test email",
        variant: "destructive"
      });
    }
  });

  // Mutation for workflow tests
  const workflowTestMutation = useMutation({
    mutationFn: async ({ workflowType, data }: { workflowType: string; data: any }) => {
      return apiRequest(`/api/admin/email-test/workflow/${workflowType}`, {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },
    onSuccess: (data, variables) => {
      toast({
        title: "Workflow Test Sent",
        description: `${variables.workflowType} email sent successfully`,
      });
      refetchStatus();
    },
    onError: (error: any) => {
      toast({
        title: "Workflow Test Failed",
        description: error.message || "Failed to send workflow test email",
        variant: "destructive"
      });
    }
  });

  // Mutation for custom email
  const customEmailMutation = useMutation({
    mutationFn: async (data: typeof customEmail) => {
      return apiRequest('/api/admin/email-test/workflow/custom', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      toast({
        title: "Custom Email Sent",
        description: "Custom test email sent successfully",
      });
      refetchStatus();
      setCustomEmail({
        recipientEmail: "",
        subject: "Custom Email Test",
        message: "This is a test custom email from TruckFixGo Email Testing Dashboard."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Custom Email Failed",
        description: error.message || "Failed to send custom email",
        variant: "destructive"
      });
    }
  });

  const handleWorkflowTest = (workflowId: string) => {
    const workflow = workflowTests.find(w => w.id === workflowId);
    if (!workflow) return;

    const data = workflowData[workflowId] || {};
    
    // Check for required fields
    const missingRequired = workflow.fields
      .filter(f => f.required && !data[f.name])
      .map(f => f.label);
    
    if (missingRequired.length > 0) {
      toast({
        title: "Missing Required Fields",
        description: `Please fill in: ${missingRequired.join(', ')}`,
        variant: "destructive"
      });
      return;
    }

    workflowTestMutation.mutate({ workflowType: workflowId, data });
  };

  const updateWorkflowField = (workflowId: string, fieldName: string, value: any) => {
    setWorkflowData(prev => ({
      ...prev,
      [workflowId]: {
        ...prev[workflowId],
        [fieldName]: value
      }
    }));
  };

  if (statusLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Email Testing Dashboard</h1>
        <p className="text-muted-foreground">Test all email workflows and verify email service connectivity</p>
      </div>

      {/* Connection Status Card */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle>Connection Status</CardTitle>
              {status?.connected ? (
                <Badge variant="default" className="gap-1">
                  <Wifi className="h-3 w-3" />
                  Connected
                </Badge>
              ) : (
                <Badge variant="destructive" className="gap-1">
                  <WifiOff className="h-3 w-3" />
                  Disconnected
                </Badge>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetchStatus()}
              disabled={statusLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-1 ${statusLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
          <CardDescription>Current email service status and statistics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Email Account</p>
              <p className="text-sm font-medium">{status?.emailAccount || 'Not configured'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Success Rate</p>
              <p className="text-sm font-medium">{status?.successRate?.toFixed(1) || 0}%</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Sent/Failed</p>
              <p className="text-sm font-medium">{status?.successes || 0} / {status?.failures || 0}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Queue Size</p>
              <p className="text-sm font-medium">{status?.queueSize || 0}</p>
            </div>
          </div>
          
          {status?.lastError && (
            <Alert className="mt-4" variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Last Error:</strong> {status.lastError}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Basic Test Section */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Basic Email Test
          </CardTitle>
          <CardDescription>Send a simple test email to verify connectivity</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              type="email"
              placeholder="Enter recipient email"
              value={basicTestEmail}
              onChange={(e) => setBasicTestEmail(e.target.value)}
              className="flex-1"
              data-testid="input-basic-test-email"
            />
            <Button
              onClick={() => basicTestEmail && basicTestMutation.mutate(basicTestEmail)}
              disabled={!basicTestEmail || basicTestMutation.isPending}
              data-testid="button-send-basic-test"
            >
              {basicTestMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send Test
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Workflow Tests */}
      <Tabs defaultValue="workflows" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="workflows">Workflow Tests</TabsTrigger>
          <TabsTrigger value="custom">Custom Email</TabsTrigger>
        </TabsList>

        <TabsContent value="workflows" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {workflowTests.map((workflow) => {
              const Icon = workflow.icon;
              const isLoading = workflowTestMutation.isPending && selectedWorkflow === workflow.id;
              
              return (
                <Card key={workflow.id} className="overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`p-2 rounded-lg bg-${workflow.color}-100 dark:bg-${workflow.color}-900/20`}>
                          <Icon className={`h-4 w-4 text-${workflow.color}-600 dark:text-${workflow.color}-400`} />
                        </div>
                        <div>
                          <CardTitle className="text-base">{workflow.name}</CardTitle>
                          <CardDescription className="text-xs mt-0.5">
                            {workflow.description}
                          </CardDescription>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {workflow.fields.map((field) => (
                      <div key={field.name} className="space-y-1">
                        <Label className="text-xs">
                          {field.label}
                          {field.required && <span className="text-destructive ml-1">*</span>}
                        </Label>
                        <Input
                          type={field.type}
                          placeholder={field.placeholder || field.defaultValue}
                          value={workflowData[workflow.id]?.[field.name] || ''}
                          onChange={(e) => updateWorkflowField(workflow.id, field.name, e.target.value)}
                          className="h-8 text-sm"
                          data-testid={`input-${workflow.id}-${field.name}`}
                        />
                      </div>
                    ))}
                    <Button
                      className="w-full"
                      size="sm"
                      onClick={() => {
                        setSelectedWorkflow(workflow.id);
                        handleWorkflowTest(workflow.id);
                      }}
                      disabled={isLoading}
                      data-testid={`button-test-${workflow.id}`}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-2" />
                          Send Test
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="custom" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Custom Email Test
              </CardTitle>
              <CardDescription>Send a custom test email with your own content</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Recipient Email *</Label>
                <Input
                  type="email"
                  placeholder="recipient@example.com"
                  value={customEmail.recipientEmail}
                  onChange={(e) => setCustomEmail(prev => ({ ...prev, recipientEmail: e.target.value }))}
                  data-testid="input-custom-email"
                />
              </div>
              <div className="space-y-2">
                <Label>Subject</Label>
                <Input
                  type="text"
                  placeholder="Email subject"
                  value={customEmail.subject}
                  onChange={(e) => setCustomEmail(prev => ({ ...prev, subject: e.target.value }))}
                  data-testid="input-custom-subject"
                />
              </div>
              <div className="space-y-2">
                <Label>Message</Label>
                <Textarea
                  placeholder="Email message content"
                  value={customEmail.message}
                  onChange={(e) => setCustomEmail(prev => ({ ...prev, message: e.target.value }))}
                  rows={6}
                  data-testid="textarea-custom-message"
                />
              </div>
              <Button
                className="w-full"
                onClick={() => customEmail.recipientEmail && customEmailMutation.mutate(customEmail)}
                disabled={!customEmail.recipientEmail || customEmailMutation.isPending}
                data-testid="button-send-custom"
              >
                {customEmailMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sending Custom Email...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Send Custom Email
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Recent Failures */}
      {status?.queuedFailures && status.queuedFailures.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-destructive" />
              Recent Failed Emails
            </CardTitle>
            <CardDescription>Last {status.queuedFailures.length} failed email attempts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {status.queuedFailures.map((failure, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-muted rounded-lg">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{failure.subject}</p>
                    <p className="text-xs text-muted-foreground">To: {failure.to}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(failure.timestamp).toLocaleString()}
                    </p>
                  </div>
                  {failure.error && (
                    <Badge variant="destructive" className="text-xs">
                      {failure.error}
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}