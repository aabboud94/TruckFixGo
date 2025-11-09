import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import LocationInput, { LocationData } from "@/components/location-input";
import { MapPin, Code, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function TestLocationInput() {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [testResults, setTestResults] = useState<string[]>([]);
  const { toast } = useToast();

  const handleLocationChange = (newLocation: LocationData | null) => {
    setLocation(newLocation);
    
    if (newLocation) {
      const result = `Location set: ${newLocation.formattedAddress || newLocation.address} (${newLocation.lat.toFixed(6)}, ${newLocation.lng.toFixed(6)})`;
      setTestResults(prev => [...prev, result]);
      
      toast({
        title: "Location Updated",
        description: result,
      });
    }
  };

  const testGuestBooking = async () => {
    if (!location) {
      toast({
        title: "Error",
        description: "Please select a location first",
        variant: "destructive"
      });
      return;
    }

    try {
      const response = await fetch('/api/auth/guest-booking', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          guestPhone: '555-0123',
          guestEmail: 'test@example.com',
          jobType: 'emergency',
          serviceTypeId: 'emergency-repair',
          location: location,
          locationAddress: location.formattedAddress || location.address,
          description: 'Testing location input',
          vehicleMake: 'Test Make',
          vehicleModel: 'Test Model',
          urgencyLevel: 5
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        toast({
          title: "Success",
          description: `Job created: ${data.job.jobNumber}`,
        });
        setTestResults(prev => [...prev, `Job created successfully: ${data.job.jobNumber}`]);
      } else {
        toast({
          title: "Error",
          description: data.message,
          variant: "destructive"
        });
        setTestResults(prev => [...prev, `Error: ${data.message}`]);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create test booking",
        variant: "destructive"
      });
      setTestResults(prev => [...prev, `Error: ${error}`]);
    }
  };

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-6 h-6" />
            Location Input Component Test
          </CardTitle>
          <CardDescription>
            Test all three location input modes: Address Search, Highway/Mile Marker, and GPS
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Info Alert */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Testing Instructions</AlertTitle>
            <AlertDescription>
              <ul className="list-disc list-inside space-y-1 mt-2">
                <li><strong>Address Mode:</strong> Type any address to see mock suggestions</li>
                <li><strong>Highway Mode:</strong> Select a highway (I-95, I-80, etc.) and enter a mile marker</li>
                <li><strong>GPS Mode:</strong> Click to get your current location (requires permission)</li>
              </ul>
            </AlertDescription>
          </Alert>

          {/* Location Input Component */}
          <div className="border rounded-lg p-4">
            <LocationInput 
              value={location}
              onChange={handleLocationChange}
              placeholder="Enter location for testing"
            />
          </div>

          {/* Current Location Display */}
          {location && (
            <Card className="bg-muted">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Current Location Data</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 font-mono text-sm">
                  <div className="flex gap-2">
                    <span className="font-semibold">Lat:</span>
                    <span>{location.lat.toFixed(6)}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="font-semibold">Lng:</span>
                    <span>{location.lng.toFixed(6)}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="font-semibold">Address:</span>
                    <span>{location.address}</span>
                  </div>
                  {location.formattedAddress && (
                    <div className="flex gap-2">
                      <span className="font-semibold">Formatted:</span>
                      <span>{location.formattedAddress}</span>
                    </div>
                  )}
                  {location.highwayInfo && (
                    <>
                      <div className="flex gap-2">
                        <span className="font-semibold">Highway:</span>
                        <span>{location.highwayInfo.highway}</span>
                      </div>
                      <div className="flex gap-2">
                        <span className="font-semibold">Mile:</span>
                        <span>{location.highwayInfo.mileMarker}</span>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Test Actions */}
          <div className="flex gap-4">
            <Button 
              onClick={testGuestBooking}
              disabled={!location}
              data-testid="button-test-booking"
            >
              Test Guest Booking API
            </Button>
            <Button 
              variant="outline"
              onClick={() => {
                setLocation(null);
                setTestResults([]);
              }}
              data-testid="button-clear"
            >
              Clear
            </Button>
          </div>

          {/* Test Results */}
          {testResults.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Code className="w-4 h-4" />
                  Test Results
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1 font-mono text-sm">
                  {testResults.map((result, index) => (
                    <div key={index} className="text-muted-foreground">
                      {result}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Example Locations */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Example Test Cases</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div>
                  <strong>Address:</strong> 123 Main St, Miami, FL 33101
                </div>
                <div>
                  <strong>Highway:</strong> I-95 Mile 100 Northbound (West Palm Beach, FL area)
                </div>
                <div>
                  <strong>Highway:</strong> I-80 Mile 1500 Eastbound (Chicago, IL area)
                </div>
                <div>
                  <strong>GPS:</strong> Click "Get My Location" button in GPS tab
                </div>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
}