import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  User, Briefcase, MapPin, Truck, Shield, FileText, CheckCircle,
  ChevronRight, ChevronLeft, AlertCircle, Phone, Mail, Building,
  Award, Clock, DollarSign, Wrench, Navigation
} from "lucide-react";

// Form validation schemas for each step
const personalInfoSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email"),
  phone: z.string().regex(/^[0-9\-\(\)\+ ]+$/, "Please enter a valid phone number"),
  cdlNumber: z.string().min(7, "Please enter a valid CDL number"),
  cdlClass: z.enum(["A", "B", "C"]),
  yearsExperience: z.number().min(0).max(50)
});

const businessInfoSchema = z.object({
  businessName: z.string().optional(),
  businessType: z.enum(["individual", "llc", "corp", "partnership"]),
  taxId: z.string().optional(),
  hasInsurance: z.boolean(),
  insuranceProvider: z.string().optional(),
  insurancePolicyNumber: z.string().optional(),
  insuranceExpiry: z.string().optional()
});

const servicesSchema = z.object({
  serviceTypes: z.array(z.string()).min(1, "Select at least one service type"),
  specializations: z.array(z.string()).optional(),
  emergencyAvailable: z.boolean(),
  scheduledAvailable: z.boolean(),
  nightShiftAvailable: z.boolean(),
  weekendAvailable: z.boolean()
});

const equipmentSchema = z.object({
  hasServiceTruck: z.boolean(),
  truckMake: z.string().optional(),
  truckModel: z.string().optional(),
  truckYear: z.string().optional(),
  equipment: z.array(z.string()).optional(),
  tools: z.array(z.string()).optional()
});

const coverageSchema = z.object({
  serviceRadius: z.number().min(5).max(500),
  baseLocation: z.object({
    city: z.string(),
    state: z.string(),
    zip: z.string()
  }),
  additionalAreas: z.array(z.string()).optional()
});

const consentSchema = z.object({
  backgroundCheckConsent: z.boolean().refine(val => val === true, {
    message: "Background check consent is required"
  }),
  termsAccepted: z.boolean().refine(val => val === true, {
    message: "You must accept the terms and conditions"
  }),
  dataProcessingConsent: z.boolean().refine(val => val === true, {
    message: "Data processing consent is required"
  })
});

const steps = [
  { id: 1, title: "Personal Information", icon: User },
  { id: 2, title: "Business Details", icon: Briefcase },
  { id: 3, title: "Services Offered", icon: Wrench },
  { id: 4, title: "Equipment & Vehicles", icon: Truck },
  { id: 5, title: "Service Coverage", icon: MapPin },
  { id: 6, title: "Review & Consent", icon: Shield }
];

