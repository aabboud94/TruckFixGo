import { useState, useEffect } from "react";
import { loadStripe, Stripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import SplitPaymentModal from "@/components/split-payment-modal";
import { 
  CreditCard, 
  DollarSign, 
  Building2, 
  Truck,
  AlertCircle,
  CheckCircle,
  Shield,
  Clock,
  Receipt,
  Users
} from "lucide-react";
import { SiVisa, SiMastercard, SiAmericanexpress, SiDiscover } from "react-icons/si";

interface CheckoutProps {
  jobId?: string;
  amount: number;
  serviceCost: number;
  emergencySurcharge?: number;
  distanceFee?: number;
  tax: number;
  fleetDiscount?: number;
  onSuccess?: (paymentId: string) => void;
  onCancel?: () => void;
  isEmergency?: boolean;
  fleetAccountId?: string;
  savedPaymentMethodId?: string;
}

interface PriceBreakdown {
  serviceCost: number;
  emergencySurcharge?: number;
  distanceFee?: number;
  subtotal: number;
  tax: number;
  fleetDiscount?: number;
  total: number;
}

// Initialize Stripe (Optional - works without keys)
let stripePromise: Promise<Stripe | null> | null = null;
const getStripe = () => {
  const publicKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY;
  if (!stripePromise && publicKey) {
    try {
      stripePromise = loadStripe(publicKey);
    } catch (error) {
      console.warn('Stripe not configured - payment functionality limited');
      stripePromise = Promise.resolve(null);
    }
  }
  if (!publicKey) {
    console.warn('Stripe public key not found - payment functionality limited');
    return Promise.resolve(null);
  }
  return stripePromise;
};

// Payment Form Component
function PaymentForm({ 
  clientSecret, 
  amount, 
  onSuccess,
  isProcessing,
  setIsProcessing 
}: {
  clientSecret: string;
  amount: number;
  onSuccess: (paymentId: string) => void;
  isProcessing: boolean;
  setIsProcessing: (processing: boolean) => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements || isProcessing) {
      return;
    }

    setIsProcessing(true);

    const result = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.origin + "/payment-success",
      },
      redirect: "if_required"
    });

    if (result.error) {
      toast({
        title: "Payment failed",
        description: result.error.message,
        variant: "destructive"
      });
      setIsProcessing(false);
    } else {
      onSuccess(result.paymentIntent.id);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      <Button 
        type="submit" 
        className="w-full" 
        size="lg"
        disabled={!stripe || isProcessing}
        data-testid="button-submit-payment"
      >
        {isProcessing ? (
          <>
            <Clock className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <Shield className="mr-2 h-4 w-4" />
            Pay ${(amount / 100).toFixed(2)}
          </>
        )}
      </Button>
    </form>
  );
}

