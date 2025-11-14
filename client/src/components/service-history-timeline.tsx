import { format, formatDistanceToNow } from 'date-fns';
import { 
  Activity,
  AlertCircle,
  Calendar,
  CheckCircle,
  Clock,
  DollarSign,
  FileText,
  MapPin,
  Shield,
  Truck,
  User,
  Wrench
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useServiceHistory } from '@/hooks/use-service-history';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import type { ServiceHistory } from '@shared/schema';

interface ServiceHistoryTimelineProps {
  vehicleId: string;
  maxHeight?: string;
  showFilters?: boolean;
}

const serviceTypeConfig: Record<string, { label: string; color: string; icon: any }> = {
  oil_change: { label: 'Oil Change', color: 'bg-yellow-500', icon: Wrench },
  tire_service: { label: 'Tire Service', color: 'bg-gray-600', icon: Activity },
  brake_service: { label: 'Brake Service', color: 'bg-red-500', icon: AlertCircle },
  engine_repair: { label: 'Engine Repair', color: 'bg-blue-600', icon: Wrench },
  transmission: { label: 'Transmission', color: 'bg-purple-600', icon: Activity },
  electrical: { label: 'Electrical', color: 'bg-orange-500', icon: Activity },
  suspension: { label: 'Suspension', color: 'bg-green-600', icon: Activity },
  exhaust: { label: 'Exhaust', color: 'bg-gray-700', icon: Activity },
  cooling_system: { label: 'Cooling System', color: 'bg-cyan-500', icon: Activity },
  fuel_system: { label: 'Fuel System', color: 'bg-indigo-500', icon: Activity },
  inspection: { label: 'Inspection', color: 'bg-teal-500', icon: FileText },
  diagnostic: { label: 'Diagnostic', color: 'bg-pink-500', icon: Activity },
  other: { label: 'Other', color: 'bg-gray-500', icon: Wrench }
};

function getServiceTypeInfo(serviceType: string) {
  return serviceTypeConfig[serviceType] || serviceTypeConfig.other;
}

interface WarrantyInfo {
  provider?: string;
  expiresAt?: string;
  duration?: string;
  terms?: string;
}

