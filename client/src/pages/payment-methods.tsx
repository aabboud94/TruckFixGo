import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription as DialogDesc, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { 
  CreditCard, 
  Plus, 
  Trash2, 
  Star,
  Shield,
  Building2,
  Truck,
  AlertCircle,
  CheckCircle,
  Edit,
  ChevronLeft
} from "lucide-react";
import { SiVisa, SiMastercard, SiAmericanexpress, SiDiscover } from "react-icons/si";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";

interface PaymentMethod {
  id: string;
  type: 'credit_card' | 'efs_check' | 'comdata_check' | 'fleet_account';
  last4?: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
  isDefault: boolean;
  nickname?: string;
  fleetAccountId?: string;
  fleetAccountName?: string;
  efsCompanyCode?: string;
  comdataCustomerId?: string;
  createdAt: string;
}

// Initialize Stripe
let stripePromise: Promise<any> | null = null;
const getStripe = () => {
  const publicKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY;
  if (!stripePromise && publicKey) {
    stripePromise = loadStripe(publicKey);
  }
  return stripePromise;
};

// Add Card Form Component
function AddCardForm({ onSuccess, onCancel }: { onSuccess: () => void; onCancel: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [nickname, setNickname] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) return;

    const { error, paymentMethod } = await stripe.createPaymentMethod({
      type: 'card',
      card: cardElement,
    });

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
      setIsProcessing(false);
      return;
    }

    // Save payment method to backend
    try {
      await apiRequest("/api/payment-methods", {
        method: "POST",
        body: JSON.stringify({
          stripePaymentMethodId: paymentMethod.id,
          nickname
        })
      });

      toast({
        title: "Success",
        description: "Card added successfully"
      });
      onSuccess();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save payment method",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="nickname">Card Nickname (Optional)</Label>
        <Input
          id="nickname"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          placeholder="e.g., Business Card"
          data-testid="input-card-nickname"
        />
      </div>
      <div>
        <Label>Card Details</Label>
        <div className="mt-2 p-3 border rounded-lg">
          <CardElement 
            options={{
              style: {
                base: {
                  fontSize: '16px',
                  color: '#424770',
                  '::placeholder': {
                    color: '#aab7c4',
                  },
                },
              },
            }}
          />
        </div>
      </div>
      <DialogFooter>
        <Button 
          type="button" 
          variant="outline" 
          onClick={onCancel}
          disabled={isProcessing}
        >
          Cancel
        </Button>
        <Button 
          type="submit" 
          disabled={!stripe || isProcessing}
          data-testid="button-add-card"
        >
          {isProcessing ? "Adding..." : "Add Card"}
        </Button>
      </DialogFooter>
    </form>
  );
}

