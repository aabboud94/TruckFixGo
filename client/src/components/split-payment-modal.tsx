import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { 
  Users, 
  Building2, 
  Truck,
  Shield,
  Calculator,
  Mail,
  Phone,
  DollarSign,
  AlertCircle,
  CheckCircle,
  Clock,
  Send,
  RefreshCw,
  Copy,
  Percent,
  User
} from "lucide-react";

interface SplitPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobId: string;
  totalAmount: number;
  onSuccess?: (splitPaymentId: string) => void;
}

interface PaymentSplit {
  id?: string;
  payerType: 'driver' | 'carrier' | 'fleet' | 'insurance' | 'other';
  payerName: string;
  payerEmail?: string;
  payerPhone?: string;
  amount?: number;
  percentage?: number;
  isRemainder?: boolean;
  description: string;
}

interface SplitTemplate {
  id: string;
  name: string;
  description: string;
  splits: Array<{
    payerType: string;
    percentage?: number;
    amount?: number;
    isRemainder?: boolean;
    description: string;
  }>;
}

export default function SplitPaymentModal({
  isOpen,
  onClose,
  jobId,
  totalAmount,
  onSuccess
}: SplitPaymentModalProps) {
  const [selectedTab, setSelectedTab] = useState<'template' | 'custom'>('template');
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [customSplits, setCustomSplits] = useState<PaymentSplit[]>([
    {
      payerType: 'driver',
      payerName: '',
      payerEmail: '',
      payerPhone: '',
      percentage: 50,
      description: 'Driver portion'
    },
    {
      payerType: 'carrier',
      payerName: '',
      payerEmail: '',
      payerPhone: '',
      percentage: 50,
      description: 'Carrier portion'
    }
  ]);
  const { toast } = useToast();

  // Fetch split payment templates
  const { data: templates, isLoading: loadingTemplates } = useQuery({
    queryKey: ["/api/payments/split/templates"],
    enabled: isOpen
  });

  // Create split payment mutation
  const createSplitPayment = useMutation({
    mutationFn: (data: any) => apiRequest("/api/payments/split", {
      method: "POST",
      body: JSON.stringify(data)
    }),
    onSuccess: (data) => {
      toast({
        title: "Split Payment Created",
        description: "Payment links will be sent to all parties"
      });
      if (onSuccess) {
        onSuccess(data.splitPayment.id);
      }
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create split payment",
        variant: "destructive"
      });
    }
  });

  // Add a new split
  const addSplit = () => {
    setCustomSplits([
      ...customSplits,
      {
        payerType: 'other',
        payerName: '',
        payerEmail: '',
        payerPhone: '',
        percentage: 0,
        description: ''
      }
    ]);
  };

  // Remove a split
  const removeSplit = (index: number) => {
    if (customSplits.length > 2) {
      setCustomSplits(customSplits.filter((_, i) => i !== index));
    }
  };

  // Update a split
  const updateSplit = (index: number, field: string, value: any) => {
    const newSplits = [...customSplits];
    newSplits[index] = { ...newSplits[index], [field]: value };
    
    // If using remainder, clear percentage and amount for this split
    if (field === 'isRemainder' && value) {
      newSplits[index].percentage = undefined;
      newSplits[index].amount = undefined;
      // Clear remainder from other splits
      newSplits.forEach((split, i) => {
        if (i !== index) {
          split.isRemainder = false;
        }
      });
    }
    
    setCustomSplits(newSplits);
  };

  // Calculate amounts for each split
  const calculateSplitAmounts = () => {
    let remainingAmount = totalAmount;
    const calculatedSplits = customSplits.map((split) => {
      let splitAmount = 0;
      
      if (split.amount) {
        splitAmount = split.amount * 100; // Convert to cents
        remainingAmount -= splitAmount;
      } else if (split.percentage) {
        splitAmount = Math.floor((totalAmount * split.percentage) / 100);
        remainingAmount -= splitAmount;
      } else if (split.isRemainder) {
        // Will be calculated after all fixed amounts
      }
      
      return { ...split, calculatedAmount: splitAmount };
    });

    // Assign remainder to any split marked as remainder
    const remainderSplit = calculatedSplits.find(s => s.isRemainder);
    if (remainderSplit) {
      remainderSplit.calculatedAmount = Math.max(0, remainingAmount);
    }

    return calculatedSplits;
  };

  // Validate splits
  const validateSplits = () => {
    const calculatedSplits = calculateSplitAmounts();
    const totalCalculated = calculatedSplits.reduce((sum, split) => sum + split.calculatedAmount, 0);
    
    if (Math.abs(totalCalculated - totalAmount) > 1) {
      return "Split amounts don't add up to the total";
    }
    
    for (const split of customSplits) {
      if (!split.payerName) return "All payers must have a name";
      if (!split.payerEmail && !split.payerPhone) {
        return "Each payer must have either email or phone";
      }
      if (!split.percentage && !split.amount && !split.isRemainder) {
        return "Each split must have an amount, percentage, or be marked as remainder";
      }
    }
    
    return null;
  };

  // Handle form submission
  const handleSubmit = () => {
    if (selectedTab === 'template') {
      if (!selectedTemplate) {
        toast({
          title: "Error",
          description: "Please select a template",
          variant: "destructive"
        });
        return;
      }
      
      createSplitPayment.mutate({
        jobId,
        templateId: selectedTemplate
      });
    } else {
      const error = validateSplits();
      if (error) {
        toast({
          title: "Validation Error",
          description: error,
          variant: "destructive"
        });
        return;
      }
      
      createSplitPayment.mutate({
        jobId,
        customSplits: customSplits.map(split => ({
          ...split,
          amount: split.amount ? split.amount * 100 : undefined // Convert to cents
        }))
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Split Payment Setup
          </DialogTitle>
          <DialogDescription>
            Set up payment splitting for total amount: ${(totalAmount / 100).toFixed(2)}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={selectedTab} onValueChange={(v) => setSelectedTab(v as 'template' | 'custom')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="template" data-testid="tab-template">
              Use Template
            </TabsTrigger>
            <TabsTrigger value="custom" data-testid="tab-custom">
              Custom Split
            </TabsTrigger>
          </TabsList>

          {/* Template Selection */}
          <TabsContent value="template" className="space-y-4">
            <RadioGroup value={selectedTemplate} onValueChange={setSelectedTemplate}>
              <div className="space-y-3">
                {templates?.templates?.map((template: SplitTemplate) => (
                  <Card key={template.id} className={selectedTemplate === template.id ? 'border-primary' : ''}>
                    <CardContent className="p-4">
                      <label className="flex cursor-pointer space-x-3">
                        <RadioGroupItem value={template.id} />
                        <div className="flex-1">
                          <div className="font-medium">{template.name}</div>
                          <div className="text-sm text-muted-foreground">{template.description}</div>
                          <div className="mt-2 space-y-1">
                            {template.splits.map((split, idx) => (
                              <div key={idx} className="flex items-center gap-2 text-sm">
                                <Badge variant="secondary" className="capitalize">
                                  {split.payerType}
                                </Badge>
                                <span>
                                  {split.amount ? 
                                    `$${split.amount}` : 
                                    split.percentage ? 
                                      `${split.percentage}%` : 
                                      'Remaining balance'}
                                </span>
                                <span className="text-muted-foreground">- {split.description}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </label>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </RadioGroup>

            {selectedTemplate && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  You'll need to provide contact details for each payer after selecting this template.
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>

          {/* Custom Split */}
          <TabsContent value="custom" className="space-y-4">
            <div className="space-y-4">
              {customSplits.map((split, index) => {
                const calculatedAmount = calculateSplitAmounts()[index]?.calculatedAmount || 0;
                
                return (
                  <Card key={index}>
                    <CardContent className="p-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">Payer {index + 1}</h4>
                        {customSplits.length > 2 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeSplit(index)}
                            data-testid={`button-remove-split-${index}`}
                          >
                            Remove
                          </Button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label>Payer Type</Label>
                          <Select
                            value={split.payerType}
                            onValueChange={(v) => updateSplit(index, 'payerType', v)}
                          >
                            <SelectTrigger data-testid={`select-payer-type-${index}`}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="driver">Driver</SelectItem>
                              <SelectItem value="carrier">Carrier</SelectItem>
                              <SelectItem value="fleet">Fleet Account</SelectItem>
                              <SelectItem value="insurance">Insurance</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label>Name *</Label>
                          <Input
                            value={split.payerName}
                            onChange={(e) => updateSplit(index, 'payerName', e.target.value)}
                            placeholder="John Doe or ABC Trucking"
                            required
                            data-testid={`input-payer-name-${index}`}
                          />
                        </div>

                        <div>
                          <Label>Email</Label>
                          <Input
                            type="email"
                            value={split.payerEmail}
                            onChange={(e) => updateSplit(index, 'payerEmail', e.target.value)}
                            placeholder="payer@example.com"
                            data-testid={`input-payer-email-${index}`}
                          />
                        </div>

                        <div>
                          <Label>Phone</Label>
                          <Input
                            type="tel"
                            value={split.payerPhone}
                            onChange={(e) => updateSplit(index, 'payerPhone', e.target.value)}
                            placeholder="(555) 123-4567"
                            data-testid={`input-payer-phone-${index}`}
                          />
                        </div>

                        <div>
                          <Label>Amount Type</Label>
                          <RadioGroup
                            value={split.isRemainder ? 'remainder' : split.amount ? 'fixed' : 'percentage'}
                            onValueChange={(v) => {
                              if (v === 'remainder') {
                                updateSplit(index, 'isRemainder', true);
                              } else if (v === 'fixed') {
                                updateSplit(index, 'isRemainder', false);
                                updateSplit(index, 'percentage', undefined);
                                updateSplit(index, 'amount', 0);
                              } else {
                                updateSplit(index, 'isRemainder', false);
                                updateSplit(index, 'amount', undefined);
                                updateSplit(index, 'percentage', 0);
                              }
                            }}
                          >
                            <div className="flex gap-4">
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="percentage" />
                                <Label>Percentage</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="fixed" />
                                <Label>Fixed Amount</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="remainder" />
                                <Label>Remainder</Label>
                              </div>
                            </div>
                          </RadioGroup>
                        </div>

                        <div>
                          {split.isRemainder ? (
                            <div className="pt-6">
                              <Badge variant="secondary">
                                Pays remaining balance
                              </Badge>
                            </div>
                          ) : split.amount !== undefined ? (
                            <div>
                              <Label>Fixed Amount ($)</Label>
                              <Input
                                type="number"
                                value={split.amount || ''}
                                onChange={(e) => updateSplit(index, 'amount', parseFloat(e.target.value))}
                                placeholder="150.00"
                                step="0.01"
                                min="0"
                                data-testid={`input-amount-${index}`}
                              />
                            </div>
                          ) : (
                            <div>
                              <Label>Percentage (%)</Label>
                              <Input
                                type="number"
                                value={split.percentage || ''}
                                onChange={(e) => updateSplit(index, 'percentage', parseFloat(e.target.value))}
                                placeholder="50"
                                min="0"
                                max="100"
                                data-testid={`input-percentage-${index}`}
                              />
                            </div>
                          )}
                        </div>

                        <div className="md:col-span-2">
                          <Label>Description</Label>
                          <Input
                            value={split.description}
                            onChange={(e) => updateSplit(index, 'description', e.target.value)}
                            placeholder="e.g., Callout fee, Labor costs, Parts"
                            data-testid={`input-description-${index}`}
                          />
                        </div>

                        <div className="md:col-span-2">
                          <div className="flex items-center justify-between p-3 bg-muted rounded-md">
                            <span className="text-sm font-medium">Calculated Amount:</span>
                            <span className="text-lg font-semibold" data-testid={`text-calculated-${index}`}>
                              ${(calculatedAmount / 100).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <Button
              onClick={addSplit}
              variant="outline"
              className="w-full"
              data-testid="button-add-split"
            >
              <Users className="mr-2 h-4 w-4" />
              Add Another Payer
            </Button>

            {/* Total Validation */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Total Allocated:</span>
                  <span className={`text-lg font-semibold ${
                    Math.abs(calculateSplitAmounts().reduce((sum, s) => sum + s.calculatedAmount, 0) - totalAmount) > 1 
                      ? 'text-destructive' 
                      : 'text-green-600'
                  }`}>
                    ${(calculateSplitAmounts().reduce((sum, s) => sum + s.calculatedAmount, 0) / 100).toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>Target Total:</span>
                  <span>${(totalAmount / 100).toFixed(2)}</span>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={createSplitPayment.isPending}
            data-testid="button-cancel-split"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={createSplitPayment.isPending || 
              (selectedTab === 'template' && !selectedTemplate)}
            data-testid="button-create-split"
          >
            {createSplitPayment.isPending ? (
              <>
                <Clock className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Create Split Payment
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}