import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  TestTube, 
  Users, 
  Truck, 
  UserPlus, 
  BriefcaseBusiness, 
  Trash2, 
  RefreshCw,
  Mail,
  Database,
  AlertTriangle,
  CheckCircle,
  Clock,
  MapPin,
  Phone,
  Calendar,
  Eye,
  Copy,
  Download
} from "lucide-react";
import { format } from "date-fns";

interface TestStats {
  contractors: number;
  jobs: number;
  drivers: number;
  fleets: number;
  users: number;
  emails: number;
}

interface TestEmail {
  id: string;
  to: string;
  subject: string;
  html?: string;
  text?: string;
  timestamp: string;
  status: 'sent' | 'failed' | 'queued';
  error?: string;
}

export default function TestToolsPage() {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState<TestEmail | null>(null);

  // Check if test mode is enabled
  const { data: testModeStatus } = useQuery({
    queryKey: ['/api/test-mode'],
    queryFn: async () => {
      const response = await fetch('/api/test-mode', {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error(`Failed to check test mode status: ${response.statusText}`);
      }
      return response.json();
    }
  });

  // Get current stats
  const { data: stats, refetch: refetchStats } = useQuery<TestStats>({
    queryKey: ['/api/admin/test-tools/stats'],
  });

  // Get test emails
  const { data: emails, refetch: refetchEmails } = useQuery<TestEmail[]>({
    queryKey: ['/api/admin/test-tools/emails'],
    initialData: []
  });

  // Generate test contractors mutation
  const generateContractorsMutation = useMutation({
    mutationFn: async (count: number) => 
      apiRequest("POST", "/api/admin/test-tools/generate-contractors", { count }),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Test contractors generated successfully"
      });
      refetchStats();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to generate test contractors",
        variant: "destructive"
      });
    }
  });

  // Generate test jobs mutation
  const generateJobsMutation = useMutation({
    mutationFn: async (count: number) => 
      apiRequest("POST", "/api/admin/test-tools/generate-jobs", { count }),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Test jobs generated successfully"
      });
      refetchStats();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to generate test jobs",
        variant: "destructive"
      });
    }
  });

  // Generate test drivers mutation
  const generateDriversMutation = useMutation({
    mutationFn: async (count: number) => 
      apiRequest("POST", "/api/admin/test-tools/generate-drivers", { count }),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Test drivers generated successfully"
      });
      refetchStats();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to generate test drivers",
        variant: "destructive"
      });
    }
  });

  // Clear test data mutation
  const clearDataMutation = useMutation({
    mutationFn: async () => 
      apiRequest("POST", "/api/admin/test-tools/clear-data"),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Test data cleared successfully"
      });
      refetchStats();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to clear test data",
        variant: "destructive"
      });
    }
  });

  // Reset database mutation
  const resetDatabaseMutation = useMutation({
    mutationFn: async () => 
      apiRequest("POST", "/api/admin/test-tools/reset-database"),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Database reset successfully"
      });
      refetchStats();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to reset database",
        variant: "destructive"
      });
    }
  });

  // Clear emails mutation
  const clearEmailsMutation = useMutation({
    mutationFn: async () => 
      apiRequest("POST", "/api/admin/test-tools/clear-emails"),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Email logs cleared"
      });
      refetchEmails();
    }
  });

  const handleGenerateAll = async () => {
    setIsGenerating(true);
    try {
      await generateContractorsMutation.mutateAsync(5);
      await generateDriversMutation.mutateAsync(5);
      await generateJobsMutation.mutateAsync(10);
      toast({
        title: "Success",
        description: "All test data generated successfully"
      });
    } catch (error) {
      console.error("Error generating test data:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const copyEmailContent = (email: TestEmail) => {
    const content = email.html || email.text || '';
    navigator.clipboard.writeText(content);
    toast({
      title: "Copied",
      description: "Email content copied to clipboard"
    });
  };

  if (!testModeStatus?.testMode) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Test tools are only available when TEST_MODE is enabled.
            Set TEST_MODE=true in your environment variables.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <TestTube className="h-8 w-8 text-orange-500" />
            Test Tools
          </h1>
          <p className="text-muted-foreground mt-1">
            Generate test data and manage testing features
          </p>
        </div>
        <Badge variant="outline" className="text-orange-600 border-orange-300">
          TEST MODE ACTIVE
        </Badge>
      </div>

      {/* Current Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Current Database Statistics</CardTitle>
          <CardDescription>Overview of test data in the system</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{stats?.contractors || 0}</div>
              <div className="text-sm text-muted-foreground">Contractors</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{stats?.jobs || 0}</div>
              <div className="text-sm text-muted-foreground">Jobs</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{stats?.drivers || 0}</div>
              <div className="text-sm text-muted-foreground">Drivers</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{stats?.fleets || 0}</div>
              <div className="text-sm text-muted-foreground">Fleets</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{stats?.users || 0}</div>
              <div className="text-sm text-muted-foreground">Total Users</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{stats?.emails || 0}</div>
              <div className="text-sm text-muted-foreground">Test Emails</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="generate" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="generate">Generate Data</TabsTrigger>
          <TabsTrigger value="emails">Email Preview</TabsTrigger>
          <TabsTrigger value="manage">Manage Data</TabsTrigger>
        </TabsList>

        {/* Generate Data Tab */}
        <TabsContent value="generate" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Quick Generate</CardTitle>
              <CardDescription>Generate all test data with one click</CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={handleGenerateAll}
                disabled={isGenerating}
                className="w-full"
                size="lg"
                data-testid="button-generate-all"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <TestTube className="w-4 h-4 mr-2" />
                    Generate All Test Data (5 Contractors, 5 Drivers, 10 Jobs)
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Test Contractors</CardTitle>
                <CardDescription>Generate contractors with varied skills</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  onClick={() => generateContractorsMutation.mutate(5)}
                  disabled={generateContractorsMutation.isPending}
                  className="w-full"
                  variant="outline"
                  data-testid="button-generate-contractors"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Generate 5 Contractors
                </Button>
                <p className="text-xs text-muted-foreground">
                  Creates contractors with different service areas, skills (tire, engine, electrical), 
                  and availability status
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Test Jobs</CardTitle>
                <CardDescription>Generate jobs with various statuses</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  onClick={() => generateJobsMutation.mutate(10)}
                  disabled={generateJobsMutation.isPending}
                  className="w-full"
                  variant="outline"
                  data-testid="button-generate-jobs"
                >
                  <BriefcaseBusiness className="w-4 h-4 mr-2" />
                  Generate 10 Jobs
                </Button>
                <p className="text-xs text-muted-foreground">
                  Creates jobs across Detroit metro with different service types, 
                  urgency levels, and statuses
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Test Drivers</CardTitle>
                <CardDescription>Generate driver accounts</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  onClick={() => generateDriversMutation.mutate(5)}
                  disabled={generateDriversMutation.isPending}
                  className="w-full"
                  variant="outline"
                  data-testid="button-generate-drivers"
                >
                  <Truck className="w-4 h-4 mr-2" />
                  Generate 5 Drivers
                </Button>
                <p className="text-xs text-muted-foreground">
                  Creates driver accounts with various vehicle types 
                  and locations
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Email Preview Tab */}
        <TabsContent value="emails" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Email Preview</CardTitle>
                <CardDescription>
                  View test emails that would be sent ({emails?.length || 0} total)
                </CardDescription>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => clearEmailsMutation.mutate()}
                disabled={clearEmailsMutation.isPending}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Clear Logs
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <ScrollArea className="h-[400px] border rounded-lg p-4">
                  <div className="space-y-2">
                    {emails?.map((email) => (
                      <div 
                        key={email.id}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          selectedEmail?.id === email.id ? 'bg-muted' : 'hover:bg-muted/50'
                        }`}
                        onClick={() => setSelectedEmail(email)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="space-y-1 flex-1">
                            <div className="flex items-center gap-2">
                              <Mail className="w-3 h-3" />
                              <span className="text-sm font-medium truncate">
                                {email.to}
                              </span>
                            </div>
                            <p className="text-sm font-medium">{email.subject}</p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Clock className="w-3 h-3" />
                              {format(new Date(email.timestamp), "MMM d, h:mm a")}
                            </div>
                          </div>
                          <Badge 
                            variant={email.status === 'sent' ? 'default' : email.status === 'failed' ? 'destructive' : 'secondary'}
                            className="text-xs"
                          >
                            {email.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                    {(!emails || emails.length === 0) && (
                      <div className="text-center py-8 text-muted-foreground">
                        No test emails yet. Emails will appear here when sent in test mode.
                      </div>
                    )}
                  </div>
                </ScrollArea>

                <div className="border rounded-lg p-4">
                  {selectedEmail ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold">Email Preview</h4>
                        <div className="flex gap-2">
                          <Button 
                            size="icon" 
                            variant="ghost"
                            onClick={() => copyEmailContent(selectedEmail)}
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <Separator />
                      <div className="space-y-2">
                        <div>
                          <span className="text-sm font-medium">To:</span>
                          <p className="text-sm text-muted-foreground">{selectedEmail.to}</p>
                        </div>
                        <div>
                          <span className="text-sm font-medium">Subject:</span>
                          <p className="text-sm text-muted-foreground">{selectedEmail.subject}</p>
                        </div>
                        <div>
                          <span className="text-sm font-medium">Sent:</span>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(selectedEmail.timestamp), "PPpp")}
                          </p>
                        </div>
                      </div>
                      <Separator />
                      <ScrollArea className="h-[200px]">
                        {selectedEmail.html ? (
                          <div 
                            className="text-sm"
                            dangerouslySetInnerHTML={{ __html: selectedEmail.html }}
                          />
                        ) : (
                          <pre className="text-sm whitespace-pre-wrap">
                            {selectedEmail.text}
                          </pre>
                        )}
                      </ScrollArea>
                      {selectedEmail.error && (
                        <Alert variant="destructive">
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription>{selectedEmail.error}</AlertDescription>
                        </Alert>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      <div className="text-center">
                        <Mail className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>Select an email to preview</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Manage Data Tab */}
        <TabsContent value="manage" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Data Management</CardTitle>
              <CardDescription>Clear or reset test data</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  These actions will modify or delete data. Use with caution!
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Button 
                  variant="destructive"
                  className="w-full"
                  onClick={() => {
                    if (confirm("Are you sure you want to clear all test data? This will delete all users, jobs, and related records marked as test data.")) {
                      clearDataMutation.mutate();
                    }
                  }}
                  disabled={clearDataMutation.isPending}
                  data-testid="button-clear-data"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Clear All Test Data
                </Button>
                <p className="text-xs text-muted-foreground">
                  Removes all data created with test email domains (@example.com)
                </p>
              </div>

              <Separator />

              <div className="space-y-2">
                <Button 
                  variant="destructive"
                  className="w-full"
                  onClick={() => {
                    if (confirm("Are you sure you want to reset the database? This will clear ALL data and reset to a clean state.")) {
                      if (confirm("This action cannot be undone. Are you absolutely sure?")) {
                        resetDatabaseMutation.mutate();
                      }
                    }
                  }}
                  disabled={resetDatabaseMutation.isPending}
                  data-testid="button-reset-database"
                >
                  <Database className="w-4 h-4 mr-2" />
                  Reset Database to Clean State
                </Button>
                <p className="text-xs text-muted-foreground">
                  Completely resets the database, removing ALL data
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}