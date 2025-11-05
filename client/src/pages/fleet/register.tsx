import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, ArrowRight, Building, MapPin, CreditCard } from "lucide-react";

const fleetRegistrationSchema = z.object({
  // Company Information
  companyName: z.string().min(2, "Company name is required"),
  dotNumber: z.string().optional(),
  mcNumber: z.string().optional(),
  fleetSize: z.string().min(1, "Fleet size is required"),
  
  // Primary Contact
  primaryContactName: z.string().min(2, "Contact name is required"),
  primaryContactPhone: z.string().min(10, "Phone number is required"),
  primaryContactEmail: z.string().email("Invalid email address"),
  
  // Billing Information
  billingAddress: z.string().min(5, "Billing address is required"),
  city: z.string().min(2, "City is required"),
  state: z.string().length(2, "State must be 2 letters"),
  zip: z.string().min(5, "ZIP code is required"),
  billingEmail: z.string().email("Invalid billing email"),
  
  // Service Preferences
  preferredPaymentMethod: z.string().min(1, "Payment method is required"),
  pmSchedulePreference: z.string().min(1, "PM schedule preference is required"),
  preferredServiceLocation: z.string().min(1, "Service location preference is required"),
  serviceRadius: z.string().min(1, "Service radius is required"),
  
  // Terms Agreement
  agreeToTerms: z.boolean().refine((val) => val === true, {
    message: "You must agree to the terms and conditions"
  })
});

type FleetRegistrationForm = z.infer<typeof fleetRegistrationSchema>;

