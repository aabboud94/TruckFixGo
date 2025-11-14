import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Info, DollarSign, TrendingUp, Calculator } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface CommissionCalculatorProps {
  baseAmount: number;
  surgeMultiplier?: number;
  contractorTier?: 'bronze' | 'silver' | 'gold';
  showDetails?: boolean;
  onCalculated?: (calculation: CommissionCalculation) => void;
  className?: string;
}

interface CommissionCalculation {
  baseAmount: number;
  commissionAmount: number;
  platformFeeAmount: number;
  netPayoutAmount: number;
  commissionRate: number;
}

export function CommissionCalculator({
  baseAmount,
  surgeMultiplier = 1.0,
  contractorTier = 'bronze',
  showDetails = true,
  onCalculated,
  className
}: CommissionCalculatorProps) {
  const [calculation, setCalculation] = useState<CommissionCalculation | null>(null);

  const calculateMutation = useMutation({
    mutationFn: async (params: { amount: number; surgeMultiplier?: number }) => {
      return await apiRequest('/api/payments/commissions/calculate', {
        method: 'POST',
        body: params
      });
    },
    onSuccess: (data) => {
      setCalculation(data);
      onCalculated?.(data);
    }
  });

  useEffect(() => {
    if (baseAmount > 0) {
      calculateMutation.mutate({ 
        amount: baseAmount, 
        surgeMultiplier 
      });
    }
  }, [baseAmount, surgeMultiplier]);

  if (!calculation && !calculateMutation.isPending) {
    return null;
  }

  const getTierColor = (tier: string) => {
    switch(tier) {
      case 'gold': return 'bg-yellow-500/10 text-yellow-600 border-yellow-300';
      case 'silver': return 'bg-gray-500/10 text-gray-600 border-gray-300';
      default: return 'bg-orange-500/10 text-orange-600 border-orange-300';
    }
  };

  const effectiveAmount = baseAmount * surgeMultiplier;
  const surgeBonus = effectiveAmount - baseAmount;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Calculator className="w-5 h-5" />
            Commission Calculator
          </span>
          <Badge className={getTierColor(contractorTier)}>
            {contractorTier.toUpperCase()} TIER
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {calculateMutation.isPending ? (
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-gray-200 rounded w-3/4" />
            <div className="h-4 bg-gray-200 rounded w-1/2" />
            <div className="h-4 bg-gray-200 rounded w-2/3" />
          </div>
        ) : calculation ? (
          <>
            {/* Base Amount Section */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Base Job Amount</span>
                <span className="font-medium">{formatCurrency(baseAmount)}</span>
              </div>
              
              {surgeMultiplier > 1 && (
                <>
                  <div className="flex justify-between items-center text-green-600">
                    <span className="text-sm flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      Surge Bonus ({((surgeMultiplier - 1) * 100).toFixed(0)}%)
                    </span>
                    <span className="font-medium">+{formatCurrency(surgeBonus)}</span>
                  </div>
                  <div className="flex justify-between items-center font-medium">
                    <span className="text-sm">Total Amount</span>
                    <span>{formatCurrency(effectiveAmount)}</span>
                  </div>
                </>
              )}
            </div>

            <Separator />

            {/* Commission Breakdown */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  Platform Fee ({(calculation.commissionRate * 100).toFixed(1)}%)
                </span>
                <span className="text-red-600">-{formatCurrency(calculation.platformFeeAmount)}</span>
              </div>

              {showDetails && (
                <div className="flex justify-between items-center text-xs text-muted-foreground">
                  <span>Service & Processing</span>
                  <span>-{formatCurrency(calculation.commissionAmount)}</span>
                </div>
              )}
            </div>

            <Separator />

            {/* Net Payout */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="font-medium">Your Earnings</span>
                <span className="text-xl font-bold text-green-600">
                  {formatCurrency(calculation.netPayoutAmount)}
                </span>
              </div>

              {showDetails && (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    <strong>Tier Benefits:</strong>
                    <ul className="mt-1 space-y-1">
                      {contractorTier === 'gold' && (
                        <>
                          <li>• Lowest commission rate (12%)</li>
                          <li>• Priority job matching</li>
                          <li>• Weekly express payouts</li>
                        </>
                      )}
                      {contractorTier === 'silver' && (
                        <>
                          <li>• Reduced commission rate (13.5%)</li>
                          <li>• Bi-weekly payouts</li>
                        </>
                      )}
                      {contractorTier === 'bronze' && (
                        <>
                          <li>• Standard commission rate (15%)</li>
                          <li>• Monthly payouts</li>
                          <li>• Complete more jobs to unlock Silver tier</li>
                        </>
                      )}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}
            </div>

            {/* Quick Actions */}
            {showDetails && (
              <div className="pt-2 space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => window.open('/help/commission-tiers', '_blank')}
                >
                  <Info className="w-4 h-4 mr-2" />
                  Learn About Commission Tiers
                </Button>
              </div>
            )}
          </>
        ) : null}

        {calculateMutation.isError && (
          <Alert variant="destructive">
            <AlertDescription>
              Failed to calculate commission. Please try again.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}