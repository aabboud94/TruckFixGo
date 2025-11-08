import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import {
  ChevronLeft, ChevronRight, User, Building, Briefcase,
  Wrench, Upload, FileCheck, AlertCircle, CheckCircle,
  Home, Phone, Mail, MapPin, Shield, Calendar, Plus, X,
  FileText, Camera, Award, Car
} from "lucide-react";
import type { ServiceType } from "@shared/schema";

// US States for dropdown
const US_STATES = [
  { code: "AL", name: "Alabama" }, { code: "AK", name: "Alaska" }, { code: "AZ", name: "Arizona" },
  { code: "AR", name: "Arkansas" }, { code: "CA", name: "California" }, { code: "CO", name: "Colorado" },
  { code: "CT", name: "Connecticut" }, { code: "DE", name: "Delaware" }, { code: "FL", name: "Florida" },
  { code: "GA", name: "Georgia" }, { code: "HI", name: "Hawaii" }, { code: "ID", name: "Idaho" },
  { code: "IL", name: "Illinois" }, { code: "IN", name: "Indiana" }, { code: "IA", name: "Iowa" },
  { code: "KS", name: "Kansas" }, { code: "KY", name: "Kentucky" }, { code: "LA", name: "Louisiana" },
  { code: "ME", name: "Maine" }, { code: "MD", name: "Maryland" }, { code: "MA", name: "Massachusetts" },
  { code: "MI", name: "Michigan" }, { code: "MN", name: "Minnesota" }, { code: "MS", name: "Mississippi" },
  { code: "MO", name: "Missouri" }, { code: "MT", name: "Montana" }, { code: "NE", name: "Nebraska" },
  { code: "NV", name: "Nevada" }, { code: "NH", name: "New Hampshire" }, { code: "NJ", name: "New Jersey" },
  { code: "NM", name: "New Mexico" }, { code: "NY", name: "New York" }, { code: "NC", name: "North Carolina" },
  { code: "ND", name: "North Dakota" }, { code: "OH", name: "Ohio" }, { code: "OK", name: "Oklahoma" },
  { code: "OR", name: "Oregon" }, { code: "PA", name: "Pennsylvania" }, { code: "RI", name: "Rhode Island" },
  { code: "SC", name: "South Carolina" }, { code: "SD", name: "South Dakota" }, { code: "TN", name: "Tennessee" },
  { code: "TX", name: "Texas" }, { code: "UT", name: "Utah" }, { code: "VT", name: "Vermont" },
  { code: "VA", name: "Virginia" }, { code: "WA", name: "Washington" }, { code: "WV", name: "West Virginia" },
  { code: "WI", name: "Wisconsin" }, { code: "WY", name: "Wyoming" }
];

// Form steps configuration
const FORM_STEPS = [
  { id: 1, title: "Personal Information", icon: User, description: "Your contact details" },
  { id: 2, title: "Business Details", icon: Building, description: "Company information" },
  { id: 3, title: "Experience", icon: Briefcase, description: "Qualifications and skills" },
  { id: 4, title: "Service Capabilities", icon: Wrench, description: "Services you can provide" },
  { id: 5, title: "Document Upload", icon: Upload, description: "Required documents" },
  { id: 6, title: "Terms & Submit", icon: FileCheck, description: "Review and accept" }
];

// Document types configuration
const REQUIRED_DOCUMENTS = [
  { type: "cdl", label: "Commercial Driver's License (CDL)", accept: ".pdf,.jpg,.png", required: true },
  { type: "insurance", label: "Business Insurance Certificate", accept: ".pdf", required: true },
  { type: "w9", label: "W-9 Tax Form", accept: ".pdf", required: true },
  { type: "vehicle_registration", label: "Vehicle Registration", accept: ".pdf,.jpg,.png", required: true },
  { type: "dot_medical", label: "DOT Medical Certificate", accept: ".pdf,.jpg,.png", required: true },
  { type: "ase_certification", label: "ASE Mechanic Certifications", accept: ".pdf,.jpg,.png", required: true }
];

