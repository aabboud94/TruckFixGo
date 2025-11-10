import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import {
  CreditCard,
  DollarSign,
  AlertCircle,
  CheckCircle,
  Clock,
  Shield,
  Truck,
  Receipt,
  User,
  Building2,
  XCircle
} from "lucide-react";
import { SiVisa, SiMastercard, SiAmericanexpress, SiDiscover } from "react-icons/si";

// Initialize Stripe
let stripePromise: Promise<any> | null = null;
const getStripe = () => {
  const publicKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY;
  if (!stripePromise && publicKey) {
    try {
      stripePromise = loadStripe(publicKey);
    } catch (error) {
      console.warn('Stripe not configured');
      stripePromise = Promise.resolve(null);
    }
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
  onSuccess: (paymentIntentId: string) => void;
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
          <Label htmlFor="efs-truck">Truck/Unit Number (Optional)</Label>
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
            Processing...
          </>
        ) : (
          <>
            <Truck className="mr-2 h-4 w-4" />
            Pay ${(amount / 100).toFixed(2)} with EFS Check
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
          <Label htmlFor="comdata-mc">MC Number (Optional)</Label>
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
            Processing...
          </>
        ) : (
          <>
            <Truck className="mr-2 h-4 w-4" />
            Pay ${(amount / 100).toFixed(2)} with Comdata Check
          </>
        )}
      </Button>
    </form>
  );
}

