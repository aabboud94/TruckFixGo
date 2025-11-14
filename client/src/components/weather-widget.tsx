import { useState } from 'react';
import {
  Cloud,
  CloudDrizzle,
  CloudLightning,
  CloudRain,
  CloudSnow,
  Sun,
  Wind,
  Droplets,
  Eye,
  Thermometer,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  CloudFog,
  Gauge
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import {
  useWeather,
  useWeatherForecast,
  useWeatherAlerts,
  useJobWeather,
  getWeatherIcon,
  getAlertSeverityColor,
  formatWeatherImpactWarning
} from '@/hooks/use-weather';

interface WeatherWidgetProps {
  lat?: number;
  lng?: number;
  jobId?: string;
  className?: string;
  compact?: boolean;
  showAlerts?: boolean;
  showForecast?: boolean;
  showImpactScore?: boolean;
}

// Map icon names to Lucide React components
const weatherIcons: Record<string, React.ComponentType<any>> = {
  'sun': Sun,
  'cloud-sun': Sun,
  'cloud': Cloud,
  'cloud-rain': CloudRain,
  'cloud-drizzle': CloudDrizzle,
  'cloud-lightning': CloudLightning,
  'snowflake': CloudSnow,
  'cloud-fog': CloudFog,
  'wind': Wind,
};

function WeatherIcon({ conditions, className }: { conditions: string; className?: string }) {
  const iconName = getWeatherIcon(conditions);
  const Icon = weatherIcons[iconName] || Cloud;
  return <Icon className={className} />;
}

function WeatherAlertItem({ alert }: { alert: any }) {
  return (
    <Alert className={cn('mb-2', {
      'border-red-500': alert.severity === 'extreme',
      'border-orange-500': alert.severity === 'severe',
      'border-yellow-500': alert.severity === 'moderate',
      'border-blue-500': alert.severity === 'minor',
    })}>
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle className={getAlertSeverityColor(alert.severity)}>
        {alert.alertType} - {alert.severity.toUpperCase()}
      </AlertTitle>
      <AlertDescription>{alert.message}</AlertDescription>
      {alert.endTime && (
        <div className="text-xs text-muted-foreground mt-2">
          Until: {new Date(alert.endTime).toLocaleString()}
        </div>
      )}
    </Alert>
  );
}

function WeatherSkeleton({ compact }: { compact?: boolean }) {
  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <Skeleton className="h-8 w-8 rounded-full" />
        <div>
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-3 w-20 mt-1" />
        </div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-32" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </CardContent>
    </Card>
  );
}

function CompactWeatherDisplay({ weather }: { weather: any }) {
  return (
    <div className="flex items-center gap-3">
      <WeatherIcon conditions={weather.conditions} className="h-8 w-8 text-primary" />
      <div>
        <div className="flex items-center gap-2">
          <span className="text-lg font-semibold">
            {Math.round(weather.temperature)}°F
          </span>
          <span className="text-sm text-muted-foreground">
            {weather.conditions}
          </span>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Wind className="h-3 w-3" />
            {weather.windSpeed} mph
          </span>
          <span className="flex items-center gap-1">
            <Droplets className="h-3 w-3" />
            {weather.precipitation}%
          </span>
        </div>
      </div>
    </div>
  );
}

