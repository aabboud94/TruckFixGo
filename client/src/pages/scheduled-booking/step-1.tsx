import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, addDays, isSameDay, startOfDay } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import { CalendarDays, Clock, AlertCircle } from "lucide-react";
import type { ServiceType } from "@shared/schema";

interface Step1Props {
  onNext: (data: {
    serviceTypeId: string;
    scheduledDate: string;
    scheduledTimeSlot: string;
  }) => void;
  initialData?: {
    serviceTypeId?: string;
    scheduledDate?: string;
    scheduledTimeSlot?: string;
  };
}

export default function Step1ServiceDate({ onNext, initialData }: Step1Props) {
  const [selectedService, setSelectedService] = useState(initialData?.serviceTypeId || "");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    initialData?.scheduledDate ? new Date(initialData.scheduledDate) : undefined
  );
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(initialData?.scheduledTimeSlot || "");
  
  // Fetch service types
  const { data: serviceTypes, isLoading: servicesLoading } = useQuery<ServiceType[]>({
    queryKey: ["/api/service-types"],
  });
  
  // Fetch available time slots for selected date and service
  interface TimeSlot {
    time: string;
    available: boolean;
  }
  
  const { data: timeSlots, isLoading: slotsLoading } = useQuery<TimeSlot[]>({
    queryKey: [
      "/api/booking/time-slots",
      {
        date: selectedDate ? format(selectedDate, "yyyy-MM-dd") : "",
        serviceTypeId: selectedService,
      },
    ],
    enabled: !!(selectedDate && selectedService),
  });
  
  const handleNext = () => {
    if (!selectedService || !selectedDate || !selectedTimeSlot) {
      toast({
        title: "Missing Information",
        description: "Please select a service, date, and time slot",
        variant: "destructive",
      });
      return;
    }
    
    onNext({
      serviceTypeId: selectedService,
      scheduledDate: format(selectedDate, "yyyy-MM-dd"),
      scheduledTimeSlot: selectedTimeSlot,
    });
  };
  
  // Calendar date constraints
  const today = startOfDay(new Date());
  const maxDate = addDays(today, 30);
  
  const disabledDays = (date: Date) => {
    return date < today || date > maxDate;
  };
  
  // Format time slot for display
  const formatTimeSlot = (slot: string) => {
    const [start, end] = slot.split("-");
    return `${start} - ${end}`;
  };
  
  const scheduledServices = serviceTypes?.filter(
    (service) => service.isSchedulable !== false
  ) || [];
  
  return (
    <div className="space-y-6">
      {/* Service Selection */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Select Service Type</h3>
        {servicesLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        ) : (
          <RadioGroup
            value={selectedService}
            onValueChange={setSelectedService}
          >
            <div className="grid gap-4">
              {scheduledServices.map((service) => (
                <label
                  key={service.id}
                  htmlFor={service.id}
                  className="cursor-pointer"
                >
                  <Card className={`hover-elevate ${
                    selectedService === service.id ? "ring-2 ring-primary" : ""
                  }`}>
                    <CardContent className="p-4 flex items-start gap-3">
                      <RadioGroupItem
                        value={service.id}
                        id={service.id}
                        data-testid={`radio-service-${service.id}`}
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <Label htmlFor={service.id} className="font-medium">
                            {service.name}
                          </Label>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {service.description}
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                          Est. duration: {service.estimatedDuration || 60} minutes
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </label>
              ))}
            </div>
          </RadioGroup>
        )}
      </div>
      
      {/* Date Selection */}
      {selectedService && (
        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <CalendarDays className="h-5 w-5" />
            Select Date
          </h3>
          <Card>
            <CardContent className="p-4">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                disabled={disabledDays}
                className="rounded-md"
                data-testid="calendar-date-picker"
              />
              <p className="text-sm text-muted-foreground mt-4">
                You can schedule up to 30 days in advance
              </p>
            </CardContent>
          </Card>
        </div>
      )}
      
      {/* Time Slot Selection */}
      {selectedDate && selectedService && (
        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Select Time Slot
          </h3>
          {slotsLoading ? (
            <div className="grid grid-cols-3 gap-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} className="h-12" />
              ))}
            </div>
          ) : timeSlots && timeSlots.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {timeSlots.map((slot) => (
                <Button
                  key={slot.time}
                  variant={selectedTimeSlot === slot.time ? "default" : "outline"}
                  disabled={!slot.available}
                  onClick={() => setSelectedTimeSlot(slot.time)}
                  className="relative"
                  data-testid={`button-timeslot-${slot.time}`}
                >
                  <span>{formatTimeSlot(slot.time)}</span>
                  {!slot.available && (
                    <Badge
                      variant="secondary"
                      className="absolute -top-2 -right-2 text-xs"
                    >
                      Full
                    </Badge>
                  )}
                </Button>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <AlertCircle className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-muted-foreground">
                  No time slots available for this date.
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Please select a different date.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
      
      {/* Next Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleNext}
          disabled={!selectedService || !selectedDate || !selectedTimeSlot}
          data-testid="button-next-step"
        >
          Next: Vehicle & Location
        </Button>
      </div>
    </div>
  );
}