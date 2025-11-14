import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Calendar as CalendarIcon, Clock, CheckCircle, XCircle, AlertCircle, Users } from "lucide-react";
import { format, addMonths, subMonths, getDaysInMonth, startOfMonth, getDay } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { VacationRequest, Job, ContractorAvailability, AvailabilityOverride } from "@shared/schema";

// Form schema for time-off request
const timeOffRequestSchema = z.object({
  startDate: z.date({
    required_error: "Start date is required",
  }),
  endDate: z.date({
    required_error: "End date is required",
  }),
  requestType: z.enum(["vacation", "sick_leave", "personal", "training"]),
  reason: z.string().min(1, "Please provide a reason"),
});

type TimeOffRequestForm = z.infer<typeof timeOffRequestSchema>;

export default function AvailabilityManager() {
  const { toast } = useToast();
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [showRequestDialog, setShowRequestDialog] = useState(false);
  const [showCoverageDialog, setShowCoverageDialog] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<VacationRequest | null>(null);
  
  const form = useForm<TimeOffRequestForm>({
    resolver: zodResolver(timeOffRequestSchema),
    defaultValues: {
      requestType: "vacation",
      reason: "",
    },
  });

  // Fetch availability calendar
  const { data: calendarData, isLoading: calendarLoading } = useQuery({
    queryKey: ["/api/contractor/availability/calendar", selectedMonth.getMonth() + 1, selectedMonth.getFullYear()],
    queryFn: async () => {
      const response = await fetch(
        `/api/contractor/availability/calendar?month=${selectedMonth.getMonth() + 1}&year=${selectedMonth.getFullYear()}`,
        { credentials: "include" }
      );
      if (!response.ok) throw new Error("Failed to fetch calendar");
      return response.json();
    },
  });

  // Fetch time-off requests
  const { data: timeOffRequests, isLoading: requestsLoading } = useQuery({
    queryKey: ["/api/contractor/time-off"],
  });

  // Submit time-off request mutation
  const submitTimeOffMutation = useMutation({
    mutationFn: async (data: TimeOffRequestForm) => {
      return apiRequest("/api/contractor/time-off", {
        method: "POST",
        body: JSON.stringify({
          ...data,
          startDate: data.startDate.toISOString(),
          endDate: data.endDate.toISOString(),
        }),
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Your time-off request has been submitted for approval.",
      });
      setShowRequestDialog(false);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/contractor/time-off"] });
      queryClient.invalidateQueries({ queryKey: ["/api/contractor/availability/calendar"] });
    },
    onError: (error: any) => {
      const message = error?.conflicts?.scheduledJobs?.length > 0
        ? "Your request conflicts with scheduled jobs. Please resolve conflicts or request coverage."
        : "Failed to submit time-off request";
      
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    },
  });

  // Get coverage suggestions
  const { data: coverageSuggestions, isLoading: coverageLoading, refetch: fetchCoverage } = useQuery({
    queryKey: ["/api/contractor/coverage-suggestions", selectedRequest?.startDate, selectedRequest?.endDate],
    enabled: !!selectedRequest && showCoverageDialog,
    queryFn: async () => {
      if (!selectedRequest) return [];
      const response = await fetch(
        `/api/contractor/coverage-suggestions?startDate=${selectedRequest.startDate}&endDate=${selectedRequest.endDate}`,
        { credentials: "include" }
      );
      if (!response.ok) throw new Error("Failed to fetch coverage suggestions");
      return response.json();
    },
  });

  // Bulk update availability mutation
  const bulkUpdateMutation = useMutation({
    mutationFn: async (dates: { date: Date; isAvailable: boolean; reason?: string }[]) => {
      return apiRequest("/api/contractor/availability/bulk", {
        method: "PUT",
        body: JSON.stringify({
          dates: dates.map(d => ({
            ...d,
            date: d.date.toISOString(),
          })),
        }),
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Your availability has been updated.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/contractor/availability/calendar"] });
      setSelectedDates([]);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update availability.",
        variant: "destructive",
      });
    },
  });

  // Submit time-off request
  const onSubmit = (data: TimeOffRequestForm) => {
    // Check for date validity
    if (data.endDate < data.startDate) {
      toast({
        title: "Invalid dates",
        description: "End date must be after start date",
        variant: "destructive",
      });
      return;
    }
    
    submitTimeOffMutation.mutate(data);
  };

  // Mark dates as unavailable
  const markUnavailable = () => {
    if (selectedDates.length === 0) {
      toast({
        title: "No dates selected",
        description: "Please select dates to mark as unavailable",
        variant: "destructive",
      });
      return;
    }

    const updates = selectedDates.map(date => ({
      date,
      isAvailable: false,
      reason: "Personal unavailability",
    }));

    bulkUpdateMutation.mutate(updates);
  };

  // Get the status badge color
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-500">Approved</Badge>;
      case "rejected":
        return <Badge className="bg-red-500">Rejected</Badge>;
      case "pending":
        return <Badge className="bg-yellow-500">Pending</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  // Get request type label
  const getRequestTypeLabel = (type: string) => {
    switch (type) {
      case "vacation":
        return "Vacation";
      case "sick_leave":
        return "Sick Leave";
      case "personal":
        return "Personal";
      case "training":
        return "Training";
      default:
        return type;
    }
  };

  // Render calendar grid
  const renderCalendar = () => {
    const year = selectedMonth.getFullYear();
    const month = selectedMonth.getMonth();
    const daysInMonth = getDaysInMonth(selectedMonth);
    const firstDay = startOfMonth(selectedMonth);
    const startingDayOfWeek = getDay(firstDay);
    
    const days = [];
    const weeks = [];
    
    // Add empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add days of month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    // Group days into weeks
    while (days.length) {
      weeks.push(days.splice(0, 7));
    }
    
    return (
      <div className="grid grid-cols-7 gap-1">
        {/* Day headers */}
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
          <div key={day} className="text-center font-semibold p-2 text-sm">
            {day}
          </div>
        ))}
        
        {/* Calendar days */}
        {weeks.map((week, weekIdx) => (
          week.map((date, dayIdx) => {
            if (!date) {
              return <div key={`empty-${weekIdx}-${dayIdx}`} className="p-2" />;
            }
            
            const dateStr = format(date, "yyyy-MM-dd");
            const isVacation = calendarData?.calendar?.vacationRequests?.some(
              (req: VacationRequest) => 
                new Date(req.startDate) <= date && 
                new Date(req.endDate) >= date &&
                req.status === "approved"
            );
            const hasJob = calendarData?.calendar?.scheduledJobs?.some(
              (job: Job) => format(new Date(job.scheduledDate || ""), "yyyy-MM-dd") === dateStr
            );
            const override = calendarData?.calendar?.availabilityOverrides?.find(
              (o: AvailabilityOverride) => format(new Date(o.date), "yyyy-MM-dd") === dateStr
            );
            const isSelected = selectedDates.some(d => format(d, "yyyy-MM-dd") === dateStr);
            
            return (
              <button
                key={dateStr}
                onClick={() => {
                  if (isSelected) {
                    setSelectedDates(selectedDates.filter(d => format(d, "yyyy-MM-dd") !== dateStr));
                  } else {
                    setSelectedDates([...selectedDates, date]);
                  }
                }}
                className={`
                  p-2 border rounded-md text-sm relative min-h-[60px]
                  ${isSelected ? "bg-primary text-primary-foreground" : ""}
                  ${isVacation ? "bg-red-100 dark:bg-red-900/20" : ""}
                  ${override && !override.isAvailable ? "bg-gray-100 dark:bg-gray-800" : ""}
                  ${hasJob ? "border-blue-500 border-2" : ""}
                  hover:bg-gray-50 dark:hover:bg-gray-800
                `}
                data-testid={`calendar-day-${dateStr}`}
              >
                <div className="font-medium">{date.getDate()}</div>
                {isVacation && (
                  <div className="absolute top-1 right-1">
                    <Badge className="text-xs px-1" variant="destructive">V</Badge>
                  </div>
                )}
                {hasJob && (
                  <div className="absolute bottom-1 right-1">
                    <Badge className="text-xs px-1" variant="default">J</Badge>
                  </div>
                )}
              </button>
            );
          })
        ))}
      </div>
    );
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Availability Manager</h1>
        <div className="flex gap-2">
          <Dialog open={showRequestDialog} onOpenChange={setShowRequestDialog}>
            <DialogTrigger asChild>
              <Button data-testid="button-request-time-off">
                <CalendarIcon className="mr-2 h-4 w-4" />
                Request Time Off
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Request Time Off</DialogTitle>
                <DialogDescription>
                  Submit a request for vacation or other time off. Your request will be reviewed by management.
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="requestType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Type of Request</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-request-type">
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="vacation">Vacation</SelectItem>
                            <SelectItem value="sick_leave">Sick Leave</SelectItem>
                            <SelectItem value="personal">Personal</SelectItem>
                            <SelectItem value="training">Training</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Start Date</FormLabel>
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date < new Date()}
                          initialFocus
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>End Date</FormLabel>
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date < new Date() || (form.watch("startDate") && date < form.watch("startDate"))}
                          initialFocus
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="reason"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Reason</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Please provide a reason for your request..."
                            className="resize-none"
                            {...field}
                            data-testid="textarea-reason"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <DialogFooter>
                    <Button type="submit" disabled={submitTimeOffMutation.isPending} data-testid="button-submit-request">
                      {submitTimeOffMutation.isPending ? "Submitting..." : "Submit Request"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
          
          {selectedDates.length > 0 && (
            <Button onClick={markUnavailable} variant="outline" data-testid="button-mark-unavailable">
              Mark {selectedDates.length} Day(s) Unavailable
            </Button>
          )}
        </div>
      </div>

      {/* Vacation Balance Card */}
      {calendarData?.balance && (
        <Card>
          <CardHeader>
            <CardTitle>Vacation Balance</CardTitle>
            <CardDescription>Your vacation days for {new Date().getFullYear()}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Total Allowed</p>
                <p className="text-2xl font-bold" data-testid="text-total-allowed">{calendarData.balance.totalDaysAllowed}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Days Used</p>
                <p className="text-2xl font-bold" data-testid="text-days-used">{calendarData.balance.daysUsed}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Available</p>
                <p className="text-2xl font-bold text-green-600" data-testid="text-days-available">
                  {calendarData.balance.daysAvailable}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-yellow-600" data-testid="text-days-pending">
                  {calendarData.balance.pendingRequests}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="calendar" className="space-y-4">
        <TabsList>
          <TabsTrigger value="calendar" data-testid="tab-calendar">Calendar View</TabsTrigger>
          <TabsTrigger value="requests" data-testid="tab-requests">Time Off Requests</TabsTrigger>
        </TabsList>
        
        <TabsContent value="calendar" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Availability Calendar</CardTitle>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedMonth(subMonths(selectedMonth, 1))}
                    data-testid="button-prev-month"
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedMonth(new Date())}
                    data-testid="button-today"
                  >
                    Today
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedMonth(addMonths(selectedMonth, 1))}
                    data-testid="button-next-month"
                  >
                    Next
                  </Button>
                </div>
              </div>
              <CardDescription>
                {format(selectedMonth, "MMMM yyyy")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {calendarLoading ? (
                <div className="grid grid-cols-7 gap-4">
                  {[...Array(35)].map((_, i) => (
                    <Skeleton key={i} className="h-[60px]" />
                  ))}
                </div>
              ) : (
                renderCalendar()
              )}
              
              <div className="mt-4 flex gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <Badge variant="destructive">V</Badge>
                  <span>Vacation/Time Off</span>
                </div>
                <div className="flex items-center gap-1">
                  <Badge variant="default">J</Badge>
                  <span>Scheduled Job</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 bg-gray-200 rounded" />
                  <span>Unavailable</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="requests" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Time Off Requests</CardTitle>
              <CardDescription>Your submitted time off requests</CardDescription>
            </CardHeader>
            <CardContent>
              {requestsLoading ? (
                <div className="space-y-2">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-20" />
                  ))}
                </div>
              ) : timeOffRequests?.length === 0 ? (
                <p className="text-muted-foreground">No time off requests found.</p>
              ) : (
                <ScrollArea className="h-[400px]">
                  <div className="space-y-4">
                    {timeOffRequests?.map((request: VacationRequest) => (
                      <Card key={request.id} data-testid={`request-card-${request.id}`}>
                        <CardHeader className="pb-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <CardTitle className="text-lg">
                                {getRequestTypeLabel(request.requestType)}
                              </CardTitle>
                              <CardDescription>
                                {format(new Date(request.startDate), "MMM dd, yyyy")} - 
                                {format(new Date(request.endDate), "MMM dd, yyyy")}
                              </CardDescription>
                            </div>
                            {getStatusBadge(request.status)}
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground">{request.reason}</p>
                          {request.notes && request.status !== "pending" && (
                            <Alert className="mt-2">
                              <AlertCircle className="h-4 w-4" />
                              <AlertTitle>Admin Note</AlertTitle>
                              <AlertDescription>{request.notes}</AlertDescription>
                            </Alert>
                          )}
                        </CardContent>
                        {request.status === "approved" && !request.coverageContractorId && (
                          <CardFooter>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedRequest(request);
                                setShowCoverageDialog(true);
                              }}
                              data-testid={`button-find-coverage-${request.id}`}
                            >
                              <Users className="mr-2 h-4 w-4" />
                              Find Coverage
                            </Button>
                          </CardFooter>
                        )}
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Coverage Suggestions Dialog */}
      <Dialog open={showCoverageDialog} onOpenChange={setShowCoverageDialog}>
        <DialogContent className="sm:max-w-[625px]">
          <DialogHeader>
            <DialogTitle>Coverage Suggestions</DialogTitle>
            <DialogDescription>
              Available contractors who can cover your duties during your time off
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 max-h-[400px] overflow-y-auto">
            {coverageLoading ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-20" />
                ))}
              </div>
            ) : coverageSuggestions?.length === 0 ? (
              <p className="text-muted-foreground">No coverage contractors available for this period.</p>
            ) : (
              coverageSuggestions?.map((contractor: any) => (
                <Card key={contractor.contractorId} data-testid={`coverage-contractor-${contractor.contractorId}`}>
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{contractor.name}</CardTitle>
                        <CardDescription>
                          {contractor.availability}% available · 
                          {contractor.distance ? ` ${contractor.distance.toFixed(1)} miles away` : ""} 
                          {contractor.rating ? ` · ★ ${contractor.rating.toFixed(1)}` : ""}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-1">
                      {contractor.skills?.map((skill: any) => (
                        <Badge key={skill.id} variant="secondary">
                          {skill.name}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}