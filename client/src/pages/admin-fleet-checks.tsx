import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { 
  Search,
  Filter,
  CreditCard, 
  DollarSign,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Ban,
  Download,
  RefreshCw,
  Shield,
  Activity,
  TrendingUp,
  TrendingDown,
  Truck
} from "lucide-react";
import { format } from "date-fns";

interface FleetCheck {
  id: string;
  provider: "efs" | "comdata";
  checkNumber: string;
  maskedCheckNumber: string;
  authorizationCode?: string;
  driverCode?: string;
  authorizedAmount: string;
  capturedAmount?: string;
  availableBalance?: string;
  status: "pending" | "authorized" | "partially_captured" | "captured" | "voided" | "declined" | "expired";
  jobId?: string;
  userId?: string;
  fleetAccountId?: string;
  ipAddress?: string;
  userAgent?: string;
  failureReason?: string;
  authorizationResponse?: any;
  captureResponse?: any;
  expiresAt?: string;
  createdAt: string;
  validatedAt?: string;
  capturedAt?: string;
  voidedAt?: string;
}

export default function AdminFleetChecks() {
  const { toast } = useToast();
  const [selectedCheck, setSelectedCheck] = useState<FleetCheck | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showVoidDialog, setShowVoidDialog] = useState(false);
  const [filters, setFilters] = useState({
    provider: "",
    status: "",
    checkNumber: "",
    jobId: "",
    fromDate: "",
    toDate: ""
  });

  // Fetch fleet checks
  const { data: checksData, isLoading, refetch } = useQuery({
    queryKey: ["/api/admin/fleet-checks", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
      return apiRequest(`/api/admin/fleet-checks?${params.toString()}`);
    }
  });

  // Void check mutation
  const voidCheckMutation = useMutation({
    mutationFn: async (checkId: string) => {
      return apiRequest(`/api/payments/checks/${checkId}/void`, {
        method: "POST"
      });
    },
    onSuccess: () => {
      toast({
        title: "Check Voided",
        description: "The check authorization has been successfully voided"
      });
      setShowVoidDialog(false);
      setSelectedCheck(null);
      refetch();
    },
    onError: (error: any) => {
      toast({
        title: "Void Failed",
        description: error.message || "Failed to void the check",
        variant: "destructive"
      });
    }
  });

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { variant: any; icon: any }> = {
      pending: { variant: "secondary", icon: Clock },
      authorized: { variant: "default", icon: Shield },
      partially_captured: { variant: "default", icon: Activity },
      captured: { variant: "default", icon: CheckCircle },
      voided: { variant: "secondary", icon: Ban },
      declined: { variant: "destructive", icon: XCircle },
      expired: { variant: "secondary", icon: Clock }
    };

    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="w-3 h-3" />
        {status.replace("_", " ").toUpperCase()}
      </Badge>
    );
  };

  const formatCurrency = (amount: string | number) => {
    const num = typeof amount === "string" ? parseFloat(amount) : amount;
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD"
    }).format(num);
  };

  // Calculate summary statistics
  const stats = {
    totalChecks: checksData?.checks?.length || 0,
    authorizedAmount: checksData?.checks?.reduce((sum: number, check: FleetCheck) => 
      sum + parseFloat(check.authorizedAmount || "0"), 0) || 0,
    capturedAmount: checksData?.checks?.reduce((sum: number, check: FleetCheck) => 
      sum + parseFloat(check.capturedAmount || "0"), 0) || 0,
    failedChecks: checksData?.checks?.filter((check: FleetCheck) => 
      check.status === "declined").length || 0
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Fleet Check Management</h1>
        <p className="text-muted-foreground mt-2">
          Monitor and manage EFS and Comdata check transactions
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Checks</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalChecks}</div>
            <p className="text-xs text-muted-foreground">
              All time transactions
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Authorized</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.authorizedAmount)}</div>
            <p className="text-xs text-muted-foreground">
              Total authorized amount
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Captured</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.capturedAmount)}</div>
            <p className="text-xs text-muted-foreground">
              Successfully captured
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.failedChecks}</div>
            <p className="text-xs text-muted-foreground">
              Declined transactions
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-6">
            <div>
              <Label htmlFor="provider">Provider</Label>
              <Select
                value={filters.provider}
                onValueChange={(value) => setFilters({...filters, provider: value})}
              >
                <SelectTrigger id="provider" data-testid="select-provider">
                  <SelectValue placeholder="All Providers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Providers</SelectItem>
                  <SelectItem value="efs">EFS</SelectItem>
                  <SelectItem value="comdata">Comdata</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select
                value={filters.status}
                onValueChange={(value) => setFilters({...filters, status: value})}
              >
                <SelectTrigger id="status" data-testid="select-status">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="authorized">Authorized</SelectItem>
                  <SelectItem value="captured">Captured</SelectItem>
                  <SelectItem value="voided">Voided</SelectItem>
                  <SelectItem value="declined">Declined</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="checkNumber">Check Number</Label>
              <Input
                id="checkNumber"
                placeholder="Search check..."
                value={filters.checkNumber}
                onChange={(e) => setFilters({...filters, checkNumber: e.target.value})}
                data-testid="input-check-number"
              />
            </div>
            <div>
              <Label htmlFor="jobId">Job ID</Label>
              <Input
                id="jobId"
                placeholder="Job ID..."
                value={filters.jobId}
                onChange={(e) => setFilters({...filters, jobId: e.target.value})}
                data-testid="input-job-id"
              />
            </div>
            <div>
              <Label htmlFor="fromDate">From Date</Label>
              <Input
                id="fromDate"
                type="date"
                value={filters.fromDate}
                onChange={(e) => setFilters({...filters, fromDate: e.target.value})}
                data-testid="input-from-date"
              />
            </div>
            <div>
              <Label htmlFor="toDate">To Date</Label>
              <Input
                id="toDate"
                type="date"
                value={filters.toDate}
                onChange={(e) => setFilters({...filters, toDate: e.target.value})}
                data-testid="input-to-date"
              />
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <Button 
              onClick={() => refetch()} 
              variant="outline"
              data-testid="button-refresh"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
            <Button 
              onClick={() => setFilters({
                provider: "",
                status: "",
                checkNumber: "",
                jobId: "",
                fromDate: "",
                toDate: ""
              })}
              variant="outline"
              data-testid="button-clear-filters"
            >
              Clear Filters
            </Button>
            <Button 
              variant="outline"
              data-testid="button-export"
            >
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Checks Table */}
      <Card>
        <CardHeader>
          <CardTitle>Fleet Check Transactions</CardTitle>
          <CardDescription>
            View and manage all fleet check authorizations and captures
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading checks...</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Provider</TableHead>
                    <TableHead>Check Number</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Authorized</TableHead>
                    <TableHead>Captured</TableHead>
                    <TableHead>Job ID</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {checksData?.checks?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8">
                        No checks found matching your criteria
                      </TableCell>
                    </TableRow>
                  ) : (
                    checksData?.checks?.map((check: FleetCheck) => (
                      <TableRow key={check.id}>
                        <TableCell>
                          <Badge variant="outline" className="gap-1">
                            <Truck className="w-3 h-3" />
                            {check.provider.toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono">
                          {check.maskedCheckNumber}
                        </TableCell>
                        <TableCell>{getStatusBadge(check.status)}</TableCell>
                        <TableCell>{formatCurrency(check.authorizedAmount)}</TableCell>
                        <TableCell>
                          {check.capturedAmount ? formatCurrency(check.capturedAmount) : "-"}
                        </TableCell>
                        <TableCell>
                          {check.jobId ? (
                            <a href={`/jobs/${check.jobId}`} className="text-primary hover:underline">
                              {check.jobId.slice(0, 8)}...
                            </a>
                          ) : "-"}
                        </TableCell>
                        <TableCell>
                          {format(new Date(check.createdAt), "MMM d, h:mm a")}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setSelectedCheck(check);
                                setShowDetails(true);
                              }}
                              data-testid={`button-view-${check.id}`}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {check.status === "authorized" && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setSelectedCheck(check);
                                  setShowVoidDialog(true);
                                }}
                                data-testid={`button-void-${check.id}`}
                              >
                                <Ban className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Check Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Check Details</DialogTitle>
            <DialogDescription>
              Complete information for check {selectedCheck?.maskedCheckNumber}
            </DialogDescription>
          </DialogHeader>
          {selectedCheck && (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label className="text-sm text-muted-foreground">Provider</Label>
                  <p className="font-medium">{selectedCheck.provider.toUpperCase()}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Status</Label>
                  <div className="mt-1">{getStatusBadge(selectedCheck.status)}</div>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Check Number</Label>
                  <p className="font-mono">{selectedCheck.maskedCheckNumber}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Authorization Code</Label>
                  <p className="font-mono">{selectedCheck.authorizationCode || "N/A"}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Authorized Amount</Label>
                  <p className="font-medium">{formatCurrency(selectedCheck.authorizedAmount)}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Captured Amount</Label>
                  <p className="font-medium">
                    {selectedCheck.capturedAmount ? formatCurrency(selectedCheck.capturedAmount) : "Not captured"}
                  </p>
                </div>
                {selectedCheck.availableBalance && (
                  <div>
                    <Label className="text-sm text-muted-foreground">Available Balance</Label>
                    <p className="font-medium">{formatCurrency(selectedCheck.availableBalance)}</p>
                  </div>
                )}
                {selectedCheck.jobId && (
                  <div>
                    <Label className="text-sm text-muted-foreground">Job ID</Label>
                    <a href={`/jobs/${selectedCheck.jobId}`} className="text-primary hover:underline">
                      {selectedCheck.jobId}
                    </a>
                  </div>
                )}
                <div>
                  <Label className="text-sm text-muted-foreground">Created</Label>
                  <p>{format(new Date(selectedCheck.createdAt), "PPpp")}</p>
                </div>
                {selectedCheck.expiresAt && (
                  <div>
                    <Label className="text-sm text-muted-foreground">Expires</Label>
                    <p>{format(new Date(selectedCheck.expiresAt), "PPpp")}</p>
                  </div>
                )}
              </div>

              {selectedCheck.failureReason && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Failure Reason:</strong> {selectedCheck.failureReason}
                  </AlertDescription>
                </Alert>
              )}

              {selectedCheck.authorizationResponse && (
                <div>
                  <Label className="text-sm text-muted-foreground">Authorization Response</Label>
                  <pre className="mt-2 p-3 bg-muted rounded text-xs overflow-x-auto">
                    {JSON.stringify(selectedCheck.authorizationResponse, null, 2)}
                  </pre>
                </div>
              )}

              {selectedCheck.captureResponse && (
                <div>
                  <Label className="text-sm text-muted-foreground">Capture Response</Label>
                  <pre className="mt-2 p-3 bg-muted rounded text-xs overflow-x-auto">
                    {JSON.stringify(selectedCheck.captureResponse, null, 2)}
                  </pre>
                </div>
              )}

              <div className="grid gap-4 md:grid-cols-2 text-sm">
                <div>
                  <Label className="text-sm text-muted-foreground">IP Address</Label>
                  <p className="font-mono">{selectedCheck.ipAddress || "N/A"}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">User Agent</Label>
                  <p className="text-xs truncate">{selectedCheck.userAgent || "N/A"}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Void Confirmation Dialog */}
      <Dialog open={showVoidDialog} onOpenChange={setShowVoidDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Void Check Authorization</DialogTitle>
            <DialogDescription>
              Are you sure you want to void this check authorization? This will release any held funds and cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Check:</strong> {selectedCheck?.maskedCheckNumber}<br />
                <strong>Amount:</strong> {selectedCheck && formatCurrency(selectedCheck.authorizedAmount)}<br />
                <strong>Provider:</strong> {selectedCheck?.provider.toUpperCase()}
              </AlertDescription>
            </Alert>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowVoidDialog(false)}
              data-testid="button-cancel-void"
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => selectedCheck && voidCheckMutation.mutate(selectedCheck.id)}
              disabled={voidCheckMutation.isPending}
              data-testid="button-confirm-void"
            >
              {voidCheckMutation.isPending ? "Voiding..." : "Void Authorization"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}