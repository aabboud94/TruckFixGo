import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { 
  FileText, 
  Plus, 
  Calendar, 
  DollarSign, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  TrendingUp, 
  Building, 
  Shield, 
  Settings,
  ChevronRight,
  RefreshCcw,
  Edit,
  FileSignature,
  BarChart,
  Target,
  AlertTriangle,
  Award,
  Eye,
  Download
} from 'lucide-react';

type ContractStatus = 'draft' | 'active' | 'suspended' | 'terminated' | 'expired';
type SlaMetricType = 'response_time' | 'arrival_time' | 'completion_time' | 'uptime_guarantee' | 'contractor_rating' | 'first_fix_rate' | 'resolution_time' | 'uptime';

interface FleetContract {
  id: string;
  contractNumber: string;
  fleetAccountId: string;
  contractName: string;
  startDate: string;
  endDate: string;
  contractValue: string;
  status: ContractStatus;
  templateType?: string;
  slaTerms?: any;
  guaranteedResponseTime?: number;
  uptimeCommitment?: number;
  priorityLevel?: number;
  autoRenew?: boolean;
  createdAt: string;
  fleetAccount?: {
    companyName: string;
  };
  slaMetrics?: ContractSlaMetric[];
  penalties?: ContractPenalty[];
}

interface ContractSlaMetric {
  id: string;
  metricType: SlaMetricType;
  metricName: string;
  targetValue: number;
  targetUnit: string;
  measurementPeriod: string;
  penaltyEnabled: boolean;
  penaltyAmount?: number;
  isActive: boolean;
}

interface ContractPenalty {
  id: string;
  amount: string;
  reason: string;
  status: string;
  createdAt: string;
}

interface ContractStatistics {
  totalContracts: number;
  valueByStatus: { status: string; value: string }[];
  expiringCount: number;
  avgComplianceRate: number;
  expiringContracts: FleetContract[];
}

interface FleetAccount {
  id: string;
  companyName: string;
  contactName: string;
  contactEmail: string;
  vehicleCount: number;
}