export default function SplitPaymentPage() {
  const params = useParams();
  const token = params.token;
  const [, setLocation] = useLocation();
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>("card");
  const [isProcessing, setIsProcessing] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentComplete, setPaymentComplete] = useState(false);
  const { toast } = useToast();

  // Fetch split payment details
  const { data: splitData, isLoading, error } = useQuery({
    queryKey: [`/api/payments/split/verify/${token}`],
    retry: false
  });

  // Check Stripe configuration
  const { data: stripeConfig } = useQuery({
    queryKey: ["/api/payment/config"]
  });

  // Create payment intent for card payments
  const createPaymentIntent = useMutation({
    mutationFn: (amount: number) => apiRequest("/api/payment/create-intent", {
      method: "POST",
      body: JSON.stringify({
        amount,
        metadata: {
          splitPaymentToken: token,
          payerType: splitData?.paymentSplit?.payerType,
          payerName: splitData?.paymentSplit?.payerName
        }
      })
    }),
    onSuccess: (data) => {
      if (data.clientSecret) {
        setClientSecret(data.clientSecret);
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to initialize payment",
        variant: "destructive"
      });
    }
  });

  // Process payment mutation
  const processPayment = useMutation({
    mutationFn: (paymentData: any) => apiRequest(`/api/payments/split/pay/${token}`, {
      method: "POST",
      body: JSON.stringify(paymentData)
    }),
    onSuccess: (data) => {
      setPaymentComplete(true);
      toast({
        title: "Payment Successful",
        description: "Your portion of the payment has been completed.",
        className: "bg-green-50 border-green-200"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Payment Failed",
        description: error.message || "Failed to process payment",
        variant: "destructive"
      });
      setIsProcessing(false);
    }
  });

  // Initialize payment intent for card payments
  useEffect(() => {
    if (splitData?.paymentSplit && selectedPaymentMethod === "card" && !clientSecret && stripeConfig?.hasKeys) {
      const amount = parseFloat(splitData.paymentSplit.amountAssigned);
      createPaymentIntent.mutate(amount);
    }
  }, [splitData, selectedPaymentMethod, stripeConfig]);

  // Handle card payment success
  const handleCardPaymentSuccess = (paymentIntentId: string) => {
    processPayment.mutate({
      paymentMethodType: 'credit_card',
      paymentDetails: {
        paymentIntentId
      }
    });
  };

  // Handle EFS check submission
  const handleEFSSubmit = (data: any) => {
    setIsProcessing(true);
    processPayment.mutate({
      paymentMethodType: 'efs_check',
      paymentDetails: data
    });
  };

  // Handle Comdata check submission
  const handleComdataSubmit = (data: any) => {
    setIsProcessing(true);
    processPayment.mutate({
      paymentMethodType: 'comdata_check',
      paymentDetails: data
    });
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error states
  if (error || !splitData?.paymentSplit) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertTitle>Invalid Payment Link</AlertTitle>
              <AlertDescription>
                This payment link is invalid or has expired. Please contact the sender for a new link.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  const paymentSplit = splitData.paymentSplit;
  const job = splitData.job;
  const amount = parseFloat(paymentSplit.amountAssigned);

  // Already paid
  if (paymentSplit.status === 'paid' || paymentComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-green-50">
        <Card className="w-full max-w-md border-green-200">
          <CardContent className="p-6 text-center">
            <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold mb-2">Payment Complete!</h2>
            <p className="text-muted-foreground mb-4">
              Your payment of ${(amount / 100).toFixed(2)} has been successfully processed.
            </p>
            {job && (
              <div className="bg-white p-4 rounded-lg text-left">
                <h3 className="font-medium mb-2">Job Details</h3>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Job ID:</span>
                    <span>{job.id.slice(0, 8)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Service Type:</span>
                    <span>{job.serviceType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Description:</span>
                    <span>{paymentSplit.description}</span>
                  </div>
                </div>
              </div>
            )}
            <Button 
              onClick={() => setLocation("/")}
              className="w-full mt-6"
              data-testid="button-go-home"
            >
              Go to Homepage
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Expired
  if (paymentSplit.status === 'expired' || 
      (paymentSplit.tokenExpiresAt && new Date(paymentSplit.tokenExpiresAt) < new Date())) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <Alert>
              <Clock className="h-4 w-4" />
              <AlertTitle>Payment Link Expired</AlertTitle>
              <AlertDescription>
                This payment link has expired. Please contact the sender for a new payment link.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <CardTitle>TruckFixGo Payment Request</CardTitle>
            <CardDescription>
              Complete your portion of the split payment
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Payment Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Payment Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Payer Type</p>
                <Badge variant="secondary" className="capitalize mt-1">
                  {paymentSplit.payerType}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Payer Name</p>
                <p className="font-medium">{paymentSplit.payerName}</p>
              </div>
            </div>

            <Separator />

            <div>
              <p className="text-sm text-muted-foreground mb-1">Description</p>
              <p className="font-medium">{paymentSplit.description}</p>
            </div>

            <Separator />

            <div className="flex justify-between items-center text-lg">
              <span className="font-medium">Amount Due:</span>
              <span className="font-semibold text-2xl" data-testid="text-amount-due">
                ${(amount / 100).toFixed(2)}
              </span>
            </div>

            {job && (
              <>
                <Separator />
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Service Type:</span>
                    <span>{job.serviceType}</span>
                  </div>
                  {job.location && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Location:</span>
                      <span className="text-right max-w-[200px]">{job.location}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Job Cost:</span>
                    <span>${(parseFloat(job.totalAmount) / 100).toFixed(2)}</span>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Payment Methods */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Method</CardTitle>
            <CardDescription>
              Choose how you'd like to complete your payment
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={selectedPaymentMethod} onValueChange={setSelectedPaymentMethod}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="card" data-testid="tab-card">Card</TabsTrigger>
                <TabsTrigger value="efs" data-testid="tab-efs">EFS</TabsTrigger>
                <TabsTrigger value="comdata" data-testid="tab-comdata">Comdata</TabsTrigger>
              </TabsList>

              {/* Card Payment */}
              <TabsContent value="card" className="space-y-4 mt-4">
                <div className="flex gap-2 mb-4">
                  <SiVisa className="h-8 w-12" />
                  <SiMastercard className="h-8 w-12" />
                  <SiAmericanexpress className="h-8 w-12" />
                  <SiDiscover className="h-8 w-12" />
                </div>
                
                {!stripeConfig?.hasKeys ? (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Card payment is temporarily unavailable. Please use an alternative payment method.
                    </AlertDescription>
                  </Alert>
                ) : clientSecret ? (
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
                  <span>Your payment information is encrypted and secure.</span>
                </div>
              </TabsContent>

              {/* EFS Payment */}
              <TabsContent value="efs" className="space-y-4 mt-4">
                <Alert>
                  <Truck className="h-4 w-4" />
                  <AlertDescription>
                    Enter your EFS check details for immediate authorization.
                  </AlertDescription>
                </Alert>
                <EFSCheckForm
                  amount={amount}
                  onSubmit={handleEFSSubmit}
                  isProcessing={isProcessing}
                />
              </TabsContent>

              {/* Comdata Payment */}
              <TabsContent value="comdata" className="space-y-4 mt-4">
                <Alert>
                  <Truck className="h-4 w-4" />
                  <AlertDescription>
                    Enter your Comdata check details for immediate authorization.
                  </AlertDescription>
                </Alert>
                <ComdataCheckForm
                  amount={amount}
                  onSubmit={handleComdataSubmit}
                  isProcessing={isProcessing}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Support Information */}
        <Card>
          <CardContent className="p-4">
            <div className="text-center text-sm text-muted-foreground">
              <p>Need help? Contact support at (555) 123-4567</p>
              <p>or email support@truckfixgo.com</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}