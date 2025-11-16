import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Wrench, Truck, Fuel, Shield, MapPin, Upload, CheckCircle } from "lucide-react";

// Login form schema
const loginSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters")
});

// Registration form schema
const registerSchema = z.object({
  firstName: z.string().min(2, "First name is required"),
  lastName: z.string().min(2, "Last name is required"),
  email: z.string().email("Please enter a valid email"),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, "Please enter a valid phone number"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
  companyName: z.string().min(2, "Company name is required"),
  serviceRadius: z.number().min(10).max(200),
  services: z.array(z.string()).min(1, "Please select at least one service"),
  certifications: z.string(),
  insuranceInfo: z.string().min(10, "Please provide insurance information"),
  hasMobileWaterSource: z.boolean(),
  hasWastewaterRecovery: z.boolean()
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
});

// Available services
const availableServices = [
  { id: "tire_repair", label: "Tire Repair", icon: Truck },
  { id: "mechanical", label: "Mechanical Repair", icon: Wrench },
  { id: "fuel_delivery", label: "Fuel Delivery", icon: Fuel },
  { id: "jump_start", label: "Jump Start", icon: Shield },
  { id: "lockout", label: "Lockout Service", icon: Shield },
  { id: "towing", label: "Towing", icon: Truck },
  { id: "pm_service", label: "Preventive Maintenance", icon: Wrench },
  { id: "truck_wash", label: "Truck Wash", icon: Truck }
];