export default function ContractorSignup() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<any>({});
  const [location, navigate] = useLocation();
  const { toast } = useToast();

  // Forms for each step
  const personalForm = useForm({
    resolver: zodResolver(personalInfoSchema),
    defaultValues: formData
  });

  const businessForm = useForm({
    resolver: zodResolver(businessInfoSchema),
    defaultValues: formData
  });

  const servicesForm = useForm({
    resolver: zodResolver(servicesSchema),
    defaultValues: {
      serviceTypes: formData.serviceTypes || [],
      emergencyAvailable: formData.emergencyAvailable || false,
      scheduledAvailable: formData.scheduledAvailable || false,
      nightShiftAvailable: formData.nightShiftAvailable || false,
      weekendAvailable: formData.weekendAvailable || false
    }
  });

  const equipmentForm = useForm({
    resolver: zodResolver(equipmentSchema),
    defaultValues: formData
  });

  const coverageForm = useForm({
    resolver: zodResolver(coverageSchema),
    defaultValues: {
      serviceRadius: formData.serviceRadius || 50,
      baseLocation: formData.baseLocation || {}
    }
  });

  const consentForm = useForm({
    resolver: zodResolver(consentSchema),
    defaultValues: {
      backgroundCheckConsent: false,
      termsAccepted: false,
      dataProcessingConsent: false
    }
  });

  // Submit application mutation
  const submitMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest('POST', '/api/contractor/apply', data);
    },
    onSuccess: (response) => {
      toast({
        title: "Application Submitted!",
        description: "We'll review your application and get back to you within 48 hours."
      });
      navigate('/contractor/auth');
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Submission Failed",
        description: error.message || "Please try again later"
      });
    }
  });

  const handleNextStep = async () => {
    let isValid = false;
    let data = {};

    switch (currentStep) {
      case 1:
        isValid = await personalForm.trigger();
        if (isValid) data = personalForm.getValues();
        break;
      case 2:
        isValid = await businessForm.trigger();
        if (isValid) data = businessForm.getValues();
        break;
      case 3:
        isValid = await servicesForm.trigger();
        if (isValid) data = servicesForm.getValues();
        break;
      case 4:
        isValid = await equipmentForm.trigger();
        if (isValid) data = equipmentForm.getValues();
        break;
      case 5:
        isValid = await coverageForm.trigger();
        if (isValid) data = coverageForm.getValues();
        break;
      case 6:
        isValid = await consentForm.trigger();
        if (isValid) data = consentForm.getValues();
        break;
    }

    if (isValid) {
      setFormData({ ...formData, ...data });
      if (currentStep === 6) {
        // Submit the application
        submitMutation.mutate({ ...formData, ...data });
      } else {
        setCurrentStep(currentStep + 1);
      }
    }
  };

  const handlePreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const progressPercentage = ((currentStep - 1) / (steps.length - 1)) * 100;

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle>Become a TruckFixGo Contractor</CardTitle>
            <CardDescription>
              Join our network of professional truck repair contractors
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Progress Bar */}
            <div className="mb-8">
              <div className="flex justify-between mb-4">
                {steps.map((step) => {
                  const Icon = step.icon;
                  return (
                    <div
                      key={step.id}
                      className={`flex flex-col items-center ${
                        step.id <= currentStep ? 'text-primary' : 'text-muted-foreground'
                      }`}
                    >
                      <div className={`rounded-full p-2 ${
                        step.id <= currentStep ? 'bg-primary text-primary-foreground' : 'bg-muted'
                      }`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="text-xs mt-1 hidden sm:block">{step.title}</span>
                    </div>
                  );
                })}
              </div>
              <Progress value={progressPercentage} className="h-2" />
            </div>

            {/* Step 1: Personal Information */}
            {currentStep === 1 && (
              <Form {...personalForm}>
                <form className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={personalForm.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name</FormLabel>
                          <FormControl>
                            <Input placeholder="John" {...field} data-testid="input-first-name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={personalForm.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Last Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Doe" {...field} data-testid="input-last-name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={personalForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="john@example.com" {...field} data-testid="input-email" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={personalForm.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <Input type="tel" placeholder="(555) 123-4567" {...field} data-testid="input-phone" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={personalForm.control}
                      name="cdlNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>CDL Number</FormLabel>
                          <FormControl>
                            <Input placeholder="CDL123456789" {...field} data-testid="input-cdl" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={personalForm.control}
                      name="cdlClass"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>CDL Class</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-cdl-class">
                                <SelectValue placeholder="Select CDL class" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="A">Class A</SelectItem>
                              <SelectItem value="B">Class B</SelectItem>
                              <SelectItem value="C">Class C</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={personalForm.control}
                    name="yearsExperience"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Years of Experience</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="5" 
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                            data-testid="input-experience" 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </form>
              </Form>
            )}

            {/* Step 2: Business Details */}
            {currentStep === 2 && (
              <Form {...businessForm}>
                <form className="space-y-6">
                  <FormField
                    control={businessForm.control}
                    name="businessType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Business Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-business-type">
                              <SelectValue placeholder="Select business type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="individual">Individual/Sole Proprietor</SelectItem>
                            <SelectItem value="llc">LLC</SelectItem>
                            <SelectItem value="corp">Corporation</SelectItem>
                            <SelectItem value="partnership">Partnership</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={businessForm.control}
                    name="businessName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Business Name (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="ABC Truck Repair LLC" {...field} data-testid="input-business-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={businessForm.control}
                    name="taxId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tax ID/EIN (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="12-3456789" {...field} data-testid="input-tax-id" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Separator />

                  <FormField
                    control={businessForm.control}
                    name="hasInsurance"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="checkbox-has-insurance"
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>
                            I have commercial liability insurance
                          </FormLabel>
                          <FormDescription>
                            Required for approval
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />

                  {businessForm.watch("hasInsurance") && (
                    <>
                      <FormField
                        control={businessForm.control}
                        name="insuranceProvider"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Insurance Provider</FormLabel>
                            <FormControl>
                              <Input placeholder="State Farm" {...field} data-testid="input-insurance-provider" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={businessForm.control}
                        name="insurancePolicyNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Policy Number</FormLabel>
                            <FormControl>
                              <Input placeholder="POL123456" {...field} data-testid="input-policy-number" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={businessForm.control}
                        name="insuranceExpiry"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Policy Expiry Date</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} data-testid="input-insurance-expiry" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </>
                  )}
                </form>
              </Form>
            )}

            {/* Step 3: Services Offered */}
            {currentStep === 3 && (
              <Form {...servicesForm}>
                <form className="space-y-6">
                  <FormField
                    control={servicesForm.control}
                    name="serviceTypes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Services You Can Provide</FormLabel>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {[
                            "Emergency Roadside Repair",
                            "Preventive Maintenance",
                            "Tire Service",
                            "Engine Repair",
                            "Transmission Service",
                            "Brake Service",
                            "Electrical Repair",
                            "HVAC Service",
                            "Oil Changes",
                            "Battery Service",
                            "Truck Wash",
                            "Mobile Welding"
                          ].map((service) => (
                            <div key={service} className="flex items-center space-x-2">
                              <Checkbox
                                checked={field.value?.includes(service)}
                                onCheckedChange={(checked) => {
                                  const current = field.value || [];
                                  field.onChange(
                                    checked
                                      ? [...current, service]
                                      : current.filter((s) => s !== service)
                                  );
                                }}
                                data-testid={`checkbox-service-${service.toLowerCase().replace(/\s+/g, '-')}`}
                              />
                              <label className="text-sm">{service}</label>
                            </div>
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Separator />

                  <div className="space-y-4">
                    <h3 className="font-medium">Availability</h3>
                    
                    <FormField
                      control={servicesForm.control}
                      name="emergencyAvailable"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="checkbox-emergency"
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Available for Emergency Calls</FormLabel>
                            <FormDescription>24/7 emergency roadside assistance</FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={servicesForm.control}
                      name="scheduledAvailable"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="checkbox-scheduled"
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Available for Scheduled Services</FormLabel>
                            <FormDescription>Pre-scheduled maintenance and repairs</FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={servicesForm.control}
                      name="nightShiftAvailable"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="checkbox-night"
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Night Shift Available</FormLabel>
                            <FormDescription>Available for night time calls (10 PM - 6 AM)</FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={servicesForm.control}
                      name="weekendAvailable"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="checkbox-weekend"
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Weekend Available</FormLabel>
                            <FormDescription>Available on Saturdays and Sundays</FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>
                </form>
              </Form>
            )}

            {/* Step 4: Equipment & Vehicles */}
            {currentStep === 4 && (
              <Form {...equipmentForm}>
                <form className="space-y-6">
                  <FormField
                    control={equipmentForm.control}
                    name="hasServiceTruck"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="checkbox-has-truck"
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>I have a service truck/vehicle</FormLabel>
                          <FormDescription>
                            Required for mobile repair services
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />

                  {equipmentForm.watch("hasServiceTruck") && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <FormField
                        control={equipmentForm.control}
                        name="truckMake"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Vehicle Make</FormLabel>
                            <FormControl>
                              <Input placeholder="Ford" {...field} data-testid="input-truck-make" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={equipmentForm.control}
                        name="truckModel"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Vehicle Model</FormLabel>
                            <FormControl>
                              <Input placeholder="F-550" {...field} data-testid="input-truck-model" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={equipmentForm.control}
                        name="truckYear"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Year</FormLabel>
                            <FormControl>
                              <Input placeholder="2020" {...field} data-testid="input-truck-year" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}

                  <FormField
                    control={equipmentForm.control}
                    name="equipment"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Equipment Available</FormLabel>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {[
                            "Air Compressor",
                            "Diagnostic Scanner",
                            "Welding Equipment",
                            "Tire Service Equipment",
                            "Jack Stands",
                            "Generator",
                            "Jump Starter",
                            "Oil Change Equipment",
                            "Pressure Washer"
                          ].map((item) => (
                            <div key={item} className="flex items-center space-x-2">
                              <Checkbox
                                checked={field.value?.includes(item)}
                                onCheckedChange={(checked) => {
                                  const current = field.value || [];
                                  field.onChange(
                                    checked
                                      ? [...current, item]
                                      : current.filter((e) => e !== item)
                                  );
                                }}
                                data-testid={`checkbox-equipment-${item.toLowerCase().replace(/\s+/g, '-')}`}
                              />
                              <label className="text-sm">{item}</label>
                            </div>
                          ))}
                        </div>
                      </FormItem>
                    )}
                  />
                </form>
              </Form>
            )}

            {/* Step 5: Service Coverage */}
            {currentStep === 5 && (
              <Form {...coverageForm}>
                <form className="space-y-6">
                  <FormField
                    control={coverageForm.control}
                    name="serviceRadius"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Service Radius (miles)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="50" 
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                            data-testid="input-service-radius" 
                          />
                        </FormControl>
                        <FormDescription>
                          Maximum distance you're willing to travel for service calls
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="space-y-4">
                    <h3 className="font-medium">Base Location</h3>
                    
                    <FormField
                      control={coverageForm.control}
                      name="baseLocation.city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>City</FormLabel>
                          <FormControl>
                            <Input placeholder="Dallas" {...field} data-testid="input-base-city" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={coverageForm.control}
                        name="baseLocation.state"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>State</FormLabel>
                            <FormControl>
                              <Input placeholder="TX" {...field} data-testid="input-base-state" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={coverageForm.control}
                        name="baseLocation.zip"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>ZIP Code</FormLabel>
                            <FormControl>
                              <Input type="text" inputMode="numeric" pattern="[0-9]*" placeholder="75001" {...field} data-testid="input-base-zip" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <FormField
                    control={coverageForm.control}
                    name="additionalAreas"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Additional Service Areas (Optional)</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="List any additional cities or regions you service, separated by commas"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value.split(',').map(s => s.trim()))}
                            data-testid="textarea-additional-areas"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </form>
              </Form>
            )}

            {/* Step 6: Review & Consent */}
            {currentStep === 6 && (
              <div className="space-y-6">
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Application Review</AlertTitle>
                  <AlertDescription>
                    Please review your information and provide consent before submitting
                  </AlertDescription>
                </Alert>

                <div className="space-y-4">
                  <div className="border rounded-lg p-4">
                    <h3 className="font-medium mb-2">Application Summary</h3>
                    <div className="text-sm space-y-1 text-muted-foreground">
                      <p>Name: {formData.firstName} {formData.lastName}</p>
                      <p>Email: {formData.email}</p>
                      <p>Phone: {formData.phone}</p>
                      <p>CDL Class: {formData.cdlClass}</p>
                      <p>Experience: {formData.yearsExperience} years</p>
                      <p>Service Radius: {formData.serviceRadius} miles</p>
                    </div>
                  </div>

                  <Form {...consentForm}>
                    <form className="space-y-4">
                      <FormField
                        control={consentForm.control}
                        name="backgroundCheckConsent"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                data-testid="checkbox-background-consent"
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>
                                I consent to background and driving record checks
                              </FormLabel>
                              <FormDescription>
                                We will verify your criminal history, driving record, and business credentials
                              </FormDescription>
                            </div>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={consentForm.control}
                        name="termsAccepted"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                data-testid="checkbox-terms"
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>
                                I accept the Terms and Conditions
                              </FormLabel>
                              <FormDescription>
                                Including contractor agreement and payment terms
                              </FormDescription>
                            </div>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={consentForm.control}
                        name="dataProcessingConsent"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                data-testid="checkbox-data-consent"
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>
                                I consent to data processing
                              </FormLabel>
                              <FormDescription>
                                Your information will be used for application review and service matching
                              </FormDescription>
                            </div>
                          </FormItem>
                        )}
                      />
                    </form>
                  </Form>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8">
              <Button
                variant="outline"
                onClick={handlePreviousStep}
                disabled={currentStep === 1}
                data-testid="button-previous"
              >
                <ChevronLeft className="mr-2 h-4 w-4" />
                Previous
              </Button>
              
              <Button
                onClick={handleNextStep}
                disabled={submitMutation.isPending}
                data-testid="button-next"
              >
                {submitMutation.isPending ? (
                  <>
                    Submitting...
                  </>
                ) : currentStep === 6 ? (
                  <>
                    Submit Application
                    <CheckCircle className="ml-2 h-4 w-4" />
                  </>
                ) : (
                  <>
                    Next
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}