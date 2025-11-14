import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Loader2, Save, Settings, Bell, DollarSign, Calendar, MapPin, Star, ShieldCheck } from "lucide-react";
import { useBookingPreferences } from "@/hooks/use-booking-preferences";
import type { InsertBookingPreferences } from "@shared/schema";

// Validation schema for preferences form
const preferencesFormSchema = z.object({
  preferredServiceTimes: z.array(z.string()).optional(),
  preferredPaymentMethods: z.array(z.string()).optional(),
  autoAcceptBids: z.boolean().optional(),
  maxAutoAcceptPrice: z.number().optional(),
  notificationPreferences: z.object({
    email: z.boolean(),
    sms: z.boolean(),
    push: z.boolean(),
    frequency: z.enum(["immediate", "hourly", "daily", "weekly"]),
    types: z.array(z.string())
  }).optional()
});

type PreferencesFormValues = z.infer<typeof preferencesFormSchema>;

interface BookingPreferencesFormProps {
  userId: string;
}

export function BookingPreferencesForm({ userId }: BookingPreferencesFormProps) {
  const { preferences, isLoading, updatePreferences, isUpdating } = useBookingPreferences(userId);
  const [selectedTimes, setSelectedTimes] = useState<string[]>([]);
  const [selectedPaymentMethods, setSelectedPaymentMethods] = useState<string[]>([]);
  const [selectedNotificationTypes, setSelectedNotificationTypes] = useState<string[]>([
    "job_update",
    "bid_received",
    "payment",
    "reminders"
  ]);

  const form = useForm<PreferencesFormValues>({
    resolver: zodResolver(preferencesFormSchema),
    defaultValues: {
      preferredServiceTimes: [],
      preferredPaymentMethods: [],
      autoAcceptBids: false,
      maxAutoAcceptPrice: undefined,
      notificationPreferences: {
        email: true,
        sms: true,
        push: true,
        frequency: "immediate",
        types: ["job_update", "bid_received", "payment", "reminders"]
      }
    }
  });

  // Load existing preferences
  useEffect(() => {
    if (preferences) {
      form.reset({
        preferredServiceTimes: preferences.preferredServiceTimes as string[] || [],
        preferredPaymentMethods: preferences.preferredPaymentMethods as string[] || [],
        autoAcceptBids: preferences.autoAcceptBids || false,
        maxAutoAcceptPrice: typeof preferences.maxAutoAcceptPrice === 'string' 
          ? parseFloat(preferences.maxAutoAcceptPrice) 
          : preferences.maxAutoAcceptPrice || undefined,
        notificationPreferences: preferences.notificationPreferences as any || {
          email: true,
          sms: true,
          push: true,
          frequency: "immediate",
          types: ["job_update", "bid_received", "payment", "reminders"]
        }
      });
      
      setSelectedTimes(preferences.preferredServiceTimes as string[] || []);
      setSelectedPaymentMethods(preferences.preferredPaymentMethods as string[] || []);
      if (preferences.notificationPreferences && typeof preferences.notificationPreferences === 'object') {
        const prefs = preferences.notificationPreferences as any;
        setSelectedNotificationTypes(prefs.types || []);
      }
    }
  }, [preferences, form]);

  const onSubmit = async (data: PreferencesFormValues) => {
    const preferencesData: InsertBookingPreferences = {
      userId: userId,
      preferredServiceTimes: selectedTimes,
      preferredPaymentMethods: selectedPaymentMethods,
      autoAcceptBids: data.autoAcceptBids,
      maxAutoAcceptPrice: data.maxAutoAcceptPrice ? String(data.maxAutoAcceptPrice) : undefined,
      notificationPreferences: {
        ...data.notificationPreferences,
        types: selectedNotificationTypes
      }
    };

    updatePreferences(preferencesData);
  };

  const timeSlots = [
    "Morning (6AM - 12PM)",
    "Afternoon (12PM - 6PM)",
    "Evening (6PM - 10PM)",
    "Night (10PM - 6AM)",
    "Weekdays",
    "Weekends",
    "Emergency 24/7"
  ];

  const paymentMethods = [
    "Cash",
    "Credit Card",
    "Debit Card",
    "Fleet Account",
    "Company Check",
    "Wire Transfer",
    "Purchase Order"
  ];

  const notificationTypes = [
    { value: "job_update", label: "Job Status Updates" },
    { value: "bid_received", label: "New Bids Received" },
    { value: "payment", label: "Payment Notifications" },
    { value: "reminders", label: "Service Reminders" },
    { value: "promotions", label: "Promotions & Offers" },
    { value: "maintenance", label: "Maintenance Alerts" }
  ];

  const toggleTimeSlot = (timeSlot: string) => {
    setSelectedTimes((prev) =>
      prev.includes(timeSlot)
        ? prev.filter((t) => t !== timeSlot)
        : [...prev, timeSlot]
    );
  };

  const togglePaymentMethod = (method: string) => {
    setSelectedPaymentMethods((prev) =>
      prev.includes(method)
        ? prev.filter((m) => m !== method)
        : [...prev, method]
    );
  };

  const toggleNotificationType = (type: string) => {
    setSelectedNotificationTypes((prev) =>
      prev.includes(type)
        ? prev.filter((t) => t !== type)
        : [...prev, type]
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Booking Preferences
            </CardTitle>
            <CardDescription>
              Customize your service booking experience with your preferred settings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="service" className="space-y-4">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="service">Service</TabsTrigger>
                <TabsTrigger value="payment">Payment</TabsTrigger>
                <TabsTrigger value="auto-accept">Auto-Accept</TabsTrigger>
                <TabsTrigger value="notifications">Notifications</TabsTrigger>
              </TabsList>

              <TabsContent value="service" className="space-y-4">
                <div className="space-y-4">
                  <div>
                    <h4 className="flex items-center gap-2 text-sm font-medium mb-3">
                      <Calendar className="h-4 w-4" />
                      Preferred Service Times
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      {timeSlots.map((timeSlot) => (
                        <Button
                          key={timeSlot}
                          type="button"
                          variant={selectedTimes.includes(timeSlot) ? "default" : "outline"}
                          size="sm"
                          onClick={() => toggleTimeSlot(timeSlot)}
                          className="justify-start"
                          data-testid={`button-time-slot-${timeSlot.toLowerCase().replace(/\s+/g, '-')}`}
                        >
                          {selectedTimes.includes(timeSlot) && (
                            <Star className="h-3 w-3 mr-1" />
                          )}
                          {timeSlot}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="payment" className="space-y-4">
                <div className="space-y-4">
                  <div>
                    <h4 className="flex items-center gap-2 text-sm font-medium mb-3">
                      <DollarSign className="h-4 w-4" />
                      Preferred Payment Methods
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      {paymentMethods.map((method) => (
                        <Button
                          key={method}
                          type="button"
                          variant={selectedPaymentMethods.includes(method) ? "default" : "outline"}
                          size="sm"
                          onClick={() => togglePaymentMethod(method)}
                          className="justify-start"
                          data-testid={`button-payment-${method.toLowerCase().replace(/\s+/g, '-')}`}
                        >
                          {selectedPaymentMethods.includes(method) && (
                            <ShieldCheck className="h-3 w-3 mr-1" />
                          )}
                          {method}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="auto-accept" className="space-y-4">
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="autoAcceptBids"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel>Enable Auto-Accept</FormLabel>
                          <FormDescription>
                            Automatically accept bids that meet your criteria
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

                  {form.watch("autoAcceptBids") && (
                    <FormField
                      control={form.control}
                      name="maxAutoAcceptPrice"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Maximum Auto-Accept Price</FormLabel>
                          <FormControl>
                            <div className="flex items-center gap-2">
                              <span className="text-sm">$</span>
                              <Input
                                type="number"
                                placeholder="500"
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value))}
                                data-testid="input-max-price"
                              />
                            </div>
                          </FormControl>
                          <FormDescription>
                            Only bids below this amount will be auto-accepted
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>
              </TabsContent>

              <TabsContent value="notifications" className="space-y-4">
                <div className="space-y-4">
                  <div className="space-y-4">
                    <h4 className="flex items-center gap-2 text-sm font-medium">
                      <Bell className="h-4 w-4" />
                      Notification Channels
                    </h4>
                    
                    <div className="space-y-3">
                      <FormField
                        control={form.control}
                        name="notificationPreferences.email"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between">
                            <FormLabel className="font-normal">Email Notifications</FormLabel>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                data-testid="switch-email-notif"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="notificationPreferences.sms"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between">
                            <FormLabel className="font-normal">SMS Notifications</FormLabel>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                data-testid="switch-sms-notif"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="notificationPreferences.push"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between">
                            <FormLabel className="font-normal">Push Notifications</FormLabel>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                data-testid="switch-push-notif"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <Separator />

                  <FormField
                    control={form.control}
                    name="notificationPreferences.frequency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notification Frequency</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger data-testid="select-frequency">
                              <SelectValue placeholder="Select frequency" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="immediate">Immediate</SelectItem>
                            <SelectItem value="hourly">Hourly Summary</SelectItem>
                            <SelectItem value="daily">Daily Digest</SelectItem>
                            <SelectItem value="weekly">Weekly Roundup</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Separator />

                  <div className="space-y-3">
                    <h4 className="text-sm font-medium">Notification Types</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {notificationTypes.map((type) => (
                        <Button
                          key={type.value}
                          type="button"
                          variant={selectedNotificationTypes.includes(type.value) ? "default" : "outline"}
                          size="sm"
                          onClick={() => toggleNotificationType(type.value)}
                          className="justify-start text-xs"
                          data-testid={`button-notif-type-${type.value}`}
                        >
                          {type.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <div className="mt-6 flex justify-end">
              <Button type="submit" disabled={isUpdating} data-testid="button-save-preferences">
                {isUpdating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Preferences
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </Form>
  );
}