import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
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
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';
import { format } from 'date-fns';
import {
  CreditCard,
  DollarSign,
  Calendar,
  AlertCircle,
  CheckCircle,
  Clock,
  Download,
  ChevronRight,
  FileText,
  TrendingUp,
  Users,
  Truck,
  Wrench,
  Package,
  ArrowUp,
  ArrowDown,
  Info,
  AlertTriangle,
} from 'lucide-react';
import type { BillingSubscription, BillingHistory, BillingUsageTracking } from '@shared/schema';

interface FleetSubscription extends BillingSubscription {
  currentUsage?: {
    vehiclesUsed: number;
    emergencyRepairsUsed: number;
    scheduledServicesUsed: number;
    overageCharges: number;
    usagePercentage: {
      vehicles: number;
      emergencyRepairs: number;
      scheduledServices: number;
    };
  };
  nextBillingDate?: string | null;
}

interface SubscriptionResponse {
  subscription: FleetSubscription;
  usage?: BillingUsageTracking;
}

interface BillingHistoryResponse {
  history: BillingHistory[];
}

const PLAN_DETAILS = {
  basic: {
    name: 'Basic Fleet Plan',
    price: 500,
    features: {
      maxVehicles: 10,
      includedEmergencyRepairs: 5,
      includedScheduledServices: 10,
      prioritySupport: false,
      dedicatedAccountManager: false,
    },
  },
  standard: {
    name: 'Standard Fleet Plan',
    price: 1500,
    features: {
      maxVehicles: 50,
      includedEmergencyRepairs: 20,
      includedScheduledServices: 50,
      prioritySupport: true,
      dedicatedAccountManager: false,
    },
  },
  enterprise: {
    name: 'Enterprise Fleet Plan',
    price: 5000,
    features: {
      maxVehicles: 999999,
      includedEmergencyRepairs: 999999,
      includedScheduledServices: 999999,
      prioritySupport: true,
      dedicatedAccountManager: true,
    },
  },
  custom: {
    name: 'Custom Fleet Plan',
    price: 0,
    features: {
      maxVehicles: 999999,
      includedEmergencyRepairs: 999999,
      includedScheduledServices: 999999,
      prioritySupport: true,
      dedicatedAccountManager: true,
    },
  },
};

