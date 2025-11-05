import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import {
  User,
  Phone,
  Mail,
  MapPin,
  Building2,
  CreditCard,
  Shield,
  FileText,
  Upload,
  CheckCircle,
  AlertCircle,
  Clock,
  Calendar,
  Bell,
  Smartphone,
  Volume2,
  Truck,
  Wrench,
  Fuel,
  Award,
  Camera,
  Save,
  RefreshCw,
  ChevronRight
} from "lucide-react";
import { format } from "date-fns";

// Profile form schema
const profileSchema = z.object({
  firstName: z.string().min(2, "First name is required"),
  lastName: z.string().min(2, "Last name is required"),
  email: z.string().email("Invalid email"),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, "Invalid phone number"),
  companyName: z.string().min(2, "Company name is required"),
  bio: z.string().optional(),
  address: z.string(),
  city: z.string(),
  state: z.string().length(2, "State must be 2 characters"),
  zip: z.string().regex(/^\d{5}(-\d{4})?$/, "Invalid ZIP code")
});

// Service area schema
const serviceAreaSchema = z.object({
  baseLocation: z.object({
    address: z.string(),
    lat: z.number(),
    lng: z.number()
  }),
  serviceRadius: z.number().min(10).max(200),
  services: z.array(z.string()).min(1, "Select at least one service"),
  hasMobileWaterSource: z.boolean(),
  hasWastewaterRecovery: z.boolean()
});

// Payment method schema
const paymentMethodSchema = z.object({
  methodType: z.enum(["bank_account", "debit_card"]),
  accountHolderName: z.string().min(2, "Account holder name is required"),
  routingNumber: z.string().regex(/^\d{9}$/, "Routing number must be 9 digits").optional(),
  accountNumber: z.string().min(4, "Account number is required"),
  confirmAccountNumber: z.string()
}).refine(data => data.accountNumber === data.confirmAccountNumber, {
  message: "Account numbers don't match",
  path: ["confirmAccountNumber"]
});

// Notification preferences schema
const notificationSchema = z.object({
  emailNotifications: z.boolean(),
  smsNotifications: z.boolean(),
  pushNotifications: z.boolean(),
  soundAlerts: z.boolean(),
  newJobAlerts: z.boolean(),
  scheduledJobReminders: z.boolean(),
  performanceUpdates: z.boolean(),
  payoutNotifications: z.boolean()
});

// Availability schema
const availabilitySchema = z.object({
  monday: z.object({ enabled: z.boolean(), start: z.string(), end: z.string() }),
  tuesday: z.object({ enabled: z.boolean(), start: z.string(), end: z.string() }),
  wednesday: z.object({ enabled: z.boolean(), start: z.string(), end: z.string() }),
  thursday: z.object({ enabled: z.boolean(), start: z.string(), end: z.string() }),
  friday: z.object({ enabled: z.boolean(), start: z.string(), end: z.string() }),
  saturday: z.object({ enabled: z.boolean(), start: z.string(), end: z.string() }),
  sunday: z.object({ enabled: z.boolean(), start: z.string(), end: z.string() }),
  emergencyAvailable: z.boolean()
});

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

interface ProfileData {
  contractor: any;
  documents: Array<{
    id: string;
    type: string;
    name: string;
    uploadedAt: string;
    verifiedAt?: string;
    expiresAt?: string;
    status: "pending" | "verified" | "expired";
  }>;
  paymentMethod: any;
  availability: any;
  notifications: any;
}

