import { format, formatDistanceToNow, differenceInDays } from 'date-fns';
import { 
  AlertTriangle,
  Calendar,
  ChevronRight,
  Clock,
  Gauge,
  Info,
  Plus,
  Shield,
  TrendingUp,
  Truck,
  Wrench
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { useUpcomingServices, useServiceRecommendations } from '@/hooks/use-service-history';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import type { ServiceSchedule, ServiceRecommendation } from '@shared/schema';

interface UpcomingServicesCardProps {
  vehicleId: string;
  currentMileage?: number;
  onScheduleService?: (serviceType: string) => void;
  showRecommendations?: boolean;
  compact?: boolean;
}

const serviceTypeLabels: Record<string, string> = {
  oil_change: 'Oil Change',
  tire_service: 'Tire Service',
  brake_service: 'Brake Service',
  engine_repair: 'Engine Repair',
  transmission: 'Transmission Service',
  electrical: 'Electrical Service',
  suspension: 'Suspension Service',
  exhaust: 'Exhaust Service',
  cooling_system: 'Cooling System',
  fuel_system: 'Fuel System',
  inspection: 'Vehicle Inspection',
  diagnostic: 'Diagnostic Check',
  air_filter: 'Air Filter',
  fuel_filter: 'Fuel Filter',
  coolant_flush: 'Coolant Flush',
  other: 'Other Service'
};

const priorityConfig = {
  critical: { label: 'Critical', color: 'bg-destructive text-destructive-foreground', icon: AlertTriangle },
  high: { label: 'High', color: 'bg-orange-500 text-white', icon: TrendingUp },
  medium: { label: 'Medium', color: 'bg-yellow-500 text-white', icon: Info },
  low: { label: 'Low', color: 'bg-muted text-muted-foreground', icon: Info }
};

function getServiceTypeLabel(serviceType: string): string {
  return serviceTypeLabels[serviceType] || serviceType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

function ServiceScheduleItem({ 
  schedule, 
  currentMileage, 
  onSchedule,
  compact 
}: { 
  schedule: ServiceSchedule; 
  currentMileage?: number;
  onSchedule?: () => void;
  compact?: boolean;
}) {
  const daysUntilDue = schedule.nextDueDate 
    ? differenceInDays(new Date(schedule.nextDueDate), new Date())
    : null;
    
  const milesUntilDue = currentMileage && schedule.nextDueMileage
    ? schedule.nextDueMileage - currentMileage
    : null;
    
  const isOverdue = (daysUntilDue !== null && daysUntilDue < 0) || 
                    (milesUntilDue !== null && milesUntilDue < 0);
                    
  const isDueSoon = !isOverdue && (
    (daysUntilDue !== null && daysUntilDue <= 30) || 
    (milesUntilDue !== null && milesUntilDue <= 1000)
  );
  
  const progressPercentage = schedule.intervalMiles && currentMileage && schedule.lastServiceMileage
    ? Math.min(100, ((currentMileage - schedule.lastServiceMileage) / schedule.intervalMiles) * 100)
    : schedule.intervalMonths && schedule.lastServiceDate
    ? Math.min(100, ((Date.now() - new Date(schedule.lastServiceDate).getTime()) / (schedule.intervalMonths * 30 * 24 * 60 * 60 * 1000)) * 100)
    : 0;

  if (compact) {
    return (
      <div 
        className={cn(
          "flex items-center justify-between rounded-lg border p-3",
          isOverdue && "border-destructive bg-destructive/5",
          isDueSoon && !isOverdue && "border-orange-200 bg-orange-50 dark:border-orange-900 dark:bg-orange-950"
        )}
        data-testid={`service-item-${schedule.serviceType}`}
      >
        <div className="flex items-center gap-3">
          <div className={cn(
            "rounded-full p-1.5",
            isOverdue ? "bg-destructive/20" : isDueSoon ? "bg-orange-200 dark:bg-orange-900" : "bg-muted"
          )}>
            <Wrench className="h-4 w-4" />
          </div>
          <div>
            <p className="font-medium text-sm">{getServiceTypeLabel(schedule.serviceType)}</p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {schedule.nextDueDate && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {isOverdue ? 'Overdue' : format(new Date(schedule.nextDueDate), 'MMM d')}
                </span>
              )}
              {milesUntilDue !== null && (
                <span className="flex items-center gap-1">
                  <Gauge className="h-3 w-3" />
                  {Math.abs(milesUntilDue).toLocaleString()} mi {isOverdue ? 'over' : 'left'}
                </span>
              )}
            </div>
          </div>
        </div>
        {onSchedule && (
          <Button size="sm" variant={isOverdue ? "destructive" : "outline"} onClick={onSchedule}>
            Schedule
          </Button>
        )}
      </div>
    );
  }

  return (
    <div 
      className="space-y-3 rounded-lg border p-4"
      data-testid={`service-item-${schedule.serviceType}`}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <h4 className="font-medium">{getServiceTypeLabel(schedule.serviceType)}</h4>
          {schedule.lastServiceDate && (
            <p className="text-sm text-muted-foreground">
              Last serviced: {format(new Date(schedule.lastServiceDate), 'MMM d, yyyy')}
              {schedule.lastServiceMileage && ` at ${schedule.lastServiceMileage.toLocaleString()} miles`}
            </p>
          )}
        </div>
        {isOverdue ? (
          <Badge variant="destructive" className="gap-1">
            <AlertTriangle className="h-3 w-3" />
            Overdue
          </Badge>
        ) : isDueSoon ? (
          <Badge variant="outline" className="gap-1 border-orange-200 text-orange-600 dark:border-orange-900 dark:text-orange-400">
            <Clock className="h-3 w-3" />
            Due Soon
          </Badge>
        ) : (
          <Badge variant="secondary">Scheduled</Badge>
        )}
      </div>

      {/* Progress bar */}
      {progressPercentage > 0 && (
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Service interval progress</span>
            <span>{Math.round(progressPercentage)}%</span>
          </div>
          <Progress 
            value={progressPercentage} 
            className={cn(
              "h-2",
              progressPercentage >= 100 && "bg-destructive/20",
              progressPercentage >= 80 && progressPercentage < 100 && "bg-orange-200 dark:bg-orange-900"
            )}
          />
        </div>
      )}

      {/* Due details */}
      <div className="grid grid-cols-2 gap-4">
        {schedule.nextDueDate && (
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Due Date</p>
            <p className="text-sm font-medium">
              {format(new Date(schedule.nextDueDate), 'MMM d, yyyy')}
            </p>
            {daysUntilDue !== null && (
              <p className="text-xs text-muted-foreground">
                {isOverdue 
                  ? `${Math.abs(daysUntilDue)} days overdue`
                  : daysUntilDue === 0 
                  ? 'Due today'
                  : `In ${daysUntilDue} days`
                }
              </p>
            )}
          </div>
        )}
        {schedule.nextDueMileage && (
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Due Mileage</p>
            <p className="text-sm font-medium">
              {schedule.nextDueMileage.toLocaleString()} mi
            </p>
            {milesUntilDue !== null && (
              <p className="text-xs text-muted-foreground">
                {isOverdue
                  ? `${Math.abs(milesUntilDue).toLocaleString()} miles over`
                  : `${milesUntilDue.toLocaleString()} miles remaining`
                }
              </p>
            )}
          </div>
        )}
      </div>

      {/* Schedule button */}
      {onSchedule && (
        <Button 
          onClick={onSchedule}
          variant={isOverdue ? "destructive" : "default"}
          size="sm"
          className="w-full"
          data-testid={`button-schedule-${schedule.serviceType}`}
        >
          <Calendar className="mr-2 h-4 w-4" />
          Schedule {getServiceTypeLabel(schedule.serviceType)}
        </Button>
      )}
    </div>
  );
}

function ServiceRecommendationItem({ 
  recommendation,
  onSchedule
}: {
  recommendation: ServiceRecommendation;
  onSchedule?: () => void;
}) {
  const priority = priorityConfig[recommendation.priority];
  const PriorityIcon = priority.icon;
  
  return (
    <div 
      className="flex items-center justify-between rounded-lg border p-3"
      data-testid={`recommendation-${recommendation.id}`}
    >
      <div className="flex items-center gap-3">
        <Badge className={cn("gap-1", priority.color)}>
          <PriorityIcon className="h-3 w-3" />
          {priority.label}
        </Badge>
        <div className="space-y-1">
          <p className="text-sm font-medium">{getServiceTypeLabel(recommendation.serviceType)}</p>
          <p className="text-xs text-muted-foreground">{recommendation.reason}</p>
          {recommendation.estimatedCost && (
            <p className="text-xs text-muted-foreground">
              Est. cost: ${Number(recommendation.estimatedCost).toFixed(2)}
            </p>
          )}
        </div>
      </div>
      {onSchedule && (
        <Button size="sm" variant="outline" onClick={onSchedule}>
          <Plus className="mr-1 h-3 w-3" />
          Schedule
        </Button>
      )}
    </div>
  );
}

export function UpcomingServicesCard({
  vehicleId,
  currentMileage,
  onScheduleService,
  showRecommendations = true,
  compact = false
}: UpcomingServicesCardProps) {
  const [expandedRecommendations, setExpandedRecommendations] = useState(false);
  
  const { data: upcomingServices, isLoading: loadingServices } = useUpcomingServices(vehicleId);
  const { data: recommendations, isLoading: loadingRecommendations } = useServiceRecommendations(
    vehicleId,
    { isCompleted: false, isDismissed: false },
    { enabled: showRecommendations }
  );

  const isLoading = loadingServices || (showRecommendations && loadingRecommendations);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Services</CardTitle>
          <CardDescription>Loading service schedule...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const overdueServices = upcomingServices?.filter(s => {
    const daysUntilDue = s.nextDueDate 
      ? differenceInDays(new Date(s.nextDueDate), new Date())
      : null;
    const milesUntilDue = currentMileage && s.nextDueMileage
      ? s.nextDueMileage - currentMileage
      : null;
    return (daysUntilDue !== null && daysUntilDue < 0) || 
           (milesUntilDue !== null && milesUntilDue < 0);
  }) || [];

  const dueSoonServices = upcomingServices?.filter(s => {
    const daysUntilDue = s.nextDueDate 
      ? differenceInDays(new Date(s.nextDueDate), new Date())
      : null;
    const milesUntilDue = currentMileage && s.nextDueMileage
      ? s.nextDueMileage - currentMileage
      : null;
    const isOverdue = (daysUntilDue !== null && daysUntilDue < 0) || 
                     (milesUntilDue !== null && milesUntilDue < 0);
    const isDueSoon = !isOverdue && (
      (daysUntilDue !== null && daysUntilDue <= 30) || 
      (milesUntilDue !== null && milesUntilDue <= 1000)
    );
    return isDueSoon;
  }) || [];

  const scheduledServices = upcomingServices?.filter(s => {
    const daysUntilDue = s.nextDueDate 
      ? differenceInDays(new Date(s.nextDueDate), new Date())
      : null;
    const milesUntilDue = currentMileage && s.nextDueMileage
      ? s.nextDueMileage - currentMileage
      : null;
    const isOverdue = (daysUntilDue !== null && daysUntilDue < 0) || 
                     (milesUntilDue !== null && milesUntilDue < 0);
    const isDueSoon = !isOverdue && (
      (daysUntilDue !== null && daysUntilDue <= 30) || 
      (milesUntilDue !== null && milesUntilDue <= 1000)
    );
    return !isOverdue && !isDueSoon;
  }) || [];

  const criticalRecommendations = recommendations?.filter(r => r.priority === 'critical') || [];
  const highRecommendations = recommendations?.filter(r => r.priority === 'high') || [];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5" />
              Upcoming Services
            </CardTitle>
            <CardDescription>
              {overdueServices.length > 0 
                ? `${overdueServices.length} overdue service${overdueServices.length > 1 ? 's' : ''} require immediate attention`
                : dueSoonServices.length > 0
                ? `${dueSoonServices.length} service${dueSoonServices.length > 1 ? 's' : ''} due soon`
                : 'All services up to date'
              }
            </CardDescription>
          </div>
          {currentMileage && (
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Current Mileage</p>
              <p className="text-lg font-semibold">{currentMileage.toLocaleString()} mi</p>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overdue services alert */}
        {overdueServices.length > 0 && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Overdue Services</AlertTitle>
            <AlertDescription>
              These services are past due and should be scheduled immediately to avoid potential issues.
            </AlertDescription>
          </Alert>
        )}

        {/* Service items */}
        <div className="space-y-3">
          {overdueServices.map((schedule) => (
            <ServiceScheduleItem
              key={schedule.serviceType}
              schedule={schedule}
              currentMileage={currentMileage}
              onSchedule={() => onScheduleService?.(schedule.serviceType)}
              compact={compact}
            />
          ))}
          
          {dueSoonServices.map((schedule) => (
            <ServiceScheduleItem
              key={schedule.serviceType}
              schedule={schedule}
              currentMileage={currentMileage}
              onSchedule={() => onScheduleService?.(schedule.serviceType)}
              compact={compact}
            />
          ))}
          
          {!compact && scheduledServices.map((schedule) => (
            <ServiceScheduleItem
              key={schedule.serviceType}
              schedule={schedule}
              currentMileage={currentMileage}
              onSchedule={() => onScheduleService?.(schedule.serviceType)}
              compact={false}
            />
          ))}
        </div>

        {/* Service recommendations */}
        {showRecommendations && recommendations && recommendations.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">Service Recommendations</h4>
              {(criticalRecommendations.length > 0 || highRecommendations.length > 0) && (
                <Badge variant="outline" className="gap-1">
                  <Shield className="h-3 w-3" />
                  {criticalRecommendations.length + highRecommendations.length} Important
                </Badge>
              )}
            </div>
            
            {/* Critical and high priority recommendations always visible */}
            <div className="space-y-2">
              {criticalRecommendations.map((rec) => (
                <ServiceRecommendationItem
                  key={rec.id}
                  recommendation={rec}
                  onSchedule={() => onScheduleService?.(rec.serviceType)}
                />
              ))}
              {highRecommendations.map((rec) => (
                <ServiceRecommendationItem
                  key={rec.id}
                  recommendation={rec}
                  onSchedule={() => onScheduleService?.(rec.serviceType)}
                />
              ))}
            </div>

            {/* Other recommendations in collapsible */}
            {recommendations.filter(r => r.priority !== 'critical' && r.priority !== 'high').length > 0 && (
              <Collapsible open={expandedRecommendations} onOpenChange={setExpandedRecommendations}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="w-full" data-testid="button-toggle-recommendations">
                    <ChevronRight className={cn("mr-1 h-4 w-4 transition-transform", expandedRecommendations && "rotate-90")} />
                    {expandedRecommendations ? 'Hide' : 'Show'} {recommendations.filter(r => r.priority !== 'critical' && r.priority !== 'high').length} more recommendations
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-2 pt-2">
                  {recommendations
                    .filter(r => r.priority !== 'critical' && r.priority !== 'high')
                    .map((rec) => (
                      <ServiceRecommendationItem
                        key={rec.id}
                        recommendation={rec}
                        onSchedule={() => onScheduleService?.(rec.serviceType)}
                      />
                    ))}
                </CollapsibleContent>
              </Collapsible>
            )}
          </div>
        )}

        {/* No services message */}
        {upcomingServices?.length === 0 && (!recommendations || recommendations.length === 0) && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Calendar className="mb-2 h-8 w-8 text-muted-foreground" />
            <p className="text-muted-foreground">No upcoming services scheduled</p>
            <p className="text-sm text-muted-foreground">Service schedules will appear here once configured</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}