export default function FleetBillingPortal() {
  const { toast } = useToast();
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'basic' | 'standard' | 'enterprise' | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [newPaymentMethod, setNewPaymentMethod] = useState('');

  // Fetch subscription data
  const { data: subscriptionData, isLoading } = useQuery<SubscriptionResponse>({
    queryKey: ['/api/billing/my-subscription'],
    queryFn: async () => {
      // This would fetch the current fleet's subscription
      const response = await fetch('/api/billing/my-subscription');
      if (!response.ok) throw new Error('Failed to fetch subscription');
      return response.json();
    },
  });

  // Fetch billing history
  const { data: billingHistory } = useQuery<BillingHistoryResponse>({
    queryKey: ['/api/billing/history'],
    queryFn: async () => {
      const response = await fetch('/api/billing/history');
      if (!response.ok) throw new Error('Failed to fetch billing history');
      return response.json();
    },
  });

  const historyItems = billingHistory?.history ?? [];

  const subscription = subscriptionData?.subscription;
  const usage = subscriptionData?.usage
    ? {
        vehiclesUsed: subscriptionData.usage.activeVehiclesCount,
        emergencyRepairsUsed: subscriptionData.usage.emergencyRepairsCount,
        scheduledServicesUsed: subscriptionData.usage.scheduledServicesCount,
        overageCharges: 0,
        usagePercentage: {
          vehicles: 0,
          emergencyRepairs: 0,
          scheduledServices: 0,
        },
      }
    : subscription?.currentUsage;

  // Update subscription mutation
  const updateSubscriptionMutation = useMutation({
    mutationFn: async ({ planType }: { planType: string }) => {
      return await apiRequest(`/api/billing/subscriptions/${subscription?.id}`, {
        method: 'PUT',
        body: JSON.stringify({ planType }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/billing/my-subscription'] });
      toast({
        title: 'Success',
        description: 'Your subscription has been updated',
      });
      setShowUpgradeDialog(false);
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to update subscription',
        variant: 'destructive',
      });
    },
  });

  // Cancel subscription mutation
  const cancelSubscriptionMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest(`/api/billing/subscriptions/${subscription?.id}/cancel`, {
        method: 'POST',
        body: JSON.stringify({ immediately: false, reason: cancelReason }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/billing/my-subscription'] });
      toast({
        title: 'Subscription Cancelled',
        description: 'Your subscription will end at the current billing period',
      });
      setShowCancelDialog(false);
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to cancel subscription',
        variant: 'destructive',
      });
    },
  });

  // Update payment method mutation
  const updatePaymentMethodMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest(`/api/billing/subscriptions/${subscription?.id}/payment-method`, {
        method: 'PUT',
        body: JSON.stringify({ paymentMethodId: newPaymentMethod }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/billing/my-subscription'] });
      toast({
        title: 'Success',
        description: 'Payment method updated successfully',
      });
      setShowPaymentDialog(false);
      setNewPaymentMethod('');
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to update payment method',
        variant: 'destructive',
      });
    },
  });

  const currentPlan = subscription?.planType ? PLAN_DETAILS[subscription.planType as keyof typeof PLAN_DETAILS] : null;
  const nextBillingDate = subscription?.nextBillingDate ?? subscription?.currentPeriodEnd ?? null;

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { variant: 'default' as const, icon: CheckCircle, text: 'Active' },
      paused: { variant: 'secondary' as const, icon: Clock, text: 'Paused' },
      cancelled: { variant: 'destructive' as const, icon: AlertCircle, text: 'Cancelled' },
      past_due: { variant: 'destructive' as const, icon: AlertCircle, text: 'Past Due' },
      trialing: { variant: 'outline' as const, icon: Clock, text: 'Trial' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.active;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="w-3 h-3" />
        {config.text}
      </Badge>
    );
  };

  const calculateSavings = () => {
    if (!subscription || !usage) return 0;
    
    // Calculate what would be charged without subscription
    const perServiceCost = 75; // Example: $75 per service without subscription
    const totalServicesCost = (usage.emergencyRepairsUsed + usage.scheduledServicesUsed) * perServiceCost;
    const subscriptionCost = parseFloat(subscription.baseAmount);
    
    return Math.max(0, totalServicesCost - subscriptionCost);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading billing information...</div>
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>No Active Subscription</CardTitle>
            <CardDescription>
              Your fleet doesn't have an active billing subscription. Contact your administrator to set up a subscription plan.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full">
              <CreditCard className="w-4 h-4 mr-2" />
              Contact Administrator
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const maxVehiclesLimit = subscription.maxVehicles ?? 0;
  const emergencyIncluded = subscription.includedEmergencyRepairs ?? 0;
  const scheduledIncluded = subscription.includedScheduledServices ?? 0;
  const addOns = Array.isArray(subscription.addOns)
    ? (subscription.addOns as Array<string | { id?: string; name?: string; description?: string }>)
    : [];

  return (
    <div className="container mx-auto px-3 py-4 sm:px-4 sm:py-6 md:px-6 md:py-8 space-y-4 sm:space-y-6 md:space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold" data-testid="text-page-title">Billing & Subscription</h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">Manage your fleet subscription and billing</p>
      </div>

      {/* Current Plan Overview */}
      <Card>
        <CardHeader className="px-3 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
            <div>
              <CardTitle className="text-lg sm:text-xl">Current Subscription</CardTitle>
              <CardDescription className="text-xs sm:text-sm">Your active billing plan and usage</CardDescription>
            </div>
            {getStatusBadge(subscription.status)}
          </div>
        </CardHeader>
        <CardContent className="space-y-4 sm:space-y-6 px-3 sm:px-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
            <div>
              <p className="text-xs sm:text-sm text-muted-foreground">Plan</p>
              <p className="text-lg sm:text-xl md:text-2xl font-bold">{subscription.planName}</p>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                ${subscription.baseAmount}/{subscription.billingCycle}
              </p>
            </div>
            <div>
              <p className="text-xs sm:text-sm text-muted-foreground">Next Billing Date</p>
              <p className="text-sm sm:text-base md:text-lg font-semibold">
                {nextBillingDate ? format(new Date(nextBillingDate), 'MMM d, yyyy') : 'N/A'}
              </p>
            </div>
            <div className="sm:col-span-2 md:col-span-1">
              <p className="text-xs sm:text-sm text-muted-foreground">Monthly Savings</p>
              <p className="text-sm sm:text-base md:text-lg font-semibold text-green-600 dark:text-green-400">
                ${calculateSavings().toFixed(2)}
              </p>
            </div>
          </div>

          <Separator />

          {/* Usage Overview */}
          <div className="space-y-4">
            <h4 className="font-semibold">Current Period Usage</h4>
            
            {/* Vehicles */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-muted-foreground" />
                  <span>Vehicles</span>
                </div>
                <span className="font-medium">
                  {usage?.vehiclesUsed || 0} / {maxVehiclesLimit === 999999 ? 'Unlimited' : maxVehiclesLimit}
                </span>
              </div>
              {maxVehiclesLimit !== 999999 && maxVehiclesLimit > 0 && (
                <Progress
                  value={((usage?.vehiclesUsed || 0) / maxVehiclesLimit) * 100}
                  className="h-2"
                />
              )}
            </div>

            {/* Emergency Repairs */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-muted-foreground" />
                  <span>Emergency Repairs</span>
                </div>
                <span className="font-medium">
                  {usage?.emergencyRepairsUsed || 0} / {emergencyIncluded === 999999 ? 'Unlimited' : emergencyIncluded}
                </span>
              </div>
              {emergencyIncluded !== 999999 && emergencyIncluded > 0 && (
                <Progress
                  value={((usage?.emergencyRepairsUsed || 0) / emergencyIncluded) * 100}
                  className="h-2"
                />
              )}
            </div>

            {/* Scheduled Services */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-muted-foreground" />
                  <span>Scheduled Services</span>
                </div>
                <span className="font-medium">
                  {usage?.scheduledServicesUsed || 0} / {scheduledIncluded === 999999 ? 'Unlimited' : scheduledIncluded}
                </span>
              </div>
              {scheduledIncluded !== 999999 && scheduledIncluded > 0 && (
                <Progress
                  value={((usage?.scheduledServicesUsed || 0) / scheduledIncluded) * 100}
                  className="h-2"
                />
              )}
            </div>

            {/* Usage Alerts */}
            {usage && maxVehiclesLimit > 0 && maxVehiclesLimit !== 999999 && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Vehicle Limit Alert</AlertTitle>
                <AlertDescription>
                  You're using {Math.round((usage.vehiclesUsed / maxVehiclesLimit) * 100)}% of your vehicle limit. Consider upgrading your plan.
                </AlertDescription>
              </Alert>
            )}
          </div>

          <Separator />

          {/* Plan Features */}
          <div className="space-y-3">
            <h4 className="font-semibold">Plan Features</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {subscription.prioritySupport && (
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                  <span className="text-sm">Priority Support</span>
                </div>
              )}
              {subscription.dedicatedAccountManager && (
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                  <span className="text-sm">Dedicated Account Manager</span>
                </div>
              )}
              {addOns.map((addon, index) => {
                const label = typeof addon === 'string' ? addon : addon.name;
                const key = typeof addon === 'string' ? addon : addon.id || addon.name || `addon-${index}`;
                if (!label) return null;
                return (
                  <div key={key} className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                    <span className="text-sm">{label.replace(/_/g, ' ')}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row gap-2 px-3 sm:px-6">
          <Button
            variant="outline"
            onClick={() => setShowUpgradeDialog(true)}
            className="w-full sm:w-auto"
            data-testid="button-change-plan"
          >
            Change Plan
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowPaymentDialog(true)}
            className="w-full sm:w-auto"
            data-testid="button-payment-method"
          >
            <CreditCard className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
            Payment Method
          </Button>
          <Button
            variant="outline"
            className="text-destructive w-full sm:w-auto"
            onClick={() => setShowCancelDialog(true)}
            data-testid="button-cancel-subscription"
          >
            Cancel Subscription
          </Button>
        </CardFooter>
      </Card>

      {/* Billing History */}
      <Card>
        <CardHeader className="px-3 sm:px-6">
          <CardTitle className="text-lg sm:text-xl">Billing History</CardTitle>
          <CardDescription className="text-xs sm:text-sm">View your past invoices and payments</CardDescription>
        </CardHeader>
        <CardContent className="px-3 sm:px-6">
          {historyItems.length > 0 ? (
            <div className="overflow-x-auto -mx-3 sm:-mx-6">
              <div className="min-w-[500px] px-3 sm:px-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs sm:text-sm">Date</TableHead>
                      <TableHead className="hidden sm:table-cell text-xs sm:text-sm">Period</TableHead>
                      <TableHead className="text-xs sm:text-sm">Amount</TableHead>
                      <TableHead className="text-xs sm:text-sm">Status</TableHead>
                      <TableHead className="text-xs sm:text-sm">Invoice</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                {historyItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="text-xs sm:text-sm">
                      {format(new Date(item.billingDate), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-xs sm:text-sm">
                      {format(new Date(item.billingPeriodStart), 'MMM d')} - 
                      {format(new Date(item.billingPeriodEnd), 'MMM d')}
                    </TableCell>
                    <TableCell className="font-semibold text-xs sm:text-sm">
                      ${item.totalAmount}
                    </TableCell>
                    <TableCell>
                      {item.status === 'success' ? (
                        <Badge variant="default" className="gap-1">
                          <CheckCircle className="w-3 h-3" />
                          Paid
                        </Badge>
                      ) : item.status === 'failed' ? (
                        <Badge variant="destructive" className="gap-1">
                          <AlertCircle className="w-3 h-3" />
                          Failed
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="gap-1">
                          <Clock className="w-3 h-3" />
                          Pending
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm">
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
                </Table>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No billing history available
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upgrade/Downgrade Dialog */}
      <Dialog open={showUpgradeDialog} onOpenChange={setShowUpgradeDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Change Subscription Plan</DialogTitle>
            <DialogDescription>
              Select a plan that best fits your fleet's needs
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-4">
            {Object.entries(PLAN_DETAILS).filter(([key]) => key !== 'custom').map(([key, plan]) => {
              const isCurrentPlan = subscription?.planType === key;
              return (
                <Card
                  key={key}
                  className={`cursor-pointer transition-all ${
                    selectedPlan === key ? 'ring-2 ring-primary' : ''
                  } ${isCurrentPlan ? 'opacity-60' : ''}`}
                  onClick={() => !isCurrentPlan && setSelectedPlan(key as any)}
                >
                  <CardHeader>
                    <CardTitle className="text-lg">{plan.name}</CardTitle>
                    <div className="text-2xl font-bold">
                      ${plan.price}<span className="text-sm font-normal">/month</span>
                    </div>
                    {isCurrentPlan && (
                      <Badge variant="secondary">Current Plan</Badge>
                    )}
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                        Up to {plan.features.maxVehicles === 999999 ? 'Unlimited' : plan.features.maxVehicles} vehicles
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                        {plan.features.includedEmergencyRepairs === 999999 ? 'Unlimited' : plan.features.includedEmergencyRepairs} emergency repairs
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                        {plan.features.includedScheduledServices === 999999 ? 'Unlimited' : plan.features.includedScheduledServices} scheduled services
                      </li>
                      {plan.features.prioritySupport && (
                        <li className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                          Priority support
                        </li>
                      )}
                      {plan.features.dedicatedAccountManager && (
                        <li className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                          Dedicated account manager
                        </li>
                      )}
                    </ul>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUpgradeDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => selectedPlan && updateSubscriptionMutation.mutate({ planType: selectedPlan })}
              disabled={!selectedPlan || updateSubscriptionMutation.isPending}
              data-testid="button-confirm-change"
            >
              {updateSubscriptionMutation.isPending ? 'Updating...' : 'Change Plan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Subscription Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Subscription</DialogTitle>
            <DialogDescription>
              Your subscription will remain active until the end of your current billing period.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Important</AlertTitle>
              <AlertDescription>
                After cancellation:
                <ul className="mt-2 space-y-1 text-sm">
                  <li>• You'll lose access to all included services</li>
                  <li>• Your fleet will need to pay per service</li>
                  <li>• You can reactivate anytime</li>
                </ul>
              </AlertDescription>
            </Alert>

            <div>
              <Label htmlFor="reason">Cancellation Reason (Optional)</Label>
              <Input
                id="reason"
                placeholder="Please let us know why you're cancelling..."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                data-testid="input-cancel-reason"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCancelDialog(false)}>
              Keep Subscription
            </Button>
            <Button
              variant="destructive"
              onClick={() => cancelSubscriptionMutation.mutate()}
              disabled={cancelSubscriptionMutation.isPending}
              data-testid="button-confirm-cancel"
            >
              {cancelSubscriptionMutation.isPending ? 'Cancelling...' : 'Cancel Subscription'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment Method Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Payment Method</DialogTitle>
            <DialogDescription>
              Enter your new Stripe payment method ID
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="paymentMethod">Payment Method ID</Label>
              <Input
                id="paymentMethod"
                placeholder="pm_..."
                value={newPaymentMethod}
                onChange={(e) => setNewPaymentMethod(e.target.value)}
                data-testid="input-payment-method"
              />
              <p className="text-xs text-muted-foreground mt-2">
                You can get this ID from your Stripe dashboard or payment integration
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPaymentDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => updatePaymentMethodMutation.mutate()}
              disabled={!newPaymentMethod || updatePaymentMethodMutation.isPending}
              data-testid="button-update-payment"
            >
              {updatePaymentMethodMutation.isPending ? 'Updating...' : 'Update Payment Method'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
