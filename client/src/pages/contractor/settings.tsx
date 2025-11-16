import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarIcon, Clock, Settings, MapPin, Briefcase, Users, Shield, CalendarDays, Coffee } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

// Working hours schema
const workingHoursSchema = z.object({
  monday: z.object({
    enabled: z.boolean(),
    start: z.string(),
    end: z.string(),
    lunchStart: z.string().optional(),
    lunchEnd: z.string().optional()
  }),
  tuesday: z.object({
    enabled: z.boolean(),
    start: z.string(),
    end: z.string(),
    lunchStart: z.string().optional(),
    lunchEnd: z.string().optional()
  }),
  wednesday: z.object({
    enabled: z.boolean(),
    start: z.string(),
    end: z.string(),
    lunchStart: z.string().optional(),
    lunchEnd: z.string().optional()
  }),
  thursday: z.object({
    enabled: z.boolean(),
    start: z.string(),
    end: z.string(),
    lunchStart: z.string().optional(),
    lunchEnd: z.string().optional()
  }),
  friday: z.object({
    enabled: z.boolean(),
    start: z.string(),
    end: z.string(),
    lunchStart: z.string().optional(),
    lunchEnd: z.string().optional()
  }),
  saturday: z.object({
    enabled: z.boolean(),
    start: z.string(),
    end: z.string(),
    lunchStart: z.string().optional(),
    lunchEnd: z.string().optional()
  }),
  sunday: z.object({
    enabled: z.boolean(),
    start: z.string(),
    end: z.string(),
    lunchStart: z.string().optional(),
    lunchEnd: z.string().optional()
  })
});

// Vacation request schema
const vacationSchema = z.object({
  startDate: z.date(),
  endDate: z.date(),
  reason: z.string().optional()
});

// Preferences schema
const preferencesSchema = z.object({
  maxJobsPerDay: z.number().min(1).max(20),
  autoAcceptJobs: z.boolean(),
  preferredServiceTypes: z.array(z.string()),
  serviceAreas: z.array(z.string()),
  minimumJobAmount: z.number().min(0),
  notifyOnNewJobs: z.boolean(),
  notifyOnEmergencyJobs: z.boolean()
});

const daysOfWeek = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

