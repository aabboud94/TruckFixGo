import { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, Marker, Circle, useMapEvents } from "react-leaflet";
import L from "leaflet";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MapPin, Save, RefreshCw, Info, Navigation } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Fix Leaflet icon issue
import "leaflet/dist/leaflet.css";
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

interface ServiceAreaMapProps {
  initialLat?: number;
  initialLng?: number;
  initialRadius?: number;
  onSave?: (lat: number, lng: number, radius: number) => void;
  isLoading?: boolean;
}

// Component to handle map clicks
function LocationSelector({ 
  onLocationSelect 
}: { 
  onLocationSelect: (lat: number, lng: number) => void 
}) {
  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

// Convert miles to meters (for Leaflet circle)
const milesToMeters = (miles: number) => miles * 1609.34;

// Convert meters to miles (for display)
const metersToMiles = (meters: number) => meters / 1609.34;

export default function ServiceAreaMap({
  initialLat = 39.8283, // Default to USA center
  initialLng = -98.5795,
  initialRadius = 25, // Default 25 miles
  onSave,
  isLoading = false
}: ServiceAreaMapProps) {
  const { toast } = useToast();
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  
  const [baseLocation, setBaseLocation] = useState({
    lat: initialLat,
    lng: initialLng
  });
  const [radius, setRadius] = useState(initialRadius);
  const [isDragging, setIsDragging] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Get user's current location
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: "Geolocation not supported",
        description: "Your browser doesn't support geolocation.",
        variant: "destructive"
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setBaseLocation({ lat: latitude, lng: longitude });
        setHasChanges(true);
        
        // Center map on new location
        if (mapRef.current) {
          mapRef.current.setView([latitude, longitude], 10);
        }
        
        toast({
          title: "Location updated",
          description: "Base location set to your current position.",
        });
      },
      (error) => {
        toast({
          title: "Location error",
          description: "Unable to get your current location.",
          variant: "destructive"
        });
      }
    );
  };

  // Handle location click on map
  const handleLocationSelect = (lat: number, lng: number) => {
    setBaseLocation({ lat, lng });
    setHasChanges(true);
  };

  // Handle radius slider change
  const handleRadiusChange = (value: number[]) => {
    setRadius(value[0]);
    setHasChanges(true);
  };

  // Handle radius input change
  const handleRadiusInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value) && value >= 1 && value <= 200) {
      setRadius(value);
      setHasChanges(true);
    }
  };

  // Handle marker drag
  const handleMarkerDragEnd = (e: L.DragEndEvent) => {
    const marker = e.target;
    const position = marker.getLatLng();
    setBaseLocation({ lat: position.lat, lng: position.lng });
    setHasChanges(true);
    setIsDragging(false);
  };

  // Save service area
  const handleSave = () => {
    if (onSave) {
      onSave(baseLocation.lat, baseLocation.lng, radius);
      setHasChanges(false);
    }
  };

  // Reset to initial values
  const handleReset = () => {
    setBaseLocation({ lat: initialLat, lng: initialLng });
    setRadius(initialRadius);
    setHasChanges(false);
    
    if (mapRef.current) {
      mapRef.current.setView([initialLat, initialLng], 8);
    }
  };

  // Calculate approximate area coverage
  const calculateAreaCoverage = () => {
    const area = Math.PI * radius * radius;
    return area.toFixed(0);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Service Area Configuration
          </CardTitle>
          <CardDescription>
            Click on the map or drag the marker to set your base location. Adjust the radius slider to define your service area.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Map Container */}
          <div className="relative h-[400px] w-full rounded-lg overflow-hidden border">
            <MapContainer
              center={[baseLocation.lat, baseLocation.lng]}
              zoom={8}
              className="h-full w-full"
              ref={mapRef}
              scrollWheelZoom={true}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              
              {/* Click handler for location selection */}
              <LocationSelector onLocationSelect={handleLocationSelect} />
              
              {/* Draggable marker for base location */}
              <Marker
                position={[baseLocation.lat, baseLocation.lng]}
                draggable={true}
                eventHandlers={{
                  dragstart: () => setIsDragging(true),
                  dragend: handleMarkerDragEnd,
                }}
                ref={markerRef}
              />
              
              {/* Service area circle */}
              <Circle
                center={[baseLocation.lat, baseLocation.lng]}
                radius={milesToMeters(radius)}
                pathOptions={{
                  fillColor: "#3b82f6",
                  fillOpacity: 0.15,
                  color: "#3b82f6",
                  weight: 2,
                  opacity: 0.8
                }}
              />
            </MapContainer>
            
            {/* Map overlay info */}
            {isDragging && (
              <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-[1000]">
                <Badge variant="secondary" className="shadow-lg">
                  Drop marker to set location
                </Badge>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* Radius Control */}
            <div className="space-y-2">
              <Label htmlFor="radius-slider">Service Radius</Label>
              <div className="flex items-center gap-3">
                <Slider
                  id="radius-slider"
                  min={1}
                  max={200}
                  step={1}
                  value={[radius]}
                  onValueChange={handleRadiusChange}
                  className="flex-1"
                  data-testid="slider-service-radius"
                />
                <div className="flex items-center gap-1 min-w-[100px]">
                  <Input
                    type="number"
                    min={1}
                    max={200}
                    value={radius}
                    onChange={handleRadiusInputChange}
                    className="w-20"
                    data-testid="input-radius-miles"
                  />
                  <span className="text-sm text-muted-foreground">miles</span>
                </div>
              </div>
            </div>

            {/* Location Info */}
            <div className="space-y-2">
              <Label>Base Location Coordinates</Label>
              <div className="flex gap-2">
                <Input
                  value={baseLocation.lat.toFixed(6)}
                  readOnly
                  className="font-mono text-sm"
                  data-testid="input-latitude"
                />
                <Input
                  value={baseLocation.lng.toFixed(6)}
                  readOnly
                  className="font-mono text-sm"
                  data-testid="input-longitude"
                />
              </div>
            </div>
          </div>

          {/* Info Alert */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Your service area covers approximately <strong>{calculateAreaCoverage()} square miles</strong>. 
              Jobs within this area will be prioritized for you.
            </AlertDescription>
          </Alert>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2 justify-between">
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={getCurrentLocation}
                data-testid="button-current-location"
              >
                <Navigation className="h-4 w-4 mr-1" />
                Use Current Location
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
                disabled={!hasChanges}
                data-testid="button-reset"
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Reset
              </Button>
            </div>
            <Button
              onClick={handleSave}
              disabled={!hasChanges || isLoading}
              data-testid="button-save-service-area"
            >
              <Save className="h-4 w-4 mr-1" />
              {isLoading ? "Saving..." : "Save Service Area"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}