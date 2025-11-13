import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import AdminLayout from "@/layouts/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { format } from "date-fns";
import {
  Search, Filter, Building2, DollarSign, TrendingUp, Award,
  FileText, Clock, Users, Truck, AlertCircle, CheckCircle, XCircle,
  Download, RefreshCw, CreditCard, Loader2, Edit, Eye,
  Receipt, Calendar, Shield
} from "lucide-react";

export default function AdminFleets() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [tierFilter, setTierFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedFleet, setSelectedFleet] = useState<any>(null);
  const [showFleetDetails, setShowFleetDetails] = useState(false);
  const [showApprovalQueue, setShowApprovalQueue] = useState(false);
  const [showInvoiceDialog, setShowInvoiceDialog] = useState(false);
  const [selectedFleets, setSelectedFleets] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<"fleets" | "applications">("fleets");
  const [selectedApplication, setSelectedApplication] = useState<any>(null);

  // Query for fleets
  const { data: fleets, isLoading, refetch } = useQuery({
    queryKey: ['/api/admin/fleets', { tier: tierFilter, status: statusFilter, search: searchQuery }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (tierFilter !== 'all') params.append('tier', tierFilter);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (searchQuery) params.append('search', searchQuery);
      return apiRequest('GET', `/api/admin/fleets?${params}`);
    }
  });

  // Query for pending approvals (deprecated - for backward compatibility)
  const { data: pendingApprovals } = useQuery({
    queryKey: ['/api/admin/fleets/pending'],
    queryFn: async () => apiRequest('GET', '/api/admin/fleets/pending')
  });

  // Query for fleet applications
  const { data: fleetApplicationsResponse, isLoading: isLoadingApplications, refetch: refetchApplications } = useQuery({
    queryKey: ['/api/admin/fleet-applications'],
    queryFn: async () => apiRequest('GET', '/api/admin/fleet-applications'),
    enabled: activeTab === 'applications'
  });
  
  // Extract the applications array from the response
  const fleetApplications = fleetApplicationsResponse?.applications || [];

  // Mutation for updating fleet tier
  const updateTierMutation = useMutation({
    mutationFn: async ({ fleetId, tier }: { fleetId: string; tier: string }) => {
      return apiRequest('PUT', `/api/admin/fleets/${fleetId}/tier`, { 
        tier 
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/fleets'] });
      toast({
        title: "Tier updated",
        description: "Fleet tier has been updated successfully",
      });
    },
  });

  // Mutation for updating credit limit
  const updateCreditMutation = useMutation({
    mutationFn: async ({ fleetId, creditLimit, paymentTerms }: any) => {
      return apiRequest('PUT', `/api/admin/fleets/${fleetId}/credit`, {
        creditLimit, paymentTerms
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/fleets'] });
      toast({
        title: "Credit updated",
        description: "Fleet credit limit and terms have been updated",
      });
    },
  });

  // Mutation for generating invoices
  const generateInvoiceMutation = useMutation({
    mutationFn: async ({ fleetIds, period }: { fleetIds: string[]; period: string }) => {
      return apiRequest('POST', '/api/admin/fleets/invoices', {
        fleetIds, period
      });
    },
    onSuccess: () => {
      setShowInvoiceDialog(false);
      setSelectedFleets([]);
      toast({
        title: "Invoices generated",
        description: "Fleet invoices have been generated successfully",
      });
    },
  });

  // Mutation for approving fleet application
  const approveApplicationMutation = useMutation({
    mutationFn: async (applicationId: string) => {
      return apiRequest('PUT', `/api/admin/fleet-applications/${applicationId}/approve`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/fleet-applications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/fleets'] });
      toast({
        title: "Application approved",
        description: "Fleet application has been approved and account created",
      });
      setSelectedApplication(null);
    },
  });

  // Mutation for rejecting fleet application
  const rejectApplicationMutation = useMutation({
    mutationFn: async ({ applicationId, reason }: { applicationId: string; reason: string }) => {
      return apiRequest('PUT', `/api/admin/fleet-applications/${applicationId}/reject`, { reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/fleet-applications'] });
      toast({
        title: "Application rejected",
        description: "Fleet application has been rejected",
      });
      setSelectedApplication(null);
    },
  });

  const fleetsData = Array.isArray(fleets) ? fleets : (fleets?.data || []);
  
  // Mock data fallback for development
  const mockFleets = [
    {
      id: "FLT-001",
      name: "ABC Transport",
      contactName: "John Smith",
      email: "john@abctransport.com",
      phone: "(555) 123-4567",
      status: "active",
      tier: "gold",
      creditLimit: 50000,
      currentBalance: 12500,
      paymentTerms: "NET30",
      totalSpent: 245600,
      totalJobs: 892,
      avgMonthlySpend: 20467,
      lastJobDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      joinedDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
      vehicles: 45,
      customPricing: true,
    },
    {
      id: "FLT-002",
      name: "XYZ Logistics",
      contactName: "Sarah Johnson",
      email: "sarah@xyzlogistics.com",
      phone: "(555) 987-6543",
      status: "active",
      tier: "silver",
      creditLimit: 25000,
      currentBalance: 5800,
      paymentTerms: "NET15",
      totalSpent: 128400,
      totalJobs: 456,
      avgMonthlySpend: 10700,
      lastJobDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      joinedDate: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000),
      vehicles: 22,
      customPricing: false,
    },
  ];

  const pendingData = Array.isArray(pendingApprovals) ? pendingApprovals : (pendingApprovals?.data || []);

  const getTierBadge = (tier: string) => {
    const colorConfig: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline', className?: string }> = {
      standard: { variant: 'secondary' },
      silver: { variant: 'default' },
      gold: { variant: 'default', className: 'bg-yellow-500 hover:bg-yellow-600' },
      platinum: { variant: 'default', className: 'bg-purple-500 hover:bg-purple-600' },
    };
    const config = colorConfig[tier] || { variant: 'secondary' };
    return <Badge variant={config.variant} className={config.className}>{tier.toUpperCase()}</Badge>;
  };

  const handleExport = async () => {
    try {
      const data = await apiRequest<string>('POST', '/api/admin/fleets/export', { 
        format: 'csv' 
      });
      
      const blob = new Blob([data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `fleets-export-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      a.click();
      
      toast({
        title: "Export successful",
        description: "Fleet data has been exported",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Export failed",
        description: "Failed to export fleet data",
      });
    }
  };

  return (
    <AdminLayout 
      title="Fleet Management"
      breadcrumbs={[{ label: "Fleets" }]}
    >
      {/* Tabs for Active Fleets and Applications */}
      <Tabs value={activeTab} onValueChange={(value: any) => setActiveTab(value)} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="fleets" data-testid="tab-fleets">
            <Building2 className="mr-2 h-4 w-4" />
            Active Fleets
          </TabsTrigger>
          <TabsTrigger value="applications" data-testid="tab-applications">
            <FileText className="mr-2 h-4 w-4" />
            Applications
            {fleetApplications?.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {fleetApplications.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Active Fleets Tab */}
        <TabsContent value="fleets">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Fleet Accounts</CardTitle>
                  <CardDescription>Manage fleet accounts, tiers, and credit limits</CardDescription>
                </div>
                <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => refetch()}
                data-testid="button-refresh-fleets"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </Button>
              <Button
                variant="outline"
                onClick={handleExport}
                data-testid="button-export-fleets"
              >
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
              {selectedFleets.length > 0 && (
                <Button
                  onClick={() => setShowInvoiceDialog(true)}
                  data-testid="button-generate-invoices"
                >
                  <Receipt className="mr-2 h-4 w-4" />
                  Generate Invoices ({selectedFleets.length})
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name, contact, email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
                data-testid="input-search-fleets"
              />
            </div>
            <Select value={tierFilter} onValueChange={setTierFilter}>
              <SelectTrigger className="w-[180px]" data-testid="select-tier-filter">
                <SelectValue placeholder="Filter by tier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tiers</SelectItem>
                <SelectItem value="standard">Standard</SelectItem>
                <SelectItem value="silver">Silver</SelectItem>
                <SelectItem value="gold">Gold</SelectItem>
                <SelectItem value="platinum">Platinum</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]" data-testid="select-status-filter">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Fleets Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedFleets.length === fleetsData.length}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedFleets(fleetsData.map((f: any) => f.id));
                        } else {
                          setSelectedFleets([]);
                        }
                      }}
                    />
                  </TableHead>
                  <TableHead>Fleet Account</TableHead>
                  <TableHead>Tier</TableHead>
                  <TableHead>Credit Status</TableHead>
                  <TableHead>Vehicles</TableHead>
                  <TableHead>Total Spent</TableHead>
                  <TableHead>Monthly Avg</TableHead>
                  <TableHead>Total Jobs</TableHead>
                  <TableHead>Last Active</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : fleetsData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                      No fleet accounts found
                    </TableCell>
                  </TableRow>
                ) : (
                  fleetsData.map((fleet: any) => (
                    <TableRow key={fleet.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedFleets.includes(fleet.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedFleets([...selectedFleets, fleet.id]);
                            } else {
                              setSelectedFleets(selectedFleets.filter(id => id !== fleet.id));
                            }
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{fleet.name}</p>
                          <p className="text-sm text-muted-foreground">{fleet.contactName}</p>
                        </div>
                      </TableCell>
                      <TableCell>{getTierBadge(fleet.tier)}</TableCell>
                      <TableCell>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm">
                              ${(fleet.currentBalance ?? 0).toLocaleString()} / ${(fleet.creditLimit ?? 0).toLocaleString()}
                            </span>
                          </div>
                          <Progress 
                            value={fleet.creditLimit ? ((fleet.currentBalance ?? 0) / fleet.creditLimit) * 100 : 0}
                            className="mt-1 h-1.5"
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            {fleet.paymentTerms || 'N/A'}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Truck className="h-4 w-4 text-muted-foreground" />
                          {fleet.vehicles ?? 0}
                        </div>
                      </TableCell>
                      <TableCell>${(fleet.totalSpent ?? 0).toLocaleString()}</TableCell>
                      <TableCell>${(fleet.avgMonthlySpend ?? 0).toLocaleString()}</TableCell>
                      <TableCell>{fleet.totalJobs ?? 0}</TableCell>
                      <TableCell>{fleet.lastJobDate ? format(fleet.lastJobDate, 'MMM d, yyyy') : 'Never'}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => {
                              setSelectedFleet(fleet);
                              setShowFleetDetails(true);
                            }}
                            data-testid={`button-view-${fleet.id}`}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => {
                              setSelectedFleet(fleet);
                            }}
                            data-testid={`button-edit-${fleet.id}`}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
          </Card>
        </TabsContent>

        {/* Applications Tab */}
        <TabsContent value="applications">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Fleet Applications</CardTitle>
                  <CardDescription>Review and manage pending fleet applications</CardDescription>
                </div>
                <Button
                  variant="outline"
                  onClick={() => refetchApplications()}
                  data-testid="button-refresh-applications"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Company Name</TableHead>
                    <TableHead>Contact Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Fleet Size</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoadingApplications ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                      </TableCell>
                    </TableRow>
                  ) : (!fleetApplications || fleetApplications.length === 0) ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        No fleet applications found
                      </TableCell>
                    </TableRow>
                  ) : (
                    fleetApplications.map((application: any) => (
                      <TableRow key={application.id} data-testid={`application-row-${application.id}`}>
                        <TableCell className="font-medium">{application.companyName}</TableCell>
                        <TableCell>{application.primaryContactName}</TableCell>
                        <TableCell>{application.primaryContactEmail}</TableCell>
                        <TableCell>{application.primaryContactPhone}</TableCell>
                        <TableCell>{application.fleetSize} vehicles</TableCell>
                        <TableCell>{new Date(application.submittedAt || application.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Badge variant={application.status === 'pending' ? 'secondary' : 'default'}>
                            {application.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSelectedApplication(application)}
                              data-testid={`button-view-application-${application.id}`}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                            {application.status === 'pending' && (
                              <>
                                <Button
                                  size="sm"
                                  variant="default"
                                  onClick={() => approveApplicationMutation.mutate(application.id)}
                                  disabled={approveApplicationMutation.isPending}
                                  data-testid={`button-approve-${application.id}`}
                                >
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => {
                                    const reason = prompt('Please enter rejection reason:');
                                    if (reason) {
                                      rejectApplicationMutation.mutate({
                                        applicationId: application.id,
                                        reason
                                      });
                                    }
                                  }}
                                  disabled={rejectApplicationMutation.isPending}
                                  data-testid={`button-reject-${application.id}`}
                                >
                                  <XCircle className="h-4 w-4 mr-1" />
                                  Reject
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Fleet Details Dialog */}
      <Dialog open={showFleetDetails} onOpenChange={setShowFleetDetails}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Fleet Details - {selectedFleet?.name}</DialogTitle>
            <DialogDescription>
              Complete fleet account information and configuration
            </DialogDescription>
          </DialogHeader>
          
          {selectedFleet && (
            <Tabs defaultValue="info" className="mt-4">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="info">Information</TabsTrigger>
                <TabsTrigger value="pricing">Pricing</TabsTrigger>
                <TabsTrigger value="credit">Credit</TabsTrigger>
                <TabsTrigger value="vehicles">Vehicles</TabsTrigger>
                <TabsTrigger value="invoices">Invoices</TabsTrigger>
              </TabsList>

              <TabsContent value="info" className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Fleet Name</Label>
                    <Input value={selectedFleet.name} readOnly />
                  </div>
                  <div className="space-y-2">
                    <Label>Contact Name</Label>
                    <Input value={selectedFleet.contactName} readOnly />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input value={selectedFleet.email} readOnly />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone</Label>
                    <Input value={selectedFleet.phone} readOnly />
                  </div>
                  <div className="space-y-2">
                    <Label>Tier</Label>
                    <Select
                      value={selectedFleet.tier}
                      onValueChange={(value) => {
                        updateTierMutation.mutate({
                          fleetId: selectedFleet.id,
                          tier: value,
                        });
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="standard">Standard</SelectItem>
                        <SelectItem value="silver">Silver</SelectItem>
                        <SelectItem value="gold">Gold</SelectItem>
                        <SelectItem value="platinum">Platinum</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Joined Date</Label>
                    <Input value={selectedFleet?.joinedDate ? format(selectedFleet.joinedDate, 'PPP') : 'N/A'} readOnly />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="pricing">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">Custom Pricing</p>
                      <p className="text-sm text-muted-foreground">
                        Override standard tier pricing
                      </p>
                    </div>
                    <Checkbox checked={selectedFleet?.customPricing ?? false} />
                  </div>
                  
                  {selectedFleet?.customPricing && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Custom Price Configuration</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="grid gap-2 md:grid-cols-2">
                          <div className="space-y-1">
                            <Label className="text-sm">Emergency Repair</Label>
                            <Input type="number" placeholder="% discount" />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-sm">Truck Wash</Label>
                            <Input type="number" placeholder="% discount" />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-sm">PM Service</Label>
                            <Input type="number" placeholder="% discount" />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-sm">Tire Service</Label>
                            <Input type="number" placeholder="% discount" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="credit">
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Credit Limit</Label>
                      <Input
                        type="number"
                        defaultValue={selectedFleet?.creditLimit ?? 0}
                        onChange={(e) => {
                          // Update credit limit
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Payment Terms</Label>
                      <Select defaultValue={selectedFleet?.paymentTerms || 'NET30'}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="COD">Cash on Delivery</SelectItem>
                          <SelectItem value="NET15">NET 15</SelectItem>
                          <SelectItem value="NET30">NET 30</SelectItem>
                          <SelectItem value="NET45">NET 45</SelectItem>
                          <SelectItem value="NET60">NET 60</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Current Balance</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Outstanding Balance</span>
                          <span className="font-semibold">
                            ${(selectedFleet?.currentBalance ?? 0).toLocaleString()}
                          </span>
                        </div>
                        <Progress
                          value={selectedFleet?.creditLimit ? ((selectedFleet?.currentBalance ?? 0) / selectedFleet.creditLimit) * 100 : 0}
                        />
                        <p className="text-xs text-muted-foreground">
                          {selectedFleet?.creditLimit 
                            ? `${((selectedFleet?.currentBalance ?? 0) / selectedFleet.creditLimit * 100).toFixed(1)}% of credit limit used`
                            : 'No credit limit set'}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="vehicles">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">Fleet Vehicles ({selectedFleet?.vehicles ?? 0})</h3>
                    <Button size="sm">
                      Add Vehicle
                    </Button>
                  </div>
                  <div className="text-center py-8 text-muted-foreground">
                    Vehicle list will be displayed here
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="invoices">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">Recent Invoices</h3>
                    <Button size="sm">
                      Generate Invoice
                    </Button>
                  </div>
                  <div className="text-center py-8 text-muted-foreground">
                    Invoice history will be displayed here
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

      {/* Approval Queue Dialog */}
      <Dialog open={showApprovalQueue} onOpenChange={setShowApprovalQueue}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Fleet Application Queue</DialogTitle>
            <DialogDescription>
              Review and approve pending fleet applications
            </DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="h-[400px]">
            <div className="space-y-4">
              {pendingData.map((fleet: any) => (
                <Card key={fleet.id}>
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold">{fleet.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            Contact: {fleet.contactName}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {fleet.email} • {fleet.phone}
                          </p>
                        </div>
                        <Badge>{fleet.requestedTier}</Badge>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Est. Monthly Volume</p>
                          <p className="font-semibold">
                            ${(fleet.estimatedMonthlyVolume ?? 0).toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Number of Vehicles</p>
                          <p className="font-semibold">{fleet.numberOfVehicles ?? 0}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Submitted</p>
                          <p className="font-semibold">
                            {fleet.submittedAt ? format(fleet.submittedAt, 'MMM d, yyyy') : 'N/A'}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          className="flex-1"
                          onClick={() => {
                            // Approve fleet
                            setShowApprovalQueue(false);
                            toast({
                              title: "Fleet approved",
                              description: "Fleet account has been approved",
                            });
                          }}
                        >
                          Approve
                        </Button>
                        <Button
                          variant="outline"
                          className="flex-1"
                          onClick={() => {
                            // Reject fleet
                          }}
                        >
                          Reject
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Generate Invoices Dialog */}
      <Dialog open={showInvoiceDialog} onOpenChange={setShowInvoiceDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate Fleet Invoices</DialogTitle>
            <DialogDescription>
              Generate invoices for {selectedFleets.length} selected fleet(s)
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Invoice Period</Label>
              <Select>
                <SelectTrigger data-testid="select-invoice-period">
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="current_month">Current Month</SelectItem>
                  <SelectItem value="last_month">Last Month</SelectItem>
                  <SelectItem value="last_quarter">Last Quarter</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Invoice Date</Label>
              <Input type="date" defaultValue={format(new Date(), 'yyyy-MM-dd')} />
            </div>
            
            <div className="space-y-2">
              <Label>Due Date</Label>
              <Input type="date" />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInvoiceDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                generateInvoiceMutation.mutate({
                  fleetIds: selectedFleets,
                  period: 'current_month',
                });
              }}
              disabled={generateInvoiceMutation.isPending}
              data-testid="button-generate"
            >
              {generateInvoiceMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Receipt className="mr-2 h-4 w-4" />
              )}
              Generate Invoices
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Fleet Application Details Dialog */}
      <Dialog open={!!selectedApplication} onOpenChange={(open) => !open && setSelectedApplication(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Fleet Application Details</DialogTitle>
            <DialogDescription>
              Review complete fleet application information
            </DialogDescription>
          </DialogHeader>
          
          {selectedApplication && (
            <div className="space-y-6">
              {/* Status Badge */}
              <div className="flex items-center justify-between">
                <Badge variant={
                  selectedApplication.status === 'approved' ? 'default' :
                  selectedApplication.status === 'rejected' ? 'destructive' :
                  'secondary'
                }>
                  {selectedApplication.status.toUpperCase()}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  Submitted: {selectedApplication.submittedAt ? format(new Date(selectedApplication.submittedAt), 'PPP') : 'N/A'}
                </span>
              </div>

              {/* Company Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Company Information</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1">
                    <Label className="text-sm text-muted-foreground">Company Name</Label>
                    <p className="font-medium" data-testid="text-company-name">{selectedApplication.companyName}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-sm text-muted-foreground">DOT Number</Label>
                    <p className="font-medium" data-testid="text-dot-number">{selectedApplication.dotNumber || 'N/A'}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-sm text-muted-foreground">MC Number</Label>
                    <p className="font-medium" data-testid="text-mc-number">{selectedApplication.mcNumber || 'N/A'}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-sm text-muted-foreground">Tax ID</Label>
                    <p className="font-medium" data-testid="text-tax-id">{selectedApplication.taxId || 'N/A'}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-sm text-muted-foreground">Business Type</Label>
                    <p className="font-medium" data-testid="text-business-type">{selectedApplication.businessType || 'N/A'}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-sm text-muted-foreground">Requested Tier</Label>
                    <p className="font-medium" data-testid="text-requested-tier">{selectedApplication.requestedTier || 'standard'}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Address Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Address</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1 md:col-span-2">
                    <Label className="text-sm text-muted-foreground">Street Address</Label>
                    <p className="font-medium" data-testid="text-address">{selectedApplication.address}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-sm text-muted-foreground">City</Label>
                    <p className="font-medium" data-testid="text-city">{selectedApplication.city}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-sm text-muted-foreground">State</Label>
                    <p className="font-medium" data-testid="text-state">{selectedApplication.state}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-sm text-muted-foreground">ZIP Code</Label>
                    <p className="font-medium" data-testid="text-zip">{selectedApplication.zip}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Fleet Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Fleet Information</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1">
                    <Label className="text-sm text-muted-foreground">Fleet Size</Label>
                    <p className="font-medium" data-testid="text-fleet-size">
                      <Truck className="inline h-4 w-4 mr-1" />
                      {selectedApplication.fleetSize} vehicles
                    </p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-sm text-muted-foreground">Vehicle Types</Label>
                    <p className="font-medium" data-testid="text-vehicle-types">
                      {selectedApplication.vehicleTypes?.join(', ') || 'N/A'}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-sm text-muted-foreground">Avg Monthly Services</Label>
                    <p className="font-medium" data-testid="text-monthly-services">
                      {selectedApplication.averageMonthlyServices || 'N/A'}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-sm text-muted-foreground">Service Needs</Label>
                    <p className="font-medium" data-testid="text-service-needs">
                      {selectedApplication.primaryServiceNeeds?.join(', ') || 'N/A'}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Contact Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Primary Contact */}
                  <div>
                    <h4 className="font-medium mb-3">Primary Contact</h4>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-1">
                        <Label className="text-sm text-muted-foreground">Name</Label>
                        <p className="font-medium" data-testid="text-primary-name">{selectedApplication.primaryContactName}</p>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-sm text-muted-foreground">Title</Label>
                        <p className="font-medium" data-testid="text-primary-title">{selectedApplication.primaryContactTitle || 'N/A'}</p>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-sm text-muted-foreground">Phone</Label>
                        <p className="font-medium" data-testid="text-primary-phone">{selectedApplication.primaryContactPhone}</p>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-sm text-muted-foreground">Email</Label>
                        <p className="font-medium" data-testid="text-primary-email">{selectedApplication.primaryContactEmail}</p>
                      </div>
                    </div>
                  </div>

                  {/* Billing Contact (if different) */}
                  {selectedApplication.billingContactName && (
                    <div>
                      <h4 className="font-medium mb-3">Billing Contact</h4>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-1">
                          <Label className="text-sm text-muted-foreground">Name</Label>
                          <p className="font-medium" data-testid="text-billing-name">{selectedApplication.billingContactName}</p>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-sm text-muted-foreground">Phone</Label>
                          <p className="font-medium" data-testid="text-billing-phone">{selectedApplication.billingContactPhone || 'N/A'}</p>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-sm text-muted-foreground">Email</Label>
                          <p className="font-medium" data-testid="text-billing-email">{selectedApplication.billingContactEmail}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Financial Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Financial Information</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1">
                    <Label className="text-sm text-muted-foreground">Requested Credit Limit</Label>
                    <p className="font-medium" data-testid="text-credit-limit">
                      <DollarSign className="inline h-4 w-4" />
                      {selectedApplication.requestedCreditLimit ? 
                        Number(selectedApplication.requestedCreditLimit).toLocaleString() : 'N/A'}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-sm text-muted-foreground">Preferred Payment Terms</Label>
                    <p className="font-medium" data-testid="text-payment-terms">
                      {selectedApplication.preferredPaymentTerms || 'N/A'}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-sm text-muted-foreground">Payment Methods</Label>
                    <p className="font-medium" data-testid="text-payment-methods">
                      {selectedApplication.paymentMethods?.join(', ') || 'N/A'}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-sm text-muted-foreground">EFS/Comdata Capable</Label>
                    <p className="font-medium" data-testid="text-efs-capable">
                      {selectedApplication.hasEfsComdata ? 'Yes' : 'No'}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Additional Information */}
              {selectedApplication.additionalInfo && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Additional Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="whitespace-pre-wrap" data-testid="text-additional-info">
                      {selectedApplication.additionalInfo}
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Documents */}
              {selectedApplication.documents && selectedApplication.documents.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Submitted Documents</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {selectedApplication.documents.map((doc: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between p-2 border rounded">
                          <span className="text-sm">{doc.type || doc.name}</span>
                          <Badge variant="outline">{doc.status || 'Pending Review'}</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          <DialogFooter className="flex-col sm:flex-row gap-2">
            {selectedApplication?.status === 'pending' && (
              <>
                <Button
                  variant="destructive"
                  onClick={() => {
                    const reason = prompt('Please enter rejection reason:');
                    if (reason) {
                      rejectApplicationMutation.mutate({
                        applicationId: selectedApplication.id,
                        reason
                      });
                    }
                  }}
                  disabled={rejectApplicationMutation.isPending}
                  data-testid="button-dialog-reject"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject Application
                </Button>
                <Button
                  variant="default"
                  onClick={() => approveApplicationMutation.mutate(selectedApplication.id)}
                  disabled={approveApplicationMutation.isPending}
                  data-testid="button-dialog-approve"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve Application
                </Button>
              </>
            )}
            <Button 
              variant="outline" 
              onClick={() => setSelectedApplication(null)}
              data-testid="button-dialog-close"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}