export default function AdminContracts() {
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedContract, setSelectedContract] = useState<FleetContract | null>(null);
  const [wizardStep, setWizardStep] = useState(1);
  const [contractForm, setContractForm] = useState({
    fleetAccountId: '',
    contractName: '',
    templateType: 'basic_enterprise',
    startDate: format(new Date(), 'yyyy-MM-dd'),
    endDate: format(new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
    contractValue: '',
    billingFrequency: 'monthly',
    paymentTerms: 30,
    guaranteedResponseTime: 120,
    guaranteedResolutionTime: 240,
    uptimeCommitment: 99,
    priorityLevel: 2,
    dedicatedAccountManager: false,
    autoRenew: false,
    renewalNotificationDays: 90,
    coverageZones: [] as string[],
    serviceHours: '24/7',
    notes: ''
  });
  const [customSlaMetrics, setCustomSlaMetrics] = useState<any[]>([]);

  // Fetch contracts
  const { data: contracts = [], isLoading: contractsLoading } = useQuery({
    queryKey: ['/api/contracts'],
  });

  // Fetch statistics
  const { data: statistics, isLoading: statsLoading } = useQuery<ContractStatistics>({
    queryKey: ['/api/contracts/statistics'],
  });

  // Fetch fleet accounts for selection
  const { data: fleetAccounts = [] } = useQuery<FleetAccount[]>({
    queryKey: ['/api/admin/fleets'],
  });

  // Create contract mutation
  const createContractMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest('/api/contracts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/contracts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/contracts/statistics'] });
      toast({
        title: 'Contract created',
        description: 'The contract has been created successfully'
      });
      setIsCreateDialogOpen(false);
      resetForm();
    },
    onError: () => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to create contract'
      });
    }
  });

  // Activate contract mutation
  const activateContractMutation = useMutation({
    mutationFn: async (contractId: string) => {
      return apiRequest(`/api/contracts/${contractId}/activate`, {
        method: 'POST'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/contracts'] });
      toast({
        title: 'Contract activated',
        description: 'The contract is now active'
      });
    }
  });

  // Renew contract mutation
  const renewContractMutation = useMutation({
    mutationFn: async (contractId: string) => {
      return apiRequest(`/api/contracts/${contractId}/renew`, {
        method: 'POST'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/contracts'] });
      toast({
        title: 'Contract renewed',
        description: 'A renewal contract has been created'
      });
    }
  });

  const resetForm = () => {
    setWizardStep(1);
    setContractForm({
      fleetAccountId: '',
      contractName: '',
      templateType: 'basic_enterprise',
      startDate: format(new Date(), 'yyyy-MM-dd'),
      endDate: format(new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
      contractValue: '',
      billingFrequency: 'monthly',
      paymentTerms: 30,
      guaranteedResponseTime: 120,
      guaranteedResolutionTime: 240,
      uptimeCommitment: 99,
      priorityLevel: 2,
      dedicatedAccountManager: false,
      autoRenew: false,
      renewalNotificationDays: 90,
      coverageZones: [],
      serviceHours: '24/7',
      notes: ''
    });
    setCustomSlaMetrics([]);
  };

  const handleCreateContract = () => {
    const slaTerms = {
      responseTime: contractForm.guaranteedResponseTime,
      resolutionTime: contractForm.guaranteedResolutionTime,
      uptime: contractForm.uptimeCommitment,
      customMetrics: customSlaMetrics
    };

    createContractMutation.mutate({
      ...contractForm,
      contractValue: contractForm.contractValue.toString(),
      slaTerms,
      status: 'draft'
    });
  };

  const addCustomSlaMetric = () => {
    setCustomSlaMetrics([
      ...customSlaMetrics,
      {
        metricType: 'response_time',
        metricName: '',
        targetValue: 0,
        targetUnit: 'minutes',
        measurementPeriod: 'monthly',
        penaltyEnabled: false,
        penaltyAmount: 0
      }
    ]);
  };

  const updateCustomSlaMetric = (index: number, field: string, value: any) => {
    const updated = [...customSlaMetrics];
    updated[index] = { ...updated[index], [field]: value };
    setCustomSlaMetrics(updated);
  };

  const removeCustomSlaMetric = (index: number) => {
    setCustomSlaMetrics(customSlaMetrics.filter((_, i) => i !== index));
  };

  const getStatusBadgeVariant = (status: ContractStatus) => {
    switch (status) {
      case 'active': return 'default';
      case 'draft': return 'secondary';
      case 'expired': return 'destructive';
      case 'suspended': return 'outline';
      case 'terminated': return 'destructive';
      default: return 'secondary';
    }
  };

  const getTemplateDetails = (templateType: string) => {
    switch (templateType) {
      case 'basic_enterprise':
        return {
          name: 'Basic Enterprise',
          icon: <Shield className="w-5 h-5" />,
          features: ['99% Uptime', '2-hour Response', 'Standard Support', 'Monthly Reports']
        };
      case 'premium_enterprise':
        return {
          name: 'Premium Enterprise',
          icon: <Award className="w-5 h-5" />,
          features: ['99.9% Uptime', '30-min Response', 'Priority Support', 'Dedicated Manager', 'Real-time Analytics']
        };
      case 'custom':
        return {
          name: 'Custom Enterprise',
          icon: <Settings className="w-5 h-5" />,
          features: ['Custom SLAs', 'Negotiated Terms', 'Volume Discounts', 'Flexible Terms']
        };
      default:
        return null;
    }
  };

  const calculateDaysRemaining = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    const diff = Math.floor((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  if (contractsLoading || statsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading contracts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Contract Management</h1>
          <p className="text-muted-foreground mt-1">Manage enterprise fleet contracts and SLAs</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button size="lg" data-testid="button-create-contract">
              <Plus className="mr-2 h-5 w-5" />
              New Contract
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Fleet Contract</DialogTitle>
              <DialogDescription>
                Step {wizardStep} of 5 - {
                  wizardStep === 1 ? 'Fleet Selection' :
                  wizardStep === 2 ? 'Contract Terms' :
                  wizardStep === 3 ? 'SLA Configuration' :
                  wizardStep === 4 ? 'Additional Settings' :
                  'Review & Create'
                }
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Progress bar */}
              <Progress value={wizardStep * 20} />

              {/* Step 1: Fleet Selection */}
              {wizardStep === 1 && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="fleet">Select Fleet Account</Label>
                    <Select
                      value={contractForm.fleetAccountId}
                      onValueChange={(value) => setContractForm({ ...contractForm, fleetAccountId: value })}
                    >
                      <SelectTrigger id="fleet" data-testid="select-fleet">
                        <SelectValue placeholder="Choose a fleet account" />
                      </SelectTrigger>
                      <SelectContent>
                        {fleetAccounts.map((fleet) => (
                          <SelectItem key={fleet.id} value={fleet.id}>
                            {fleet.companyName} ({fleet.vehicleCount} vehicles)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="contractName">Contract Name</Label>
                    <Input
                      id="contractName"
                      value={contractForm.contractName}
                      onChange={(e) => setContractForm({ ...contractForm, contractName: e.target.value })}
                      placeholder="e.g., ABC Logistics 2025 Service Agreement"
                      data-testid="input-contract-name"
                    />
                  </div>
                  <div>
                    <Label>Contract Template</Label>
                    <div className="grid gap-4 mt-2">
                      {['basic_enterprise', 'premium_enterprise', 'custom'].map((template) => {
                        const details = getTemplateDetails(template);
                        return (
                          <Card
                            key={template}
                            className={`cursor-pointer transition-colors ${
                              contractForm.templateType === template ? 'border-primary bg-accent/10' : ''
                            }`}
                            onClick={() => setContractForm({ ...contractForm, templateType: template })}
                            data-testid={`template-${template}`}
                          >
                            <CardHeader className="pb-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  {details?.icon}
                                  <CardTitle className="text-base">{details?.name}</CardTitle>
                                </div>
                                {contractForm.templateType === template && (
                                  <CheckCircle className="w-5 h-5 text-primary" />
                                )}
                              </div>
                            </CardHeader>
                            <CardContent>
                              <ul className="text-sm text-muted-foreground space-y-1">
                                {details?.features.map((feature, idx) => (
                                  <li key={idx} className="flex items-center gap-2">
                                    <ChevronRight className="w-3 h-3" />
                                    {feature}
                                  </li>
                                ))}
                              </ul>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Contract Terms */}
              {wizardStep === 2 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="startDate">Start Date</Label>
                      <Input
                        id="startDate"
                        type="date"
                        value={contractForm.startDate}
                        onChange={(e) => setContractForm({ ...contractForm, startDate: e.target.value })}
                        data-testid="input-start-date"
                      />
                    </div>
                    <div>
                      <Label htmlFor="endDate">End Date</Label>
                      <Input
                        id="endDate"
                        type="date"
                        value={contractForm.endDate}
                        onChange={(e) => setContractForm({ ...contractForm, endDate: e.target.value })}
                        data-testid="input-end-date"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="contractValue">Annual Contract Value ($)</Label>
                    <Input
                      id="contractValue"
                      type="number"
                      value={contractForm.contractValue}
                      onChange={(e) => setContractForm({ ...contractForm, contractValue: e.target.value })}
                      placeholder="150000"
                      data-testid="input-contract-value"
                    />
                  </div>
                  <div>
                    <Label htmlFor="billingFrequency">Billing Frequency</Label>
                    <Select
                      value={contractForm.billingFrequency}
                      onValueChange={(value) => setContractForm({ ...contractForm, billingFrequency: value })}
                    >
                      <SelectTrigger id="billingFrequency" data-testid="select-billing-frequency">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="quarterly">Quarterly</SelectItem>
                        <SelectItem value="annually">Annually</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="paymentTerms">Payment Terms (Days)</Label>
                    <Input
                      id="paymentTerms"
                      type="number"
                      value={contractForm.paymentTerms}
                      onChange={(e) => setContractForm({ ...contractForm, paymentTerms: parseInt(e.target.value) })}
                      data-testid="input-payment-terms"
                    />
                  </div>
                </div>
              )}

              {/* Step 3: SLA Configuration */}
              {wizardStep === 3 && (
                <div className="space-y-4">
                  <div>
                    <Label>Guaranteed Response Time (Minutes)</Label>
                    <div className="flex items-center gap-4 mt-2">
                      <Slider
                        value={[contractForm.guaranteedResponseTime]}
                        onValueChange={([value]) => setContractForm({ ...contractForm, guaranteedResponseTime: value })}
                        min={15}
                        max={480}
                        step={15}
                        className="flex-1"
                        data-testid="slider-response-time"
                      />
                      <span className="w-20 text-right font-medium">
                        {contractForm.guaranteedResponseTime} min
                      </span>
                    </div>
                  </div>
                  <div>
                    <Label>Guaranteed Resolution Time (Minutes)</Label>
                    <div className="flex items-center gap-4 mt-2">
                      <Slider
                        value={[contractForm.guaranteedResolutionTime]}
                        onValueChange={([value]) => setContractForm({ ...contractForm, guaranteedResolutionTime: value })}
                        min={60}
                        max={1440}
                        step={30}
                        className="flex-1"
                        data-testid="slider-resolution-time"
                      />
                      <span className="w-20 text-right font-medium">
                        {Math.floor(contractForm.guaranteedResolutionTime / 60)}h {contractForm.guaranteedResolutionTime % 60}m
                      </span>
                    </div>
                  </div>
                  <div>
                    <Label>Uptime Commitment (%)</Label>
                    <div className="flex items-center gap-4 mt-2">
                      <Slider
                        value={[contractForm.uptimeCommitment]}
                        onValueChange={([value]) => setContractForm({ ...contractForm, uptimeCommitment: value })}
                        min={95}
                        max={99.99}
                        step={0.1}
                        className="flex-1"
                        data-testid="slider-uptime"
                      />
                      <span className="w-20 text-right font-medium">
                        {contractForm.uptimeCommitment}%
                      </span>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="serviceHours">Service Hours</Label>
                    <Select
                      value={contractForm.serviceHours}
                      onValueChange={(value) => setContractForm({ ...contractForm, serviceHours: value })}
                    >
                      <SelectTrigger id="serviceHours" data-testid="select-service-hours">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="24/7">24/7 Support</SelectItem>
                        <SelectItem value="business">Business Hours (8am-6pm)</SelectItem>
                        <SelectItem value="extended">Extended Hours (6am-10pm)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Custom SLA Metrics */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label>Custom SLA Metrics</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addCustomSlaMetric}
                        data-testid="button-add-sla-metric"
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Add Metric
                      </Button>
                    </div>
                    {customSlaMetrics.length > 0 && (
                      <div className="space-y-3">
                        {customSlaMetrics.map((metric, index) => (
                          <Card key={index} className="p-4">
                            <div className="space-y-3">
                              <div className="flex gap-2">
                                <Input
                                  placeholder="Metric name"
                                  value={metric.metricName}
                                  onChange={(e) => updateCustomSlaMetric(index, 'metricName', e.target.value)}
                                  data-testid={`input-metric-name-${index}`}
                                />
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => removeCustomSlaMetric(index)}
                                  data-testid={`button-remove-metric-${index}`}
                                >
                                  <AlertCircle className="w-4 h-4" />
                                </Button>
                              </div>
                              <div className="grid grid-cols-3 gap-2">
                                <Input
                                  type="number"
                                  placeholder="Target value"
                                  value={metric.targetValue}
                                  onChange={(e) => updateCustomSlaMetric(index, 'targetValue', parseFloat(e.target.value))}
                                  data-testid={`input-target-value-${index}`}
                                />
                                <Select
                                  value={metric.targetUnit}
                                  onValueChange={(value) => updateCustomSlaMetric(index, 'targetUnit', value)}
                                >
                                  <SelectTrigger data-testid={`select-unit-${index}`}>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="minutes">Minutes</SelectItem>
                                    <SelectItem value="hours">Hours</SelectItem>
                                    <SelectItem value="percentage">Percentage</SelectItem>
                                  </SelectContent>
                                </Select>
                                <div className="flex items-center gap-2">
                                  <Switch
                                    checked={metric.penaltyEnabled}
                                    onCheckedChange={(checked) => updateCustomSlaMetric(index, 'penaltyEnabled', checked)}
                                    data-testid={`switch-penalty-${index}`}
                                  />
                                  <Label className="text-xs">Penalty</Label>
                                </div>
                              </div>
                              {metric.penaltyEnabled && (
                                <Input
                                  type="number"
                                  placeholder="Penalty amount ($)"
                                  value={metric.penaltyAmount}
                                  onChange={(e) => updateCustomSlaMetric(index, 'penaltyAmount', parseFloat(e.target.value))}
                                  data-testid={`input-penalty-amount-${index}`}
                                />
                              )}
                            </div>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Step 4: Additional Settings */}
              {wizardStep === 4 && (
                <div className="space-y-4">
                  <div>
                    <Label>Priority Level</Label>
                    <Select
                      value={contractForm.priorityLevel.toString()}
                      onValueChange={(value) => setContractForm({ ...contractForm, priorityLevel: parseInt(value) })}
                    >
                      <SelectTrigger data-testid="select-priority">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Priority 1 - Standard</SelectItem>
                        <SelectItem value="2">Priority 2 - High</SelectItem>
                        <SelectItem value="3">Priority 3 - Critical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={contractForm.dedicatedAccountManager}
                      onCheckedChange={(checked) => setContractForm({ ...contractForm, dedicatedAccountManager: checked })}
                      data-testid="switch-dedicated-manager"
                    />
                    <Label>Dedicated Account Manager</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={contractForm.autoRenew}
                      onCheckedChange={(checked) => setContractForm({ ...contractForm, autoRenew: checked })}
                      data-testid="switch-auto-renew"
                    />
                    <Label>Auto-Renewal</Label>
                  </div>
                  {contractForm.autoRenew && (
                    <div>
                      <Label htmlFor="renewalDays">Renewal Notification (Days Before Expiry)</Label>
                      <Input
                        id="renewalDays"
                        type="number"
                        value={contractForm.renewalNotificationDays}
                        onChange={(e) => setContractForm({ ...contractForm, renewalNotificationDays: parseInt(e.target.value) })}
                        data-testid="input-renewal-days"
                      />
                    </div>
                  )}
                  <div>
                    <Label htmlFor="notes">Additional Notes</Label>
                    <Textarea
                      id="notes"
                      value={contractForm.notes}
                      onChange={(e) => setContractForm({ ...contractForm, notes: e.target.value })}
                      rows={4}
                      placeholder="Any additional terms, conditions, or notes..."
                      data-testid="textarea-notes"
                    />
                  </div>
                </div>
              )}

              {/* Step 5: Review & Create */}
              {wizardStep === 5 && (
                <div className="space-y-4">
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Review Contract Details</AlertTitle>
                    <AlertDescription>
                      Please review all details before creating the contract
                    </AlertDescription>
                  </Alert>
                  
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Fleet Account:</span>
                        <p className="font-medium">
                          {fleetAccounts.find(f => f.id === contractForm.fleetAccountId)?.companyName}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Contract Name:</span>
                        <p className="font-medium">{contractForm.contractName}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Template:</span>
                        <p className="font-medium">{getTemplateDetails(contractForm.templateType)?.name}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Contract Value:</span>
                        <p className="font-medium">${parseFloat(contractForm.contractValue || '0').toLocaleString()}/year</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Start Date:</span>
                        <p className="font-medium">{format(new Date(contractForm.startDate), 'PP')}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">End Date:</span>
                        <p className="font-medium">{format(new Date(contractForm.endDate), 'PP')}</p>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div className="space-y-2">
                      <h4 className="font-medium">SLA Terms</h4>
                      <ul className="text-sm space-y-1 text-muted-foreground">
                        <li>• Response Time: {contractForm.guaranteedResponseTime} minutes</li>
                        <li>• Resolution Time: {Math.floor(contractForm.guaranteedResolutionTime / 60)} hours</li>
                        <li>• Uptime Commitment: {contractForm.uptimeCommitment}%</li>
                        <li>• Service Hours: {contractForm.serviceHours}</li>
                        {customSlaMetrics.length > 0 && (
                          <>
                            <li className="font-medium text-foreground mt-2">Custom Metrics:</li>
                            {customSlaMetrics.map((metric, idx) => (
                              <li key={idx}>
                                • {metric.metricName}: {metric.targetValue} {metric.targetUnit}
                                {metric.penaltyEnabled && ` (Penalty: $${metric.penaltyAmount})`}
                              </li>
                            ))}
                          </>
                        )}
                      </ul>
                    </div>
                    
                    <Separator />
                    
                    <div className="space-y-2">
                      <h4 className="font-medium">Additional Settings</h4>
                      <ul className="text-sm space-y-1 text-muted-foreground">
                        <li>• Priority Level: {contractForm.priorityLevel}</li>
                        <li>• Dedicated Account Manager: {contractForm.dedicatedAccountManager ? 'Yes' : 'No'}</li>
                        <li>• Auto-Renewal: {contractForm.autoRenew ? 'Yes' : 'No'}</li>
                        {contractForm.autoRenew && (
                          <li>• Renewal Notification: {contractForm.renewalNotificationDays} days before expiry</li>
                        )}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <DialogFooter>
              <div className="flex justify-between w-full">
                <div>
                  {wizardStep > 1 && (
                    <Button
                      variant="outline"
                      onClick={() => setWizardStep(wizardStep - 1)}
                      data-testid="button-prev-step"
                    >
                      Previous
                    </Button>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setIsCreateDialogOpen(false);
                      resetForm();
                    }}
                    data-testid="button-cancel"
                  >
                    Cancel
                  </Button>
                  {wizardStep < 5 ? (
                    <Button
                      onClick={() => setWizardStep(wizardStep + 1)}
                      disabled={
                        (wizardStep === 1 && (!contractForm.fleetAccountId || !contractForm.contractName)) ||
                        (wizardStep === 2 && !contractForm.contractValue)
                      }
                      data-testid="button-next-step"
                    >
                      Next
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  ) : (
                    <Button
                      onClick={handleCreateContract}
                      disabled={createContractMutation.isPending}
                      data-testid="button-create"
                    >
                      {createContractMutation.isPending ? 'Creating...' : 'Create Contract'}
                    </Button>
                  )}
                </div>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Contracts</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="stat-active-contracts">
                {statistics.totalContracts}
              </div>
              <p className="text-xs text-muted-foreground">
                {statistics.expiringCount} expiring soon
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Contract Value</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="stat-total-value">
                ${statistics.valueByStatus.reduce((sum, v) => sum + parseFloat(v.value), 0).toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">Annual recurring</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">SLA Compliance</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="stat-compliance">
                {statistics.avgComplianceRate.toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground">Last 30 days average</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600" data-testid="stat-expiring">
                {statistics.expiringCount}
              </div>
              <p className="text-xs text-muted-foreground">Within 90 days</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Contracts Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Contracts</CardTitle>
          <CardDescription>Manage and monitor fleet service contracts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <ScrollArea className="h-[600px]">
              <div className="space-y-2">
                {contracts.map((contract: FleetContract) => {
                  const daysRemaining = calculateDaysRemaining(contract.endDate);
                  const isExpiringSoon = daysRemaining <= 90 && daysRemaining > 0;
                  const isExpired = daysRemaining <= 0;
                  
                  return (
                    <Card key={contract.id} className="p-4" data-testid={`contract-${contract.id}`}>
                      <div className="flex items-center justify-between">
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-base">
                              {contract.contractName}
                            </h3>
                            <Badge variant={getStatusBadgeVariant(contract.status)}>
                              {contract.status}
                            </Badge>
                            {contract.priorityLevel && contract.priorityLevel >= 3 && (
                              <Badge variant="destructive">Priority {contract.priorityLevel}</Badge>
                            )}
                            {contract.autoRenew && (
                              <Badge variant="outline">
                                <RefreshCcw className="w-3 h-3 mr-1" />
                                Auto-Renew
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Building className="w-3 h-3" />
                              {contract.fleetAccount?.companyName}
                            </span>
                            <span>Contract #{contract.contractNumber}</span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {format(new Date(contract.startDate), 'MMM d, yyyy')} - {format(new Date(contract.endDate), 'MMM d, yyyy')}
                            </span>
                            <span className="flex items-center gap-1">
                              <DollarSign className="w-3 h-3" />
                              ${parseFloat(contract.contractValue).toLocaleString()}/year
                            </span>
                          </div>
                          {contract.slaMetrics && contract.slaMetrics.length > 0 && (
                            <div className="flex gap-2 mt-2">
                              {contract.slaMetrics.slice(0, 3).map((metric) => (
                                <Badge key={metric.id} variant="secondary" className="text-xs">
                                  {metric.metricName}: {metric.targetValue}{metric.targetUnit}
                                </Badge>
                              ))}
                              {contract.slaMetrics.length > 3 && (
                                <Badge variant="secondary" className="text-xs">
                                  +{contract.slaMetrics.length - 3} more
                                </Badge>
                              )}
                            </div>
                          )}
                          {isExpiringSoon && !isExpired && (
                            <Alert className="mt-2 py-2">
                              <AlertTriangle className="h-4 w-4" />
                              <AlertDescription className="text-xs">
                                Contract expires in {daysRemaining} days
                              </AlertDescription>
                            </Alert>
                          )}
                          {isExpired && (
                            <Alert variant="destructive" className="mt-2 py-2">
                              <AlertCircle className="h-4 w-4" />
                              <AlertDescription className="text-xs">
                                Contract expired {Math.abs(daysRemaining)} days ago
                              </AlertDescription>
                            </Alert>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedContract(contract)}
                            data-testid={`button-view-${contract.id}`}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          {contract.status === 'draft' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => activateContractMutation.mutate(contract.id)}
                              disabled={activateContractMutation.isPending}
                              data-testid={`button-activate-${contract.id}`}
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Activate
                            </Button>
                          )}
                          {(isExpiringSoon || isExpired) && contract.status === 'active' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => renewContractMutation.mutate(contract.id)}
                              disabled={renewContractMutation.isPending}
                              data-testid={`button-renew-${contract.id}`}
                            >
                              <RefreshCcw className="w-4 h-4 mr-1" />
                              Renew
                            </Button>
                          )}
                          <Button variant="ghost" size="sm" data-testid={`button-menu-${contract.id}`}>
                            <Edit className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </ScrollArea>
          </div>
        </CardContent>
      </Card>

      {/* View Contract Dialog */}
      {selectedContract && (
        <Dialog open={!!selectedContract} onOpenChange={() => setSelectedContract(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedContract.contractName}</DialogTitle>
              <DialogDescription>
                Contract #{selectedContract.contractNumber} • {selectedContract.fleetAccount?.companyName}
              </DialogDescription>
            </DialogHeader>
            <Tabs defaultValue="details" className="mt-4">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="sla">SLA Metrics</TabsTrigger>
                <TabsTrigger value="penalties">Penalties</TabsTrigger>
                <TabsTrigger value="performance">Performance</TabsTrigger>
              </TabsList>
              <TabsContent value="details" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Status</Label>
                    <div className="mt-1">
                      <Badge variant={getStatusBadgeVariant(selectedContract.status)}>
                        {selectedContract.status}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Contract Value</Label>
                    <p className="font-medium">${parseFloat(selectedContract.contractValue).toLocaleString()}/year</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Start Date</Label>
                    <p className="font-medium">{format(new Date(selectedContract.startDate), 'PP')}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">End Date</Label>
                    <p className="font-medium">{format(new Date(selectedContract.endDate), 'PP')}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Template Type</Label>
                    <p className="font-medium">{getTemplateDetails(selectedContract.templateType || 'custom')?.name}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Priority Level</Label>
                    <p className="font-medium">Priority {selectedContract.priorityLevel || 1}</p>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="sla" className="space-y-4">
                {selectedContract.slaMetrics?.map((metric) => (
                  <Card key={metric.id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">{metric.metricName}</CardTitle>
                        <Badge variant={metric.isActive ? 'default' : 'secondary'}>
                          {metric.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Target:</span>
                          <p className="font-medium">{metric.targetValue} {metric.targetUnit}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Period:</span>
                          <p className="font-medium">{metric.measurementPeriod}</p>
                        </div>
                        {metric.penaltyEnabled && (
                          <div>
                            <span className="text-muted-foreground">Penalty:</span>
                            <p className="font-medium">${metric.penaltyAmount}</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>
              <TabsContent value="penalties" className="space-y-4">
                {selectedContract.penalties && selectedContract.penalties.length > 0 ? (
                  selectedContract.penalties.map((penalty) => (
                    <Card key={penalty.id}>
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{penalty.reason}</p>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(penalty.createdAt), 'PPp')}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-destructive">
                              -${parseFloat(penalty.amount).toLocaleString()}
                            </p>
                            <Badge variant={penalty.status === 'applied' ? 'default' : 'secondary'}>
                              {penalty.status}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <p className="text-center text-muted-foreground py-8">No penalties recorded</p>
                )}
              </TabsContent>
              <TabsContent value="performance" className="space-y-4">
                <Alert>
                  <BarChart className="h-4 w-4" />
                  <AlertTitle>Performance Metrics</AlertTitle>
                  <AlertDescription>
                    Real-time performance tracking will be displayed here
                  </AlertDescription>
                </Alert>
              </TabsContent>
            </Tabs>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedContract(null)}>
                Close
              </Button>
              <Button>
                <Download className="w-4 h-4 mr-2" />
                Export Contract
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}