import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  ArrowRight,
  CalendarIcon,
  Clock,
  MapPin,
  Truck,
  DollarSign,
  AlertCircle,
  CheckCircle
} from "lucide-react";
import { format } from "date-fns";

const pmSchedulingSchema = z.object({
  selectedVehicles: z.array(z.string()).min(1, "Select at least one vehicle"),
  serviceType: z.string().min(1, "Service type is required"),
  serviceLocation: z.string().min(1, "Service location is required"),
  preferredDate: z.date({
    required_error: "Please select a date"
  }),
  preferredTime: z.string().min(1, "Preferred time is required"),
  notes: z.string().optional()
});

type PMSchedulingForm = z.infer<typeof pmSchedulingSchema>;

export default function SchedulePM() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [costEstimate, setCostEstimate] = useState<string | null>(null);

  // Mock fleet vehicles - would come from API
  const vehicles = [
    { id: "v1", unitNumber: "T-101", make: "Freightliner", model: "Cascadia", nextPMDue: "2024-02-15", status: "active" },
    { id: "v2", unitNumber: "T-102", make: "Peterbilt", model: "579", nextPMDue: "2024-02-10", status: "active" },
    { id: "v3", unitNumber: "T-103", make: "Kenworth", model: "T680", nextPMDue: "2024-02-20", status: "active" },
    { id: "v4", unitNumber: "T-104", make: "Volvo", model: "VNL", nextPMDue: "2024-02-25", status: "active" },
    { id: "v5", unitNumber: "T-105", make: "Mack", model: "Anthem", nextPMDue: "2024-03-01", status: "active" }
  ];

  const form = useForm<PMSchedulingForm>({
    resolver: zodResolver(pmSchedulingSchema),
    defaultValues: {
      selectedVehicles: [],
      serviceType: "",
      serviceLocation: "",
      preferredTime: "",
      notes: ""
    }
  });

  const selectedVehicles = form.watch("selectedVehicles");
  const serviceType = form.watch("serviceType");

  // Calculate cost estimate based on selections
  const calculateCostEstimate = () => {
    const vehicleCount = selectedVehicles.length;
    let basePrice = 0;

    switch (serviceType) {
      case "a-service":
        basePrice = 150;
        break;
      case "b-service":
        basePrice = 300;
        break;
      case "c-service":
        basePrice = 500;
        break;
      case "custom":
        basePrice = 400;
        break;
    }

    // Apply Gold tier 10% discount
    const discount = 0.1;
    const totalBeforeDiscount = basePrice * vehicleCount;
    const discountAmount = totalBeforeDiscount * discount;
    const total = totalBeforeDiscount - discountAmount;

    setCostEstimate(`$${total.toFixed(2)} (Gold tier: 10% off)`);
  };

  const onSubmit = async (data: PMSchedulingForm) => {
    try {
      console.log("PM scheduling data:", data);
      
      toast({
        title: "PM Service Scheduled",
        description: `Successfully scheduled ${data.selectedVehicles.length} vehicle(s) for ${format(data.preferredDate, "PPP")} at ${data.preferredTime}`
      });
      
      setLocation("/fleet/dashboard");
    } catch (error) {
      toast({
        title: "Scheduling Failed",
        description: "An error occurred while scheduling the service. Please try again.",
        variant: "destructive"
      });
    }
  };

  const nextStep = () => {
    const fieldsToValidate = step === 1 
      ? ["selectedVehicles"]
      : step === 2
      ? ["serviceType", "serviceLocation"]
      : [];

    form.trigger(fieldsToValidate as any).then((isValid) => {
      if (isValid) {
        if (step === 2) {
          calculateCostEstimate();
        }
        setStep(step + 1);
      }
    });
  };

  const prevStep = () => setStep(step - 1);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setLocation("/fleet/dashboard")}
                data-testid="button-back-to-dashboard"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <span className="ml-4 text-2xl font-bold text-primary">Schedule PM Service</span>
            </div>
            <Badge variant="default">Gold Tier Pricing</Badge>
          </div>
        </div>
      </header>

      {/* Progress Indicator */}
      <div className="max-w-3xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-primary text-white' : 'bg-gray-200'}`}>
              {step > 1 ? <CheckCircle className="w-5 h-5" /> : "1"}
            </div>
            <span className="ml-2 text-sm font-medium">Select Vehicles</span>
          </div>
          <div className="flex-1 mx-4 h-1 bg-gray-200">
            <div className={`h-full bg-primary transition-all ${step >= 2 ? 'w-1/2' : 'w-0'}`} />
          </div>
          <div className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-primary text-white' : 'bg-gray-200'}`}>
              {step > 2 ? <CheckCircle className="w-5 h-5" /> : "2"}
            </div>
            <span className="ml-2 text-sm font-medium">Service Details</span>
          </div>
          <div className="flex-1 mx-4 h-1 bg-gray-200">
            <div className={`h-full bg-primary transition-all ${step >= 3 ? 'w-full' : 'w-0'}`} />
          </div>
          <div className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 3 ? 'bg-primary text-white' : 'bg-gray-200'}`}>
              {step > 3 ? <CheckCircle className="w-5 h-5" /> : "3"}
            </div>
            <span className="ml-2 text-sm font-medium">Schedule & Confirm</span>
          </div>
        </div>

        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle>
              {step === 1 ? "Select Vehicles" : step === 2 ? "Service Details" : "Schedule & Confirm"}
            </CardTitle>
            <CardDescription>
              {step === 1 ? "Choose which vehicles need PM service" : 
               step === 2 ? "Select service type and location" : 
               "Choose date/time and review your selection"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                
                {/* Step 1: Vehicle Selection */}
                {step === 1 && (
                  <FormField
                    control={form.control}
                    name="selectedVehicles"
                    render={() => (
                      <FormItem>
                        <FormLabel>Available Vehicles</FormLabel>
                        <FormDescription>
                          Select all vehicles that need PM service. Vehicles with upcoming PM dates are highlighted.
                        </FormDescription>
                        <div className="space-y-3 mt-4">
                          {vehicles.map((vehicle) => (
                            <FormField
                              key={vehicle.id}
                              control={form.control}
                              name="selectedVehicles"
                              render={({ field }) => {
                                return (
                                  <FormItem
                                    key={vehicle.id}
                                    className="flex flex-row items-start space-x-3 space-y-0"
                                  >
                                    <FormControl>
                                      <Checkbox
                                        checked={field.value?.includes(vehicle.id)}
                                        onCheckedChange={(checked) => {
                                          return checked
                                            ? field.onChange([...field.value, vehicle.id])
                                            : field.onChange(
                                                field.value?.filter(
                                                  (value) => value !== vehicle.id
                                                )
                                              );
                                        }}
                                        data-testid={`checkbox-vehicle-${vehicle.id}`}
                                      />
                                    </FormControl>
                                    <div className="flex-1">
                                      <div className="flex items-center justify-between">
                                        <div className="space-y-1">
                                          <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                            {vehicle.unitNumber} - {vehicle.make} {vehicle.model}
                                          </label>
                                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                            <span>Next PM Due: {vehicle.nextPMDue}</span>
                                            {new Date(vehicle.nextPMDue) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) && (
                                              <Badge variant="secondary" className="text-xs">
                                                <AlertCircle className="w-3 h-3 mr-1" />
                                                Due Soon
                                              </Badge>
                                            )}
                                          </div>
                                        </div>
                                        <Badge variant="default" className="bg-green-500">Active</Badge>
                                      </div>
                                    </div>
                                  </FormItem>
                                );
                              }}
                            />
                          ))}
                        </div>
                        <FormMessage />
                        {selectedVehicles.length > 0 && (
                          <p className="text-sm text-muted-foreground mt-2">
                            {selectedVehicles.length} vehicle(s) selected
                          </p>
                        )}
                      </FormItem>
                    )}
                  />
                )}

                {/* Step 2: Service Details */}
                {step === 2 && (
                  <div className="space-y-6">
                    <FormField
                      control={form.control}
                      name="serviceType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Service Type</FormLabel>
                          <FormControl>
                            <RadioGroup
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                              className="grid grid-cols-1 gap-4"
                              data-testid="radio-service-type"
                            >
                              <div className="flex items-start space-x-3 space-y-0">
                                <RadioGroupItem value="a-service" id="a-service" />
                                <label htmlFor="a-service" className="font-normal cursor-pointer">
                                  <div className="font-medium">A-Service (Basic PM)</div>
                                  <div className="text-sm text-muted-foreground">
                                    Oil change, filter replacement, basic inspection ($150/vehicle)
                                  </div>
                                </label>
                              </div>
                              <div className="flex items-start space-x-3 space-y-0">
                                <RadioGroupItem value="b-service" id="b-service" />
                                <label htmlFor="b-service" className="font-normal cursor-pointer">
                                  <div className="font-medium">B-Service (Comprehensive PM)</div>
                                  <div className="text-sm text-muted-foreground">
                                    All A-Service items plus brake inspection, tire rotation, fluid checks ($300/vehicle)
                                  </div>
                                </label>
                              </div>
                              <div className="flex items-start space-x-3 space-y-0">
                                <RadioGroupItem value="c-service" id="c-service" />
                                <label htmlFor="c-service" className="font-normal cursor-pointer">
                                  <div className="font-medium">C-Service (Major Service)</div>
                                  <div className="text-sm text-muted-foreground">
                                    Complete inspection, all fluids, major component checks ($500/vehicle)
                                  </div>
                                </label>
                              </div>
                              <div className="flex items-start space-x-3 space-y-0">
                                <RadioGroupItem value="custom" id="custom" />
                                <label htmlFor="custom" className="font-normal cursor-pointer">
                                  <div className="font-medium">Custom Service Package</div>
                                  <div className="text-sm text-muted-foreground">
                                    Contact us to create a custom service package ($400/vehicle base)
                                  </div>
                                </label>
                              </div>
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="serviceLocation"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Service Location</FormLabel>
                          <FormControl>
                            <RadioGroup
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                              className="grid grid-cols-1 gap-4"
                              data-testid="radio-service-location"
                            >
                              <div className="flex items-start space-x-3 space-y-0">
                                <RadioGroupItem value="onsite" id="onsite" />
                                <label htmlFor="onsite" className="font-normal cursor-pointer">
                                  <div className="font-medium">On-site at your facility</div>
                                  <div className="text-sm text-muted-foreground">
                                    <MapPin className="inline w-4 h-4 mr-1" />
                                    123 Fleet Yard, Los Angeles, CA 90001
                                  </div>
                                </label>
                              </div>
                              <div className="flex items-start space-x-3 space-y-0">
                                <RadioGroupItem value="service-center" id="service-center" />
                                <label htmlFor="service-center" className="font-normal cursor-pointer">
                                  <div className="font-medium">TruckFixGo Service Center</div>
                                  <div className="text-sm text-muted-foreground">
                                    <MapPin className="inline w-4 h-4 mr-1" />
                                    456 Service Rd, Los Angeles, CA 90002
                                  </div>
                                </label>
                              </div>
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                {/* Step 3: Schedule & Confirm */}
                {step === 3 && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="preferredDate"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>Preferred Date</FormLabel>
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) => date < new Date() || date.getDay() === 0}
                              initialFocus
                              className="rounded-md border"
                            />
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="space-y-4">
                        <FormField
                          control={form.control}
                          name="preferredTime"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Preferred Time</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger data-testid="select-time">
                                    <SelectValue placeholder="Select time slot" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="8:00 AM">8:00 AM</SelectItem>
                                  <SelectItem value="9:00 AM">9:00 AM</SelectItem>
                                  <SelectItem value="10:00 AM">10:00 AM</SelectItem>
                                  <SelectItem value="11:00 AM">11:00 AM</SelectItem>
                                  <SelectItem value="12:00 PM">12:00 PM</SelectItem>
                                  <SelectItem value="1:00 PM">1:00 PM</SelectItem>
                                  <SelectItem value="2:00 PM">2:00 PM</SelectItem>
                                  <SelectItem value="3:00 PM">3:00 PM</SelectItem>
                                  <SelectItem value="4:00 PM">4:00 PM</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormDescription>
                                Available time slots based on your Gold tier priority
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="notes"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Additional Notes (Optional)</FormLabel>
                              <FormControl>
                                <textarea 
                                  {...field}
                                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                  placeholder="Any special instructions or requirements..."
                                  data-testid="textarea-notes"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    {/* Summary */}
                    <Card className="bg-gray-50">
                      <CardHeader>
                        <CardTitle className="text-lg">Service Summary</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Vehicles:</span>
                            <span className="font-medium">{selectedVehicles.length} selected</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Service Type:</span>
                            <span className="font-medium">
                              {serviceType === "a-service" ? "A-Service (Basic PM)" :
                               serviceType === "b-service" ? "B-Service (Comprehensive PM)" :
                               serviceType === "c-service" ? "C-Service (Major)" :
                               "Custom Package"}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Location:</span>
                            <span className="font-medium">
                              {form.watch("serviceLocation") === "onsite" ? "On-site" : "Service Center"}
                            </span>
                          </div>
                          <Separator className="my-2" />
                          <div className="flex justify-between items-center">
                            <span className="font-medium">Estimated Cost:</span>
                            <div className="text-right">
                              <p className="text-2xl font-bold text-primary">{costEstimate}</p>
                              <p className="text-xs text-muted-foreground">Billed to fleet account</p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Navigation Buttons */}
                <div className="flex justify-between pt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={step === 1 ? () => setLocation("/fleet/dashboard") : prevStep}
                    data-testid="button-prev"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    {step === 1 ? "Cancel" : "Previous"}
                  </Button>

                  {step < 3 ? (
                    <Button type="button" onClick={nextStep} data-testid="button-next">
                      Next
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  ) : (
                    <Button type="submit" data-testid="button-confirm">
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Confirm Scheduling
                    </Button>
                  )}
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}