export default function ContractorAuth() {
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("login");
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Login form
  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: ""
    }
  });

  // Registration form
  const registerForm = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
      companyName: "",
      serviceRadius: 50,
      services: [],
      certifications: "",
      insuranceInfo: "",
      hasMobileWaterSource: false,
      hasWastewaterRecovery: false
    }
  });

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (data: z.infer<typeof loginSchema>) => {
      return await apiRequest("POST", "/api/auth/login", data);
    },
    onSuccess: () => {
      toast({
        title: "Login Successful",
        description: "Welcome back! Redirecting to dashboard..."
      });
      navigate("/contractor/dashboard");
    },
    onError: (error: any) => {
      toast({
        title: "Login Failed",
        description: error.message || "Invalid email or password",
        variant: "destructive"
      });
    }
  });

  // Registration mutation
  const registerMutation = useMutation({
    mutationFn: async (data: z.infer<typeof registerSchema>) => {
      const { confirmPassword, ...registrationData } = data;
      return await apiRequest("POST", "/api/contractor/register", {
        ...registrationData,
        role: "contractor"
      });
    },
    onSuccess: () => {
      setIsSubmitted(true);
      toast({
        title: "Registration Submitted",
        description: "Your application has been submitted for review. We'll contact you within 24 hours."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Registration Failed",
        description: error.message || "Failed to submit registration",
        variant: "destructive"
      });
    }
  });

  const onLogin = (data: z.infer<typeof loginSchema>) => {
    loginMutation.mutate(data);
  };

  const onRegister = (data: z.infer<typeof registerSchema>) => {
    registerMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="mb-6"
          data-testid="button-back"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Button>

        {isSubmitted ? (
          <Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/20">
            <CardContent className="pt-8 pb-8">
              <div className="text-center space-y-4">
                <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
                </div>
                <h2 className="text-2xl font-bold text-green-900 dark:text-green-100">
                  Application Submitted!
                </h2>
                <p className="text-green-700 dark:text-green-300 max-w-md mx-auto">
                  Thank you for applying to become a TruckFixGo contractor. Our team will review your application and contact you within 24 hours.
                </p>
                <div className="pt-4">
                  <Button 
                    variant="outline" 
                    onClick={() => setIsSubmitted(false)}
                    data-testid="button-new-application"
                  >
                    Submit Another Application
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-3xl">Contractor Portal</CardTitle>
              <CardDescription>
                Login to your account or apply to become a TruckFixGo contractor
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="login" data-testid="tab-login">Login</TabsTrigger>
                  <TabsTrigger value="register" data-testid="tab-register">Apply Now</TabsTrigger>
                </TabsList>

                <TabsContent value="login" className="space-y-4">
                  <Form {...loginForm}>
                    <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                      <FormField
                        control={loginForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="" 
                                type="email" 
                                {...field} 
                                data-testid="input-login-email"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={loginForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="••••••••" 
                                type="password" 
                                {...field}
                                data-testid="input-login-password"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button 
                        type="submit" 
                        className="w-full" 
                        disabled={loginMutation.isPending}
                        data-testid="button-login-submit"
                      >
                        {loginMutation.isPending ? "Logging in..." : "Login"}
                      </Button>
                    </form>
                  </Form>
                </TabsContent>

                <TabsContent value="register" className="space-y-4">
                  <Form {...registerForm}>
                    <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-6">
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold">Personal Information</h3>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={registerForm.control}
                            name="firstName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>First Name</FormLabel>
                                <FormControl>
                                  <Input {...field} data-testid="input-first-name" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={registerForm.control}
                            name="lastName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Last Name</FormLabel>
                                <FormControl>
                                  <Input {...field} data-testid="input-last-name" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <FormField
                          control={registerForm.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email</FormLabel>
                              <FormControl>
                                <Input type="email" {...field} data-testid="input-register-email" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={registerForm.control}
                          name="phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Phone Number</FormLabel>
                              <FormControl>
                                <Input type="tel" placeholder="+1234567890" {...field} data-testid="input-phone" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={registerForm.control}
                          name="companyName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Company Name</FormLabel>
                              <FormControl>
                                <Input {...field} data-testid="input-company-name" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <Separator />

                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold">Service Information</h3>
                        
                        <FormField
                          control={registerForm.control}
                          name="serviceRadius"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Service Radius</FormLabel>
                              <FormControl>
                                <div className="space-y-2">
                                  <Slider
                                    value={[field.value]}
                                    onValueChange={(v) => field.onChange(v[0])}
                                    min={10}
                                    max={200}
                                    step={10}
                                    className="w-full"
                                    data-testid="slider-service-radius"
                                  />
                                  <div className="flex justify-between text-xs text-muted-foreground">
                                    <span>10 miles</span>
                                    <span className="font-medium text-foreground">{field.value} miles</span>
                                    <span>200 miles</span>
                                  </div>
                                </div>
                              </FormControl>
                              <FormDescription>
                                How far are you willing to travel from your base location?
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={registerForm.control}
                          name="services"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Services Offered</FormLabel>
                              <FormDescription>
                                Select all services you're qualified to provide
                              </FormDescription>
                              <div className="grid grid-cols-2 gap-3 pt-2">
                                {availableServices.map((service) => (
                                  <div key={service.id} className="flex items-center space-x-2">
                                    <Checkbox
                                      checked={field.value.includes(service.id)}
                                      onCheckedChange={(checked) => {
                                        if (checked) {
                                          field.onChange([...field.value, service.id]);
                                        } else {
                                          field.onChange(field.value.filter(v => v !== service.id));
                                        }
                                      }}
                                      data-testid={`checkbox-service-${service.id}`}
                                    />
                                    <label className="text-sm flex items-center cursor-pointer">
                                      <service.icon className="w-4 h-4 mr-1" />
                                      {service.label}
                                    </label>
                                  </div>
                                ))}
                              </div>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={registerForm.control}
                            name="hasMobileWaterSource"
                            render={({ field }) => (
                              <FormItem className="flex items-center space-x-2">
                                <FormControl>
                                  <Checkbox
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                    data-testid="checkbox-water-source"
                                  />
                                </FormControl>
                                <FormLabel className="!mt-0">Mobile Water Source</FormLabel>
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={registerForm.control}
                            name="hasWastewaterRecovery"
                            render={({ field }) => (
                              <FormItem className="flex items-center space-x-2">
                                <FormControl>
                                  <Checkbox
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                    data-testid="checkbox-wastewater"
                                  />
                                </FormControl>
                                <FormLabel className="!mt-0">Wastewater Recovery</FormLabel>
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>

                      <Separator />

                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold">Certifications & Insurance</h3>
                        
                        <FormField
                          control={registerForm.control}
                          name="certifications"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Certifications & Licenses</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="List your relevant certifications, licenses, and qualifications..."
                                  className="min-h-[80px]"
                                  {...field}
                                  data-testid="textarea-certifications"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={registerForm.control}
                          name="insuranceInfo"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Insurance Information</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Provide details about your liability insurance, coverage amounts, and carrier..."
                                  className="min-h-[80px]"
                                  {...field}
                                  data-testid="textarea-insurance"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <Separator />

                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold">Account Security</h3>
                        
                        <FormField
                          control={registerForm.control}
                          name="password"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Password</FormLabel>
                              <FormControl>
                                <Input type="password" {...field} data-testid="input-register-password" />
                              </FormControl>
                              <FormDescription>
                                Must be at least 8 characters
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={registerForm.control}
                          name="confirmPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Confirm Password</FormLabel>
                              <FormControl>
                                <Input type="password" {...field} data-testid="input-confirm-password" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="bg-muted p-4 rounded-lg">
                        <p className="text-sm text-muted-foreground">
                          By submitting this application, you agree to our contractor terms of service and 
                          consent to a background check as part of the approval process.
                        </p>
                      </div>

                      <Button 
                        type="submit" 
                        className="w-full" 
                        size="lg"
                        disabled={registerMutation.isPending}
                        data-testid="button-register-submit"
                      >
                        {registerMutation.isPending ? "Submitting Application..." : "Submit Application"}
                      </Button>
                    </form>
                  </Form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}