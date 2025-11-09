import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { MapPin, Loader2, Navigation, Phone, Mail } from "lucide-react";
import { EmergencyBookingData } from "./index";
import LocationInput, { LocationData } from "@/components/location-input";

const formSchema = z.object({
  phone: z.string()
    .min(10, "Phone number is required")
    .regex(/^[\d\s\-\+\(\)]+$/, "Invalid phone number format"),
  email: z.string()
    .email("Please enter a valid email address")
    .min(1, "Email is required"),
});

interface Step1Props {
  initialData: EmergencyBookingData;
  onComplete: (data: Partial<EmergencyBookingData>) => void;
}

export default function Step1({ initialData, onComplete }: Step1Props) {
  const [location, setLocation] = useState<LocationData | null>(
    initialData.location ? {
      lat: initialData.location.lat,
      lng: initialData.location.lng,
      address: initialData.location.address || initialData.manualLocation || "",
      formattedAddress: initialData.location.address
    } : null
  );

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      phone: initialData.phone || "",
      email: initialData.email || "",
    },
  });

  useEffect(() => {
    // Auto-focus phone input on mount
    const phoneInput = document.getElementById("phone-input");
    if (phoneInput) {
      phoneInput.focus();
    }
  }, []);

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    // Validate that we have location
    if (!location) {
      return;
    }

    onComplete({
      phone: values.phone,
      email: values.email,
      location: {
        lat: location.lat,
        lng: location.lng,
        address: location.formattedAddress || location.address
      },
      manualLocation: location.address,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl sm:text-4xl font-bold text-foreground">
          Where Are You?
        </h1>
        <p className="text-muted-foreground text-lg">
          We'll dispatch help to your location immediately
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Location Card */}
          <Card className="border-2">
            <CardContent className="p-6">
              {/* Use the new LocationInput component */}
              <LocationInput 
                value={location}
                onChange={setLocation}
                defaultMode="gps"
                placeholder="Enter your location or highway/mile marker"
              />
            </CardContent>
          </Card>

          {/* Contact Information Card */}
          <Card className="border-2">
            <CardContent className="p-6 space-y-4">
              {/* Phone Number Field */}
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-medium flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      Phone Number (Required)
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        id="phone-input"
                        type="tel"
                        placeholder="(555) 123-4567"
                        className="h-14 text-base"
                        data-testid="input-phone"
                        autoComplete="tel"
                      />
                    </FormControl>
                    <FormMessage />
                    <p className="text-sm text-muted-foreground mt-2">
                      We'll send you updates via SMS
                    </p>
                  </FormItem>
                )}
              />

              {/* Email Field */}
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-medium flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      Email for Updates (Required)
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="email"
                        placeholder="your@email.com"
                        className="h-14 text-base"
                        data-testid="input-customer-email"
                        autoComplete="email"
                      />
                    </FormControl>
                    <FormMessage />
                    <p className="text-sm text-muted-foreground mt-2">
                      We'll send job updates and ETA to this email
                    </p>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Next Button */}
          <Button
            type="submit"
            size="lg"
            variant="destructive"
            className="w-full h-16 text-lg font-semibold hover-elevate"
            data-testid="button-next-step1"
          >
            NEXT →
          </Button>
        </form>
      </Form>

      {/* Emergency Notice */}
      <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
        <p className="text-sm text-center">
          <span className="font-semibold">Emergency Service:</span> A mechanic will be dispatched immediately
        </p>
      </div>
    </div>
  );
}