export default function ContractorSettings() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("working-hours");
  const [vacationDates, setVacationDates] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined
  });

  // Fetch contractor settings
  const { data: settings, isLoading } = useQuery({
    queryKey: ["/api/contractor/settings"]
  });

  // Working hours form
  const workingHoursForm = useForm({
    resolver: zodResolver(workingHoursSchema),
    defaultValues: settings?.workingHours || {
      monday: { enabled: true, start: "08:00", end: "18:00" },
      tuesday: { enabled: true, start: "08:00", end: "18:00" },
      wednesday: { enabled: true, start: "08:00", end: "18:00" },
      thursday: { enabled: true, start: "08:00", end: "18:00" },
      friday: { enabled: true, start: "08:00", end: "18:00" },
      saturday: { enabled: false, start: "08:00", end: "18:00" },
      sunday: { enabled: false, start: "08:00", end: "18:00" }
    }
  });

  // Preferences form
  const preferencesForm = useForm({
    resolver: zodResolver(preferencesSchema),
    defaultValues: settings?.preferences || {
      maxJobsPerDay: 10,
      autoAcceptJobs: false,
      preferredServiceTypes: [],
      serviceAreas: [],
      minimumJobAmount: 100,
      notifyOnNewJobs: true,
      notifyOnEmergencyJobs: true
    }
  });

  // Update working hours mutation
  const updateWorkingHoursMutation = useMutation({
    mutationFn: async (data: z.infer<typeof workingHoursSchema>) => {
      return await apiRequest("/api/contractor/settings/working-hours", "PUT", data);
    },
    onSuccess: () => {
      toast({
        title: "Working Hours Updated",
        description: "Your working hours have been saved successfully"
      });
      queryClient.invalidateQueries({ queryKey: ["/api/contractor/settings"] });
    }
  });

  // Add vacation mutation
  const addVacationMutation = useMutation({
    mutationFn: async (data: z.infer<typeof vacationSchema>) => {
      return await apiRequest("/api/contractor/settings/vacation", "POST", data);
    },
    onSuccess: () => {
      toast({
        title: "Vacation Added",
        description: "Your time off has been scheduled"
      });
      setVacationDates({ from: undefined, to: undefined });
      queryClient.invalidateQueries({ queryKey: ["/api/contractor/settings"] });
    }
  });

  // Update preferences mutation
  const updatePreferencesMutation = useMutation({
    mutationFn: async (data: z.infer<typeof preferencesSchema>) => {
      return await apiRequest("/api/contractor/settings/preferences", "PUT", data);
    },
    onSuccess: () => {
      toast({
        title: "Preferences Updated",
        description: "Your preferences have been saved successfully"
      });
      queryClient.invalidateQueries({ queryKey: ["/api/contractor/settings"] });
    }
  });

  // Delete vacation mutation
  const deleteVacationMutation = useMutation({
    mutationFn: async (vacationId: string) => {
      return await apiRequest(`/api/contractor/settings/vacation/${vacationId}`, "DELETE");
    },
    onSuccess: () => {
      toast({
        title: "Vacation Deleted",
        description: "Time off request has been removed"
      });
      queryClient.invalidateQueries({ queryKey: ["/api/contractor/settings"] });
    }
  });

  const handleWorkingHoursSubmit = async (data: z.infer<typeof workingHoursSchema>) => {
    updateWorkingHoursMutation.mutate(data);
  };

  const handlePreferencesSubmit = async (data: z.infer<typeof preferencesSchema>) => {
    updatePreferencesMutation.mutate(data);
  };

  const handleAddVacation = () => {
    if (vacationDates.from && vacationDates.to) {
      addVacationMutation.mutate({
        startDate: vacationDates.from,
        endDate: vacationDates.to
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container max-w-6xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Contractor Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage your availability, working hours, and job preferences
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="working-hours">
            <Clock className="w-4 h-4 mr-2" />
            Working Hours
          </TabsTrigger>
          <TabsTrigger value="vacation">
            <CalendarDays className="w-4 h-4 mr-2" />
            Time Off
          </TabsTrigger>
          <TabsTrigger value="preferences">
            <Settings className="w-4 h-4 mr-2" />
            Preferences
          </TabsTrigger>
          <TabsTrigger value="coverage">
            <MapPin className="w-4 h-4 mr-2" />
            Service Areas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="working-hours">
          <Card>
            <CardHeader>
              <CardTitle>Working Hours</CardTitle>
              <CardDescription>
                Set your regular working hours for each day of the week
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...workingHoursForm}>
                <form onSubmit={workingHoursForm.handleSubmit(handleWorkingHoursSubmit)} className="space-y-6">
                  {daysOfWeek.map((day) => (
                    <div key={day} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <Label className="text-base capitalize">{day}</Label>
                        <FormField
                          control={workingHoursForm.control}
                          name={`${day}.enabled` as any}
                          render={({ field }) => (
                            <FormItem className="flex items-center space-x-2">
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                  data-testid={`switch-${day}-enabled`}
                                />
                              </FormControl>
                              <FormLabel className="!mt-0">Available</FormLabel>
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      {workingHoursForm.watch(`${day}.enabled` as any) && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <FormField
                            control={workingHoursForm.control}
                            name={`${day}.start` as any}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Start Time</FormLabel>
                                <FormControl>
                                  <Input
                                    type="time"
                                    {...field}
                                    data-testid={`input-${day}-start`}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={workingHoursForm.control}
                            name={`${day}.end` as any}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>End Time</FormLabel>
                                <FormControl>
                                  <Input
                                    type="time"
                                    {...field}
                                    data-testid={`input-${day}-end`}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={workingHoursForm.control}
                            name={`${day}.lunchStart` as any}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>
                                  <Coffee className="w-3 h-3 inline mr-1" />
                                  Lunch Start
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    type="time"
                                    {...field}
                                    placeholder="Optional"
                                    data-testid={`input-${day}-lunch-start`}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={workingHoursForm.control}
                            name={`${day}.lunchEnd` as any}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>
                                  <Coffee className="w-3 h-3 inline mr-1" />
                                  Lunch End
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    type="time"
                                    {...field}
                                    placeholder="Optional"
                                    data-testid={`input-${day}-lunch-end`}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                  
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={updateWorkingHoursMutation.isPending}
                    data-testid="button-save-working-hours"
                  >
                    {updateWorkingHoursMutation.isPending ? "Saving..." : "Save Working Hours"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="vacation">
          <Card>
            <CardHeader>
              <CardTitle>Time Off / Vacation</CardTitle>
              <CardDescription>
                Schedule your vacation days or time off when you won't be available
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row gap-4">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "justify-start text-left font-normal flex-1",
                          !vacationDates.from && "text-muted-foreground"
                        )}
                        data-testid="button-vacation-date-range"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {vacationDates.from && vacationDates.to ? (
                          <>
                            {format(vacationDates.from, "PPP")} - {format(vacationDates.to, "PPP")}
                          </>
                        ) : (
                          <span>Pick date range</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        initialFocus
                        mode="range"
                        defaultMonth={vacationDates.from}
                        selected={{
                          from: vacationDates.from,
                          to: vacationDates.to
                        }}
                        onSelect={(range: any) => setVacationDates(range || { from: undefined, to: undefined })}
                        numberOfMonths={2}
                      />
                    </PopoverContent>
                  </Popover>
                  
                  <Button
                    onClick={handleAddVacation}
                    disabled={!vacationDates.from || !vacationDates.to || addVacationMutation.isPending}
                    data-testid="button-add-vacation"
                  >
                    Add Time Off
                  </Button>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Scheduled Time Off</h3>
                  {settings?.vacations && settings.vacations.length > 0 ? (
                    <div className="space-y-2">
                      {settings.vacations.map((vacation: any) => (
                        <div key={vacation.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div>
                            <div className="font-medium">
                              {format(new Date(vacation.startDate), "PPP")} - {format(new Date(vacation.endDate), "PPP")}
                            </div>
                            {vacation.reason && (
                              <div className="text-sm text-muted-foreground">{vacation.reason}</div>
                            )}
                          </div>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => deleteVacationMutation.mutate(vacation.id)}
                            disabled={deleteVacationMutation.isPending}
                            data-testid={`button-delete-vacation-${vacation.id}`}
                          >
                            Remove
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No scheduled time off</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preferences">
          <Card>
            <CardHeader>
              <CardTitle>Job Preferences</CardTitle>
              <CardDescription>
                Configure your job acceptance and notification preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...preferencesForm}>
                <form onSubmit={preferencesForm.handleSubmit(handlePreferencesSubmit)} className="space-y-6">
                  <FormField
                    control={preferencesForm.control}
                    name="maxJobsPerDay"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Maximum Jobs Per Day</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            onChange={e => field.onChange(parseInt(e.target.value))}
                            data-testid="input-max-jobs"
                          />
                        </FormControl>
                        <FormDescription>
                          Limit the number of jobs you can accept per day
                        </FormDescription>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={preferencesForm.control}
                    name="minimumJobAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Minimum Job Amount ($)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            onChange={e => field.onChange(parseFloat(e.target.value))}
                            data-testid="input-minimum-amount"
                          />
                        </FormControl>
                        <FormDescription>
                          Only receive job requests above this amount
                        </FormDescription>
                      </FormItem>
                    )}
                  />

                  <Separator />

                  <FormField
                    control={preferencesForm.control}
                    name="autoAcceptJobs"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <FormLabel>Auto-Accept Jobs</FormLabel>
                          <FormDescription>
                            Automatically accept jobs that match your criteria
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="switch-auto-accept"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={preferencesForm.control}
                    name="notifyOnNewJobs"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <FormLabel>New Job Notifications</FormLabel>
                          <FormDescription>
                            Receive notifications for new job opportunities
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="switch-notify-new"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={preferencesForm.control}
                    name="notifyOnEmergencyJobs"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <FormLabel>Emergency Job Alerts</FormLabel>
                          <FormDescription>
                            Get notified immediately for emergency jobs
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="switch-notify-emergency"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={updatePreferencesMutation.isPending}
                    data-testid="button-save-preferences"
                  >
                    {updatePreferencesMutation.isPending ? "Saving..." : "Save Preferences"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="coverage">
          <Card>
            <CardHeader>
              <CardTitle>Service Areas & Skills</CardTitle>
              <CardDescription>
                Select the areas you cover and the services you provide
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <Label className="text-base mb-4 block">Service Types</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {[
                      "Tire Service",
                      "Battery Service",
                      "Fuel Delivery",
                      "Jump Start",
                      "Lockout Service",
                      "Engine Repair",
                      "Transmission",
                      "Brake Service",
                      "Electrical",
                      "HVAC",
                      "Trailer Repair",
                      "Refrigeration"
                    ].map((service) => (
                      <label
                        key={service}
                        className="flex items-center space-x-2 cursor-pointer"
                      >
                        <Checkbox
                          value={service}
                          data-testid={`checkbox-service-${service.toLowerCase().replace(/\s+/g, '-')}`}
                        />
                        <span className="text-sm">{service}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <Separator />

                <div>
                  <Label className="text-base mb-4 block">Coverage Areas</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {[
                      "Downtown",
                      "North Side",
                      "South Side",
                      "East Side",
                      "West Side",
                      "Airport Area",
                      "Industrial District",
                      "Port Area",
                      "Suburbs",
                      "Highway Corridor"
                    ].map((area) => (
                      <label
                        key={area}
                        className="flex items-center space-x-2 cursor-pointer"
                      >
                        <Checkbox
                          value={area}
                          data-testid={`checkbox-area-${area.toLowerCase().replace(/\s+/g, '-')}`}
                        />
                        <span className="text-sm">{area}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <Button className="w-full" data-testid="button-save-coverage">
                  Save Coverage Areas
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}