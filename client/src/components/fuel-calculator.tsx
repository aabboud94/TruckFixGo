import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { useRouteFuelCost, useFuelPrices, useRouteFuelStops } from '@/hooks/use-fuel-prices';
import { useState } from 'react';
import { MapPin, Fuel, TrendingUp, DollarSign, Calculator, Route, AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface FuelCalculatorProps {
  origin?: { lat: number; lng: number };
  destination?: { lat: number; lng: number };
  routeId?: string;
  vehicleId?: string;
  defaultMpg?: number;
  defaultTankCapacity?: number;
  className?: string;
  onCalculate?: (result: any) => void;
}

export function FuelCalculator({
  origin: initialOrigin,
  destination: initialDestination,
  routeId,
  vehicleId,
  defaultMpg = 6.5,
  defaultTankCapacity = 150,
  className,
  onCalculate
}: FuelCalculatorProps) {
  const { toast } = useToast();
  const [origin, setOrigin] = useState(initialOrigin || { lat: 0, lng: 0 });
  const [destination, setDestination] = useState(initialDestination || { lat: 0, lng: 0 });
  const [fuelType, setFuelType] = useState<'diesel' | 'regular' | 'premium'>('diesel');
  const [mpg, setMpg] = useState(defaultMpg);
  const [tankCapacity, setTankCapacity] = useState(defaultTankCapacity);
  const [currentFuelLevel, setCurrentFuelLevel] = useState(0.25); // 25% full
  const [distanceMiles, setDistanceMiles] = useState<number | undefined>();
  const [showOptimization, setShowOptimization] = useState(false);
  const [calculationResult, setCalculationResult] = useState<any>(null);
  
  // Mutation for calculating fuel cost
  const { mutate: calculateCost, isPending: isCalculating } = useRouteFuelCost();
  
  // Get route fuel stops if routeId is provided
  const { data: routeFuelStops, isLoading: isLoadingStops } = useRouteFuelStops(routeId);
  
  // Get nearby fuel prices for origin
  const { data: originPrices } = useFuelPrices(origin?.lat, origin?.lng, 5, fuelType);
  
  // Get nearby fuel prices for destination
  const { data: destinationPrices } = useFuelPrices(destination?.lat, destination?.lng, 5, fuelType);
  
  const handleCalculate = () => {
    if (!origin || !destination) {
      toast({
        title: 'Missing Information',
        description: 'Please provide both origin and destination coordinates.',
        variant: 'destructive',
        data-testid: 'toast-missing-info'
      });
      return;
    }
    
    calculateCost(
      {
        origin,
        destination,
        vehicleId,
        fuelType,
        distanceMiles,
        mpg,
        tankCapacity,
        currentFuelLevel
      },
      {
        onSuccess: (data) => {
          setCalculationResult(data);
          setShowOptimization(true);
          if (onCalculate) {
            onCalculate(data);
          }
          toast({
            title: 'Calculation Complete',
            description: `Estimated fuel cost: $${data.estimatedCost?.toFixed(2) || 'N/A'}`,
            data-testid: 'toast-calculation-complete'
          });
        },
        onError: (error) => {
          toast({
            title: 'Calculation Failed',
            description: 'Unable to calculate fuel costs. Please try again.',
            variant: 'destructive',
            data-testid: 'toast-calculation-failed'
          });
        }
      }
    );
  };
  
  const handleReset = () => {
    setCalculationResult(null);
    setShowOptimization(false);
    setDistanceMiles(undefined);
    setCurrentFuelLevel(0.25);
  };
  
  // Calculate potential savings
  const potentialSavings = calculationResult?.savingsVsAverage || 0;
  const gallonsNeeded = calculationResult?.totalGallonsNeeded || 0;
  const averagePrice = calculationResult?.averagePricePerGallon || 0;
  
  return (
    <Card className={cn('w-full', className)} data-testid="fuel-calculator">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          Fuel Cost Calculator
        </CardTitle>
        <CardDescription>
          Calculate fuel costs and find optimal fuel stops for your route
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Input Section */}
        <div className="space-y-4">
          {/* Route Information */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold">Route Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="origin-lat">Origin Latitude</Label>
                <Input
                  id="origin-lat"
                  type="number"
                  value={origin?.lat || ''}
                  onChange={(e) => setOrigin({ ...origin, lat: parseFloat(e.target.value) })}
                  placeholder="e.g., 40.7128"
                  data-testid="input-origin-lat"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="origin-lng">Origin Longitude</Label>
                <Input
                  id="origin-lng"
                  type="number"
                  value={origin?.lng || ''}
                  onChange={(e) => setOrigin({ ...origin, lng: parseFloat(e.target.value) })}
                  placeholder="e.g., -74.0060"
                  data-testid="input-origin-lng"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dest-lat">Destination Latitude</Label>
                <Input
                  id="dest-lat"
                  type="number"
                  value={destination?.lat || ''}
                  onChange={(e) => setDestination({ ...destination, lat: parseFloat(e.target.value) })}
                  placeholder="e.g., 34.0522"
                  data-testid="input-dest-lat"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dest-lng">Destination Longitude</Label>
                <Input
                  id="dest-lng"
                  type="number"
                  value={destination?.lng || ''}
                  onChange={(e) => setDestination({ ...destination, lng: parseFloat(e.target.value) })}
                  placeholder="e.g., -118.2437"
                  data-testid="input-dest-lng"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="distance">Distance (miles) - Optional</Label>
              <Input
                id="distance"
                type="number"
                value={distanceMiles || ''}
                onChange={(e) => setDistanceMiles(e.target.value ? parseFloat(e.target.value) : undefined)}
                placeholder="Leave blank to calculate automatically"
                data-testid="input-distance"
              />
            </div>
          </div>
          
          <Separator />
          
          {/* Vehicle Configuration */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold">Vehicle Configuration</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fuel-type">Fuel Type</Label>
                <Select value={fuelType} onValueChange={(v) => setFuelType(v as any)}>
                  <SelectTrigger id="fuel-type" data-testid="select-fuel-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="diesel" data-testid="option-diesel">Diesel</SelectItem>
                    <SelectItem value="regular" data-testid="option-regular">Regular</SelectItem>
                    <SelectItem value="premium" data-testid="option-premium">Premium</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="mpg">Miles Per Gallon</Label>
                <Input
                  id="mpg"
                  type="number"
                  value={mpg}
                  onChange={(e) => setMpg(parseFloat(e.target.value))}
                  min="1"
                  max="50"
                  step="0.5"
                  data-testid="input-mpg"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="tank-capacity">Tank Capacity (gallons)</Label>
                <Input
                  id="tank-capacity"
                  type="number"
                  value={tankCapacity}
                  onChange={(e) => setTankCapacity(parseFloat(e.target.value))}
                  min="10"
                  max="500"
                  data-testid="input-tank-capacity"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="fuel-level">Current Fuel Level ({Math.round(currentFuelLevel * 100)}%)</Label>
                <Slider
                  id="fuel-level"
                  value={[currentFuelLevel * 100]}
                  onValueChange={(v) => setCurrentFuelLevel(v[0] / 100)}
                  min={0}
                  max={100}
                  step={5}
                  className="mt-2"
                  data-testid="slider-fuel-level"
                />
              </div>
            </div>
          </div>
        </div>
        
        {/* Calculate Button */}
        <div className="flex gap-2">
          <Button
            onClick={handleCalculate}
            disabled={isCalculating || !origin?.lat || !destination?.lat}
            className="flex-1"
            data-testid="button-calculate"
          >
            {isCalculating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Calculating...
              </>
            ) : (
              <>
                <Calculator className="mr-2 h-4 w-4" />
                Calculate Fuel Cost
              </>
            )}
          </Button>
          {calculationResult && (
            <Button
              onClick={handleReset}
              variant="outline"
              data-testid="button-reset"
            >
              Reset
            </Button>
          )}
        </div>
        
        {/* Results Section */}
        {calculationResult && (
          <div className="space-y-4">
            <Separator />
            
            <div className="space-y-2">
              <h3 className="text-sm font-semibold">Calculation Results</h3>
              
              <div className="grid grid-cols-2 gap-4 p-4 bg-accent/10 rounded-lg">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Total Distance</p>
                  <p className="text-lg font-semibold" data-testid="text-total-distance">
                    {calculationResult.totalDistance?.toFixed(1) || 'N/A'} miles
                  </p>
                </div>
                
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Fuel Needed</p>
                  <p className="text-lg font-semibold" data-testid="text-fuel-needed">
                    {gallonsNeeded.toFixed(1)} gallons
                  </p>
                </div>
                
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Average Price</p>
                  <p className="text-lg font-semibold" data-testid="text-avg-price">
                    ${averagePrice.toFixed(2)}/gal
                  </p>
                </div>
                
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Estimated Cost</p>
                  <p className="text-2xl font-bold text-primary" data-testid="text-estimated-cost">
                    ${calculationResult.estimatedCost?.toFixed(2) || 'N/A'}
                  </p>
                </div>
              </div>
              
              {potentialSavings > 0 && (
                <Alert className="border-green-200 bg-green-50 dark:bg-green-900/20">
                  <DollarSign className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800 dark:text-green-200">
                    Potential savings of ${potentialSavings.toFixed(2)} with optimized fuel stops!
                  </AlertDescription>
                </Alert>
              )}
            </div>
            
            {/* Recommended Fuel Stops */}
            {showOptimization && calculationResult.recommendedStops && calculationResult.recommendedStops.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <Route className="h-4 w-4" />
                  Recommended Fuel Stops
                </h3>
                
                <div className="space-y-2">
                  {calculationResult.recommendedStops.map((stop: any, index: number) => (
                    <div
                      key={index}
                      className="p-3 border rounded-lg space-y-2"
                      data-testid={`card-fuel-stop-${index}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" data-testid={`badge-stop-${index}`}>
                              Stop #{index + 1}
                            </Badge>
                            <h4 className="font-medium" data-testid={`text-station-name-${index}`}>
                              {stop.station?.name || 'Station'}
                            </h4>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            <MapPin className="inline h-3 w-3 mr-1" />
                            {stop.distanceFromRoute?.toFixed(1) || 0} mi from route
                          </p>
                        </div>
                        
                        <div className="text-right">
                          <p className="text-lg font-semibold" data-testid={`text-stop-price-${index}`}>
                            ${stop.price?.pricePerGallon || 'N/A'}
                          </p>
                          <p className="text-sm text-muted-foreground">per gallon</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between pt-2 border-t">
                        <span className="text-sm">
                          <Fuel className="inline h-3 w-3 mr-1" />
                          Fill {stop.gallonsToFill?.toFixed(1) || 0} gallons
                        </span>
                        <span className="font-semibold" data-testid={`text-stop-cost-${index}`}>
                          Cost: ${stop.cost?.toFixed(2) || 'N/A'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Route Fuel Stops (if routeId provided) */}
            {routeId && routeFuelStops && routeFuelStops.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold">Planned Route Fuel Stops</h3>
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {routeFuelStops.length} fuel stop{routeFuelStops.length !== 1 ? 's' : ''} planned for this route
                  </AlertDescription>
                </Alert>
              </div>
            )}
          </div>
        )}
        
        {/* Nearby Prices Preview */}
        {(originPrices || destinationPrices) && !calculationResult && (
          <div className="space-y-2 mt-4 pt-4 border-t">
            <h3 className="text-sm font-semibold">Current Fuel Prices</h3>
            <div className="grid grid-cols-2 gap-4">
              {originPrices && originPrices.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Near origin</p>
                  <p className="font-medium">
                    ${originPrices[0]?.price.pricePerGallon || 'N/A'}/gal
                  </p>
                </div>
              )}
              {destinationPrices && destinationPrices.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Near destination</p>
                  <p className="font-medium">
                    ${destinationPrices[0]?.price.pricePerGallon || 'N/A'}/gal
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}