// EFS Check Form Component
function EFSCheckForm({ 
  amount, 
  onSubmit,
  isProcessing 
}: {
  amount: number;
  onSubmit: (data: any) => void;
  isProcessing: boolean;
}) {
  const [formData, setFormData] = useState({
    checkNumber: "",
    authorizationCode: "",
    driverCode: "",
    truckNumber: ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="efs-check">EFS Check Number</Label>
          <Input
            id="efs-check"
            value={formData.checkNumber}
            onChange={(e) => setFormData({...formData, checkNumber: e.target.value})}
            placeholder="1234567890"
            required
            data-testid="input-efs-check-number"
          />
        </div>
        <div>
          <Label htmlFor="efs-auth">Authorization Code</Label>
          <Input
            id="efs-auth"
            value={formData.authorizationCode}
            onChange={(e) => setFormData({...formData, authorizationCode: e.target.value})}
            placeholder="AUTH123456"
            required
            data-testid="input-efs-auth-code"
          />
        </div>
        <div>
          <Label htmlFor="efs-driver">Driver Code/PIN</Label>
          <Input
            id="efs-driver"
            type="password"
            value={formData.driverCode}
            onChange={(e) => setFormData({...formData, driverCode: e.target.value})}
            placeholder="****"
            required
            data-testid="input-efs-driver-code"
          />
        </div>
        <div>
          <Label htmlFor="efs-truck">Truck/Unit Number</Label>
          <Input
            id="efs-truck"
            value={formData.truckNumber}
            onChange={(e) => setFormData({...formData, truckNumber: e.target.value})}
            placeholder="TRUCK-123"
            data-testid="input-efs-truck-number"
          />
        </div>
      </div>
      <Button 
        type="submit" 
        className="w-full" 
        size="lg"
        disabled={isProcessing}
        data-testid="button-submit-efs"
      >
        {isProcessing ? (
          <>
            <Clock className="mr-2 h-4 w-4 animate-spin" />
            Processing EFS Check...
          </>
        ) : (
          <>
            <Truck className="mr-2 h-4 w-4" />
            Pay ${(amount / 100).toFixed(2)} with EFS
          </>
        )}
      </Button>
    </form>
  );
}

// Comdata Check Form Component
function ComdataCheckForm({ 
  amount, 
  onSubmit,
  isProcessing 
}: {
  amount: number;
  onSubmit: (data: any) => void;
  isProcessing: boolean;
}) {
  const [formData, setFormData] = useState({
    checkNumber: "",
    authorizationCode: "",
    driverCode: "",
    mcNumber: ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="comdata-check">Comdata Check Number</Label>
          <Input
            id="comdata-check"
            value={formData.checkNumber}
            onChange={(e) => setFormData({...formData, checkNumber: e.target.value})}
            placeholder="9876543210"
            required
            data-testid="input-comdata-check-number"
          />
        </div>
        <div>
          <Label htmlFor="comdata-auth">Authorization Code</Label>
          <Input
            id="comdata-auth"
            value={formData.authorizationCode}
            onChange={(e) => setFormData({...formData, authorizationCode: e.target.value})}
            placeholder="CMD789012"
            required
            data-testid="input-comdata-auth-code"
          />
        </div>
        <div>
          <Label htmlFor="comdata-driver">Driver Code/PIN</Label>
          <Input
            id="comdata-driver"
            type="password"
            value={formData.driverCode}
            onChange={(e) => setFormData({...formData, driverCode: e.target.value})}
            placeholder="****"
            required
            data-testid="input-comdata-driver-code"
          />
        </div>
        <div>
          <Label htmlFor="comdata-mc">MC Number</Label>
          <Input
            id="comdata-mc"
            value={formData.mcNumber}
            onChange={(e) => setFormData({...formData, mcNumber: e.target.value})}
            placeholder="MC123456"
            data-testid="input-comdata-mc-number"
          />
        </div>
      </div>
      <Button 
        type="submit" 
        className="w-full" 
        size="lg"
        disabled={isProcessing}
        data-testid="button-submit-comdata"
      >
        {isProcessing ? (
          <>
            <Clock className="mr-2 h-4 w-4 animate-spin" />
            Processing Comdata Check...
          </>
        ) : (
          <>
            <Truck className="mr-2 h-4 w-4" />
            Pay ${(amount / 100).toFixed(2)} with Comdata
          </>
        )}
      </Button>
    </form>
  );
}

export default function Checkout({
  jobId,
  amount,
  serviceCost,
  emergencySurcharge,
  distanceFee,
  tax,
  fleetDiscount,
  onSuccess,
  onCancel,
  isEmergency = false,
  fleetAccountId,
  savedPaymentMethodId
}: CheckoutProps) {
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>("card");
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [savedMethods, setSavedMethods] = useState<any[]>([]);
  const [showSplitPaymentModal, setShowSplitPaymentModal] = useState(false);
  const [existingSplitPayment, setExistingSplitPayment] = useState<any>(null);
  const { toast } = useToast();

  // Calculate price breakdown
  const priceBreakdown: PriceBreakdown = {
    serviceCost,
    emergencySurcharge,
    distanceFee,
    subtotal: serviceCost + (emergencySurcharge || 0) + (distanceFee || 0),
    tax,
    fleetDiscount,
    total: amount
  };

  // Fetch saved payment methods
  const { data: paymentMethods, isLoading: loadingMethods } = useQuery<any>({
    queryKey: ["/api/payment-methods"],
    enabled: !!savedPaymentMethodId
  });

  // Check for Stripe configuration
  const { data: stripeConfig, isLoading: loadingConfig } = useQuery<{ hasKeys: boolean }>({
    queryKey: ["/api/payment/config"]
  });

  // Check for existing split payment
  const { data: splitPaymentData } = useQuery<{
    splitPayment?: { id: string; status: string; totalAmount: string; createdAt: string };
    paymentSplits?: Array<{
      id: string;
      payerType: string;
      payerName?: string;
      amountAssigned: string;
      amountPaid: string;
      status: string;
    }>;
  }>({
    queryKey: ["split-payment-detail", jobId],
    enabled: !!jobId
  });

  // Create payment intent mutation
  const createPaymentIntent = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/payment/create-intent", data),
    onSuccess: (data) => {
      if (data.clientSecret) {
        setClientSecret(data.clientSecret);
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create payment intent",
        variant: "destructive"
      });
    }
  });

  // EFS check authorization mutation
  const authorizeEFSCheck = useMutation({
    mutationFn: (data: any) => apiRequest("/api/payments/efs/authorize", {
      method: "POST",
      body: JSON.stringify({
        checkNumber: data.checkNumber,
        authorizationCode: data.authorizationCode,
        amount: amount / 100, // Convert cents to dollars
        jobId,
        fleetAccountId
      })
    }),
    onSuccess: async (authData) => {
      // After successful authorization, capture the payment
      try {
        const captureResponse = await apiRequest("/api/payments/efs/capture", {
          method: "POST",
          body: JSON.stringify({
            checkId: authData.checkId,
            amount: amount / 100,
            jobId
          })
        });
        
        toast({
          title: "Payment Successful",
          description: `EFS check authorized and captured. Transaction ID: ${captureResponse.transactionId}`,
          className: "bg-green-50 border-green-200"
        });
        
        if (onSuccess) {
          onSuccess(captureResponse.transactionId);
        }
        setIsProcessing(false);
      } catch (captureError: any) {
        toast({
          title: "Capture Failed",
          description: captureError.message || "Payment authorized but failed to capture",
          variant: "destructive"
        });
        setIsProcessing(false);
      }
    },
    onError: (error: any) => {
      toast({
        title: "Authorization Failed",
        description: error.message || "Failed to authorize EFS check",
        variant: "destructive"
      });
      setIsProcessing(false);
    }
  });

  // Comdata check authorization mutation
  const authorizeComdataCheck = useMutation({
    mutationFn: (data: any) => apiRequest("/api/payments/comdata/authorize", {
      method: "POST",
      body: JSON.stringify({
        checkNumber: data.checkNumber,
        controlCode: data.authorizationCode,
        driverCode: data.driverCode,
        amount: amount / 100, // Convert cents to dollars
        jobId,
        fleetAccountId
      })
    }),
    onSuccess: async (authData) => {
      // After successful authorization, capture the payment
      try {
        const captureResponse = await apiRequest("/api/payments/comdata/capture", {
          method: "POST",
          body: JSON.stringify({
            checkId: authData.checkId,
            amount: amount / 100,
            jobId
          })
        });
        
        toast({
          title: "Payment Successful",
          description: `Comdata check authorized and captured. Transaction ID: ${captureResponse.transactionId}`,
          className: "bg-green-50 border-green-200"
        });
        
        if (onSuccess) {
          onSuccess(captureResponse.transactionId);
        }
        setIsProcessing(false);
      } catch (captureError: any) {
        toast({
          title: "Capture Failed",
          description: captureError.message || "Payment authorized but failed to capture",
          variant: "destructive"
        });
        setIsProcessing(false);
      }
    },
    onError: (error: any) => {
      toast({
        title: "Authorization Failed",
        description: error.message || "Failed to authorize Comdata check",
        variant: "destructive"
      });
      setIsProcessing(false);
    }
  });

  // Process fleet account mutation
  const processFleetAccount = useMutation({
    mutationFn: (data: any) => apiRequest("/api/payment/fleet-account", {
      method: "POST",
      body: JSON.stringify({
        fleetAccountId,
        amount,
        jobId
      })
    }),
    onSuccess: (data) => {
      toast({
        title: "Invoice Created",
        description: "Fleet account will be billed according to NET terms"
      });
      if (onSuccess) {
        onSuccess(data.invoiceId);
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to process fleet account payment",
        variant: "destructive"
      });
      setIsProcessing(false);
    }
  });

  // Initialize payment intent for card payments
  useEffect(() => {
    if (selectedPaymentMethod === "card" && !clientSecret && stripeConfig?.hasKeys) {
      createPaymentIntent.mutate({
        amount,
        jobId,
        paymentMethodId: savedPaymentMethodId
      });
    }
  }, [selectedPaymentMethod, stripeConfig]);

  // Check if Stripe is not configured
  if (loadingConfig) {
    return (
      <Card>
        <CardContent className="p-6">
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!stripeConfig?.hasKeys && selectedPaymentMethod === "card") {
    return (
      <Card>
        <CardContent className="p-6">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Payment processing is not configured. Please contact support or use alternative payment methods.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const handleCardPaymentSuccess = (paymentId: string) => {
    toast({
      title: "Payment Successful",
      description: "Your payment has been processed successfully"
    });
    if (onSuccess) {
      onSuccess(paymentId);
    }
  };

  const handleEFSSubmit = (data: any) => {
    setIsProcessing(true);
    authorizeEFSCheck.mutate(data);
  };

  const handleComdataSubmit = (data: any) => {
    setIsProcessing(true);
    authorizeComdataCheck.mutate(data);
  };

  const handleFleetAccountSubmit = () => {
    setIsProcessing(true);
    processFleetAccount.mutate({});
  };

  return (
    <div className="space-y-6">
      {/* Price Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Price Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between text-sm">
            <span>Service Cost</span>
            <span data-testid="text-service-cost">${(serviceCost / 100).toFixed(2)}</span>
          </div>
          {emergencySurcharge && (
            <div className="flex justify-between text-sm">
              <span>Emergency Surcharge</span>
              <span className="text-orange-600" data-testid="text-emergency-surcharge">
                ${(emergencySurcharge / 100).toFixed(2)}
              </span>
            </div>
          )}
          {distanceFee && (
            <div className="flex justify-between text-sm">
              <span>Distance Fee</span>
              <span data-testid="text-distance-fee">${(distanceFee / 100).toFixed(2)}</span>
            </div>
          )}
          <Separator />
          <div className="flex justify-between text-sm">
            <span>Subtotal</span>
            <span data-testid="text-subtotal">${(priceBreakdown.subtotal / 100).toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Tax</span>
            <span data-testid="text-tax">${(tax / 100).toFixed(2)}</span>
          </div>
          {fleetDiscount && (
            <div className="flex justify-between text-sm text-green-600">
              <span>Fleet Discount</span>
              <span data-testid="text-fleet-discount">-${(fleetDiscount / 100).toFixed(2)}</span>
            </div>
          )}
          <Separator />
          <div className="flex justify-between text-lg font-semibold">
            <span>Total</span>
            <span data-testid="text-total">${(amount / 100).toFixed(2)}</span>
          </div>
        </CardContent>
      </Card>

      {/* Payment Method Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Method</CardTitle>
          <CardDescription>
            Choose how you'd like to pay for this service
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Split Payment Option */}
          {jobId && !splitPaymentData?.splitPayment && (
            <div className="mb-4">
              <Alert className="bg-blue-50 border-blue-200">
                <Users className="h-4 w-4 text-blue-600" />
                <AlertDescription>
                  Need to split this payment between multiple parties? You can divide the cost between carrier, driver, fleet, or insurance.
                </AlertDescription>
              </Alert>
              <Button
                onClick={() => setShowSplitPaymentModal(true)}
                variant="outline"
                className="w-full mt-3"
                data-testid="button-split-payment"
              >
                <Users className="mr-2 h-4 w-4" />
                Set Up Split Payment
              </Button>
            </div>
          )}

          {/* Show existing split payment status */}
          {splitPaymentData?.splitPayment && (
            <Card className="mb-4 border-primary">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Split Payment Active
                  </h4>
                  <Badge variant="secondary">
                    {splitPaymentData.paymentSplits?.filter((s: any) => s.status === 'paid').length || 0}/
                    {splitPaymentData.paymentSplits?.length || 0} Paid
                  </Badge>
                </div>
                <div className="space-y-2">
                  {splitPaymentData.paymentSplits?.map((split: any) => (
                    <div key={split.id} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="capitalize">{split.payerType}</Badge>
                        <span>{split.payerName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span>${(parseFloat(split.amountAssigned) / 100).toFixed(2)}</span>
                        {split.status === 'paid' ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : split.status === 'pending' ? (
                          <Clock className="h-4 w-4 text-yellow-600" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-destructive" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <Separator className="my-3" />
                <div className="text-sm text-muted-foreground">
                  Payment links have been sent to all parties. Full payment will be collected once all parties complete their portions.
                </div>
              </CardContent>
            </Card>
          )}

          {!splitPaymentData?.splitPayment && (
            <Tabs value={selectedPaymentMethod} onValueChange={setSelectedPaymentMethod}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="card" data-testid="tab-card">Card</TabsTrigger>
                <TabsTrigger value="efs" data-testid="tab-efs">EFS</TabsTrigger>
                <TabsTrigger value="comdata" data-testid="tab-comdata">Comdata</TabsTrigger>
                {fleetAccountId && (
                  <TabsTrigger value="fleet" data-testid="tab-fleet">Fleet</TabsTrigger>
                )}
              </TabsList>

            {/* Card Payment */}
            <TabsContent value="card" className="space-y-4">
              <div className="flex gap-2 mb-4">
                <SiVisa className="h-8 w-12" />
                <SiMastercard className="h-8 w-12" />
                <SiAmericanexpress className="h-8 w-12" />
                <SiDiscover className="h-8 w-12" />
              </div>
              {clientSecret && stripePromise ? (
                <Elements stripe={getStripe()} options={{ clientSecret }}>
                  <PaymentForm
                    clientSecret={clientSecret}
                    amount={amount}
                    onSuccess={handleCardPaymentSuccess}
                    isProcessing={isProcessing}
                    setIsProcessing={setIsProcessing}
                  />
                </Elements>
              ) : (
                <div className="h-32 flex items-center justify-center">
                  <Clock className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              )}
              <div className="flex items-start gap-2 text-xs text-muted-foreground">
                <Shield className="h-4 w-4 mt-0.5" />
                <span>
                  Your payment information is encrypted and secure. We never store your card details.
                </span>
              </div>
            </TabsContent>

            {/* EFS Payment */}
            <TabsContent value="efs" className="space-y-4">
              <Alert>
                <Truck className="h-4 w-4" />
                <AlertDescription>
                  Enter your EFS check details. Authorization will be verified immediately.
                </AlertDescription>
              </Alert>
              <EFSCheckForm
                amount={amount}
                onSubmit={handleEFSSubmit}
                isProcessing={isProcessing}
              />
            </TabsContent>

            {/* Comdata Payment */}
            <TabsContent value="comdata" className="space-y-4">
              <Alert>
                <Truck className="h-4 w-4" />
                <AlertDescription>
                  Enter your Comdata check details. Authorization will be verified immediately.
                </AlertDescription>
              </Alert>
              <ComdataCheckForm
                amount={amount}
                onSubmit={handleComdataSubmit}
                isProcessing={isProcessing}
              />
            </TabsContent>

            {/* Fleet Account */}
            {fleetAccountId && (
              <TabsContent value="fleet" className="space-y-4">
                <Alert className="bg-blue-50 border-blue-200">
                  <Building2 className="h-4 w-4 text-blue-600" />
                  <AlertDescription>
                    This will be billed to your fleet account with NET 30 terms.
                    An invoice will be generated and sent to your billing contact.
                  </AlertDescription>
                </Alert>
                <Button
                  onClick={handleFleetAccountSubmit}
                  className="w-full"
                  size="lg"
                  disabled={isProcessing}
                  data-testid="button-submit-fleet"
                >
                  {isProcessing ? (
                    <>
                      <Clock className="mr-2 h-4 w-4 animate-spin" />
                      Creating Invoice...
                    </>
                  ) : (
                    <>
                      <Receipt className="mr-2 h-4 w-4" />
                      Bill to Fleet Account
                    </>
                  )}
                </Button>
              </TabsContent>
            )}
          </Tabs>
          )}
        </CardContent>
      </Card>

      {/* Cancel Button */}
      {onCancel && (
        <Button
          variant="outline"
          onClick={onCancel}
          className="w-full"
          disabled={isProcessing}
          data-testid="button-cancel-payment"
        >
          Cancel
        </Button>
      )}

      {/* Split Payment Modal */}
      {jobId && (
        <SplitPaymentModal
          isOpen={showSplitPaymentModal}
          onClose={() => setShowSplitPaymentModal(false)}
          jobId={jobId}
          totalAmount={amount}
          onSuccess={(splitPaymentId) => {
            // Refresh the split payment data
            queryClient.invalidateQueries({ queryKey: [`/api/payments/split/${jobId}`] });
            setShowSplitPaymentModal(false);
            toast({
              title: "Split Payment Created",
              description: "Payment links have been sent to all parties"
            });
          }}
        />
      )}
    </div>
  );
}
