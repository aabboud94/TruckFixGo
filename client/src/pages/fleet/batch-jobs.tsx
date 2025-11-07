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
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  ArrowRight,
  Truck,
  DollarSign,
  Clock,
  Users,
  CheckCircle,
  AlertCircle,
  Calendar
} from "lucide-react";

const batchJobSchema = z.object({
  selectedVehicles: z.array(z.string()).min(2, "Select at least 2 vehicles for batch service"),
  serviceType: z.string().min(1, "Service type is required"),
  schedulingType: z.enum(["same-day", "staggered"]),
  startDate: z.string().min(1, "Start date is required"),
  timeInterval: z.string().optional(),
  preferredContractor: z.string().optional(),
  notes: z.string().optional()
});

type BatchJobForm = z.infer<typeof batchJobSchema>;

export default function BatchJobs() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [bulkPricing, setBulkPricing] = useState<string | null>(null);

  // Mock data
  const vehicles = [
    { id: "v1", unitNumber: "T-101", make: "Freightliner", model: "Cascadia", status: "active" },
    { id: "v2", unitNumber: "T-102", make: "Peterbilt", model: "579", status: "active" },
    { id: "v3", unitNumber: "T-103", make: "Kenworth", model: "T680", status: "active" },
    { id: "v4", unitNumber: "T-104", make: "Volvo", model: "VNL", status: "active" },
    { id: "v5", unitNumber: "T-105", make: "Mack", model: "Anthem", status: "active" },
    { id: "v6", unitNumber: "T-106", make: "International", model: "LT", status: "active" },
    { id: "v7", unitNumber: "T-107", make: "Freightliner", model: "M2", status: "active" },
    { id: "v8", unitNumber: "T-108", make: "Peterbilt", model: "389", status: "active" }
  ];

  const contractors = [
    { id: "c1", name: "Quick Fix Mobile", specialties: ["PM", "Emergency"], rating: 4.8 },
    { id: "c2", name: "Pro Truck Services", specialties: ["Washing", "PM"], rating: 4.6 },
    { id: "c3", name: "Fleet Masters", specialties: ["All Services"], rating: 4.9 },
    { id: "c4", name: "24/7 Truck Care", specialties: ["Emergency", "Tires"], rating: 4.7 }
  ];

  const form = useForm<BatchJobForm>({
    resolver: zodResolver(batchJobSchema),
    defaultValues: {
      selectedVehicles: [],
      serviceType: "",
      schedulingType: "same-day",
      startDate: "",
      timeInterval: "",
      preferredContractor: "",
      notes: ""
    }
  });

  const selectedVehicles = form.watch("selectedVehicles");
  const serviceType = form.watch("serviceType");
  const schedulingType = form.watch("schedulingType");

  const calculateBulkPricing = () => {
    const vehicleCount = selectedVehicles.length;
    let basePrice = 0;

    switch (serviceType) {
      case "washing":
        basePrice = 75;
        break;
      case "pm-a":
        basePrice = 150;
        break;
      case "pm-b":
        basePrice = 300;
        break;
      case "dot-inspection":
        basePrice = 100;
        break;
      case "tire-rotation":
        basePrice = 80;
        break;
      default:
        basePrice = 200;
    }

    // Apply volume discounts
    let discount = 0.1; // Gold tier base discount
    if (vehicleCount >= 5) discount += 0.05; // Additional 5% for 5+ vehicles
    if (vehicleCount >= 10) discount += 0.05; // Additional 5% for 10+ vehicles

    const totalBeforeDiscount = basePrice * vehicleCount;
    const discountAmount = totalBeforeDiscount * discount;
    const total = totalBeforeDiscount - discountAmount;

    setBulkPricing(`$${total.toFixed(2)} (${(discount * 100).toFixed(0)}% bulk discount)`);
  };

  const onSubmit = async (data: BatchJobForm) => {
    try {
      console.log("Batch job data:", data);
      
      toast({
        title: "Batch Service Scheduled",
        description: `Successfully scheduled ${data.selectedVehicles.length} vehicles for batch service`
      });
      
      setLocation("/fleet/dashboard");
    } catch (error) {
      toast({
        title: "Scheduling Failed",
        description: "An error occurred while scheduling the batch service. Please try again.",
        variant: "destructive"
      });
    }
  };

  const nextStep = () => {
    const fieldsToValidate = step === 1 
      ? ["selectedVehicles", "serviceType"]
      : [];

    form.trigger(fieldsToValidate as any).then((isValid) => {
      if (isValid) {
        if (step === 1) {
          calculateBulkPricing();
        }
        setStep(step + 1);
      }
    });
  };

  const prevStep = () => setStep(step - 1);

  const toggleSelectAll = () => {
    const allVehicleIds = vehicles.map(v => v.id);
    if (selectedVehicles.length === vehicles.length) {
      form.setValue("selectedVehicles", []);
    } else {
      form.setValue("selectedVehicles", allVehicleIds);
    }
  };

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
              <span className="ml-4 text-2xl font-bold text-primary">Batch Job Creation</span>
            </div>
            <Badge variant="default">Volume Pricing Available</Badge>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-primary text-white' : 'bg-gray-200'}`}>
              {step > 1 ? <CheckCircle className="w-6 h-6" /> : "1"}
            </div>
            <span className="ml-2 text-sm font-medium">Select Vehicles & Service</span>
          </div>
          <div className="w-24 h-1 mx-4 bg-gray-200">
            <div className={`h-full bg-primary transition-all ${step >= 2 ? 'w-full' : 'w-0'}`} />
          </div>
          <div className="flex items-center">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-primary text-white' : 'bg-gray-200'}`}>
              {step > 2 ? <CheckCircle className="w-6 h-6" /> : "2"}
            </div>
            <span className="ml-2 text-sm font-medium">Schedule & Confirm</span>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>
              {step === 1 ? "Select Vehicles and Service Type" : "Schedule and Confirm"}
            </CardTitle>
            <CardDescription>
              {step === 1 
                ? "Choose multiple vehicles for the same service to get bulk pricing"
                : "Set scheduling preferences and review your batch job"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Step 1: Vehicle and Service Selection */}
                {step === 1 && (
                  <div className="space-y-6">
                    {/* Service Type Selection */}
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
                              className="grid grid-cols-1 gap-3"
                              data-testid="radio-service-type"
                            >
                              <div className="flex items-start space-x-3 space-y-0">
                                <RadioGroupItem value="washing" id="washing" />
                                <label htmlFor="washing" className="font-normal cursor-pointer">
                                  <div className="font-medium">Truck Washing</div>
                                  <div className="text-sm text-muted-foreground">
                                    Professional wash with water recovery ($75/vehicle)
                                  </div>
                                </label>
                              </div>
                              <div className="flex items-start space-x-3 space-y-0">
                                <RadioGroupItem value="pm-a" id="pm-a" />
                                <label htmlFor="pm-a" className="font-normal cursor-pointer">
                                  <div className="font-medium">A-Service PM</div>
                                  <div className="text-sm text-muted-foreground">
                                    Basic preventive maintenance ($150/vehicle)
                                  </div>
                                </label>
                              </div>
                              <div className="flex items-start space-x-3 space-y-0">
                                <RadioGroupItem value="pm-b" id="pm-b" />
                                <label htmlFor="pm-b" className="font-normal cursor-pointer">
                                  <div className="font-medium">B-Service PM</div>
                                  <div className="text-sm text-muted-foreground">
                                    Comprehensive maintenance ($300/vehicle)
                                  </div>
                                </label>
                              </div>
                              <div className="flex items-start space-x-3 space-y-0">
                                <RadioGroupItem value="dot-inspection" id="dot-inspection" />
                                <label htmlFor="dot-inspection" className="font-normal cursor-pointer">
                                  <div className="font-medium">DOT Inspection</div>
                                  <div className="text-sm text-muted-foreground">
                                    Annual DOT compliance inspection ($100/vehicle)
                                  </div>
                                </label>
                              </div>
                              <div className="flex items-start space-x-3 space-y-0">
                                <RadioGroupItem value="tire-rotation" id="tire-rotation" />
                                <label htmlFor="tire-rotation" className="font-normal cursor-pointer">
                                  <div className="font-medium">Tire Rotation</div>
                                  <div className="text-sm text-muted-foreground">
                                    Rotate and balance all tires ($80/vehicle)
                                  </div>
                                </label>
                              </div>
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Vehicle Selection */}
                    <FormField
                      control={form.control}
                      name="selectedVehicles"
                      render={() => (
                        <FormItem>
                          <div className="flex items-center justify-between mb-2">
                            <FormLabel>Select Vehicles</FormLabel>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={toggleSelectAll}
                              data-testid="button-select-all"
                            >
                              {selectedVehicles.length === vehicles.length ? "Deselect All" : "Select All"}
                            </Button>
                          </div>
                          <FormDescription>
                            Select at least 2 vehicles for batch pricing. More vehicles = better discounts!
                          </FormDescription>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
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
                                        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                          {vehicle.unitNumber} - {vehicle.make} {vehicle.model}
                                        </label>
                                      </div>
                                    </FormItem>
                                  );
                                }}
                              />
                            ))}
                          </div>
                          <FormMessage />
                          {selectedVehicles.length > 0 && (
                            <div className="mt-4 p-3 bg-primary/10 rounded-lg">
                              <p className="text-sm font-medium">
                                {selectedVehicles.length} vehicle(s) selected
                                {selectedVehicles.length >= 5 && (
                                  <Badge className="ml-2" variant="default">
                                    {selectedVehicles.length >= 10 ? "20% Bulk Discount" : "15% Bulk Discount"}
                                  </Badge>
                                )}
                              </p>
                            </div>
                          )}
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                {/* Step 2: Scheduling and Confirmation */}
                {step === 2 && (
                  <div className="space-y-6">
                    <FormField
                      control={form.control}
                      name="schedulingType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Scheduling Type</FormLabel>
                          <FormControl>
                            <RadioGroup
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                              className="grid grid-cols-1 gap-3"
                              data-testid="radio-scheduling-type"
                            >
                              <div className="flex items-start space-x-3 space-y-0">
                                <RadioGroupItem value="same-day" id="same-day" />
                                <label htmlFor="same-day" className="font-normal cursor-pointer">
                                  <div className="font-medium">Same Day Service</div>
                                  <div className="text-sm text-muted-foreground">
                                    All vehicles serviced on the same day
                                  </div>
                                </label>
                              </div>
                              <div className="flex items-start space-x-3 space-y-0">
                                <RadioGroupItem value="staggered" id="staggered" />
                                <label htmlFor="staggered" className="font-normal cursor-pointer">
                                  <div className="font-medium">Staggered Schedule</div>
                                  <div className="text-sm text-muted-foreground">
                                    Vehicles serviced over multiple days to minimize downtime
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
                      name="startDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Start Date</FormLabel>
                          <FormControl>
                            <input
                              type="date"
                              {...field}
                              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                              min={new Date().toISOString().split('T')[0]}
                              data-testid="input-start-date"
                            />
                          </FormControl>
                          <FormDescription>
                            {schedulingType === "staggered" 
                              ? "First vehicle will be serviced on this date"
                              : "All vehicles will be serviced on this date"}
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {schedulingType === "staggered" && (
                      <FormField
                        control={form.control}
                        name="timeInterval"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Service Interval</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-interval">
                                  <SelectValue placeholder="Select interval between services" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="daily">Daily (one vehicle per day)</SelectItem>
                                <SelectItem value="2-days">Every 2 days</SelectItem>
                                <SelectItem value="weekly">Weekly</SelectItem>
                                <SelectItem value="custom">Custom schedule</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    <FormField
                      control={form.control}
                      name="preferredContractor"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Preferred Contractor (Optional)</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-contractor">
                                <SelectValue placeholder="Let us assign the best available" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="auto">Auto-assign best available</SelectItem>
                              {contractors.map((contractor) => (
                                <SelectItem key={contractor.id} value={contractor.id}>
                                  <div className="flex items-center justify-between w-full">
                                    <span>{contractor.name}</span>
                                    <Badge variant="secondary" className="ml-2">
                                      ⭐ {contractor.rating}
                                    </Badge>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
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
                              placeholder="Special instructions for the service team..."
                              data-testid="textarea-notes"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Pricing Summary */}
                    <Card className="bg-gray-50">
                      <CardHeader>
                        <CardTitle className="text-lg">Batch Job Summary</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Vehicles:</span>
                            <span className="font-medium">{selectedVehicles.length} selected</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Service:</span>
                            <span className="font-medium">
                              {serviceType === "washing" ? "Truck Washing" :
                               serviceType === "pm-a" ? "A-Service PM" :
                               serviceType === "pm-b" ? "B-Service PM" :
                               serviceType === "dot-inspection" ? "DOT Inspection" :
                               "Tire Rotation"}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Schedule:</span>
                            <span className="font-medium">
                              {schedulingType === "same-day" ? "Same Day" : "Staggered"}
                            </span>
                          </div>
                          <Separator />
                          <div className="flex justify-between items-center">
                            <span className="font-medium">Total Cost:</span>
                            <div className="text-right">
                              <p className="text-2xl font-bold text-primary">{bulkPricing}</p>
                              <p className="text-xs text-muted-foreground">Billed to fleet account</p>
                            </div>
                          </div>
                          <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                            <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                              <DollarSign className="h-4 w-4" />
                              <span className="text-sm font-medium">
                                You're saving {selectedVehicles.length >= 10 ? "20%" : selectedVehicles.length >= 5 ? "15%" : "10%"} with bulk pricing!
                              </span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Navigation */}
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

                  {step < 2 ? (
                    <Button type="button" onClick={nextStep} data-testid="button-next">
                      Next
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  ) : (
                    <Button type="submit" data-testid="button-create-batch">
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Create Batch Job
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