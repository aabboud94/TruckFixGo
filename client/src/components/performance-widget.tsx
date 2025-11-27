import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Info,
  AlertTriangle,
  CheckCircle,
  XCircle,
  LucideIcon
} from "lucide-react";
import { 
  LineChart,
  Line,
  ResponsiveContainer,
  YAxis,
  Tooltip as RechartsTooltip
} from "recharts";

interface PerformanceWidgetProps {
  title: string;
  value: number | string;
  unit?: string;
  trend?: number;
  trendData?: Array<{ value: number }>;
  status?: 'green' | 'yellow' | 'red' | 'neutral';
  target?: number;
  description?: string;
  icon?: LucideIcon;
  variant?: 'default' | 'compact' | 'detailed';
  onClick?: () => void;
  loading?: boolean;
  className?: string;
}

export default function PerformanceWidget({
  title,
  value,
  unit = '',
  trend,
  trendData,
  status,
  target,
  description,
  icon: Icon,
  variant = 'default',
  onClick,
  loading = false,
  className
}: PerformanceWidgetProps) {
  const formatValue = () => {
    if (typeof value === 'string') return value;
    
    switch (unit) {
      case 'percentage':
      case '%':
        return `${value.toFixed(1)}%`;
      case 'dollars':
      case '$':
        return `$${value.toLocaleString()}`;
      case 'minutes':
      case 'min':
        return `${value.toFixed(0)} min`;
      case 'hours':
      case 'hr':
        return `${value.toFixed(1)} hr`;
      case 'rating':
        return value.toFixed(1);
      case 'count':
        return value.toFixed(0);
      default:
        return value.toFixed(2) + (unit ? ` ${unit}` : '');
    }
  };

  const getTrendIcon = () => {
    if (!trend) return <Minus className="h-4 w-4 text-muted-foreground" />;
    if (trend > 0) return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (trend < 0) return <TrendingDown className="h-4 w-4 text-red-600" />;
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'green':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'yellow':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'red':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return null;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'green':
        return 'border-green-600';
      case 'yellow':
        return 'border-yellow-600';
      case 'red':
        return 'border-red-600';
      default:
        return '';
    }
  };

  const calculateProgress = () => {
    if (!target || typeof value !== 'number') return 0;
    return Math.min(100, (value / target) * 100);
  };

  if (loading) {
    return (
      <Card className={cn("animate-pulse", className)}>
        <CardHeader className="pb-2">
          <div className="h-4 bg-muted rounded w-3/4"></div>
        </CardHeader>
        <CardContent>
          <div className="h-8 bg-muted rounded w-1/2"></div>
        </CardContent>
      </Card>
    );
  }

  if (variant === 'compact') {
    return (
      <div 
        className={cn(
          "flex items-center justify-between p-3 rounded-lg border bg-card hover-elevate cursor-pointer",
          getStatusColor(),
          className
        )}
        onClick={onClick}
        data-testid="widget-compact"
      >
        <div className="flex items-center gap-3">
          {Icon && <Icon className="h-5 w-5 text-muted-foreground" />}
          <div>
            <p className="text-sm font-medium">{title}</p>
            <p className="text-2xl font-bold">{formatValue()}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {trend !== undefined && (
            <div className="flex items-center gap-1">
              {getTrendIcon()}
              <span className={cn(
                "text-sm font-medium",
                trend > 0 ? "text-green-600" : trend < 0 ? "text-red-600" : "text-muted-foreground"
              )}>
                {Math.abs(trend).toFixed(1)}%
              </span>
            </div>
          )}
          {getStatusIcon()}
        </div>
      </div>
    );
  }

  if (variant === 'detailed') {
    return (
      <Card 
        className={cn(
          "hover-elevate cursor-pointer",
          getStatusColor(),
          className
        )}
        onClick={onClick}
        data-testid="widget-detailed"
      >
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              {Icon && <Icon className="h-4 w-4" />}
              {title}
            </CardTitle>
            <div className="flex items-center gap-2">
              {description && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">{description}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              {getStatusIcon()}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-baseline justify-between">
            <div className="text-3xl font-bold">{formatValue()}</div>
            {trend !== undefined && (
              <div className="flex items-center gap-1">
                {getTrendIcon()}
                <span className={cn(
                  "text-sm font-medium",
                  trend > 0 ? "text-green-600" : trend < 0 ? "text-red-600" : "text-muted-foreground"
                )}>
                  {trend > 0 ? '+' : ''}{trend.toFixed(1)}%
                </span>
              </div>
            )}
          </div>
          
          {target && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Target: {target}</span>
                <span>{calculateProgress().toFixed(0)}%</span>
              </div>
              <Progress value={calculateProgress()} className="h-2" />
            </div>
          )}

          {trendData && trendData.length > 0 && (
            <div className="h-12 mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <YAxis hide />
                  <RechartsTooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload[0]) {
                        const value = payload[0].value;
                        const formatted =
                          typeof value === "number"
                            ? value.toFixed(1)
                            : value ?? "--";
                        return (
                          <div className="bg-background border rounded p-2 text-xs">
                            {formatted}
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke={
                      status === 'green' ? '#16a34a' :
                      status === 'yellow' ? '#ca8a04' :
                      status === 'red' ? '#dc2626' :
                      'hsl(var(--primary))'
                    }
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Default variant
  return (
    <Card 
      className={cn(
        "hover-elevate cursor-pointer",
        getStatusColor(),
        className
      )}
      onClick={onClick}
      data-testid="widget-default"
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          {title}
        </CardTitle>
        <div className="flex items-center gap-2">
          {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
          {getStatusIcon()}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{formatValue()}</div>
        {trend !== undefined && (
          <p className={cn(
            "text-xs flex items-center gap-1 mt-1",
            trend > 0 ? "text-green-600" : trend < 0 ? "text-red-600" : "text-muted-foreground"
          )}>
            {getTrendIcon()}
            <span>
              {trend > 0 ? '+' : ''}{trend.toFixed(1)}% from last period
            </span>
          </p>
        )}
        {target && (
          <div className="mt-2">
            <Progress value={calculateProgress()} className="h-1" />
            <p className="text-xs text-muted-foreground mt-1">
              Target: {target}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Export additional utility components for specialized use cases
export function PerformanceMetricCard({ 
  metrics, 
  className 
}: { 
  metrics: PerformanceWidgetProps[], 
  className?: string 
}) {
  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4", className)}>
      {metrics.map((metric, index) => (
        <PerformanceWidget key={index} {...metric} />
      ))}
    </div>
  );
}

export function PerformanceSparkline({
  data,
  color = 'hsl(var(--primary))',
  height = 40,
  className
}: {
  data: number[];
  color?: string;
  height?: number;
  className?: string;
}) {
  const chartData = data.map((value) => ({ value }));
  
  return (
    <div className={cn("w-full", className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={1.5}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