function ExpandedWeatherDisplay({ weather, forecast, impactScore, showForecast, showImpactScore }: {
  weather: any;
  forecast?: any;
  impactScore?: number;
  showForecast?: boolean;
  showImpactScore?: boolean;
}) {
  const [forecastOpen, setForecastOpen] = useState(false);

  const impactWarning = impactScore ? formatWeatherImpactWarning(impactScore, weather.conditions) : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Current Weather
          {weather.timestamp && (
            <span className="text-xs text-muted-foreground font-normal">
              Updated: {new Date(weather.timestamp).toLocaleTimeString()}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Current conditions */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <WeatherIcon conditions={weather.conditions} className="h-12 w-12 text-primary" />
              <div>
                <div className="text-3xl font-bold">
                  {Math.round(weather.temperature)}°F
                </div>
                <div className="text-lg text-muted-foreground">
                  {weather.conditions}
                </div>
              </div>
            </div>

            {showImpactScore && impactScore !== undefined && (
              <div className="text-right">
                <div className="text-sm text-muted-foreground">Impact Score</div>
                <div className={cn('text-2xl font-bold', {
                  'text-green-600': impactScore < 40,
                  'text-yellow-600': impactScore >= 40 && impactScore < 70,
                  'text-red-600': impactScore >= 70,
                })}>
                  {impactScore}%
                </div>
              </div>
            )}
          </div>

          {/* Impact warning */}
          {impactWarning && (
            <Alert className="border-yellow-500">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{impactWarning}</AlertDescription>
            </Alert>
          )}

          {/* Weather details */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <Wind className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="text-sm text-muted-foreground">Wind</div>
                <div className="font-medium">{weather.windSpeed} mph</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Droplets className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="text-sm text-muted-foreground">Precipitation</div>
                <div className="font-medium">{weather.precipitation}%</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Gauge className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="text-sm text-muted-foreground">Humidity</div>
                <div className="font-medium">{weather.humidity}%</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="text-sm text-muted-foreground">Visibility</div>
                <div className="font-medium">{weather.visibility} mi</div>
              </div>
            </div>
          </div>

          {/* Forecast */}
          {showForecast && forecast && (
            <Collapsible open={forecastOpen} onOpenChange={setForecastOpen}>
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-between"
                  data-testid="button-toggle-forecast"
                >
                  5-Day Forecast
                  {forecastOpen ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2">
                <div className="space-y-2">
                  {forecast.daily?.map((day: any, index: number) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
                    >
                      <div className="flex items-center gap-2">
                        <WeatherIcon conditions={day.conditions} className="h-4 w-4" />
                        <span className="text-sm">
                          {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                        </span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-muted-foreground">
                          {day.conditions}
                        </span>
                        <div className="flex items-center gap-1 text-sm">
                          <span className="text-muted-foreground">L:</span>
                          <span>{Math.round(day.temperatureLow)}°</span>
                          <span className="text-muted-foreground">H:</span>
                          <span>{Math.round(day.temperatureHigh)}°</span>
                        </div>
                        {day.precipitationChance > 30 && (
                          <Badge variant="secondary" className="text-xs">
                            {day.precipitationChance}%
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function WeatherWidget({
  lat,
  lng,
  jobId,
  className,
  compact = false,
  showAlerts = true,
  showForecast = true,
  showImpactScore = false,
}: WeatherWidgetProps) {
  // Use appropriate hooks based on whether we have jobId or coordinates
  const weatherQuery = jobId ? useJobWeather(jobId) : useWeather(lat, lng);
  const forecastQuery = !jobId ? useWeatherForecast(lat, lng) : null;
  const alertsQuery = showAlerts ? useWeatherAlerts(lat, lng) : null;

  // Handle loading states
  if (weatherQuery.isLoading) {
    return <WeatherSkeleton compact={compact} />;
  }

  // Handle error states
  if (weatherQuery.isError) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Failed to load weather data. Please try again later.
        </AlertDescription>
      </Alert>
    );
  }

  // No data available
  if (!weatherQuery.data) {
    return null;
  }

  const weather = jobId ? weatherQuery.data.current : weatherQuery.data;
  const forecast = jobId ? weatherQuery.data.forecast : forecastQuery?.data;
  const alerts = alertsQuery?.data || [];
  const impactScore = jobId ? weatherQuery.data.impactScore : undefined;

  return (
    <div className={cn('space-y-3', className)}>
      {/* Weather alerts */}
      {showAlerts && alerts.length > 0 && (
        <div>
          {alerts.map((alert: any) => (
            <WeatherAlertItem key={alert.id} alert={alert} />
          ))}
        </div>
      )}

      {/* Weather display */}
      {compact ? (
        <CompactWeatherDisplay weather={weather} />
      ) : (
        <ExpandedWeatherDisplay
          weather={weather}
          forecast={forecast}
          impactScore={impactScore}
          showForecast={showForecast && !jobId}
          showImpactScore={showImpactScore}
        />
      )}
    </div>
  );
}

// Compact weather badge for inline display
export function WeatherBadge({ lat, lng, jobId }: {
  lat?: number;
  lng?: number;
  jobId?: string;
}) {
  const weatherQuery = jobId ? useJobWeather(jobId) : useWeather(lat, lng);

  if (weatherQuery.isLoading) {
    return <Skeleton className="h-6 w-20" />;
  }

  if (!weatherQuery.data) {
    return null;
  }

  const weather = jobId ? weatherQuery.data.current : weatherQuery.data;

  return (
    <Badge variant="secondary" className="gap-1">
      <WeatherIcon conditions={weather.conditions} className="h-3 w-3" />
      <span>{Math.round(weather.temperature)}°F</span>
      <span className="text-xs opacity-70">{weather.conditions}</span>
    </Badge>
  );
}