import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { format, isSameDay, isWithinInterval, parseISO } from "date-fns";
import { Clock, Calendar as CalendarIcon, AlertCircle, CheckCircle, Coffee, Users } from "lucide-react";
import { cn } from "@/lib/utils";

interface WorkingHours {
  [key: string]: {
    enabled: boolean;
    start: string;
    end: string;
    lunchStart?: string;
    lunchEnd?: string;
  };
}

interface ScheduledJob {
  id: string;
  scheduledFor: string;
  serviceType: string;
  customerName: string;
  estimatedDuration: number;
  status: string;
}

interface Vacation {
  id: string;
  startDate: string;
  endDate: string;
  reason?: string;
}

interface AvailabilityCalendarProps {
  workingHours: WorkingHours;
  scheduledJobs?: ScheduledJob[];
  vacations?: Vacation[];
  maxJobsPerDay?: number;
  currentJobCount?: number;
}

export function AvailabilityCalendar({
  workingHours,
  scheduledJobs = [],
  vacations = [],
  maxJobsPerDay = 10,
  currentJobCount = 0
}: AvailabilityCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  
  // Get day of week for a date
  const getDayOfWeek = (date: Date): string => {
    return format(date, "EEEE").toLowerCase();
  };
  
  // Check if date is a vacation day
  const isVacationDay = (date: Date): boolean => {
    return vacations.some(vacation => {
      const start = parseISO(vacation.startDate);
      const end = parseISO(vacation.endDate);
      return isWithinInterval(date, { start, end });
    });
  };
  
  // Check if contractor works on a specific day
  const isWorkingDay = (date: Date): boolean => {
    const dayName = getDayOfWeek(date);
    const dayConfig = workingHours[dayName];
    return dayConfig?.enabled && !isVacationDay(date);
  };
  
  // Get jobs for a specific date
  const getJobsForDate = (date: Date): ScheduledJob[] => {
    return scheduledJobs.filter(job => 
      isSameDay(parseISO(job.scheduledFor), date)
    );
  };
  
  // Get working hours for a specific date
  const getWorkingHoursForDate = (date: Date) => {
    const dayName = getDayOfWeek(date);
    return workingHours[dayName];
  };
  
  // Calculate available slots for a date
  const getAvailableSlots = (date: Date): number => {
    if (!isWorkingDay(date)) return 0;
    
    const jobsOnDate = getJobsForDate(date);
    const bookedHours = jobsOnDate.reduce((total, job) => total + (job.estimatedDuration || 2), 0);
    
    const dayHours = getWorkingHoursForDate(date);
    if (!dayHours) return 0;
    
    const startHour = parseInt(dayHours.start.split(':')[0]);
    const endHour = parseInt(dayHours.end.split(':')[0]);
    let workingHours = endHour - startHour;
    
    // Subtract lunch hour if configured
    if (dayHours.lunchStart && dayHours.lunchEnd) {
      const lunchStart = parseInt(dayHours.lunchStart.split(':')[0]);
      const lunchEnd = parseInt(dayHours.lunchEnd.split(':')[0]);
      workingHours -= (lunchEnd - lunchStart);
    }
    
    const availableHours = Math.max(0, workingHours - bookedHours);
    return Math.floor(availableHours / 2); // Assume 2 hours per job average
  };
  
  // Custom day content for calendar
  const DayContent = ({ date }: { date: Date }) => {
    const isVacation = isVacationDay(date);
    const isWorking = isWorkingDay(date);
    const jobCount = getJobsForDate(date).length;
    const availableSlots = getAvailableSlots(date);
    
    return (
      <div className={cn(
        "relative w-full h-full flex flex-col items-center justify-center",
        isVacation && "opacity-50"
      )}>
        <div>{format(date, "d")}</div>
        {isVacation && (
          <Badge className="absolute -top-1 -right-1 h-2 w-2 p-0 bg-gray-500" />
        )}
        {!isVacation && !isWorking && (
          <Badge className="absolute -top-1 -right-1 h-2 w-2 p-0 bg-gray-300" />
        )}
        {jobCount > 0 && (
          <div className="text-xs font-semibold text-primary mt-1">
            {jobCount} job{jobCount > 1 ? 's' : ''}
          </div>
        )}
        {isWorking && availableSlots > 0 && (
          <div className="text-xs text-green-600">
            {availableSlots} open
          </div>
        )}
      </div>
    );
  };

  const selectedDateJobs = selectedDate ? getJobsForDate(selectedDate) : [];
  const selectedDateHours = selectedDate ? getWorkingHoursForDate(selectedDate) : null;
  const selectedDateVacation = selectedDate ? vacations.find(v => {
    const start = parseISO(v.startDate);
    const end = parseISO(v.endDate);
    return isWithinInterval(selectedDate, { start, end });
  }) : null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Calendar View */}
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>Availability Calendar</CardTitle>
            <CardDescription>
              View your schedule, working hours, and time off
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              className="rounded-md border"
              components={{
                DayContent: DayContent as any
              }}
            />
            
            <div className="mt-4 flex items-center gap-4 text-xs">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-primary" />
                <span>Scheduled Jobs</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-green-600" />
                <span>Available</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-gray-300" />
                <span>Day Off</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-gray-500" />
                <span>Vacation</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Selected Date Details */}
      <div className="space-y-4">
        {/* Today's Status */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Today's Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Jobs Completed</span>
                <Badge variant="outline">{currentJobCount} / {maxJobsPerDay}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Availability</span>
                {currentJobCount >= maxJobsPerDay ? (
                  <Badge variant="secondary">Full</Badge>
                ) : (
                  <Badge className="bg-green-600">Available</Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Selected Date Details */}
        {selectedDate && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">
                {format(selectedDate, "EEEE, MMMM d")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Vacation Notice */}
                {selectedDateVacation && (
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <AlertCircle className="h-4 w-4" />
                      Time Off
                    </div>
                    {selectedDateVacation.reason && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {selectedDateVacation.reason}
                      </p>
                    )}
                  </div>
                )}

                {/* Working Hours */}
                {selectedDateHours && selectedDateHours.enabled && !selectedDateVacation && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Clock className="h-4 w-4" />
                      Working Hours
                    </div>
                    <div className="text-sm space-y-1">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Start:</span>
                        <span>{selectedDateHours.start}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">End:</span>
                        <span>{selectedDateHours.end}</span>
                      </div>
                      {selectedDateHours.lunchStart && selectedDateHours.lunchEnd && (
                        <>
                          <Separator className="my-2" />
                          <div className="flex items-center gap-2 text-sm">
                            <Coffee className="h-3 w-3" />
                            <span className="text-muted-foreground">Lunch:</span>
                            <span>{selectedDateHours.lunchStart} - {selectedDateHours.lunchEnd}</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* Day Off Notice */}
                {selectedDateHours && !selectedDateHours.enabled && (
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-2 text-sm">
                      <AlertCircle className="h-4 w-4" />
                      Day Off
                    </div>
                  </div>
                )}

                {/* Scheduled Jobs */}
                {selectedDateJobs.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Users className="h-4 w-4" />
                      Scheduled Jobs ({selectedDateJobs.length})
                    </div>
                    <ScrollArea className="h-[200px]">
                      <div className="space-y-2">
                        {selectedDateJobs.map((job) => (
                          <div key={job.id} className="p-2 border rounded-lg">
                            <div className="text-sm font-medium">{job.serviceType}</div>
                            <div className="text-xs text-muted-foreground">
                              {job.customerName} • {job.estimatedDuration}h
                            </div>
                            <Badge 
                              variant={job.status === 'completed' ? 'secondary' : 'outline'}
                              className="mt-1 text-xs"
                            >
                              {job.status}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                )}

                {/* Available Slots */}
                {isWorkingDay(selectedDate) && (
                  <div className="pt-2 border-t">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Available Slots</span>
                      <Badge variant={getAvailableSlots(selectedDate) > 0 ? "default" : "secondary"}>
                        {getAvailableSlots(selectedDate)}
                      </Badge>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}