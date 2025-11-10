import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CreditCard, AlertCircle } from "lucide-react";
import { DialogFooter } from "@/components/ui/dialog";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface MockCardFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export default function MockCardForm({ onSuccess, onCancel }: MockCardFormProps) {
  const { toast } = useToast();
  const [nickname, setNickname] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{
    cardNumber?: string;
    expiry?: string;
    cvv?: string;
  }>({});

  const validateCard = () => {
    const newErrors: typeof errors = {};
    
    // Basic card number validation (16 digits)
    const cleanCardNumber = cardNumber.replace(/\s/g, "");
    if (!cleanCardNumber || cleanCardNumber.length !== 16 || !/^\d+$/.test(cleanCardNumber)) {
      newErrors.cardNumber = "Please enter a valid 16-digit card number";
    }
    
    // Expiry validation (MM/YY)
    if (!expiry || !/^\d{2}\/\d{2}$/.test(expiry)) {
      newErrors.expiry = "Please enter expiry in MM/YY format";
    } else {
      const [month, year] = expiry.split("/").map(Number);
      if (month < 1 || month > 12) {
        newErrors.expiry = "Invalid month";
      }
      const currentYear = new Date().getFullYear() % 100;
      if (year < currentYear) {
        newErrors.expiry = "Card is expired";
      }
    }
    
    // CVV validation (3-4 digits)
    if (!cvv || !/^\d{3,4}$/.test(cvv)) {
      newErrors.cvv = "Please enter a valid CVV (3-4 digits)";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const formatCardNumber = (value: string) => {
    // Remove non-digits and add spaces every 4 digits
    const cleaned = value.replace(/\D/g, "");
    const limited = cleaned.slice(0, 16);
    const formatted = limited.replace(/(\d{4})(?=\d)/g, "$1 ");
    return formatted;
  };

  const formatExpiry = (value: string) => {
    // Auto-add slash after 2 digits
    const cleaned = value.replace(/\D/g, "");
    if (cleaned.length >= 3) {
      return `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}`;
    }
    return cleaned;
  };

  const handleSubmit = async () => {
    if (!validateCard()) return;
    
    setIsSubmitting(true);
    
    try {
      // Call the mock payment method endpoint
      await apiRequest("/api/payment-methods/mock", "POST", {
        nickname: nickname || undefined,
        cardNumber: cardNumber.replace(/\s/g, ""),
        expiry,
        cvv,
        type: "credit_card"
      });
      
      toast({
        title: "Success",
        description: "Test payment method added successfully",
      });
      
      onSuccess();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add payment method",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Test Mode:</strong> Using mock payment system. Card details are for testing only.
        </AlertDescription>
      </Alert>

      <div>
        <Label htmlFor="card-nickname">Card Nickname (Optional)</Label>
        <Input
          id="card-nickname"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          placeholder="e.g., Business Card"
          data-testid="input-card-nickname"
        />
      </div>

      <div>
        <Label>Card Details</Label>
        <div className="space-y-3 mt-2">
          <div>
            <Input
              type="text"
              placeholder="1234 5678 9012 3456"
              value={cardNumber}
              onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
              className={errors.cardNumber ? "border-destructive" : ""}
              data-testid="input-card-number"
            />
            {errors.cardNumber && (
              <p className="text-sm text-destructive mt-1">{errors.cardNumber}</p>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Input
                type="text"
                placeholder="MM/YY"
                value={expiry}
                onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                maxLength={5}
                className={errors.expiry ? "border-destructive" : ""}
                data-testid="input-card-expiry"
              />
              {errors.expiry && (
                <p className="text-sm text-destructive mt-1">{errors.expiry}</p>
              )}
            </div>
            <div>
              <Input
                type="text"
                placeholder="CVV"
                value={cvv}
                onChange={(e) => setCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
                maxLength={4}
                className={errors.cvv ? "border-destructive" : ""}
                data-testid="input-card-cvv"
              />
              {errors.cvv && (
                <p className="text-sm text-destructive mt-1">{errors.cvv}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="text-sm text-muted-foreground">
        <p className="flex items-center gap-2">
          <CreditCard className="h-3 w-3" />
          Test with card number: 4242 4242 4242 4242
        </p>
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button 
          onClick={handleSubmit}
          disabled={isSubmitting || !cardNumber || !expiry || !cvv}
          data-testid="button-save-payment"
        >
          {isSubmitting ? "Adding..." : "Add Card"}
        </Button>
      </DialogFooter>
    </div>
  );
}