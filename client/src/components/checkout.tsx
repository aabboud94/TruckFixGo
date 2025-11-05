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
import { 
  CreditCard, 
  DollarSign, 
  Building2, 
  Truck,
  AlertCircle,
  CheckCircle,
  Shield,
  Clock,
  Receipt
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

// Initialize Stripe
let stripePromise: Promise<Stripe | null> | null = null;
const getStripe = () => {
  const publicKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY;
  if (!stripePromise && publicKey) {
    stripePromise = loadStripe(publicKey);
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
  const { data: paymentMethods, isLoading: loadingMethods } = useQuery({
    queryKey: ["/api/payment-methods"],
    enabled: !!savedPaymentMethodId
  });

  // Check for Stripe configuration
  const { data: stripeConfig, isLoading: loadingConfig } = useQuery({
    queryKey: ["/api/payment/config"]
  });

  // Create payment intent mutation
  const createPaymentIntent = useMutation({
    mutationFn: (data: any) => apiRequest("/api/payment/create-intent", {
      method: "POST",
      body: JSON.stringify(data)
    }),
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

  // Process EFS check mutation
  const processEFSCheck = useMutation({
    mutationFn: (data: any) => apiRequest("/api/payment/efs", {
      method: "POST",
      body: JSON.stringify({
        ...data,
        amount,
        jobId
      })
    }),
    onSuccess: (data) => {
      toast({
        title: "Payment Successful",
        description: "EFS check processed successfully"
      });
      if (onSuccess) {
        onSuccess(data.transactionId);
      }
    },
    onError: (error: any) => {
      toast({
        title: "Payment Failed",
        description: error.message || "Failed to process EFS check",
        variant: "destructive"
      });
      setIsProcessing(false);
    }
  });

  // Process Comdata check mutation
  const processComdataCheck = useMutation({
    mutationFn: (data: any) => apiRequest("/api/payment/comdata", {
      method: "POST",
      body: JSON.stringify({
        ...data,
        amount,
        jobId
      })
    }),
    onSuccess: (data) => {
      toast({
        title: "Payment Successful",
        description: "Comdata check processed successfully"
      });
      if (onSuccess) {
        onSuccess(data.transactionId);
      }
    },
    onError: (error: any) => {
      toast({
        title: "Payment Failed",
        description: error.message || "Failed to process Comdata check",
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
    processEFSCheck.mutate(data);
  };

  const handleComdataSubmit = (data: any) => {
    setIsProcessing(true);
    processComdataCheck.mutate(data);
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
        <CardContent>
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
    </div>
  );
}