import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useFuelPrices, useFuelTrends, useFuelPriceUpdates, useFuelAlerts } from '@/hooks/use-fuel-prices';
import { useState, useEffect } from 'react';
import { MapPin, TrendingDown, TrendingUp, DollarSign, Bell, ChevronRight, AlertCircle, Fuel } from 'lucide-react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface FuelPriceWidgetProps {
  latitude?: number;
  longitude?: number;
  radius?: number;
  fuelType?: 'diesel' | 'regular' | 'premium';
  showTrends?: boolean;
  showAlerts?: boolean;
  maxStations?: number;
  className?: string;
}

export function FuelPriceWidget({
  latitude,
  longitude,
  radius = 10,
  fuelType = 'diesel',
  showTrends = true,
  showAlerts = true,
  maxStations = 5,
  className
}: FuelPriceWidgetProps) {
  const { toast } = useToast();
  const [selectedStation, setSelectedStation] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  
  // Get user's current location if not provided
  useEffect(() => {
    if (!latitude || !longitude) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.error('Error getting location:', error);
          // Default to a central US location if geolocation fails
          setUserLocation({ lat: 39.8283, lng: -98.5795 });
        }
      );
    }
  }, [latitude, longitude]);
  
  const effectiveLat = latitude || userLocation?.lat;
  const effectiveLng = longitude || userLocation?.lng;
  
  // Fetch fuel prices near location
  const { data: prices, isLoading, error } = useFuelPrices(
    effectiveLat,
    effectiveLng,
    radius,
    fuelType
  );
  
  // Fetch regional trends
  const { data: trends } = useFuelTrends('US', fuelType);
  
  // Manage alerts
  const { alerts, createAlert } = useFuelAlerts();
  
  // Subscribe to real-time updates
  useFuelPriceUpdates(
    (update) => {
      // Handle price update
      toast({
        title: 'Fuel Price Update',
        description: `${update.fuelType} at ${update.stationId}: $${update.newPrice} (${update.changePercent > 0 ? '+' : ''}${update.changePercent}%)`,
        "data-testid": 'toast-fuel-update'
      });
    },
    (alert) => {
      // Handle alert
      toast({
        title: 'Fuel Price Alert',
        description: alert.message,
        variant: alert.severity === 'critical' ? 'destructive' : 'default',
        "data-testid": 'toast-fuel-alert'
      });
    }
  );
  
  // Calculate average price
  const avgPrice = prices?.reduce((sum, p) => sum + Number(p.price.pricePerGallon), 0) / (prices?.length || 1);
  
  // Find cheapest station
  const cheapestStation = prices?.reduce((min, p) => 
    !min || Number(p.price.pricePerGallon) < Number(min.price.pricePerGallon) ? p : min
  , prices?.[0]);
  
  // Format trend data for chart
  const trendData = trends?.forecast?.map((point) => ({
    date: new Date(point.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    price: point.predictedPrice,
    current: trends.currentAverage
  })) || [];
  
  const handleCreateAlert = () => {
    if (cheapestStation) {
      createAlert({
        alertType: 'threshold',
        severity: 'medium',
        fuelType,
        stationId: cheapestStation.station.id,
        thresholdPrice: String(Number(cheapestStation.price.pricePerGallon) - 0.10),
        location: { lat: effectiveLat!, lng: effectiveLng! }
      });
      
      toast({
        title: 'Alert Created',
        description: `You'll be notified when ${fuelType} drops below $${(Number(cheapestStation.price.pricePerGallon) - 0.10).toFixed(2)}`,
        "data-testid": 'toast-alert-created'
      });
    }
  };
  
  if (isLoading) {
    return (
      <Card className={cn('w-full', className)} data-testid="fuel-widget-loading">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Fuel className="h-5 w-5" />
            Loading Fuel Prices...
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }
  
  if (error) {
    return (
      <Card className={cn('w-full', className)} data-testid="fuel-widget-error">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            Unable to Load Fuel Prices
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertDescription>
              Failed to fetch fuel prices. Please check your location settings and try again.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className={cn('w-full', className)} data-testid="fuel-price-widget">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Fuel className="h-5 w-5" />
            Nearby Fuel Prices
          </CardTitle>
          {showAlerts && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleCreateAlert}
              data-testid="button-create-alert"
            >
              <Bell className="h-4 w-4 mr-1" />
              Set Alert
            </Button>
          )}
        </div>
        
        {prices && prices.length > 0 && (
          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
            <span data-testid="text-fuel-type">
              {fuelType.charAt(0).toUpperCase() + fuelType.slice(1)}
            </span>
            <span data-testid="text-avg-price">
              Avg: ${avgPrice?.toFixed(2)}/gal
            </span>
            {cheapestStation && (
              <Badge variant="outline" className="text-green-600" data-testid="badge-cheapest">
                <TrendingDown className="h-3 w-3 mr-1" />
                Cheapest: ${cheapestStation.price.pricePerGallon}
              </Badge>
            )}
          </div>
        )}
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Station List */}
        <div className="space-y-2">
          {prices?.slice(0, maxStations).map((item) => (
            <div
              key={item.station.id}
              className={cn(
                'p-3 border rounded-lg cursor-pointer transition-colors hover-elevate',
                selectedStation === item.station.id && 'bg-accent'
              )}
              onClick={() => setSelectedStation(item.station.id)}
              data-testid={`card-station-${item.station.id}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium" data-testid={`text-station-name-${item.station.id}`}>
                      {item.station.name}
                    </h4>
                    <Badge variant="outline" data-testid={`badge-brand-${item.station.id}`}>
                      {item.station.brand}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1" data-testid={`text-address-${item.station.id}`}>
                    {item.station.address}, {item.station.city}, {item.station.state}
                  </p>
                  <div className="flex items-center gap-3 mt-2 text-sm">
                    <span className="flex items-center gap-1" data-testid={`text-distance-${item.station.id}`}>
                      <MapPin className="h-3 w-3" />
                      {item.distance.toFixed(1)} mi
                    </span>
                    {item.savings && item.savings > 0 && (
                      <Badge variant="outline" className="text-green-600" data-testid={`badge-savings-${item.station.id}`}>
                        Save ${item.savings.toFixed(2)}
                      </Badge>
                    )}
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-2xl font-bold" data-testid={`text-price-${item.station.id}`}>
                    ${item.price.pricePerGallon}
                  </div>
                  <div className="text-xs text-muted-foreground">per gallon</div>
                  {item.price.priceChangePercent && (
                    <div className={cn(
                      'flex items-center justify-end gap-1 mt-1 text-sm',
                      Number(item.price.priceChangePercent) > 0 ? 'text-red-600' : 'text-green-600'
                    )}>
                      {Number(item.price.priceChangePercent) > 0 ? (
                        <TrendingUp className="h-3 w-3" />
                      ) : (
                        <TrendingDown className="h-3 w-3" />
                      )}
                      {Math.abs(Number(item.price.priceChangePercent))}%
                    </div>
                  )}
                </div>
              </div>
              
              {item.recommended && (
                <Badge className="mt-2" variant="default" data-testid={`badge-recommended-${item.station.id}`}>
                  Recommended
                </Badge>
              )}
            </div>
          ))}
        </div>
        
        {/* Price Trends Chart */}
        {showTrends && trends && trendData.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              Regional Price Trends
              <Badge variant="outline">
                {trends.trend === 'increasing' ? (
                  <TrendingUp className="h-3 w-3 mr-1 text-red-600" />
                ) : trends.trend === 'decreasing' ? (
                  <TrendingDown className="h-3 w-3 mr-1 text-green-600" />
                ) : null}
                {trends.weeklyChange > 0 ? '+' : ''}{(trends.weeklyChange * 100).toFixed(1)}% this week
              </Badge>
            </h3>
            
            <div className="h-48 w-full" data-testid="chart-price-trends">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis 
                    domain={['dataMin - 0.1', 'dataMax + 0.1']}
                    tickFormatter={(value) => `$${value.toFixed(2)}`}
                  />
                  <Tooltip 
                    formatter={(value: number) => `$${value.toFixed(2)}`}
                    labelFormatter={(label) => `Date: ${label}`}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="price" 
                    stroke="hsl(var(--primary))"
                    fill="hsl(var(--primary) / 0.1)"
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="current"
                    stroke="hsl(var(--muted-foreground))"
                    strokeDasharray="5 5"
                    dot={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
        
        {/* Active Alerts */}
        {showAlerts && alerts && alerts.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold">Active Alerts</h3>
            {alerts.slice(0, 3).map((alert) => (
              <Alert key={alert.id} data-testid={`alert-${alert.id}`}>
                <Bell className="h-4 w-4" />
                <AlertDescription>
                  {alert.alertType === 'price_drop' && 'Price drop alert'}
                  {alert.alertType === 'threshold' && `Alert when below $${alert.thresholdPrice}`}
                  {alert.stationId && ' at saved station'}
                </AlertDescription>
              </Alert>
            ))}
          </div>
        )}
        
        {/* No stations found */}
        {(!prices || prices.length === 0) && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              No fuel stations found within {radius} miles of your location.
              Try increasing the search radius.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}