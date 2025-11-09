import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Link, useLocation } from "wouter";
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
  FileText, Camera, Award, Car, Truck, Clock
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
  { id: 5, title: "Terms & Submit", icon: FileCheck, description: "Review and accept" }
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

// Helper function to get field names for each step
const getStepFields = (step: number): any => {
  switch (step) {
    case 1:
      return {
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        state: '',
        zip: ''
      };
    case 2:
      return {
        companyName: '',
        businessType: '',
        dotNumber: '',
        mcNumber: '',
        yearsInBusiness: 0,
        insuranceProvider: '',
        insurancePolicyNumber: '',
        insuranceExpiryDate: ''
      };
    case 3:
      return {
        experienceLevel: '',
        totalYearsExperience: 0,
        certifications: [],
        specializations: [],
        previousEmployers: []
      };
    case 4:
      return {
        serviceTypes: [],
        serviceRadius: 50,
        coverageAreas: [],
        hasOwnTools: false,
        hasOwnVehicle: false,
        baseLocation: '',
        vehicleInfo: {
          make: '',
          model: '',
          year: 0,
          type: ''
        }
      };
    case 5:
      return {
        backgroundCheckConsent: false,
        termsAccepted: false,
        references: []
      };
    default:
      return {};
  }
};

export default function ContractorApply() {
  const [currentStep, setCurrentStep] = useState(0); // Start at 0 for landing page
  const [formData, setFormData] = useState<any>({
    // Initialize default values to prevent validation errors
    // Personal info
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    // Business details
    companyName: '',
    businessType: '',
    dotNumber: '',
    mcNumber: '',
    yearsInBusiness: 0,
    insuranceProvider: '',
    insurancePolicyNumber: '',
    insuranceExpiryDate: '',
    // Experience
    experienceLevel: '',
    totalYearsExperience: 0,
    certifications: [],
    specializations: [],
    // Service capabilities
    serviceTypes: [],
    serviceRadius: 50,
    hasOwnTools: false,
    hasOwnVehicle: false,
    baseLocation: '',
    vehicleInfo: {
      make: '',
      model: '',
      year: '',
      type: ''
    },
    // References - proper initialization with empty strings
    references: [
      { name: '', company: '', phone: '', email: '' },
      { name: '', company: '', phone: '', email: '' }
    ],
    backgroundCheckConsent: false,
    termsAccepted: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [applicationId, setApplicationId] = useState<string | null>(null);
  const { toast } = useToast();
  const [_, navigate] = useLocation();

  // Query for service types
  const { data: serviceTypes = [] } = useQuery<ServiceType[]>({
    queryKey: ['/api/service-types']
  });

  // Mutation for starting application
  const startApplicationMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('POST', '/api/contractor/apply/start');
    },
    onSuccess: (response) => {
      setApplicationId(response.id);
      setCurrentStep(1);
      toast({
        title: "Application started",
        description: "Let's begin with your personal information."
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to start application. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Mutation for saving draft
  const saveDraftMutation = useMutation({
    mutationFn: async (data: any) => {
      if (!applicationId) {
        return; // Don't save draft if no application started
      }
      return apiRequest('PUT', `/api/contractor/apply/${applicationId}`, data);
    },
    onSuccess: () => {
      toast({
        title: "Draft saved",
        description: "Your application progress has been saved."
      });
    }
  });

  // Mutation for submitting application
  const submitApplicationMutation = useMutation({
    mutationFn: async (data: any) => {
      if (!applicationId) {
        throw new Error('No application ID found');
      }
      
      // First update the application with all form data
      await apiRequest('PUT', `/api/contractor/apply/${applicationId}`, data);
      
      // Then submit the application
      return apiRequest('POST', `/api/contractor/apply/${applicationId}/submit`);
    },
    onSuccess: () => {
      toast({
        title: "Application submitted!",
        description: "Check your email for login credentials. We'll review your application within 24-48 hours."
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
      case 5: return termsSchema;
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
      if (applicationId && Object.keys(formData).length > 0) {
        saveDraftMutation.mutate(formData);
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [formData, applicationId]);

  const handleNext = async () => {
    const isValid = await form.trigger();
    
    if (!isValid) {
      const errors = form.formState.errors;
      console.log('Form validation errors:', errors);
      
      // Show specific validation error in toast
      if (errors.serviceTypes) {
        toast({
          title: "Validation Error",
          description: errors.serviceTypes.message || "Please select at least one service type",
          variant: "destructive"
        });
      }
      return;
    }
    
    // Get ALL form values before any reset
    const stepData = form.getValues();
    console.log(`Step ${currentStep} form values:`, stepData);
    
    // Merge with existing formData
    const newFormData = { ...formData, ...stepData };
    console.log(`Merged formData:`, newFormData);
    
    // Update state immediately
    setFormData(newFormData);
    
    // Save draft with merged data
    if (applicationId) {
      console.log('Saving draft with data:', newFormData);
      saveDraftMutation.mutate(newFormData);
    }
    
    if (currentStep < 5) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      
      // Reset form with ALL accumulated data plus defaults for the next step
      const nextStepFields = getStepFields(nextStep);
      // Start with all accumulated data to preserve fields from previous steps
      const nextStepData = {
        ...newFormData, // Include ALL accumulated data
        // Add defaults only for fields that don't have values yet
        ...Object.keys(nextStepFields).reduce((acc: any, key) => {
          if (!(key in newFormData)) {
            acc[key] = nextStepFields[key];
          }
          return acc;
        }, {})
      };
      
      // Use setTimeout to ensure state updates have completed
      setTimeout(() => {
        form.reset(nextStepData);
      }, 0);
    } else {
      // Submit the application with the merged data including step 5 fields
      handleSubmit(newFormData);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      const prevStep = currentStep - 1;
      setCurrentStep(prevStep);
      
      // Reset form with ALL accumulated data plus defaults for the previous step
      const prevStepFields = getStepFields(prevStep);
      // Start with all accumulated data to preserve fields from all steps
      const prevStepData = {
        ...formData, // Include ALL accumulated data
        // Add defaults only for fields that don't have values yet
        ...Object.keys(prevStepFields).reduce((acc: any, key) => {
          if (!(key in formData)) {
            acc[key] = prevStepFields[key];
          }
          return acc;
        }, {})
      };
      form.reset(prevStepData);
    }
  };

  const handleSubmit = async (dataToSubmit?: any) => {
    setIsSubmitting(true);
    try {
      // Use provided data or fallback to formData
      await submitApplicationMutation.mutateAsync(dataToSubmit || formData);
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
                      <Input placeholder="John" {...field} data-testid="input-firstName" />
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
                      <Input placeholder="Doe" {...field} data-testid="input-lastName" />
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
                    <Input placeholder="ABC Trucking LLC" {...field} data-testid="input-businessName" />
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
                      inputMode="numeric"
                      pattern="[0-9]*"
                      placeholder="5" 
                      value={field.value ?? ''}
                      onBlur={field.onBlur}
                      name={field.name}
                      onChange={(e) => {
                        const value = e.target.value;
                        field.onChange(value === '' ? undefined : Number(value));
                      }}
                      className="touch-manipulation"
                      data-testid="input-yearsExperience"
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
                      inputMode="numeric"
                      pattern="[0-9]*"
                      placeholder="10" 
                      value={field.value ?? ''}
                      onBlur={field.onBlur}
                      name={field.name}
                      onChange={(e) => {
                        const value = e.target.value;
                        field.onChange(value === '' ? undefined : Number(value));
                      }}
                      className="touch-manipulation"
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
                  <div key={cert} className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      id={`cert-${cert.toLowerCase().replace(/\s+/g, '-')}`}
                      className="w-4 h-4 mt-1 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                      checked={(form.getValues("certifications") || []).includes(cert)}
                      onChange={(e) => {
                        const current = form.getValues("certifications") || [];
                        if (e.target.checked) {
                          form.setValue("certifications", [...current, cert]);
                        } else {
                          form.setValue("certifications", current.filter((c: string) => c !== cert));
                        }
                      }}
                      data-testid={`checkbox-cert-${cert.toLowerCase().replace(/\s+/g, '-')}`}
                    />
                    <label 
                      htmlFor={`cert-${cert.toLowerCase().replace(/\s+/g, '-')}`}
                      className="text-sm font-normal cursor-pointer select-none flex-1"
                    >
                      {cert}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <FormLabel>Specializations</FormLabel>
              <div className="space-y-3 mt-2">
                {["Engine Repair", "Transmission", "Brakes", "Electrical Systems", 
                  "HVAC", "Suspension", "Tires", "Preventive Maintenance"].map((spec) => (
                  <div key={spec} className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      id={`spec-${spec.toLowerCase().replace(/\s+/g, '-')}`}
                      className="w-4 h-4 mt-1 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                      checked={(form.getValues("specializations") || []).includes(spec)}
                      onChange={(e) => {
                        const current = form.getValues("specializations") || [];
                        if (e.target.checked) {
                          form.setValue("specializations", [...current, spec]);
                        } else {
                          form.setValue("specializations", current.filter((s: string) => s !== spec));
                        }
                      }}
                      data-testid={`checkbox-spec-${spec.toLowerCase().replace(/\s+/g, '-')}`}
                    />
                    <label 
                      htmlFor={`spec-${spec.toLowerCase().replace(/\s+/g, '-')}`}
                      className="text-sm font-normal cursor-pointer select-none flex-1"
                    >
                      {spec}
                    </label>
                  </div>
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
              render={({ field }) => {
                // Ensure field.value is always an array
                const currentValues = field.value || [];
                return (
                  <FormItem>
                    <FormLabel>Service Types You Can Provide</FormLabel>
                    <FormDescription>Select at least one service type</FormDescription>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                      {serviceTypes.map((service: ServiceType) => (
                        <div key={service.id} className="flex items-start space-x-3">
                          <input
                            type="checkbox"
                            id={`service-${service.id}`}
                            className="w-4 h-4 mt-1 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                            checked={currentValues.includes(service.id)}
                            onChange={(e) => {
                              const updatedValue = e.target.checked
                                ? [...currentValues, service.id]
                                : currentValues.filter((s: string) => s !== service.id);
                              field.onChange(updatedValue);
                              form.setValue("serviceTypes", updatedValue, { shouldValidate: true });
                            }}
                            data-testid={`checkbox-service-${service.id}`}
                          />
                          <label 
                            htmlFor={`service-${service.id}`}
                            className="text-sm font-normal cursor-pointer select-none flex-1"
                          >
                            {service.name}
                          </label>
                        </div>
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                );
              }}
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
                      inputMode="numeric"
                      pattern="[0-9]*"
                      placeholder="50" 
                      value={field.value ?? ''}
                      onBlur={field.onBlur}
                      name={field.name}
                      onChange={(e) => {
                        const value = e.target.value;
                        field.onChange(value === '' ? undefined : Number(value));
                      }}
                      className="touch-manipulation"
                      data-testid="input-serviceRadius"
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
              name="baseLocation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Base Location</FormLabel>
                  <FormControl>
                    <Input placeholder="Houston, TX" {...field} data-testid="input-baseLocation" />
                  </FormControl>
                  <FormDescription>
                    Your primary service area or home base
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="hasOwnTools"
              render={({ field }) => (
                <div className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    id="hasOwnTools"
                    className="w-4 h-4 mt-1 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                    checked={field.value || false}
                    onChange={(e) => {
                      field.onChange(e.target.checked);
                    }}
                    data-testid="checkbox-own-tools"
                  />
                  <label 
                    htmlFor="hasOwnTools"
                    className="text-sm font-normal cursor-pointer select-none flex-1"
                  >
                    I have my own professional tools and equipment
                  </label>
                </div>
              )}
            />

            <FormField
              control={form.control}
              name="hasOwnVehicle"
              render={({ field }) => (
                <div className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    id="hasOwnVehicle"
                    className="w-4 h-4 mt-1 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                    checked={field.value || false}
                    onChange={(e) => {
                      field.onChange(e.target.checked);
                    }}
                    data-testid="checkbox-hasServiceTruck"
                  />
                  <label 
                    htmlFor="hasOwnVehicle"
                    className="text-sm font-normal cursor-pointer select-none flex-1"
                  >
                    I have my own service vehicle
                  </label>
                </div>
              )}
            />

            {(formData.hasOwnVehicle || form.watch("hasOwnVehicle")) && (
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
                          onChange={(e) => {
                            const value = parseInt(e.target.value);
                            field.onChange(isNaN(value) ? 0 : value);
                          }}
                          value={field.value || ''}
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

  // Show landing page if currentStep is 0
  if (currentStep === 0) {
    return (
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b">
          <div className="container mx-auto px-4 py-4">
            <Link to="/" className="flex items-center gap-2">
              <Truck className="h-8 w-8 text-primary" />
              <span className="text-2xl font-bold">TruckFixGo</span>
            </Link>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="text-center space-y-8">
            <div>
              <h1 className="text-4xl font-bold mb-4">Apply to Become a Contractor</h1>
              <p className="text-xl text-muted-foreground">
                Join TruckFixGo's network of certified mobile mechanics
              </p>
            </div>

            <Card className="max-w-2xl mx-auto">
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div className="flex items-start gap-3">
                    <Shield className="h-6 w-6 text-primary mt-1" />
                    <div className="text-left">
                      <h3 className="font-semibold mb-1">Background Verified</h3>
                      <p className="text-sm text-muted-foreground">
                        Comprehensive background and license checks
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Clock className="h-6 w-6 text-primary mt-1" />
                    <div className="text-left">
                      <h3 className="font-semibold mb-1">Quick Process</h3>
                      <p className="text-sm text-muted-foreground">
                        Complete application in 10-15 minutes
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <FileText className="h-6 w-6 text-primary mt-1" />
                    <div className="text-left">
                      <h3 className="font-semibold mb-1">Documents Later</h3>
                      <p className="text-sm text-muted-foreground">
                        Upload documents after creating your account
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <User className="h-6 w-6 text-primary mt-1" />
                    <div className="text-left">
                      <h3 className="font-semibold mb-1">Immediate Access</h3>
                      <p className="text-sm text-muted-foreground">
                        Log in right after application submission
                      </p>
                    </div>
                  </div>
                </div>

                <Button 
                  size="lg" 
                  className="w-full md:w-auto"
                  onClick={() => startApplicationMutation.mutate()}
                  disabled={startApplicationMutation.isPending}
                  data-testid="button-start-application"
                >
                  {startApplicationMutation.isPending ? (
                    <>Starting...</>
                  ) : (
                    <>Start Application</>
                  )}
                </Button>
              </CardContent>
            </Card>

            <div className="text-sm text-muted-foreground">
              <p>By starting your application, you agree to our background check process</p>
              <p className="mt-2">
                Already have an application? <Link to="/contractor/auth" className="text-primary hover:underline">Sign In</Link>
              </p>
            </div>
          </div>
        </main>
      </div>
    );
  }

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
              {currentStep === 5 ? (
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