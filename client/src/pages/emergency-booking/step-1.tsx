import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Phone, Mail, User } from "lucide-react";
import type { EmergencyBookingData } from "@/types/emergency";
import LocationInput, { LocationData } from "@/components/location-input";

const formSchema = z.object({
  name: z.string()
    .min(2, "Name is required")
    .max(100, "Name must be less than 100 characters"),
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
  const [location, setLocation] = useState<LocationData | undefined>(
    initialData.location
      ? {
          lat: initialData.location.lat,
          lng: initialData.location.lng,
          address: initialData.location.address || initialData.manualLocation || "",
          formattedAddress: initialData.location.address
        }
      : undefined
  );
  const [locationError, setLocationError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialData.name || "",
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
    if (!location) {
      setLocationError("Share your location so dispatch can find you.");
      return;
    }

    onComplete({
      name: values.name,
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
      <header className="text-center space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-destructive">Step 1</p>
        <h1 className="text-3xl sm:text-4xl font-bold text-foreground">
          Share your location & contact info
        </h1>
        <p className="text-muted-foreground text-base sm:text-lg">
          We use this to dispatch a certified mechanic in under 15 minutes.
        </p>
      </header>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <section aria-labelledby="emergency-location">
            <Card className="border-2" id="emergency-location">
              <CardContent className="p-6 space-y-6">
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-destructive">Location</p>
                  <p className="text-sm text-muted-foreground">
                    GPS, mile marker, or street address - we just need enough information to find you quickly.
                  </p>
                </div>
                <LocationInput 
                  value={location}
                  onChange={(value) => {
                    setLocation(value ?? undefined);
                    setLocationError(null);
                  }}
                  defaultMode="gps"
                  placeholder="Enter your location or highway/mile marker"
                  error={locationError || undefined}
                />
              </CardContent>
            </Card>
          </section>

          <section aria-labelledby="emergency-contact">
            <Card className="border-2" id="emergency-contact">
              <CardContent className="p-6 space-y-4">
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-destructive">Contact & unit owner</p>
                  <p className="text-sm text-muted-foreground">
                    We send SMS + email updates with ETA, mechanic details, and invoices.
                  </p>
                </div>

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-medium flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Your Name (Required)
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        id="name-input"
                        type="text"
                        placeholder="John Smith"
                        className="h-14 text-base"
                        data-testid="input-name"
                        autoComplete="name"
                      />
                    </FormControl>
                    <FormMessage />
                    <p className="text-sm text-muted-foreground mt-2">
                      We'll use this name for your service records
                    </p>
                  </FormItem>
                )}
              />

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
          </section>

          <Button
            type="submit"
            size="lg"
            variant="destructive"
            className="w-full h-16 text-lg font-semibold hover-elevate disabled:opacity-60"
            disabled={!location}
            data-testid="button-next-step1"
          >
            Continue to issue details
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