export default function PaymentMethodsPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [showAddCard, setShowAddCard] = useState(false);
  const [showAddEFS, setShowAddEFS] = useState(false);
  const [showAddComdata, setShowAddComdata] = useState(false);
  const [deleteMethod, setDeleteMethod] = useState<PaymentMethod | null>(null);

  // EFS form state
  const [efsData, setEfsData] = useState({
    companyCode: "",
    accountNumber: "",
    nickname: ""
  });

  // Comdata form state
  const [comdataData, setComdataData] = useState({
    customerId: "",
    accountCode: "",
    nickname: ""
  });

  // Fetch payment methods
  const { data: paymentMethods, isLoading } = useQuery<PaymentMethod[]>({
    queryKey: ["/api/payment-methods"]
  });

  // Check Stripe configuration
  const { data: stripeConfig } = useQuery({
    queryKey: ["/api/payment/config"]
  });

  // Delete payment method mutation
  const deletePaymentMethod = useMutation({
    mutationFn: (id: string) => apiRequest(`/api/payment-methods/${id}`, {
      method: "DELETE"
    }),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Payment method removed"
      });
      queryClient.invalidateQueries({ queryKey: ["/api/payment-methods"] });
      setDeleteMethod(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to remove payment method",
        variant: "destructive"
      });
    }
  });

  // Set default payment method mutation
  const setDefaultMethod = useMutation({
    mutationFn: (id: string) => apiRequest(`/api/payment-methods/${id}/default`, {
      method: "PUT"
    }),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Default payment method updated"
      });
      queryClient.invalidateQueries({ queryKey: ["/api/payment-methods"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update default method",
        variant: "destructive"
      });
    }
  });

  // Add EFS method mutation
  const addEFSMethod = useMutation({
    mutationFn: (data: any) => apiRequest("/api/payment-methods/efs", {
      method: "POST",
      body: JSON.stringify(data)
    }),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "EFS account added"
      });
      queryClient.invalidateQueries({ queryKey: ["/api/payment-methods"] });
      setShowAddEFS(false);
      setEfsData({ companyCode: "", accountNumber: "", nickname: "" });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add EFS account",
        variant: "destructive"
      });
    }
  });

  // Add Comdata method mutation
  const addComdataMethod = useMutation({
    mutationFn: (data: any) => apiRequest("/api/payment-methods/comdata", {
      method: "POST",
      body: JSON.stringify(data)
    }),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Comdata account added"
      });
      queryClient.invalidateQueries({ queryKey: ["/api/payment-methods"] });
      setShowAddComdata(false);
      setComdataData({ customerId: "", accountCode: "", nickname: "" });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add Comdata account",
        variant: "destructive"
      });
    }
  });

  const getCardBrandIcon = (brand?: string) => {
    switch (brand?.toLowerCase()) {
      case 'visa':
        return <SiVisa className="h-8 w-12" />;
      case 'mastercard':
        return <SiMastercard className="h-8 w-12" />;
      case 'amex':
        return <SiAmericanexpress className="h-8 w-12" />;
      case 'discover':
        return <SiDiscover className="h-8 w-12" />;
      default:
        return <CreditCard className="h-8 w-12 text-muted-foreground" />;
    }
  };

  const getMethodIcon = (type: string) => {
    switch (type) {
      case 'credit_card':
        return <CreditCard className="h-5 w-5" />;
      case 'efs_check':
      case 'comdata_check':
        return <Truck className="h-5 w-5" />;
      case 'fleet_account':
        return <Building2 className="h-5 w-5" />;
      default:
        return <CreditCard className="h-5 w-5" />;
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Skeleton className="h-8 w-48 mb-8" />
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLocation("/")}
          className="mb-4"
          data-testid="button-back"
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <h1 className="text-3xl font-bold mb-2">Payment Methods</h1>
        <p className="text-muted-foreground">
          Manage your payment methods for faster checkout
        </p>
      </div>

      {/* Stripe Configuration Warning */}
      {!stripeConfig?.hasKeys && (
        <Alert className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Credit card payments are not available. Contact support to enable card payments.
          </AlertDescription>
        </Alert>
      )}

      {/* Payment Methods List */}
      <div className="space-y-4 mb-8">
        {paymentMethods && paymentMethods.length > 0 ? (
          paymentMethods.map((method) => (
            <Card key={method.id} className="hover-elevate">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex gap-4">
                    {method.type === 'credit_card' ? (
                      <div className="flex items-center">
                        {getCardBrandIcon(method.brand)}
                      </div>
                    ) : (
                      <div className="w-12 h-8 flex items-center justify-center bg-muted rounded">
                        {getMethodIcon(method.type)}
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">
                          {method.nickname || 
                           (method.type === 'credit_card' ? `${method.brand} ****${method.last4}` :
                            method.type === 'efs_check' ? `EFS Account` :
                            method.type === 'comdata_check' ? `Comdata Account` :
                            `Fleet Account`)}
                        </span>
                        {method.isDefault && (
                          <Badge variant="secondary" className="text-xs">
                            <Star className="h-3 w-3 mr-1" />
                            Default
                          </Badge>
                        )}
                      </div>
                      {method.type === 'credit_card' && (
                        <p className="text-sm text-muted-foreground">
                          Expires {method.expiryMonth}/{method.expiryYear}
                        </p>
                      )}
                      {method.type === 'efs_check' && method.efsCompanyCode && (
                        <p className="text-sm text-muted-foreground">
                          Company Code: {method.efsCompanyCode}
                        </p>
                      )}
                      {method.type === 'comdata_check' && method.comdataCustomerId && (
                        <p className="text-sm text-muted-foreground">
                          Customer ID: {method.comdataCustomerId}
                        </p>
                      )}
                      {method.type === 'fleet_account' && method.fleetAccountName && (
                        <p className="text-sm text-muted-foreground">
                          {method.fleetAccountName}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {!method.isDefault && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDefaultMethod.mutate(method.id)}
                        data-testid={`button-set-default-${method.id}`}
                      >
                        Set Default
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteMethod(method)}
                      data-testid={`button-delete-${method.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium mb-2">No payment methods</p>
              <p className="text-sm text-muted-foreground">
                Add a payment method to make checkout faster
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Add Payment Method Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stripeConfig?.hasKeys && (
          <Button
            onClick={() => setShowAddCard(true)}
            className="hover-elevate"
            data-testid="button-add-card"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Card
          </Button>
        )}
        <Button
          variant="outline"
          onClick={() => setShowAddEFS(true)}
          className="hover-elevate"
          data-testid="button-add-efs"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add EFS Account
        </Button>
        <Button
          variant="outline"
          onClick={() => setShowAddComdata(true)}
          className="hover-elevate"
          data-testid="button-add-comdata"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Comdata Account
        </Button>
      </div>

      {/* Security Note */}
      <div className="mt-8 p-4 bg-muted/50 rounded-lg flex items-start gap-3">
        <Shield className="h-5 w-5 text-muted-foreground mt-0.5" />
        <div className="text-sm text-muted-foreground">
          <p className="font-medium mb-1">Your payment information is secure</p>
          <p>
            We use industry-standard encryption to protect your payment details. 
            Card numbers are never stored on our servers.
          </p>
        </div>
      </div>

      {/* Add Card Dialog */}
      <Dialog open={showAddCard} onOpenChange={setShowAddCard}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Credit/Debit Card</DialogTitle>
            <DialogDesc>
              Add a new card for faster checkout
            </DialogDesc>
          </DialogHeader>
          {stripePromise && (
            <Elements stripe={getStripe()}>
              <AddCardForm
                onSuccess={() => {
                  setShowAddCard(false);
                  queryClient.invalidateQueries({ queryKey: ["/api/payment-methods"] });
                }}
                onCancel={() => setShowAddCard(false)}
              />
            </Elements>
          )}
        </DialogContent>
      </Dialog>

      {/* Add EFS Dialog */}
      <Dialog open={showAddEFS} onOpenChange={setShowAddEFS}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add EFS Account</DialogTitle>
            <DialogDesc>
              Link your EFS account for fleet payments
            </DialogDesc>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="efs-company">Company Code</Label>
              <Input
                id="efs-company"
                value={efsData.companyCode}
                onChange={(e) => setEfsData({...efsData, companyCode: e.target.value})}
                placeholder="EFS123456"
                data-testid="input-efs-company"
              />
            </div>
            <div>
              <Label htmlFor="efs-account">Account Number</Label>
              <Input
                id="efs-account"
                value={efsData.accountNumber}
                onChange={(e) => setEfsData({...efsData, accountNumber: e.target.value})}
                placeholder="1234567890"
                data-testid="input-efs-account"
              />
            </div>
            <div>
              <Label htmlFor="efs-nickname">Nickname (Optional)</Label>
              <Input
                id="efs-nickname"
                value={efsData.nickname}
                onChange={(e) => setEfsData({...efsData, nickname: e.target.value})}
                placeholder="e.g., Fleet Account"
                data-testid="input-efs-nickname"
              />
            </div>
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setShowAddEFS(false)}
              >
                Cancel
              </Button>
              <Button 
                onClick={() => addEFSMethod.mutate(efsData)}
                disabled={!efsData.companyCode || !efsData.accountNumber}
                data-testid="button-save-efs"
              >
                Add EFS Account
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Comdata Dialog */}
      <Dialog open={showAddComdata} onOpenChange={setShowAddComdata}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Comdata Account</DialogTitle>
            <DialogDesc>
              Link your Comdata account for fleet payments
            </DialogDesc>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="comdata-customer">Customer ID</Label>
              <Input
                id="comdata-customer"
                value={comdataData.customerId}
                onChange={(e) => setComdataData({...comdataData, customerId: e.target.value})}
                placeholder="CMD789012"
                data-testid="input-comdata-customer"
              />
            </div>
            <div>
              <Label htmlFor="comdata-account">Account Code</Label>
              <Input
                id="comdata-account"
                value={comdataData.accountCode}
                onChange={(e) => setComdataData({...comdataData, accountCode: e.target.value})}
                placeholder="ACC456789"
                data-testid="input-comdata-account"
              />
            </div>
            <div>
              <Label htmlFor="comdata-nickname">Nickname (Optional)</Label>
              <Input
                id="comdata-nickname"
                value={comdataData.nickname}
                onChange={(e) => setComdataData({...comdataData, nickname: e.target.value})}
                placeholder="e.g., Fleet Account"
                data-testid="input-comdata-nickname"
              />
            </div>
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setShowAddComdata(false)}
              >
                Cancel
              </Button>
              <Button 
                onClick={() => addComdataMethod.mutate(comdataData)}
                disabled={!comdataData.customerId || !comdataData.accountCode}
                data-testid="button-save-comdata"
              >
                Add Comdata Account
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteMethod} onOpenChange={() => setDeleteMethod(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Payment Method</DialogTitle>
            <DialogDesc>
              Are you sure you want to remove this payment method?
            </DialogDesc>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              {deleteMethod?.nickname || 
               (deleteMethod?.type === 'credit_card' ? 
                `${deleteMethod.brand} ****${deleteMethod.last4}` :
                `${deleteMethod?.type?.replace('_', ' ')}`)}
            </p>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setDeleteMethod(null)}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={() => deleteMethod && deletePaymentMethod.mutate(deleteMethod.id)}
              data-testid="button-confirm-delete"
            >
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}