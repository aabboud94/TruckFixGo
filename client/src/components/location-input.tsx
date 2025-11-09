import { useState, useEffect } from "react";
import { MapPin, Navigation, Road, Search, Loader2, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface LocationData {
  lat: number;
  lng: number;
  address: string;
  formattedAddress?: string;
  highwayInfo?: {
    highway: string;
    mileMarker: string;
  };
}

interface LocationInputProps {
  value?: LocationData;
  onChange: (location: LocationData | null) => void;
  error?: string;
  disabled?: boolean;
  className?: string;
  defaultMode?: "address" | "highway" | "gps";
  placeholder?: string;
}

// Common US Interstate Highways with sample coordinates
// In production, this would be fetched from a more comprehensive database
const HIGHWAY_DATA = {
  "I-95": { 
    name: "Interstate 95",
    states: ["FL", "GA", "SC", "NC", "VA", "MD", "DE", "NJ", "NY", "CT", "RI", "MA", "NH", "ME"],
    milesTotal: 1924,
    // Sample mile marker coordinates (would be much more detailed in production)
    markers: {
      0: { lat: 25.0512, lng: -80.4383 }, // Miami, FL
      50: { lat: 25.9173, lng: -80.2781 }, // Fort Lauderdale, FL
      100: { lat: 26.7153, lng: -80.0534 }, // West Palm Beach, FL
      200: { lat: 27.9975, lng: -80.6081 }, // Fort Pierce, FL
      300: { lat: 29.1875, lng: -81.0484 }, // Daytona Beach, FL
      500: { lat: 31.5196, lng: -81.6542 }, // Brunswick, GA
      700: { lat: 33.6891, lng: -78.8867 }, // Myrtle Beach, SC
      900: { lat: 36.0726, lng: -79.7920 }, // Greensboro, NC
      1100: { lat: 38.3047, lng: -77.4609 }, // Fredericksburg, VA
      1300: { lat: 39.9526, lng: -75.1652 }, // Philadelphia, PA
      1500: { lat: 41.0534, lng: -73.5387 }, // Stamford, CT
      1700: { lat: 42.3601, lng: -71.0589 }, // Boston, MA
      1900: { lat: 43.6591, lng: -70.2568 }, // Portland, ME
    }
  },
  "I-80": {
    name: "Interstate 80",
    states: ["CA", "NV", "UT", "WY", "NE", "IA", "IL", "IN", "OH", "PA", "NJ"],
    milesTotal: 2900,
    markers: {
      0: { lat: 37.8044, lng: -122.2708 }, // San Francisco, CA
      200: { lat: 39.5296, lng: -119.8138 }, // Reno, NV
      500: { lat: 40.7608, lng: -111.8910 }, // Salt Lake City, UT
      1000: { lat: 41.2565, lng: -95.9345 }, // Omaha, NE
      1500: { lat: 41.8781, lng: -87.6298 }, // Chicago, IL
      2000: { lat: 40.4406, lng: -79.9959 }, // Pittsburgh, PA
      2900: { lat: 40.7357, lng: -74.1724 }, // Newark, NJ
    }
  },
  "I-10": {
    name: "Interstate 10",
    states: ["CA", "AZ", "NM", "TX", "LA", "MS", "AL", "FL"],
    milesTotal: 2460,
    markers: {
      0: { lat: 34.0195, lng: -118.4912 }, // Santa Monica, CA
      200: { lat: 33.4484, lng: -112.0740 }, // Phoenix, AZ
      500: { lat: 31.7619, lng: -106.4850 }, // El Paso, TX
      1000: { lat: 29.7604, lng: -95.3698 }, // Houston, TX
      1500: { lat: 30.4515, lng: -91.1871 }, // Baton Rouge, LA
      2000: { lat: 30.3322, lng: -81.6557 }, // Jacksonville, FL
      2460: { lat: 30.3322, lng: -81.6557 }, // Jacksonville, FL
    }
  },
  "I-40": {
    name: "Interstate 40",
    states: ["CA", "AZ", "NM", "TX", "OK", "AR", "TN", "NC"],
    milesTotal: 2555,
    markers: {
      0: { lat: 34.7465, lng: -117.1817 }, // Barstow, CA
      300: { lat: 35.1983, lng: -111.6513 }, // Flagstaff, AZ
      600: { lat: 35.0844, lng: -106.6504 }, // Albuquerque, NM
      1000: { lat: 35.4676, lng: -97.5164 }, // Oklahoma City, OK
      1500: { lat: 35.1495, lng: -90.0490 }, // Memphis, TN
      2000: { lat: 36.1627, lng: -86.7816 }, // Nashville, TN
      2555: { lat: 35.5951, lng: -77.4013 }, // Wilmington, NC
    }
  }
};

// Mock Google Places suggestions (replace with real API in production)
const mockPlaceSuggestions = [
  { address: "123 Main St, Miami, FL 33101", lat: 25.7617, lng: -80.1918 },
  { address: "456 Oak Ave, Jacksonville, FL 32202", lat: 30.3322, lng: -81.6557 },
  { address: "789 Pine Rd, Orlando, FL 32801", lat: 28.5383, lng: -81.3792 },
  { address: "321 Elm St, Tampa, FL 33602", lat: 27.9506, lng: -82.4572 },
  { address: "654 Maple Dr, Fort Lauderdale, FL 33301", lat: 26.1224, lng: -80.1373 },
];

export default function LocationInput({
  value,
  onChange,
  error,
  disabled = false,
  className = "",
  defaultMode = "address",
  placeholder = "Enter location"
}: LocationInputProps) {
  const [mode, setMode] = useState<"address" | "highway" | "gps">(defaultMode);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [locationError, setLocationError] = useState("");
  
  // Address mode state
  const [addressInput, setAddressInput] = useState("");
  const [addressSuggestions, setAddressSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  // Highway mode state
  const [selectedHighway, setSelectedHighway] = useState("");
  const [mileMarker, setMileMarker] = useState("");
  const [direction, setDirection] = useState<"north" | "south" | "east" | "west">("north");

  // Update input when value changes externally
  useEffect(() => {
    if (value?.address && !addressInput) {
      setAddressInput(value.address);
    }
  }, [value]);

  // Mock address search (replace with real Google Places API)
  const searchAddresses = async (query: string) => {
    if (query.length < 3) {
      setAddressSuggestions([]);
      return;
    }
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Filter mock data based on query
    const filtered = mockPlaceSuggestions.filter(place =>
      place.address.toLowerCase().includes(query.toLowerCase())
    );
    
    setAddressSuggestions(filtered);
    setShowSuggestions(true);
  };

  const handleAddressInputChange = (value: string) => {
    setAddressInput(value);
    searchAddresses(value);
  };

  const selectAddress = (suggestion: any) => {
    setAddressInput(suggestion.address);
    setShowSuggestions(false);
    onChange({
      lat: suggestion.lat,
      lng: suggestion.lng,
      address: suggestion.address,
      formattedAddress: suggestion.address
    });
  };

  // GPS location handling
  const handleGetGPSLocation = () => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser");
      return;
    }

    setIsGettingLocation(true);
    setLocationError("");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        // In production, would reverse geocode to get address
        const address = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
        
        onChange({
          lat: latitude,
          lng: longitude,
          address: address,
          formattedAddress: `GPS Location: ${address}`
        });
        
        setIsGettingLocation(false);
      },
      (error) => {
        console.error("Location error:", error);
        let errorMessage = "Unable to get your location. ";
        
        switch(error.code) {
          case error.PERMISSION_DENIED:
            errorMessage += "Please enable location permissions.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage += "Location information unavailable.";
            break;
          case error.TIMEOUT:
            errorMessage += "Location request timed out.";
            break;
          default:
            errorMessage += "Please try again or enter manually.";
        }
        
        setLocationError(errorMessage);
        setIsGettingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  // Highway/Mile Marker handling
  const handleHighwaySubmit = () => {
    if (!selectedHighway || !mileMarker) {
      setLocationError("Please select a highway and enter a mile marker");
      return;
    }

    const highwayInfo = HIGHWAY_DATA[selectedHighway as keyof typeof HIGHWAY_DATA];
    if (!highwayInfo) {
      setLocationError("Invalid highway selected");
      return;
    }

    const mileNum = parseInt(mileMarker);
    if (isNaN(mileNum) || mileNum < 0 || mileNum > highwayInfo.milesTotal) {
      setLocationError(`Mile marker must be between 0 and ${highwayInfo.milesTotal}`);
      return;
    }

    // Find the closest known mile markers and interpolate
    const markers = Object.entries(highwayInfo.markers)
      .map(([mile, coords]) => ({ mile: parseInt(mile), ...coords }))
      .sort((a, b) => a.mile - b.mile);

    let lowerMarker = markers[0];
    let upperMarker = markers[markers.length - 1];

    for (let i = 0; i < markers.length - 1; i++) {
      if (mileNum >= markers[i].mile && mileNum <= markers[i + 1].mile) {
        lowerMarker = markers[i];
        upperMarker = markers[i + 1];
        break;
      }
    }

    // Linear interpolation between known markers
    const ratio = (mileNum - lowerMarker.mile) / (upperMarker.mile - lowerMarker.mile);
    const lat = lowerMarker.lat + (upperMarker.lat - lowerMarker.lat) * ratio;
    const lng = lowerMarker.lng + (upperMarker.lng - lowerMarker.lng) * ratio;

    const address = `${selectedHighway} Mile ${mileMarker} ${direction.charAt(0).toUpperCase() + direction.slice(1)}bound`;
    
    onChange({
      lat,
      lng,
      address,
      formattedAddress: address,
      highwayInfo: {
        highway: selectedHighway,
        mileMarker: mileMarker
      }
    });

    setLocationError("");
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <Label>Location *</Label>
      
      <Tabs value={mode} onValueChange={(v) => setMode(v as typeof mode)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="address" data-testid="tab-address">
            <Search className="w-4 h-4 mr-2" />
            Address
          </TabsTrigger>
          <TabsTrigger value="highway" data-testid="tab-highway">
            <Road className="w-4 h-4 mr-2" />
            Highway
          </TabsTrigger>
          <TabsTrigger value="gps" data-testid="tab-gps">
            <Navigation className="w-4 h-4 mr-2" />
            GPS
          </TabsTrigger>
        </TabsList>

        <TabsContent value="address" className="space-y-4">
          <div className="relative">
            <Input
              type="text"
              placeholder={placeholder}
              value={addressInput}
              onChange={(e) => handleAddressInputChange(e.target.value)}
              disabled={disabled}
              className="pr-10"
              data-testid="input-address"
            />
            <Search className="absolute right-3 top-3 w-4 h-4 text-muted-foreground" />
            
            {showSuggestions && addressSuggestions.length > 0 && (
              <Card className="absolute z-10 w-full mt-1">
                <CardContent className="p-0">
                  {addressSuggestions.map((suggestion, index) => (
                    <Button
                      key={index}
                      variant="ghost"
                      className="w-full justify-start text-left p-3 rounded-none"
                      onClick={() => selectAddress(suggestion)}
                      data-testid={`suggestion-${index}`}
                    >
                      <MapPin className="w-4 h-4 mr-2 flex-shrink-0" />
                      <span className="truncate">{suggestion.address}</span>
                    </Button>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
          
          {value?.formattedAddress && (
            <Alert>
              <MapPin className="h-4 w-4" />
              <AlertDescription>
                Selected: {value.formattedAddress}
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>

        <TabsContent value="highway" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="highway-select">Highway</Label>
              <Select 
                value={selectedHighway} 
                onValueChange={setSelectedHighway}
                disabled={disabled}
              >
                <SelectTrigger id="highway-select" data-testid="select-highway">
                  <SelectValue placeholder="Select highway" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(HIGHWAY_DATA).map(([key, data]) => (
                    <SelectItem key={key} value={key}>
                      {key} - {data.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="mile-marker">Mile Marker</Label>
              <Input
                id="mile-marker"
                type="number"
                placeholder="e.g., 123"
                value={mileMarker}
                onChange={(e) => setMileMarker(e.target.value)}
                disabled={disabled}
                data-testid="input-mile-marker"
              />
            </div>

            <div>
              <Label htmlFor="direction">Direction</Label>
              <Select 
                value={direction} 
                onValueChange={(v) => setDirection(v as typeof direction)}
                disabled={disabled}
              >
                <SelectTrigger id="direction" data-testid="select-direction">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="north">Northbound</SelectItem>
                  <SelectItem value="south">Southbound</SelectItem>
                  <SelectItem value="east">Eastbound</SelectItem>
                  <SelectItem value="west">Westbound</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button 
            onClick={handleHighwaySubmit}
            disabled={disabled || !selectedHighway || !mileMarker}
            className="w-full"
            data-testid="button-highway-submit"
          >
            <MapPin className="w-4 h-4 mr-2" />
            Set Highway Location
          </Button>

          {value?.highwayInfo && (
            <Alert>
              <Road className="h-4 w-4" />
              <AlertDescription>
                Location set: {value.address}
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>

        <TabsContent value="gps" className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <Navigation className="w-12 h-12 mx-auto text-primary" />
                <div>
                  <h3 className="font-semibold">Share Your Current Location</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Allow location access to automatically detect your position
                  </p>
                </div>
                
                <Button 
                  onClick={handleGetGPSLocation}
                  disabled={disabled || isGettingLocation}
                  size="lg"
                  className="w-full max-w-xs"
                  data-testid="button-get-gps"
                >
                  {isGettingLocation ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Getting Location...
                    </>
                  ) : (
                    <>
                      <MapPin className="w-4 h-4 mr-2" />
                      Get My Location
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {value?.lat && value?.lng && mode === "gps" && (
            <Alert>
              <Navigation className="h-4 w-4" />
              <AlertDescription>
                GPS Location: {value.lat.toFixed(6)}, {value.lng.toFixed(6)}
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>
      </Tabs>

      {(error || locationError) && (
        <Alert variant="destructive">
          <AlertDescription>{error || locationError}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}