const OPTIONAL_DOCUMENTS = [
  { type: "other_certification", label: "Additional Certifications", accept: ".pdf,.jpg,.png" },
  { type: "reference_letter", label: "Reference Letters", accept: ".pdf" },
  { type: "portfolio_photo", label: "Portfolio Photos", accept: ".jpg,.png" }
];

// Validation schemas for each step
const personalInfoSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(50),
  lastName: z.string().min(1, "Last name is required").max(50),
  email: z.string().email("Invalid email address"),
  phone: z.string().regex(/^\d{10}$/, "Phone number must be 10 digits"),
  address: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().length(2, "Select a state"),
  zip: z.string().regex(/^\d{5}$/, "ZIP code must be 5 digits")
});

const businessDetailsSchema = z.object({
  companyName: z.string().optional(),
  businessType: z.enum(["sole_proprietor", "llc", "corporation"]).optional(),
  dotNumber: z.string().regex(/^\d{7,8}$/, "DOT number must be 7-8 digits").optional().or(z.literal("")),
  mcNumber: z.string().regex(/^\d{6,7}$/, "MC number must be 6-7 digits").optional().or(z.literal("")),
  yearsInBusiness: z.number().min(0).max(100).optional(),
  insuranceProvider: z.string().optional(),
  insurancePolicyNumber: z.string().optional(),
  insuranceExpiryDate: z.string().optional()
});

const experienceSchema = z.object({
  experienceLevel: z.enum(["entry", "intermediate", "expert"]),
  totalYearsExperience: z.number().min(0).max(50),
  certifications: z.array(z.string()).optional(),
  specializations: z.array(z.string()).optional(),
  previousEmployers: z.array(z.object({
    name: z.string(),
    position: z.string(),
    years: z.number()
  })).optional()
});

const serviceCapabilitiesSchema = z.object({
  serviceTypes: z.array(z.string()).min(1, "Select at least one service"),
  serviceRadius: z.number().min(10).max(500),
  coverageAreas: z.array(z.string()).optional(),
  hasOwnTools: z.boolean(),
  hasOwnVehicle: z.boolean(),
  vehicleInfo: z.object({
    make: z.string(),
    model: z.string(),
    year: z.number(),
    type: z.string()
  }).optional()
});

const documentsSchema = z.object({
  documents: z.array(z.object({
    type: z.string(),
    file: z.instanceof(File),
    expirationDate: z.string().optional()
  })).min(6, "All required documents must be uploaded")
});

const termsSchema = z.object({
  backgroundCheckConsent: z.boolean().refine(val => val === true, "Background check consent is required"),
  termsAccepted: z.boolean().refine(val => val === true, "You must accept the terms and conditions"),
  references: z.array(z.object({
    name: z.string(),
    company: z.string(),
    phone: z.string(),
    email: z.string().email()
  })).min(2, "Please provide at least 2 references")
});

