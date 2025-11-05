import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { 
  FileText, 
  Calendar, 
  DollarSign, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  TrendingUp, 
  Shield, 
  ChevronRight,
  RefreshCcw,
  Eye,
  Download,
  Target,
  AlertTriangle,
  Award,
  BarChart,
  FileSignature,
  MessageCircle,
  Activity,
  History,
  Receipt
} from 'lucide-react';

type ContractStatus = 'draft' | 'active' | 'suspended' | 'terminated' | 'expired';
type SlaMetricType = 'response_time' | 'arrival_time' | 'completion_time' | 'uptime' | 'first_fix_rate';

interface FleetContract {
  id: string;
  contractNumber: string;
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
  slaMetrics?: ContractSlaMetric[];
  penalties?: ContractPenalty[];
  amendments?: ContractAmendment[];
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
  status: 'pending' | 'applied' | 'waived' | 'disputed';
  waiverReason?: string;
  createdAt: string;
}

interface ContractAmendment {
  id: string;
  description: string;
  status: 'pending' | 'approved' | 'rejected';
  requestedDate: string;
  approvedDate?: string;
  newTerms?: any;
}

interface ContractPerformance {
  metrics: PerformanceMetric[];
  complianceRate: number;
}

interface PerformanceMetric {
  id: string;
  metricType: SlaMetricType;
  periodStart: string;
  periodEnd: string;
  measuredValue: number;
  targetValue: number;
  breached: boolean;
  penaltyApplied: boolean;
  penaltyAmount?: string;
}

