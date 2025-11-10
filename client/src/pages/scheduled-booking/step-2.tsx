import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { MapPin, Truck } from "lucide-react";
import type { FleetVehicle } from "@shared/schema";

const formSchema = z.object({
  vehicleId: z.string().optional(),
  vin: z.string().max(17).optional(),
  unitNumber: z.string().max(50).optional(),
  vehicleMake: z.string().min(1, "Vehicle make is required").max(50),
  vehicleModel: z.string().min(1, "Vehicle model is required").max(50),
  vehicleYear: z.string().regex(/^\d{4}$/, "Must be a valid year").optional(),
  locationAddress: z.string().min(1, "Location address is required").max(500),
  locationNotes: z.string().max(500).optional(),
  description: z.string().min(1, "Please describe the service needed").max(1000),
});

type FormData = z.infer<typeof formSchema>;

interface Step2Props {
  onNext: (data: {
    vehicleId?: string;
    vin?: string;
    unitNumber?: string;
    vehicleMake: string;
    vehicleModel: string;
    vehicleYear?: string;
    location: { lat: number; lng: number };
    locationAddress: string;
    locationNotes?: string;
    description: string;
  }) => void;
  onBack: () => void;
  initialData?: Partial<FormData> & {
    location?: { lat: number; lng: number };
  };
  fleetAccountId?: string;
}

export default function Step2VehicleLocation({ onNext, onBack, initialData, fleetAccountId }: Step2Props) {
  const [location, setLocation] = useState(initialData?.location || { lat: 0, lng: 0 });
  const [detectingLocation, setDetectingLocation] = useState(false);
  
  // Fetch fleet vehicles if user has fleet account
  const { data: fleetVehicles } = useQuery<FleetVehicle[]>({
    queryKey: ["/api/fleet/vehicles"],
    enabled: !!fleetAccountId,
  });
  
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      vehicleId: initialData?.vehicleId || "",
      vin: initialData?.vin || "",
      unitNumber: initialData?.unitNumber || "",
      vehicleMake: initialData?.vehicleMake || "",
      vehicleModel: initialData?.vehicleModel || "",
      vehicleYear: initialData?.vehicleYear || "",
      locationAddress: initialData?.locationAddress || "",
      locationNotes: initialData?.locationNotes || "",
      description: initialData?.description || "",
    },
  });
  
  // Auto-fill vehicle details when fleet vehicle is selected
  const handleVehicleSelect = (vehicleId: string) => {
    const vehicle = fleetVehicles?.find((v) => v.id === vehicleId);
    if (vehicle) {
      form.setValue("vehicleId", vehicle.id);
      form.setValue("vin", vehicle.vin || "");
      form.setValue("unitNumber", vehicle.unitNumber || "");
      form.setValue("vehicleMake", vehicle.make || "");
      form.setValue("vehicleModel", vehicle.model || "");
      form.setValue("vehicleYear", vehicle.year ? vehicle.year.toString() : "");
    }
  };
  
  // Detect current location
  const detectCurrentLocation = () => {
    setDetectingLocation(true);
    
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          setLocation({ lat: latitude, lng: longitude });
          
          // Reverse geocode to get address
          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
            );
            const data = await response.json();
            if (data.display_name) {
              form.setValue("locationAddress", data.display_name);
            }
          } catch (error) {
            console.error("Failed to get address:", error);
          }
          
          setDetectingLocation(false);
        },
        (error) => {
          toast({
            title: "Location Error",
            description: "Could not detect your location. Please enter manually.",
            variant: "destructive",
          });
          setDetectingLocation(false);
        }
      );
    } else {
      toast({
        title: "Location Not Supported",
        description: "Your browser doesn't support location detection.",
        variant: "destructive",
      });
      setDetectingLocation(false);
    }
  };
  
  const onSubmit = (data: FormData) => {
    if (location.lat === 0 && location.lng === 0) {
      toast({
        title: "Location Required",
        description: "Please detect your location or enter an address",
        variant: "destructive",
      });
      return;
    }
    
    onNext({
      ...data,
      location,
    });
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Fleet Vehicle Selection */}
        {fleetVehicles && fleetVehicles.length > 0 && (
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Truck className="h-5 w-5" />
                Fleet Vehicle
              </h3>
              <FormField
                control={form.control}
                name="vehicleId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Select Fleet Vehicle</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={(value) => {
                        field.onChange(value);
                        handleVehicleSelect(value);
                      }}
                    >
                      <FormControl>
                        <SelectTrigger data-testid="select-fleet-vehicle">
                          <SelectValue placeholder="Choose a vehicle from your fleet" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">Custom Vehicle</SelectItem>
                        {fleetVehicles.map((vehicle) => (
                          <SelectItem key={vehicle.id} value={vehicle.id}>
                            {vehicle.unitNumber} - {vehicle.make} {vehicle.model} ({vehicle.year})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Select from your fleet or enter custom vehicle details below
                    </FormDescription>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
        )}
        
        {/* Vehicle Details */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Truck className="h-5 w-5" />
              Vehicle Information
            </h3>
            
            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="unitNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unit Number (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="e.g., TRUCK-001"
                          data-testid="input-unit-number"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="vin"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>VIN (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Vehicle Identification Number"
                          maxLength={17}
                          data-testid="input-vin"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="vehicleMake"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Make *</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="e.g., Freightliner"
                          data-testid="input-vehicle-make"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="vehicleModel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Model *</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="e.g., Cascadia"
                          data-testid="input-vehicle-model"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="vehicleYear"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Year</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="e.g., 2023"
                          maxLength={4}
                          data-testid="input-vehicle-year"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Location Details */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Service Location
            </h3>
            
            <div className="space-y-4">
              <Button
                type="button"
                variant="outline"
                onClick={detectCurrentLocation}
                disabled={detectingLocation}
                data-testid="button-detect-location"
              >
                <MapPin className="mr-2 h-4 w-4" />
                {detectingLocation ? "Detecting..." : "Use Current Location"}
              </Button>
              
              <FormField
                control={form.control}
                name="locationAddress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Service Address *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Enter the service location address"
                        data-testid="input-location-address"
                      />
                    </FormControl>
                    <FormDescription>
                      Where should the service be performed?
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="locationNotes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location Notes (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="e.g., Behind the warehouse, near loading dock 3"
                        rows={2}
                        data-testid="textarea-location-notes"
                      />
                    </FormControl>
                    <FormDescription>
                      Any specific instructions for finding the vehicle
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>
        
        {/* Service Description */}
        <Card>
          <CardContent className="p-6">
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Service Description *</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Describe the service you need performed..."
                      rows={4}
                      data-testid="textarea-description"
                    />
                  </FormControl>
                  <FormDescription>
                    Please provide details about the maintenance or repair needed
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>
        
        {/* Action Buttons */}
        <div className="flex justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            data-testid="button-back"
          >
            Back
          </Button>
          <Button type="submit" data-testid="button-next">
            Next: Review & Confirm
          </Button>
        </div>
      </form>
    </Form>
  );
}