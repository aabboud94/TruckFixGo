import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import {
  CreditCard,
  DollarSign,
  Users,
  Calendar,
  AlertCircle,
  CheckCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  Pause,
  Play,
  RefreshCw,
  FileText,
  Download,
  Plus,
  Edit,
  X,
  ChevronRight,
  AlertTriangle,
} from 'lucide-react';
import type {
  BillingSubscription,
  BillingHistory,
  FleetAccount,
} from '@shared/schema';

interface BillingStatistics {
  totalActiveSubscriptions: number;
  totalMonthlyRevenue: number;
  totalFailedPayments: number;
  upcomingBillings: number;
  averageSubscriptionValue: number;
  subscriptionsByPlan: {
    basic: number;
    standard: number;
    enterprise: number;
    custom: number;
  };
}

interface SubscriptionWithFleet extends BillingSubscription {
  fleetAccount?: FleetAccount;
  usage?: {
    vehiclesUsed: number;
    emergencyRepairsUsed: number;
    scheduledServicesUsed: number;
    overageCharges: number;
  };
}

export default function AdminBilling() {
  const { toast } = useToast();
  const [selectedSubscription, setSelectedSubscription] = useState<SubscriptionWithFleet | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showChargeDialog, setShowChargeDialog] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Create subscription form state
  const [createForm, setCreateForm] = useState({
    fleetAccountId: '',
    planType: 'standard' as 'basic' | 'standard' | 'enterprise' | 'custom',
    billingCycle: 'monthly' as 'monthly' | 'quarterly' | 'annual',
    customAmount: '',
    paymentMethodId: '',
    trialDays: 0,
    addOns: [] as string[],
  });

  // Fetch subscriptions and statistics
  const { data: billingData, isLoading } = useQuery({
    queryKey: ['/api/admin/billing/subscriptions', filterStatus],
    queryFn: async () => {
      const response = await fetch('/api/admin/billing/subscriptions');
      if (!response.ok) throw new Error('Failed to fetch subscriptions');
      return response.json();
    }
  });

  // Fetch billing statistics
  const { data: statistics } = useQuery({
    queryKey: ['/api/admin/billing/statistics'],
    queryFn: async () => {
      const response = await fetch('/api/admin/billing/statistics');
      if (!response.ok) throw new Error('Failed to fetch statistics');
      return response.json();
    }
  });

  // Fetch fleet accounts for dropdown
  const { data: fleetAccounts } = useQuery({
    queryKey: ['/api/fleet-accounts'],
  });

  // Create subscription mutation
  const createSubscriptionMutation = useMutation({
    mutationFn: async (data: typeof createForm) => {
      return await apiRequest('/api/billing/subscriptions', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/billing/subscriptions'] });
      toast({
        title: 'Success',
        description: 'Subscription created successfully',
      });
      setShowCreateDialog(false);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to create subscription',
        variant: 'destructive',
      });
    },
  });

  // Update subscription mutation
  const updateSubscriptionMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      return await apiRequest(`/api/billing/subscriptions/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/billing/subscriptions'] });
      toast({
        title: 'Success',
        description: 'Subscription updated successfully',
      });
      setShowEditDialog(false);
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to update subscription',
        variant: 'destructive',
      });
    },
  });

  // Pause subscription mutation
  const pauseSubscriptionMutation = useMutation({
    mutationFn: async (subscriptionId: string) => {
      return await apiRequest(`/api/billing/subscriptions/${subscriptionId}/pause`, {
        method: 'POST',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/billing/subscriptions'] });
      toast({
        title: 'Success',
        description: 'Subscription paused successfully',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to pause subscription',
        variant: 'destructive',
      });
    },
  });

  // Resume subscription mutation
  const resumeSubscriptionMutation = useMutation({
    mutationFn: async (subscriptionId: string) => {
      return await apiRequest(`/api/billing/subscriptions/${subscriptionId}/resume`, {
        method: 'POST',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/billing/subscriptions'] });
      toast({
        title: 'Success',
        description: 'Subscription resumed successfully',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to resume subscription',
        variant: 'destructive',
      });
    },
  });

  // Cancel subscription mutation
  const cancelSubscriptionMutation = useMutation({
    mutationFn: async ({ id, immediately, reason }: { id: string; immediately: boolean; reason: string }) => {
      return await apiRequest(`/api/billing/subscriptions/${id}/cancel`, {
        method: 'POST',
        body: JSON.stringify({ immediately, reason }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/billing/subscriptions'] });
      toast({
        title: 'Success',
        description: 'Subscription cancelled successfully',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to cancel subscription',
        variant: 'destructive',
      });
    },
  });

  // Manual charge mutation
  const processChargeMutation = useMutation({
    mutationFn: async (subscriptionId: string) => {
      return await apiRequest('/api/billing/charge', {
        method: 'POST',
        body: JSON.stringify({ subscriptionId }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/billing/subscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/billing/history'] });
      toast({
        title: 'Success',
        description: 'Charge processed successfully',
      });
      setShowChargeDialog(false);
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to process charge',
        variant: 'destructive',
      });
    },
  });

  // Retry failed payment mutation
  const retryPaymentMutation = useMutation({
    mutationFn: async (billingHistoryId: string) => {
      return await apiRequest('/api/billing/retry-failed', {
        method: 'POST',
        body: JSON.stringify({ billingHistoryId }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/billing/history'] });
      toast({
        title: 'Success',
        description: 'Payment retry successful',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Payment retry failed',
        variant: 'destructive',
      });
    },
  });

  const filteredSubscriptions = billingData?.subscriptions?.filter((sub: SubscriptionWithFleet) => {
    const matchesStatus = filterStatus === 'all' || sub.status === filterStatus;
    const matchesSearch = searchTerm === '' || 
      sub.fleetAccount?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.planName?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  }) || [];

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { variant: 'default' as const, icon: CheckCircle },
      paused: { variant: 'secondary' as const, icon: Pause },
      cancelled: { variant: 'destructive' as const, icon: X },
      past_due: { variant: 'destructive' as const, icon: AlertCircle },
      trialing: { variant: 'outline' as const, icon: Clock },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.active;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="w-3 h-3" />
        {status.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  const getPlanBadge = (planType: string) => {
    const planConfig = {
      basic: 'secondary',
      standard: 'default',
      enterprise: 'default',
      custom: 'outline',
    };

    return (
      <Badge variant={planConfig[planType as keyof typeof planConfig] as any}>
        {planType.toUpperCase()}
      </Badge>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-page-title">Billing Management</h1>
          <p className="text-muted-foreground mt-1">Manage fleet subscriptions and billing</p>
        </div>
        <Button
          onClick={() => setShowCreateDialog(true)}
          className="gap-2"
          data-testid="button-create-subscription"
        >
          <Plus className="w-4 h-4" />
          Create Subscription
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-active-subscriptions">
              {statistics?.statistics?.totalActiveSubscriptions || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {statistics?.statistics?.subscriptionsByPlan && (
                <>
                  {statistics.statistics.subscriptionsByPlan.basic} Basic,{' '}
                  {statistics.statistics.subscriptionsByPlan.standard} Standard
                </>
              )}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-monthly-revenue">
              ${(statistics?.statistics?.totalMonthlyRevenue || 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Avg: ${(statistics?.statistics?.averageSubscriptionValue || 0).toFixed(2)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed Payments</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-failed-payments">
              {statistics?.failedPayments?.length || 0}
            </div>
            <p className="text-xs text-muted-foreground">Requires attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Billings</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-upcoming-billings">
              {statistics?.upcomingBillings?.length || 0}
            </div>
            <p className="text-xs text-muted-foreground">Next 10 days</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="subscriptions" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="subscriptions" data-testid="tab-subscriptions">Subscriptions</TabsTrigger>
          <TabsTrigger value="history" data-testid="tab-history">Billing History</TabsTrigger>
          <TabsTrigger value="failed" data-testid="tab-failed">Failed Payments</TabsTrigger>
        </TabsList>

        {/* Subscriptions Tab */}
        <TabsContent value="subscriptions" className="space-y-4">
          {/* Filters */}
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search by fleet name or plan..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
                data-testid="input-search"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-40" data-testid="select-filter-status">
                <SelectValue placeholder="Filter status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="paused">Paused</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="trialing">Trialing</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Subscriptions Table */}
          <Card>
            <CardHeader>
              <CardTitle>Active Subscriptions</CardTitle>
              <CardDescription>
                Manage fleet subscriptions and billing plans
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div>Loading subscriptions...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fleet Account</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>Billing Cycle</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Next Billing</TableHead>
                      <TableHead>Usage</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSubscriptions.map((subscription: SubscriptionWithFleet) => (
                      <TableRow key={subscription.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{subscription.fleetAccount?.name || 'Unknown Fleet'}</div>
                            <div className="text-sm text-muted-foreground">
                              ID: {subscription.fleetAccountId?.slice(0, 8)}...
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {getPlanBadge(subscription.planType)}
                            {subscription.addOns?.length > 0 && (
                              <div className="text-xs text-muted-foreground">
                                +{subscription.addOns.length} add-ons
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{subscription.billingCycle}</TableCell>
                        <TableCell className="font-semibold">
                          ${parseFloat(subscription.baseAmount).toFixed(2)}
                        </TableCell>
                        <TableCell>{getStatusBadge(subscription.status)}</TableCell>
                        <TableCell>
                          {subscription.nextBillingDate
                            ? format(new Date(subscription.nextBillingDate), 'MMM d, yyyy')
                            : 'N/A'}
                        </TableCell>
                        <TableCell>
                          {subscription.usage && (
                            <div className="text-xs">
                              <div>{subscription.usage.vehiclesUsed}/{subscription.maxVehicles} vehicles</div>
                              <div>{subscription.usage.emergencyRepairsUsed}/{subscription.includedEmergencyRepairs} repairs</div>
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setSelectedSubscription(subscription);
                                setShowEditDialog(true);
                              }}
                              data-testid={`button-edit-${subscription.id}`}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            {subscription.status === 'active' && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => pauseSubscriptionMutation.mutate(subscription.id)}
                                data-testid={`button-pause-${subscription.id}`}
                              >
                                <Pause className="w-4 h-4" />
                              </Button>
                            )}
                            {subscription.status === 'paused' && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => resumeSubscriptionMutation.mutate(subscription.id)}
                                data-testid={`button-resume-${subscription.id}`}
                              >
                                <Play className="w-4 h-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setSelectedSubscription(subscription);
                                setShowChargeDialog(true);
                              }}
                              data-testid={`button-charge-${subscription.id}`}
                            >
                              <RefreshCw className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Billing History Tab */}
        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Billing History</CardTitle>
              <CardDescription>
                View all billing transactions and invoices
              </CardDescription>
            </CardHeader>
            <CardContent>
              {billingData?.invoices?.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice #</TableHead>
                      <TableHead>Fleet/Customer</TableHead>
                      <TableHead>Issue Date</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {billingData.invoices.map((invoice: any) => (
                      <TableRow key={invoice.id}>
                        <TableCell className="font-mono text-sm">
                          {invoice.invoiceNumber}
                        </TableCell>
                        <TableCell>
                          {invoice.fleetName || invoice.customerName || 'N/A'}
                        </TableCell>
                        <TableCell>
                          {format(new Date(invoice.issueDate), 'MMM d, yyyy')}
                        </TableCell>
                        <TableCell>
                          {format(new Date(invoice.dueDate), 'MMM d, yyyy')}
                        </TableCell>
                        <TableCell>
                          ${(invoice.totalAmount || 0).toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              invoice.status === 'paid' ? 'success' :
                              invoice.status === 'overdue' ? 'destructive' :
                              invoice.status === 'pending' ? 'secondary' : 'outline'
                            }
                          >
                            {invoice.status?.toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={async () => {
                                try {
                                  // Download the invoice PDF
                                  const response = await fetch(`/api/invoices/${invoice.id}/pdf`);
                                  if (response.ok) {
                                    const blob = await response.blob();
                                    const url = URL.createObjectURL(blob);
                                    const a = document.createElement('a');
                                    a.href = url;
                                    a.download = `invoice-${invoice.invoiceNumber}.pdf`;
                                    document.body.appendChild(a);
                                    a.click();
                                    document.body.removeChild(a);
                                    URL.revokeObjectURL(url);
                                    
                                    toast({
                                      title: "Invoice Downloaded",
                                      description: `Invoice ${invoice.invoiceNumber} has been downloaded`
                                    });
                                  } else {
                                    throw new Error('Failed to download invoice');
                                  }
                                } catch (error) {
                                  toast({
                                    title: "Download Failed",
                                    description: "Failed to download invoice",
                                    variant: "destructive"
                                  });
                                }
                              }}
                              title="Download Invoice"
                              data-testid={`button-download-invoice-${invoice.id}`}
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                // Navigate to invoice details or preview
                                window.open(`/admin/invoices/${invoice.id}`, '_blank');
                              }}
                              title="View Invoice"
                              data-testid={`button-view-invoice-${invoice.id}`}
                            >
                              <FileText className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No billing history available
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Failed Payments Tab */}
        <TabsContent value="failed" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Failed Payments</CardTitle>
              <CardDescription>
                Manage failed payment attempts and retries
              </CardDescription>
            </CardHeader>
            <CardContent>
              {statistics?.failedPayments?.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fleet</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Failed Date</TableHead>
                      <TableHead>Attempts</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {statistics.failedPayments.map((payment: any) => (
                      <TableRow key={payment.id}>
                        <TableCell>{payment.fleetName}</TableCell>
                        <TableCell>${payment.amount}</TableCell>
                        <TableCell>{format(new Date(payment.failedAt), 'MMM d, yyyy')}</TableCell>
                        <TableCell>{payment.paymentAttempts || 1}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {payment.failureReason || 'Unknown'}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => retryPaymentMutation.mutate(payment.id)}
                            data-testid={`button-retry-${payment.id}`}
                          >
                            Retry Payment
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No failed payments
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Subscription Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Subscription</DialogTitle>
            <DialogDescription>
              Set up a new billing subscription for a fleet account
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="fleetAccountId">Fleet Account</Label>
              <Select
                value={createForm.fleetAccountId}
                onValueChange={(value) => setCreateForm({ ...createForm, fleetAccountId: value })}
              >
                <SelectTrigger data-testid="select-fleet-account">
                  <SelectValue placeholder="Select fleet account" />
                </SelectTrigger>
                <SelectContent>
                  {fleetAccounts?.map((fleet: FleetAccount) => (
                    <SelectItem key={fleet.id} value={fleet.id}>
                      {fleet.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="planType">Plan Type</Label>
                <Select
                  value={createForm.planType}
                  onValueChange={(value) => setCreateForm({ ...createForm, planType: value as any })}
                >
                  <SelectTrigger data-testid="select-plan-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="basic">Basic ($500/mo - 10 vehicles)</SelectItem>
                    <SelectItem value="standard">Standard ($1500/mo - 50 vehicles)</SelectItem>
                    <SelectItem value="enterprise">Enterprise ($5000/mo - unlimited)</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="billingCycle">Billing Cycle</Label>
                <Select
                  value={createForm.billingCycle}
                  onValueChange={(value) => setCreateForm({ ...createForm, billingCycle: value as any })}
                >
                  <SelectTrigger data-testid="select-billing-cycle">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly (5% discount)</SelectItem>
                    <SelectItem value="annual">Annual (10% discount)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {createForm.planType === 'custom' && (
              <div>
                <Label htmlFor="customAmount">Custom Amount</Label>
                <Input
                  id="customAmount"
                  type="number"
                  placeholder="Enter custom amount"
                  value={createForm.customAmount}
                  onChange={(e) => setCreateForm({ ...createForm, customAmount: e.target.value })}
                  data-testid="input-custom-amount"
                />
              </div>
            )}

            <div>
              <Label>Add-on Services</Label>
              <div className="space-y-2 mt-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="priority-support"
                    checked={createForm.addOns.includes('priority_support')}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setCreateForm({
                          ...createForm,
                          addOns: [...createForm.addOns, 'priority_support'],
                        });
                      } else {
                        setCreateForm({
                          ...createForm,
                          addOns: createForm.addOns.filter((a) => a !== 'priority_support'),
                        });
                      }
                    }}
                    data-testid="checkbox-priority-support"
                  />
                  <label htmlFor="priority-support" className="text-sm font-medium">
                    Priority Support (+$200/mo)
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="account-manager"
                    checked={createForm.addOns.includes('dedicated_account_manager')}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setCreateForm({
                          ...createForm,
                          addOns: [...createForm.addOns, 'dedicated_account_manager'],
                        });
                      } else {
                        setCreateForm({
                          ...createForm,
                          addOns: createForm.addOns.filter((a) => a !== 'dedicated_account_manager'),
                        });
                      }
                    }}
                    data-testid="checkbox-account-manager"
                  />
                  <label htmlFor="account-manager" className="text-sm font-medium">
                    Dedicated Account Manager (+$500/mo)
                  </label>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="paymentMethodId">Payment Method</Label>
                <Input
                  id="paymentMethodId"
                  placeholder="Enter Stripe payment method ID"
                  value={createForm.paymentMethodId}
                  onChange={(e) => setCreateForm({ ...createForm, paymentMethodId: e.target.value })}
                  data-testid="input-payment-method"
                />
              </div>

              <div>
                <Label htmlFor="trialDays">Trial Days</Label>
                <Input
                  id="trialDays"
                  type="number"
                  placeholder="0"
                  value={createForm.trialDays}
                  onChange={(e) => setCreateForm({ ...createForm, trialDays: parseInt(e.target.value) || 0 })}
                  data-testid="input-trial-days"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => createSubscriptionMutation.mutate(createForm)}
              disabled={createSubscriptionMutation.isPending}
              data-testid="button-create-submit"
            >
              {createSubscriptionMutation.isPending ? 'Creating...' : 'Create Subscription'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Subscription Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Subscription</DialogTitle>
            <DialogDescription>
              Update subscription plan or billing details
            </DialogDescription>
          </DialogHeader>

          {selectedSubscription && (
            <div className="space-y-4">
              <div>
                <Label>Fleet Account</Label>
                <Input
                  value={selectedSubscription.fleetAccount?.name || ''}
                  disabled
                  className="bg-muted"
                />
              </div>

              <div>
                <Label>Plan Type</Label>
                <Select
                  value={selectedSubscription.planType}
                  onValueChange={(value) =>
                    setSelectedSubscription({ ...selectedSubscription, planType: value as any })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="basic">Basic</SelectItem>
                    <SelectItem value="standard">Standard</SelectItem>
                    <SelectItem value="enterprise">Enterprise</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Billing Cycle</Label>
                <Select
                  value={selectedSubscription.billingCycle}
                  onValueChange={(value) =>
                    setSelectedSubscription({ ...selectedSubscription, billingCycle: value as any })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                    <SelectItem value="annual">Annual</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Custom Amount (if applicable)</Label>
                <Input
                  type="number"
                  value={selectedSubscription.baseAmount}
                  onChange={(e) =>
                    setSelectedSubscription({ ...selectedSubscription, baseAmount: e.target.value })
                  }
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (selectedSubscription) {
                  updateSubscriptionMutation.mutate({
                    id: selectedSubscription.id,
                    updates: {
                      planType: selectedSubscription.planType,
                      billingCycle: selectedSubscription.billingCycle,
                      customAmount: parseFloat(selectedSubscription.baseAmount),
                    },
                  });
                }
              }}
              disabled={updateSubscriptionMutation.isPending}
            >
              {updateSubscriptionMutation.isPending ? 'Updating...' : 'Update Subscription'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manual Charge Dialog */}
      <Dialog open={showChargeDialog} onOpenChange={setShowChargeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Process Manual Charge</DialogTitle>
            <DialogDescription>
              Process a manual billing charge for this subscription
            </DialogDescription>
          </DialogHeader>

          {selectedSubscription && (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Fleet Account</p>
                <p className="font-medium">{selectedSubscription.fleetAccount?.name}</p>
              </div>
              <Separator />
              <div>
                <p className="text-sm text-muted-foreground">Plan</p>
                <p className="font-medium">
                  {selectedSubscription.planName} ({selectedSubscription.billingCycle})
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Amount to Charge</p>
                <p className="text-2xl font-bold">${selectedSubscription.baseAmount}</p>
              </div>
              <div className="bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <div className="flex gap-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                  <div className="text-sm">
                    <p className="font-semibold text-yellow-800 dark:text-yellow-200">
                      Manual Charge Warning
                    </p>
                    <p className="text-yellow-700 dark:text-yellow-300">
                      This will immediately charge the customer's payment method. This action cannot be undone.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowChargeDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (selectedSubscription) {
                  processChargeMutation.mutate(selectedSubscription.id);
                }
              }}
              disabled={processChargeMutation.isPending}
            >
              {processChargeMutation.isPending ? 'Processing...' : 'Process Charge'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}