export default function FleetContracts() {
  const { toast } = useToast();
  const [selectedContract, setSelectedContract] = useState<FleetContract | null>(null);
  const [isAmendmentDialogOpen, setIsAmendmentDialogOpen] = useState(false);
  const [isDisputeDialogOpen, setIsDisputeDialogOpen] = useState(false);
  const [selectedPenalty, setSelectedPenalty] = useState<ContractPenalty | null>(null);
  const [amendmentForm, setAmendmentForm] = useState({
    description: '',
    proposedChanges: ''
  });
  const [disputeForm, setDisputeForm] = useState({
    reason: '',
    details: ''
  });

  // Fetch fleet contracts
  const { data: contracts = [], isLoading: contractsLoading } = useQuery<FleetContract[]>({
    queryKey: ['/api/contracts'],
  });

  // Fetch contract performance when a contract is selected
  const { data: performance, isLoading: performanceLoading } = useQuery<ContractPerformance>({
    queryKey: [`/api/contracts/${selectedContract?.id}/performance`],
    enabled: !!selectedContract
  });

  // Request amendment mutation
  const requestAmendmentMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest(`/api/contracts/${selectedContract?.id}/amend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/contracts'] });
      toast({
        title: 'Amendment requested',
        description: 'Your amendment request has been submitted for review'
      });
      setIsAmendmentDialogOpen(false);
      setAmendmentForm({ description: '', proposedChanges: '' });
    },
    onError: () => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to submit amendment request'
      });
    }
  });

  // Dispute penalty mutation
  const disputePenaltyMutation = useMutation({
    mutationFn: async () => {
      return apiRequest(`/api/contracts/penalties/${selectedPenalty?.id}/waiver`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: disputeForm.reason })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/contracts'] });
      toast({
        title: 'Dispute submitted',
        description: 'Your penalty dispute has been submitted for review'
      });
      setIsDisputeDialogOpen(false);
      setDisputeForm({ reason: '', details: '' });
      setSelectedPenalty(null);
    },
    onError: () => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to submit dispute'
      });
    }
  });

  // Download contract
  const downloadContract = async (contractId: string) => {
    try {
      const response = await fetch(`/api/contracts/${contractId}/download`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `contract-${contractId}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast({
        title: 'Contract downloaded',
        description: 'The contract PDF has been downloaded'
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to download contract'
      });
    }
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

  const calculateDaysRemaining = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    const diff = Math.floor((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const getComplianceColor = (rate: number) => {
    if (rate >= 98) return 'text-green-600';
    if (rate >= 95) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (contractsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading contracts...</p>
        </div>
      </div>
    );
  }

  const activeContracts = contracts.filter(c => c.status === 'active');
  const totalValue = activeContracts.reduce((sum, c) => sum + parseFloat(c.contractValue), 0);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Contract Management</h1>
          <p className="text-muted-foreground mt-1">View and manage your service contracts</p>
        </div>
        <Button variant="outline" data-testid="button-contact-support">
          <MessageCircle className="mr-2 h-4 w-4" />
          Contact Support
        </Button>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Contracts</CardTitle>
            <FileSignature className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="stat-active-contracts">
              {activeContracts.length}
            </div>
            <p className="text-xs text-muted-foreground">
              {contracts.length} total contracts
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Annual Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="stat-annual-value">
              ${totalValue.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Across all active contracts</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg SLA Compliance</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="stat-compliance">
              98.5%
            </div>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Penalties</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600" data-testid="stat-penalties">
              $0
            </div>
            <p className="text-xs text-muted-foreground">0 unresolved</p>
          </CardContent>
        </Card>
      </div>

      {/* Contracts List */}
      <Card>
        <CardHeader>
          <CardTitle>Your Contracts</CardTitle>
          <CardDescription>Click on a contract to view details and performance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <ScrollArea className="h-[400px]">
              <div className="space-y-3">
                {contracts.map((contract) => {
                  const daysRemaining = calculateDaysRemaining(contract.endDate);
                  const isExpiringSoon = daysRemaining <= 90 && daysRemaining > 0;
                  
                  return (
                    <Card 
                      key={contract.id} 
                      className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                        selectedContract?.id === contract.id ? 'border-primary' : ''
                      }`}
                      onClick={() => setSelectedContract(contract)}
                      data-testid={`contract-${contract.id}`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold text-base">
                                {contract.contractName}
                              </h3>
                              <Badge variant={getStatusBadgeVariant(contract.status)}>
                                {contract.status}
                              </Badge>
                              {contract.priorityLevel && contract.priorityLevel >= 3 && (
                                <Badge variant="destructive">Priority</Badge>
                              )}
                              {contract.autoRenew && (
                                <Badge variant="outline">
                                  <RefreshCcw className="w-3 h-3 mr-1" />
                                  Auto-Renew
                                </Badge>
                              )}
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <FileText className="w-3 h-3" />
                                Contract #{contract.contractNumber}
                              </div>
                              <div className="flex items-center gap-1">
                                <DollarSign className="w-3 h-3" />
                                ${parseFloat(contract.contractValue).toLocaleString()}/year
                              </div>
                              <div className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {format(new Date(contract.startDate), 'MMM d, yyyy')} - {format(new Date(contract.endDate), 'MMM d, yyyy')}
                              </div>
                              <div className="flex items-center gap-1">
                                <Shield className="w-3 h-3" />
                                {contract.uptimeCommitment}% Uptime SLA
                              </div>
                            </div>
                            
                            {isExpiringSoon && (
                              <Alert className="mt-3">
                                <AlertTriangle className="h-4 w-4" />
                                <AlertDescription>
                                  Contract expires in {daysRemaining} days
                                </AlertDescription>
                              </Alert>
                            )}
                          </div>
                          
                          <ChevronRight className="w-5 h-5 text-muted-foreground" />
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </ScrollArea>
          </div>
        </CardContent>
      </Card>

      {/* Contract Details */}
      {selectedContract && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{selectedContract.contractName}</CardTitle>
                <CardDescription>Contract #{selectedContract.contractNumber}</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline"
                  onClick={() => downloadContract(selectedContract.id)}
                  data-testid="button-download-contract"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download PDF
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsAmendmentDialogOpen(true)}
                  data-testid="button-request-amendment"
                >
                  <FileSignature className="w-4 h-4 mr-2" />
                  Request Amendment
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="details" className="space-y-4">
              <TabsList className="grid w-full grid-cols-6">
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="sla">SLA Terms</TabsTrigger>
                <TabsTrigger value="performance">Performance</TabsTrigger>
                <TabsTrigger value="penalties">Penalties</TabsTrigger>
                <TabsTrigger value="invoices">Invoices</TabsTrigger>
                <TabsTrigger value="history">History</TabsTrigger>
              </TabsList>
              
              {/* Details Tab */}
              <TabsContent value="details" className="space-y-4">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-medium mb-3">Contract Information</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Status:</span>
                        <Badge variant={getStatusBadgeVariant(selectedContract.status)}>
                          {selectedContract.status}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Start Date:</span>
                        <span>{format(new Date(selectedContract.startDate), 'PP')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">End Date:</span>
                        <span>{format(new Date(selectedContract.endDate), 'PP')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Annual Value:</span>
                        <span className="font-medium">
                          ${parseFloat(selectedContract.contractValue).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Priority Level:</span>
                        <span>Level {selectedContract.priorityLevel || 1}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Auto-Renewal:</span>
                        <span>{selectedContract.autoRenew ? 'Enabled' : 'Disabled'}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-medium mb-3">Service Guarantees</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Response Time:</span>
                        <span>{selectedContract.guaranteedResponseTime} minutes</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Uptime Commitment:</span>
                        <span>{selectedContract.uptimeCommitment}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Template Type:</span>
                        <span className="capitalize">{selectedContract.templateType?.replace('_', ' ')}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {selectedContract.amendments && selectedContract.amendments.length > 0 && (
                  <div className="mt-6">
                    <h3 className="font-medium mb-3">Amendments</h3>
                    <div className="space-y-2">
                      {selectedContract.amendments.map((amendment) => (
                        <div key={amendment.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                          <div>
                            <p className="text-sm font-medium">{amendment.description}</p>
                            <p className="text-xs text-muted-foreground">
                              Requested: {format(new Date(amendment.requestedDate), 'PP')}
                            </p>
                          </div>
                          <Badge 
                            variant={
                              amendment.status === 'approved' ? 'default' : 
                              amendment.status === 'rejected' ? 'destructive' :
                              'secondary'
                            }
                          >
                            {amendment.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </TabsContent>
              
              {/* SLA Terms Tab */}
              <TabsContent value="sla" className="space-y-4">
                <div className="grid gap-4">
                  {selectedContract.slaMetrics?.map((metric) => (
                    <Card key={metric.id}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base">{metric.metricName}</CardTitle>
                          <div className="flex gap-2">
                            {metric.isActive ? (
                              <Badge variant="default">Active</Badge>
                            ) : (
                              <Badge variant="secondary">Inactive</Badge>
                            )}
                            {metric.penaltyEnabled && (
                              <Badge variant="destructive">Penalty Enabled</Badge>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Target:</span>
                            <p className="font-medium">
                              {metric.targetValue} {metric.targetUnit}
                            </p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Measurement:</span>
                            <p className="font-medium capitalize">{metric.measurementPeriod}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Type:</span>
                            <p className="font-medium capitalize">
                              {metric.metricType.replace('_', ' ')}
                            </p>
                          </div>
                          {metric.penaltyEnabled && (
                            <div>
                              <span className="text-muted-foreground">Penalty:</span>
                              <p className="font-medium text-destructive">
                                ${metric.penaltyAmount}/breach
                              </p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
              
              {/* Performance Tab */}
              <TabsContent value="performance" className="space-y-4">
                {performanceLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">Overall Compliance</h3>
                        <p className="text-sm text-muted-foreground">Last 30 days</p>
                      </div>
                      <div className={`text-3xl font-bold ${getComplianceColor(performance?.complianceRate || 0)}`}>
                        {performance?.complianceRate.toFixed(1)}%
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div className="space-y-3">
                      <h4 className="font-medium">Recent Measurements</h4>
                      {performance?.metrics.map((metric) => (
                        <Card key={metric.id} className={metric.breached ? 'border-destructive' : ''}>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium capitalize">
                                    {metric.metricType.replace('_', ' ')}
                                  </span>
                                  {metric.breached ? (
                                    <Badge variant="destructive">Breached</Badge>
                                  ) : (
                                    <Badge variant="default">Met</Badge>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground mt-1">
                                  {format(new Date(metric.periodStart), 'PP')} - {format(new Date(metric.periodEnd), 'PP')}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-sm">
                                  Measured: <span className="font-medium">{metric.measuredValue}</span>
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  Target: {metric.targetValue}
                                </p>
                                {metric.penaltyApplied && (
                                  <p className="text-sm text-destructive font-medium">
                                    Penalty: ${metric.penaltyAmount}
                                  </p>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </>
                )}
              </TabsContent>
              
              {/* Penalties Tab */}
              <TabsContent value="penalties" className="space-y-4">
                {selectedContract.penalties && selectedContract.penalties.length > 0 ? (
                  <div className="space-y-3">
                    {selectedContract.penalties.map((penalty) => (
                      <Card key={penalty.id}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <p className="font-medium">{penalty.reason}</p>
                              <p className="text-sm text-muted-foreground">
                                {format(new Date(penalty.createdAt), 'PPp')}
                              </p>
                              {penalty.waiverReason && (
                                <Alert className="mt-2">
                                  <AlertDescription className="text-xs">
                                    Waiver reason: {penalty.waiverReason}
                                  </AlertDescription>
                                </Alert>
                              )}
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-destructive">
                                -${parseFloat(penalty.amount).toLocaleString()}
                              </p>
                              <Badge 
                                variant={
                                  penalty.status === 'applied' ? 'destructive' :
                                  penalty.status === 'waived' ? 'default' :
                                  penalty.status === 'disputed' ? 'outline' :
                                  'secondary'
                                }
                              >
                                {penalty.status}
                              </Badge>
                              {penalty.status === 'pending' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="mt-2"
                                  onClick={() => {
                                    setSelectedPenalty(penalty);
                                    setIsDisputeDialogOpen(true);
                                  }}
                                  data-testid={`button-dispute-${penalty.id}`}
                                >
                                  Dispute
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    
                    <div className="bg-muted rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">Total Penalties This Period:</span>
                        <span className="text-xl font-bold text-destructive">
                          -${selectedContract.penalties
                            .filter(p => p.status === 'applied')
                            .reduce((sum, p) => sum + parseFloat(p.amount), 0)
                            .toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-3" />
                    <p className="text-muted-foreground">No penalties recorded</p>
                  </div>
                )}
              </TabsContent>
              
              {/* Invoices Tab */}
              <TabsContent value="invoices" className="space-y-4">
                <Alert>
                  <Receipt className="h-4 w-4" />
                  <AlertTitle>Invoice History</AlertTitle>
                  <AlertDescription>
                    View all invoices related to this contract
                  </AlertDescription>
                </Alert>
                
                <div className="text-center py-8 text-muted-foreground">
                  Invoice integration will display contract-related billing here
                </div>
              </TabsContent>
              
              {/* History Tab */}
              <TabsContent value="history" className="space-y-4">
                <Alert>
                  <History className="h-4 w-4" />
                  <AlertTitle>Service History</AlertTitle>
                  <AlertDescription>
                    Complete history of services performed under this contract
                  </AlertDescription>
                </Alert>
                
                <div className="text-center py-8 text-muted-foreground">
                  Service history and audit trail will be displayed here
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* Request Amendment Dialog */}
      <Dialog open={isAmendmentDialogOpen} onOpenChange={setIsAmendmentDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Request Contract Amendment</DialogTitle>
            <DialogDescription>
              Submit a request to modify the terms of your contract
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="amendment-description">Amendment Description</Label>
              <Input
                id="amendment-description"
                value={amendmentForm.description}
                onChange={(e) => setAmendmentForm({ ...amendmentForm, description: e.target.value })}
                placeholder="Brief description of the requested changes"
                data-testid="input-amendment-description"
              />
            </div>
            <div>
              <Label htmlFor="amendment-details">Proposed Changes</Label>
              <Textarea
                id="amendment-details"
                value={amendmentForm.proposedChanges}
                onChange={(e) => setAmendmentForm({ ...amendmentForm, proposedChanges: e.target.value })}
                rows={6}
                placeholder="Detailed description of the changes you're requesting..."
                data-testid="textarea-amendment-details"
              />
            </div>
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Your request will be reviewed by our contract management team. 
                You'll be notified once a decision is made.
              </AlertDescription>
            </Alert>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsAmendmentDialogOpen(false);
                setAmendmentForm({ description: '', proposedChanges: '' });
              }}
              data-testid="button-cancel-amendment"
            >
              Cancel
            </Button>
            <Button
              onClick={() => requestAmendmentMutation.mutate(amendmentForm)}
              disabled={!amendmentForm.description || !amendmentForm.proposedChanges || requestAmendmentMutation.isPending}
              data-testid="button-submit-amendment"
            >
              {requestAmendmentMutation.isPending ? 'Submitting...' : 'Submit Request'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dispute Penalty Dialog */}
      <Dialog open={isDisputeDialogOpen} onOpenChange={setIsDisputeDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Dispute Penalty</DialogTitle>
            <DialogDescription>
              Submit a dispute for penalty: {selectedPenalty?.reason}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Penalty Amount</AlertTitle>
              <AlertDescription>
                ${selectedPenalty ? parseFloat(selectedPenalty.amount).toLocaleString() : '0'}
              </AlertDescription>
            </Alert>
            <div>
              <Label htmlFor="dispute-reason">Dispute Reason</Label>
              <Textarea
                id="dispute-reason"
                value={disputeForm.reason}
                onChange={(e) => setDisputeForm({ ...disputeForm, reason: e.target.value })}
                rows={4}
                placeholder="Explain why this penalty should be waived..."
                data-testid="textarea-dispute-reason"
              />
            </div>
            <div>
              <Label htmlFor="dispute-details">Supporting Details</Label>
              <Textarea
                id="dispute-details"
                value={disputeForm.details}
                onChange={(e) => setDisputeForm({ ...disputeForm, details: e.target.value })}
                rows={4}
                placeholder="Provide any supporting evidence or documentation references..."
                data-testid="textarea-dispute-details"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDisputeDialogOpen(false);
                setDisputeForm({ reason: '', details: '' });
                setSelectedPenalty(null);
              }}
              data-testid="button-cancel-dispute"
            >
              Cancel
            </Button>
            <Button
              onClick={() => disputePenaltyMutation.mutate()}
              disabled={!disputeForm.reason || disputePenaltyMutation.isPending}
              data-testid="button-submit-dispute"
            >
              {disputePenaltyMutation.isPending ? 'Submitting...' : 'Submit Dispute'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}