import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { MapPin, Loader2, Navigation, Phone } from "lucide-react";
import { EmergencyBookingData } from "./index";

const formSchema = z.object({
  phone: z.string()
    .min(10, "Phone number is required")
    .regex(/^[\d\s\-\+\(\)]+$/, "Invalid phone number format"),
  manualLocation: z.string().optional(),
});

interface Step1Props {
  initialData: EmergencyBookingData;
  onComplete: (data: Partial<EmergencyBookingData>) => void;
}

export default function Step1({ initialData, onComplete }: Step1Props) {
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [locationError, setLocationError] = useState("");
  const [location, setLocation] = useState(initialData.location);
  const [locationAddress, setLocationAddress] = useState(initialData.location?.address || "");

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      phone: initialData.phone || "",
      manualLocation: initialData.manualLocation || "",
    },
  });

  useEffect(() => {
    // Auto-focus phone input on mount
    const phoneInput = document.getElementById("phone-input");
    if (phoneInput) {
      phoneInput.focus();
    }
  }, []);

  const handleGetLocation = async () => {
    setIsGettingLocation(true);
    setLocationError("");
    
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser");
      setIsGettingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setLocation({ lat: latitude, lng: longitude });
        
        // Try to get address from coordinates (simplified - in production would use a geocoding API)
        setLocationAddress(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
        
        // Clear manual location if GPS succeeds
        form.setValue("manualLocation", "");
        setIsGettingLocation(false);
      },
      (error) => {
        console.error("Location error:", error);
        setLocationError("Unable to get your location. Please enter it manually.");
        setIsGettingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    // Validate that we have either GPS location or manual location
    if (!location && !values.manualLocation) {
      form.setError("manualLocation", {
        message: "Please provide your location or use GPS"
      });
      return;
    }

    onComplete({
      phone: values.phone,
      location: location,
      manualLocation: values.manualLocation,
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
            <CardContent className="p-6 space-y-4">
              {/* GPS Location Button */}
              <div>
                <Button
                  type="button"
                  onClick={handleGetLocation}
                  disabled={isGettingLocation}
                  size="lg"
                  variant={location ? "outline" : "default"}
                  className="w-full h-16 text-lg font-semibold hover-elevate"
                  data-testid="button-use-location"
                >
                  {isGettingLocation ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Getting Location...
                    </>
                  ) : location ? (
                    <>
                      <MapPin className="w-5 h-5 mr-2 text-green-600" />
                      Location Captured
                    </>
                  ) : (
                    <>
                      <Navigation className="w-5 h-5 mr-2" />
                      Use My Location
                    </>
                  )}
                </Button>
                {locationAddress && (
                  <p className="text-sm text-muted-foreground mt-2">
                    {locationAddress}
                  </p>
                )}
                {locationError && (
                  <p className="text-sm text-destructive mt-2">
                    {locationError}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-4">
                <div className="flex-1 h-px bg-border" />
                <span className="text-sm text-muted-foreground">OR</span>
                <div className="flex-1 h-px bg-border" />
              </div>

              {/* Manual Location Entry */}
              <FormField
                control={form.control}
                name="manualLocation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-medium">Enter Location Manually</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Highway/Mile Marker/City or Address"
                        className="h-14 text-base"
                        disabled={!!location}
                        data-testid="input-manual-location"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Phone Number Card */}
          <Card className="border-2">
            <CardContent className="p-6">
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