export default function FleetRegister() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [step, setStep] = useState(1);

  const form = useForm<FleetRegistrationForm>({
    resolver: zodResolver(fleetRegistrationSchema),
    defaultValues: {
      companyName: "",
      dotNumber: "",
      mcNumber: "",
      fleetSize: "",
      primaryContactName: "",
      primaryContactPhone: "",
      primaryContactEmail: "",
      billingAddress: "",
      city: "",
      state: "",
      zip: "",
      billingEmail: "",
      preferredPaymentMethod: "",
      pmSchedulePreference: "",
      preferredServiceLocation: "",
      serviceRadius: "",
      agreeToTerms: false
    }
  });

  const onSubmit = async (data: FleetRegistrationForm) => {
    try {
      // TODO: Submit to backend
      console.log("Fleet registration data:", data);
      
      toast({
        title: "Application Submitted",
        description: "Your fleet account application has been submitted for approval. We'll contact you within 24 hours."
      });
      
      // Redirect to dashboard or confirmation page
      setLocation("/fleet/dashboard");
    } catch (error) {
      toast({
        title: "Registration Failed",
        description: "An error occurred while submitting your application. Please try again.",
        variant: "destructive"
      });
    }
  };

  const nextStep = () => {
    const fieldsToValidate = step === 1 
      ? ["companyName", "fleetSize", "primaryContactName", "primaryContactPhone", "primaryContactEmail"]
      : step === 2
      ? ["billingAddress", "city", "state", "zip", "billingEmail"]
      : [];

    form.trigger(fieldsToValidate as any).then((isValid) => {
      if (isValid) {
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
                onClick={() => setLocation("/fleet")}
                data-testid="button-back-to-fleet"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <span className="ml-4 text-2xl font-bold text-primary">TruckFixGo Fleet</span>
            </div>
          </div>
        </div>
      </header>

      {/* Registration Form */}
      <div className="max-w-3xl mx-auto px-4 py-12">
        <Card>
          <CardHeader>
            <CardTitle>Create Fleet Account</CardTitle>
            <CardDescription>
              Step {step} of 3 - {step === 1 ? "Company Information" : step === 2 ? "Billing Details" : "Service Preferences"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Step 1: Company Information */}
                {step === 1 && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-4">
                      <Building className="w-5 h-5 text-primary" />
                      <h3 className="text-lg font-semibold">Company Information</h3>
                    </div>

                    <FormField
                      control={form.control}
                      name="companyName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Company Name *</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="ABC Trucking Inc." data-testid="input-company-name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="dotNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>DOT Number</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="1234567" data-testid="input-dot-number" />
                            </FormControl>
                            <FormDescription>Optional but recommended</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="mcNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>MC Number</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="MC-123456" data-testid="input-mc-number" />
                            </FormControl>
                            <FormDescription>Optional</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="fleetSize"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Fleet Size *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-fleet-size">
                                <SelectValue placeholder="Select fleet size" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="1-5">1-5 vehicles</SelectItem>
                              <SelectItem value="6-20">6-20 vehicles</SelectItem>
                              <SelectItem value="21-50">21-50 vehicles</SelectItem>
                              <SelectItem value="51-100">51-100 vehicles</SelectItem>
                              <SelectItem value="100+">100+ vehicles</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="border-t pt-4">
                      <h4 className="font-medium mb-4">Primary Contact</h4>
                      
                      <FormField
                        control={form.control}
                        name="primaryContactName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Full Name *</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="John Doe" data-testid="input-contact-name" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <FormField
                          control={form.control}
                          name="primaryContactPhone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Phone Number *</FormLabel>
                              <FormControl>
                                <Input {...field} type="tel" placeholder="(555) 123-4567" data-testid="input-contact-phone" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="primaryContactEmail"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email Address *</FormLabel>
                              <FormControl>
                                <Input {...field} type="email" placeholder="john@company.com" data-testid="input-contact-email" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 2: Billing Information */}
                {step === 2 && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-4">
                      <MapPin className="w-5 h-5 text-primary" />
                      <h3 className="text-lg font-semibold">Billing Information</h3>
                    </div>

                    <FormField
                      control={form.control}
                      name="billingAddress"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Billing Address *</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="123 Main St, Suite 100" data-testid="input-billing-address" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="city"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>City *</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Los Angeles" data-testid="input-city" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="state"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>State *</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="CA" maxLength={2} data-testid="input-state" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="zip"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>ZIP Code *</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="90001" data-testid="input-zip" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="billingEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Billing Email *</FormLabel>
                          <FormControl>
                            <Input {...field} type="email" placeholder="billing@company.com" data-testid="input-billing-email" />
                          </FormControl>
                          <FormDescription>Invoices will be sent to this email</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                {/* Step 3: Service Preferences */}
                {step === 3 && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-4">
                      <CreditCard className="w-5 h-5 text-primary" />
                      <h3 className="text-lg font-semibold">Service Preferences</h3>
                    </div>

                    <FormField
                      control={form.control}
                      name="preferredPaymentMethod"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Preferred Payment Method *</FormLabel>
                          <FormControl>
                            <RadioGroup
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                              className="grid grid-cols-1 gap-2"
                              data-testid="radio-payment-method"
                            >
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="net30" id="net30" />
                                <label htmlFor="net30" className="font-normal cursor-pointer">
                                  NET 30 Terms (Invoicing)
                                </label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="creditcard" id="creditcard" />
                                <label htmlFor="creditcard" className="font-normal cursor-pointer">
                                  Credit Card
                                </label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="efs" id="efs" />
                                <label htmlFor="efs" className="font-normal cursor-pointer">
                                  EFS Check
                                </label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="comdata" id="comdata" />
                                <label htmlFor="comdata" className="font-normal cursor-pointer">
                                  Comdata Check
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
                      name="pmSchedulePreference"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>PM Schedule Preference *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-pm-schedule">
                                <SelectValue placeholder="Select PM schedule" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="monthly">Monthly</SelectItem>
                              <SelectItem value="quarterly">Quarterly (Every 3 months)</SelectItem>
                              <SelectItem value="biannual">Bi-Annual (Every 6 months)</SelectItem>
                              <SelectItem value="annual">Annual</SelectItem>
                              <SelectItem value="custom">Custom Schedule</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="preferredServiceLocation"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Preferred Service Location *</FormLabel>
                          <FormControl>
                            <RadioGroup
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                              className="grid grid-cols-1 gap-2"
                              data-testid="radio-service-location"
                            >
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="onsite" id="onsite" />
                                <label htmlFor="onsite" className="font-normal cursor-pointer">
                                  On-site at our facility
                                </label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="service-center" id="service-center" />
                                <label htmlFor="service-center" className="font-normal cursor-pointer">
                                  Service center
                                </label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="both" id="both" />
                                <label htmlFor="both" className="font-normal cursor-pointer">
                                  Both (depending on service type)
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
                      name="serviceRadius"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Service Radius *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-service-radius">
                                <SelectValue placeholder="Select service radius" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="25">Within 25 miles</SelectItem>
                              <SelectItem value="50">Within 50 miles</SelectItem>
                              <SelectItem value="100">Within 100 miles</SelectItem>
                              <SelectItem value="unlimited">Nationwide</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            How far are you willing to travel for service?
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="agreeToTerms"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="checkbox-agree-terms"
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>
                              I agree to the terms and conditions *
                            </FormLabel>
                            <FormDescription>
                              By checking this box, you agree to our{" "}
                              <a href="#" className="text-primary underline">Terms of Service</a> and{" "}
                              <a href="#" className="text-primary underline">Privacy Policy</a>.
                            </FormDescription>
                            <FormMessage />
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                {/* Navigation Buttons */}
                <div className="flex justify-between pt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={step === 1 ? () => setLocation("/fleet") : prevStep}
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
                    <Button type="submit" data-testid="button-submit">
                      Submit Application
                      <ArrowRight className="w-4 h-4 ml-2" />
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