export default function ContractorApply() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<any>({
    // Initialize default values to prevent validation errors
    serviceTypes: [],
    serviceRadius: 50,
    hasOwnTools: false,
    hasOwnVehicle: false,
    references: [{}, {}],
    backgroundCheckConsent: false,
    termsAccepted: false
  });
  const [uploadedDocuments, setUploadedDocuments] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [applicationId, setApplicationId] = useState<string | null>(null);
  const { toast } = useToast();
  const [_, navigate] = useLocation();

  // Query for service types
  const { data: serviceTypes = [] } = useQuery<ServiceType[]>({
    queryKey: ['/api/service-types']
  });

  // Mutation for saving draft
  const saveDraftMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest('/api/contractor/apply/draft', {
        method: 'POST',
        body: JSON.stringify({ ...data, applicationId })
      });
    },
    onSuccess: (response) => {
      if (!applicationId) {
        setApplicationId(response.id);
      }
      toast({
        title: "Draft saved",
        description: "Your application progress has been saved."
      });
    }
  });

  // Mutation for submitting application
  const submitApplicationMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest('/api/contractor/apply', {
        method: 'POST',
        body: JSON.stringify({ ...data, applicationId })
      });
    },
    onSuccess: () => {
      toast({
        title: "Application submitted!",
        description: "We'll review your application and get back to you within 2-3 business days."
      });
      navigate("/contractor/auth");
    }
  });

  // Form for current step
  const getCurrentSchema = () => {
    switch (currentStep) {
      case 1: return personalInfoSchema;
      case 2: return businessDetailsSchema;
      case 3: return experienceSchema;
      case 4: return serviceCapabilitiesSchema;
      case 5: return documentsSchema;
      case 6: return termsSchema;
      default: return z.object({});
    }
  };

  const form = useForm({
    resolver: zodResolver(getCurrentSchema()),
    defaultValues: formData
  });

  // Auto-save draft every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (Object.keys(formData).length > 0) {
        saveDraftMutation.mutate(formData);
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [formData]);

  const handleNext = async () => {
    const isValid = await form.trigger();
    if (isValid) {
      const stepData = form.getValues();
      const newFormData = { ...formData, ...stepData };
      setFormData(newFormData);
      
      // Save draft on each step completion
      saveDraftMutation.mutate(newFormData);
      
      if (currentStep < 6) {
        setCurrentStep(currentStep + 1);
        form.reset(newFormData);
      } else {
        // Submit the application
        handleSubmit();
      }
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      form.reset(formData);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await submitApplicationMutation.mutateAsync({ ...formData, uploadedDocuments });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit application. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDocumentUpload = (type: string, file: File, expirationDate?: string) => {
    const newDoc = { type, file, expirationDate, uploadedAt: new Date() };
    const updatedDocs = [...uploadedDocuments, newDoc];
    setUploadedDocuments(updatedDocs);
    
    // Also set the form value so validation passes
    form.setValue('documents', updatedDocs);
    
    toast({
      title: "Document uploaded",
      description: `${file.name} has been uploaded successfully.`
    });
  };

  const removeDocument = (index: number) => {
    const updatedDocs = uploadedDocuments.filter((_, i) => i !== index);
    setUploadedDocuments(updatedDocs);
    
    // Also update the form value
    form.setValue('documents', updatedDocs);
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
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
                control={form.control}
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
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="john@example.com" {...field} data-testid="input-email" />
                  </FormControl>
                  <FormDescription>
                    We'll use this for important communications about your application
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <Input placeholder="5551234567" {...field} data-testid="input-phone" />
                  </FormControl>
                  <FormDescription>
                    Enter 10 digits without spaces or dashes
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Street Address</FormLabel>
                  <FormControl>
                    <Input placeholder="123 Main St" {...field} data-testid="input-address" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>City</FormLabel>
                    <FormControl>
                      <Input placeholder="Dallas" {...field} data-testid="input-city" />
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
                    <FormLabel>State</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-state">
                          <SelectValue placeholder="Select state" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {US_STATES.map(state => (
                          <SelectItem key={state.code} value={state.code}>
                            {state.name}
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
                name="zip"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ZIP Code</FormLabel>
                    <FormControl>
                      <Input placeholder="75201" {...field} data-testid="input-zip" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <FormField
              control={form.control}
              name="companyName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company Name (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="ABC Trucking LLC" {...field} data-testid="input-company-name" />
                  </FormControl>
                  <FormDescription>
                    Leave blank if operating as an individual
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
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
                      <SelectItem value="sole_proprietor">Sole Proprietor</SelectItem>
                      <SelectItem value="llc">LLC</SelectItem>
                      <SelectItem value="corporation">Corporation</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="dotNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>DOT Number (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="1234567" {...field} data-testid="input-dot-number" />
                    </FormControl>
                    <FormDescription>
                      7-8 digit Department of Transportation number
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="mcNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>MC Number (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="123456" {...field} data-testid="input-mc-number" />
                    </FormControl>
                    <FormDescription>
                      6-7 digit Motor Carrier number
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="yearsInBusiness"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Years in Business</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      placeholder="5" 
                      {...field} 
                      onChange={(e) => field.onChange(parseInt(e.target.value))}
                      data-testid="input-years-in-business"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="insuranceProvider"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Insurance Provider</FormLabel>
                  <FormControl>
                    <Input placeholder="Progressive Commercial" {...field} data-testid="input-insurance-provider" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="insurancePolicyNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Insurance Policy Number</FormLabel>
                    <FormControl>
                      <Input placeholder="POL-123456" {...field} data-testid="input-policy-number" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="insuranceExpiryDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Insurance Expiry Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} data-testid="input-insurance-expiry" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <FormField
              control={form.control}
              name="experienceLevel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Experience Level</FormLabel>
                  <RadioGroup onValueChange={field.onChange} defaultValue={field.value}>
                    <div className="space-y-3">
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="entry" data-testid="radio-experience-entry" />
                        </FormControl>
                        <FormLabel className="font-normal cursor-pointer">
                          Entry Level (0-2 years)
                        </FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="intermediate" data-testid="radio-experience-intermediate" />
                        </FormControl>
                        <FormLabel className="font-normal cursor-pointer">
                          Intermediate (3-7 years)
                        </FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="expert" data-testid="radio-experience-expert" />
                        </FormControl>
                        <FormLabel className="font-normal cursor-pointer">
                          Expert (8+ years)
                        </FormLabel>
                      </FormItem>
                    </div>
                  </RadioGroup>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="totalYearsExperience"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Total Years of Experience</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      placeholder="10" 
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value))}
                      data-testid="input-total-experience"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div>
              <FormLabel>Certifications</FormLabel>
              <div className="space-y-3 mt-2">
                {["ASE Certified", "DOT Medical Certified", "HAZMAT Certified", "EPA 609 Certified", 
                  "Welding Certified", "Diesel Engine Specialist"].map((cert) => (
                  <FormItem key={cert} className="flex items-center space-x-3">
                    <FormControl>
                      <Checkbox 
                        onCheckedChange={(checked) => {
                          const current = form.getValues("certifications") || [];
                          if (checked) {
                            form.setValue("certifications", [...current, cert]);
                          } else {
                            form.setValue("certifications", current.filter((c: string) => c !== cert));
                          }
                        }}
                        data-testid={`checkbox-cert-${cert.toLowerCase().replace(/\s+/g, '-')}`}
                      />
                    </FormControl>
                    <FormLabel className="font-normal cursor-pointer">
                      {cert}
                    </FormLabel>
                  </FormItem>
                ))}
              </div>
            </div>

            <div>
              <FormLabel>Specializations</FormLabel>
              <div className="space-y-3 mt-2">
                {["Engine Repair", "Transmission", "Brakes", "Electrical Systems", 
                  "HVAC", "Suspension", "Tires", "Preventive Maintenance"].map((spec) => (
                  <FormItem key={spec} className="flex items-center space-x-3">
                    <FormControl>
                      <Checkbox
                        onCheckedChange={(checked) => {
                          const current = form.getValues("specializations") || [];
                          if (checked) {
                            form.setValue("specializations", [...current, spec]);
                          } else {
                            form.setValue("specializations", current.filter((s: string) => s !== spec));
                          }
                        }}
                        data-testid={`checkbox-spec-${spec.toLowerCase().replace(/\s+/g, '-')}`}
                      />
                    </FormControl>
                    <FormLabel className="font-normal cursor-pointer">
                      {spec}
                    </FormLabel>
                  </FormItem>
                ))}
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <FormField
              control={form.control}
              name="serviceTypes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Service Types You Can Provide</FormLabel>
                  <FormDescription>Select at least one service type</FormDescription>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                    {serviceTypes.map((service: ServiceType) => (
                      <FormItem key={service.id} className="flex items-center space-x-3">
                        <FormControl>
                          <Checkbox
                            checked={(field.value || []).includes(service.id)}
                            onCheckedChange={(checked) => {
                              const updatedValue = checked
                                ? [...(field.value || []), service.id]
                                : (field.value || []).filter((s: string) => s !== service.id);
                              field.onChange(updatedValue);
                            }}
                            data-testid={`checkbox-service-${service.id}`}
                          />
                        </FormControl>
                        <FormLabel className="font-normal cursor-pointer">
                          {service.name}
                        </FormLabel>
                      </FormItem>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
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
                    Maximum distance you're willing to travel for jobs
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="hasOwnTools"
              render={({ field }) => (
                <FormItem className="flex items-center space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox 
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      data-testid="checkbox-own-tools"
                    />
                  </FormControl>
                  <FormLabel className="font-normal cursor-pointer">
                    I have my own professional tools and equipment
                  </FormLabel>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="hasOwnVehicle"
              render={({ field }) => (
                <FormItem className="flex items-center space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox 
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      data-testid="checkbox-own-vehicle"
                    />
                  </FormControl>
                  <FormLabel className="font-normal cursor-pointer">
                    I have my own service vehicle
                  </FormLabel>
                </FormItem>
              )}
            />

            {form.watch("hasOwnVehicle") && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-8">
                <FormField
                  control={form.control}
                  name="vehicleInfo.make"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vehicle Make</FormLabel>
                      <FormControl>
                        <Input placeholder="Ford" {...field} data-testid="input-vehicle-make" />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="vehicleInfo.model"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vehicle Model</FormLabel>
                      <FormControl>
                        <Input placeholder="F-350" {...field} data-testid="input-vehicle-model" />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="vehicleInfo.year"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vehicle Year</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="2020" 
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                          data-testid="input-vehicle-year"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="vehicleInfo.type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vehicle Type</FormLabel>
                      <FormControl>
                        <Input placeholder="Service Truck" {...field} data-testid="input-vehicle-type" />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            )}
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                All documents must be clear, legible, and in PDF, JPG, or PNG format.
                Maximum file size is 5MB per document.
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <h3 className="font-semibold">Required Documents</h3>
              {REQUIRED_DOCUMENTS.map((doc) => (
                <div key={doc.type} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <label className="font-medium">{doc.label}</label>
                      <p className="text-sm text-muted-foreground">
                        Accepted formats: {doc.accept}
                      </p>
                      <input
                        type="file"
                        accept={doc.accept}
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            handleDocumentUpload(doc.type, e.target.files[0]);
                          }
                        }}
                        className="mt-2"
                        data-testid={`file-input-${doc.type}`}
                      />
                    </div>
                    {uploadedDocuments.some(d => d.type === doc.type) && (
                      <Badge className="ml-4">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Uploaded
                      </Badge>
                    )}
                  </div>
                  
                  {doc.type === "cdl" || doc.type === "dot_medical" ? (
                    <div className="mt-3">
                      <label className="text-sm">Expiration Date</label>
                      <Input 
                        type="date" 
                        className="w-48 mt-1"
                        onChange={(e) => {
                          const existingDoc = uploadedDocuments.find(d => d.type === doc.type);
                          if (existingDoc) {
                            existingDoc.expirationDate = e.target.value;
                            setUploadedDocuments([...uploadedDocuments]);
                          }
                        }}
                        data-testid={`date-expiry-${doc.type}`}
                      />
                    </div>
                  ) : null}
                </div>
              ))}
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold">Optional Documents</h3>
              {OPTIONAL_DOCUMENTS.map((doc) => (
                <div key={doc.type} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <label className="font-medium">{doc.label}</label>
                      <p className="text-sm text-muted-foreground">
                        Accepted formats: {doc.accept}
                      </p>
                      <input
                        type="file"
                        accept={doc.accept}
                        multiple={doc.type === "portfolio_photo"}
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            handleDocumentUpload(doc.type, e.target.files[0]);
                          }
                        }}
                        className="mt-2"
                        data-testid={`file-input-optional-${doc.type}`}
                      />
                    </div>
                    {uploadedDocuments.some(d => d.type === doc.type) && (
                      <Badge variant="secondary">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Uploaded
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {uploadedDocuments.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-semibold">Uploaded Documents</h3>
                <div className="space-y-2">
                  {uploadedDocuments.map((doc, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                      <span className="text-sm">{doc.file.name}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeDocument(index)}
                        data-testid={`button-remove-doc-${index}`}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      case 6:
        return (
          <div className="space-y-6">
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                Please review all information carefully before submitting your application.
                By submitting, you certify that all information provided is accurate and truthful.
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <h3 className="font-semibold">References</h3>
              <p className="text-sm text-muted-foreground">
                Please provide at least 2 professional references who can verify your work experience.
              </p>
              
              {[0, 1].map((index) => (
                <div key={index} className="border rounded-lg p-4 space-y-4">
                  <h4 className="font-medium">Reference {index + 1}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name={`references.${index}.name`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Jane Smith" {...field} data-testid={`input-ref-name-${index}`} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`references.${index}.company`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Company</FormLabel>
                          <FormControl>
                            <Input placeholder="ABC Transport" {...field} data-testid={`input-ref-company-${index}`} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`references.${index}.phone`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone</FormLabel>
                          <FormControl>
                            <Input placeholder="5551234567" {...field} data-testid={`input-ref-phone-${index}`} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`references.${index}.email`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="jane@example.com" {...field} data-testid={`input-ref-email-${index}`} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              ))}
            </div>

            <Separator />

            <div className="space-y-4">
              <h3 className="font-semibold">Terms and Consent</h3>
              
              <FormField
                control={form.control}
                name="backgroundCheckConsent"
                render={({ field }) => (
                  <FormItem className="flex items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox 
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-testid="checkbox-background-consent"
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="cursor-pointer">
                        Background Check Consent
                      </FormLabel>
                      <FormDescription>
                        I consent to a comprehensive background check including criminal history, 
                        driving record, and employment verification.
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="termsAccepted"
                render={({ field }) => (
                  <FormItem className="flex items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox 
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-testid="checkbox-terms"
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="cursor-pointer">
                        Terms and Conditions
                      </FormLabel>
                      <FormDescription>
                        I have read and agree to the TruckFixGo Contractor Terms of Service and Privacy Policy.
                        I understand that providing false information may result in immediate rejection or termination.
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
        <div className="container flex h-16 items-center">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-bold">TruckFixGo Contractor Application</h1>
          </div>
          <div className="ml-auto flex items-center space-x-4">
            <Button 
              variant="outline" 
              onClick={() => saveDraftMutation.mutate(formData)}
              disabled={saveDraftMutation.isPending}
              data-testid="button-save-draft"
            >
              Save Draft
            </Button>
            <Button 
              variant="ghost"
              onClick={() => navigate("/")}
              data-testid="button-exit"
            >
              Exit
            </Button>
          </div>
        </div>
      </header>

      <main className="container max-w-4xl mx-auto py-8">
        {/* Progress Bar */}
        <div className="mb-8">
          <Progress value={(currentStep / 6) * 100} className="h-2" />
          <div className="flex justify-between mt-4">
            {FORM_STEPS.map((step) => (
              <div 
                key={step.id}
                className={`flex flex-col items-center ${
                  step.id <= currentStep ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                <div 
                  className={`rounded-full p-2 ${
                    step.id < currentStep 
                      ? 'bg-primary text-primary-foreground' 
                      : step.id === currentStep
                      ? 'bg-primary/20 text-primary'
                      : 'bg-muted'
                  }`}
                >
                  {step.id < currentStep ? (
                    <CheckCircle className="h-6 w-6" />
                  ) : (
                    <step.icon className="h-6 w-6" />
                  )}
                </div>
                <span className="text-xs mt-1 hidden md:block">{step.title}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Form Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {(() => {
                const StepIcon = FORM_STEPS[currentStep - 1].icon;
                return StepIcon ? <StepIcon className="h-6 w-6" /> : null;
              })()}
              {FORM_STEPS[currentStep - 1].title}
            </CardTitle>
            <CardDescription>
              {FORM_STEPS[currentStep - 1].description}
            </CardDescription>
          </CardHeader>

          <CardContent>
            <Form {...form}>
              <form onSubmit={(e) => e.preventDefault()}>
                {renderStepContent()}
              </form>
            </Form>
          </CardContent>

          <CardFooter className="flex justify-between">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 1}
              data-testid="button-previous"
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>
            
            <Button
              onClick={handleNext}
              disabled={isSubmitting}
              data-testid="button-next"
            >
              {currentStep === 6 ? (
                isSubmitting ? (
                  <>Submitting...</>
                ) : (
                  <>Submit Application</>
                )
              ) : (
                <>
                  Next
                  <ChevronRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </main>
    </div>
  );
}