export default function ContractorProfile() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("personal");

  // Fetch profile data
  const { data: profileData, isLoading, refetch } = useQuery<ProfileData>({
    queryKey: ["/api/contractor/profile"]
  });

  // Profile form
  const profileForm = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: profileData?.contractor?.firstName || "",
      lastName: profileData?.contractor?.lastName || "",
      email: profileData?.contractor?.email || "",
      phone: profileData?.contractor?.phone || "",
      companyName: profileData?.contractor?.companyName || "",
      bio: profileData?.contractor?.bio || "",
      address: profileData?.contractor?.address || "",
      city: profileData?.contractor?.city || "",
      state: profileData?.contractor?.state || "",
      zip: profileData?.contractor?.zip || ""
    }
  });

  // Service area form
  const serviceAreaForm = useForm<z.infer<typeof serviceAreaSchema>>({
    resolver: zodResolver(serviceAreaSchema),
    defaultValues: {
      baseLocation: profileData?.contractor?.baseLocation || { address: "", lat: 0, lng: 0 },
      serviceRadius: profileData?.contractor?.serviceRadius || 50,
      services: profileData?.contractor?.services || [],
      hasMobileWaterSource: profileData?.contractor?.hasMobileWaterSource || false,
      hasWastewaterRecovery: profileData?.contractor?.hasWastewaterRecovery || false
    }
  });

  // Payment method form
  const paymentMethodForm = useForm<z.infer<typeof paymentMethodSchema>>({
    resolver: zodResolver(paymentMethodSchema),
    defaultValues: {
      methodType: "bank_account",
      accountHolderName: "",
      routingNumber: "",
      accountNumber: "",
      confirmAccountNumber: ""
    }
  });

  // Notification form
  const notificationForm = useForm<z.infer<typeof notificationSchema>>({
    resolver: zodResolver(notificationSchema),
    defaultValues: profileData?.notifications || {
      emailNotifications: true,
      smsNotifications: true,
      pushNotifications: true,
      soundAlerts: true,
      newJobAlerts: true,
      scheduledJobReminders: true,
      performanceUpdates: true,
      payoutNotifications: true
    }
  });

  // Availability form
  const availabilityForm = useForm<z.infer<typeof availabilitySchema>>({
    resolver: zodResolver(availabilitySchema),
    defaultValues: profileData?.availability || {
      monday: { enabled: true, start: "08:00", end: "18:00" },
      tuesday: { enabled: true, start: "08:00", end: "18:00" },
      wednesday: { enabled: true, start: "08:00", end: "18:00" },
      thursday: { enabled: true, start: "08:00", end: "18:00" },
      friday: { enabled: true, start: "08:00", end: "18:00" },
      saturday: { enabled: false, start: "08:00", end: "18:00" },
      sunday: { enabled: false, start: "08:00", end: "18:00" },
      emergencyAvailable: true
    }
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: z.infer<typeof profileSchema>) => {
      return await apiRequest("/api/contractor/profile", {
        method: "PATCH",
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully"
      });
      refetch();
    },
    onError: () => {
      toast({
        title: "Update Failed",
        description: "Failed to update profile",
        variant: "destructive"
      });
    }
  });

  // Update service area mutation
  const updateServiceAreaMutation = useMutation({
    mutationFn: async (data: z.infer<typeof serviceAreaSchema>) => {
      return await apiRequest("/api/contractor/service-area", {
        method: "PATCH",
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      toast({
        title: "Service Area Updated",
        description: "Your service area has been updated"
      });
      refetch();
    }
  });

  // Update payment method mutation
  const updatePaymentMethodMutation = useMutation({
    mutationFn: async (data: z.infer<typeof paymentMethodSchema>) => {
      const { confirmAccountNumber, ...paymentData } = data;
      return await apiRequest("/api/contractor/payment-method", {
        method: "POST",
        body: JSON.stringify(paymentData)
      });
    },
    onSuccess: () => {
      toast({
        title: "Payment Method Updated",
        description: "Your payment method has been updated"
      });
      paymentMethodForm.reset();
      refetch();
    }
  });

  // Update notifications mutation
  const updateNotificationsMutation = useMutation({
    mutationFn: async (data: z.infer<typeof notificationSchema>) => {
      return await apiRequest("/api/contractor/notifications", {
        method: "PATCH",
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      toast({
        title: "Notifications Updated",
        description: "Your notification preferences have been updated"
      });
      refetch();
    }
  });

  // Update availability mutation
  const updateAvailabilityMutation = useMutation({
    mutationFn: async (data: z.infer<typeof availabilitySchema>) => {
      return await apiRequest("/api/contractor/availability", {
        method: "PATCH",
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      toast({
        title: "Availability Updated",
        description: "Your availability schedule has been updated"
      });
      refetch();
    }
  });

  // Upload document mutation
  const uploadDocumentMutation = useMutation({
    mutationFn: async ({ file, type }: { file: File; type: string }) => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", type);
      
      return await apiRequest("/api/contractor/documents", {
        method: "POST",
        body: formData
      });
    },
    onSuccess: () => {
      toast({
        title: "Document Uploaded",
        description: "Your document has been uploaded successfully"
      });
      refetch();
    }
  });

  const handleDocumentUpload = (event: React.ChangeEvent<HTMLInputElement>, type: string) => {
    const file = event.target.files?.[0];
    if (file) {
      uploadDocumentMutation.mutate({ file, type });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-20 bg-muted rounded-lg"></div>
            <div className="h-96 bg-muted rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  const contractor = profileData?.contractor;
  const documents = profileData?.documents || [];
  const paymentMethod = profileData?.paymentMethod;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="w-20 h-20">
                <AvatarFallback className="text-lg">
                  {contractor?.firstName?.[0]}{contractor?.lastName?.[0]}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-2xl font-bold">Profile Management</h1>
                <p className="text-muted-foreground">{contractor?.companyName}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge className={`${
                    contractor?.performanceTier === 'gold' ? 'bg-yellow-500' :
                    contractor?.performanceTier === 'silver' ? 'bg-gray-400' :
                    'bg-orange-600'
                  } text-white`}>
                    <Award className="w-3 h-3 mr-1" />
                    {contractor?.performanceTier?.toUpperCase()} TIER
                  </Badge>
                  {contractor?.isVerified && (
                    <Badge variant="default">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Verified
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={() => navigate("/contractor/dashboard")}
              data-testid="button-back-dashboard"
            >
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="personal" data-testid="tab-personal">Personal</TabsTrigger>
            <TabsTrigger value="services" data-testid="tab-services">Services</TabsTrigger>
            <TabsTrigger value="documents" data-testid="tab-documents">Documents</TabsTrigger>
            <TabsTrigger value="payment" data-testid="tab-payment">Payment</TabsTrigger>
            <TabsTrigger value="settings" data-testid="tab-settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="personal" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>Update your personal and company details</CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...profileForm}>
                  <form onSubmit={profileForm.handleSubmit(data => updateProfileMutation.mutate(data))} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={profileForm.control}
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
                        control={profileForm.control}
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
                      control={profileForm.control}
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

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={profileForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input type="email" {...field} data-testid="input-email" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={profileForm.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone</FormLabel>
                            <FormControl>
                              <Input {...field} data-testid="input-phone" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={profileForm.control}
                      name="bio"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Bio</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Tell customers about your experience and expertise..."
                              className="min-h-[100px]"
                              {...field}
                              data-testid="textarea-bio"
                            />
                          </FormControl>
                          <FormDescription>
                            This will be visible to customers
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Separator />

                    <FormField
                      control={profileForm.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Street Address</FormLabel>
                          <FormControl>
                            <Input {...field} data-testid="input-address" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-3 gap-4">
                      <FormField
                        control={profileForm.control}
                        name="city"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>City</FormLabel>
                            <FormControl>
                              <Input {...field} data-testid="input-city" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={profileForm.control}
                        name="state"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>State</FormLabel>
                            <FormControl>
                              <Input {...field} maxLength={2} data-testid="input-state" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={profileForm.control}
                        name="zip"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>ZIP Code</FormLabel>
                            <FormControl>
                              <Input {...field} data-testid="input-zip" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="flex justify-end">
                      <Button type="submit" disabled={updateProfileMutation.isPending} data-testid="button-save-profile">
                        <Save className="w-4 h-4 mr-2" />
                        {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="services" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Service Area & Offerings</CardTitle>
                <CardDescription>Manage your service area and the services you provide</CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...serviceAreaForm}>
                  <form onSubmit={serviceAreaForm.handleSubmit(data => updateServiceAreaMutation.mutate(data))} className="space-y-6">
                    <FormField
                      control={serviceAreaForm.control}
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
                            How far you're willing to travel from your base location
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={serviceAreaForm.control}
                      name="services"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Services Offered</FormLabel>
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

                    <div className="space-y-3">
                      <FormField
                        control={serviceAreaForm.control}
                        name="hasMobileWaterSource"
                        render={({ field }) => (
                          <FormItem className="flex items-center justify-between rounded-lg border p-3">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Mobile Water Source</FormLabel>
                              <FormDescription>
                                Do you have a mobile water tank for truck washing?
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                data-testid="switch-water-source"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={serviceAreaForm.control}
                        name="hasWastewaterRecovery"
                        render={({ field }) => (
                          <FormItem className="flex items-center justify-between rounded-lg border p-3">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Wastewater Recovery</FormLabel>
                              <FormDescription>
                                Can you recover and properly dispose of wastewater?
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                data-testid="switch-wastewater"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="flex justify-end">
                      <Button type="submit" disabled={updateServiceAreaMutation.isPending} data-testid="button-save-services">
                        <Save className="w-4 h-4 mr-2" />
                        {updateServiceAreaMutation.isPending ? "Saving..." : "Save Changes"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Availability Schedule</CardTitle>
                <CardDescription>Set your regular working hours</CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...availabilityForm}>
                  <form onSubmit={availabilityForm.handleSubmit(data => updateAvailabilityMutation.mutate(data))} className="space-y-4">
                    {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => (
                      <div key={day} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <FormField
                            control={availabilityForm.control}
                            name={`${day}.enabled` as any}
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Checkbox
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                    data-testid={`checkbox-${day}`}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          <Label className="font-medium capitalize w-24">{day}</Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <FormField
                            control={availabilityForm.control}
                            name={`${day}.start` as any}
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input type="time" {...field} className="w-32" />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          <span>to</span>
                          <FormField
                            control={availabilityForm.control}
                            name={`${day}.end` as any}
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input type="time" {...field} className="w-32" />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    ))}

                    <FormField
                      control={availabilityForm.control}
                      name="emergencyAvailable"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between rounded-lg border p-3">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">24/7 Emergency Availability</FormLabel>
                            <FormDescription>
                              Available for emergency calls outside regular hours
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="switch-emergency"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-end">
                      <Button type="submit" disabled={updateAvailabilityMutation.isPending} data-testid="button-save-availability">
                        <Save className="w-4 h-4 mr-2" />
                        {updateAvailabilityMutation.isPending ? "Saving..." : "Save Schedule"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="documents" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Documents & Certifications</CardTitle>
                <CardDescription>Upload and manage your required documents</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {['insurance', 'license', 'certification', 'tax_id'].map((docType) => (
                    <div key={docType} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium capitalize">{docType.replace('_', ' ')}</h4>
                          {documents.find(d => d.type === docType) ? (
                            <div className="mt-2 space-y-1">
                              <p className="text-sm text-muted-foreground">
                                {documents.find(d => d.type === docType)?.name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Uploaded: {format(new Date(documents.find(d => d.type === docType)!.uploadedAt), 'PPP')}
                              </p>
                              {documents.find(d => d.type === docType)?.expiresAt && (
                                <p className="text-xs text-muted-foreground">
                                  Expires: {format(new Date(documents.find(d => d.type === docType)!.expiresAt!), 'PPP')}
                                </p>
                              )}
                              <Badge variant={
                                documents.find(d => d.type === docType)?.status === 'verified' ? 'default' :
                                documents.find(d => d.type === docType)?.status === 'expired' ? 'destructive' :
                                'secondary'
                              }>
                                {documents.find(d => d.type === docType)?.status}
                              </Badge>
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground mt-1">No document uploaded</p>
                          )}
                        </div>
                        <div>
                          <input
                            type="file"
                            id={`file-${docType}`}
                            className="hidden"
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={(e) => handleDocumentUpload(e, docType)}
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => document.getElementById(`file-${docType}`)?.click()}
                            disabled={uploadDocumentMutation.isPending}
                            data-testid={`button-upload-${docType}`}
                          >
                            <Upload className="w-4 h-4 mr-1" />
                            {documents.find(d => d.type === docType) ? 'Replace' : 'Upload'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payment" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Payment Methods</CardTitle>
                <CardDescription>Manage your payout methods</CardDescription>
              </CardHeader>
              <CardContent>
                {paymentMethod ? (
                  <div className="space-y-4">
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {paymentMethod.type === "bank_account" ? (
                            <Building2 className="w-5 h-5 text-muted-foreground" />
                          ) : (
                            <CreditCard className="w-5 h-5 text-muted-foreground" />
                          )}
                          <div>
                            <p className="font-medium">
                              {paymentMethod.bankName || "Debit Card"} ••••{paymentMethod.last4}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {paymentMethod.type === "bank_account" ? "Bank Account" : "Debit Card"}
                            </p>
                          </div>
                        </div>
                        {paymentMethod.isDefault && (
                          <Badge>Default</Badge>
                        )}
                      </div>
                    </div>
                    
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => setActiveTab("payment-add")}
                      data-testid="button-add-payment"
                    >
                      Add New Payment Method
                    </Button>
                  </div>
                ) : (
                  <Form {...paymentMethodForm}>
                    <form onSubmit={paymentMethodForm.handleSubmit(data => updatePaymentMethodMutation.mutate(data))} className="space-y-4">
                      <FormField
                        control={paymentMethodForm.control}
                        name="methodType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Payment Method Type</FormLabel>
                            <FormControl>
                              <RadioGroup value={field.value} onValueChange={field.onChange}>
                                <div className="flex items-center space-x-2 p-3 border rounded-lg">
                                  <RadioGroupItem value="bank_account" id="bank" />
                                  <Label htmlFor="bank" className="flex-1 cursor-pointer">
                                    <div>
                                      <p className="font-medium">Bank Account (ACH)</p>
                                      <p className="text-sm text-muted-foreground">No fees, 2-3 business days</p>
                                    </div>
                                  </Label>
                                </div>
                                <div className="flex items-center space-x-2 p-3 border rounded-lg">
                                  <RadioGroupItem value="debit_card" id="card" />
                                  <Label htmlFor="card" className="flex-1 cursor-pointer">
                                    <div>
                                      <p className="font-medium">Debit Card</p>
                                      <p className="text-sm text-muted-foreground">Instant payouts available (1.5% fee)</p>
                                    </div>
                                  </Label>
                                </div>
                              </RadioGroup>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={paymentMethodForm.control}
                        name="accountHolderName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Account Holder Name</FormLabel>
                            <FormControl>
                              <Input {...field} data-testid="input-holder-name" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {paymentMethodForm.watch("methodType") === "bank_account" && (
                        <FormField
                          control={paymentMethodForm.control}
                          name="routingNumber"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Routing Number</FormLabel>
                              <FormControl>
                                <Input {...field} maxLength={9} data-testid="input-routing" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}

                      <FormField
                        control={paymentMethodForm.control}
                        name="accountNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              {paymentMethodForm.watch("methodType") === "bank_account" ? "Account Number" : "Card Number"}
                            </FormLabel>
                            <FormControl>
                              <Input type="password" {...field} data-testid="input-account-number" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={paymentMethodForm.control}
                        name="confirmAccountNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              Confirm {paymentMethodForm.watch("methodType") === "bank_account" ? "Account Number" : "Card Number"}
                            </FormLabel>
                            <FormControl>
                              <Input type="password" {...field} data-testid="input-confirm-account" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="flex justify-end">
                        <Button type="submit" disabled={updatePaymentMethodMutation.isPending} data-testid="button-save-payment">
                          {updatePaymentMethodMutation.isPending ? "Adding..." : "Add Payment Method"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>Control how you receive updates and alerts</CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...notificationForm}>
                  <form onSubmit={notificationForm.handleSubmit(data => updateNotificationsMutation.mutate(data))} className="space-y-4">
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium">Notification Channels</h4>
                      
                      <FormField
                        control={notificationForm.control}
                        name="emailNotifications"
                        render={({ field }) => (
                          <FormItem className="flex items-center justify-between rounded-lg border p-3">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base flex items-center gap-2">
                                <Mail className="w-4 h-4" />
                                Email Notifications
                              </FormLabel>
                            </div>
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
                        control={notificationForm.control}
                        name="smsNotifications"
                        render={({ field }) => (
                          <FormItem className="flex items-center justify-between rounded-lg border p-3">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base flex items-center gap-2">
                                <Smartphone className="w-4 h-4" />
                                SMS Notifications
                              </FormLabel>
                            </div>
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
                        control={notificationForm.control}
                        name="pushNotifications"
                        render={({ field }) => (
                          <FormItem className="flex items-center justify-between rounded-lg border p-3">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base flex items-center gap-2">
                                <Bell className="w-4 h-4" />
                                Push Notifications
                              </FormLabel>
                            </div>
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

                      <FormField
                        control={notificationForm.control}
                        name="soundAlerts"
                        render={({ field }) => (
                          <FormItem className="flex items-center justify-between rounded-lg border p-3">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base flex items-center gap-2">
                                <Volume2 className="w-4 h-4" />
                                Sound Alerts
                              </FormLabel>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                data-testid="switch-sound"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>

                    <Separator />

                    <div className="space-y-3">
                      <h4 className="text-sm font-medium">Alert Types</h4>
                      
                      <FormField
                        control={notificationForm.control}
                        name="newJobAlerts"
                        render={({ field }) => (
                          <FormItem className="flex items-center justify-between rounded-lg border p-3">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">New Job Alerts</FormLabel>
                              <FormDescription>Get notified when new jobs are available</FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                data-testid="switch-job-alerts"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={notificationForm.control}
                        name="scheduledJobReminders"
                        render={({ field }) => (
                          <FormItem className="flex items-center justify-between rounded-lg border p-3">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Scheduled Job Reminders</FormLabel>
                              <FormDescription>Get reminders for upcoming scheduled jobs</FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                data-testid="switch-reminders"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={notificationForm.control}
                        name="performanceUpdates"
                        render={({ field }) => (
                          <FormItem className="flex items-center justify-between rounded-lg border p-3">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Performance Updates</FormLabel>
                              <FormDescription>Get updates about your performance metrics</FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                data-testid="switch-performance"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={notificationForm.control}
                        name="payoutNotifications"
                        render={({ field }) => (
                          <FormItem className="flex items-center justify-between rounded-lg border p-3">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Payout Notifications</FormLabel>
                              <FormDescription>Get notified when payouts are processed</FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                data-testid="switch-payout-notif"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="flex justify-end">
                      <Button type="submit" disabled={updateNotificationsMutation.isPending} data-testid="button-save-notifications">
                        <Save className="w-4 h-4 mr-2" />
                        {updateNotificationsMutation.isPending ? "Saving..." : "Save Preferences"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}