function ServiceHistoryItem({ service }: { service: ServiceHistory }) {
  const typeInfo = getServiceTypeInfo(service.serviceType);
  const Icon = typeInfo.icon;
  const warrantyInfo = service.warrantyInfo as WarrantyInfo | null;
  const hasWarranty = warrantyInfo && warrantyInfo.expiresAt && new Date(warrantyInfo.expiresAt) > new Date();

  return (
    <div className="relative flex items-start gap-4" data-testid={`service-item-${service.id}`}>
      {/* Timeline line */}
      <div className="absolute left-5 top-10 bottom-0 w-0.5 bg-muted"></div>
      
      {/* Service icon */}
      <div
        className={cn(
          'relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white',
          typeInfo.color
        )}
      >
        <Icon className="h-5 w-5" />
      </div>

      {/* Service details */}
      <div className="flex-1 space-y-2 pb-8">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h4 className="font-medium leading-none">{typeInfo.label}</h4>
              {hasWarranty && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge variant="outline" className="gap-1">
                        <Shield className="h-3 w-3" />
                        Warranty
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Expires: {warrantyInfo?.expiresAt && format(new Date(warrantyInfo.expiresAt), 'MMM d, yyyy')}</p>
                      <p className="text-xs text-muted-foreground">
                        {warrantyInfo?.provider}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {format(new Date(service.serviceDate), 'MMM d, yyyy')}
              </span>
              {service.mileage && (
                <span className="flex items-center gap-1">
                  <Truck className="h-3 w-3" />
                  {service.mileage.toLocaleString()} mi
                </span>
              )}
              {service.contractorId && (
                <span className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  Contractor
                </span>
              )}
            </div>
          </div>
          <div className="text-right">
            <div className="text-lg font-semibold">
              ${service.totalCost ? Number(service.totalCost).toFixed(2) : '0.00'}
            </div>
            {service.jobId && (
              <Badge variant="secondary" className="mt-1">
                Job #{service.jobId.slice(-6)}
              </Badge>
            )}
          </div>
        </div>

        {/* Service description */}
        {service.description && (
          <p className="text-sm text-muted-foreground">{service.description}</p>
        )}

        {/* Parts and labor */}
        {(service.partsUsed && Array.isArray(service.partsUsed) && service.partsUsed.length > 0) || service.laborHours ? (
          <div className="flex flex-wrap gap-2 pt-1">
            {Array.isArray(service.partsUsed) && service.partsUsed.map((part: any, index: number) => (
              <Badge key={index} variant="outline" className="text-xs">
                {typeof part === 'object' ? part.partName || JSON.stringify(part) : part}
              </Badge>
            ))}
            {service.laborHours && (
              <Badge variant="outline" className="text-xs">
                <Clock className="mr-1 h-3 w-3" />
                {service.laborHours} hours
              </Badge>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function ServiceHistoryTimeline({
  vehicleId,
  maxHeight = '600px',
  showFilters = true
}: ServiceHistoryTimelineProps) {
  const [selectedType, setSelectedType] = useState<string | undefined>(undefined);
  const [showWarrantyOnly, setShowWarrantyOnly] = useState(false);
  const [limit, setLimit] = useState(20);
  
  const { data, isLoading, error } = useServiceHistory(vehicleId, {
    serviceType: selectedType,
    hasWarranty: showWarrantyOnly ? true : undefined,
    limit
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Service History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Service History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-4 w-4" />
            <p>Failed to load service history</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const services = data?.items || [];
  const hasMore = data?.hasMore || false;
  const totalServices = data?.total || 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Service History
            {totalServices > 0 && (
              <Badge variant="secondary">{totalServices} Total</Badge>
            )}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        {showFilters && (
          <div className="mb-4 flex flex-wrap gap-2">
            <Button
              variant={selectedType === undefined ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedType(undefined)}
              data-testid="filter-all"
            >
              All Types
            </Button>
            {Object.entries(serviceTypeConfig).map(([key, config]) => (
              <Button
                key={key}
                variant={selectedType === key ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedType(key)}
                data-testid={`filter-${key}`}
              >
                {config.label}
              </Button>
            ))}
            <Button
              variant={showWarrantyOnly ? 'default' : 'outline'}
              size="sm"
              onClick={() => setShowWarrantyOnly(!showWarrantyOnly)}
              data-testid="filter-warranty"
            >
              <Shield className="mr-1 h-3 w-3" />
              Warranty Only
            </Button>
          </div>
        )}

        {services.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Activity className="mb-2 h-8 w-8 text-muted-foreground" />
            <p className="text-muted-foreground">No service history found</p>
            {(selectedType || showWarrantyOnly) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedType(undefined);
                  setShowWarrantyOnly(false);
                }}
                className="mt-2"
              >
                Clear filters
              </Button>
            )}
          </div>
        ) : (
          <ScrollArea style={{ maxHeight }} className="pr-4">
            <div className="relative">
              {services.map((service, index) => (
                <div key={service.id}>
                  <ServiceHistoryItem service={service} />
                  {/* Remove the line for the last item */}
                  {index === services.length - 1 && (
                    <div className="absolute left-5 bottom-0 h-8 w-0.5 bg-gradient-to-b from-muted to-transparent"></div>
                  )}
                </div>
              ))}
            </div>
            
            {hasMore && (
              <div className="mt-4 flex justify-center">
                <Button
                  variant="outline"
                  onClick={() => setLimit(limit + 20)}
                  disabled={isLoading}
                  data-testid="button-load-more"
                >
                  {isLoading ? (
                    <>
                      <Clock className="mr-2 h-4 w-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>Load More</>
                  )}
                </Button>
              </div>
            )}
          </ScrollArea>
        )}

        {/* Summary statistics */}
        {services.length > 0 && (
          <div className="mt-4 grid grid-cols-2 gap-4 border-t pt-4 md:grid-cols-4">
            <div>
              <p className="text-sm text-muted-foreground">Total Spent</p>
              <p className="text-lg font-semibold">
                ${services.reduce((sum, s) => sum + Number(s.totalCost || 0), 0).toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Avg Cost</p>
              <p className="text-lg font-semibold">
                ${(services.reduce((sum, s) => sum + Number(s.totalCost || 0), 0) / services.length).toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Last Service</p>
              <p className="text-lg font-semibold">
                {services[0] && formatDistanceToNow(new Date(services[0].serviceDate), { addSuffix: true })}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Active Warranties</p>
              <p className="text-lg font-semibold">
                {services.filter(s => {
                  const warranty = s.warrantyInfo as WarrantyInfo | null;
                  return warranty && warranty.expiresAt && new Date(warranty.expiresAt) > new Date();
                }).length}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}